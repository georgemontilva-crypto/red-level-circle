/**
 * BracketView — Visualización interactiva de brackets de torneo.
 * Muestra las rondas en columnas con líneas conectoras SVG.
 * El organizador puede registrar el resultado (scoreA/scoreB) haciendo clic en la tarjeta.
 */
import { useState } from "react";
import { Trophy, Swords, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export interface BracketMatch {
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
  /** Formato de la serie si ya fue configurada (BO1/BO2/BO3/BO5/BO7) */
  seriesFormat?: string | null;
  /** Marcador de la serie (mapas ganados por cada equipo) */
  seriesScore1?: number | null;
  seriesScore2?: number | null;
}

interface BracketViewProps {
  matches: BracketMatch[];
  /** Called when the organizer submits scores */
  onDeclareWinner?: (matchId: number, team1Score: number, team2Score: number) => Promise<void>;
  canEditResults?: boolean;
  /** Show a demo/example bracket when no matches exist */
  showDemo?: boolean;
  /** Formato de serie por defecto del torneo (BO1/BO2/BO3/BO5/BO7) */
  defaultSeriesFormat?: string;
}

const CARD_H = 90;   // height of each match card
const CARD_W = 240;  // width of each match card
const COL_GAP = 88;  // horizontal gap between rounds
const ROW_GAP = 28;  // vertical gap between cards in the same round

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO_MATCHES: BracketMatch[] = [
  { id: 1, round: 1, matchNumber: 1, team1Id: 1, team2Id: 2, team1Name: "Red Dragons", team2Name: "Blue Storm", team1Score: 2, team2Score: 0, winnerId: 1, status: "completed" },
  { id: 2, round: 1, matchNumber: 2, team1Id: 3, team2Id: 4, team1Name: "Night Wolves", team2Name: "Iron Fist", team1Score: 1, team2Score: 2, winnerId: 4, status: "completed" },
  { id: 3, round: 1, matchNumber: 3, team1Id: 5, team2Id: 6, team1Name: "Cyber Hawks", team2Name: "Shadow Clan", team1Score: null, team2Score: null, winnerId: null, status: "pending" },
  { id: 4, round: 1, matchNumber: 4, team1Id: 7, team2Id: 8, team1Name: "Apex Squad", team2Name: "Void Breakers", team1Score: null, team2Score: null, winnerId: null, status: "pending" },
  { id: 5, round: 2, matchNumber: 5, team1Id: 1, team2Id: 4, team1Name: "Red Dragons", team2Name: "Iron Fist", team1Score: null, team2Score: null, winnerId: null, status: "pending" },
  { id: 6, round: 2, matchNumber: 6, team1Id: null, team2Id: null, team1Name: "TBD", team2Name: "TBD", team1Score: null, team2Score: null, winnerId: null, status: "pending" },
  { id: 7, round: 3, matchNumber: 7, team1Id: null, team2Id: null, team1Name: "TBD", team2Name: "TBD", team1Score: null, team2Score: null, winnerId: null, status: "pending" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function roundLabel(roundIndex: number, totalRounds: number): string {
  const remaining = totalRounds - roundIndex;
  if (remaining === 1) return "FINAL";
  if (remaining === 2) return "SEMIFINAL";
  if (remaining === 3) return "CUARTOS";
  return `RONDA ${roundIndex + 1}`;
}

// ─── Score Modal ──────────────────────────────────────────────────────────────
function ScoreModal({
  match,
  onClose,
  onSubmit,
}: {
  match: BracketMatch;
  onClose: () => void;
  onSubmit: (matchId: number, s1: number, s2: number) => Promise<void>;
}) {
  const [s1, setS1] = useState("");
  const [s2, setS2] = useState("");
  const [saving, setSaving] = useState(false);

  const n1 = parseInt(s1);
  const n2 = parseInt(s2);
  const valid = !isNaN(n1) && !isNaN(n2) && s1 !== "" && s2 !== "";
  const isDraw = valid && n1 === n2;
  const predictedWinner = valid && !isDraw
    ? (n1 > n2 ? match.team1Name : match.team2Name)
    : null;

  const handleSubmit = async () => {
    if (!valid || isDraw) return;
    setSaving(true);
    try {
      await onSubmit(match.id, n1, n2);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "oklch(0 0 0 / 0.75)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{
          background: "var(--bg-card)",
          border: "1px solid oklch(0.55 0.22 25 / 0.35)",
          boxShadow: "0 0 40px oklch(0.55 0.22 25 / 0.18)",
          animation: "fadeInScale 0.18s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-5">
          <Swords size={17} style={{ color: "oklch(0.55 0.22 25)" }} />
          <h3 className="font-display text-sm font-bold tracking-widest text-foreground">
            REGISTRAR RESULTADO
          </h3>
          <span className="ml-auto text-xs font-mono text-muted-foreground">
            #{match.matchNumber}
          </span>
        </div>

        <div className="space-y-3 mb-4">
          {/* Team 1 */}
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: "oklch(0.55 0.22 25 / 0.15)", color: "oklch(0.65 0.22 25)" }}
            >
              {(match.team1Name ?? "?").charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 text-sm font-display tracking-wide text-foreground truncate">
              {match.team1Name ?? "Equipo 1"}
            </span>
            <input
              type="number"
              min={0}
              max={99}
              value={s1}
              onChange={(e) => setS1(e.target.value)}
              placeholder="0"
              autoFocus
              className="w-14 px-2 py-1.5 rounded-lg text-center text-xl font-mono font-black transition-all duration-200"
              style={{
                background: "var(--bg-main)",
                border: valid && !isDraw && n1 > n2
                  ? "1px solid oklch(0.65 0.18 145 / 0.7)"
                  : "1px solid oklch(0.25 0.01 0)",
                color: valid && !isDraw && n1 > n2
                  ? "oklch(0.72 0.18 145)"
                  : "oklch(0.90 0.005 0)",
                outline: "none",
              }}
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2 px-1">
            <div className="flex-1 h-px" style={{ background: "var(--bg-hover)" }} />
            <span className="text-xs font-mono text-zinc-700">VS</span>
            <div className="flex-1 h-px" style={{ background: "var(--bg-hover)" }} />
          </div>

          {/* Team 2 */}
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: "oklch(0.55 0.22 25 / 0.15)", color: "oklch(0.65 0.22 25)" }}
            >
              {(match.team2Name ?? "?").charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 text-sm font-display tracking-wide text-foreground truncate">
              {match.team2Name ?? "Equipo 2"}
            </span>
            <input
              type="number"
              min={0}
              max={99}
              value={s2}
              onChange={(e) => setS2(e.target.value)}
              placeholder="0"
              className="w-14 px-2 py-1.5 rounded-lg text-center text-xl font-mono font-black transition-all duration-200"
              style={{
                background: "var(--bg-main)",
                border: valid && !isDraw && n2 > n1
                  ? "1px solid oklch(0.65 0.18 145 / 0.7)"
                  : "1px solid oklch(0.25 0.01 0)",
                color: valid && !isDraw && n2 > n1
                  ? "oklch(0.72 0.18 145)"
                  : "oklch(0.90 0.005 0)",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Live preview */}
        {predictedWinner && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4"
            style={{ background: "oklch(0.65 0.18 145 / 0.07)", border: "1px solid oklch(0.65 0.18 145 / 0.22)" }}
          >
            <CheckCircle size={12} style={{ color: "oklch(0.65 0.18 145)" }} />
            <span className="text-xs font-mono" style={{ color: "oklch(0.72 0.18 145)" }}>
              Ganador: <strong>{predictedWinner}</strong>
            </span>
          </div>
        )}
        {isDraw && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4"
            style={{ background: "oklch(0.55 0.22 25 / 0.07)", border: "1px solid oklch(0.55 0.22 25 / 0.22)" }}
          >
            <AlertCircle size={12} style={{ color: "oklch(0.65 0.22 25)" }} />
            <span className="text-xs font-mono" style={{ color: "oklch(0.65 0.22 25)" }}>
              El marcador no puede ser empate
            </span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-display text-xs tracking-widest"
            style={{
              background: "transparent",
              border: "1px solid oklch(0.22 0.01 0)",
              color: "var(--text-muted)",
            }}
          >
            CANCELAR
          </button>
          <button
            onClick={handleSubmit}
            disabled={!valid || isDraw || saving}
            className="flex-1 py-2.5 rounded-xl font-display text-xs tracking-widest transition-all duration-200 disabled:opacity-40"
            style={{
              background: "oklch(0.55 0.22 25)",
              color: "var(--text-primary)",
              boxShadow: "0 0 12px oklch(0.55 0.22 25 / 0.35)",
            }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "GUARDAR"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MatchCard ────────────────────────────────────────────────────────────────
function MatchCard({
  match,
  canEdit,
  onOpenScoreModal,
  isDemo,
}: {
  match: BracketMatch;
  canEdit?: boolean;
  onOpenScoreModal?: (match: BracketMatch) => void;
  isDemo?: boolean;
}) {
  const isPending = match.status === "pending";
  const isCompleted = match.status === "completed";
  const hasBothTeams = match.team1Id !== null && match.team2Id !== null;
  const canDeclare = canEdit && isPending && hasBothTeams && !isDemo;

  const borderColor = isCompleted
    ? "oklch(0.65 0.18 145 / 0.45)"
    : "oklch(0.20 0.01 0)";

  const glowShadow = isCompleted
    ? "0 0 12px oklch(0.65 0.18 145 / 0.12)"
    : undefined;

  const TeamRow = ({
    teamId,
    teamName,
    score,
  }: {
    teamId: number | null;
    teamName: string | null | undefined;
    score: number | null | undefined;
  }) => {
    const isWinner = isCompleted && match.winnerId === teamId && teamId !== null;
    const isLoser = isCompleted && match.winnerId !== null && match.winnerId !== teamId && teamId !== null;

    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5">
        {/* Winner trophy */}
        {isWinner && <Trophy className="w-3 h-3 text-yellow-400 flex-shrink-0" />}

        {/* Team name */}
        <span
          className={`text-xs font-bold font-mono truncate flex-1 ${
            isWinner
              ? "text-green-400"
              : isLoser
              ? "text-muted-foreground line-through"
              : teamId === null
              ? "text-muted-foreground italic"
              : "text-secondary-foreground"
          }`}
        >
          {teamName ?? (teamId ? `Equipo ${teamId}` : "TBD")}
        </span>

        {/* Score — always show when completed, dash when pending */}
        <span
          className={`text-sm font-black font-mono w-5 text-right flex-shrink-0 ${
            isCompleted
              ? isWinner
                ? "text-green-400"
                : isLoser
                ? "text-muted-foreground"
                : "text-muted-foreground"
              : "text-zinc-700"
          }`}
          style={
            isCompleted && score !== null && score !== undefined
              ? { color: isWinner ? "oklch(0.72 0.18 145)" : "oklch(0.45 0.005 0)" }
              : {}
          }
        >
          {isCompleted && score !== null && score !== undefined ? score : "-"}
        </span>
      </div>
    );
  };

  return (
    <div
      className={`relative rounded-xl overflow-hidden select-none transition-all duration-200 ${
        canDeclare ? "cursor-pointer hover:scale-[1.02]" : ""
      }`}
      style={{
        width: CARD_W,
        height: CARD_H,
        background: isDemo ? "oklch(0.09 0.005 0)" : "oklch(0.10 0.005 0)",
        border: `1px solid ${borderColor}`,
        boxShadow: glowShadow,
        opacity: isDemo && match.team1Id === null ? 0.5 : 1,
      }}
      onClick={() => canDeclare && onOpenScoreModal?.(match)}
    >
      {/* Match number */}
      <div className="absolute top-1 left-2 text-xs font-mono opacity-30" style={{ fontSize: 9 }}>
        #{match.matchNumber}
      </div>

      {/* Badge de formato de serie */}
      {match.seriesFormat && !isDemo && (
        <div
          className="absolute top-1 right-2 text-xs font-mono font-bold"
          style={{ fontSize: 8, color: "oklch(0.65 0.22 25)", opacity: 0.85 }}
        >
          {match.seriesFormat}
          {match.seriesScore1 != null && match.seriesScore2 != null && (
            <span style={{ color: "oklch(0.80 0.005 0)" }}>
              {" "}{match.seriesScore1}-{match.seriesScore2}
            </span>
          )}
        </div>
      )}

      {/* Demo badge */}
      {isDemo && (
        <div className="absolute top-1 right-2 text-xs font-mono opacity-40" style={{ fontSize: 8, color: "oklch(0.55 0.22 25)" }}>
          EJEMPLO
        </div>
      )}

      {/* Click hint for editable pending matches */}
      {canDeclare && (
        <div
          className="absolute top-1 right-2 text-xs font-mono opacity-50"
          style={{ fontSize: 8, color: "oklch(0.55 0.22 25)" }}
        >
          CLIC PARA REGISTRAR
        </div>
      )}

      {/* Teams */}
      <div className="flex flex-col justify-center h-full pt-3 gap-0">
        <TeamRow teamId={match.team1Id} teamName={match.team1Name} score={match.team1Score} />
        <div className="h-px mx-3" style={{ background: "var(--bg-hover)" }} />
        <TeamRow teamId={match.team2Id} teamName={match.team2Name} score={match.team2Score} />
      </div>
    </div>
  );
}

// ─── BracketView ──────────────────────────────────────────────────────────────
export default function BracketView({
  matches,
  onDeclareWinner,
  canEditResults,
  showDemo = false,
}: BracketViewProps) {
  const [scoreModal, setScoreModal] = useState<BracketMatch | null>(null);

  const effectiveMatches = (!matches || matches.length === 0) && showDemo
    ? DEMO_MATCHES
    : matches;
  const isDemo = (!matches || matches.length === 0) && showDemo;

  if (!effectiveMatches || effectiveMatches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Trophy className="w-12 h-12 text-zinc-700 mb-3" />
        <p className="text-muted-foreground font-mono text-sm">El bracket aún no ha sido generado</p>
        <p className="text-zinc-700 text-xs mt-1">Inicia el torneo para generar los enfrentamientos</p>
      </div>
    );
  }

  // Group matches by round
  const rounds = Array.from(new Set(effectiveMatches.map((m) => m.round))).sort((a, b) => a - b);
  const matchesByRound = rounds.map((r) => effectiveMatches.filter((m) => m.round === r));

  const firstRoundCount = matchesByRound[0]?.length ?? 1;
  const slotH = CARD_H + ROW_GAP;
  const totalH = firstRoundCount * slotH;

  // Y-center positions per round
  const roundPositions: number[][] = rounds.map((_, ri) => {
    const count = matchesByRound[ri].length;
    const step = totalH / count;
    return Array.from({ length: count }, (_, i) => step * i + step / 2);
  });

  // SVG connector lines
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
      const srcMatch1 = matchesByRound[ri][di * 2];
      const srcMatch2 = matchesByRound[ri][di * 2 + 1];
      if (src1 !== undefined) {
        connectors.push({ x1: srcX, y1: src1, x2: dstX, y2: dst, done: srcMatch1?.status === "completed" });
      }
      if (src2 !== undefined) {
        connectors.push({ x1: srcX, y1: src2, x2: dstX, y2: dst, done: srcMatch2?.status === "completed" });
      }
    }
  }

  const totalW = rounds.length * (CARD_W + COL_GAP) - COL_GAP;
  const svgPadding = 20;

  return (
    <>
      <div>
        {isDemo && (
          <div
            className="mb-4 px-4 py-2.5 rounded-lg text-xs font-mono flex items-center gap-2"
            style={{
              background: "oklch(0.55 0.22 25 / 0.08)",
              border: "1px solid oklch(0.55 0.22 25 / 0.25)",
              color: "oklch(0.65 0.22 25)",
            }}
          >
            <Trophy className="w-3.5 h-3.5 flex-shrink-0" />
            Vista previa — Este es un ejemplo de cómo se verá el bracket cuando el torneo esté en curso.
          </div>
        )}

        <div className="overflow-x-auto pb-4">
          <div
            style={{
              position: "relative",
              width: totalW + svgPadding * 2,
              minWidth: totalW + svgPadding * 2,
            }}
          >
            {/* Round labels */}
            <div className="flex" style={{ paddingLeft: svgPadding }}>
              {rounds.map((_, ri) => (
                <div
                  key={ri}
                  style={{ width: CARD_W, marginRight: ri < rounds.length - 1 ? COL_GAP : 0 }}
                  className="text-center mb-3"
                >
                  <span
                    className="text-xs font-mono tracking-widest px-3 py-1 rounded-full"
                    style={{
                      color: "oklch(0.55 0.22 25)",
                      background: "oklch(0.55 0.22 25 / 0.08)",
                      border: "1px solid oklch(0.55 0.22 25 / 0.2)",
                    }}
                  >
                    {roundLabel(ri, rounds.length)}
                  </span>
                </div>
              ))}
            </div>

            {/* SVG connectors */}
            <svg
              style={{
                position: "absolute",
                top: 36,
                left: svgPadding,
                width: totalW,
                height: totalH,
                pointerEvents: "none",
                overflow: "visible",
              }}
            >
              {connectors.map((c, i) => {
                const midX = (c.x1 + c.x2) / 2;
                return (
                  <path
                    key={i}
                    d={`M ${c.x1} ${c.y1} C ${midX} ${c.y1}, ${midX} ${c.y2}, ${c.x2} ${c.y2}`}
                    fill="none"
                    stroke={c.done ? "oklch(0.65 0.18 145 / 0.35)" : "oklch(0.22 0.01 0)"}
                    strokeWidth={c.done ? 2 : 1.5}
                    strokeDasharray={c.done ? undefined : "4 3"}
                  />
                );
              })}
            </svg>

            {/* Match cards */}
            <div style={{ position: "relative", height: totalH + 8, paddingLeft: svgPadding, paddingTop: 8 }}>
              {rounds.map((_, ri) => (
                <div key={ri} style={{ position: "absolute", left: svgPadding + ri * (CARD_W + COL_GAP) }}>
                  {matchesByRound[ri].map((match, mi) => {
                    const yCenter = roundPositions[ri][mi];
                    return (
                      <div
                        key={match.id}
                        style={{
                          position: "absolute",
                          top: yCenter - CARD_H / 2,
                          left: 0,
                        }}
                      >
                        <MatchCard
                          match={match}
                          canEdit={canEditResults}
                          onOpenScoreModal={setScoreModal}
                          isDemo={isDemo}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Score Modal */}
      {scoreModal && (
        <ScoreModal
          match={scoreModal}
          onClose={() => setScoreModal(null)}
          onSubmit={async (matchId, s1, s2) => {
            await onDeclareWinner?.(matchId, s1, s2);
            setScoreModal(null);
          }}
        />
      )}
    </>
  );
}
