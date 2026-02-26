/**
 * RosterCard — Esports Premium
 *
 * Layout: 60% foto izquierda / 40% panel info derecho
 * Paleta: negro + dorado (#FFD700)
 * Sin emojis · Sin duplicar rol · Sin colores chillones
 *
 * Spec: pasted_content_3.txt + pasted_content_4.txt (Feb 2026)
 */

import { Link } from "wouter";
import "./RosterCard.css";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface RosterCardProps {
  playerName: string;
  realName?: string;
  /** Slug del rol: top | jungle | mid | adc | support | duelist | etc. */
  role?: string;
  /** Código de región: NA | EU | KR | CN | BR | LAN | LAS | etc. */
  region?: string;
  game?: string;
  photoUrl?: string | null;
  team?: string | null;
  teamLogo?: string | null;
  stats?: { wins?: number; losses?: number; kda?: number };
  userId?: number;
  isCaptain?: boolean;
}

// ─── Mapeo de roles ───────────────────────────────────────────────────────────

const ROLE_META: Record<string, { label: string; icon: string }> = {
  top:        { label: "TOP",  icon: "/role-top.svg"     },
  jungle:     { label: "JGL",  icon: "/role-jungle.svg"  },
  mid:        { label: "MID",  icon: "/role-mid.svg"     },
  adc:        { label: "ADC",  icon: "/role-adc.svg"     },
  support:    { label: "SUP",  icon: "/role-support.svg" },
  // Valorant / otros juegos — reutilizan iconos disponibles
  duelist:    { label: "DUE",  icon: "/role-adc.svg"     },
  initiator:  { label: "INI",  icon: "/role-mid.svg"     },
  controller: { label: "CTR",  icon: "/role-jungle.svg"  },
  sentinel:   { label: "SEN",  icon: "/role-support.svg" },
  flex:       { label: "FLX",  icon: "/role-top.svg"     },
  entry:      { label: "ENT",  icon: "/role-adc.svg"     },
  awper:      { label: "AWP",  icon: "/role-mid.svg"     },
  lurker:     { label: "LRK",  icon: "/role-jungle.svg"  },
  igl:        { label: "IGL",  icon: "/role-top.svg"     },
};

function getRoleMeta(role?: string) {
  if (!role) return null;
  return ROLE_META[role.toLowerCase()] ?? {
    label: role.toUpperCase().slice(0, 3),
    icon: null,
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
}: RosterCardProps) {
  const roleMeta = getRoleMeta(role);

  const totalGames = (stats?.wins ?? 0) + (stats?.losses ?? 0);
  const hasStats = totalGames > 0 || (stats?.kda !== undefined && stats.kda > 0);

  const inner = (
    <div className="roster-card">
      {/* ══ COLUMNA IZQUIERDA — FOTO (60%) ══ */}
      <div className="roster-card__photo-container">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={playerName}
            className="roster-card__photo"
            draggable={false}
          />
        ) : (
          <div className="roster-card__photo-placeholder">
            <span className="roster-card__photo-placeholder-letter">
              {playerName.charAt(0)}
            </span>
          </div>
        )}

        {/* Fade suave hacia el panel info */}
        <div className="roster-card__photo-fade" aria-hidden="true" />

        {/* Badge circular del rol — icono + label, SIN duplicar */}
        {roleMeta && (
          <div className="roster-card__role-badge" aria-label={`Rol: ${roleMeta.label}`}>
            {roleMeta.icon ? (
              <img
                src={roleMeta.icon}
                alt=""
                className="roster-card__role-icon"
              />
            ) : null}
            <span className="roster-card__role-label">{roleMeta.label}</span>
          </div>
        )}

        {/* Badge de capitán — posicionado dentro de la foto */}
        {isCaptain && (
          <div className="roster-card__captain-badge">
            <svg viewBox="0 0 24 24" className="roster-card__captain-icon" aria-hidden="true">
              <path d="M2 19l2-9 4 4 4-8 4 8 4-4 2 9H2z" />
            </svg>
            <span className="roster-card__captain-label">CAP</span>
          </div>
        )}
      </div>

      {/* ══ COLUMNA DERECHA — INFO (40%) ══ */}
      <div className="roster-card__info">
        {/* Nombre */}
        <div className="roster-card__name-section">
          <h2 className="roster-card__player-name">{playerName}</h2>
          {realName && (
            <p className="roster-card__real-name">{realName}</p>
          )}
        </div>

        {/* Divider dorado → transparente */}
        <div className="roster-card__divider" aria-hidden="true" />

        {/* Meta info */}
        <div className="roster-card__meta">
          {/* Región */}
          {region && (
            <div className="roster-card__region">
              <span className="roster-card__region-text">{region}</span>
            </div>
          )}

          {/* Juego */}
          {game && (
            <div className="roster-card__field">
              <span className="roster-card__field-label">GAME</span>
              <span className="roster-card__field-value">{game}</span>
            </div>
          )}

          {/* Equipo */}
          {(team || teamLogo) && (
            <div className="roster-card__field">
              <span className="roster-card__field-label">TEAM</span>
              <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                {teamLogo && (
                  <img
                    src={teamLogo}
                    alt=""
                    style={{ width: 14, height: 14, objectFit: "contain", flexShrink: 0 }}
                  />
                )}
                <span className="roster-card__field-value">{team}</span>
              </div>
            </div>
          )}
        </div>

        {/* Stats W/L y KDA — solo si existen */}
        {hasStats && (
          <div className="roster-card__stats">
            {(stats?.wins !== undefined || stats?.losses !== undefined) && (
              <div className="roster-card__stat">
                <span className="roster-card__stat-label">W/L</span>
                <span className="roster-card__stat-value">
                  {stats?.wins ?? 0}W {stats?.losses ?? 0}L
                </span>
              </div>
            )}
            {stats?.kda !== undefined && stats.kda > 0 && (
              <div className="roster-card__stat">
                <span className="roster-card__stat-label">KDA</span>
                <span className="roster-card__stat-value">
                  {stats.kda.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}
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
