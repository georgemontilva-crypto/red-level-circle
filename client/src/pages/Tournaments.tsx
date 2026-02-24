import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Search, Star, Radio, Calendar, ChevronRight } from "lucide-react";
import { Link, useSearch } from "wouter";
import { useState } from "react";
import { SectionBanner } from "@/components/SectionBanner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { TournamentCard } from "@/components/TournamentCard";

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
  const { data: games } = trpc.games.list.useQuery();

  // Resolver el parámetro ?game= de la URL: puede ser un slug canónico o un nombre legacy
  // Si coincide con un slug conocido → usar como gameSlug
  // Si coincide con un nombre conocido → resolver a su slug
  // Si no coincide con nada → tratar como nombre legacy (compatibilidad)
  const rawGameParam = params.get("game") ?? "";
  const resolveInitialSlug = (raw: string): string => {
    if (!raw || !games) return "";
    const bySlug = games.find((g) => g.slug === raw);
    if (bySlug) return bySlug.slug;
    const byName = games.find((g) => g.name.toLowerCase() === raw.toLowerCase());
    if (byName) return byName.slug;
    return ""; // valor desconocido: no filtrar
  };

  const [selectedGame, setSelectedGame] = useState(""); // almacena slug canónico
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchText, setSearchText] = useState("");
  const { isAuthenticated } = useAuth();

  // Resolver el parámetro inicial de la URL una vez que los juegos estén cargados
  // Usamos un efecto para evitar referencias inestables en el render
  const [urlParamResolved, setUrlParamResolved] = useState(false);
  if (!urlParamResolved && games && rawGameParam) {
    const resolved = resolveInitialSlug(rawGameParam);
    if (resolved !== selectedGame) setSelectedGame(resolved);
    setUrlParamResolved(true);
  }

  const { data: tournaments, isLoading } = trpc.tournaments.list.useQuery({
    gameSlug: selectedGame || undefined,  // filtro canónico principal
    status: selectedStatus || undefined,
    search: searchText || undefined,
  });

  const statuses = [
    { value: "", label: "TODOS" },
    { value: "registration_open", label: "INSCRIPCIONES" },
    { value: "in_progress", label: "EN CURSO" },
    { value: "completed", label: "FINALIZADOS" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">

      <div className="pt-6 pb-16 max-w-7xl mx-auto px-4">
        <SectionBanner sectionKey="tournaments" height="h-48 sm:h-64 lg:h-72" />


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
              <button key={game.id} onClick={() => setSelectedGame(prev => prev === game.slug ? "" : game.slug)}
                className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded border transition-all ${
                  selectedGame === game.slug
                    ? "bg-red-600 border-red-600 text-white"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-red-500/50"
                }`}>
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
                <TournamentCard key={t.id} tournament={t} />
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
