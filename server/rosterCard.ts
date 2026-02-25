/**
 * rosterCard.ts — Generación automática de roster card 600×900
 *
 * Diseño predefinido oscuro (negro/gris):
 *   - Foto del jugador recortada a 2:3 (cover) como fondo
 *   - Overlay oscuro con gradiente
 *   - Franja inferior con logo del equipo, nick y rol
 *   - Acento rojo en la parte superior
 *
 * El usuario solo sube su foto; el sistema aplica el diseño.
 */

import sharp from "sharp";

const CARD_W = 600;
const CARD_H = 900;

// ─── Helpers SVG ─────────────────────────────────────────────────────────────

/** Escapa caracteres especiales para uso seguro en SVG */
function escapeSvg(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Trunca el texto si supera maxLen caracteres */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + "…";
}

// ─── Descarga de imagen desde URL ────────────────────────────────────────────

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

// ─── Generación de la roster card ────────────────────────────────────────────

export interface RosterCardOptions {
  /** Buffer de la foto del jugador (cualquier proporción) */
  playerPhotoBuffer: Buffer;
  /** Nick del jugador */
  nickname: string;
  /** Rol en el equipo (ej: "player", "captain") */
  teamRole: string;
  /** Rol en el juego (ej: "Jungle", "Entry Fragger") — opcional */
  gameRole?: string | null;
  /** URL del logo del equipo — opcional */
  teamLogoUrl?: string | null;
  /** Tag corto del equipo (ej: "RDG") — opcional */
  teamTag?: string | null;
}

export async function generateRosterCard(opts: RosterCardOptions): Promise<Buffer> {
  const { playerPhotoBuffer, nickname, teamRole, gameRole, teamLogoUrl, teamTag } = opts;

  // ── 1. Foto del jugador recortada a 2:3 (600×900) ──────────────────────────
  const playerPhoto = await sharp(playerPhotoBuffer)
    .resize(CARD_W, CARD_H, { fit: "cover", position: "top" })
    .png()
    .toBuffer();

  // ── 2. Overlay: gradiente oscuro en la parte inferior ──────────────────────
  // SVG con gradiente de negro transparente → negro sólido desde 50% hasta abajo
  const overlayGradient = Buffer.from(`
    <svg width="${CARD_W}" height="${CARD_H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.0"/>
          <stop offset="40%" stop-color="#000000" stop-opacity="0.2"/>
          <stop offset="65%" stop-color="#000000" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.95"/>
        </linearGradient>
      </defs>
      <rect width="${CARD_W}" height="${CARD_H}" fill="url(#grad)"/>
    </svg>
  `);

  // ── 3. Acento rojo superior (barra de 4px) ─────────────────────────────────
  const topAccent = Buffer.from(`
    <svg width="${CARD_W}" height="4" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="acc" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#ff1a1a"/>
          <stop offset="60%" stop-color="#cc0000"/>
          <stop offset="100%" stop-color="#330000"/>
        </linearGradient>
      </defs>
      <rect width="${CARD_W}" height="4" fill="url(#acc)"/>
    </svg>
  `);

  // ── 4. Franja inferior: panel oscuro con info del jugador ──────────────────
  const PANEL_H = 220;
  const PANEL_Y = CARD_H - PANEL_H;

  // Separador rojo
  const separatorSvg = Buffer.from(`
    <svg width="${CARD_W}" height="2" xmlns="http://www.w3.org/2000/svg">
      <rect width="${CARD_W}" height="2" fill="#cc0000" opacity="0.8"/>
    </svg>
  `);

  // ── 5. Texto: nick del jugador ─────────────────────────────────────────────
  const nickDisplay = truncate(escapeSvg(nickname), 18);
  // Calcular tamaño de fuente dinámico según longitud del nick
  const nickFontSize = nickname.length > 14 ? 42 : nickname.length > 10 ? 50 : 58;

  const nickSvg = Buffer.from(`
    <svg width="${CARD_W}" height="80" xmlns="http://www.w3.org/2000/svg">
      <text
        x="24"
        y="62"
        font-size="${nickFontSize}"
        font-weight="900"
        fill="white"
        font-family="'Noto Sans', 'DejaVu Sans', sans-serif"
        letter-spacing="-1"
      >${nickDisplay}</text>
    </svg>
  `);

  // ── 6. Texto: rol del equipo + rol del juego ───────────────────────────────
  const roleLabel = teamRole === "captain" ? "CAPITÁN"
    : teamRole === "substitute" ? "SUPLENTE"
    : teamRole === "coach" ? "COACH"
    : "JUGADOR";

  const gameRoleDisplay = gameRole ? ` · ${truncate(escapeSvg(gameRole), 20)}` : "";

  const roleSvg = Buffer.from(`
    <svg width="${CARD_W}" height="36" xmlns="http://www.w3.org/2000/svg">
      <text
        x="24"
        y="26"
        font-size="22"
        font-weight="700"
        fill="#cc3333"
        font-family="'Noto Sans', 'DejaVu Sans', sans-serif"
        letter-spacing="2"
      >${roleLabel}${gameRoleDisplay}</text>
    </svg>
  `);

  // ── 7. Tag del equipo (esquina superior derecha del panel) ─────────────────
  const tagDisplay = teamTag ? truncate(escapeSvg(teamTag.toUpperCase()), 6) : "";
  const tagSvg = tagDisplay ? Buffer.from(`
    <svg width="${CARD_W}" height="40" xmlns="http://www.w3.org/2000/svg">
      <rect x="${CARD_W - 110}" y="4" width="90" height="32" rx="4" fill="#cc0000" opacity="0.85"/>
      <text
        x="${CARD_W - 65}"
        y="26"
        font-size="18"
        font-weight="900"
        fill="white"
        font-family="'Noto Sans', 'DejaVu Sans', sans-serif"
        text-anchor="middle"
        letter-spacing="2"
      >${tagDisplay}</text>
    </svg>
  `) : null;

  // ── 8. Logo del equipo (si existe) ─────────────────────────────────────────
  let logoComposite: sharp.OverlayOptions | null = null;
  if (teamLogoUrl) {
    const logoBuf = await fetchImageBuffer(teamLogoUrl);
    if (logoBuf) {
      try {
        // Redimensionar logo a 72×72 con fondo circular oscuro
        const logoResized = await sharp(logoBuf)
          .resize(72, 72, { fit: "cover" })
          .png()
          .toBuffer();

        // Crear círculo de fondo para el logo
        const logoCircleBg = Buffer.from(`
          <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="38" fill="#1a1a1a" stroke="#cc0000" stroke-width="2" opacity="0.9"/>
          </svg>
        `);

        // Componer: fondo circular + logo centrado
        const logoComposed = await sharp(logoCircleBg)
          .composite([{ input: logoResized, top: 4, left: 4 }])
          .png()
          .toBuffer();

        logoComposite = {
          input: logoComposed,
          top: PANEL_Y + PANEL_H - 100,
          left: CARD_W - 110,
        };
      } catch {
        // Si falla la carga del logo, continuar sin él
      }
    }
  }

  // ── 9. Número de jugador / decoración (esquina superior izquierda) ─────────
  const decorSvg = Buffer.from(`
    <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
      <polygon points="0,0 60,0 0,60" fill="#cc0000" opacity="0.85"/>
    </svg>
  `);

  // ── 10. Composición final ──────────────────────────────────────────────────
  const composites: sharp.OverlayOptions[] = [
    // Gradiente oscuro sobre la foto
    { input: overlayGradient, top: 0, left: 0 },
    // Acento rojo superior
    { input: topAccent, top: 0, left: 0 },
    // Triángulo decorativo esquina superior izquierda
    { input: decorSvg, top: 0, left: 0 },
    // Separador rojo sobre el panel
    { input: separatorSvg, top: PANEL_Y, left: 0 },
    // Nick del jugador
    { input: nickSvg, top: PANEL_Y + 20, left: 0 },
    // Rol
    { input: roleSvg, top: PANEL_Y + 105, left: 0 },
  ];

  // Tag del equipo (si existe)
  if (tagSvg) {
    composites.push({ input: tagSvg, top: PANEL_Y + 10, left: 0 });
  }

  // Logo del equipo (si existe)
  if (logoComposite) {
    composites.push(logoComposite);
  }

  // Generar imagen final JPEG de alta calidad
  const result = await sharp(playerPhoto)
    .composite(composites)
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  return result;
}
