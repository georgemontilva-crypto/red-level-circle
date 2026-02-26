/**
 * rosterCard.ts — Ficha competitiva 600×900 (v2 — rediseño profesional)
 *
 * Layout:
 *   ┌─────────────────────────────┐
 *   │  Foto del jugador (65%)     │  ← cover, foco en la parte superior
 *   │                             │
 *   ├─────────────────────────────┤  ← separador rojo 2px
 *   │  NICK                       │  ← fuente grande, blanca
 *   │  Nombre real · País         │  ← fuente pequeña, gris
 *   │  [ROL]  [RANGO]  [REGIÓN]   │  ← badges en línea
 *   │  ─────────────────────────  │  ← divisor sutil
 *   │  Juego · Puntaje RLC        │  ← métricas simples
 *   │  [TAG EQUIPO]               │  ← esquina inferior derecha
 *   └─────────────────────────────┘
 *
 * Principios de diseño:
 * - Tipografía: una sola familia (system sans-serif), 2 pesos (400/700)
 * - Paleta: negro, blanco, rojo (#cc2222), gris (#888)
 * - Sin triángulos decorativos ni logos externos
 * - El icono SVG del rol reemplaza al logo del equipo
 */

import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";

const CARD_W = 600;
const CARD_H = 900;

// Zona de foto: 65% de la altura
const PHOTO_H = Math.round(CARD_H * 0.62);
// Zona de info: 38% restante
const INFO_Y = PHOTO_H;
const INFO_H = CARD_H - PHOTO_H;

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

async function fetchBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
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

  // Intentar leer desde el directorio de assets del proyecto
  const possiblePaths = [
    path.join(process.cwd(), "client", "public", `${fileName}.svg`),
    path.join("/home/ubuntu/red-level-circle/client/public", `${fileName}.svg`),
  ];

  for (const p of possiblePaths) {
    try {
      const content = fs.readFileSync(p, "utf-8");
      // Extraer solo los elementos <path> del SVG
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
  /** URL del logo del equipo — no se usa en v2 */
  teamLogoUrl?: string | null;
  /** Tag corto del equipo (ej: "RDG") — opcional */
  teamTag?: string | null;
  /** Nombre real del jugador — opcional */
  realName?: string | null;
  /** País del jugador — opcional */
  country?: string | null;
  /** Rango / ELO (ej: "Diamond II", "Radiant") — opcional */
  elo?: string | null;
  /** Región competitiva (ej: "LAN", "NA") — opcional */
  competitiveRegion?: string | null;
  /** Juego principal (ej: "League of Legends") — opcional */
  mainGame?: string | null;
  /** Puntaje competitivo RLC — opcional */
  competitiveScore?: number | null;
}

// ─── Generación ───────────────────────────────────────────────────────────────

export async function generateRosterCard(opts: RosterCardOptions): Promise<Buffer> {
  const {
    playerPhotoBuffer,
    nickname,
    teamRole,
    gameRole,
    gameRoleLabel,
    teamTag,
    realName,
    country,
    elo,
    competitiveRegion,
    mainGame,
    competitiveScore,
  } = opts;

  // ── 1. Foto del jugador recortada a proporción correcta ────────────────────
  const playerPhoto = await sharp(playerPhotoBuffer)
    .resize(CARD_W, PHOTO_H, { fit: "cover", position: "top" })
    .png()
    .toBuffer();

  // Extender la foto a la altura total con fondo negro debajo
  const photoFull = await sharp({
    create: {
      width: CARD_W,
      height: CARD_H,
      channels: 4,
      background: { r: 8, g: 8, b: 8, alpha: 1 },
    },
  })
    .composite([{ input: playerPhoto, top: 0, left: 0 }])
    .png()
    .toBuffer();

  // ── 2. Gradiente suave en la parte inferior de la foto ────────────────────
  const photoGradient = Buffer.from(`
    <svg width="${CARD_W}" height="${PHOTO_H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#080808" stop-opacity="0"/>
          <stop offset="55%"  stop-color="#080808" stop-opacity="0.1"/>
          <stop offset="80%"  stop-color="#080808" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#080808" stop-opacity="0.95"/>
        </linearGradient>
      </defs>
      <rect width="${CARD_W}" height="${PHOTO_H}" fill="url(#g)"/>
    </svg>
  `);

  // ── 3. Separador rojo entre foto e info ───────────────────────────────────
  const separator = Buffer.from(`
    <svg width="${CARD_W}" height="3" xmlns="http://www.w3.org/2000/svg">
      <rect width="${CARD_W}" height="3" fill="#cc2222"/>
    </svg>
  `);

  // ── 4. Panel de información (zona inferior) ───────────────────────────────
  // Fondo sólido muy oscuro
  const infoBg = Buffer.from(`
    <svg width="${CARD_W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${CARD_W}" height="${INFO_H}" fill="#080808"/>
    </svg>
  `);

  // ── 5. Nick del jugador ───────────────────────────────────────────────────
  const nickRaw = trunc(nickname, 16);
  const nickDisplay = esc(nickRaw);
  const nickSize = nickRaw.length > 13 ? 44 : nickRaw.length > 10 ? 52 : 60;

  const nickSvg = Buffer.from(`
    <svg width="${CARD_W}" height="76" xmlns="http://www.w3.org/2000/svg">
      <text
        x="32" y="${nickSize + 4}"
        font-size="${nickSize}"
        font-weight="700"
        fill="#ffffff"
        font-family="'Noto Sans', 'Liberation Sans', 'DejaVu Sans', Arial, sans-serif"
        letter-spacing="-0.5"
      >${nickDisplay}</text>
    </svg>
  `);

  // ── 6. Nombre real + País ─────────────────────────────────────────────────
  const subParts: string[] = [];
  if (realName) subParts.push(trunc(esc(realName), 24));
  if (country) subParts.push(esc(country));
  const subLine = subParts.join("  ·  ");

  const subSvg = subLine ? Buffer.from(`
    <svg width="${CARD_W}" height="28" xmlns="http://www.w3.org/2000/svg">
      <text
        x="32" y="20"
        font-size="16"
        font-weight="400"
        fill="#888888"
        font-family="'Noto Sans', 'Liberation Sans', 'DejaVu Sans', Arial, sans-serif"
        letter-spacing="0.2"
      >${subLine}</text>
    </svg>
  `) : null;

  // ── 7. Badges: ROL · RANGO · REGIÓN ──────────────────────────────────────
  // Construir los badges como rectángulos + texto en SVG
  const badges: Array<{ text: string; type: "role" | "rank" | "region" }> = [];

  const roleLabelDisplay = gameRoleLabel ?? (gameRole ? gameRole.charAt(0).toUpperCase() + gameRole.slice(1) : null);
  if (roleLabelDisplay) badges.push({ text: trunc(esc(roleLabelDisplay), 12), type: "role" });
  if (elo) badges.push({ text: trunc(esc(elo), 14), type: "rank" });
  if (competitiveRegion) badges.push({ text: esc(competitiveRegion), type: "region" });

  // Calcular posiciones de badges (pill style)
  const BADGE_H = 26;
  const BADGE_PADDING_X = 12;
  const BADGE_GAP = 8;
  const BADGE_FONT = 13;
  // Estimar ancho de texto (aprox 7.5px por carácter a font-size 13)
  const charW = 7.5;
  let badgeX = 32;
  const badgeElements: string[] = [];

  for (const badge of badges) {
    const textW = badge.text.length * charW;
    const badgeW = textW + BADGE_PADDING_X * 2;
    const fillColor = badge.type === "role" ? "#cc2222" : badge.type === "rank" ? "#1a1a2e" : "#111827";
    const strokeColor = badge.type === "role" ? "#cc2222" : badge.type === "rank" ? "#3b3b6b" : "#374151";
    const textColor = badge.type === "role" ? "#ffffff" : badge.type === "rank" ? "#a5a5e0" : "#9ca3af";

    badgeElements.push(`
      <rect x="${badgeX}" y="0" width="${badgeW}" height="${BADGE_H}" rx="5"
        fill="${fillColor}" fill-opacity="${badge.type === "role" ? "1" : "0.4"}"
        stroke="${strokeColor}" stroke-width="1"/>
      <text x="${badgeX + BADGE_PADDING_X}" y="${BADGE_H - 7}"
        font-size="${BADGE_FONT}" font-weight="${badge.type === "role" ? "700" : "500"}"
        fill="${textColor}"
        font-family="'Noto Sans', 'Liberation Sans', 'DejaVu Sans', Arial, sans-serif"
        letter-spacing="0.3"
      >${badge.text}</text>
    `);
    badgeX += badgeW + BADGE_GAP;
  }

  const badgesSvg = badgeElements.length > 0 ? Buffer.from(`
    <svg width="${CARD_W}" height="${BADGE_H + 4}" xmlns="http://www.w3.org/2000/svg">
      ${badgeElements.join("")}
    </svg>
  `) : null;

  // ── 8. Divisor sutil ──────────────────────────────────────────────────────
  const dividerSvg = Buffer.from(`
    <svg width="${CARD_W - 64}" height="1" xmlns="http://www.w3.org/2000/svg">
      <rect width="${CARD_W - 64}" height="1" fill="#222222"/>
    </svg>
  `);

  // ── 9. Métricas: Juego · Puntaje RLC ─────────────────────────────────────
  const metricParts: string[] = [];
  if (mainGame) metricParts.push(trunc(esc(mainGame), 22));
  if (competitiveScore && competitiveScore > 0) metricParts.push(`${competitiveScore.toLocaleString()} pts`);
  const metricLine = metricParts.join("   ·   ");

  const metricSvg = metricLine ? Buffer.from(`
    <svg width="${CARD_W}" height="24" xmlns="http://www.w3.org/2000/svg">
      <text
        x="32" y="17"
        font-size="13"
        font-weight="400"
        fill="#555555"
        font-family="'Noto Sans', 'Liberation Sans', 'DejaVu Sans', Arial, sans-serif"
        letter-spacing="0.3"
      >${metricLine}</text>
    </svg>
  `) : null;

  // ── 10. Tag del equipo (esquina inferior derecha) ─────────────────────────
  const tagDisplay = teamTag ? trunc(esc(teamTag.toUpperCase()), 6) : null;
  const tagSvg = tagDisplay ? Buffer.from(`
    <svg width="${CARD_W}" height="30" xmlns="http://www.w3.org/2000/svg">
      <text
        x="${CARD_W - 32}" y="22"
        font-size="14"
        font-weight="700"
        fill="#cc2222"
        font-family="'Noto Sans', 'Liberation Sans', 'DejaVu Sans', Arial, sans-serif"
        text-anchor="end"
        letter-spacing="2"
      >${tagDisplay}</text>
    </svg>
  `) : null;

  // ── 11. Icono SVG del rol (esquina superior derecha de la foto) ───────────
  // Usar el valor del gameRole para obtener los paths SVG
  const rolePaths = getRoleSvgPaths(gameRole ?? teamRole);
  const roleIconSvg = rolePaths ? Buffer.from(`
    <svg width="52" height="52" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 119.43 132.98">
      <g fill="rgba(204,34,34,0.85)" transform="scale(${52 / 132.98})">
        ${rolePaths}
      </g>
    </svg>
  `) : null;

  // ── 12. Acento rojo superior (barra fina) ─────────────────────────────────
  const topBar = Buffer.from(`
    <svg width="${CARD_W}" height="3" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tb" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#cc2222"/>
          <stop offset="70%" stop-color="#cc2222"/>
          <stop offset="100%" stop-color="#080808"/>
        </linearGradient>
      </defs>
      <rect width="${CARD_W}" height="3" fill="url(#tb)"/>
    </svg>
  `);

  // ── 13. Composición final ─────────────────────────────────────────────────
  // Calcular posiciones verticales dentro del panel de info
  // INFO_Y = PHOTO_H (inicio del panel)
  const NICK_OFFSET = 18;
  const SUB_OFFSET = NICK_OFFSET + 72;
  const BADGES_OFFSET = SUB_OFFSET + (subLine ? 32 : 4);
  const DIVIDER_OFFSET = BADGES_OFFSET + (badgeElements.length > 0 ? 40 : 12);
  const METRICS_OFFSET = DIVIDER_OFFSET + 14;
  const TAG_OFFSET = CARD_H - 38;
  const ROLE_ICON_X = CARD_W - 72;
  const ROLE_ICON_Y = PHOTO_H - 68;

  const composites: sharp.OverlayOptions[] = [
    // Gradiente sobre la foto
    { input: photoGradient, top: 0, left: 0 },
    // Barra roja superior
    { input: topBar, top: 0, left: 0 },
    // Fondo del panel de info
    { input: infoBg, top: INFO_Y, left: 0 },
    // Separador rojo foto/info
    { input: separator, top: INFO_Y, left: 0 },
    // Nick
    { input: nickSvg, top: INFO_Y + NICK_OFFSET, left: 0 },
  ];

  if (subSvg) composites.push({ input: subSvg, top: INFO_Y + SUB_OFFSET, left: 0 });
  if (badgesSvg) composites.push({ input: badgesSvg, top: INFO_Y + BADGES_OFFSET, left: 0 });
  composites.push({ input: dividerSvg, top: INFO_Y + DIVIDER_OFFSET, left: 32 });
  if (metricSvg) composites.push({ input: metricSvg, top: INFO_Y + METRICS_OFFSET, left: 0 });
  if (tagSvg) composites.push({ input: tagSvg, top: TAG_OFFSET, left: 0 });
  if (roleIconSvg) composites.push({ input: roleIconSvg, top: ROLE_ICON_Y, left: ROLE_ICON_X });

  const result = await sharp(photoFull)
    .composite(composites)
    .jpeg({ quality: 93, mozjpeg: true })
    .toBuffer();

  return result;
}
