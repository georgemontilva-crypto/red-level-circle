import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  updateUserProfile: vi.fn().mockResolvedValue(undefined),
  getUserPublicProfile: vi.fn().mockResolvedValue({
    id: 1,
    name: "Test User",
    nickname: "tester",
    bio: "Test bio",
    avatar: null,
    bannerUrl: null,
  }),
  getUserEquippedCosmetics: vi.fn().mockResolvedValue([]),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  // Add other required db functions
  getTournaments: vi.fn().mockResolvedValue([]),
  getTournamentById: vi.fn().mockResolvedValue(null),
  createTournament: vi.fn().mockResolvedValue(null),
  getMyTournaments: vi.fn().mockResolvedValue([]),
  getRegistrationsByTournament: vi.fn().mockResolvedValue([]),
  updateRegistrationStatus: vi.fn().mockResolvedValue(undefined),
  getRegistrationAuditLog: vi.fn().mockResolvedValue([]),
  getMatchesByTournament: vi.fn().mockResolvedValue([]),
  getMyTeams: vi.fn().mockResolvedValue([]),
  getTeamsByUser: vi.fn().mockResolvedValue([]),
  createTeam: vi.fn().mockResolvedValue(null),
}));

// Mock storage module
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "profiles/1/avatar-123.png", url: "https://cdn.example.com/profiles/1/avatar-123.png" }),
  storageGet: vi.fn().mockResolvedValue({ key: "test", url: "https://cdn.example.com/test" }),
}));

function createAuthContext(userId = 1, role: "user" | "premium" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: userId,
      openId: "test-open-id",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "oauth",
      role,
      profileType: "player",
      avatar: null,
      bio: null,
      nickname: null,
      mainGame: null,
      country: null,
      socialDiscord: null,
      socialTwitch: null,
      socialTwitter: null,
      bannerUrl: null,
      rlcBalance: 500,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createGuestContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("profile.updateMine", () => {
  it("should update profile for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.profile.updateMine({
      nickname: "newNick",
      bio: "Updated bio",
      profileType: "team_captain",
    });
    expect(result).toEqual({ success: true });
  });

  it("should throw UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createGuestContext());
    await expect(
      caller.profile.updateMine({ nickname: "test" })
    ).rejects.toThrow();
  });

  it("should accept all optional fields", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.profile.updateMine({
      nickname: "gamer123",
      bio: "Pro player",
      mainGame: "Valorant",
      country: "Argentina",
      profileType: "player",
      socialDiscord: "user#1234",
      socialTwitch: "mychannel",
      socialTwitter: "mytwitter",
      avatar: "https://example.com/avatar.png",
      bannerUrl: "https://example.com/banner.png",
    });
    expect(result).toEqual({ success: true });
  });
});

describe("profile.uploadImage", () => {
  it("should upload avatar for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.profile.uploadImage({
      base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      mimeType: "image/png",
      type: "avatar",
    });
    expect(result).toHaveProperty("url");
    expect(typeof result.url).toBe("string");
  });

  it("should upload banner for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.profile.uploadImage({
      base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      mimeType: "image/jpeg",
      type: "banner",
    });
    expect(result).toHaveProperty("url");
  });

  it("should throw UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createGuestContext());
    await expect(
      caller.profile.uploadImage({
        base64: "abc123",
        mimeType: "image/png",
        type: "avatar",
      })
    ).rejects.toThrow();
  });
});

describe("profile.getPublic", () => {
  it("should return public profile for any user", async () => {
    const caller = appRouter.createCaller(createGuestContext());
    const result = await caller.profile.getPublic({ userId: 1 });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("name");
  });
});
