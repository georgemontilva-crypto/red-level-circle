import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { Link, useSearch } from "wouter";
import {
  Search, Trophy, Shield, Users,
  ExternalLink, X, ChevronDown, CheckCircle, MapPin,
} from "lucide-react";
import { SectionBanner } from "@/components/SectionBanner";

// ─── Colores temáticos por juego (idéntico a Ranking y Torneos) ───────────────
const GAME_COLORS: Record<string, { from: string; to: string; glow: string; accent: string }> = {
  "league-of-legends": { from: "#0a1628", to: "#0d2444", glow: "rgba(0,120,255,0.35)",  accent: "#4a9eff" },
  "valorant":          { from: "#1a0a0a", to: "#2d0f0f", glow: "rgba(255,70,85,0.35)",   accent: "#ff4655" },
  "counter-strike":    { from: "#0a1a0a", to: "#0d2a0d", glow: "rgba(255,165,0,0.35)",   accent: "#f5a623" },
  "dota-2":            { from: "#0a0a1a", to: "#0f0f2a", glow: "rgba(180,0,255,0.35)",   accent: "#b400ff" },
  "fortnite":          { from: "#0a1a1a", to: "#0d2a2a", glow: "rgba(0,220,255,0.35)",   accent: "#00dcff" },
  "apex-legends":      { from: "#1a0a0a", to: "#2a0d0d", glow: "rgba(255,60,0,0.35)",    accent: "#ff3c00" },
  "overwatch":         { from: "#0a0f1a", to: "#0d1a2a", glow: "rgba(250,180,0,0.35)",   accent: "#fab400" },
  "rocket-league":     { from: "#0a0a1a", to: "#0d0d2a", glow: "rgba(0,160,255,0.35)",   accent: "#00a0ff" },
};
const DEFAULT_COLOR = { from: "#0d0d0d", to: "#1a1a1a", glow: "rgba(220,38,38,0.25)", accent: "#dc2626" };
function getGameColor(slug: string) { return GAME_COLORS[slug] ?? DEFAULT_COLOR; }

// ─── Game Chip (idéntico al de Ranking y Torneos) ─────────────────────────────
function GameChip({ game, active, onClick }: { game: any; active: boolean; onClick: () => void }) {
  const c = getGameColor(game.slug);
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-mono text-xs font-semibold shrink-0 transition-all duration-300 select-none"
      style={{
        background: active ? `linear-gradient(135deg, ${c.from} 0%, ${c.to} 100%)` : "oklch(0.12 0.005 0)",
        border: active ? `1px solid ${c.accent}55` : "1px solid oklch(0.20 0.01 0)",
        color: active ? c.accent : "oklch(0.55 0.01 0)",
        boxShadow: active ? `0 0 16px ${c.glow}, 0 2px 8px rgba(0,0,0,0.5)` : "none",
        transform: active ? "translateY(-1px)" : "none",
        position: "relative",
        zIndex: active ? 2 : 1,
      }}
    >
      {(game.logo || game.banner) ? (
        <img
          src={(game.logo || game.banner) as string}
          alt={game.name}
          className="w-5 h-5 object-contain rounded"
          style={{ filter: active ? "none" : "grayscale(60%) opacity(0.6)" }}
        />
      ) : null}
      <span style={{ letterSpacing: "0.05em" }}>{game.name}</span>
      {active && (
        <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ background: c.accent }} />
      )}
    </button>
  );
}

function AllGamesChip({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-semibold shrink-0 transition-all duration-300 select-none"
      style={{
        background: active ? "linear-gradient(135deg, #1a0505 0%, #2d0a0a 100%)" : "oklch(0.12 0.005 0)",
        border: active ? "1px solid rgba(220,38,38,0.5)" : "1px solid oklch(0.20 0.01 0)",
        color: active ? "#ef4444" : "oklch(0.55 0.01 0)",
        boxShadow: active ? "0 0 16px rgba(220,38,38,0.3), 0 2px 8px rgba(0,0,0,0.5)" : "none",
        transform: active ? "translateY(-1px)" : "none",
        position: "relative",
        zIndex: active ? 2 : 1,
      }}
    >
      <Shield size={14} />
      Todos los equipos
    </button>
  );
}

// ─── Team Card premium ─────────────────────────────────────────────────────────
function TeamCard({ team }: { team: any }) {
  const gameSlug = team.gameSlug ?? "";
  const c = getGameColor(gameSlug);
  const totalGames = (team.wins ?? 0) + (team.losses ?? 0);
  const winRate = totalGames > 0 ? Math.round(((team.wins ?? 0) / totalGames) * 100) : null;

  return (
    <Link href={`/teams/${team.id}`}>
      <div
        className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
        style={{ background: "var(--bg-main)", border: "1px solid oklch(0.16 0.01 0)" }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.border = `1px solid ${c.accent}44`;
          el.style.boxShadow = `0 8px 32px ${c.glow}, 0 2px 8px rgba(0,0,0,0.6)`;
          el.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.border = "1px solid oklch(0.16 0.01 0)";
          el.style.boxShadow = "none";
          el.style.transform = "none";
        }}
      >
        {/* Banner */}
        <div className="relative h-28 overflow-hidden" style={{ background: `linear-gradient(135deg, ${c.from} 0%, ${c.to} 100%)` }}>
          {team.banner ? (
            <img src={team.banner || undefined} alt={team.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60" />
          ) : (
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `repeating-linear-gradient(45deg, ${c.accent} 0px, ${c.accent} 1px, transparent 1px, transparent 20px)` }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.09_0.005_0)] via-transparent to-transparent" />
          {team.isVerified && (
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-semibold" style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(250,204,21,0.4)", color: "#fbbf24", backdropFilter: "blur(4px)" }}>
              <CheckCircle size={10} />
              OFICIAL
            </div>
          )}
          <div className="absolute top-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", color: "white" }}>
              <ExternalLink size={10} /> Ver perfil
            </div>
          </div>
        </div>
        {/* Content */}
        <div className="p-4 -mt-6 relative">
          <div className="flex items-end gap-3 mb-3">
            <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 shadow-lg" style={{ border: `2px solid ${c.accent}33`, background: "var(--bg-card)" }}>
              {team.logo ? (
                <img src={team.logo || undefined} alt={team.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Shield size={20} style={{ color: c.accent, opacity: 0.6 }} /></div>
              )}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <h3 className="font-mono font-bold text-white truncate text-sm leading-tight">{team.name}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {team.tag && (
                  <span className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded" style={{ background: `${c.accent}18`, border: `1px solid ${c.accent}33`, color: c.accent }}>[{team.tag}]</span>
                )}
                {team.country && (
                  <span className="text-xs text-muted-foreground font-mono flex items-center gap-1"><MapPin size={10} />{team.country}</span>
                )}
              </div>
            </div>
          </div>
          {(team.game || team.gameSlug) && (
            <p className="text-xs font-mono mb-3 truncate" style={{ color: c.accent, opacity: 0.8 }}>{team.game ?? team.gameSlug}</p>
          )}
          <div className="flex items-center gap-3 pt-3" style={{ borderTop: "1px solid oklch(0.16 0.01 0)" }}>
            <div className="flex items-center gap-1.5 text-xs">
              <Trophy size={11} className="text-yellow-500" />
              <span className="font-mono text-secondary-foreground">{team.points ?? 0}</span>
              <span className="text-muted-foreground font-mono">pts</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono">
              <span style={{ color: "#4ade80" }}>{team.wins ?? 0}V</span>
              <span className="text-zinc-700">/</span>
              <span style={{ color: "#f87171" }}>{team.losses ?? 0}D</span>
            </div>
            {winRate !== null ? (
              <div className="ml-auto text-xs font-mono font-semibold px-2 py-0.5 rounded-lg" style={{ background: winRate >= 60 ? "rgba(74,222,128,0.1)" : winRate >= 40 ? "rgba(250,204,21,0.1)" : "rgba(248,113,113,0.1)", color: winRate >= 60 ? "#4ade80" : winRate >= 40 ? "#facc15" : "#f87171", border: `1px solid ${winRate >= 60 ? "rgba(74,222,128,0.2)" : winRate >= 40 ? "rgba(250,204,21,0.2)" : "rgba(248,113,113,0.2)"}` }}>{winRate}% WR</div>
            ) : (
              <div className="ml-auto flex items-center gap-1 text-xs font-mono text-muted-foreground"><Users size={10} />{team.tournamentsPlayed ?? 0} torneos</div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ selectedGame, games, onClear }: { selectedGame: string; games: any[] | undefined; onClear: () => void }) {
  const game = games?.find((g: any) => g.slug === selectedGame);
  const c = selectedGame ? getGameColor(selectedGame) : DEFAULT_COLOR;
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6" style={{ background: `linear-gradient(135deg, ${c.from} 0%, ${c.to} 100%)`, border: `1px solid ${c.accent}33`, boxShadow: `0 0 40px ${c.glow}` }}>
        {game?.logo ? (
          <img src={game.logo || undefined} alt={game.name} className="w-12 h-12 object-contain opacity-60" />
        ) : (
          <Shield size={40} style={{ color: c.accent, opacity: 0.5 }} />
        )}
      </div>
      <h3 className="font-mono font-bold text-xl text-white mb-2">{game ? `Sin equipos de ${game.name}` : "Sin equipos registrados"}</h3>
      <p className="text-muted-foreground text-sm mb-8 max-w-xs font-mono">{game ? `Aún no hay equipos oficiales de ${game.name}. Prueba con otro juego.` : "No hay equipos con los filtros seleccionados."}</p>
      <div className="flex flex-wrap gap-3 justify-center">
        <button onClick={onClear} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-sm font-semibold" style={{ background: "var(--bg-hover)", border: "1px solid oklch(0.25 0.01 0)", color: "oklch(0.70 0.01 0)" }}><X size={14} /> Limpiar filtros</button>
        <Link href="/dashboard/create-team" className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-sm font-semibold" style={{ background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)", border: "1px solid rgba(220,38,38,0.5)", color: "#fca5a5" }}><Shield size={14} /> Crear equipo</Link>
      </div>
    </div>
  );
}

export default function Teams() {
  const searchStr = useSearch();
  const urlParams = new URLSearchParams(searchStr);
  const rawGameParam = urlParams.get("game") ?? "";

  const [search, setSearch] = useState("");
  const [selectedGame, setSelectedGame] = useState("");
  const [urlParamResolved, setUrlParamResolved] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: games } = trpc.games.list.useQuery();

  if (!urlParamResolved && games && rawGameParam) {
    const bySlug = games.find((g) => g.slug === rawGameParam);
    const byName = games.find((g) => g.name.toLowerCase() === rawGameParam.toLowerCase());
    const resolved = bySlug?.slug ?? byName?.slug ?? "";
    if (resolved !== selectedGame) setSelectedGame(resolved);
    setUrlParamResolved(true);
  }

  const { data: teams, isLoading } = trpc.teams.list.useQuery(
    { gameSlug: selectedGame || undefined },
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

  const scrollChips = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" });
  };

  const clearAll = () => { setSearch(""); setSelectedGame(""); };
  const hasFilters = !!(selectedGame || search);

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="pt-6 pb-16 max-w-7xl mx-auto px-4">

        <SectionBanner sectionKey="teams" height="h-48 sm:h-64 lg:h-72" />

        {/* Búsqueda */}
        <div className="mt-8 mb-5">
          <div className="relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              placeholder="Buscar equipo, tag, juego o país..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl text-white placeholder:text-muted-foreground font-mono text-sm outline-none transition-all duration-200"
              style={{ background: "var(--bg-card)", border: "1px solid oklch(0.20 0.01 0)" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(220,38,38,0.5)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "oklch(0.20 0.01 0)"; }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Chips de juego */}
        {games && games.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2" style={{ paddingTop: "8px", paddingBottom: "8px", overflowY: "visible" }}>
              <button
                onClick={() => scrollChips("left")}
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                style={{ background: "var(--bg-hover)", border: "1px solid oklch(0.22 0.01 0)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.20 0.005 0)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.14 0.005 0)"; }}
              >
                <ChevronDown size={14} className="text-muted-foreground rotate-90" />
              </button>
              <div
                ref={scrollRef}
                className="flex gap-2 flex-1"
                style={{ overflowX: "auto", overflowY: "visible", scrollBehavior: "smooth", scrollbarWidth: "none", paddingTop: "4px", paddingBottom: "4px" }}
              >
                <AllGamesChip active={selectedGame === ""} onClick={() => setSelectedGame("")} />
                {games.map((game) => (
                  <GameChip
                    key={game.id}
                    game={game}
                    active={selectedGame === game.slug}
                    onClick={() => setSelectedGame((prev) => (prev === game.slug ? "" : game.slug))}
                  />
                ))}
              </div>
              <button
                onClick={() => scrollChips("right")}
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                style={{ background: "var(--bg-hover)", border: "1px solid oklch(0.22 0.01 0)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.20 0.005 0)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.14 0.005 0)"; }}
              >
                <ChevronDown size={14} className="text-muted-foreground -rotate-90" />
              </button>
            </div>
          </div>
        )}

        {/* Resumen de filtros */}
        {hasFilters && !isLoading && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted-foreground text-xs font-mono">
              {filtered.length === 0 ? "Sin resultados" : `${filtered.length} equipo${filtered.length !== 1 ? "s" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`}
            </p>
            <button onClick={clearAll} className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-red-400 transition-colors">
              <X size={12} /> Limpiar filtros
            </button>
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl animate-pulse" style={{ height: "260px", background: "var(--bg-card)", border: "1px solid oklch(0.16 0.01 0)" }} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {filtered.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        ) : (
          <EmptyState selectedGame={selectedGame} games={games} onClear={clearAll} />
        )}
      </div>
    </div>
  );
}
