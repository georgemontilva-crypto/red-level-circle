/**
 * PlayerRosterCard — Tarjeta de jugador definitiva estilo esports profesional.
 *
 * Formato: 420×560px (ratio 3:4), foto como fondo completo, gradiente dramático
 * inferior, Nick en Space Grotesk 700, pill de rol con icono SVG, rango + región,
 * logo del equipo circular en esquina inferior derecha, badge de capitán.
 *
 * Uso:
 *   <PlayerRosterCard
 *     nickname="TioMemox"
 *     photoUrl="https://..."
 *     role="mid"
 *     roleIcon="/role-mid.svg"
 *     roleLabel="MID"
 *     rank="Challenger"
 *     rankColor="#e8d48b"
 *     region="LAS"
 *     teamLogo="https://..."
 *     isCaptain={true}
 *   />
 */

import { Link } from "wouter";

export interface PlayerRosterCardProps {
  /** ID del usuario para hacer el perfil clickeable */
  userId?: number;
  /** Nickname del jugador (protagonista visual) */
  nickname: string;
  /** URL de la foto del jugador (ocupa toda la tarjeta como fondo) */
  photoUrl?: string | null;
  /** Valor del rol (ej: "mid") */
  role?: string | null;
  /** Ruta al icono SVG del rol (ej: "/role-mid.svg") */
  roleIcon?: string | null;
  /** Etiqueta corta del rol (ej: "MID", "TOP", "SUPPORT") */
  roleLabel?: string | null;
  /** Nombre del rango (ej: "Challenger") */
  rank?: string | null;
  /** Color hex del rango */
  rankColor?: string;
  /** Región competitiva (ej: "LAS") */
  region?: string | null;
  /** URL del logo del equipo */
  teamLogo?: string | null;
  /** Nombre del equipo (para fallback del logo) */
  teamName?: string | null;
  /** Si el jugador es capitán del equipo */
  isCaptain?: boolean;
  /** Clase CSS adicional para el contenedor */
  className?: string;
  /** Escala visual (1 = tamaño completo 420px, 0.5 = 210px, etc.) */
  scale?: number;
}

export function PlayerRosterCard({
  userId,
  nickname,
  photoUrl,
  roleIcon,
  roleLabel,
  rank,
  rankColor = "#e8d48b",
  region,
  teamLogo,
  teamName,
  isCaptain = false,
  className = "",
  scale = 1,
}: PlayerRosterCardProps) {
  const w = Math.round(420 * scale);
  const h = Math.round(560 * scale);
  const radius = Math.round(18 * scale);

  const card = (
    <div
      className={`relative overflow-hidden select-none group ${className}`}
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        background: "oklch(0.07 0.005 0)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)",
        flexShrink: 0,
      }}
    >
      {/* ── FOTO DE FONDO ── */}
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={nickname}
          className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
          draggable={false}
        />
      ) : (
        /* Fallback: gradiente con inicial */
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: `linear-gradient(160deg, oklch(0.14 0.08 25) 0%, oklch(0.07 0.005 0) 100%)`,
          }}
        >
          <span
            className="font-grotesk font-bold text-white/10 uppercase select-none"
            style={{ fontSize: Math.round(160 * scale) }}
          >
            {nickname.charAt(0)}
          </span>
        </div>
      )}

      {/* ── FRANJA ROJA SUPERIOR (acento de identidad) ── */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{ height: Math.round(3 * scale), background: "oklch(0.55 0.22 25)" }}
      />

      {/* ── GRADIENTE DRAMÁTICO INFERIOR ── */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: `${Math.round(260 * scale)}px`,
          background: `linear-gradient(
            to top,
            rgba(0,0,0,0.97) 0%,
            rgba(0,0,0,0.88) 25%,
            rgba(0,0,0,0.60) 55%,
            rgba(0,0,0,0.15) 80%,
            transparent 100%
          )`,
        }}
      />

      {/* ── BADGE CAPITÁN (esquina superior izquierda) ── */}
      {isCaptain && (
        <div
          className="absolute flex items-center gap-1"
          style={{
            top: Math.round(14 * scale),
            left: Math.round(14 * scale),
          }}
        >
          <span
            className="font-grotesk font-bold uppercase tracking-widest"
            style={{
              fontSize: Math.round(9 * scale),
              color: "oklch(0.55 0.22 25)",
              background: "rgba(0,0,0,0.75)",
              border: "1px solid oklch(0.55 0.22 25 / 0.5)",
              padding: `${Math.round(3 * scale)}px ${Math.round(8 * scale)}px`,
              borderRadius: Math.round(20 * scale),
              backdropFilter: "blur(8px)",
              letterSpacing: "0.12em",
            }}
          >
            Capitán
          </span>
        </div>
      )}

      {/* ── LOGO DEL EQUIPO (esquina superior derecha) ── */}
      {(teamLogo || teamName) && (
        <div
          className="absolute overflow-hidden"
          style={{
            top: Math.round(14 * scale),
            right: Math.round(14 * scale),
            width: Math.round(42 * scale),
            height: Math.round(42 * scale),
            borderRadius: "50%",
            border: `${Math.round(2 * scale)}px solid rgba(255,255,255,0.15)`,
            background: "rgba(0,0,0,0.60)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
          }}
        >
          {teamLogo ? (
            <img
              src={teamLogo}
              alt={teamName ?? "Equipo"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span
                className="font-grotesk font-bold text-white/60 uppercase"
                style={{ fontSize: Math.round(14 * scale) }}
              >
                {teamName?.charAt(0) ?? "?"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── ZONA DE INFORMACIÓN (parte inferior) ── */}
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col"
        style={{ padding: `0 ${Math.round(18 * scale)}px ${Math.round(18 * scale)}px` }}
      >
        {/* Nickname */}
        <h2
          className="font-grotesk font-bold text-white leading-none truncate"
          style={{
            fontSize: Math.round(28 * scale),
            letterSpacing: "-0.01em",
            marginBottom: Math.round(8 * scale),
            textShadow: "0 2px 12px rgba(0,0,0,0.8)",
          }}
        >
          {nickname}
        </h2>

        {/* Fila: Rol pill + Rango • Región */}
        <div
          className="flex items-center gap-2 flex-wrap"
          style={{ marginBottom: Math.round(0 * scale) }}
        >
          {/* Pill de rol */}
          {(roleIcon || roleLabel) && (
            <span
              className="inline-flex items-center gap-1 font-grotesk font-semibold uppercase"
              style={{
                fontSize: Math.round(10 * scale),
                letterSpacing: "0.08em",
                background: "oklch(0.55 0.22 25 / 0.18)",
                border: "1px solid oklch(0.55 0.22 25 / 0.45)",
                color: "oklch(0.85 0.15 25)",
                padding: `${Math.round(3 * scale)}px ${Math.round(9 * scale)}px`,
                borderRadius: Math.round(20 * scale),
                backdropFilter: "blur(6px)",
              }}
            >
              {roleIcon && (
                <img
                  src={roleIcon}
                  alt={roleLabel ?? "rol"}
                  style={{
                    width: Math.round(12 * scale),
                    height: Math.round(12 * scale),
                    filter: "invert(1) sepia(1) saturate(2) hue-rotate(320deg)",
                    objectFit: "contain",
                  }}
                />
              )}
              {roleLabel}
            </span>
          )}

          {/* Rango • Región */}
          {(rank || region) && (
            <span
              className="font-grotesk font-medium"
              style={{
                fontSize: Math.round(11 * scale),
                color: rank ? rankColor : "oklch(0.65 0.005 0)",
                textShadow: rank ? `0 0 8px ${rankColor}66` : "none",
              }}
            >
              {rank}
              {rank && region && (
                <span style={{ color: "oklch(0.45 0.005 0)", margin: `0 ${Math.round(4 * scale)}px` }}>•</span>
              )}
              {region && (
                <span style={{ color: "oklch(0.55 0.005 0)" }}>{region}</span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (userId) {
    return (
      <Link href={`/profile/${userId}`} className="block" style={{ width: w, flexShrink: 0 }}>
        {card}
      </Link>
    );
  }

  return card;
}

export default PlayerRosterCard;
