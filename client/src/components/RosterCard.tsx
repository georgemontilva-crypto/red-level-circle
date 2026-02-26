/**
 * RosterCard — Layout horizontal esports premium.
 *
 * Referencia visual:
 *   - Foto a la izquierda (55% del ancho), ocupa toda la altura
 *   - Panel derecho oscuro con info estructurada en filas
 *   - Badge circular del rol en la esquina superior de la foto (overlap)
 *   - Borde exterior con color de acento (dorado para capitán, color del rol para otros)
 *   - Nick grande + nombre real + separador + región + juego + equipo + stats W/L KDA
 */

import { Link } from "wouter";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface RosterCardProps {
  playerName: string;
  realName?: string;
  role?: string;
  region?: string;
  game?: string;
  photoUrl?: string | null;
  team?: string | null;
  teamLogo?: string | null;
  stats?: { wins?: number; losses?: number; kda?: number };
  userId?: number;
  isCaptain?: boolean;
  accentColor?: string;
  rank?: string | null;
  rankColor?: string;
  /** Escala visual (1 = 380px ancho, 240px alto) */
  scale?: number;
}

// ─── Mapeo de roles ───────────────────────────────────────────────────────────

const ROLE_META: Record<string, { label: string; icon: string; color: string }> = {
  top:        { label: "TOP",  icon: "/role-top.svg",     color: "#f97316" },
  jungle:     { label: "JGL",  icon: "/role-jungle.svg",  color: "#22c55e" },
  mid:        { label: "MID",  icon: "/role-mid.svg",     color: "#facc15" },
  adc:        { label: "ADC",  icon: "/role-adc.svg",     color: "#ef4444" },
  support:    { label: "SUP",  icon: "/role-support.svg", color: "#a855f7" },
  duelist:    { label: "DUE",  icon: "/role-adc.svg",     color: "#ef4444" },
  initiator:  { label: "INI",  icon: "/role-mid.svg",     color: "#3b82f6" },
  controller: { label: "CTR",  icon: "/role-jungle.svg",  color: "#22c55e" },
  sentinel:   { label: "SEN",  icon: "/role-support.svg", color: "#a855f7" },
  flex:       { label: "FLX",  icon: "/role-top.svg",     color: "#f97316" },
  entry:      { label: "ENT",  icon: "/role-adc.svg",     color: "#ef4444" },
  awper:      { label: "AWP",  icon: "/role-mid.svg",     color: "#3b82f6" },
  lurker:     { label: "LRK",  icon: "/role-jungle.svg",  color: "#22c55e" },
  igl:        { label: "IGL",  icon: "/role-top.svg",     color: "#f97316" },
};

function getRoleMeta(role?: string) {
  if (!role) return null;
  return ROLE_META[role.toLowerCase()] ?? {
    label: role.toUpperCase().slice(0, 3),
    icon: null,
    color: "#a1a1aa",
  };
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function RosterCard({
  playerName,
  realName,
  role,
  region,
  game,
  photoUrl,
  team,
  teamLogo,
  stats,
  userId,
  isCaptain = false,
  accentColor = "#dc2626",
  rank,
  rankColor = "#e8d48b",
  scale = 1,
}: RosterCardProps) {
  const W  = Math.round(380 * scale);
  const H  = Math.round(240 * scale);
  const R  = Math.round(12 * scale);
  const PHOTO_W = Math.round(W * 0.52); // foto ocupa ~52% del ancho
  const INFO_W  = W - PHOTO_W;

  const roleMeta   = getRoleMeta(role);
  const badgeColor = isCaptain ? "#fbbf24" : (roleMeta?.color ?? accentColor);

  // Win rate
  const totalGames = (stats?.wins ?? 0) + (stats?.losses ?? 0);
  const winRate    = totalGames > 0 ? Math.round(((stats?.wins ?? 0) / totalGames) * 100) : null;
  const wrColor    = winRate === null ? "#52525b"
    : winRate >= 60 ? "#4ade80"
    : winRate >= 45 ? "#facc15"
    : "#f87171";

  // Tamaños tipográficos escalados
  const fs = (base: number) => Math.round(base * scale);

  const card = (
    <div
      className="relative overflow-visible select-none group cursor-pointer flex"
      style={{
        width: W,
        height: H,
        borderRadius: R,
        border: `1.5px solid ${badgeColor}55`,
        boxShadow: `0 6px 28px rgba(0,0,0,0.65), 0 0 0 1px ${badgeColor}18`,
        background: "#0d0d0f",
        flexShrink: 0,
        transition: "transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = `translateY(${Math.round(-4 * scale)}px)`;
        el.style.boxShadow = `0 18px 48px rgba(0,0,0,0.75), 0 0 0 1.5px ${badgeColor}88, 0 0 24px ${badgeColor}22`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = `0 6px 28px rgba(0,0,0,0.65), 0 0 0 1px ${badgeColor}18`;
      }}
    >
      {/* ══════════════════════════════════════════
          COLUMNA IZQUIERDA — FOTO
      ══════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden shrink-0"
        style={{
          width: PHOTO_W,
          height: H,
          borderRadius: `${R}px 0 0 ${R}px`,
        }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={playerName}
            className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
            draggable={false}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(160deg, ${badgeColor}14 0%, #0d0d0f 100%)` }}
          >
            <span
              className="font-grotesk font-black text-white/10 uppercase leading-none"
              style={{ fontSize: fs(110) }}
            >
              {playerName.charAt(0)}
            </span>
          </div>
        )}

        {/* Gradiente derecho: transición suave hacia el panel info */}
        <div
          className="absolute inset-y-0 right-0"
          style={{
            width: Math.round(PHOTO_W * 0.35),
            background: "linear-gradient(to right, transparent, #0d0d0f)",
          }}
        />

        {/* ── Badge circular del rol (overlap en esquina superior derecha de la foto) ── */}
        {roleMeta && (
          <div
            className="absolute flex flex-col items-center justify-center z-10"
            style={{
              top: Math.round(-1 * scale),
              right: Math.round(-18 * scale),
              width: Math.round(56 * scale),
              height: Math.round(56 * scale),
              borderRadius: "50%",
              background: "#0d0d0f",
              border: `2px solid ${badgeColor}`,
              boxShadow: `0 0 16px ${badgeColor}44`,
            }}
          >
            {roleMeta.icon ? (
              <img
                src={roleMeta.icon}
                alt={roleMeta.label}
                style={{
                  width: Math.round(22 * scale),
                  height: Math.round(22 * scale),
                  filter: "invert(1)",
                  opacity: 0.9,
                  objectFit: "contain",
                  marginBottom: Math.round(2 * scale),
                }}
              />
            ) : (
              <span
                className="font-grotesk font-black"
                style={{ fontSize: fs(11), color: badgeColor }}
              >
                {roleMeta.label}
              </span>
            )}
            <span
              className="font-grotesk font-bold uppercase leading-none"
              style={{ fontSize: fs(8), color: badgeColor, letterSpacing: "0.08em" }}
            >
              {roleMeta.label}
            </span>
          </div>
        )}

        {/* Badge capitán */}
        {isCaptain && (
          <div
            className="absolute flex items-center gap-1"
            style={{
              bottom: Math.round(8 * scale),
              left: Math.round(8 * scale),
              background: "rgba(0,0,0,0.72)",
              border: "1px solid #fbbf2455",
              borderRadius: Math.round(20 * scale),
              padding: `${fs(3)}px ${fs(7)}px`,
              backdropFilter: "blur(8px)",
            }}
          >
            <svg viewBox="0 0 24 24" fill="#fbbf24" style={{ width: fs(9), height: fs(9) }}>
              <path d="M2 19l2-9 4 4 4-8 4 8 4-4 2 9H2z" />
            </svg>
            <span
              className="font-grotesk font-bold uppercase"
              style={{ fontSize: fs(8), color: "#fbbf24", letterSpacing: "0.12em" }}
            >
              CAP
            </span>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          COLUMNA DERECHA — INFO
      ══════════════════════════════════════════ */}
      <div
        className="flex flex-col justify-center"
        style={{
          width: INFO_W,
          padding: `${fs(16)}px ${fs(16)}px ${fs(16)}px ${fs(22)}px`,
          gap: fs(4),
        }}
      >
        {/* Nick */}
        <h2
          className="font-grotesk font-black text-white leading-none truncate"
          style={{ fontSize: fs(20), letterSpacing: "-0.01em" }}
        >
          {playerName.toUpperCase()}
        </h2>

        {/* Nombre real */}
        {realName && (
          <p
            className="font-grotesk truncate"
            style={{ fontSize: fs(10), color: "rgba(255,255,255,0.38)", letterSpacing: "0.02em" }}
          >
            {realName}
          </p>
        )}

        {/* Separador */}
        <div
          style={{
            width: fs(24),
            height: fs(2),
            background: badgeColor,
            borderRadius: 2,
            opacity: 0.85,
            marginTop: fs(2),
            marginBottom: fs(2),
          }}
        />

        {/* Región */}
        {region && (
          <div className="flex items-center gap-1.5">
            <span
              className="font-grotesk font-bold uppercase"
              style={{ fontSize: fs(9), color: "rgba(255,255,255,0.35)", letterSpacing: "0.10em" }}
            >
              REGION
            </span>
            <span
              className="font-grotesk font-black"
              style={{ fontSize: fs(11), color: "rgba(255,255,255,0.75)", letterSpacing: "0.06em" }}
            >
              {region}
            </span>
          </div>
        )}

        {/* Juego */}
        {game && (
          <div className="flex flex-col" style={{ gap: fs(1) }}>
            <span
              className="font-grotesk font-bold uppercase"
              style={{ fontSize: fs(8), color: "rgba(255,255,255,0.28)", letterSpacing: "0.10em" }}
            >
              GAME
            </span>
            <span
              className="font-grotesk font-semibold truncate"
              style={{ fontSize: fs(11), color: "rgba(255,255,255,0.75)" }}
            >
              {game}
            </span>
          </div>
        )}

        {/* Equipo */}
        {(team || teamLogo) && (
          <div className="flex flex-col" style={{ gap: fs(1) }}>
            <span
              className="font-grotesk font-bold uppercase"
              style={{ fontSize: fs(8), color: "rgba(255,255,255,0.28)", letterSpacing: "0.10em" }}
            >
              TEAM
            </span>
            <div className="flex items-center gap-1.5">
              {teamLogo && (
                <img
                  src={teamLogo}
                  alt={team ?? ""}
                  style={{ width: fs(14), height: fs(14), objectFit: "contain" }}
                />
              )}
              <span
                className="font-grotesk font-bold truncate"
                style={{ fontSize: fs(11), color: "rgba(255,255,255,0.75)" }}
              >
                {team}
              </span>
            </div>
          </div>
        )}

        {/* Rango */}
        {rank && (
          <div className="flex flex-col" style={{ gap: fs(1) }}>
            <span
              className="font-grotesk font-bold uppercase"
              style={{ fontSize: fs(8), color: "rgba(255,255,255,0.28)", letterSpacing: "0.10em" }}
            >
              RANK
            </span>
            <span
              className="font-grotesk font-bold"
              style={{ fontSize: fs(11), color: rankColor, textShadow: `0 0 8px ${rankColor}44` }}
            >
              {rank}
            </span>
          </div>
        )}

        {/* Stats W/L y KDA */}
        {stats && (stats.wins !== undefined || stats.kda !== undefined) && (
          <>
            {/* Separador sutil */}
            <div
              style={{
                height: fs(1),
                background: "rgba(255,255,255,0.06)",
                marginTop: fs(2),
                marginBottom: fs(2),
              }}
            />
            <div className="flex items-end gap-4">
              {stats.wins !== undefined && stats.losses !== undefined && (
                <div className="flex flex-col" style={{ gap: fs(1) }}>
                  <span
                    className="font-grotesk font-bold uppercase"
                    style={{ fontSize: fs(8), color: "rgba(255,255,255,0.28)", letterSpacing: "0.10em" }}
                  >
                    W/L
                  </span>
                  <span
                    className="font-grotesk font-black"
                    style={{ fontSize: fs(13), color: wrColor }}
                  >
                    {stats.wins}W {stats.losses}L
                  </span>
                </div>
              )}
              {stats.kda !== undefined && (
                <div className="flex flex-col" style={{ gap: fs(1) }}>
                  <span
                    className="font-grotesk font-bold uppercase"
                    style={{ fontSize: fs(8), color: "rgba(255,255,255,0.28)", letterSpacing: "0.10em" }}
                  >
                    KDA
                  </span>
                  <span
                    className="font-grotesk font-black"
                    style={{ fontSize: fs(13), color: "rgba(255,255,255,0.80)" }}
                  >
                    {stats.kda.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (userId) {
    return (
      <Link href={`/profile/${userId}`} className="block" style={{ width: W, flexShrink: 0 }}>
        {card}
      </Link>
    );
  }

  return card;
}
