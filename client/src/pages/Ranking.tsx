import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Trophy, Swords, Medal } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Ranking() {
  const [selectedGame, setSelectedGame] = useState("");
  const { isAuthenticated } = useAuth();

  const { data: ranking, isLoading } = trpc.ranking.teams.useQuery({
    game: selectedGame || undefined,
    limit: 100,
  });

  const { data: games } = trpc.games.list.useQuery();

  const medalColors = ["text-yellow-400", "text-zinc-300", "text-orange-400"];
  const medalIcons = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen bg-black text-white">

      <div className="pt-24 pb-16 max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-red-500" />
            <h1 className="font-orbitron font-black text-3xl text-white tracking-wider">RANKING GLOBAL</h1>
          </div>
          <p className="text-zinc-500 font-rajdhani">Los mejores equipos de la plataforma clasificados por puntos</p>
        </div>

        {/* Game filter */}
        {games && games.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-8">
            <button onClick={() => setSelectedGame("")}
              className={`text-xs font-mono px-3 py-1.5 rounded border transition-all ${selectedGame === "" ? "bg-red-600 border-red-600 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-red-500/50"}`}>
              TODOS
            </button>
            {games.map((game) => (
              <button key={game.id} onClick={() => setSelectedGame(game.slug)}
                className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded border transition-all ${selectedGame === game.slug ? "bg-red-600 border-red-600 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-red-500/50"}`}>
                {game.logo && <img src={game.logo} alt={game.name} className="w-4 h-4 object-contain" />}
                {game.name.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* Top 3 podium */}
        {ranking && ranking.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[ranking[1], ranking[0], ranking[2]].map((team, podiumIdx) => {
              const rank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
              const heights = ["h-28", "h-36", "h-24"];
              return (
                <Link key={team.id} href={`/teams/${team.id}`}>
                  <div className={`${heights[podiumIdx]} flex flex-col items-center justify-end pb-4 bg-gradient-to-t ${rank === 1 ? "from-yellow-500/10 to-transparent border-yellow-500/30" : rank === 2 ? "from-zinc-500/10 to-transparent border-zinc-500/30" : "from-orange-500/10 to-transparent border-orange-500/30"} border rounded-xl cursor-pointer hover:scale-105 transition-transform`}>
                    <span className="text-2xl mb-1">{medalIcons[rank - 1]}</span>
                    {team.logo ? (
                      <img src={team.logo} alt={team.name} className="w-10 h-10 rounded-full object-cover mb-1 border-2 border-zinc-700" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center mb-1">
                        <Users className="w-5 h-5 text-red-400" />
                      </div>
                    )}
                    <p className="font-orbitron font-bold text-xs text-white text-center px-2 line-clamp-1">{team.name}</p>
                    <p className={`font-mono font-bold text-sm ${medalColors[rank - 1]}`}>{team.points.toLocaleString()}</p>
                    <p className="text-xs text-zinc-600">pts</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Full ranking table */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-16 bg-zinc-900/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : ranking && ranking.length > 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-zinc-800 text-xs font-mono text-zinc-500">
              <div className="col-span-1">#</div>
              <div className="col-span-5">EQUIPO</div>
              <div className="col-span-2 text-center">JUEGO</div>
              <div className="col-span-1 text-center">W</div>
              <div className="col-span-1 text-center">L</div>
              <div className="col-span-2 text-right">PUNTOS</div>
            </div>
            {ranking.map((team, i) => (
              <Link key={team.id} href={`/teams/${team.id}`}>
                <div className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors cursor-pointer group ${i < 3 ? "bg-zinc-900/30" : ""}`}>
                  <div className="col-span-1 flex items-center">
                    {i < 3 ? (
                      <span className="text-lg">{medalIcons[i]}</span>
                    ) : (
                      <span className="font-mono text-sm text-zinc-500">{i + 1}</span>
                    )}
                  </div>
                  <div className="col-span-5 flex items-center gap-3">
                    {team.logo ? (
                      <img src={team.logo} alt={team.name} className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-red-500/20 flex items-center justify-center">
                        <Users className="w-4 h-4 text-red-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-rajdhani font-bold text-sm text-white group-hover:text-red-400 transition-colors">{team.name}</p>
                      {team.tag && <p className="text-xs text-zinc-600 font-mono">[{team.tag}]</p>}
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <span className="text-xs text-zinc-500 font-rajdhani">{team.game ?? "—"}</span>
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <span className="text-xs text-green-400 font-mono">{team.wins ?? 0}</span>
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <span className="text-xs text-red-400 font-mono">{team.losses ?? 0}</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end">
                    <span className={`font-mono font-bold text-sm ${i < 3 ? medalColors[i] : "text-zinc-300"}`}>
                      {team.points.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
            <h3 className="font-orbitron font-bold text-xl text-zinc-600 mb-2">SIN EQUIPOS</h3>
            <p className="text-zinc-600 font-rajdhani">No hay equipos en el ranking aún.</p>
          </div>
        )}
      </div>
    </div>
  );
}
