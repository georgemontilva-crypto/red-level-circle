import { trpc } from "@/lib/trpc";
import { Trophy, Search, Shield, Gamepad2, X, ChevronRight, Zap, CheckCircle2, Radio, ChevronDown } from "lucide-react";
import { Link, useSearch } from "wouter";
import { useState, useRef, useEffect } from "react";
import { SectionBanner } from "@/components/SectionBanner";
import { TournamentGridCard } from "@/components/TournamentCard";

// ─── Colores temáticos por juego ──────────────────────────────────────────────
const GAME_COLORS: Record<string, { from: string; to: string; glow: string; accent: string }> = {
  "league-of-legends": { from: "#1a0505", to: "#2d0a0a", glow: "rgba(220,38,38,0.35)",  accent: "#ef4444" },
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
  { value: "",                   label: "Todos los estados", icon: <Gamepad2 size={13} /> },
  { value: "registration_open",  label: "Inscripciones",     icon: <Zap size={13} /> },
  { value: "in_progress",        label: "En curso",          icon: <Radio size={13} /> },
  { value: "completed",          label: "Finalizados",       icon: <CheckCircle2 size={13} /> },
];

// ─── RLC Dropdown ─────────────────────────────────────────────────────────────
function RlcDropdown({
  label,
  icon,
  active,
  options,
  onSelect,
}: {
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  options: { value: string; label: string; icon?: React.ReactNode; img?: string }[];
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all duration-200 select-none min-w-[160px]"
        style={{
          background: active
            ? "linear-gradient(135deg, #1a0505 0%, #2d0a0a 100%)"
            : "oklch(0.12 0.005 0)",
          border: active
            ? "1px solid rgba(220,38,38,0.55)"
            : open
            ? "1px solid rgba(220,38,38,0.35)"
            : "1px solid oklch(0.20 0.01 0)",
          color: active ? "#ef4444" : "oklch(0.65 0.01 0)",
          boxShadow: active ? "0 0 14px rgba(220,38,38,0.25)" : "none",
        }}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="flex-1 text-left truncate">{label}</span>
        <ChevronDown
          size={13}
          className="shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", opacity: 0.6 }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute left-0 top-full mt-1.5 z-50 min-w-[200px] rounded-xl overflow-hidden"
          style={{
            background: "oklch(0.10 0.005 0)",
            border: "1px solid oklch(0.20 0.01 0)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(220,38,38,0.08)",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onSelect(opt.value); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-mono font-semibold transition-all duration-150 text-left"
              style={{
                background: label === opt.label
                  ? "linear-gradient(135deg, #1a0505 0%, #2d0a0a 100%)"
                  : "transparent",
                color: label === opt.label ? "#ef4444" : "oklch(0.60 0.01 0)",
              }}
              onMouseEnter={(e) => {
                if (label !== opt.label) (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.15 0.01 0)";
              }}
              onMouseLeave={(e) => {
                if (label !== opt.label) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              {opt.img && (
                <img
                  src={opt.img}
                  alt={opt.label}
                  className="w-5 h-5 object-contain rounded shrink-0"
                  style={{ filter: label === opt.label ? "none" : "grayscale(50%) opacity(0.7)" }}
                />
              )}
              {!opt.img && opt.icon && (
                <span className="shrink-0" style={{ color: label === opt.label ? "#ef4444" : "oklch(0.45 0.01 0)" }}>
                  {opt.icon}
                </span>
              )}
              <span className="truncate">{opt.label}</span>
              {label === opt.label && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
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
  const hasFilters = !!(selectedGame || selectedStatus || searchText);

  // Build game options for dropdown
  const gameOptions = [
    { value: "", label: "Todos los juegos", icon: <Trophy size={13} /> },
    ...(games ?? []).map((g) => ({
      value: g.slug,
      label: g.name,
      img: (g.logo || g.banner) as string | undefined,
    })),
  ];

  // Current labels for dropdown triggers
  const activeGameLabel = selectedGame
    ? (games?.find((g) => g.slug === selectedGame)?.name ?? "Todos los juegos")
    : "Todos los juegos";
  const activeStatusLabel = selectedStatus
    ? (STATUS_CONFIG.find((s) => s.value === selectedStatus)?.label ?? "Todos los estados")
    : "Todos los estados";

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="pt-2 pb-16">

        <SectionBanner hidden sectionKey="tournaments" height="h-48 sm:h-64 lg:h-72">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase tracking-widest text-red-400">Red Level Circle</span>
            <h1 className="font-orbitron font-black text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight drop-shadow-lg">
              TORNEOS
            </h1>
          </div>
        </SectionBanner>

        {/* ── Fila 1: Búsqueda ──────────────────────────────────────────────── */}
        <div className="mt-3 mb-4 sm:mt-6 sm:mb-5">
          <div className="relative">
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

        {/* ── Fila 2: Dropdowns de juego y estado ───────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-5">
          {/* Dropdown juego */}
          <RlcDropdown
            label={activeGameLabel}
            icon={
              activeGame?.logo || activeGame?.banner ? (
                <img
                  src={(activeGame.logo || activeGame.banner) as string}
                  alt={activeGame.name}
                  className="w-4 h-4 object-contain rounded"
                />
              ) : (
                <Trophy size={13} />
              )
            }
            active={!!selectedGame}
            options={gameOptions}
            onSelect={(val) => setSelectedGame(val)}
          />

          {/* Dropdown estado */}
          <RlcDropdown
            label={activeStatusLabel}
            icon={STATUS_CONFIG.find((s) => s.value === selectedStatus)?.icon ?? <Gamepad2 size={13} />}
            active={!!selectedStatus}
            options={STATUS_CONFIG}
            onSelect={(val) => setSelectedStatus(val)}
          />

          {/* Limpiar filtros */}
          {hasFilters && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all duration-200"
              style={{
                background: "oklch(0.12 0.005 0)",
                border: "1px solid oklch(0.20 0.01 0)",
                color: "oklch(0.55 0.01 0)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.55 0.01 0)"; }}
            >
              <X size={12} /> Limpiar
            </button>
          )}
        </div>

        {/* ── Cross-filter link ─────────────────────────────────────────────── */}
        {selectedGame && (
          <div
            className="flex items-center gap-2.5 mb-5 px-3.5 py-2.5 rounded-xl"
            style={{
              background: "linear-gradient(135deg, #1a0505 0%, #2d0a0a 100%)",
              border: "1px solid rgba(220,38,38,0.30)",
            }}
          >
            <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: "#ef4444" }} />
            <span className="text-muted-foreground text-xs font-mono">Ver también:</span>
            <Link
              href={`/teams?game=${selectedGame}`}
              className="flex items-center gap-1 text-xs font-mono font-semibold transition-colors hover:opacity-80"
              style={{ color: "#ef4444" }}
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
          </div>
        )}

        {/* ── Grid de torneos ───────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl animate-pulse" style={{ height: "280px", background: "var(--bg-card)", border: "1px solid oklch(0.16 0.01 0)" }} />
            ))}
          </div>
        ) : tournaments && tournaments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
