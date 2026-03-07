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
  syncTwitchStreams,
  normalizeYouTubeField,
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

  // ── Debug endpoint: GET /api/debug/youtube-sync ──────────────────────────
  // Returns a full diagnostic of approved creators, their youtube field,
  // resolved channelId, and current live status from the YouTube API.
  // Protected by a simple secret token to avoid public exposure.
  app.get("/api/debug/youtube-sync", (req: Request, res: Response) => {
    runYouTubeDiagnostic(req, res).catch((e) => {
      console.error("[debug] youtube-sync error:", e);
      if (!res.headersSent) res.status(500).json({ error: String(e) });
    });
  });

  // ── Debug endpoint: GET /api/debug/users ────────────────────────────────
  app.get("/api/debug/users", async (req: Request, res: Response) => {
    const token = (req.query.token as string) ?? "";
    if (token !== (process.env.DEBUG_SECRET ?? "rlc-debug-2025")) {
      res.status(401).json({ error: "Unauthorized" }); return;
    }
    const db = await getDb();
    if (!db) { res.status(503).json({ error: "DB not available" }); return; }
    const allUsers = await db
      .select({ id: users.id, name: users.name, nickname: users.nickname, email: users.email, role: users.role, openId: users.openId, createdAt: users.createdAt })
      .from(users)
      .orderBy(users.id);
    res.json({ count: allUsers.length, users: allUsers });
  });

  // ── Debug endpoint: POST /api/debug/force-sync ───────────────────────────
  // Forces an immediate sync cycle and returns the logs.
  app.post("/api/debug/force-sync", (req: Request, res: Response) => {
    runForcedSync(req, res).catch((e) => {
      console.error("[debug] force-sync error:", e);
      if (!res.headersSent) res.status(500).json({ error: String(e) });
    });
  });
}

// ── Debug handlers ───────────────────────────────────────────────────────────

const DEBUG_SECRET = process.env.DEBUG_SECRET ?? "rlc-debug-2025";

async function runYouTubeDiagnostic(req: Request, res: Response): Promise<void> {
  // Simple token protection
  const token = (req.query.token as string) ?? "";
  if (token !== DEBUG_SECRET) {
    res.status(401).json({ error: "Unauthorized. Add ?token=<DEBUG_SECRET> to the URL." });
    return;
  }

  const db = await getDb();
  if (!db) { res.status(503).json({ error: "DB not available" }); return; }

  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY ?? "";
  const PRODUCTION_DOMAIN = process.env.PRODUCTION_DOMAIN ?? "not set";

  // Get all approved creators
  const creators = await db
    .select({
      userId: contentCreators.userId,
      youtube: contentCreators.youtube,
      twitch: contentCreators.twitch,
      status: contentCreators.status,
      userName: users.name,
      nickname: users.nickname,
    })
    .from(contentCreators)
    .innerJoin(users, eq(contentCreators.userId, users.id))
    .where(eq(contentCreators.status, "approved"));

  const results: Record<string, unknown>[] = [];

  for (const c of creators) {
    const entry: Record<string, unknown> = {
      userId: c.userId,
      name: c.nickname ?? c.userName,
      youtube_raw: c.youtube ?? null,
      twitch_raw: c.twitch ?? null,
    };

    if (c.youtube) {
      const normalized = normalizeYouTubeField(c.youtube);
      entry.youtube_normalized = normalized;

      if (!YOUTUBE_API_KEY) {
        entry.error = "YOUTUBE_API_KEY not set";
      } else if (normalized) {
        // Try to resolve channelId
        const isChannelId = /^UC[\w-]{22}$/.test(normalized);
        if (isChannelId) {
          entry.channelId = normalized;
          entry.channelId_source = "direct (already a channelId)";
        } else {
          // Call YouTube channels API
          const forHandle = normalized.startsWith("@") ? normalized : `@${normalized}`;
          const params = new URLSearchParams({ part: "id,snippet", forHandle, key: YOUTUBE_API_KEY });
          const r = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params}`);
          const d = await r.json() as { items?: { id: string; snippet?: { title: string } }[]; error?: { message: string; code: number } };

          if (d.error) {
            entry.channelId_error = `YouTube API error ${d.error.code}: ${d.error.message}`;
          } else if (d.items && d.items.length > 0) {
            entry.channelId = d.items[0].id;
            entry.channelId_source = "resolved via forHandle";
            entry.channel_title = d.items[0].snippet?.title;

            // Now check if live
            const channelId = d.items[0].id;
            const sParams = new URLSearchParams({ part: "snippet", channelId, eventType: "live", type: "video", key: YOUTUBE_API_KEY });
            const sr = await fetch(`https://www.googleapis.com/youtube/v3/search?${sParams}`);
            const sd = await sr.json() as { items?: { id: { videoId: string }; snippet: { title: string } }[]; error?: { message: string } };

            if (sd.error) {
              entry.live_error = sd.error.message;
            } else if (sd.items && sd.items.length > 0) {
              entry.is_live = true;
              entry.video_id = sd.items[0].id.videoId;
              entry.live_title = sd.items[0].snippet.title;
            } else {
              entry.is_live = false;
              entry.live_note = "No live stream found for this channel right now";
            }
          } else {
            // Try forUsername fallback
            const params2 = new URLSearchParams({ part: "id,snippet", forUsername: normalized, key: YOUTUBE_API_KEY });
            const r2 = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params2}`);
            const d2 = await r2.json() as { items?: { id: string; snippet?: { title: string } }[] };
            if (d2.items && d2.items.length > 0) {
              entry.channelId = d2.items[0].id;
              entry.channelId_source = "resolved via forUsername (legacy channel)";
              entry.channel_title = d2.items[0].snippet?.title;
            } else {
              entry.channelId_error = `Could not resolve channelId for handle "${normalized}" — channel may not exist or handle may be wrong`;
              entry.hint = `The youtube field in DB is "${c.youtube}". Make sure this matches your actual YouTube channel handle.`;
            }
          }
        }
      } else {
        entry.error = `Could not normalize youtube field: "${c.youtube}"`;
      }
    } else {
      entry.youtube_note = "No YouTube channel configured for this creator";
    }

    results.push(entry);
  }

  res.json({
    timestamp: new Date().toISOString(),
    env: {
      YOUTUBE_API_KEY: YOUTUBE_API_KEY ? `set (${YOUTUBE_API_KEY.slice(0, 8)}...)` : "NOT SET ❌",
      PRODUCTION_DOMAIN,
      TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID ? "set ✅" : "NOT SET ❌",
    },
    approved_creators_count: creators.length,
    creators: results,
  });
}

async function runForcedSync(_req: Request, res: Response): Promise<void> {
  const logs: string[] = [];
  const origLog = console.log.bind(console);
  const origWarn = console.warn.bind(console);
  const origError = console.error.bind(console);
  console.log = (...a: unknown[]) => { logs.push("[LOG] " + a.join(" ")); origLog(...a); };
  console.warn = (...a: unknown[]) => { logs.push("[WARN] " + a.join(" ")); origWarn(...a); };
  console.error = (...a: unknown[]) => { logs.push("[ERR] " + a.join(" ")); origError(...a); };
  try {
    await Promise.allSettled([syncTwitchStreams(), syncYouTubeStreams()]);
  } finally {
    console.log = origLog;
    console.warn = origWarn;
    console.error = origError;
  }
  res.json({ timestamp: new Date().toISOString(), logs });
}
