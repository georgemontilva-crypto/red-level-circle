/**
 * Tests for twitchSync.ts
 * Covers: URL parsing, live data processing, and sync logic.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { extractTwitchLogin, getTwitchStreamData } from "./twitchSync";

// ── extractTwitchLogin ────────────────────────────────────────────────────────
describe("extractTwitchLogin", () => {
  it("extracts login from standard Twitch URL", () => {
    expect(extractTwitchLogin("https://twitch.tv/ninja")).toBe("ninja");
  });

  it("extracts login from www subdomain URL", () => {
    expect(extractTwitchLogin("https://www.twitch.tv/shroud")).toBe("shroud");
  });

  it("extracts login from URL with trailing slash", () => {
    expect(extractTwitchLogin("https://twitch.tv/pokimane/")).toBe("pokimane");
  });

  it("returns lowercase login regardless of URL case", () => {
    expect(extractTwitchLogin("https://twitch.tv/NINJA")).toBe("ninja");
  });

  it("returns null for non-Twitch URLs", () => {
    expect(extractTwitchLogin("https://youtube.com/@channel")).toBeNull();
    expect(extractTwitchLogin("https://kick.com/streamer")).toBeNull();
  });

  it("returns null for invalid URLs", () => {
    expect(extractTwitchLogin("not-a-url")).toBeNull();
    expect(extractTwitchLogin("")).toBeNull();
  });

  it("handles URLs with query params", () => {
    expect(extractTwitchLogin("https://twitch.tv/xqc?ref=home")).toBe("xqc");
  });
});

// ── getTwitchStreamData — mock fetch ─────────────────────────────────────────
describe("getTwitchStreamData", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Mock token endpoint
    global.fetch = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      if (url.includes("oauth2/token")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: "mock_token", expires_in: 3600 }),
        });
      }
      if (url.includes("helix/streams")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              data: [
                {
                  user_login: "ninja",
                  viewer_count: 12500,
                  thumbnail_url: "https://static-cdn.jtvnw.net/previews-ttv/live_user_ninja-{width}x{height}.jpg",
                  title: "Playing Fortnite",
                  game_name: "Fortnite",
                },
              ],
            }),
        });
      }
      return Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve("Not found") });
    }) as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("returns live data for a known streamer", async () => {
    const result = await getTwitchStreamData(["ninja", "shroud"]);

    expect(result.get("ninja")).toMatchObject({
      login: "ninja",
      isLive: true,
      viewerCount: 12500,
      gameName: "Fortnite",
    });
  });

  it("marks offline streamers as isLive=false", async () => {
    const result = await getTwitchStreamData(["ninja", "shroud"]);

    // shroud is not in the mock response → should be offline
    expect(result.get("shroud")).toMatchObject({
      login: "shroud",
      isLive: false,
      viewerCount: 0,
    });
  });

  it("replaces thumbnail URL placeholders with dimensions", async () => {
    const result = await getTwitchStreamData(["ninja"]);
    const thumbnail = result.get("ninja")?.thumbnailUrl;

    expect(thumbnail).not.toContain("{width}");
    expect(thumbnail).not.toContain("{height}");
    expect(thumbnail).toContain("440x248");
  });

  it("returns empty map for empty input", async () => {
    const result = await getTwitchStreamData([]);
    expect(result.size).toBe(0);
  });
});

// ── URL parsing edge cases ────────────────────────────────────────────────────
describe("Twitch URL edge cases", () => {
  it("handles URLs with paths beyond the login", () => {
    // e.g. https://twitch.tv/ninja/videos
    expect(extractTwitchLogin("https://twitch.tv/ninja/videos")).toBe("ninja");
  });

  it("handles URLs with port numbers", () => {
    expect(extractTwitchLogin("https://twitch.tv:443/streamer")).toBe("streamer");
  });
});
