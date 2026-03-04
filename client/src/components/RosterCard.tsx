/**
 * RosterCard — Diseño PlayerCard (Feb 2026)
 * Imagen superior h-64, info inferior con grid de datos
 * Azul → Rojo RLC (#dc2626)
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
  const inner = (
    <div className="w-full max-w-sm bg-black rounded-3xl overflow-hidden">
      {/* Imagen del jugador */}
      <div className="relative h-64 w-full overflow-hidden">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={playerName}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
            <span className="text-5xl font-black text-zinc-600">
              {playerName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Badge capitán */}
        {isCaptain && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg z-10">
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-black" aria-hidden="true">
              <path d="M2 19l2-9 4 4 4-8 4 8 4-4 2 9H2z" />
            </svg>
            CAP
          </div>
        )}
      </div>

      {/* Info del jugador */}
      <div className="px-6 py-6">
        {/* Nombre */}
        <h2 className="text-2xl font-bold text-white mb-4">{playerName}</h2>

        {/* Grid de datos */}
        <div className="space-y-3">
          {/* Rol */}
          {role && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Rol</span>
              <span className="text-white font-semibold">{role}</span>
            </div>
          )}

          {/* Juego */}
          {game && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Juego</span>
              <span className="text-white font-semibold">{game}</span>
            </div>
          )}

          {/* Región */}
          {region && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Región</span>
              <span className="text-white font-semibold">{region}</span>
            </div>
          )}

          {/* Nombre real */}
          {realName && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Nombre</span>
              <span className="text-white font-semibold">{realName}</span>
            </div>
          )}

          {/* Stats W/L */}
          {((stats?.wins !== undefined) || (stats?.losses !== undefined)) && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">W / L</span>
              <span className="text-white font-semibold">
                <span className="text-green-400">{stats?.wins ?? 0}W</span>
                {" / "}
                <span className="text-red-400">{stats?.losses ?? 0}L</span>
              </span>
            </div>
          )}

          {/* Equipo */}
          {(team || teamLogo) && (
            <div className="flex justify-between items-center border-t border-gray-800 pt-3">
              <span className="text-gray-400 text-sm">Equipo</span>
              <div className="flex items-center gap-1.5">
                {teamLogo && (
                  <img src={teamLogo} alt="" className="w-4 h-4 object-contain" />
                )}
                <span className="text-red-400 font-semibold">{team}</span>
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
