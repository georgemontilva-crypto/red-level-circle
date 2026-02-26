/**
 * RosterCard — Tarjeta de jugador esports premium.
 *
 * Props compatibles con la estructura del usuario:
 *   playerName, realName, role, region, game, photoUrl, team, stats
 */

import { Link } from "wouter";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Role = "top" | "jungle" | "mid" | "adc" | "support";
type Region = "NA" | "EU" | "KR" | "CN" | "BR" | "LAN" | "LAS" | string;

export interface RosterCardProps {
  /** Nickname del jugador */
  playerName: string;
  /** Nombre real */
  realName?: string;
  /** Rol del jugador */
  role?: Role | string;
  /** Región competitiva */
  region?: Region;
  /** Juego */
  game?: string;
  /** URL de la foto del jugador */
  photoUrl?: string | null;
  /** Nombre del equipo */
  team?: string | null;
  /** Logo del equipo */
  teamLogo?: string | null;
  /** Stats del jugador */
  stats?: {
    wins?: number;
    losses?: number;
    kda?: number;
  };
  /** ID del usuario para hacer la tarjeta clickeable */
  userId?: number;
  /** Si el jugador es capitán */
  isCaptain?: boolean;
  /** Color de acento (hex) */
  accentColor?: string;
  /** Rango / ELO */
  rank?: string | null;
  /** Color del rango */
  rankColor?: string;
  /** Escala visual (1 = 320px ancho) */
  scale?: number;
}

// ─── Mapeo de roles ───────────────────────────────────────────────────────────

const ROLE_META: Record<string, { label: string; icon: string; color: string }> = {
  top:     { label: "TOP",     icon: "/role-top.svg",     color: "#f97316" },
  jungle:  { label: "JGL",     icon: "/role-jungle.svg",  color: "#22c55e" },
  mid:     { label: "MID",     icon: "/role-mid.svg",     color: "#3b82f6" },
  adc:     { label: "ADC",     icon: "/role-adc.svg",     color: "#ef4444" },
  support: { label: "SUP",     icon: "/role-support.svg", color: "#a855f7" },
  // Valorant
  duelist:    { label: "DUE",  icon: "/role-adc.svg",     color: "#ef4444" },
  initiator:  { label: "INI",  icon: "/role-mid.svg",     color: "#3b82f6" },
  controller: { label: "CTR",  icon: "/role-jungle.svg",  color: "#22c55e" },
  sentinel:   { label: "SEN",  icon: "/role-support.svg", color: "#a855f7" },
  flex:       { label: "FLX",  icon: "/role-top.svg",     color: "#f97316" },
  // CS
  entry:   { label: "ENT",     icon: "/role-adc.svg",     color: "#ef4444" },
  awper:   { label: "AWP",     icon: "/role-mid.svg",     color: "#3b82f6" },
  lurker:  { label: "LRK",     icon: "/role-jungle.svg",  color: "#22c55e" },
  igl:     { label: "IGL",     icon: "/role-top.svg",     color: "#f97316" },
};

function getRoleMeta(role?: string) {
  if (!role) return null;
  return ROLE_META[role.toLowerCase()] ?? { label: role.toUpperCase().slice(0, 3), icon: null, color: "#a1a1aa" };
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
  const W = Math.round(320 * scale);
  const H = Math.round(440 * scale);
  const R = Math.round(16 * scale);

  const roleMeta = getRoleMeta(role);
  const borderColor = isCaptain ? "#fbbf24" : (roleMeta?.color ?? accentColor);

  // Win rate
  const totalGames = (stats?.wins ?? 0) + (stats?.losses ?? 0);
  const winRate = totalGames > 0 ? Math.round(((stats?.wins ?? 0) / totalGames) * 100) : null;
  const winRateColor = winRate === null ? "#52525b" : winRate >= 60 ? "#4ade80" : winRate >= 45 ? "#facc15" : "#f87171";

  const card = (
    <div
      className="relative overflow-hidden select-none group cursor-pointer"
      style={{
        width: W,
        height: H,
        borderRadius: R,
        background: "#0d0d0f",
        border: `1px solid ${borderColor}28`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px ${borderColor}14`,
        flexShrink: 0,
        transition: "transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = `translateY(${Math.round(-5 * scale)}px) scale(1.01)`;
        el.style.boxShadow = `0 16px 48px rgba(0,0,0,0.75), 0 0 0 1px ${borderColor}55, 0 0 32px ${borderColor}18`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(0) scale(1)";
        el.style.boxShadow = `0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px ${borderColor}14`;
      }}
    >
      {/* ── FOTO (zona superior ~60%) ── */}
      <div
        className="absolute top-0 left-0 right-0 overflow-hidden"
        style={{ height: Math.round(H * 0.60) }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={playerName}
            className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.05]"
            draggable={false}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(160deg, ${borderColor}14 0%, #0d0d0f 100%)` }}
          >
            <span
              className="font-grotesk font-black text-white/8 uppercase leading-none"
              style={{ fontSize: Math.round(160 * scale) }}
            >
              {playerName.charAt(0)}
            </span>
          </div>
        )}

        {/* Gradiente inferior de la foto */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: Math.round(H * 0.30),
            background: "linear-gradient(to top, #0d0d0f 0%, #0d0d0f88 40%, transparent 100%)",
          }}
        />

        {/* Badge de rol — esquina superior izquierda */}
        {roleMeta && (
          <div
            className="absolute flex items-center gap-1"
            style={{
              top: Math.round(10 * scale),
              left: Math.round(10 * scale),
              background: "rgba(0,0,0,0.72)",
              border: `1px solid ${roleMeta.color}55`,
              borderRadius: Math.round(20 * scale),
              padding: `${Math.round(4 * scale)}px ${Math.round(9 * scale)}px`,
              backdropFilter: "blur(8px)",
            }}
          >
            {roleMeta.icon && (
              <img
                src={roleMeta.icon}
                alt={roleMeta.label}
                style={{
                  width: Math.round(12 * scale),
                  height: Math.round(12 * scale),
                  filter: "invert(1)",
                  opacity: 0.85,
                  objectFit: "contain",
                }}
              />
            )}
            <span
              className="font-grotesk font-bold uppercase tracking-widest"
              style={{ fontSize: Math.round(9 * scale), color: roleMeta.color, letterSpacing: "0.12em" }}
            >
              {roleMeta.label}
            </span>
          </div>
        )}

        {/* Badge capitán — esquina superior derecha */}
        {isCaptain && (
          <div
            className="absolute flex items-center gap-1"
            style={{
              top: Math.round(10 * scale),
              right: Math.round(10 * scale),
              background: "rgba(0,0,0,0.72)",
              border: "1px solid #fbbf2455",
              borderRadius: Math.round(20 * scale),
              padding: `${Math.round(4 * scale)}px ${Math.round(9 * scale)}px`,
              backdropFilter: "blur(8px)",
            }}
          >
            <svg viewBox="0 0 24 24" fill="#fbbf24" style={{ width: Math.round(10 * scale), height: Math.round(10 * scale) }}>
              <path d="M2 19l2-9 4 4 4-8 4 8 4-4 2 9H2z" />
            </svg>
            <span
              className="font-grotesk font-bold uppercase"
              style={{ fontSize: Math.round(9 * scale), color: "#fbbf24", letterSpacing: "0.12em" }}
            >
              CAP
            </span>
          </div>
        )}

        {/* Región — esquina inferior derecha de la foto */}
        {region && (
          <div
            className="absolute"
            style={{
              bottom: Math.round(10 * scale),
              right: Math.round(10 * scale),
              background: "rgba(0,0,0,0.65)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: Math.round(6 * scale),
              padding: `${Math.round(2 * scale)}px ${Math.round(7 * scale)}px`,
              backdropFilter: "blur(6px)",
            }}
          >
            <span
              className="font-grotesk font-bold uppercase"
              style={{ fontSize: Math.round(9 * scale), color: "rgba(255,255,255,0.45)", letterSpacing: "0.10em" }}
            >
              {region}
            </span>
          </div>
        )}
      </div>

      {/* ── ZONA INFO (parte inferior ~40%) ── */}
      <div
        className="absolute left-0 right-0 bottom-0 flex flex-col"
        style={{
          height: Math.round(H * 0.44),
          padding: `${Math.round(14 * scale)}px ${Math.round(16 * scale)}px ${Math.round(14 * scale)}px`,
        }}
      >
        {/* Línea de acento superior */}
        <div
          style={{
            width: Math.round(32 * scale),
            height: Math.round(2 * scale),
            background: borderColor,
            borderRadius: 2,
            marginBottom: Math.round(8 * scale),
            opacity: 0.85,
          }}
        />

        {/* Nickname */}
        <h2
          className="font-grotesk font-black text-white leading-none truncate"
          style={{
            fontSize: Math.round(24 * scale),
            letterSpacing: "-0.02em",
            marginBottom: Math.round(3 * scale),
            textShadow: "0 2px 10px rgba(0,0,0,0.9)",
          }}
        >
          {playerName}
        </h2>

        {/* Nombre real */}
        {realName && (
          <p
            className="font-grotesk truncate"
            style={{
              fontSize: Math.round(10 * scale),
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.04em",
              marginBottom: Math.round(10 * scale),
            }}
          >
            {realName}
          </p>
        )}

        {/* Separador */}
        <div
          style={{
            height: Math.round(1 * scale),
            background: "rgba(255,255,255,0.06)",
            marginBottom: Math.round(10 * scale),
          }}
        />

        {/* Fila: Stats + Logo equipo */}
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1">
            {/* Rango o stats */}
            {rank ? (
              <span
                className="font-grotesk font-bold leading-none"
                style={{
                  fontSize: Math.round(11 * scale),
                  color: rankColor,
                  textShadow: `0 0 10px ${rankColor}44`,
                  letterSpacing: "0.04em",
                }}
              >
                {rank}
              </span>
            ) : game ? (
              <span
                className="font-grotesk leading-none truncate"
                style={{
                  fontSize: Math.round(9 * scale),
                  color: "rgba(255,255,255,0.28)",
                  letterSpacing: "0.05em",
                  maxWidth: Math.round(180 * scale),
                }}
              >
                {game}
              </span>
            ) : null}

            {/* Stats: W/L y KDA */}
            {stats && (
              <div className="flex items-center gap-2 flex-wrap">
                {winRate !== null && (
                  <span
                    className="font-grotesk font-bold"
                    style={{ fontSize: Math.round(10 * scale), color: winRateColor }}
                  >
                    {winRate}% WR
                  </span>
                )}
                {stats.wins !== undefined && stats.losses !== undefined && (
                  <span
                    className="font-grotesk"
                    style={{ fontSize: Math.round(9 * scale), color: "rgba(255,255,255,0.28)" }}
                  >
                    {stats.wins}V {stats.losses}D
                  </span>
                )}
                {stats.kda !== undefined && (
                  <span
                    className="font-grotesk font-semibold"
                    style={{ fontSize: Math.round(10 * scale), color: "rgba(255,255,255,0.55)" }}
                  >
                    {stats.kda.toFixed(1)} KDA
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Logo del equipo o nombre del equipo */}
          {(teamLogo || team) && (
            <div
              className="overflow-hidden flex items-center justify-center shrink-0"
              style={{
                width: Math.round(34 * scale),
                height: Math.round(34 * scale),
                borderRadius: Math.round(8 * scale),
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              {teamLogo ? (
                <img
                  src={teamLogo}
                  alt={team ?? ""}
                  className="w-full h-full object-contain p-0.5"
                />
              ) : (
                <span
                  className="font-grotesk font-black text-white/40 uppercase"
                  style={{ fontSize: Math.round(12 * scale) }}
                >
                  {team?.charAt(0) ?? "?"}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── BORDE INFERIOR con gradiente de acento ── */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: Math.round(2 * scale),
          background: `linear-gradient(90deg, ${borderColor}88, transparent 70%)`,
        }}
      />
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
