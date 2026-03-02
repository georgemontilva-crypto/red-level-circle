/**
 * PlayerRosterCard v3 — Tarjeta de jugador esports premium.
 *
 * Concepto visual inspirado en VCT / LEC:
 * - Forma vertical 300×420px (ratio 5:7)
 * - Foto ocupa el 68% superior con gradiente dramático
 * - Banda lateral izquierda con color del equipo (acento rojo por defecto)
 * - Icono del rol como marca de agua grande en el fondo de la zona info
 * - Nick en Space Grotesk 800 con clip de texto
 * - Panel inferior con rango coloreado + región
 * - Logo del equipo integrado en la banda inferior
 * - Badge de capitán con corona y borde dorado
 * - Hover: lift + glow sutil
 */

import { Link } from "wouter";

export interface PlayerRosterCardProps {
  userId?: number;
  nickname: string;
  photoUrl?: string | null;
  role?: string | null;
  roleIcon?: string | null;
  roleLabel?: string | null;
  rank?: string | null;
  rankColor?: string;
  region?: string | null;
  teamLogo?: string | null;
  teamName?: string | null;
  /** Color de acento del equipo (hex). Por defecto rojo Red Level */
  accentColor?: string;
  isCaptain?: boolean;
  className?: string;
  /** Escala visual (1 = 300px ancho, 0.55 = ~165px) */
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
  accentColor = "#dc2626",
  isCaptain = false,
  className = "",
  scale = 1,
}: PlayerRosterCardProps) {
  const W = Math.round(300 * scale);
  const H = Math.round(420 * scale);
  const R = Math.round(14 * scale);
  const BAND = Math.round(4 * scale); // banda lateral izquierda
  const PHOTO_H = Math.round(H * 0.62); // 62% para la foto
  const INFO_H = H - PHOTO_H;

  // Colores de capitán
  const captainAccent = "#fbbf24";
  const borderColor = isCaptain ? captainAccent : accentColor;

  const card = (
    <div
      className={`relative overflow-hidden select-none group cursor-pointer ${className}`}
      style={{
        width: W,
        height: H,
        borderRadius: R,
        background: "var(--bg-main)",
        border: `1px solid ${borderColor}30`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.65), 0 0 0 1px ${borderColor}18`,
        flexShrink: 0,
        transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = `translateY(${Math.round(-6 * scale)}px)`;
        el.style.boxShadow = `0 20px 48px rgba(0,0,0,0.75), 0 0 0 1px ${borderColor}55, 0 0 24px ${borderColor}22`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = `0 8px 32px rgba(0,0,0,0.65), 0 0 0 1px ${borderColor}18`;
      }}
    >
      {/* ── BANDA LATERAL IZQUIERDA (acento de identidad) ── */}
      <div
        className="absolute left-0 top-0 bottom-0 z-20"
        style={{
          width: BAND,
          background: `linear-gradient(to bottom, ${borderColor}, ${borderColor}88 60%, transparent)`,
        }}
      />

      {/* ── ZONA FOTO (parte superior) ── */}
      <div
        className="absolute top-0 left-0 right-0 overflow-hidden"
        style={{ height: PHOTO_H }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={nickname}
            className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
            draggable={false}
          />
        ) : (
          /* Fallback con inicial grande */
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(160deg, ${accentColor}18 0%, #0a0a0a 100%)`,
            }}
          >
            <span
              className="font-grotesk font-black text-white/8 uppercase select-none leading-none"
              style={{ fontSize: Math.round(180 * scale) }}
            >
              {nickname.charAt(0)}
            </span>
          </div>
        )}

        {/* Gradiente inferior de la foto (transición suave a la zona info) */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: Math.round(PHOTO_H * 0.55),
            background: `linear-gradient(to top, #0a0a0a 0%, #0a0a0a88 35%, transparent 100%)`,
          }}
        />

        {/* Badge capitán — esquina superior derecha */}
        {isCaptain && (
          <div
            className="absolute z-10 flex items-center gap-1"
            style={{
              top: Math.round(10 * scale),
              right: Math.round(10 * scale),
              background: "rgba(0,0,0,0.75)",
              border: `1px solid ${captainAccent}88`,
              borderRadius: Math.round(20 * scale),
              padding: `${Math.round(3 * scale)}px ${Math.round(8 * scale)}px`,
              backdropFilter: "blur(8px)",
            }}
          >
            {/* Corona SVG inline */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={captainAccent}
              style={{ width: Math.round(10 * scale), height: Math.round(10 * scale) }}
            >
              <path d="M2 19l2-9 4 4 4-8 4 8 4-4 2 9H2z" />
            </svg>
            <span
              className="font-grotesk font-bold uppercase tracking-widest"
              style={{ fontSize: Math.round(8 * scale), color: captainAccent, letterSpacing: "0.12em" }}
            >
              CAP
            </span>
          </div>
        )}

        {/* Número de jugador / posición — esquina superior izquierda (decorativo) */}
        <div
          className="absolute z-10"
          style={{
            top: Math.round(10 * scale),
            left: Math.round(BAND + Math.round(8 * scale)),
          }}
        >
          <span
            className="font-grotesk font-black text-white/20 leading-none"
            style={{ fontSize: Math.round(11 * scale), letterSpacing: "0.05em" }}
          >
            {roleLabel ? roleLabel.toUpperCase() : "—"}
          </span>
        </div>
      </div>

      {/* ── ZONA INFO (parte inferior) ── */}
      <div
        className="absolute left-0 right-0 bottom-0 flex flex-col justify-end"
        style={{
          height: INFO_H + Math.round(24 * scale), // overlap con la foto
          padding: `0 ${Math.round(14 * scale)}px ${Math.round(12 * scale)}px ${Math.round(BAND + Math.round(10 * scale))}px`,
        }}
      >
        {/* Icono del rol como marca de agua */}
        {roleIcon && (
          <img
            src={roleIcon}
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none"
            style={{
              right: Math.round(10 * scale),
              bottom: Math.round(INFO_H * 0.12),
              width: Math.round(60 * scale),
              height: Math.round(60 * scale),
              opacity: 0.06,
              filter: "invert(1)",
              objectFit: "contain",
            }}
          />
        )}

        {/* Nick */}
        <h2
          className="font-grotesk font-black text-white leading-none truncate"
          style={{
            fontSize: Math.round(22 * scale),
            letterSpacing: "-0.02em",
            marginBottom: Math.round(6 * scale),
            textShadow: "0 2px 10px rgba(0,0,0,0.9)",
          }}
        >
          {nickname}
        </h2>

        {/* Separador con color de acento */}
        <div
          style={{
            width: Math.round(28 * scale),
            height: Math.round(2 * scale),
            background: borderColor,
            borderRadius: 2,
            marginBottom: Math.round(8 * scale),
            opacity: 0.9,
          }}
        />

        {/* Fila inferior: Rango + Región + Logo equipo */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            {/* Rango */}
            {rank && (
              <span
                className="font-grotesk font-bold leading-none"
                style={{
                  fontSize: Math.round(11 * scale),
                  color: rankColor,
                  textShadow: `0 0 10px ${rankColor}55`,
                  letterSpacing: "0.04em",
                }}
              >
                {rank}
              </span>
            )}
            {/* Región */}
            {region && (
              <span
                className="font-grotesk font-medium leading-none"
                style={{
                  fontSize: Math.round(9 * scale),
                  color: "rgba(255,255,255,0.35)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {region}
              </span>
            )}
          </div>

          {/* Logo del equipo */}
          {(teamLogo || teamName) && (
            <div
              className="overflow-hidden flex items-center justify-center"
              style={{
                width: Math.round(30 * scale),
                height: Math.round(30 * scale),
                borderRadius: Math.round(6 * scale),
                background: "rgba(255,255,255,0.06)",
                border: `1px solid rgba(255,255,255,0.10)`,
                flexShrink: 0,
              }}
            >
              {teamLogo ? (
                <img
                  src={teamLogo}
                  alt={teamName ?? ""}
                  className="w-full h-full object-contain p-0.5"
                />
              ) : (
                <span
                  className="font-grotesk font-black text-white/40 uppercase"
                  style={{ fontSize: Math.round(11 * scale) }}
                >
                  {teamName?.charAt(0) ?? "?"}
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

export default PlayerRosterCard;
