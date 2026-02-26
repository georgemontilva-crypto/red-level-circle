/**
 * Tests for creator stream business logic.
 * Tests the pure business rules (ownership, 1-active-per-user) in isolation.
 */
import { describe, it, expect } from "vitest";

// ── Pure business logic extracted for testing ────────────────────────────────

/**
 * Validates that a user can start a new stream.
 * Returns an error message if validation fails, or null if OK.
 */
function validateCanStartStream(existingActiveStream: { id: number } | null): string | null {
  if (existingActiveStream) {
    return "Ya tienes una transmisión activa. Deténla antes de iniciar una nueva.";
  }
  return null;
}

/**
 * Validates that a user can stop a stream.
 * Returns an error message if validation fails, or null if OK.
 */
function validateCanStopStream(
  stream: { userId: number | null } | null,
  requestingUserId: number,
  isAdmin: boolean
): string | null {
  if (!stream) return "Stream no encontrado";
  if (!isAdmin && stream.userId !== requestingUserId) {
    return "No tienes permiso para detener esta transmisión";
  }
  return null;
}

// ── createCreatorStream — 1 active stream per user rule ──────────────────────
describe("validateCanStartStream — 1 active stream per user rule", () => {
  it("returns error when user already has an active stream", () => {
    const existing = { id: 99 };
    const error = validateCanStartStream(existing);
    expect(error).toContain("Ya tienes una transmisión activa");
  });

  it("returns null when user has no active stream", () => {
    const error = validateCanStartStream(null);
    expect(error).toBeNull();
  });
});

// ── stopCreatorStream — ownership check ──────────────────────────────────────
describe("validateCanStopStream — ownership and permission rules", () => {
  const stream = { id: 10, userId: 5 };

  it("returns error when non-owner non-admin tries to stop", () => {
    const error = validateCanStopStream(stream, 99, false);
    expect(error).toContain("No tienes permiso");
  });

  it("returns null when owner stops their own stream", () => {
    const error = validateCanStopStream(stream, 5, false);
    expect(error).toBeNull();
  });

  it("returns null when admin stops any stream", () => {
    const error = validateCanStopStream(stream, 999, true);
    expect(error).toBeNull();
  });

  it("returns error when stream not found", () => {
    const error = validateCanStopStream(null, 1, false);
    expect(error).toBe("Stream no encontrado");
  });

  it("allows admin to stop even a stream they don't own", () => {
    const foreignStream = { id: 20, userId: 7 };
    const error = validateCanStopStream(foreignStream, 1, true); // admin userId=1, owner=7
    expect(error).toBeNull();
  });
});

// ── Stream type badge logic ───────────────────────────────────────────────────
describe("Stream type classification", () => {
  type StreamType = "tournament" | "creator" | null | undefined;

  function getBadgeLabel(type: StreamType): string {
    if (type === "tournament") return "TORNEO";
    if (type === "creator") return "CREADOR";
    return "";
  }

  it("returns TORNEO badge for tournament streams", () => {
    expect(getBadgeLabel("tournament")).toBe("TORNEO");
  });

  it("returns CREADOR badge for creator streams", () => {
    expect(getBadgeLabel("creator")).toBe("CREADOR");
  });

  it("returns empty string for legacy streams without type", () => {
    expect(getBadgeLabel(null)).toBe("");
    expect(getBadgeLabel(undefined)).toBe("");
  });
});

// ── Platform URL auto-fill logic ─────────────────────────────────────────────
describe("Platform URL auto-fill", () => {
  function getDefaultUrl(
    platform: "twitch" | "youtube" | "discord" | "other",
    twitchHandle: string | null,
    youtubeHandle: string | null
  ): string {
    if (platform === "twitch" && twitchHandle) return `https://twitch.tv/${twitchHandle}`;
    if (platform === "youtube" && youtubeHandle) return `https://youtube.com/@${youtubeHandle}`;
    return "";
  }

  it("auto-fills Twitch URL from handle", () => {
    expect(getDefaultUrl("twitch", "mystreamer", null)).toBe("https://twitch.tv/mystreamer");
  });

  it("auto-fills YouTube URL from handle", () => {
    expect(getDefaultUrl("youtube", null, "mychannel")).toBe("https://youtube.com/@mychannel");
  });

  it("returns empty string when handle not available", () => {
    expect(getDefaultUrl("twitch", null, null)).toBe("");
    expect(getDefaultUrl("discord", "handle", "channel")).toBe("");
  });
});
