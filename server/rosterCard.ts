/**
 * rosterCard.ts — Ficha competitiva 600×900 (v3 — solo foto)
 *
 * Layout:
 *   ┌─────────────────────────────┐
 *   │  Foto del jugador (100%)    │  ← cover, foco en la parte superior
 *   │                             │
 *   │  [ICONO ROL] (esquina sup)  │  ← badge circular en esquina superior derecha
 *   │                             │
 *   │  [CAP] (esquina inf izq)    │  ← badge capitán si aplica
 *   └─────────────────────────────┘
 *
 * El componente RosterCard del frontend ya muestra nick, rol, región, juego y equipo
 * en la columna derecha, por lo que la imagen solo debe contener la foto.
 */

import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";

const CARD_W = 600;
const CARD_H = 900;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function trunc(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "…";
}

/**
 * Lee el SVG del rol desde el sistema de archivos (carpeta client/public).
 * Extrae solo los paths del SVG para incrustarlos directamente en el SVG de la card.
 */
function getRoleSvgPaths(roleValue: string | null | undefined): string {
  if (!roleValue) return "";
  const svgMap: Record<string, string> = {
    // LoL
    top: "role-top",
    jungle: "role-jungle",
    mid: "role-mid",
    adc: "role-adc",
    support: "role-support",
    // Valorant
    duelist: "role-adc",
    initiator: "role-mid",
    controller: "role-jungle",
    sentinel: "role-support",
    flex: "role-top",
    // CS2
    entry: "role-adc",
    awper: "role-mid",
    lurker: "role-jungle",
    igl: "role-top",
    // Dota 2
    carry: "role-adc",
    offlane: "role-top",
    "soft-support": "role-jungle",
    "hard-support": "role-support",
    // Fortnite / Apex / otros
    fragger: "role-adc",
    builder: "role-top",
    scout: "role-jungle",
    // Overwatch
    tank: "role-top",
    damage: "role-adc",
    healer: "role-support",
    // Rocket League
    striker: "role-adc",
    goalkeeper: "role-support",
    midfielder: "role-mid",
    // Default
    player: "role-mid",
    captain: "role-top",
    substitute: "role-support",
    coach: "role-jungle",
  };

  const fileName = svgMap[roleValue] ?? svgMap[roleValue.toLowerCase()] ?? null;
  if (!fileName) return "";

  const possiblePaths = [
    path.join(process.cwd(), "client", "public", `${fileName}.svg`),
    path.join("/home/ubuntu/red-level-circle/client/public", `${fileName}.svg`),
  ];

  for (const p of possiblePaths) {
    try {
      const content = fs.readFileSync(p, "utf-8");
      const pathMatches = content.match(/<path[^>]*\/>/g) ?? content.match(/<path[^>]*>[\s\S]*?<\/path>/g) ?? [];
      return pathMatches.join("\n");
    } catch {
      // Continuar con el siguiente path
    }
  }
  return "";
}

// ─── Interfaz pública ─────────────────────────────────────────────────────────

export interface RosterCardOptions {
  /** Buffer de la foto del jugador (cualquier proporción) */
  playerPhotoBuffer: Buffer;
  /** Nick del jugador */
  nickname: string;
  /** Rol en el equipo (ej: "player", "captain") */
  teamRole: string;
  /** Rol en el juego (ej: "top", "jungle", "entry") — opcional */
  gameRole?: string | null;
  /** Label legible del rol en el juego (ej: "Top", "Jungla") — opcional */
  gameRoleLabel?: string | null;
  /** URL del logo del equipo — no se usa */
  teamLogoUrl?: string | null;
  /** Tag corto del equipo — no se usa */
  teamTag?: string | null;
  /** Nombre real del jugador — no se usa en imagen */
  realName?: string | null;
  /** País del jugador — no se usa en imagen */
  country?: string | null;
  /** Rango / ELO — no se usa en imagen */
  elo?: string | null;
  /** Región competitiva — no se usa en imagen */
  competitiveRegion?: string | null;
  /** Juego principal — no se usa en imagen */
  mainGame?: string | null;
  /** Puntaje competitivo RLC — no se usa en imagen */
  competitiveScore?: number | null;
}

// ─── Generación ───────────────────────────────────────────────────────────────

export async function generateRosterCard(opts: RosterCardOptions): Promise<Buffer> {
  const {
    playerPhotoBuffer,
    teamRole,
    gameRole,
    gameRoleLabel,
  } = opts;

  // ── 1. Foto del jugador recortada a la tarjeta completa ────────────────────
  const playerPhoto = await sharp(playerPhotoBuffer)
    .resize(CARD_W, CARD_H, { fit: "cover", position: "top" })
    .png()
    .toBuffer();

  // ── 2. Barra roja superior (acento de marca) ──────────────────────────────
  const topBar = Buffer.from(`
    <svg width="${CARD_W}" height="4" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tb" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#cc2222"/>
          <stop offset="70%" stop-color="#cc2222"/>
          <stop offset="100%" stop-color="#080808"/>
        </linearGradient>
      </defs>
      <rect width="${CARD_W}" height="4" fill="url(#tb)"/>
    </svg>
  `);

  // ── 3. Icono SVG del rol (esquina superior derecha) ───────────────────────
  const rolePaths = getRoleSvgPaths(gameRole ?? teamRole);
  const roleLabel = gameRoleLabel ?? (gameRole ? gameRole.charAt(0).toUpperCase() + gameRole.slice(1) : null);

  // Badge circular con icono del rol
  const ROLE_BADGE_SIZE = 72;
  const ROLE_ICON_X = CARD_W - ROLE_BADGE_SIZE - 16;
  const ROLE_ICON_Y = 16;

  const roleBadgeSvg = (rolePaths || roleLabel) ? Buffer.from(`
    <svg width="${ROLE_BADGE_SIZE}" height="${ROLE_BADGE_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <!-- Fondo circular semitransparente -->
      <circle cx="${ROLE_BADGE_SIZE / 2}" cy="${ROLE_BADGE_SIZE / 2}" r="${ROLE_BADGE_SIZE / 2 - 1}"
        fill="rgba(0,0,0,0.80)" stroke="#FFD700" stroke-width="2"/>
      ${rolePaths ? `
      <!-- Icono del rol centrado -->
      <g transform="translate(${ROLE_BADGE_SIZE / 2 - 18}, ${ROLE_BADGE_SIZE / 2 - 22}) scale(${36 / 132.98})"
         fill="rgba(255,255,255,0.92)">
        ${rolePaths}
      </g>` : ""}
      ${roleLabel ? `
      <!-- Label del rol -->
      <text x="${ROLE_BADGE_SIZE / 2}" y="${ROLE_BADGE_SIZE - 10}"
        font-size="11" font-weight="700" fill="#FFD700"
        font-family="'Noto Sans', Arial, sans-serif"
        text-anchor="middle" letter-spacing="0.5"
      >${esc(trunc(roleLabel.toUpperCase(), 4))}</text>` : ""}
    </svg>
  `) : null;

  // ── 4. Composición final ──────────────────────────────────────────────────
  const composites: sharp.OverlayOptions[] = [
    // Barra roja superior
    { input: topBar, top: 0, left: 0 },
  ];

  if (roleBadgeSvg) {
    composites.push({ input: roleBadgeSvg, top: ROLE_ICON_Y, left: ROLE_ICON_X });
  }

  const result = await sharp(playerPhoto)
    .composite(composites)
    .jpeg({ quality: 93, mozjpeg: true })
    .toBuffer();

  return result;
}
