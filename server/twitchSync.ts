/**
 * twitchSync.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Twitch API integration for automatic stream status synchronization.
 *
 * Responsibilities:
 *  1. Obtain and cache a Twitch App Access Token (Client Credentials flow).
 *  2. Expose `getTwitchStreamData(logins)` to query live status for a list of
 *     Twitch usernames in a single API call.
 *  3. Run a cron job every 2 minutes that:
 *     a. Reads all streams in the DB that have a Twitch platform and a URL.
 *     b. Extracts the Twitch login from the URL.
 *     c. Calls the Helix /streams endpoint.
 *     d. Updates isLive, viewerCount, and thumbnailUrl in the DB.
 *     e. Marks streams as offline (isLive=false) if Twitch reports them down.
 *
 * Architecture notes:
 *  - Token is cached in memory and refreshed automatically on 401.
 *  - The cron job is started once at server boot via `startTwitchSyncJob()`.
 *  - All DB writes use a single batch update to minimize round-trips.
 */

import { eq, inArray } from "drizzle-orm";
import { streams } from "../drizzle/schema";
import { getDb } from "./db";

// ── Twitch credentials (injected from env) ───────────────────────────────────
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID ?? "";
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET ?? "";
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const TWITCH_STREAMS_URL = "https://api.twitch.tv/helix/streams";

// ── Token cache ──────────────────────────────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAppAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const res = await fetch(TWITCH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    throw new Error(`Twitch token error: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiresAt = now + data.expires_in * 1000;
  return cachedToken;
}

// ── Twitch stream data shape ─────────────────────────────────────────────────
export interface TwitchStreamData {
  login: string;
  isLive: boolean;
  viewerCount: number;
  thumbnailUrl: string | null;
  title: string | null;
  gameName: string | null;
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

/**
 * Queries Twitch Helix /streams for up to 100 logins in one request.
 * Returns a map of login → TwitchStreamData.
 */
export async function getTwitchStreamData(
  logins: string[]
): Promise<Map<string, TwitchStreamData>> {
  const result = new Map<string, TwitchStreamData>();
  if (logins.length === 0) return result;

  // Initialize all as offline
  for (const login of logins) {
    result.set(login, {
      login,
      isLive: false,
      viewerCount: 0,
      thumbnailUrl: null,
      title: null,
      gameName: null,
    });
  }

  const token = await getAppAccessToken();

  // Twitch API allows max 100 logins per request
  const chunks: string[][] = [];
  for (let i = 0; i < logins.length; i += 100) {
    chunks.push(logins.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    const params = new URLSearchParams();
    for (const login of chunk) params.append("user_login", login);
    params.set("first", "100");

    const res = await fetch(`${TWITCH_STREAMS_URL}?${params.toString()}`, {
      headers: {
        "Client-ID": TWITCH_CLIENT_ID,
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      // Token expired — clear cache and retry once
      cachedToken = null;
      const freshToken = await getAppAccessToken();
      const retryRes = await fetch(`${TWITCH_STREAMS_URL}?${params.toString()}`, {
        headers: {
          "Client-ID": TWITCH_CLIENT_ID,
          Authorization: `Bearer ${freshToken}`,
        },
      });
      if (!retryRes.ok) {
        console.error("[twitchSync] Helix API error after token refresh:", retryRes.status);
        continue;
      }
      const retryData = (await retryRes.json()) as { data: TwitchHelixStream[] };
      processHelixResponse(retryData.data, result);
      continue;
    }

    if (!res.ok) {
      console.error("[twitchSync] Helix API error:", res.status, await res.text());
      continue;
    }

    const data = (await res.json()) as { data: TwitchHelixStream[] };
    processHelixResponse(data.data, result);
  }

  return result;
}

interface TwitchHelixStream {
  user_login: string;
  viewer_count: number;
  thumbnail_url: string;
  title: string;
  game_name: string;
}

function processHelixResponse(
  helixStreams: TwitchHelixStream[],
  result: Map<string, TwitchStreamData>
): void {
  for (const s of helixStreams) {
    const login = s.user_login.toLowerCase();
    // Twitch thumbnail URL has {width}x{height} placeholders
    const thumbnail = s.thumbnail_url
      .replace("{width}", "440")
      .replace("{height}", "248");

    result.set(login, {
      login,
      isLive: true,
      viewerCount: s.viewer_count,
      thumbnailUrl: thumbnail,
      title: s.title ?? null,
      gameName: s.game_name ?? null,
    });
  }
}

// ── YouTube API ─────────────────────────────────────────────────────────────
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY ?? "";
const YOUTUBE_CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels";
const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

export interface YouTubeStreamData {
  handle: string;
  channelId: string | null;
  isLive: boolean;
  viewerCount: number;
  thumbnailUrl: string | null;
  title: string | null;
}

/**
 * Extracts the YouTube handle or channel ID from a URL like:
 *   https://youtube.com/@handle
 *   https://www.youtube.com/channel/UCxxxxxx
 *   https://youtube.com/c/channelname
 *   https://youtube.com/user/username
 */
export function extractYouTubeHandle(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("youtube.com")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    // @handle format
    if (parts[0]?.startsWith("@")) return parts[0].slice(1).toLowerCase();
    // /channel/UCxxx, /c/name, /user/name
    if (parts.length >= 2 && ["channel", "c", "user"].includes(parts[0])) return parts[1].toLowerCase();
    return null;
  } catch {
    return null;
  }
}

/**
 * Resolves a YouTube handle/username to a channel ID using the channels API.
 * Returns null if not found.
 */
async function resolveYouTubeChannelId(handle: string): Promise<string | null> {
  // If it already looks like a channel ID (starts with UC and 24 chars)
  if (/^UC[\w-]{22}$/.test(handle)) return handle;

  const params = new URLSearchParams({
    part: "id",
    forHandle: handle.startsWith("@") ? handle : `@${handle}`,
    key: YOUTUBE_API_KEY,
  });

  const res = await fetch(`${YOUTUBE_CHANNELS_URL}?${params.toString()}`);
  if (!res.ok) {
    console.error(`[youtubeSync] channels API error for handle "${handle}": ${res.status}`);
    return null;
  }
  const data = (await res.json()) as { items?: { id: string }[] };
  return data.items?.[0]?.id ?? null;
}

/**
 * Checks if a YouTube channel is currently live using the search API.
 * Returns stream metadata if live, null otherwise.
 */
async function getYouTubeLiveStream(channelId: string): Promise<{
  isLive: boolean;
  viewerCount: number;
  thumbnailUrl: string | null;
  title: string | null;
} | null> {
  const params = new URLSearchParams({
    part: "snippet",
    channelId,
    eventType: "live",
    type: "video",
    key: YOUTUBE_API_KEY,
  });

  const res = await fetch(`${YOUTUBE_SEARCH_URL}?${params.toString()}`);
  if (!res.ok) {
    console.error(`[youtubeSync] search API error for channel "${channelId}": ${res.status}`);
    return null;
  }

  const data = (await res.json()) as {
    items?: {
      id: { videoId: string };
      snippet: {
        title: string;
        thumbnails: { high?: { url: string }; medium?: { url: string } };
      };
    }[];
  };

  if (!data.items || data.items.length === 0) {
    return { isLive: false, viewerCount: 0, thumbnailUrl: null, title: null };
  }

  const item = data.items[0];
  const thumbnail =
    item.snippet.thumbnails.high?.url ??
    item.snippet.thumbnails.medium?.url ??
    null;

  return {
    isLive: true,
    viewerCount: 0, // YouTube search API doesn't return viewer count; requires videos.list with liveStreamingDetails
    thumbnailUrl: thumbnail,
    title: item.snippet.title ?? null,
  };
}

/**
 * Syncs all YouTube streams in the DB with live data from YouTube Data API.
 * Uses the same pattern as syncTwitchStreams.
 */
export async function syncYouTubeStreams(): Promise<void> {
  if (!YOUTUBE_API_KEY) {
    console.warn("[youtubeSync] Missing YOUTUBE_API_KEY — skipping YouTube sync");
    return;
  }

  const db = await getDb();
  if (!db) return;

  // Fetch all streams with platform=youtube
  const ytStreams = await db
    .select()
    .from(streams)
    .where(eq(streams.platform, "youtube"));

  if (ytStreams.length === 0) return;

  console.log(`[youtubeSync] Checking ${ytStreams.length} YouTube stream(s)`);

  for (const stream of ytStreams) {
    if (!stream.url) continue;

    const handle = extractYouTubeHandle(stream.url);
    if (!handle) continue;

    try {
      // Resolve handle to channel ID (cached per run)
      const channelId = await resolveYouTubeChannelId(handle);
      if (!channelId) {
        console.warn(`[youtubeSync] Could not resolve channel ID for handle "${handle}"`);
        continue;
      }

      const liveData = await getYouTubeLiveStream(channelId);
      if (!liveData) continue;

      await db
        .update(streams)
        .set({
          isLive: liveData.isLive,
          viewerCount: liveData.viewerCount,
          ...(liveData.thumbnailUrl ? { thumbnailUrl: liveData.thumbnailUrl } : {}),
          updatedAt: new Date(),
        })
        .where(eq(streams.id, stream.id));

      console.log(
        `[youtubeSync] ${handle}: ${
          liveData.isLive ? `LIVE (${liveData.title})` : "offline"
        }`
      );
    } catch (e) {
      console.error(`[youtubeSync] Error processing handle "${handle}":`, e);
    }
  }
}

// ── Sync job ─────────────────────────────────────────────────────────────────
let syncInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Syncs all Twitch streams in the DB with live data from Twitch API.
 * Called on a schedule and can also be called manually.
 */
export async function syncTwitchStreams(): Promise<void> {
  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    console.warn("[twitchSync] Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET — skipping sync");
    return;
  }

  const db = await getDb();
  if (!db) return;

  // Fetch all streams with platform=twitch
  const twitchStreams = await db
    .select()
    .from(streams)
    .where(eq(streams.platform, "twitch"));

  if (twitchStreams.length === 0) return;

  // Extract logins from URLs
  const loginToId = new Map<string, number>();
  for (const stream of twitchStreams) {
    if (!stream.url) continue;
    const login = extractTwitchLogin(stream.url);
    if (login) loginToId.set(login, stream.id);
  }

  if (loginToId.size === 0) return;

  const logins = Array.from(loginToId.keys());
  console.log(`[twitchSync] Checking ${logins.length} Twitch stream(s): ${logins.join(", ")}`);

  const liveData = await getTwitchStreamData(logins);

  // Batch update each stream
  for (const [login, data] of Array.from(liveData.entries())) {
    const streamId = loginToId.get(login);
    if (!streamId) continue;

    await db
      .update(streams)
      .set({
        isLive: data.isLive,
        viewerCount: data.viewerCount,
        ...(data.thumbnailUrl ? { thumbnailUrl: data.thumbnailUrl } : {}),
        updatedAt: new Date(),
      })
      .where(eq(streams.id, streamId));
  }

  const liveCount = Array.from(liveData.values()).filter((d) => d.isLive).length;
  console.log(`[twitchSync] Sync complete — ${liveCount}/${logins.length} live`);
}

/**
 * Runs both Twitch and YouTube sync in parallel.
 */
async function syncAllStreams(): Promise<void> {
  await Promise.allSettled([
    syncTwitchStreams(),
    syncYouTubeStreams(),
  ]);
}

/**
 * Starts the background sync job that runs every 2 minutes.
 * Syncs both Twitch and YouTube streams.
 * Safe to call multiple times — only one interval is created.
 */
export function startTwitchSyncJob(): void {
  if (syncInterval) return; // already running

  console.log("[streamSync] Starting Twitch + YouTube sync job (every 2 minutes)");

  // Run immediately on startup
  syncAllStreams().catch((e) =>
    console.error("[streamSync] Initial sync error:", e)
  );

  // Then every 2 minutes
  syncInterval = setInterval(() => {
    syncAllStreams().catch((e) =>
      console.error("[streamSync] Sync error:", e)
    );
  }, 2 * 60 * 1000);
}

/**
 * Stops the background sync job (useful for testing or graceful shutdown).
 */
export function stopTwitchSyncJob(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log("[twitchSync] Sync job stopped");
  }
}
