import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Search, Star, Radio, Calendar, ChevronRight } from "lucide-react";
import { Link, useSearch } from "wouter";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    registration_open: { label: "INSCRIPCIONES", cls: "bg-green-500/20 text-green-400 border-green-500/40" },
    in_progress: { label: "EN CURSO", cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40" },
    completed: { label: "FINALIZADO", cls: "bg-zinc-500/20 text-zinc-400 border-zinc-500/40" },
    pending_approval: { label: "PENDIENTE", cls: "bg-blue-500/20 text-blue-400 border-blue-500/40" },
    registration_closed: { label: "CERRADO", cls: "bg-orange-500/20 text-orange-400 border-orange-500/40" },
    cancelled: { label: "CANCELADO", cls: "bg-red-900/20 text-red-700 border-red-900/40" },
  };
  const s = map[status] ?? { label: status.toUpperCase(), cls: "bg-zinc-500/20 text-zinc-400 border-zinc-500/40" };
  return <span className={`text-xs px-2 py-0.5 rounded border font-mono ${s.cls}`}>{s.label}</span>;
}

export default function Tournaments() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [searchText, setSearchText] = useState("");
  const [selectedGame, setSelectedGame] = useState(params.get("game") ?? "");
  const [selectedStatus, setSelectedStatus] = useState("");
  const { isAuthenticated } = useAuth();

  const { data: tournaments, isLoading } = trpc.tournaments.list.useQuery({
    game: selectedGame || undefined,
    status: selectedStatus || undefined,
    search: searchText || undefined,
  });

  const { data: games } = trpc.games.list.useQuery();

  const statuses = [
    { value: "", label: "TODOS" },
    { value: "registration_open", label: "INSCRIPCIONES" },
    { value: "in_progress", label: "EN CURSO" },
    { value: "completed", label: "FINALIZADOS" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">

      <div className="pt-24 pb-16 max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-red-500" />
            <h1 className="font-orbitron font-black text-3xl text-white tracking-wider">TORNEOS</h1>
          </div>
          <p className="text-zinc-500 font-rajdhani">Explora y únete a los torneos de esports más emocionantes</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              placeholder="Buscar torneo..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-red-500/50 text-white placeholder:text-zinc-600 font-rajdhani text-sm outline-none transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {statuses.map((s) => (
              <button key={s.value} onClick={() => setSelectedStatus(s.value)}
                className={`text-xs font-mono px-3 py-2 rounded border transition-all ${selectedStatus === s.value ? "bg-red-600 border-red-600 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-red-500/50"}`}>
                {s.label}
              </button>
            ))}
          </div>
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

        {/* Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : tournaments && tournaments.length > 0 ? (
          <>
            <p className="text-zinc-600 text-xs font-mono mb-4">{tournaments.length} TORNEOS ENCONTRADOS</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournaments.map((t) => (
                <Link key={t.id} href={`/tournaments/${t.id}`}>
                  <div className="group bg-zinc-900/80 border border-zinc-800 hover:border-red-500/50 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-[0_0_20px_rgba(220,38,38,0.15)]">
                    <div className="h-36 relative overflow-hidden">
                      {t.banner ? (
                        <img src={t.banner} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-950/50 to-zinc-900 flex items-center justify-center">
                          <Trophy className="w-10 h-10 text-red-500/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                      <div className="absolute top-2 right-2"><StatusBadge status={t.status} /></div>
                      {(t as any).isLive && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded font-mono animate-pulse">
                          <Radio className="w-3 h-3" /> EN VIVO
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-orbitron font-bold text-sm text-white group-hover:text-red-400 transition-colors line-clamp-1">{t.name}</h3>
                        <span className="text-xs text-red-400 font-mono shrink-0">{t.game}</span>
                      </div>
                      {t.description && <p className="text-xs text-zinc-500 font-rajdhani line-clamp-2 mb-3">{t.description}</p>}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{t.maxTeams}</span>
                          {(t.prizeAmount ?? 0) > 0 && (
                            <span className="flex items-center gap-1 text-yellow-500"><Star className="w-3 h-3" />{(t.prizeAmount ?? 0).toLocaleString()} RLC</span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-red-400 transition-colors" />
                      </div>
                      {t.startDate && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-zinc-600">
                          <Calendar className="w-3 h-3" />
                          {new Date(t.startDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
            <h3 className="font-orbitron font-bold text-xl text-zinc-600 mb-2">SIN TORNEOS</h3>
            <p className="text-zinc-600 font-rajdhani mb-6">No se encontraron torneos con los filtros seleccionados.</p>
            <button onClick={() => { setSearchText(""); setSelectedGame(""); setSelectedStatus(""); }}
              className="text-red-400 hover:text-red-300 font-mono text-sm">LIMPIAR FILTROS</button>
          </div>
        )}
      </div>
    </div>
  );
}
