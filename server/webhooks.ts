/**
 * webhooks.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Express route handlers for:
 *  - Twitch EventSub webhooks (stream.online / stream.offline)
 *  - YouTube PubSubHubbub notifications (new video / live start)
 *
 * These routes must be registered BEFORE express.json() middleware so that
 * the raw body is available for signature verification.
 *
 * Usage in index.ts:
 *   import { registerWebhookRoutes } from "../webhooks";
 *   registerWebhookRoutes(app);
 */

import express from "express";
import type { Express, Request, Response } from "express";
import {
  verifyTwitchWebhookSignature,
  handleCreatorWentLive,
  handleCreatorWentOffline,
  extractTwitchLogin,
  syncYouTubeStreams,
} from "./twitchSync";
import { getDb } from "./db";
import { contentCreators, users } from "../drizzle/schema";
import { eq, and, isNotNull } from "drizzle-orm";

const PRODUCTION_DOMAIN = process.env.PRODUCTION_DOMAIN ?? "redlevelcircle.com";

// ── Twitch EventSub ──────────────────────────────────────────────────────────

interface TwitchEventSubPayload {
  subscription: {
    type: string;
    condition: { broadcaster_user_id: string };
  };
  event?: {
    broadcaster_user_id: string;
    broadcaster_user_login: string;
    broadcaster_user_name: string;
    type?: string; // "live" for stream.online
  };
  challenge?: string;
}

interface CreatorRow {
  userId: number;
  twitch: string | null;
  userName: string | null;
  nickname: string | null;
}

async function handleTwitchWebhook(req: Request, res: Response): Promise<void> {
  const messageId = req.headers["twitch-eventsub-message-id"] as string;
  const timestamp = req.headers["twitch-eventsub-message-timestamp"] as string;
  const signature = req.headers["twitch-eventsub-message-signature"] as string;
  const messageType = req.headers["twitch-eventsub-message-type"] as string;

  if (!messageId || !timestamp || !signature) {
    res.status(400).json({ error: "Missing Twitch EventSub headers" });
    return;
  }

  const rawBody = (req as Request & { rawBody?: string }).rawBody ?? JSON.stringify(req.body);

  if (!verifyTwitchWebhookSignature(messageId, timestamp, rawBody, signature)) {
    console.warn("[eventSub] Invalid signature — rejecting webhook");
    res.status(403).json({ error: "Invalid signature" });
    return;
  }

  const payload = req.body as TwitchEventSubPayload;

  // Webhook verification challenge (sent once when subscribing)
  if (messageType === "webhook_callback_verification") {
    if (payload.challenge) {
      res.status(200).send(payload.challenge);
      return;
    }
    res.status(400).json({ error: "Missing challenge" });
    return;
  }

  // Revocation notification
  if (messageType === "revocation") {
    console.warn(`[eventSub] Subscription revoked: ${payload.subscription.type}`);
    res.status(204).send();
    return;
  }

  // Notification
  if (messageType === "notification") {
    const event = payload.event;
    if (!event) { res.status(204).send(); return; }

    const broadcasterId = event.broadcaster_user_id;
    const login = event.broadcaster_user_login?.toLowerCase();

    // Find the creator in our DB by their Twitch handle
    const db = await getDb();
    if (!db) { res.status(204).send(); return; }

    const rows = await db
      .select({
        userId: contentCreators.userId,
        twitch: contentCreators.twitch,
        userName: users.name,
        nickname: users.nickname,
      })
      .from(contentCreators)
      .innerJoin(users, eq(contentCreators.userId, users.id))
      .where(and(eq(contentCreators.status, "approved"), isNotNull(contentCreators.twitch)));

    const creators: CreatorRow[] = rows;

    const creator = creators.find((c: CreatorRow) => {
      if (!c.twitch) return false;
      const creatorLogin = c.twitch.includes("twitch.tv")
        ? extractTwitchLogin(c.twitch)
        : c.twitch.toLowerCase().replace("@", "");
      return creatorLogin === login;
    });

    if (!creator) {
      console.warn(`[eventSub] Received event for unknown creator: ${login} (broadcaster_id=${broadcasterId})`);
      res.status(204).send();
      return;
    }

    const streamerName = creator.nickname ?? creator.userName ?? login;
    const channelUrl = creator.twitch!.includes("twitch.tv")
      ? creator.twitch!
      : `https://twitch.tv/${login}`;

    if (payload.subscription.type === "stream.online") {
      console.log(`[eventSub] ${login} went LIVE (EventSub)`);
      const embedUrl = `https://player.twitch.tv/?channel=${login}&parent=${PRODUCTION_DOMAIN}&autoplay=true&muted=true`;
      await handleCreatorWentLive({
        userId: creator.userId,
        platform: "twitch",
        channelUrl,
        title: `${streamerName} en vivo`,
        game: "Gaming",
        thumbnailUrl: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${login}-440x248.jpg`,
        viewerCount: 0,
        embedUrl,
        streamerName,
      });
    } else if (payload.subscription.type === "stream.offline") {
      console.log(`[eventSub] ${login} went OFFLINE (EventSub)`);
      await handleCreatorWentOffline(creator.userId, "twitch");
    }

    res.status(204).send();
    return;
  }

  res.status(204).send();
}

// ── YouTube PubSubHubbub ─────────────────────────────────────────────────────

async function handleYouTubeWebhookVerification(req: Request, res: Response): Promise<void> {
  const challenge = req.query["hub.challenge"] as string;
  const mode = req.query["hub.mode"] as string;

  if (mode === "subscribe" && challenge) {
    console.log("[pubsub] YouTube PubSubHubbub verification challenge accepted");
    res.status(200).send(challenge);
    return;
  }
  res.status(400).send("Invalid verification request");
}

async function handleYouTubeWebhookNotification(req: Request, res: Response): Promise<void> {
  // PubSubHubbub sends XML Atom feed notifications
  const rawBody = (req as Request & { rawBody?: string }).rawBody ?? "";

  // Extract channel ID and video ID from the XML body
  const channelMatch = rawBody.match(/yt:channelId>(UC[\w-]+)<\/yt:channelId/);
  const videoMatch = rawBody.match(/yt:videoId>([\w-]+)<\/yt:videoId/);

  if (channelMatch && videoMatch) {
    const channelId = channelMatch[1];
    const videoId = videoMatch[1];
    console.log(`[pubsub] YouTube notification: channel=${channelId}, video=${videoId}`);

    // Trigger a targeted YouTube sync
    syncYouTubeStreams().catch((e) => console.error("[pubsub] YouTube sync error:", e));
  }

  res.status(204).send();
}

// ── Route registration ───────────────────────────────────────────────────────

/**
 * Registers webhook routes on the Express app.
 * Must be called BEFORE express.json() so raw body is available.
 */
export function registerWebhookRoutes(app: Express): void {
  // Capture raw body for signature verification
  app.use(
    ["/api/webhooks/twitch", "/api/webhooks/youtube"],
    express.raw({ type: "*/*", limit: "1mb" }),
    (req: Request, _res: Response, next: () => void) => {
      (req as Request & { rawBody?: string }).rawBody = (req.body as Buffer)?.toString("utf8") ?? "";
      // Parse JSON manually for Twitch (needed for payload access)
      if (req.headers["content-type"]?.includes("application/json")) {
        try {
          req.body = JSON.parse((req as Request & { rawBody?: string }).rawBody ?? "{}");
        } catch {
          req.body = {};
        }
      }
      next();
    }
  );

  // Twitch EventSub
  app.post("/api/webhooks/twitch", (req: Request, res: Response) => {
    handleTwitchWebhook(req, res).catch((e) => {
      console.error("[eventSub] Webhook handler error:", e);
      if (!res.headersSent) res.status(500).json({ error: "Internal error" });
    });
  });

  // YouTube PubSubHubbub — GET for verification, POST for notifications
  app.get("/api/webhooks/youtube", (req: Request, res: Response) => {
    handleYouTubeWebhookVerification(req, res).catch((e) => {
      console.error("[pubsub] Verification error:", e);
      if (!res.headersSent) res.status(500).send("Error");
    });
  });

  app.post("/api/webhooks/youtube", (req: Request, res: Response) => {
    handleYouTubeWebhookNotification(req, res).catch((e) => {
      console.error("[pubsub] Notification error:", e);
      if (!res.headersSent) res.status(204).send();
    });
  });

  console.log("[webhooks] Twitch EventSub + YouTube PubSubHubbub routes registered");
}
