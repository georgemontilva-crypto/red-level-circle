/**
 * BracketView — Visualización interactiva de brackets de torneo.
 * Muestra las rondas en columnas con líneas conectoras SVG.
 * El creador puede marcar ganador/perdedor directamente en cada tarjeta con ✓/✗.
 */
import { useState } from "react";
import { Trophy, Check, X, Loader2 } from "lucide-react";

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
}

interface BracketViewProps {
  matches: BracketMatch[];
  /** Called when the creator declares a winner inline */
  onDeclareWinner?: (matchId: number, winnerId: number) => Promise<void>;
  canEditResults?: boolean;
  /** Show a demo/example bracket when no matches exist */
  showDemo?: boolean;
}

const CARD_H = 90;   // height of each match card
const CARD_W = 240;  // width of each match card
const COL_GAP = 88;  // horizontal gap between rounds
const ROW_GAP = 28;  // vertical gap between cards in the same round

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO_MATCHES: BracketMatch[] = [
  // Cuartos de final
  { id: 1, round: 1, matchNumber: 1, team1Id: 1, team2Id: 2, team1Name: "Red Dragons", team2Name: "Blue Storm", team1Score: 2, team2Score: 0, winnerId: 1, status: "completed" },
  { id: 2, round: 1, matchNumber: 2, team1Id: 3, team2Id: 4, team1Name: "Night Wolves", team2Name: "Iron Fist", team1Score: 1, team2Score: 2, winnerId: 4, status: "completed" },
  { id: 3, round: 1, matchNumber: 3, team1Id: 5, team2Id: 6, team1Name: "Cyber Hawks", team2Name: "Shadow Clan", team1Score: null, team2Score: null, winnerId: null, status: "pending" },
  { id: 4, round: 1, matchNumber: 4, team1Id: 7, team2Id: 8, team1Name: "Apex Squad", team2Name: "Void Breakers", team1Score: null, team2Score: null, winnerId: null, status: "pending" },
  // Semifinales
  { id: 5, round: 2, matchNumber: 5, team1Id: 1, team2Id: 4, team1Name: "Red Dragons", team2Name: "Iron Fist", team1Score: null, team2Score: null, winnerId: null, status: "pending" },
  { id: 6, round: 2, matchNumber: 6, team1Id: null, team2Id: null, team1Name: "TBD", team2Name: "TBD", team1Score: null, team2Score: null, winnerId: null, status: "pending" },
  // Final
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

// ─── MatchCard ────────────────────────────────────────────────────────────────
function MatchCard({
  match,
  canEdit,
  onDeclareWinner,
  isDemo,
}: {
  match: BracketMatch;
  canEdit?: boolean;
  onDeclareWinner?: (matchId: number, winnerId: number) => Promise<void>;
  isDemo?: boolean;
}) {
  const [loading, setLoading] = useState<number | null>(null); // teamId being saved
  const [hovered, setHovered] = useState<1 | 2 | null>(null);

  const isPending = match.status === "pending";
  const isCompleted = match.status === "completed";
  const hasBothTeams = match.team1Id !== null && match.team2Id !== null;
  const canDeclare = canEdit && isPending && hasBothTeams && !isDemo;

  const handleDeclare = async (winnerId: number) => {
    if (!canDeclare || loading !== null) return;
    setLoading(winnerId);
    try {
      await onDeclareWinner?.(match.id, winnerId);
    } finally {
      setLoading(null);
    }
  };

  const borderColor = isCompleted
    ? "oklch(0.65 0.18 145 / 0.45)"
    : isDemo && isPending
    ? "oklch(0.30 0.01 0)"
    : "oklch(0.20 0.01 0)";

  const glowShadow = isCompleted
    ? "0 0 12px oklch(0.65 0.18 145 / 0.12)"
    : undefined;

  // Team row renderer
  const TeamRow = ({
    teamId,
    teamName,
    score,
    slot,
  }: {
    teamId: number | null;
    teamName: string | null | undefined;
    score: number | null | undefined;
    slot: 1 | 2;
  }) => {
    const isWinner = isCompleted && match.winnerId === teamId;
    const isLoser = isCompleted && match.winnerId !== null && match.winnerId !== teamId;
    const isHovered = hovered === slot;

    return (
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 relative transition-all duration-150"
        style={{
          background: isHovered && canDeclare
            ? slot === 1
              ? "oklch(0.65 0.18 145 / 0.08)"
              : "oklch(0.55 0.22 25 / 0.08)"
            : "transparent",
        }}
        onMouseEnter={() => canDeclare && setHovered(slot)}
        onMouseLeave={() => setHovered(null)}
      >
        {/* Winner trophy */}
        {isWinner && <Trophy className="w-3 h-3 text-yellow-400 flex-shrink-0" />}

        {/* Team name */}
        <span
          className={`text-xs font-bold font-mono truncate flex-1 transition-colors duration-150 ${
            isWinner
              ? "text-green-400"
              : isLoser
              ? "text-zinc-600 line-through"
              : teamId === null
              ? "text-zinc-600 italic"
              : "text-zinc-300"
          }`}
        >
          {teamName ?? (teamId ? `Equipo ${teamId}` : "TBD")}
        </span>

        {/* Score */}
        {isCompleted && score !== null && score !== undefined && (
          <span
            className={`text-sm font-black font-mono w-5 text-right flex-shrink-0 ${
              isWinner ? "text-green-400" : "text-zinc-600"
            }`}
          >
            {score}
          </span>
        )}

        {/* Inline ✓/✗ buttons — only when canDeclare and hovering */}
        {canDeclare && isHovered && (
          <div className="flex items-center gap-1 flex-shrink-0 ml-1">
            {loading === teamId ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
            ) : (
              <>
                <button
                  title={`${teamName} GANA`}
                  onClick={(e) => { e.stopPropagation(); handleDeclare(teamId!); }}
                  className="w-5 h-5 rounded flex items-center justify-center transition-all duration-150 hover:scale-110"
                  style={{ background: "oklch(0.65 0.18 145 / 0.2)", border: "1px solid oklch(0.65 0.18 145 / 0.5)" }}
                >
                  <Check className="w-3 h-3 text-green-400" />
                </button>
                <button
                  title={`${teamName} PIERDE`}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Declare the OTHER team as winner
                    const otherId = slot === 1 ? match.team2Id : match.team1Id;
                    if (otherId) handleDeclare(otherId);
                  }}
                  className="w-5 h-5 rounded flex items-center justify-center transition-all duration-150 hover:scale-110"
                  style={{ background: "oklch(0.55 0.22 25 / 0.2)", border: "1px solid oklch(0.55 0.22 25 / 0.5)" }}
                >
                  <X className="w-3 h-3 text-red-400" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="relative rounded-xl overflow-hidden select-none"
      style={{
        width: CARD_W,
        height: CARD_H,
        background: isDemo ? "oklch(0.09 0.005 0)" : "oklch(0.10 0.005 0)",
        border: `1px solid ${borderColor}`,
        boxShadow: glowShadow,
        opacity: isDemo && match.team1Id === null ? 0.5 : 1,
      }}
    >
      {/* Match number */}
      <div className="absolute top-1 left-2 text-xs font-mono opacity-30" style={{ fontSize: 9 }}>
        #{match.matchNumber}
      </div>

      {/* Demo badge */}
      {isDemo && (
        <div className="absolute top-1 right-2 text-xs font-mono opacity-40" style={{ fontSize: 8, color: "oklch(0.55 0.22 25)" }}>
          EJEMPLO
        </div>
      )}

      {/* Teams */}
      <div className="flex flex-col justify-center h-full pt-3 gap-0">
        <TeamRow teamId={match.team1Id} teamName={match.team1Name} score={match.team1Score} slot={1} />
        <div className="h-px mx-3" style={{ background: "oklch(0.18 0.01 0)" }} />
        <TeamRow teamId={match.team2Id} teamName={match.team2Name} score={match.team2Score} slot={2} />
      </div>

      {/* Pending hint */}
      {isPending && hasBothTeams && canDeclare && (
        <div
          className="absolute bottom-0.5 left-0 right-0 text-center text-xs font-mono opacity-50 pointer-events-none"
          style={{ fontSize: 8, color: "oklch(0.55 0.22 25)" }}
        >
          PASA EL CURSOR PARA REGISTRAR
        </div>
      )}
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
  const effectiveMatches = (!matches || matches.length === 0) && showDemo
    ? DEMO_MATCHES
    : matches;
  const isDemo = (!matches || matches.length === 0) && showDemo;

  if (!effectiveMatches || effectiveMatches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Trophy className="w-12 h-12 text-zinc-700 mb-3" />
        <p className="text-zinc-500 font-mono text-sm">El bracket aún no ha sido generado</p>
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
                        onDeclareWinner={onDeclareWinner}
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
  );
}
