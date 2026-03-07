/**
 * RosterCard — Player Card estilo esports (Mar 2026)
 * Diseño con foto superior, datos de Riot, rango, rol y equipo.
 * Tema rojo RLC con hex pattern y accent line.
 */
import { Link } from "wouter";
import { Globe, Shield, User } from "lucide-react";

// ─── Tier colors ──────────────────────────────────────────────────────────────
const TIER_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  IRON:        { text: "#9E9E9E", bg: "rgba(158,158,158,0.12)", border: "rgba(158,158,158,0.30)" },
  BRONZE:      { text: "#CD7F32", bg: "rgba(205,127,50,0.12)",  border: "rgba(205,127,50,0.30)"  },
  SILVER:      { text: "#C0C0C0", bg: "rgba(192,192,192,0.12)", border: "rgba(192,192,192,0.30)" },
  GOLD:        { text: "#FFD700", bg: "rgba(255,215,0,0.12)",   border: "rgba(255,215,0,0.30)"   },
  PLATINUM:    { text: "#00B4D8", bg: "rgba(0,180,216,0.12)",   border: "rgba(0,180,216,0.30)"   },
  EMERALD:     { text: "#50C878", bg: "rgba(80,200,120,0.12)",  border: "rgba(80,200,120,0.30)"  },
  DIAMOND:     { text: "#B9F2FF", bg: "rgba(185,242,255,0.12)", border: "rgba(185,242,255,0.30)" },
  MASTER:      { text: "#9B59B6", bg: "rgba(155,89,182,0.12)",  border: "rgba(155,89,182,0.30)"  },
  GRANDMASTER: { text: "#E74C3C", bg: "rgba(231,76,60,0.12)",   border: "rgba(231,76,60,0.30)"   },
  CHALLENGER:  { text: "#F1C40F", bg: "rgba(241,196,15,0.12)",  border: "rgba(241,196,15,0.30)"  },
  RADIANT:     { text: "#FFFDE7", bg: "rgba(255,253,231,0.12)", border: "rgba(255,253,231,0.30)" },
  IMMORTAL:    { text: "#E74C3C", bg: "rgba(231,76,60,0.12)",   border: "rgba(231,76,60,0.30)"   },
  ASCENDANT:   { text: "#50C878", bg: "rgba(80,200,120,0.12)",  border: "rgba(80,200,120,0.30)"  },
  UNRANKED:    { text: "#6B7280", bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.30)" },
};
function getTierColors(elo?: string | null) {
  if (!elo) return TIER_COLORS.UNRANKED;
  return TIER_COLORS[elo.toUpperCase()] ?? TIER_COLORS.UNRANKED;
}
const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E")`;

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface RosterCardProps {
  playerName: string;
  realName?: string;
  role?: string;
  region?: string;
  game?: string;
  elo?: string | null;
  photoUrl?: string | null;
  team?: string | null;
  teamLogo?: string | null;
  stats?: { wins?: number; losses?: number; kda?: number };
  userId?: number;
  isCaptain?: boolean;
  /** Colores del tier pre-calculados desde Riot (opcional, sobreescribe el cálculo interno) */
  eloTierColors?: { text: string; bg: string; border: string };
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function RosterCard({
  playerName,
  realName,
  role,
  region,
  game,
  elo,
  photoUrl,
  team,
  teamLogo,
  stats,
  userId,
  isCaptain = false,
  eloTierColors,
}: RosterCardProps) {
  const tierColors = eloTierColors ?? getTierColors(elo);
  const eloLabel = elo ? (elo.charAt(0).toUpperCase() + elo.slice(1).toLowerCase()) : null;
  const isValorant = game === "Valorant";
  const gameLabel = game
    ? isValorant
      ? "VALORANT"
      : game === "League of Legends"
      ? "LEAGUE OF LEGENDS"
      : game.toUpperCase()
    : null;

  const inner = (
    <div
      className="relative rounded-2xl overflow-hidden w-full"
      style={{
        background: "linear-gradient(160deg, #160a0a 0%, #2a0d0d 45%, #120808 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 0 30px rgba(192,57,43,0.10)",
        transition: "transform 0.18s, box-shadow 0.18s",
      }}
      onMouseEnter={(e) => {
        if (userId) {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 16px 50px rgba(0,0,0,0.65), 0 0 40px rgba(192,57,43,0.18)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 8px 40px rgba(0,0,0,0.55), 0 0 30px rgba(192,57,43,0.10)";
      }}
    >
      {/* Hex pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: HEX_PATTERN, opacity: 0.035, zIndex: 0 }}
      />
      {/* Accent line top */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          height: "3px",
          background: "linear-gradient(90deg, transparent, #c0392b, #ff6b6b, #c0392b, transparent)",
          zIndex: 10,
        }}
      />

      {/* ── Foto del jugador ── */}
      <div className="relative overflow-hidden" style={{ height: "220px", zIndex: 1 }}>
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={playerName}
            className="w-full h-full object-cover object-top"
            draggable={false}
            style={{ filter: "brightness(0.92) contrast(1.05)" }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.3)" }}
          >
            <User className="w-16 h-16" style={{ color: "rgba(255,255,255,0.08)" }} />
          </div>
        )}
        {/* Gradient bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: "60%",
            background:
              "linear-gradient(to top, rgba(18,8,8,1) 0%, rgba(18,8,8,0.5) 50%, transparent 100%)",
          }}
        />
        {/* Badge capitán */}
        {isCaptain && (
          <div
            className="absolute top-3 right-3 flex items-center gap-1 text-black text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg"
            style={{ background: "#FFD700", zIndex: 5 }}
          >
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-black" aria-hidden="true">
              <path d="M2 19l2-9 4 4 4-8 4 8 4-4 2 9H2z" />
            </svg>
            CAP
          </div>
        )}
        {/* Game label top-left */}
        {gameLabel && (
          <div className="absolute top-3 left-3" style={{ zIndex: 5 }}>
            <span
              className="font-mono text-[9px] tracking-widest px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(0,0,0,0.55)",
                color: "rgba(255,255,255,0.40)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {gameLabel}
            </span>
          </div>
        )}
      </div>

      {/* ── Info del jugador ── */}
      <div className="relative px-4 pb-4 pt-2" style={{ zIndex: 2 }}>
        {/* Nombre */}
        <h2
          className="font-orbitron text-xl font-black text-white leading-tight mb-0.5"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}
        >
          {playerName}
        </h2>
        {realName && (
          <p className="font-mono text-[11px] mb-2.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            {realName}
          </p>
        )}

        {/* Badges rol + región */}
        {(role || region) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {role && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[11px] font-bold"
                style={{
                  background: "rgba(192,57,43,0.15)",
                  border: "1px solid rgba(192,57,43,0.40)",
                  color: "#e74c3c",
                }}
              >
                {role}
              </span>
            )}
            {region && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[11px] font-bold"
                style={{
                  background: "rgba(52,152,219,0.12)",
                  border: "1px solid rgba(52,152,219,0.30)",
                  color: "#5dade2",
                }}
              >
                <Globe className="w-3 h-3" /> {region}
              </span>
            )}
          </div>
        )}

        {/* Separador */}
        <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", marginBottom: "10px" }} />

        {/* Datos */}
        <div className="space-y-2">
          {/* Rango */}
          {eloLabel && (
            <div className="flex justify-between items-center">
              <span className="font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                Rango
              </span>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold"
                style={{
                  background: tierColors.bg,
                  border: `1px solid ${tierColors.border}`,
                  color: tierColors.text,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: tierColors.text }} />
                {eloLabel}
              </span>
            </div>
          )}
          {/* Stats W/L */}
          {(stats?.wins !== undefined || stats?.losses !== undefined) && (
            <div className="flex justify-between items-center">
              <span className="font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                W / L
              </span>
              <span className="font-mono text-[11px] font-bold">
                <span style={{ color: "#2ecc71" }}>{stats?.wins ?? 0}W</span>
                <span style={{ color: "rgba(255,255,255,0.25)" }}> / </span>
                <span style={{ color: "#e74c3c" }}>{stats?.losses ?? 0}L</span>
              </span>
            </div>
          )}
          {/* Equipo */}
          {(team || teamLogo) && (
            <div
              className="flex justify-between items-center pt-2 mt-1"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                Equipo
              </span>
              <div className="flex items-center gap-1.5">
                {teamLogo ? (
                  <img src={teamLogo} alt="" className="w-4 h-4 object-contain rounded" />
                ) : (
                  <Shield className="w-3 h-3" style={{ color: "rgba(255,255,255,0.25)" }} />
                )}
                <span className="font-mono text-[11px] font-bold" style={{ color: "#e74c3c" }}>
                  {team}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (userId) {
    return (
      <Link href={`/profile/${userId}`} style={{ textDecoration: "none", display: "block" }}>
        {inner}
      </Link>
    );
  }
  return inner;
}
