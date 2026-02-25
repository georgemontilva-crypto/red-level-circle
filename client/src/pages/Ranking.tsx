/**
 * Ranking.tsx — Rediseño estilo LoL Esports GPR
 * - Top-3 podio visual con glow
 * - Tabla premium con filas expandibles
 * - Panel de detalle: stats + historial de torneos
 * - Filtro por juego con chips temáticos
 */
import { trpc } from "@/lib/trpc";
import {
  TrendingUp, Users, Trophy, ChevronDown, ChevronUp,
  Gamepad2, Shield, CheckCircle2, XCircle, Minus, ExternalLink, Star
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function winRate(wins: number, losses: number) {
  const total = wins + losses;
  if (total === 0) return null;
  return Math.round((wins / total) * 100);
}

function WinRateBar({ wins, losses }: { wins: number; losses: number }) {
  const total = wins + losses;
  if (total === 0) return <span className="text-zinc-600 text-xs font-mono">—</span>;
  const pct = Math.round((wins / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: pct >= 60 ? "#22c55e" : pct >= 40 ? "#eab308" : "#ef4444",
          }}
        />
      </div>
      <span
        className="text-xs font-mono font-bold"
        style={{ color: pct >= 60 ? "#22c55e" : pct >= 40 ? "#eab308" : "#ef4444" }}
      >
        {pct}%
      </span>
    </div>
  );
}

// ─── Top-3 Podio ──────────────────────────────────────────────────────────────
function PodiumCard({ team, rank, onClick, isExpanded }: {
  team: any; rank: 1 | 2 | 3; onClick: () => void; isExpanded: boolean;
}) {
  const configs = {
    1: { height: "h-44", medal: "🥇", color: "#f59e0b", glow: "rgba(245,158,11,0.4)", border: "rgba(245,158,11,0.4)", label: "CAMPEÓN" },
    2: { height: "h-36", medal: "🥈", color: "#94a3b8", glow: "rgba(148,163,184,0.3)", border: "rgba(148,163,184,0.3)", label: "2°" },
    3: { height: "h-32", medal: "🥉", color: "#f97316", glow: "rgba(249,115,22,0.3)", border: "rgba(249,115,22,0.3)", label: "3°" },
  };
  const c = configs[rank];
  const wr = winRate(team.wins ?? 0, team.losses ?? 0);
  return (
    <button
      onClick={onClick}
      className={`${c.height} w-full flex flex-col items-center justify-end pb-4 px-3 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden`}
      style={{
        background: `linear-gradient(to top, ${c.glow.replace("0.", "0.15").replace("0.4", "0.12").replace("0.3", "0.10")} 0%, transparent 70%)`,
        border: `1px solid ${isExpanded ? c.color + "80" : c.border}`,
        boxShadow: isExpanded ? `0 0 24px ${c.glow}` : "none",
        transform: isExpanded ? "translateY(-2px)" : "none",
      }}
    >
      {/* Medal badge */}
      <div className="absolute top-3 left-3 text-lg">{c.medal}</div>
      {rank === 1 && (
        <div className="absolute top-3 right-3 px-1.5 py-0.5 rounded font-mono text-xs font-bold"
          style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>
          {c.label}
        </div>
      )}
      {/* Logo */}
      <div
        className="w-12 h-12 rounded-full overflow-hidden mb-2 flex items-center justify-center"
        style={{ border: `2px solid ${c.color}66`, boxShadow: `0 0 12px ${c.glow}` }}
      >
        {team.logo ? (
          <img src={team.logo || undefined} alt={team.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-800">
            <Users size={18} style={{ color: c.color }} />
          </div>
        )}
      </div>
      {/* Name */}
      <p className="font-orbitron font-bold text-xs text-white text-center line-clamp-1 px-1 mb-1">{team.name}</p>
      {team.tag && <p className="text-zinc-500 text-xs font-mono mb-1">[{team.tag}]</p>}
      {/* Points */}
      <p className="font-orbitron font-black text-base" style={{ color: c.color }}>
        {(team.points ?? 0).toLocaleString()}
        <span className="text-xs font-mono font-normal text-zinc-500 ml-1">pts</span>
      </p>
      {/* Win rate */}
      {wr !== null && (
        <p className="text-xs font-mono mt-0.5" style={{ color: wr >= 60 ? "#22c55e" : wr >= 40 ? "#eab308" : "#ef4444" }}>
          {wr}% WR
        </p>
      )}
    </button>
  );
}

// ─── Panel de detalle del equipo ──────────────────────────────────────────────
function TeamDetailPanel({ team, gameSlug }: { team: any; gameSlug?: string }) {
  const { data: history, isLoading } = trpc.ranking.teamHistory.useQuery({ teamId: team.id });
  const wr = winRate(team.wins ?? 0, team.losses ?? 0);
  const c = getGameColor(gameSlug ?? team.gameSlug);

  return (
    <div
      className="overflow-hidden transition-all duration-500"
      style={{
        background: `linear-gradient(135deg, ${c.from}99 0%, oklch(0.08 0.005 0) 100%)`,
        borderTop: `1px solid ${c.accent}22`,
        borderBottom: `1px solid ${c.accent}22`,
      }}
    >
      <div className="px-4 py-5 max-w-4xl">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Puntos", value: (team.points ?? 0).toLocaleString(), color: c.accent },
            { label: "Torneos", value: team.tournamentsPlayed ?? 0, color: "#94a3b8" },
            { label: "Victorias", value: team.wins ?? 0, color: "#22c55e" },
            { label: "Derrotas", value: team.losses ?? 0, color: "#ef4444" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl px-3 py-2.5 text-center"
              style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.18 0.01 0)" }}
            >
              <p className="font-orbitron font-black text-lg" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-zinc-600 text-xs font-mono uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Win rate bar */}
        {wr !== null && (
          <div className="flex items-center gap-3 mb-5">
            <span className="text-zinc-500 text-xs font-mono uppercase tracking-wider shrink-0">Win Rate</span>
            <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${wr}%`,
                  background: wr >= 60 ? "linear-gradient(90deg, #16a34a, #22c55e)" : wr >= 40 ? "linear-gradient(90deg, #ca8a04, #eab308)" : "linear-gradient(90deg, #b91c1c, #ef4444)",
                }}
              />
            </div>
            <span
              className="font-orbitron font-bold text-sm shrink-0"
              style={{ color: wr >= 60 ? "#22c55e" : wr >= 40 ? "#eab308" : "#ef4444" }}
            >
              {wr}%
            </span>
          </div>
        )}

        {/* Historial de torneos */}
        <div>
          <p className="text-zinc-600 text-xs font-mono uppercase tracking-widest mb-3">Historial de torneos</p>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: "oklch(0.10 0.005 0)" }} />
              ))}
            </div>
          ) : !history || history.length === 0 ? (
            <div className="flex items-center gap-2 py-4 text-zinc-600 text-sm font-mono">
              <Gamepad2 size={16} /> Sin historial de torneos registrado
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <Link key={h.tournamentId} href={`/tournaments/${h.tournamentId}`}>
                  <div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group"
                    style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.16 0.01 0)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = `${c.accent}44`; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "oklch(0.16 0.01 0)"; }}
                  >
                    {/* Banner thumbnail */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-800 flex items-center justify-center">
                      {h.tournamentBanner ? (
                        <img src={h.tournamentBanner || undefined} alt={h.tournamentName} className="w-full h-full object-cover" />
                      ) : (
                        <Trophy size={14} className="text-zinc-600" />
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold truncate group-hover:text-red-300 transition-colors">
                        {h.tournamentName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-zinc-600 text-xs font-mono">
                          {h.tournamentStartDate ? new Date(h.tournamentStartDate).toLocaleDateString("es", { month: "short", year: "numeric" }) : "—"}
                        </span>
                        {h.tournamentStatus === "completed" && (
                          <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${h.isWinner ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" : "bg-zinc-800 text-zinc-500"}`}>
                            {h.isWinner ? "🏆 CAMPEÓN" : "Participó"}
                          </span>
                        )}
                        {h.tournamentStatus === "in_progress" && (
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">EN CURSO</span>
                        )}
                      </div>
                    </div>
                    {/* W/L */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="flex items-center gap-1 text-xs font-mono text-green-400">
                        <CheckCircle2 size={11} /> {h.wins}
                      </span>
                      <span className="text-zinc-700 text-xs">/</span>
                      <span className="flex items-center gap-1 text-xs font-mono text-red-400">
                        <XCircle size={11} /> {h.losses}
                      </span>
                    </div>
                    {/* Prize */}
                    {(h.tournamentPrize ?? 0) > 0 && (
                      <span className="text-xs font-mono font-bold shrink-0" style={{ color: "oklch(0.65 0.18 80)" }}>
                        🪙 {h.tournamentPrize}
                      </span>
                    )}
                    <ExternalLink size={12} className="text-zinc-700 group-hover:text-zinc-400 transition-colors shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* CTA ver perfil */}
        <div className="mt-4 flex justify-end">
          <Link
            href={`/teams/${team.id}`}
            className="flex items-center gap-1.5 text-xs font-mono font-semibold transition-colors hover:opacity-80"
            style={{ color: c.accent }}
          >
            <Shield size={12} /> Ver perfil completo del equipo
            <ExternalLink size={11} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Ranking Row ──────────────────────────────────────────────────────────────
function RankingRow({ team, rank, isExpanded, onToggle, gameSlug }: {
  team: any; rank: number; isExpanded: boolean; onToggle: () => void; gameSlug?: string;
}) {
  const medalColors = ["#f59e0b", "#94a3b8", "#f97316"];
  const medalIcons = ["🥇", "🥈", "🥉"];
  const isTop3 = rank <= 3;
  const c = getGameColor(gameSlug ?? team.gameSlug);

  return (
    <>
      <div
        className="grid items-center gap-2 px-4 py-3 cursor-pointer transition-all duration-200 group"
        style={{
          gridTemplateColumns: "40px 1fr 80px 60px 60px 80px 32px",
          background: isExpanded ? `${c.from}88` : isTop3 ? "oklch(0.09 0.005 0)" : "transparent",
          borderBottom: `1px solid ${isExpanded ? c.accent + "22" : "oklch(0.14 0.01 0)"}`,
        }}
        onMouseEnter={(e) => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.background = "oklch(0.10 0.005 0)"; }}
        onMouseLeave={(e) => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.background = isTop3 ? "oklch(0.09 0.005 0)" : "transparent"; }}
        onClick={onToggle}
      >
        {/* Rank */}
        <div className="flex items-center justify-center">
          {isTop3 ? (
            <span className="text-base">{medalIcons[rank - 1]}</span>
          ) : (
            <span className="font-mono text-sm text-zinc-500 font-bold">{rank}</span>
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
              <Users size={14} className="text-zinc-600" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-rajdhani font-bold text-sm text-white group-hover:text-red-300 transition-colors truncate">
                {team.name}
              </p>
              {team.isVerified && <Star size={11} className="text-yellow-400 shrink-0" />}
            </div>
            {team.tag && <p className="text-zinc-600 text-xs font-mono">[{team.tag}]</p>}
          </div>
        </div>

        {/* Win Rate */}
        <div className="flex justify-center">
          <WinRateBar wins={team.wins ?? 0} losses={team.losses ?? 0} />
        </div>

        {/* W */}
        <div className="text-center">
          <span className="text-green-400 font-mono text-xs font-bold">{team.wins ?? 0}</span>
        </div>

        {/* L */}
        <div className="text-center">
          <span className="text-red-400 font-mono text-xs font-bold">{team.losses ?? 0}</span>
        </div>

        {/* Points */}
        <div className="text-right">
          <span
            className="font-orbitron font-black text-sm"
            style={{ color: isTop3 ? medalColors[rank - 1] : "oklch(0.75 0.01 0)" }}
          >
            {(team.points ?? 0).toLocaleString()}
          </span>
        </div>

        {/* Expand */}
        <div className="flex justify-center">
          {isExpanded
            ? <ChevronUp size={14} className="text-zinc-400" />
            : <ChevronDown size={14} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          }
        </div>
      </div>

      {/* Detail panel */}
      {isExpanded && <TeamDetailPanel team={team} gameSlug={gameSlug ?? team.gameSlug} />}
    </>
  );
}

// ─── Game Chip (mismo estilo que Tournaments) ─────────────────────────────────
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
        <img src={(game.logo || game.banner) ?? undefined} alt={game.name} className="w-4 h-4 object-contain rounded"
          style={{ filter: active ? "none" : "grayscale(60%) opacity(0.6)" }} />
      )}
      {game.name}
    </button>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Ranking() {
  const [selectedGame, setSelectedGame] = useState("");
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);

  const { data: ranking, isLoading } = trpc.ranking.teams.useQuery({
    gameSlug: selectedGame || undefined,
    limit: 100,
  });
  const { data: games } = trpc.games.list.useQuery();

  const top3 = ranking?.slice(0, 3) ?? [];
  const restOfRanking = ranking ?? [];

  const toggleExpand = (id: number) => setExpandedTeamId((prev) => (prev === id ? null : id));

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pt-6 pb-16 max-w-5xl mx-auto px-4">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-red-500" />
            <h1 className="font-orbitron font-black text-2xl sm:text-3xl text-white tracking-wider">RANKING GLOBAL</h1>
          </div>
          <p className="text-zinc-500 font-rajdhani text-sm">
            Clasificación basada en puntos acumulados en torneos. Haz clic en un equipo para ver su historial competitivo.
          </p>
        </div>

        {/* Game filter chips */}
        {games && games.length > 0 && (
          <div className="mb-6">
            <div
              className="flex gap-2 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none", paddingTop: "4px", paddingBottom: "4px" }}
            >
              <button
                onClick={() => { setSelectedGame(""); setExpandedTeamId(null); }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-semibold shrink-0 transition-all duration-300"
                style={{
                  background: selectedGame === "" ? "linear-gradient(135deg, #1a0505 0%, #2d0a0a 100%)" : "oklch(0.12 0.005 0)",
                  border: selectedGame === "" ? "1px solid rgba(220,38,38,0.5)" : "1px solid oklch(0.20 0.01 0)",
                  color: selectedGame === "" ? "#ef4444" : "oklch(0.55 0.01 0)",
                  boxShadow: selectedGame === "" ? "0 0 14px rgba(220,38,38,0.3)" : "none",
                  transform: selectedGame === "" ? "translateY(-1px)" : "none",
                }}
              >
                <Trophy size={13} /> Todos los juegos
              </button>
              {games.map((game) => (
                <GameChip
                  key={game.id}
                  game={game}
                  active={selectedGame === game.slug}
                  onClick={() => { setSelectedGame((prev) => prev === game.slug ? "" : game.slug); setExpandedTeamId(null); }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Top 3 Podio */}
        {!isLoading && top3.length >= 3 && (
          <div className="mb-6">
            <p className="text-zinc-600 text-xs font-mono uppercase tracking-widest mb-3">Top 3</p>
            <div className="grid grid-cols-3 gap-3 items-end">
              {/* 2° - izquierda */}
              <PodiumCard
                team={top3[1]}
                rank={2}
                onClick={() => toggleExpand(top3[1].id)}
                isExpanded={expandedTeamId === top3[1].id}
              />
              {/* 1° - centro */}
              <PodiumCard
                team={top3[0]}
                rank={1}
                onClick={() => toggleExpand(top3[0].id)}
                isExpanded={expandedTeamId === top3[0].id}
              />
              {/* 3° - derecha */}
              <PodiumCard
                team={top3[2]}
                rank={3}
                onClick={() => toggleExpand(top3[2].id)}
                isExpanded={expandedTeamId === top3[2].id}
              />
            </div>
            {/* Panel de detalle del podio */}
            {expandedTeamId !== null && top3.some((t) => t.id === expandedTeamId) && (
              <div className="mt-3 rounded-2xl overflow-hidden" style={{ border: "1px solid oklch(0.18 0.01 0)" }}>
                <TeamDetailPanel
                  team={top3.find((t) => t.id === expandedTeamId)!}
                  gameSlug={selectedGame || (top3.find((t) => t.id === expandedTeamId)?.gameSlug ?? undefined)}
                />
              </div>
            )}
          </div>
        )}

        {/* Tabla completa */}
        {isLoading ? (
          <div className="space-y-1.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "oklch(0.10 0.005 0)" }} />
            ))}
          </div>
        ) : restOfRanking.length > 0 ? (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid oklch(0.16 0.01 0)" }}>
            {/* Table header */}
            <div
              className="grid items-center gap-2 px-4 py-2.5"
              style={{
                gridTemplateColumns: "40px 1fr 80px 60px 60px 80px 32px",
                background: "oklch(0.09 0.005 0)",
                borderBottom: "1px solid oklch(0.16 0.01 0)",
              }}
            >
              <div className="text-center text-xs font-mono text-zinc-600">#</div>
              <div className="text-xs font-mono text-zinc-600 uppercase tracking-wider">Equipo</div>
              <div className="text-center text-xs font-mono text-zinc-600 uppercase tracking-wider">WR</div>
              <div className="text-center text-xs font-mono text-green-700 uppercase">W</div>
              <div className="text-center text-xs font-mono text-red-800 uppercase">L</div>
              <div className="text-right text-xs font-mono text-zinc-600 uppercase tracking-wider">Puntos</div>
              <div />
            </div>

            {/* Rows */}
            {restOfRanking.map((team, i) => (
              <RankingRow
                key={team.id}
                team={team}
                rank={i + 1}
                isExpanded={expandedTeamId === team.id}
                onToggle={() => toggleExpand(team.id)}
                gameSlug={selectedGame || (team.gameSlug ?? undefined)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
            <h3 className="font-orbitron font-bold text-xl text-zinc-600 mb-2">SIN EQUIPOS</h3>
            <p className="text-zinc-600 font-rajdhani text-sm">No hay equipos en el ranking con los filtros seleccionados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
