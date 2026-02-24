import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Link } from "wouter";
import { Swords, Search, Trophy, Shield, Users, Star, ExternalLink } from "lucide-react";
import { SectionBanner } from "@/components/SectionBanner";

const COUNTRY_FLAGS: Record<string, string> = {
  Colombia: "🇨🇴", Venezuela: "🇻🇪", Argentina: "🇦🇷", México: "🇲🇽", Chile: "🇨🇱",
  Perú: "🇵🇪", Ecuador: "🇪🇨", Bolivia: "🇧🇴", Uruguay: "🇺🇾", Paraguay: "🇵🇾",
  España: "🇪🇸", Brasil: "🇧🇷",
};

export default function Teams() {
  const [search, setSearch] = useState("");
  const [selectedGame, setSelectedGame] = useState(""); // slug canónico o "" para todos

  const { data: games } = trpc.games.list.useQuery();

  const { data: teams, isLoading } = trpc.teams.list.useQuery(
    { gameSlug: selectedGame || undefined },  // slug canónico principal
    { staleTime: 30_000 }
  );

  const filtered = teams?.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.tag ?? "").toLowerCase().includes(q) ||
      (t.game ?? "").toLowerCase().includes(q) ||
      (t.country ?? "").toLowerCase().includes(q)
    );
  }) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <SectionBanner sectionKey="teams" height="h-48 sm:h-64 lg:h-72" />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar equipo, tag, juego o país..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedGame("")}
              className={`px-3 py-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                selectedGame === ""
                  ? "bg-red-600 border-red-500 text-white"
                  : "bg-zinc-900 border-zinc-800 text-gray-400 hover:border-zinc-600"
              }`}
            >
              TODOS
            </button>
            {games?.map((game) => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(prev => prev === game.slug ? "" : game.slug)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                  selectedGame === game.slug
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-zinc-900 border-zinc-800 text-gray-400 hover:border-zinc-600"
                }`}
              >
                {game.logo && <img src={game.logo} alt={game.name} className="w-4 h-4 object-contain" />}
                {game.name.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="font-mono">{filtered.length} equipo{filtered.length !== 1 ? "s" : ""}</span>
          {search && <span>· filtrando por "{search}"</span>}
        </div>

        {/* Teams grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl h-48 animate-pulse bg-zinc-900" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Swords className="w-12 h-12 text-zinc-700 mb-4" />
            <p className="text-gray-500 font-mono text-lg">No se encontraron equipos</p>
            <p className="text-gray-600 text-sm mt-1">
              {search ? `No hay equipos que coincidan con "${search}"` : "Aún no hay equipos registrados"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((team, idx) => (
              <Link key={team.id} href={`/teams/${team.id}`}>
                <div className="group relative rounded-2xl overflow-hidden border border-zinc-800 hover:border-red-500/50 transition-all duration-300 cursor-pointer bg-zinc-900 hover:shadow-lg hover:shadow-red-500/10">
                  {/* Banner */}
                  <div className="relative h-28 overflow-hidden bg-zinc-800">
                    {team.banner ? (
                      <img src={team.banner} alt={team.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                        <Swords className="w-8 h-8 text-zinc-700" />
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-4 -mt-6 relative">
                    <div className="flex items-end gap-3">
                      {/* Logo */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-zinc-800 bg-zinc-800 shrink-0 shadow-lg">
                        {team.logo ? (
                          <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Shield className="w-5 h-5 text-red-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black font-mono text-white truncate text-sm group-hover:text-red-400 transition-colors">
                            {team.name}
                          </h3>
                          {team.isVerified && <Star className="w-3 h-3 text-yellow-400 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {team.tag && (
                            <span className="text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                              [{team.tag}]
                            </span>
                          )}
                          {team.country && (
                            <span className="text-xs text-gray-500">
                              {COUNTRY_FLAGS[team.country] ?? ""} {team.country}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Game */}
                    {team.game && (
                      <p className="text-xs text-gray-500 mt-2 font-mono">{team.game}</p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-800">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Trophy className="w-3 h-3 text-yellow-500" />
                        <span className="font-mono">{team.points ?? 0} pts</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <span className="text-green-400 font-mono">{team.wins ?? 0}V</span>
                        <span className="text-gray-600">/</span>
                        <span className="text-red-400 font-mono">{team.losses ?? 0}D</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-auto">
                        <Users className="w-3 h-3" />
                        <span className="font-mono">{team.tournamentsPlayed ?? 0} torneos</span>
                      </div>
                    </div>
                  </div>

                  {/* Hover overlay link hint */}
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1">
                      <ExternalLink className="w-3 h-3 text-white" />
                      <span className="text-xs text-white font-mono">Ver perfil</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
