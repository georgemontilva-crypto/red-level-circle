/**
 * Ranking.tsx — Rediseño estilo LoL Esports GPR
 * - Cards de highlights (campeón, mejor WR, mayor ascenso)
 * - Tabla limpia con filas seleccionables
 * - Panel lateral deslizante al hacer clic en un equipo
 * - Sidebar de fuerza por juego
 * - Filtro por juego con chips temáticos
 */
import { trpc } from "@/lib/trpc";
import {
  Trophy, Users, TrendingUp, Star, ChevronDown,
  Gamepad2, Shield, X, ExternalLink, Swords, Target, Award
} from "lucide-react";
import { Link } from "wouter";
import { useState, useRef, useEffect } from "react";

// ─── Colores temáticos por juego ──────────────────────────────────────────────
const GAME_COLORS: Record<string, { from: string; to: string; glow: string; accent: string }> = {
  "league-of-legends": { from: "#0a1628", to: "#0d2444", glow: "rgba(0,120,255,0.35)",  accent: "#4a9eff" },
  "valorant":          { from: "#1a0a0a", to: "#2d0f0f", glow: "rgba(255,70,85,0.35)",   accent: "#ff4655" },
  "counter-strike":    { from: "#0a1a0a", to: "#0d2a0d", glow: "rgba(255,165,0,0.35)",   accent: "#f5a623" },
  "dota-2":            { from: "#0a0a1a", to: "#0f0f2a", glow: "rgba(180,0,255,0.35)",   accent: "#b400ff" },
  "fortnite":          { from: "#0a1a1a", to: "#0d2a2a", glow: "rgba(0,220,255,0.35)",   accent: "#00dcff" },
  "apex-legends":      { from: "#1a0a0a", to: "#2a0d0d", glow: "rgba(255,60,0,0.35)",    accent: "#ff3c00" },
};
const DEFAULT_COLOR = { from: "#0d0d0d", to: "#1a1a1a", glow: "rgba(220,38,38,0.25)", accent: "#dc2626" };
function getGameColor(slug?: string | null) { return slug ? (GAME_COLORS[slug] ?? DEFAULT_COLOR) : DEFAULT_COLOR; }

function winRate(wins: number, losses: number) {
  const total = wins + losses;
  if (total === 0) return null;
  return Math.round((wins / total) * 100);
}

// ─── Highlight Card ───────────────────────────────────────────────────────────
function HighlightCard({
  icon, label, team, sublabel, accent, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  team: { name: string; tag?: string | null; logo?: string | null; points?: number; wins?: number; losses?: number; tournamentsWon?: number; tournamentsPlayed?: number } | null;
  sublabel: string;
  accent: string;
  onClick?: () => void;
}) {
  if (!team) return null;
  return (
    <button
      onClick={onClick}
      className="flex-1 min-w-[200px] rounded-2xl p-4 text-left transition-all duration-300"
      style={{ background: "oklch(0.09 0.005 0)", border: `1px solid ${accent}22` }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = `${accent}55`;
        (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 20px ${accent}18`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = `${accent}22`;
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: accent }}>{icon}</span>
        <span className="text-xs font-mono uppercase tracking-widest" style={{ color: accent }}>{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
          style={{ background: "oklch(0.14 0.005 0)", border: `1px solid ${accent}33` }}
        >
          {team.logo ? (
            <img src={team.logo || undefined} alt={team.name} className="w-full h-full object-cover" />
          ) : (
            <Users size={16} style={{ color: accent }} />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-orbitron font-bold text-sm text-white truncate">{team.name}</p>
          {team.tag && <p className="text-muted-foreground text-xs font-mono">[{team.tag}]</p>}
        </div>
      </div>
      <p className="mt-2 text-xs font-mono" style={{ color: accent }}>{sublabel}</p>
    </button>
  );
}

// ─── Panel lateral deslizante ─────────────────────────────────────────────────
function TeamSidePanel({ team, onClose }: { team: any; onClose: () => void }) {
  const { data: history, isLoading } = trpc.ranking.teamPositions.useQuery({ teamId: team.id });
  const wr = winRate(team.wins ?? 0, team.losses ?? 0);
  const c = getGameColor(team.gameSlug);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: "fadeInOverlay 200ms ease" }}
      />
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-hidden"
        style={{
          width: "min(480px, 100vw)",
          background: "oklch(0.07 0.005 0)",
          borderLeft: `1px solid ${c.accent}22`,
          boxShadow: "-20px 0 60px rgba(0,0,0,0.8)",
          animation: "slideInRight 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header */}
        <div
          className="relative p-5 shrink-0"
          style={{
            background: `linear-gradient(135deg, ${c.from} 0%, oklch(0.07 0.005 0) 100%)`,
            borderBottom: `1px solid ${c.accent}22`,
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
            style={{ background: "oklch(0.14 0.005 0)", border: "1px solid oklch(0.22 0.01 0)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.20 0.005 0)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.14 0.005 0)"; }}
          >
            <X size={14} className="text-muted-foreground" />
          </button>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center"
              style={{
                background: "oklch(0.12 0.005 0)",
                border: `2px solid ${c.accent}44`,
                boxShadow: `0 0 20px ${c.glow}`,
              }}
            >
              {team.logo ? (
                <img src={team.logo || undefined} alt={team.name} className="w-full h-full object-cover" />
              ) : (
                <Users size={24} style={{ color: c.accent }} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-orbitron font-black text-xl text-white">{team.name}</h2>
                {team.isVerified && <Star size={14} className="text-yellow-400" />}
              </div>
              {team.tag && <p className="text-muted-foreground font-mono text-sm">[{team.tag}]</p>}
              <p className="font-orbitron font-black text-2xl mt-1" style={{ color: c.accent }}>
                {(team.points ?? 0).toLocaleString()}
                <span className="text-sm font-mono font-normal text-muted-foreground ml-1">pts</span>
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Stats grid */}
          <div>
            <p className="text-muted-foreground text-xs font-mono uppercase tracking-widest mb-3">Resultados de partida</p>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  label: "Historial V/D",
                  value: `${team.wins ?? 0}-${team.losses ?? 0}`,
                  sub: wr !== null ? `(${(wr / 100).toFixed(3)})` : "—",
                  color: wr !== null ? (wr >= 60 ? "#22c55e" : wr >= 40 ? "#eab308" : "#ef4444") : "var(--text-muted)",
                },
                { label: "Torneos jugados", value: team.tournamentsPlayed ?? 0, sub: "competencias", color: "#94a3b8" },
                { label: "Victorias", value: team.wins ?? 0, sub: "partidas ganadas", color: "#22c55e" },
                { label: "Derrotas", value: team.losses ?? 0, sub: "partidas perdidas", color: "#ef4444" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl px-3.5 py-3"
                  style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.16 0.01 0)" }}
                >
                  <p className="font-orbitron font-black text-xl" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-muted-foreground text-xs font-mono mt-0.5">{stat.sub}</p>
                  <p className="text-muted-foreground text-xs font-mono uppercase tracking-wider mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Win rate bar */}
          {wr !== null && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Tasa de Victoria</span>
                <span
                  className="font-orbitron font-bold text-sm"
                  style={{ color: wr >= 60 ? "#22c55e" : wr >= 40 ? "#eab308" : "#ef4444" }}
                >
                  {wr}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${wr}%`,
                    background:
                      wr >= 60
                        ? "linear-gradient(90deg, #16a34a, #22c55e)"
                        : wr >= 40
                        ? "linear-gradient(90deg, #ca8a04, #eab308)"
                        : "linear-gradient(90deg, #b91c1c, #ef4444)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Historial de torneos */}
          <div>
            <p className="text-muted-foreground text-xs font-mono uppercase tracking-widest mb-3">
              Eventos internacionales y regionales
            </p>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "oklch(0.10 0.005 0)" }} />
                ))}
              </div>
            ) : !history || history.filter(Boolean).length === 0 ? (
              <div className="flex items-center gap-2 py-6 text-muted-foreground text-sm font-mono justify-center">
                <Gamepad2 size={16} /> Sin historial de torneos registrado
              </div>
            ) : (
              <div className="space-y-2">
                {history.filter(Boolean).map((h) => {
                  if (!h) return null;
                  const hc = getGameColor(h.tournamentGameSlug);
                  return (
                    <Link key={h.tournamentId} href={`/tournaments/${h.tournamentId}`}>
                      <div
                        className="flex items-center gap-3 px-3.5 py-3 rounded-xl cursor-pointer transition-all duration-200"
                        style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.16 0.01 0)" }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = `${hc.accent}44`;
                          (e.currentTarget as HTMLDivElement).style.background = "oklch(0.12 0.005 0)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = "oklch(0.16 0.01 0)";
                          (e.currentTarget as HTMLDivElement).style.background = "oklch(0.10 0.005 0)";
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                          style={{ background: "oklch(0.14 0.005 0)", border: `1px solid ${hc.accent}33` }}
                        >
                          {h.tournamentBanner ? (
                            <img src={h.tournamentBanner || undefined} alt={h.tournamentName} className="w-full h-full object-cover" />
                          ) : (
                            <Trophy size={14} style={{ color: hc.accent }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-rajdhani font-bold text-sm text-white truncate">{h.tournamentName}</p>
                          <p className="text-muted-foreground text-xs font-mono">
                            {h.tournamentStartDate ? new Date(h.tournamentStartDate).getFullYear() : "—"}
                            {" · "}
                            <span style={{ color: h.tournamentStatus === "completed" ? "var(--text-muted)" : "#22c55e" }}>
                              {h.tournamentStatus === "completed"
                                ? "Finalizado"
                                : h.tournamentStatus === "in_progress"
                                ? "En curso"
                                : "Próximo"}
                            </span>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          {h.isChampion && (
                            <div className="flex items-center gap-1 justify-end mb-0.5">
                              <Trophy size={10} className="text-yellow-400" />
                              <span className="text-yellow-400 text-xs font-mono font-bold">CAMPEÓN</span>
                            </div>
                          )}
                          <span className="text-green-400 font-mono text-xs font-bold">{h.wins}W</span>
                          <span className="text-muted-foreground font-mono text-xs mx-0.5">-</span>
                          <span className="text-red-400 font-mono text-xs font-bold">{h.losses}L</span>
                        </div>
                        <ExternalLink size={12} className="text-zinc-700 shrink-0" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Link al perfil */}
          <Link href={`/teams/${team.id}`}>
            <div
              className="flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer transition-all duration-200 font-mono text-sm"
              style={{ background: `${c.accent}15`, border: `1px solid ${c.accent}33`, color: c.accent }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = `${c.accent}25`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = `${c.accent}15`; }}
            >
              <Shield size={14} /> Ver perfil completo del equipo
            </div>
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ─── Game Chip ────────────────────────────────────────────────────────────────
function GameChip({ game, active, onClick }: { game: any; active: boolean; onClick: () => void }) {
  const c = getGameColor(game.slug);
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-semibold shrink-0 transition-all duration-300 select-none"
      style={{
        background: active ? `linear-gradient(135deg, ${c.from} 0%, ${c.to} 100%)` : "oklch(0.12 0.005 0)",
        border: active ? `1px solid ${c.accent}55` : "1px solid oklch(0.20 0.01 0)",
        color: active ? c.accent : "oklch(0.55 0.01 0)",
        boxShadow: active ? `0 0 14px ${c.glow}` : "none",
        transform: active ? "translateY(-1px)" : "none",
      }}
    >
      {(game.logo || game.banner) && (
        <img
          src={(game.logo || game.banner) || undefined}
          alt={game.name}
          className="w-4 h-4 object-contain rounded"
          style={{ filter: active ? "none" : "grayscale(60%) opacity(0.6)" }}
        />
      )}
      {game.name}
    </button>
  );
}

// ─── Ranking Row ──────────────────────────────────────────────────────────────
const medalColors = ["#FFD700", "#C0C0C0", "#CD7F32"];

function RankingRow({
  team, rank, isSelected, onSelect,
}: {
  team: any;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isTop3 = rank <= 3;
  const c = getGameColor(team.gameSlug);
  const wr = winRate(team.wins ?? 0, team.losses ?? 0);

  return (
    <div
      className="grid items-center gap-2 px-4 py-3.5 cursor-pointer transition-all duration-200 group"
      style={{
        gridTemplateColumns: "44px 1fr 90px 50px 50px 90px",
        background: isSelected ? `${c.from}cc` : isTop3 ? "oklch(0.09 0.005 0)" : "transparent",
        borderBottom: "1px solid oklch(0.13 0.01 0)",
        borderLeft: isSelected ? `3px solid ${c.accent}` : "3px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "oklch(0.10 0.005 0)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = isTop3 ? "oklch(0.09 0.005 0)" : "transparent";
      }}
      onClick={onSelect}
    >
      {/* Rank */}
      <div className="flex items-center justify-center">
        {isTop3 ? (
          <span className="text-base font-bold" style={{ color: medalColors[rank - 1] }}>#{rank}</span>
        ) : (
          <span className="font-mono text-sm text-muted-foreground">{rank}</span>
        )}
      </div>

      {/* Team */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-9 h-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
          style={{
            border: isTop3 ? `1px solid ${medalColors[rank - 1]}44` : "1px solid oklch(0.20 0.01 0)",
            background: "oklch(0.12 0.005 0)",
          }}
        >
          {team.logo ? (
            <img src={team.logo || undefined} alt={team.name} className="w-full h-full object-cover" />
          ) : (
            <Users size={14} className="text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-rajdhani font-bold text-sm text-white group-hover:text-red-300 transition-colors truncate">
              {team.name}
            </p>
            {team.isVerified && <Star size={10} className="text-yellow-400 shrink-0" />}
          </div>
          {team.tag && <p className="text-muted-foreground text-xs font-mono">[{team.tag}]</p>}
        </div>
      </div>

      {/* Tasa de Victoria */}
      <div className="flex items-center gap-1.5">
        {wr !== null ? (
          <>
            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${wr}%`,
                  background: wr >= 60 ? "#22c55e" : wr >= 40 ? "#eab308" : "#ef4444",
                }}
              />
            </div>
            <span
              className="text-xs font-mono font-bold shrink-0"
              style={{ color: wr >= 60 ? "#22c55e" : wr >= 40 ? "#eab308" : "#ef4444" }}
            >
              {wr}%
            </span>
          </>
        ) : (
          <span className="text-muted-foreground text-xs font-mono">—</span>
        )}
      </div>

      {/* V */}
      <div className="text-center">
        <span className="text-green-400 font-mono text-xs font-bold">{team.wins ?? 0}</span>
      </div>

      {/* D */}
      <div className="text-center">
        <span className="text-red-400 font-mono text-xs font-bold">{team.losses ?? 0}</span>
      </div>

      {/* Points */}
      <div className="text-right">
        <span
          className="font-orbitron font-black text-sm"
          style={{ color: isTop3 ? medalColors[rank - 1] : isSelected ? c.accent : "oklch(0.75 0.01 0)" }}
        >
          {(team.points ?? 0).toLocaleString()}
        </span>
        <span className="text-muted-foreground font-mono text-xs ml-1">pts</span>
      </div>
    </div>
  );
}

// ─── Sidebar de fuerza por juego ──────────────────────────────────────────────
function GameStrengthSidebar({ data }: { data: { gameSlug: string; avgPoints: number; teamCount: number }[] }) {
  const maxPts = Math.max(...data.map((d) => d.avgPoints), 1);
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "oklch(0.09 0.005 0)", border: "1px solid oklch(0.16 0.01 0)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Target size={14} className="text-red-500" />
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Fuerza por juego</p>
      </div>
      <div className="space-y-3">
        {data.map((d) => {
          const c = getGameColor(d.gameSlug);
          const pct = Math.round((d.avgPoints / maxPts) * 100);
          return (
            <div key={d.gameSlug}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-mono text-muted-foreground truncate" style={{ maxWidth: "120px" }}>
                  {d.gameSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
                <span className="text-xs font-mono font-bold" style={{ color: c.accent }}>
                  {d.avgPoints.toLocaleString()} avg
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: c.accent, opacity: 0.8 }}
                />
              </div>
              <p className="text-zinc-700 text-xs font-mono mt-0.5">{d.teamCount} equipos</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Ranking() {
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const chipsScrollRef = useRef<HTMLDivElement>(null);

  const scrollChips = (dir: "left" | "right") => {
    chipsScrollRef.current?.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" });
  };

  const { data: ranking, isLoading } = trpc.ranking.teams.useQuery({
    gameSlug: selectedGame || undefined,
    limit: 100,
  });
  const { data: games } = trpc.games.list.useQuery();
  const { data: highlights } = trpc.ranking.highlights.useQuery({ gameSlug: selectedGame || undefined });
  const { data: gameStrength } = trpc.ranking.gameStrength.useQuery();

  const teams = ranking ?? [];
  const activeColor = getGameColor(selectedGame || null);

  const handleSelectTeam = (team: any) => {
    setSelectedTeam((prev: any) => (prev?.id === team.id ? null : team));
  };

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.06 0.005 0)" }}>
      {/* Header hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${activeColor.from} 0%, oklch(0.06 0.005 0) 60%)`,
          borderBottom: `1px solid ${activeColor.accent}18`,
          transition: "background 600ms ease, border-color 600ms ease",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 60% 80% at 20% 50%, ${activeColor.glow} 0%, transparent 70%)`,
            transition: "background 600ms ease",
          }}
        />
        <div className="relative container py-10 pb-6">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: activeColor.accent }}>
                Red Level Circle
              </p>
              <h1 className="font-orbitron font-black text-4xl sm:text-5xl text-white tracking-tight">
                GLOBAL POWER
              </h1>
              <h1
                className="font-orbitron font-black text-4xl sm:text-5xl tracking-tight"
                style={{ color: activeColor.accent, transition: "color 600ms ease" }}
              >
                RANKINGS
              </h1>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-xs font-mono">Actualizado en tiempo real</p>
              <p className="text-muted-foreground text-xs font-mono">{teams.length} equipos clasificados</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        {/* Highlights */}
        {highlights && (highlights.champion || highlights.bestWinRate || highlights.biggestRise) && (
          <div className="flex gap-3 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            <HighlightCard
              icon={<Trophy size={14} />}
              label="Campeón actual"
              team={highlights.champion}
              sublabel={`${(highlights.champion?.points ?? 0).toLocaleString()} pts · ${highlights.champion?.tournamentsWon ?? 0} torneos ganados`}
              accent="#FFD700"
              onClick={() => highlights.champion && handleSelectTeam(highlights.champion)}
            />
            <HighlightCard
              icon={<TrendingUp size={14} />}
              label="Mejor tasa de victoria"
              team={highlights.bestWinRate}
              sublabel={
                highlights.bestWinRate
                  ? `${winRate(highlights.bestWinRate.wins ?? 0, highlights.bestWinRate.losses ?? 0)}% WR · ${(highlights.bestWinRate.wins ?? 0) + (highlights.bestWinRate.losses ?? 0)} partidas`
                  : "—"
              }
              accent="#22c55e"
              onClick={() => highlights.bestWinRate && handleSelectTeam(highlights.bestWinRate)}
            />
            <HighlightCard
              icon={<Award size={14} />}
              label="Mayor ascenso"
              team={highlights.biggestRise}
              sublabel={
                highlights.biggestRise
                  ? `${highlights.biggestRise.wins ?? 0}W · ${highlights.biggestRise.tournamentsPlayed ?? 0} torneos`
                  : "—"
              }
              accent={activeColor.accent}
              onClick={() => highlights.biggestRise && handleSelectTeam(highlights.biggestRise)}
            />
          </div>
        )}

        <div className="flex gap-6 items-start">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Filtro por juego */}
            {games && games.length > 0 && (
              <div className="flex items-center gap-2 mb-5" style={{ paddingTop: "6px", paddingBottom: "6px" }}>
                <button
                  onClick={() => scrollChips("left")}
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{ background: "oklch(0.14 0.005 0)", border: "1px solid oklch(0.22 0.01 0)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.20 0.005 0)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.14 0.005 0)"; }}
                >
                  <ChevronDown size={14} className="text-muted-foreground rotate-90" />
                </button>
                <div
                  ref={chipsScrollRef}
                  className="flex gap-2 overflow-x-auto flex-1"
                  style={{ scrollBehavior: "smooth", scrollbarWidth: "none" }}
                >
                  <button
                    onClick={() => { setSelectedGame(""); setSelectedTeam(null); }}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-semibold shrink-0 transition-all duration-300"
                    style={{
                      background: !selectedGame ? "oklch(0.18 0.03 25)" : "oklch(0.12 0.005 0)",
                      border: !selectedGame ? "1px solid rgba(220,38,38,0.5)" : "1px solid oklch(0.20 0.01 0)",
                      color: !selectedGame ? "#dc2626" : "oklch(0.55 0.01 0)",
                      boxShadow: !selectedGame ? "0 0 14px rgba(220,38,38,0.25)" : "none",
                    }}
                  >
                    <Swords size={12} /> Todos los juegos
                  </button>
                  {games.map((game) => (
                    <GameChip
                      key={game.id}
                      game={game}
                      active={selectedGame === game.slug}
                      onClick={() => {
                        setSelectedGame((prev) => prev === game.slug ? "" : game.slug);
                        setSelectedTeam(null);
                      }}
                    />
                  ))}
                </div>
                <button
                  onClick={() => scrollChips("right")}
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{ background: "oklch(0.14 0.005 0)", border: "1px solid oklch(0.22 0.01 0)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.20 0.005 0)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.14 0.005 0)"; }}
                >
                  <ChevronDown size={14} className="text-muted-foreground -rotate-90" />
                </button>
              </div>
            )}

            {/* Tabla */}
            {isLoading ? (
              <div className="space-y-1.5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "oklch(0.10 0.005 0)" }} />
                ))}
              </div>
            ) : teams.length > 0 ? (
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid oklch(0.16 0.01 0)" }}>
                {/* Header */}
                <div
                  className="grid items-center gap-2 px-4 py-3"
                  style={{
                    gridTemplateColumns: "44px 1fr 90px 50px 50px 90px",
                    background: "oklch(0.09 0.005 0)",
                    borderBottom: "1px solid oklch(0.16 0.01 0)",
                  }}
                >
                  <div className="text-center text-xs font-mono text-muted-foreground">#</div>
                  <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Equipo</div>
                  <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Tasa de Victoria</div>
                  <div className="text-center text-xs font-mono text-green-700 uppercase">V</div>
                  <div className="text-center text-xs font-mono text-red-800 uppercase">D</div>
                  <div className="text-right text-xs font-mono text-muted-foreground uppercase tracking-wider">Puntos</div>
                </div>
                {/* Rows */}
                {teams.map((team, i) => (
                  <RankingRow
                    key={team.id}
                    team={team}
                    rank={i + 1}
                    isSelected={selectedTeam?.id === team.id}
                    onSelect={() => handleSelectTeam(team)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
                <h3 className="font-orbitron font-bold text-xl text-muted-foreground mb-2">SIN EQUIPOS</h3>
                <p className="text-muted-foreground font-rajdhani text-sm">
                  No hay equipos en el ranking con los filtros seleccionados.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar de fuerza por juego (solo desktop) */}
          {gameStrength && gameStrength.length > 0 && (
            <div className="hidden lg:block w-64 shrink-0">
              <GameStrengthSidebar data={gameStrength} />
              <div
                className="rounded-2xl p-4 mt-4"
                style={{ background: "oklch(0.09 0.005 0)", border: "1px solid oklch(0.16 0.01 0)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={14} className="text-muted-foreground" />
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">¿Qué es el GPR?</p>
                </div>
                <p className="text-muted-foreground text-xs font-mono leading-relaxed">
                  El Global Power Ranking clasifica a los equipos según sus resultados en torneos, victorias y rendimiento competitivo en la plataforma.
                </p>
                <p className="text-muted-foreground text-xs font-mono mt-2 leading-relaxed">
                  Haz clic en cualquier equipo para ver su historial completo y estadísticas detalladas.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panel lateral deslizante */}
      {selectedTeam && (
        <TeamSidePanel team={selectedTeam} onClose={() => setSelectedTeam(null)} />
      )}
    </div>
  );
}
