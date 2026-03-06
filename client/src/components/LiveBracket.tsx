/**
 * LiveBracket.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Bracket interactivo en tiempo real para torneos BOx.
 *
 * Características:
 *   - Polling automático cada 10s para actualizar el estado del bracket.
 *   - Animaciones con Framer Motion: entrada de tarjetas, transición de estado
 *     y celebración al completarse una serie.
 *   - Formulario de registro de resultado de mapa (submitMapResult) integrado.
 *   - Badge de estado del match: PENDING / APUESTAS ABIERTAS / BLOQUEADO / EN CURSO / FINALIZADO.
 *   - Marcador de serie en tiempo real (ej. 1 - 0 en BO3).
 *   - Panel de serie expandible con lista de mapas.
 *
 * Props:
 *   tournamentId  — ID del torneo
 *   canEdit       — Si el usuario puede registrar resultados (organizador/admin)
 *
 * Uso:
 *   <LiveBracket tournamentId={5} canEdit={true} />
 */

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Trophy,
  Swords,
  Lock,
  Unlock,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
} from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type MatchStatus = "pending" | "betting_open" | "locked" | "in_progress" | "completed";

interface LiveMatch {
  id: number;
  round: number;
  matchNumber: number;
  team1Id: number | null;
  team2Id: number | null;
  team1Name?: string | null;
  team2Name?: string | null;
  team1Score?: number | null;
  team2Score?: number | null;
  winnerId?: number | null;
  status: string;
  scheduledAt?: Date | null;
  betsOpenAt?: Date | null;
  betsCloseAt?: Date | null;
}

// ─── Constantes de UI ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<MatchStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: {
    label: "PENDIENTE",
    color: "oklch(0.45 0.005 0)",
    bg: "oklch(0.15 0.005 0)",
    icon: <Clock size={10} />,
  },
  betting_open: {
    label: "APUESTAS ABIERTAS",
    color: "oklch(0.72 0.18 145)",
    bg: "oklch(0.65 0.18 145 / 0.12)",
    icon: <Unlock size={10} />,
  },
  locked: {
    label: "APUESTAS CERRADAS",
    color: "oklch(0.65 0.18 60)",
    bg: "oklch(0.65 0.18 60 / 0.12)",
    icon: <Lock size={10} />,
  },
  in_progress: {
    label: "EN CURSO",
    color: "oklch(0.75 0.22 25)",
    bg: "oklch(0.55 0.22 25 / 0.12)",
    icon: <Zap size={10} />,
  },
  completed: {
    label: "FINALIZADO",
    color: "oklch(0.55 0.005 0)",
    bg: "oklch(0.12 0.005 0)",
    icon: <CheckCircle2 size={10} />,
  },
};

const CARD_W = 260;
const CARD_H = 100;
const COL_GAP = 96;
const ROW_GAP = 32;

// ─── Animaciones ──────────────────────────────────────────────────────────────

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  completed: {
    boxShadow: ["0 0 0px oklch(0.65 0.18 145 / 0)", "0 0 20px oklch(0.65 0.18 145 / 0.4)", "0 0 8px oklch(0.65 0.18 145 / 0.15)"],
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

const scoreVariants: Variants = {
  initial: { scale: 0.7, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 20 } },
};

const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.8, 1, 0.8],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
  },
};

// ─── Componente de tarjeta de match ──────────────────────────────────────────

function MatchCard({
  match,
  canEdit,
  onSubmitMap,
  seriesData,
}: {
  match: LiveMatch;
  canEdit: boolean;
  onSubmitMap: (matchId: number) => void;
  seriesData?: { format: string; winsTeam1: number; winsTeam2: number; status: string } | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = (match.status as MatchStatus) || "pending";
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const isCompleted = status === "completed";
  const isInProgress = status === "in_progress";
  const hasBothTeams = match.team1Id !== null && match.team2Id !== null;

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate={isCompleted ? ["visible", "completed"] : "visible"}
      layout
      className="rounded-xl overflow-hidden select-none"
      style={{
        width: CARD_W,
        background: "oklch(0.10 0.005 0)",
        border: `1px solid ${isCompleted ? "oklch(0.65 0.18 145 / 0.4)" : "oklch(0.18 0.01 0)"}`,
        boxShadow: isCompleted ? "0 0 12px oklch(0.65 0.18 145 / 0.1)" : undefined,
      }}
    >
      {/* Header: número de match + estado */}
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{ background: "oklch(0.08 0.005 0)", borderBottom: "1px solid oklch(0.15 0.01 0)" }}
      >
        <span className="text-[9px] font-mono text-zinc-600">
          #{match.matchNumber}
          {seriesData && (
            <span className="ml-1.5 font-bold" style={{ color: "oklch(0.55 0.22 25)" }}>
              {seriesData.format}
            </span>
          )}
        </span>

        {/* Badge de estado */}
        <motion.div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full"
          style={{ background: cfg.bg }}
          animate={isInProgress ? "animate" : undefined}
          variants={pulseVariants}
        >
          <span style={{ color: cfg.color }}>{cfg.icon}</span>
          <span className="text-[8px] font-mono font-bold tracking-wider" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
        </motion.div>
      </div>

      {/* Equipos + marcador de serie */}
      <div className="px-3 py-2 space-y-1">
        {[
          { id: match.team1Id, name: match.team1Name, score: match.team1Score, wins: seriesData?.winsTeam1 },
          { id: match.team2Id, name: match.team2Name, score: match.team2Score, wins: seriesData?.winsTeam2 },
        ].map((team, idx) => {
          const isWinner = isCompleted && match.winnerId === team.id && team.id !== null;
          const isLoser = isCompleted && match.winnerId !== null && match.winnerId !== team.id && team.id !== null;

          return (
            <div key={idx} className="flex items-center gap-2">
              {/* Trofeo ganador */}
              <AnimatePresence>
                {isWinner && (
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Trophy size={12} style={{ color: "oklch(0.75 0.18 80)" }} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Nombre del equipo */}
              <span
                className="text-xs font-display font-bold truncate flex-1"
                style={{
                  color: isWinner
                    ? "oklch(0.72 0.18 145)"
                    : isLoser
                    ? "oklch(0.35 0.005 0)"
                    : team.id === null
                    ? "oklch(0.35 0.005 0)"
                    : "oklch(0.80 0.005 0)",
                  textDecoration: isLoser ? "line-through" : undefined,
                  fontStyle: team.id === null ? "italic" : undefined,
                }}
              >
                {team.name ?? (team.id ? `Equipo ${team.id}` : "TBD")}
              </span>

              {/* Marcador de serie (mapas ganados) */}
              {seriesData && team.wins !== undefined && (
                <motion.span
                  key={`wins-${idx}-${team.wins}`}
                  variants={scoreVariants}
                  initial="initial"
                  animate="animate"
                  className="font-mono text-sm font-black w-5 text-right flex-shrink-0"
                  style={{
                    color: isWinner
                      ? "oklch(0.72 0.18 145)"
                      : isLoser
                      ? "oklch(0.35 0.005 0)"
                      : "oklch(0.55 0.005 0)",
                  }}
                >
                  {team.wins}
                </motion.span>
              )}

              {/* Score final del match (si no hay serie) */}
              {!seriesData && isCompleted && team.score !== null && team.score !== undefined && (
                <motion.span
                  key={`score-${idx}-${team.score}`}
                  variants={scoreVariants}
                  initial="initial"
                  animate="animate"
                  className="font-mono text-sm font-black w-5 text-right flex-shrink-0"
                  style={{ color: isWinner ? "oklch(0.72 0.18 145)" : "oklch(0.35 0.005 0)" }}
                >
                  {team.score}
                </motion.span>
              )}
            </div>
          );
        })}
      </div>

      {/* Acciones: registrar resultado + expandir serie */}
      {hasBothTeams && (
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{ borderTop: "1px solid oklch(0.15 0.01 0)" }}
        >
          {/* Botón de registrar resultado */}
          {canEdit && (isInProgress || status === "locked") && (
            <button
              onClick={() => onSubmitMap(match.id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-display font-bold tracking-wider transition-all duration-200 hover:opacity-80"
              style={{
                background: "oklch(0.55 0.22 25 / 0.15)",
                border: "1px solid oklch(0.55 0.22 25 / 0.3)",
                color: "oklch(0.65 0.22 25)",
              }}
            >
              <Target size={10} />
              RESULTADO
            </button>
          )}

          {/* Botón expandir serie */}
          {seriesData && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 ml-auto text-[10px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              SERIE
            </button>
          )}
        </div>
      )}

      {/* Panel expandido de la serie */}
      <AnimatePresence>
        {expanded && seriesData && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ borderTop: "1px solid oklch(0.15 0.01 0)", overflow: "hidden" }}
          >
            <div className="px-3 py-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-mono text-zinc-600">
                  {seriesData.format} — {match.team1Name ?? "E1"} vs {match.team2Name ?? "E2"}
                </span>
                <span
                  className="text-[9px] font-mono font-bold"
                  style={{ color: "oklch(0.65 0.22 25)" }}
                >
                  {seriesData.winsTeam1} — {seriesData.winsTeam2}
                </span>
              </div>
              <div className="text-[9px] font-mono text-zinc-700">
                {seriesData.status === "completed" ? "Serie finalizada" : "Serie en curso"}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Modal de registro de resultado de mapa ───────────────────────────────────

function SubmitMapModal({
  matchId,
  tournamentId,
  seriesId,
  team1Id,
  team2Id,
  team1Name,
  team2Name,
  currentMapNumber,
  onClose,
  onSuccess,
}: {
  matchId: number;
  tournamentId: number;
  seriesId: number;
  team1Id: number;
  team2Id: number;
  team1Name: string;
  team2Name: string;
  currentMapNumber: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");

  const submitMutation = trpc.series.submitMapResult.useMutation({
    onSuccess: (data) => {
      if (data.seriesComplete) {
        if (data.isDraw) {
          toast.success("Serie terminada en empate — apuestas reembolsadas");
        } else {
          toast.success(`¡Serie completada! Ganador: ${data.seriesWinnerId ? `Equipo ${data.seriesWinnerId}` : "TBD"}`);
        }
      } else {
        toast.success(`Mapa #${currentMapNumber} registrado — ${data.seriesScore.team1}:${data.seriesScore.team2}`);
      }
      onSuccess();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const s1 = parseInt(score1);
  const s2 = parseInt(score2);
  const valid = !isNaN(s1) && !isNaN(s2) && score1 !== "" && score2 !== "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "oklch(0 0 0 / 0.85)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{
          background: "var(--bg-card)",
          border: "1px solid oklch(0.55 0.22 25 / 0.3)",
          boxShadow: "0 0 40px oklch(0.55 0.22 25 / 0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-5">
          <Swords size={18} style={{ color: "oklch(0.55 0.22 25)" }} />
          <h3 className="font-display text-sm font-bold tracking-wider text-foreground">
            MAPA #{currentMapNumber}
          </h3>
        </div>

        <div className="space-y-3 mb-5">
          {[
            { name: team1Name, value: score1, onChange: setScore1 },
            { name: team2Name, value: score2, onChange: setScore2 },
          ].map((team, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="text-sm font-display font-bold flex-1 truncate text-foreground">
                {team.name}
              </span>
              <input
                type="number"
                min={0}
                max={99}
                value={team.value}
                onChange={(e) => team.onChange(e.target.value)}
                className="w-16 text-center text-lg font-mono font-black rounded-xl px-2 py-2 outline-none"
                style={{
                  background: "var(--bg-main)",
                  border: "1px solid oklch(0.25 0.01 0)",
                  color: "var(--text-primary)",
                }}
                placeholder="0"
              />
            </div>
          ))}
        </div>

        {/* Preview del resultado */}
        {valid && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4 p-2 rounded-xl"
            style={{ background: "oklch(0.55 0.22 25 / 0.07)" }}
          >
            <span className="font-display text-xs font-bold" style={{ color: s1 > s2 ? "oklch(0.72 0.18 145)" : "oklch(0.45 0.005 0)" }}>
              {team1Name}
            </span>
            <span className="font-mono text-lg font-black text-foreground">
              {s1} — {s2}
            </span>
            <span className="font-display text-xs font-bold" style={{ color: s2 > s1 ? "oklch(0.72 0.18 145)" : "oklch(0.45 0.005 0)" }}>
              {team2Name}
            </span>
          </motion.div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-display text-xs tracking-widest"
            style={{ background: "transparent", border: "1px solid oklch(0.22 0.01 0)", color: "var(--text-muted)" }}
          >
            CANCELAR
          </button>
          <button
            disabled={!valid || submitMutation.isPending}
            onClick={() => {
              submitMutation.mutate({
                seriesId,
                mapNumber: currentMapNumber,
                scoreTeam1: s1,
                scoreTeam2: s2,
                team1Id,
                team2Id,
                tournamentId,
              });
            }}
            className="flex-1 py-2.5 rounded-xl font-display text-xs tracking-widest transition-all duration-200 disabled:opacity-40"
            style={{ background: "oklch(0.55 0.22 25)", color: "white", boxShadow: "0 0 12px oklch(0.55 0.22 25 / 0.35)" }}
          >
            {submitMutation.isPending ? "GUARDANDO..." : "CONFIRMAR"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── LiveBracket principal ────────────────────────────────────────────────────

interface LiveBracketProps {
  tournamentId: number;
  canEdit?: boolean;
}

export default function LiveBracket({ tournamentId, canEdit = false }: LiveBracketProps) {
  const [activeModal, setActiveModal] = useState<{
    matchId: number;
    seriesId: number;
    team1Id: number;
    team2Id: number;
    team1Name: string;
    team2Name: string;
    currentMapNumber: number;
  } | null>(null);

  // Polling cada 10s para tiempo real
  const { data: matches, refetch } = trpc.matches.byTournament.useQuery(
    { tournamentId },
    { refetchInterval: 10_000 }
  );

  // Obtener series de todos los matches (para marcadores BOx)
  const seriesMap = new Map<number, { format: string; winsTeam1: number; winsTeam2: number; status: string; id: number; nextMapNumber: number }>();

  // Agrupar matches por ronda
  const rounds = matches
    ? (Array.from(new Set(matches.map((m) => m.round))) as number[]).sort((a: number, b: number) => a - b)
    : [];
  const matchesByRound = rounds.map((r) => (matches ?? []).filter((m) => m.round === r));

  const firstRoundCount = matchesByRound[0]?.length ?? 1;
  const slotH = CARD_H + ROW_GAP;
  const totalH = firstRoundCount * slotH;

  const roundPositions: number[][] = rounds.map((_, ri) => {
    const count = matchesByRound[ri].length;
    const step = totalH / count;
    return Array.from({ length: count }, (_, i) => step * i + step / 2);
  });

  // SVG connectors
  const connectors: { x1: number; y1: number; x2: number; y2: number; done: boolean }[] = [];
  for (let ri = 0; ri < rounds.length - 1; ri++) {
    const srcPositions = roundPositions[ri];
    const dstPositions = roundPositions[ri + 1];
    const srcX = ri * (CARD_W + COL_GAP) + CARD_W;
    const dstX = (ri + 1) * (CARD_W + COL_GAP);
    for (let di = 0; di < dstPositions.length; di++) {
      const src1 = srcPositions[di * 2];
      const src2 = srcPositions[di * 2 + 1];
      const dst = dstPositions[di];
      if (src1 !== undefined) {
        const done = matchesByRound[ri][di * 2]?.status === "completed";
        connectors.push({ x1: srcX, y1: src1, x2: dstX, y2: dst, done });
      }
      if (src2 !== undefined) {
        const done = matchesByRound[ri][di * 2 + 1]?.status === "completed";
        connectors.push({ x1: srcX, y1: src2, x2: dstX, y2: dst, done });
      }
    }
  }

  const totalW = rounds.length * (CARD_W + COL_GAP) - COL_GAP;

  if (!matches || matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Trophy className="w-12 h-12 text-zinc-700 mb-3" />
        <p className="text-muted-foreground font-mono text-sm">El bracket aún no ha sido generado</p>
        <p className="text-zinc-700 text-xs mt-1">Inicia el torneo para generar los enfrentamientos</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      {/* Leyenda de estados */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {(Object.entries(STATUS_CONFIG) as [MatchStatus, typeof STATUS_CONFIG[MatchStatus]][]).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
            <span className="text-[9px] font-mono" style={{ color: cfg.color }}>{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Bracket SVG + tarjetas */}
      <div style={{ position: "relative", width: totalW, height: totalH, minHeight: 200 }}>
        {/* SVG connectors */}
        <svg
          style={{ position: "absolute", top: 0, left: 0, width: totalW, height: totalH, pointerEvents: "none" }}
        >
          {connectors.map((c, i) => {
            const midX = (c.x1 + c.x2) / 2;
            return (
              <path
                key={i}
                d={`M ${c.x1} ${c.y1} C ${midX} ${c.y1}, ${midX} ${c.y2}, ${c.x2} ${c.y2}`}
                fill="none"
                stroke={c.done ? "oklch(0.65 0.18 145 / 0.4)" : "oklch(0.22 0.01 0)"}
                strokeWidth={c.done ? 2 : 1}
                strokeDasharray={c.done ? undefined : "4 4"}
              />
            );
          })}
        </svg>

        {/* Tarjetas de match */}
        {rounds.map((round, ri) => {
          const positions = roundPositions[ri];
          const roundMatches = matchesByRound[ri];
          const x = ri * (CARD_W + COL_GAP);

          return roundMatches.map((match, mi) => {
            const y = positions[mi] - CARD_H / 2;
            const seriesInfo = seriesMap.get(match.id) ?? null;

            return (
              <div
                key={match.id}
                style={{ position: "absolute", left: x, top: y }}
              >
                <MatchCard
                  match={match as LiveMatch}
                  canEdit={canEdit}
                  seriesData={seriesInfo}
                  onSubmitMap={(matchId) => {
                    if (!match.team1Id || !match.team2Id) return;
                    if (!seriesInfo) {
                      toast.error("Primero configura la serie (BO1/BO3/BO5) para este match");
                      return;
                    }
                    setActiveModal({
                      matchId,
                      seriesId: seriesInfo.id,
                      team1Id: match.team1Id,
                      team2Id: match.team2Id,
                      team1Name: match.team1Name ?? `Equipo ${match.team1Id}`,
                      team2Name: match.team2Name ?? `Equipo ${match.team2Id}`,
                      currentMapNumber: seriesInfo.nextMapNumber,
                    });
                  }}
                />
              </div>
            );
          });
        })}
      </div>

      {/* Modal de registro de resultado */}
      <AnimatePresence>
        {activeModal && (
          <SubmitMapModal
            {...activeModal}
            tournamentId={tournamentId}
            onClose={() => setActiveModal(null)}
            onSuccess={() => refetch()}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
