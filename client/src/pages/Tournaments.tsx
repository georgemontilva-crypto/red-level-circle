import { trpc } from "@/lib/trpc";
import { Trophy, Search, Shield, Gamepad2, X, ChevronRight, Zap, CheckCircle2, Radio } from "lucide-react";
import { Link, useSearch } from "wouter";
import { useState, useRef } from "react";
import { SectionBanner } from "@/components/SectionBanner";
import { TournamentGridCard } from "@/components/TournamentCard";

// ─── Colores temáticos por juego ──────────────────────────────────────────────
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

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = [
  { value: "",                   label: "Todos",         icon: <Gamepad2 size={13} /> },
  { value: "registration_open",  label: "Inscripciones", icon: <Zap size={13} /> },
  { value: "in_progress",        label: "En curso",      icon: <Radio size={13} /> },
  { value: "completed",          label: "Finalizados",   icon: <CheckCircle2 size={13} /> },
];

// ─── Game Chip ─────────────────────────────────────────────────────────────────
function GameChip({ game, active, onClick }: { game: any; active: boolean; onClick: () => void }) {
  const c = getGameColor(game.slug);
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-mono text-xs font-semibold shrink-0 transition-all duration-300 select-none"
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

// ─── All-games chip ────────────────────────────────────────────────────────────
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
      <Trophy size={14} />
      Todos los juegos
    </button>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ selectedGame, selectedStatus, games, onClear }: {
  selectedGame: string; selectedStatus: string; games: any[] | undefined; onClear: () => void;
}) {
  const game = games?.find((g) => g.slug === selectedGame);
  const c = selectedGame ? getGameColor(selectedGame) : DEFAULT_COLOR;
  const statusLabel = STATUS_CONFIG.find((s) => s.value === selectedStatus)?.label ?? "";
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div
        className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6"
        style={{
          background: `linear-gradient(135deg, ${c.from} 0%, ${c.to} 100%)`,
          border: `1px solid ${c.accent}33`,
          boxShadow: `0 0 40px ${c.glow}`,
        }}
      >
        {game?.logo ? (
          <img src={game.logo || undefined} alt={game.name} className="w-12 h-12 object-contain opacity-60" />
        ) : (
          <Trophy size={40} style={{ color: c.accent, opacity: 0.5 }} />
        )}
      </div>
      <h3 className="font-orbitron font-bold text-xl text-white mb-2">
        {game ? `Sin torneos de ${game.name}` : "Sin torneos"}
        {statusLabel && selectedStatus ? ` · ${statusLabel}` : ""}
      </h3>
      <p className="text-muted-foreground font-rajdhani text-sm mb-8 max-w-xs">
        {game
          ? `Aún no hay torneos de ${game.name} con estos filtros. Prueba cambiando el estado o explora otros juegos.`
          : "No se encontraron torneos con los filtros seleccionados. Intenta ampliar la búsqueda."}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={onClear}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-sm font-semibold transition-all duration-200"
          style={{ background: "var(--bg-hover)", border: "1px solid oklch(0.25 0.01 0)", color: "oklch(0.70 0.01 0)" }}
        >
          <X size={14} /> Limpiar filtros
        </button>
        <Link
          href="/dashboard/create-tournament"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-sm font-semibold transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)",
            border: "1px solid rgba(220,38,38,0.5)",
            color: "#fca5a5",
            boxShadow: "0 0 16px rgba(220,38,38,0.2)",
          }}
        >
          <Trophy size={14} /> Crear torneo
        </Link>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Tournaments() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const { data: games } = trpc.games.list.useQuery();
  const scrollRef = useRef<HTMLDivElement>(null);

  const rawGameParam = params.get("game") ?? "";
  const resolveInitialSlug = (raw: string): string => {
    if (!raw || !games) return "";
    const bySlug = games.find((g) => g.slug === raw);
    if (bySlug) return bySlug.slug;
    const byName = games.find((g) => g.name.toLowerCase() === raw.toLowerCase());
    if (byName) return byName.slug;
    return "";
  };

  const [selectedGame, setSelectedGame] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchText, setSearchText] = useState("");
  const [urlParamResolved, setUrlParamResolved] = useState(false);

  if (!urlParamResolved && games && rawGameParam) {
    const resolved = resolveInitialSlug(rawGameParam);
    if (resolved !== selectedGame) setSelectedGame(resolved);
    setUrlParamResolved(true);
  }

  const { data: tournaments, isLoading } = trpc.tournaments.list.useQuery({
    gameSlug: selectedGame || undefined,
    status: selectedStatus || undefined,
    search: searchText || undefined,
  });

  const clearAll = () => { setSearchText(""); setSelectedGame(""); setSelectedStatus(""); };
  const activeGame = games?.find((g) => g.slug === selectedGame);
  const activeColor = selectedGame ? getGameColor(selectedGame) : DEFAULT_COLOR;
  const hasFilters = !!(selectedGame || selectedStatus || searchText);

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="container pt-6 pb-16">

        <SectionBanner sectionKey="tournaments" height="h-48 sm:h-64 lg:h-72" />

        {/* ── Fila 1: Búsqueda ──────────────────────────────────────────────── */}
        <div className="mt-8 mb-5">
          <div className="relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              placeholder="Buscar torneo por nombre..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl text-white placeholder:text-muted-foreground font-rajdhani text-sm outline-none transition-all duration-200"
              style={{ background: "var(--bg-card)", border: "1px solid oklch(0.20 0.01 0)" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(220,38,38,0.5)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "oklch(0.20 0.01 0)"; }}
            />
            {searchText && (
              <button onClick={() => setSearchText("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── Fila 2: Chips de juegos ────────────────────────────────────────── */}
        {games && games.length > 0 && (
          <div className="mb-5" style={{ overflowY: "visible" }}>
            <div
              ref={scrollRef}
              className="flex gap-2"
              style={{
                overflowX: "auto",
                overflowY: "visible",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                paddingTop: "8px",
                paddingBottom: "8px",
              }}
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
          </div>
        )}

        {/* ── Fila 3: Estado ────────────────────────────────────────────────── */}
        <div className="mb-6">
          <p className="text-muted-foreground text-xs font-mono mb-2 uppercase tracking-widest">Estado</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_CONFIG.map((s) => (
              <button
                key={s.value}
                onClick={() => setSelectedStatus(s.value)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-mono text-xs font-semibold transition-all duration-200"
                style={{
                  background: selectedStatus === s.value ? "oklch(0.18 0.02 25)" : "oklch(0.10 0.005 0)",
                  border: selectedStatus === s.value ? "1px solid rgba(220,38,38,0.5)" : "1px solid oklch(0.18 0.01 0)",
                  color: selectedStatus === s.value ? "#ef4444" : "oklch(0.50 0.01 0)",
                  boxShadow: selectedStatus === s.value ? "0 0 10px rgba(220,38,38,0.15)" : "none",
                }}
              >
                <span style={{ color: selectedStatus === s.value ? "#ef4444" : "oklch(0.45 0.01 0)" }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Cross-filter link ─────────────────────────────────────────────── */}
        {selectedGame && (
          <div
            className="flex items-center gap-2.5 mb-5 px-3.5 py-2.5 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${activeColor.from} 0%, ${activeColor.to} 100%)`,
              border: `1px solid ${activeColor.accent}33`,
            }}
          >
            <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: activeColor.accent }} />
            <span className="text-muted-foreground text-xs font-mono">Ver también:</span>
            <Link
              href={`/teams?game=${selectedGame}`}
              className="flex items-center gap-1 text-xs font-mono font-semibold transition-colors hover:opacity-80"
              style={{ color: activeColor.accent }}
            >
              Equipos de {activeGame?.name ?? selectedGame}
              <ChevronRight size={12} />
            </Link>
          </div>
        )}

        {/* ── Resumen de filtros activos ────────────────────────────────────── */}
        {hasFilters && !isLoading && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted-foreground text-xs font-mono">
              {(tournaments?.length ?? 0) === 0
                ? "Sin resultados"
                : `${tournaments!.length} torneo${tournaments!.length !== 1 ? "s" : ""} encontrado${tournaments!.length !== 1 ? "s" : ""}`}
            </p>
            <button onClick={clearAll} className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-red-400 transition-colors">
              <X size={12} /> Limpiar filtros
            </button>
          </div>
        )}

        {/* ── Grid de torneos ───────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl animate-pulse" style={{ height: "280px", background: "var(--bg-card)", border: "1px solid oklch(0.16 0.01 0)" }} />
            ))}
          </div>
        ) : tournaments && tournaments.length > 0 ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {tournaments.map((t) => (
              <TournamentGridCard key={t.id} tournament={t} />
            ))}
          </div>
        ) : (
          <EmptyState
            selectedGame={selectedGame}
            selectedStatus={selectedStatus}
            games={games}
            onClear={clearAll}
          />
        )}
      </div>
    </div>
  );
}
