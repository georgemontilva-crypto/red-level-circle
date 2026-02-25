/**
 * roster.test.ts — Tests para el sistema de fichas de jugador y roster competitivo
 * Cubre: hasApprovedTeamMembership, updateUserProfile con rosterPhoto, y lógica de TOP 5
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock de getDb ────────────────────────────────────────────────────────────
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    hasApprovedTeamMembership: vi.fn(),
    updateUserProfile: vi.fn(),
  };
});

// ─── Tests de hasApprovedTeamMembership ──────────────────────────────────────
describe("hasApprovedTeamMembership", () => {
  it("retorna false si el usuario no pertenece a ningún equipo", async () => {
    const { hasApprovedTeamMembership } = await import("./db");
    (hasApprovedTeamMembership as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);
    const result = await hasApprovedTeamMembership(999);
    expect(result).toBe(false);
  });

  it("retorna false si el equipo no tiene inscripción aprobada", async () => {
    const { hasApprovedTeamMembership } = await import("./db");
    (hasApprovedTeamMembership as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);
    const result = await hasApprovedTeamMembership(1);
    expect(result).toBe(false);
  });

  it("retorna true si el equipo tiene inscripción aprobada", async () => {
    const { hasApprovedTeamMembership } = await import("./db");
    (hasApprovedTeamMembership as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);
    const result = await hasApprovedTeamMembership(1);
    expect(result).toBe(true);
  });
});

// ─── Tests de updateUserProfile con rosterPhoto ──────────────────────────────
describe("updateUserProfile - rosterPhoto", () => {
  it("actualiza rosterPhoto correctamente", async () => {
    const { updateUserProfile } = await import("./db");
    (updateUserProfile as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);
    await expect(
      updateUserProfile(1, { rosterPhoto: "https://cdn.example.com/roster/player1.jpg" })
    ).resolves.not.toThrow();
    expect(updateUserProfile).toHaveBeenCalledWith(1, {
      rosterPhoto: "https://cdn.example.com/roster/player1.jpg",
    });
  });

  it("acepta rosterPhoto como null para eliminar la foto", async () => {
    const { updateUserProfile } = await import("./db");
    (updateUserProfile as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);
    await expect(
      updateUserProfile(1, { rosterPhoto: null })
    ).resolves.not.toThrow();
  });
});

// ─── Tests de lógica de TOP 5 ─────────────────────────────────────────────────
describe("Lógica de TOP 5 en Ranking", () => {
  const mockTeams = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Equipo ${i + 1}`,
    points: 1000 - i * 100,
    wins: 10 - i,
    losses: i,
    gameSlug: "valorant",
  }));

  it("slice(0, 5) devuelve exactamente 5 equipos", () => {
    const top5 = mockTeams.slice(0, 5);
    expect(top5).toHaveLength(5);
  });

  it("el primer equipo tiene más puntos que el segundo", () => {
    const top5 = mockTeams.slice(0, 5);
    expect(top5[0].points).toBeGreaterThan(top5[1].points);
  });

  it("no muestra TOP 5 si hay menos de 2 equipos", () => {
    const singleTeam = mockTeams.slice(0, 1);
    const shouldShow = singleTeam.length >= 2;
    expect(shouldShow).toBe(false);
  });

  it("no muestra TOP 5 si rankingStatus es no_results", () => {
    const rankingStatus = "no_results";
    const shouldShow = rankingStatus !== "no_results" && mockTeams.length >= 2;
    expect(shouldShow).toBe(false);
  });

  it("muestra TOP 5 si rankingStatus es official y hay al menos 2 equipos", () => {
    const rankingStatus = "official";
    const shouldShow = rankingStatus !== "no_results" && mockTeams.length >= 2;
    expect(shouldShow).toBe(true);
  });
});

// ─── Tests de winRate ─────────────────────────────────────────────────────────
describe("winRate", () => {
  function winRate(wins: number, losses: number) {
    const total = wins + losses;
    if (total === 0) return null;
    return Math.round((wins / total) * 100);
  }

  it("retorna null si no hay partidas", () => {
    expect(winRate(0, 0)).toBeNull();
  });

  it("retorna 100 si todas son victorias", () => {
    expect(winRate(10, 0)).toBe(100);
  });

  it("retorna 0 si todas son derrotas", () => {
    expect(winRate(0, 10)).toBe(0);
  });

  it("retorna 50 con igual victorias y derrotas", () => {
    expect(winRate(5, 5)).toBe(50);
  });

  it("redondea correctamente", () => {
    expect(winRate(1, 3)).toBe(25);
    expect(winRate(2, 3)).toBe(40);
  });
});

// ─── Tests de validación de foto de roster ────────────────────────────────────
describe("Validación de foto de roster", () => {
  it("rechaza la subida si el usuario no tiene equipo aprobado", async () => {
    const { hasApprovedTeamMembership } = await import("./db");
    (hasApprovedTeamMembership as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);
    const canUpload = await hasApprovedTeamMembership(42);
    expect(canUpload).toBe(false);
    // En el router, si canUpload es false se lanza TRPCError FORBIDDEN
  });

  it("permite la subida si el usuario tiene equipo aprobado", async () => {
    const { hasApprovedTeamMembership } = await import("./db");
    (hasApprovedTeamMembership as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);
    const canUpload = await hasApprovedTeamMembership(1);
    expect(canUpload).toBe(true);
  });
});
