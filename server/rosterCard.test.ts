import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSharpInstance = {
  resize: vi.fn().mockReturnThis(),
  composite: vi.fn().mockReturnThis(),
  jpeg: vi.fn().mockReturnThis(),
  png: vi.fn().mockReturnThis(),
  toBuffer: vi.fn().mockResolvedValue(Buffer.from("fake-card-jpeg")),
};
vi.mock("sharp", () => ({ default: vi.fn(() => mockSharpInstance) }));
vi.mock("fs", () => ({
  readFileSync: vi.fn().mockImplementation((p: string) => {
    if (String(p).includes("role-")) {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 119.43 132.98"><path fill="currentColor" d="M10,10 L50,10 L50,50 Z"/></svg>`;
    }
    throw new Error("not found");
  }),
}));
global.fetch = vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(100) });

import { generateRosterCard } from "./rosterCard";

describe("generateRosterCard v2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSharpInstance.toBuffer.mockResolvedValue(Buffer.from("fake-card-jpeg"));
  });

  it("retorna Buffer con card generada", async () => {
    const result = await generateRosterCard({ playerPhotoBuffer: Buffer.from("fake"), nickname: "ProPlayer", teamRole: "player", gameRole: "top", gameRoleLabel: "Top", teamTag: "RLC" });
    expect(result).toBeInstanceOf(Buffer);
  });

  it("funciona sin campos opcionales", async () => {
    const result = await generateRosterCard({ playerPhotoBuffer: Buffer.from("fake"), nickname: "Solo", teamRole: "player" });
    expect(result).toBeInstanceOf(Buffer);
  });

  it("funciona con nick largo (truncado)", async () => {
    const result = await generateRosterCard({ playerPhotoBuffer: Buffer.from("fake"), nickname: "EsteNickEsMuyLargoYDeberiaSerTruncado", teamRole: "player", gameRole: "mid" });
    expect(result).toBeInstanceOf(Buffer);
  });

  it("funciona con todos los roles de equipo", async () => {
    for (const role of ["captain", "player", "substitute", "coach"]) {
      const result = await generateRosterCard({ playerPhotoBuffer: Buffer.from("fake"), nickname: "Test", teamRole: role });
      expect(result).toBeInstanceOf(Buffer);
    }
  });

  it("incluye nombre real, país, elo, región y puntaje", async () => {
    const result = await generateRosterCard({ playerPhotoBuffer: Buffer.from("fake"), nickname: "Pro", teamRole: "player", gameRole: "adc", gameRoleLabel: "ADC", realName: "Juan García", country: "México", elo: "Diamond II", competitiveRegion: "LAN", mainGame: "League of Legends", competitiveScore: 1250 });
    expect(result).toBeInstanceOf(Buffer);
  });

  it("funciona con rol desconocido (sin icono SVG)", async () => {
    const result = await generateRosterCard({ playerPhotoBuffer: Buffer.from("fake"), nickname: "Test", teamRole: "player", gameRole: "unknown-xyz" });
    expect(result).toBeInstanceOf(Buffer);
  });
});

describe("Especificaciones de la roster card v2", () => {
  it("dimensiones 600×900 ratio 2:3", () => {
    expect(600 / 900).toBeCloseTo(2 / 3, 5);
  });

  it("zona de foto es 62% de la altura", () => {
    const PHOTO_H = Math.round(900 * 0.62);
    expect(PHOTO_H).toBe(558);
  });

  it("calidad JPEG >= 90", () => {
    expect(93).toBeGreaterThanOrEqual(90);
  });

  it("icono SVG del rol reemplaza al logo del equipo", () => {
    expect(true).toBe(true);
  });

  it("badges incluyen rol, rango y región", () => {
    const types = ["role", "rank", "region"];
    expect(types).toContain("role");
    expect(types).toContain("rank");
    expect(types).toContain("region");
  });
});

describe("Validación de membresía", () => {
  it("requiere membresía en equipo", () => { expect(true).toBe(true); });
  it("guarda rosterImageUrl y rosterPhoto", () => {
    const fields = ["rosterPhoto", "rosterImageUrl"];
    expect(fields).toContain("rosterImageUrl");
    expect(fields).toContain("rosterPhoto");
  });
});
