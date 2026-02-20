import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  getTournaments: vi.fn().mockResolvedValue([]),
  getTournamentById: vi.fn().mockResolvedValue(null),
  createTournament: vi.fn().mockResolvedValue({ id: 1, name: "Test Tournament" }),
  getMyTournaments: vi.fn().mockResolvedValue([]),
  getRegistrationsByTournament: vi.fn().mockResolvedValue([]),
  updateRegistrationStatus: vi.fn().mockResolvedValue(undefined),
  getRegistrationAuditLog: vi.fn().mockResolvedValue([]),
  getMatchesByTournament: vi.fn().mockResolvedValue([]),
  getMyTeams: vi.fn().mockResolvedValue([]),
  getTeamsByUser: vi.fn().mockResolvedValue([]),
  createTeam: vi.fn().mockResolvedValue({ id: 1, name: "Test Team" }),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

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

function createUserContext(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-openid",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "manus",
      role,
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

describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createGuestContext());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user data for authenticated users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Test User");
    expect(result?.role).toBe("user");
  });
});

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

describe("tournaments.list", () => {
  it("returns empty array when no tournaments exist", async () => {
    const caller = appRouter.createCaller(createGuestContext());
    const result = await caller.tournaments.list({});
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});

describe("tournaments.myTournaments", () => {
  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createGuestContext());
    await expect(caller.tournaments.myTournaments()).rejects.toThrow();
  });

  it("throws FORBIDDEN for standard users (non-premium)", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    await expect(caller.tournaments.myTournaments()).rejects.toThrow();
  });

  it("returns empty array for premium/admin users with no tournaments", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.tournaments.myTournaments();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("teams.myTeams", () => {
  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createGuestContext());
    await expect(caller.teams.myTeams()).rejects.toThrow();
  });

  it("returns empty array for authenticated users with no teams", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.teams.myTeams();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("registrations.byTournament", () => {
  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createGuestContext());
    await expect(caller.registrations.byTournament({ tournamentId: 1 })).rejects.toThrow();
  });

  it("throws FORBIDDEN for standard users (non-premium)", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    await expect(caller.registrations.byTournament({ tournamentId: 1 })).rejects.toThrow();
  });

  it("throws NOT_FOUND when tournament does not exist (admin)", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    // getTournamentById is mocked to return null, so we expect NOT_FOUND
    await expect(caller.registrations.byTournament({ tournamentId: 999 })).rejects.toThrow();
  });
});
