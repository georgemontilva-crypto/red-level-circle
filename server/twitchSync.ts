/**
 * twitchSync.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Twitch + YouTube stream synchronization with automatic stream creation.
 *
 * Responsibilities:
 *  1. Obtain and cache a Twitch App Access Token (Client Credentials flow).
 *  2. Poll all approved creators' channels every 30 seconds:
 *     a. If a creator is live on Twitch/YouTube but has NO active stream in DB → auto-create it.
 *     b. If a creator is offline but HAS an active stream in DB → auto-close it.
 *     c. Update viewerCount, thumbnailUrl, title for existing live streams.
 *  3. Expose EventSub webhook handler for real-time Twitch notifications (production).
 *  4. Expose YouTube PubSubHubbub subscription management for real-time YouTube.
 *
 * Architecture:
 *  - Polling (30s): works in development and production, serves as fallback.
 *  - EventSub: real-time, activated when TWITCH_WEBHOOK_SECRET is set.
 *  - PubSubHubbub: real-time YouTube, activated when YOUTUBE_WEBHOOK_CALLBACK is set.
 */

import { and, eq, isNotNull } from "drizzle-orm";
import { contentCreators, streams, users } from "../drizzle/schema";
import { getDb } from "./db";
import { notifyOwner } from "./_core/notification";
import { sseBroadcast } from "./sse";
import crypto from "crypto";

// ── Twitch credentials ───────────────────────────────────────────────────────
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID ?? "";
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET ?? "";
const TWITCH_WEBHOOK_SECRET = process.env.TWITCH_WEBHOOK_SECRET ?? "";
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const TWITCH_STREAMS_URL = "https://api.twitch.tv/helix/streams";
const TWITCH_USERS_URL = "https://api.twitch.tv/helix/users";
const TWITCH_EVENTSUB_URL = "https://api.twitch.tv/helix/eventsub/subscriptions";

// ── YouTube credentials ──────────────────────────────────────────────────────
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY ?? "";
const YOUTUBE_WEBHOOK_CALLBACK = process.env.YOUTUBE_WEBHOOK_CALLBACK ?? "";
const YOUTUBE_CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels";
const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";
const YOUTUBE_PUBSUBHUBBUB_URL = "https://pubsubhubbub.appspot.com/subscribe";

// ── Production domain ────────────────────────────────────────────────────────
const PRODUCTION_DOMAIN = process.env.PRODUCTION_DOMAIN ?? "redlevelcircle.com";

// ── Token cache ──────────────────────────────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAppAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 60_000) return cachedToken;

  const res = await fetch(TWITCH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) throw new Error(`Twitch token error: ${res.status} ${await res.text()}`);

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiresAt = now + data.expires_in * 1000;
  return cachedToken;
}

// ── Twitch stream data shape ─────────────────────────────────────────────────
export interface TwitchStreamData {
  login: string;
  userId?: string;
  isLive: boolean;
  viewerCount: number;
  thumbnailUrl: string | null;
  title: string | null;
  gameName: string | null;
}

interface TwitchHelixStream {
  user_login: string;
  user_id: string;
  viewer_count: number;
  thumbnail_url: string;
  title: string;
  game_name: string;
}

/**
 * Extracts the Twitch login from a URL like:
 *   https://twitch.tv/username
 *   https://www.twitch.tv/username/
 */
export function extractTwitchLogin(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("twitch.tv")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts[0]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

function processHelixResponse(
  helixStreams: TwitchHelixStream[],
  result: Map<string, TwitchStreamData>
): void {
  for (const s of helixStreams) {
    const login = s.user_login.toLowerCase();
    const thumbnail = s.thumbnail_url
      .replace("{width}", "440")
      .replace("{height}", "248");
    result.set(login, {
      login,
      userId: s.user_id,
      isLive: true,
      viewerCount: s.viewer_count,
      thumbnailUrl: thumbnail,
      title: s.title ?? null,
      gameName: s.game_name ?? null,
    });
  }
}

/**
 * Queries Twitch Helix /streams for up to 100 logins in one request.
 */
export async function getTwitchStreamData(
  logins: string[]
): Promise<Map<string, TwitchStreamData>> {
  const result = new Map<string, TwitchStreamData>();
  if (logins.length === 0) return result;

  for (const login of logins) {
    result.set(login, { login, isLive: false, viewerCount: 0, thumbnailUrl: null, title: null, gameName: null });
  }

  const token = await getAppAccessToken();
  const chunks: string[][] = [];
  for (let i = 0; i < logins.length; i += 100) chunks.push(logins.slice(i, i + 100));

  for (const chunk of chunks) {
    const params = new URLSearchParams();
    for (const login of chunk) params.append("user_login", login);
    params.set("first", "100");

    let res = await fetch(`${TWITCH_STREAMS_URL}?${params.toString()}`, {
      headers: { "Client-ID": TWITCH_CLIENT_ID, Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      cachedToken = null;
      const freshToken = await getAppAccessToken();
      res = await fetch(`${TWITCH_STREAMS_URL}?${params.toString()}`, {
        headers: { "Client-ID": TWITCH_CLIENT_ID, Authorization: `Bearer ${freshToken}` },
      });
    }

    if (!res.ok) { console.error("[twitchSync] Helix API error:", res.status); continue; }
    const data = (await res.json()) as { data: TwitchHelixStream[] };
    processHelixResponse(data.data, result);
  }

  return result;
}

/**
 * Resolves a Twitch login to a Twitch user ID (needed for EventSub subscriptions).
 */
export async function getTwitchUserId(login: string): Promise<string | null> {
  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) return null;
  try {
    const token = await getAppAccessToken();
    const res = await fetch(`${TWITCH_USERS_URL}?login=${login}`, {
      headers: { "Client-ID": TWITCH_CLIENT_ID, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { data: { id: string }[] };
    return data.data[0]?.id ?? null;
  } catch {
    return null;
  }
}

// ── YouTube helpers ──────────────────────────────────────────────────────────

export interface YouTubeStreamData {
  handle: string;
  channelId: string | null;
  isLive: boolean;
  viewerCount: number;
  thumbnailUrl: string | null;
  title: string | null;
  videoId: string | null;
}

export function extractYouTubeHandle(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("youtube.com")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts[0]?.startsWith("@")) return parts[0].slice(1).toLowerCase();
    if (parts.length >= 2 && ["channel", "c", "user"].includes(parts[0])) return parts[1].toLowerCase();
    return null;
  } catch {
    return null;
  }
}

// Cache handle → channelId to avoid repeated API calls
const ytChannelIdCache = new Map<string, string>();

async function resolveYouTubeChannelId(handle: string): Promise<string | null> {
  if (/^UC[\w-]{22}$/.test(handle)) return handle;
  const cached = ytChannelIdCache.get(handle);
  if (cached) return cached;

  const params = new URLSearchParams({
    part: "id",
    forHandle: handle.startsWith("@") ? handle : `@${handle}`,
    key: YOUTUBE_API_KEY,
  });

  const res = await fetch(`${YOUTUBE_CHANNELS_URL}?${params.toString()}`);
  if (!res.ok) { console.error(`[youtubeSync] channels API error for "${handle}": ${res.status}`); return null; }
  const data = (await res.json()) as { items?: { id: string }[] };
  const id = data.items?.[0]?.id ?? null;
  if (id) ytChannelIdCache.set(handle, id);
  return id;
}

async function getYouTubeLiveStream(channelId: string): Promise<{
  isLive: boolean;
  viewerCount: number;
  thumbnailUrl: string | null;
  title: string | null;
  videoId: string | null;
}> {
  const params = new URLSearchParams({
    part: "snippet",
    channelId,
    eventType: "live",
    type: "video",
    key: YOUTUBE_API_KEY,
  });

  const res = await fetch(`${YOUTUBE_SEARCH_URL}?${params.toString()}`);
  if (!res.ok) { console.error(`[youtubeSync] search API error for channel "${channelId}": ${res.status}`); return { isLive: false, viewerCount: 0, thumbnailUrl: null, title: null, videoId: null }; }

  const data = (await res.json()) as {
    items?: {
      id: { videoId: string };
      snippet: {
        title: string;
        thumbnails: { maxres?: { url: string }; high?: { url: string }; medium?: { url: string } };
      };
    }[];
  };

  if (!data.items || data.items.length === 0) {
    return { isLive: false, viewerCount: 0, thumbnailUrl: null, title: null, videoId: null };
  }

  const item = data.items[0];
  const thumbnail = item.snippet.thumbnails.maxres?.url ?? item.snippet.thumbnails.high?.url ?? item.snippet.thumbnails.medium?.url ?? null;
  const videoId = item.id.videoId;

  let viewerCount = 0;
  try {
    const vParams = new URLSearchParams({ part: "liveStreamingDetails", id: videoId, key: YOUTUBE_API_KEY });
    const vRes = await fetch(`${YOUTUBE_VIDEOS_URL}?${vParams.toString()}`);
    if (vRes.ok) {
      const vData = (await vRes.json()) as { items?: { liveStreamingDetails?: { concurrentViewers?: string } }[] };
      const viewers = vData.items?.[0]?.liveStreamingDetails?.concurrentViewers;
      if (viewers) viewerCount = parseInt(viewers, 10);
    }
  } catch { /* non-critical */ }

  return { isLive: true, viewerCount, thumbnailUrl: thumbnail, title: item.snippet.title ?? null, videoId };
}

// ── Auto-create / auto-close stream helpers ──────────────────────────────────

/**
 * Called when a creator goes live. Creates a stream in the DB if none exists.
 * Used by both the polling job and the EventSub webhook.
 */
export async function handleCreatorWentLive(opts: {
  userId: number;
  platform: "twitch" | "youtube";
  channelUrl: string;
  title: string;
  game: string;
  thumbnailUrl: string | null;
  viewerCount: number;
  embedUrl?: string;
  streamerName?: string;
  videoId?: string | null;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Check if there's already an active stream for this user
  const existing = await db
    .select({ id: streams.id })
    .from(streams)
    .where(and(eq(streams.userId, opts.userId), eq(streams.isLive, true)))
    .limit(1);

  if (existing.length > 0) {
    // Update existing stream with fresh data
    const updateData: Record<string, unknown> = {
      viewerCount: opts.viewerCount,
      updatedAt: new Date(),
    };
    if (opts.thumbnailUrl) updateData.thumbnailUrl = opts.thumbnailUrl;
    if (opts.title) updateData.title = opts.title;
    if (opts.game) updateData.game = opts.game;
    // Update embedUrl with real videoId for YouTube
    if (opts.embedUrl) updateData.embedUrl = opts.embedUrl;
    await db.update(streams).set(updateData).where(eq(streams.id, existing[0].id));
    // Notify clients of viewer count / metadata update
    sseBroadcast("stream_updated", { streamId: existing[0].id, userId: opts.userId, viewerCount: opts.viewerCount });
    return;
  }

  // Auto-generate embedUrl
  let embedUrl = opts.embedUrl;
  if (!embedUrl) {
    if (opts.platform === "twitch") {
      const login = extractTwitchLogin(opts.channelUrl);
      if (login) embedUrl = `https://player.twitch.tv/?channel=${login}&parent=${PRODUCTION_DOMAIN}&autoplay=true&muted=true`;
    } else if (opts.platform === "youtube" && opts.videoId) {
      embedUrl = `https://www.youtube-nocookie.com/embed/${opts.videoId}?autoplay=1&mute=1`;
    }
  }

  // Create new stream
  const [result] = await db.insert(streams).values({
    userId: opts.userId,
    type: "creator",
    title: opts.title || `${opts.streamerName ?? "Creador"} en vivo`,
    platform: opts.platform,
    url: opts.channelUrl,
    game: opts.game || "Gaming",
    thumbnailUrl: opts.thumbnailUrl ?? undefined,
    streamerName: opts.streamerName,
    embedUrl,
    isLive: true,
    viewerCount: opts.viewerCount,
  }).$returningId();

  console.log(`[streamSync] Auto-created stream #${result.id} for userId=${opts.userId} on ${opts.platform}`);

  // Emit SSE event so connected clients update in real-time
  sseBroadcast("stream_started", { streamId: result.id, userId: opts.userId, platform: opts.platform });

  // Notify platform owner
  notifyOwner({
    title: `🔴 ${opts.streamerName ?? "Creador"} está EN VIVO en ${opts.platform}`,
    content: `**${opts.streamerName ?? "Creador"}** acaba de iniciar una transmisión en ${opts.platform}.\n\n**Título:** ${opts.title}\n**Juego:** ${opts.game}\n**Viewers:** ${opts.viewerCount.toLocaleString()}`,
  }).catch((e) => console.error("[streamSync] notifyOwner error:", e));
}

/**
 * Called when a creator goes offline. Closes the active stream in the DB.
 * Used by both the polling job and the EventSub webhook.
 */
export async function handleCreatorWentOffline(userId: number, platform: "twitch" | "youtube"): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const updated = await db
    .update(streams)
    .set({ isLive: false, updatedAt: new Date() })
    .where(and(eq(streams.userId, userId), eq(streams.isLive, true), eq(streams.platform, platform)));

  if ((updated as unknown as { affectedRows: number }).affectedRows > 0) {
    console.log(`[streamSync] Auto-closed stream for userId=${userId} on ${platform}`);
    sseBroadcast("stream_ended", { userId, platform });
  }
}

// ── Main sync functions ──────────────────────────────────────────────────────

/**
 * Syncs all approved creators' Twitch channels.
 * Auto-creates streams when live, auto-closes when offline.
 */
export async function syncTwitchStreams(): Promise<void> {
  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    console.warn("[twitchSync] Missing credentials — skipping Twitch sync");
    return;
  }

  const db = await getDb();
  if (!db) return;

  // Get all approved creators with a Twitch channel
  const creators = await db
    .select({
      userId: contentCreators.userId,
      twitch: contentCreators.twitch,
      userName: users.name,
      nickname: users.nickname,
    })
    .from(contentCreators)
    .innerJoin(users, eq(contentCreators.userId, users.id))
    .where(and(eq(contentCreators.status, "approved"), isNotNull(contentCreators.twitch)));

  if (creators.length === 0) return;

  // Extract logins from stored URLs or handles
  const loginToCreator = new Map<string, typeof creators[0]>();
  for (const creator of creators) {
    if (!creator.twitch) continue;
    // Support both full URLs and bare handles
    const login = creator.twitch.includes("twitch.tv")
      ? extractTwitchLogin(creator.twitch)
      : creator.twitch.toLowerCase().replace("@", "");
    if (login) loginToCreator.set(login, creator);
  }

  if (loginToCreator.size === 0) return;

  const logins = Array.from(loginToCreator.keys());
  console.log(`[twitchSync] Checking ${logins.length} creator(s): ${logins.join(", ")}`);

  const liveData = await getTwitchStreamData(logins);

  for (const [login, data] of Array.from(liveData.entries())) {
    const creator = loginToCreator.get(login);
    if (!creator) continue;

    const channelUrl = creator.twitch!.includes("twitch.tv")
      ? creator.twitch!
      : `https://twitch.tv/${login}`;

    const streamerName = creator.nickname ?? creator.userName ?? login;

    if (data.isLive) {
      const embedUrl = `https://player.twitch.tv/?channel=${login}&parent=${PRODUCTION_DOMAIN}&autoplay=true&muted=true`;
      await handleCreatorWentLive({
        userId: creator.userId,
        platform: "twitch",
        channelUrl,
        title: data.title ?? `${streamerName} en vivo`,
        game: data.gameName ?? "Gaming",
        thumbnailUrl: data.thumbnailUrl,
        viewerCount: data.viewerCount,
        embedUrl,
        streamerName,
      });
    } else {
      await handleCreatorWentOffline(creator.userId, "twitch");
    }
  }

  const liveCount = Array.from(liveData.values()).filter((d) => d.isLive).length;
  console.log(`[twitchSync] Sync complete — ${liveCount}/${logins.length} live`);
}

/**
 * Syncs all approved creators' YouTube channels.
 */
export async function syncYouTubeStreams(): Promise<void> {
  if (!YOUTUBE_API_KEY) {
    console.warn("[youtubeSync] Missing YOUTUBE_API_KEY — skipping YouTube sync");
    return;
  }

  const db = await getDb();
  if (!db) return;

  const creators = await db
    .select({
      userId: contentCreators.userId,
      youtube: contentCreators.youtube,
      userName: users.name,
      nickname: users.nickname,
    })
    .from(contentCreators)
    .innerJoin(users, eq(contentCreators.userId, users.id))
    .where(and(eq(contentCreators.status, "approved"), isNotNull(contentCreators.youtube)));

  if (creators.length === 0) return;

  console.log(`[youtubeSync] Checking ${creators.length} YouTube creator(s)`);

  for (const creator of creators) {
    if (!creator.youtube) continue;

    const handle = creator.youtube.includes("youtube.com")
      ? extractYouTubeHandle(creator.youtube)
      : creator.youtube.toLowerCase().replace("@", "");

    if (!handle) continue;

    try {
      const channelId = await resolveYouTubeChannelId(handle);
      if (!channelId) { console.warn(`[youtubeSync] Could not resolve channel ID for "${handle}"`); continue; }

      const liveData = await getYouTubeLiveStream(channelId);
      const streamerName = creator.nickname ?? creator.userName ?? handle;
      const channelUrl = creator.youtube!.includes("youtube.com")
        ? creator.youtube!
        : `https://youtube.com/@${handle}`;

      if (liveData.isLive) {
        // Build embedUrl with real videoId
        const embedUrl = liveData.videoId
          ? `https://www.youtube-nocookie.com/embed/${liveData.videoId}?autoplay=1&mute=1`
          : undefined;

        await handleCreatorWentLive({
          userId: creator.userId,
          platform: "youtube",
          channelUrl,
          title: liveData.title ?? `${streamerName} en vivo`,
          game: "Gaming",
          thumbnailUrl: liveData.thumbnailUrl,
          viewerCount: liveData.viewerCount,
          embedUrl,
          streamerName,
          videoId: liveData.videoId,
        });
      } else {
        await handleCreatorWentOffline(creator.userId, "youtube");
      }

      console.log(`[youtubeSync] ${handle}: ${liveData.isLive ? `LIVE (${liveData.viewerCount} viewers)` : "offline"}`);
    } catch (e) {
      console.error(`[youtubeSync] Error processing "${handle}":`, e);
    }
  }
}

// ── Twitch EventSub ──────────────────────────────────────────────────────────

/**
 * Subscribes a Twitch channel to EventSub stream.online and stream.offline events.
 * Call this when a creator is approved.
 * Requires TWITCH_WEBHOOK_SECRET and a public HTTPS callback URL.
 */
export async function subscribeToTwitchEventSub(twitchLogin: string): Promise<void> {
  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET || !TWITCH_WEBHOOK_SECRET) {
    console.warn("[eventSub] Missing credentials — skipping EventSub subscription");
    return;
  }

  const callbackUrl = `https://${PRODUCTION_DOMAIN}/api/webhooks/twitch`;

  const broadcasterId = await getTwitchUserId(twitchLogin);
  if (!broadcasterId) {
    console.warn(`[eventSub] Could not resolve Twitch user ID for "${twitchLogin}"`);
    return;
  }

  const token = await getAppAccessToken();

  for (const type of ["stream.online", "stream.offline"] as const) {
    try {
      const res = await fetch(TWITCH_EVENTSUB_URL, {
        method: "POST",
        headers: {
          "Client-ID": TWITCH_CLIENT_ID,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          version: "1",
          condition: { broadcaster_user_id: broadcasterId },
          transport: {
            method: "webhook",
            callback: callbackUrl,
            secret: TWITCH_WEBHOOK_SECRET,
          },
        }),
      });

      if (res.ok) {
        console.log(`[eventSub] Subscribed to ${type} for ${twitchLogin} (broadcaster_id=${broadcasterId})`);
      } else {
        const err = await res.text();
        // 409 = already subscribed, not an error
        if (res.status !== 409) {
          console.error(`[eventSub] Failed to subscribe to ${type} for ${twitchLogin}: ${res.status} ${err}`);
        }
      }
    } catch (e) {
      console.error(`[eventSub] Error subscribing to ${type} for ${twitchLogin}:`, e);
    }
  }
}

/**
 * Verifies a Twitch EventSub webhook signature.
 * Returns true if the request is authentic.
 */
export function verifyTwitchWebhookSignature(
  messageId: string,
  timestamp: string,
  body: string,
  signature: string
): boolean {
  if (!TWITCH_WEBHOOK_SECRET) return false;
  const hmacMessage = messageId + timestamp + body;
  const expected = "sha256=" + crypto.createHmac("sha256", TWITCH_WEBHOOK_SECRET).update(hmacMessage).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// ── YouTube PubSubHubbub ─────────────────────────────────────────────────────

/**
 * Subscribes a YouTube channel to PubSubHubbub for real-time video notifications.
 * Call this when a creator is approved.
 * Requires YOUTUBE_WEBHOOK_CALLBACK (public HTTPS URL).
 */
export async function subscribeToYouTubePubSub(channelId: string): Promise<void> {
  if (!YOUTUBE_WEBHOOK_CALLBACK) {
    console.warn("[pubsub] Missing YOUTUBE_WEBHOOK_CALLBACK — skipping YouTube PubSub subscription");
    return;
  }

  const topicUrl = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`;

  try {
    const body = new URLSearchParams({
      "hub.mode": "subscribe",
      "hub.topic": topicUrl,
      "hub.callback": `${YOUTUBE_WEBHOOK_CALLBACK}/api/webhooks/youtube`,
      "hub.verify": "async",
      "hub.lease_seconds": "864000", // 10 days
    });

    const res = await fetch(YOUTUBE_PUBSUBHUBBUB_URL, { method: "POST", body });
    if (res.ok || res.status === 202) {
      console.log(`[pubsub] Subscribed to YouTube channel ${channelId}`);
    } else {
      console.error(`[pubsub] Failed to subscribe to YouTube channel ${channelId}: ${res.status}`);
    }
  } catch (e) {
    console.error(`[pubsub] Error subscribing to YouTube channel ${channelId}:`, e);
  }
}

// ── Sync job ─────────────────────────────────────────────────────────────────
let syncInterval: ReturnType<typeof setInterval> | null = null;

async function syncAllStreams(): Promise<void> {
  await Promise.allSettled([syncTwitchStreams(), syncYouTubeStreams()]);
}

/**
 * Starts the background sync job every 30 seconds.
 * Auto-creates and auto-closes streams based on creator activity.
 * Safe to call multiple times — only one interval is created.
 */
export function startTwitchSyncJob(): void {
  if (syncInterval) return;

  console.log("[streamSync] Starting Twitch + YouTube sync job (every 30 seconds)");

  // Run immediately on startup
  syncAllStreams().catch((e) => console.error("[streamSync] Initial sync error:", e));

  // Then every 30 seconds
  syncInterval = setInterval(() => {
    syncAllStreams().catch((e) => console.error("[streamSync] Sync error:", e));
  }, 30_000);
}

export function stopTwitchSyncJob(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log("[streamSync] Sync job stopped");
  }
}
