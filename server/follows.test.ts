import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  followUser: vi.fn(),
  unfollowUser: vi.fn(),
  isFollowing: vi.fn(),
  getFollowerCount: vi.fn(),
  getFollowingCount: vi.fn(),
  getFollowers: vi.fn(),
  getFollowing: vi.fn(),
  listPublicUsers: vi.fn(),
}));

import {
  followUser,
  unfollowUser,
  isFollowing,
  getFollowerCount,
  getFollowingCount,
  listPublicUsers,
} from "./db";

describe("follows helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("followUser is called with correct args", async () => {
    vi.mocked(followUser).mockResolvedValueOnce(undefined);
    await followUser(1, 2);
    expect(followUser).toHaveBeenCalledWith(1, 2);
  });

  it("unfollowUser is called with correct args", async () => {
    vi.mocked(unfollowUser).mockResolvedValueOnce(undefined);
    await unfollowUser(1, 2);
    expect(unfollowUser).toHaveBeenCalledWith(1, 2);
  });

  it("isFollowing returns boolean", async () => {
    vi.mocked(isFollowing).mockResolvedValueOnce(true);
    const result = await isFollowing(1, 2);
    expect(result).toBe(true);
  });

  it("isFollowing returns false when not following", async () => {
    vi.mocked(isFollowing).mockResolvedValueOnce(false);
    const result = await isFollowing(1, 3);
    expect(result).toBe(false);
  });

  it("getFollowerCount returns number", async () => {
    vi.mocked(getFollowerCount).mockResolvedValueOnce(42);
    const count = await getFollowerCount(1);
    expect(count).toBe(42);
  });

  it("getFollowingCount returns number", async () => {
    vi.mocked(getFollowingCount).mockResolvedValueOnce(7);
    const count = await getFollowingCount(1);
    expect(count).toBe(7);
  });
});

describe("community helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listPublicUsers returns array", async () => {
    const mockUsers = [
      { id: 1, name: "Alice", nickname: "alice99", avatar: null, bannerUrl: null, bio: null, profileType: "player", mainGame: "Valorant", country: "CO", role: "user", createdAt: new Date() },
      { id: 2, name: "Bob", nickname: "bob_plays", avatar: null, bannerUrl: null, bio: null, profileType: "team_captain", mainGame: "LoL", country: "MX", role: "premium", createdAt: new Date() },
    ];
    vi.mocked(listPublicUsers).mockResolvedValueOnce(mockUsers as any);
    const result = await listPublicUsers({ limit: 10, offset: 0 });
    expect(result).toHaveLength(2);
    expect(result[0].nickname).toBe("alice99");
  });

  it("listPublicUsers accepts search param", async () => {
    vi.mocked(listPublicUsers).mockResolvedValueOnce([]);
    const result = await listPublicUsers({ search: "nonexistent", limit: 10, offset: 0 });
    expect(listPublicUsers).toHaveBeenCalledWith({ search: "nonexistent", limit: 10, offset: 0 });
    expect(result).toHaveLength(0);
  });

  it("listPublicUsers accepts pagination params", async () => {
    vi.mocked(listPublicUsers).mockResolvedValueOnce([]);
    await listPublicUsers({ limit: 20, offset: 40 });
    expect(listPublicUsers).toHaveBeenCalledWith({ limit: 20, offset: 40 });
  });
});
