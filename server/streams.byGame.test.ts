import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock getDb ───────────────────────────────────────────────────────────────
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual };
});

// ─── Unit-test the grouping logic in isolation ────────────────────────────────
// We test the pure transformation: raw rows → grouped output

interface RawStreamRow {
  id: number;
  title: string;
  streamerName: string | null;
  platform: "twitch" | "youtube" | "discord" | "other";
  url: string;
  embedUrl: string | null;
  game: string | null;
  isLive: boolean;
  viewerCount: number | null;
  thumbnailUrl: string | null;
  tournamentId: number | null;
  createdAt: Date;
  updatedAt: Date;
  rn: number;
}

type GroupedResult = Array<{ game: string; streams: Omit<RawStreamRow, "rn">[] }>;

function groupStreamsByGame(rows: RawStreamRow[]): GroupedResult {
  const map = new Map<string, Omit<RawStreamRow, "rn">[]>();
  for (const row of rows) {
    const gameKey = row.game ?? "Sin categoría";
    if (!map.has(gameKey)) map.set(gameKey, []);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { rn, ...rest } = row;
    map.get(gameKey)!.push(rest);
  }
  return Array.from(map.entries()).map(([game, streams]) => ({ game, streams }));
}

const makeRow = (overrides: Partial<RawStreamRow> = {}): RawStreamRow => ({
  id: 1,
  title: "Test Stream",
  streamerName: null,
  platform: "twitch",
  url: "https://twitch.tv/test",
  embedUrl: null,
  game: "Valorant",
  isLive: true,
  viewerCount: 100,
  thumbnailUrl: null,
  tournamentId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  rn: 1,
  ...overrides,
});

describe("groupStreamsByGame", () => {
  it("groups streams by game correctly", () => {
    const rows: RawStreamRow[] = [
      makeRow({ id: 1, game: "Valorant", rn: 1 }),
      makeRow({ id: 2, game: "Valorant", rn: 2 }),
      makeRow({ id: 3, game: "League of Legends", rn: 1 }),
    ];
    const result = groupStreamsByGame(rows);
    expect(result).toHaveLength(2);
    const valorant = result.find((g) => g.game === "Valorant");
    expect(valorant?.streams).toHaveLength(2);
    const lol = result.find((g) => g.game === "League of Legends");
    expect(lol?.streams).toHaveLength(1);
  });

  it("uses 'Sin categoría' when game is null", () => {
    const rows: RawStreamRow[] = [
      makeRow({ id: 1, game: null, rn: 1 }),
      makeRow({ id: 2, game: null, rn: 2 }),
    ];
    const result = groupStreamsByGame(rows);
    expect(result).toHaveLength(1);
    expect(result[0].game).toBe("Sin categoría");
    expect(result[0].streams).toHaveLength(2);
  });

  it("strips the rn field from output streams", () => {
    const rows: RawStreamRow[] = [makeRow({ id: 1, rn: 3 })];
    const result = groupStreamsByGame(rows);
    expect((result[0].streams[0] as any).rn).toBeUndefined();
  });

  it("returns empty array for empty input", () => {
    expect(groupStreamsByGame([])).toEqual([]);
  });

  it("handles a single stream per game", () => {
    const rows: RawStreamRow[] = [
      makeRow({ id: 1, game: "CS2", rn: 1 }),
      makeRow({ id: 2, game: "Dota 2", rn: 1 }),
      makeRow({ id: 3, game: "Fortnite", rn: 1 }),
    ];
    const result = groupStreamsByGame(rows);
    expect(result).toHaveLength(3);
    result.forEach((g) => expect(g.streams).toHaveLength(1));
  });

  it("preserves stream data correctly", () => {
    const now = new Date();
    const rows: RawStreamRow[] = [
      makeRow({ id: 42, title: "Gran Final", streamerName: "TioMemox", viewerCount: 5000, game: "Valorant", rn: 1, createdAt: now, updatedAt: now }),
    ];
    const result = groupStreamsByGame(rows);
    const stream = result[0].streams[0];
    expect(stream.id).toBe(42);
    expect(stream.title).toBe("Gran Final");
    expect(stream.streamerName).toBe("TioMemox");
    expect(stream.viewerCount).toBe(5000);
  });

  it("respects insertion order for game keys", () => {
    const rows: RawStreamRow[] = [
      makeRow({ id: 1, game: "Apex Legends", rn: 1 }),
      makeRow({ id: 2, game: "Valorant", rn: 1 }),
      makeRow({ id: 3, game: "CS2", rn: 1 }),
    ];
    const result = groupStreamsByGame(rows);
    expect(result.map((g) => g.game)).toEqual(["Apex Legends", "Valorant", "CS2"]);
  });

  it("max 5 streams per game when sliced at call site", () => {
    const rows: RawStreamRow[] = Array.from({ length: 5 }, (_, i) =>
      makeRow({ id: i + 1, game: "Valorant", rn: i + 1 })
    );
    const result = groupStreamsByGame(rows);
    // The window function in SQL enforces HAVING rn <= 5; here we verify the grouping
    expect(result[0].streams).toHaveLength(5);
  });
});
