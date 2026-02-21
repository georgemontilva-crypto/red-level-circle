/**
 * BracketView — Visualización interactiva de brackets de torneo.
 * Muestra las rondas en columnas con líneas conectoras SVG.
 */
import { useState } from "react";
import { Trophy, Swords } from "lucide-react";

interface Match {
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
  matches: Match[];
  onSelectMatch?: (match: Match) => void;
  canEditResults?: boolean;
}

const CARD_H = 80;   // height of each match card
const CARD_W = 220;  // width of each match card
const COL_GAP = 80;  // horizontal gap between rounds
const ROW_GAP = 24;  // vertical gap between cards in the same round

function getTeamColor(match: Match, teamId: number | null) {
  if (!teamId || match.status !== "completed") return "text-zinc-300";
  if (match.winnerId === teamId) return "text-green-400";
  return "text-zinc-500 line-through";
}

function MatchCard({
  match,
  onClick,
  canEdit,
}: {
  match: Match;
  onClick?: () => void;
  canEdit?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const isPending = match.status === "pending";
  const isCompleted = match.status === "completed";
  const isBye = !match.team2Id || !match.team1Id;

  const borderColor = isCompleted
    ? "oklch(0.65 0.18 145 / 0.4)"
    : hovered && canEdit && isPending
    ? "oklch(0.55 0.22 25 / 0.6)"
    : "oklch(0.20 0.01 0)";

  return (
    <div
      className={`relative rounded-xl overflow-hidden transition-all duration-200 select-none ${
        canEdit && isPending ? "cursor-pointer" : "cursor-default"
      }`}
      style={{
        width: CARD_W,
        height: CARD_H,
        background: "oklch(0.10 0.005 0)",
        border: `1px solid ${borderColor}`,
        boxShadow: isCompleted ? "0 0 8px oklch(0.65 0.18 145 / 0.1)" : undefined,
      }}
      onClick={() => canEdit && isPending && onClick?.()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Match number badge */}
      <div
        className="absolute top-1 left-2 text-xs font-mono opacity-40"
        style={{ fontSize: 9 }}
      >
        #{match.matchNumber}
      </div>

      {/* Teams */}
      <div className="flex flex-col justify-center h-full px-3 pt-2 gap-1">
        {/* Team 1 */}
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-bold font-mono truncate flex-1 ${getTeamColor(match, match.team1Id)}`}>
            {match.team1Name ?? (match.team1Id ? `Equipo ${match.team1Id}` : "BYE")}
          </span>
          {isCompleted && match.team1Score !== null && (
            <span
              className={`text-sm font-black font-mono w-5 text-right ${
                match.winnerId === match.team1Id ? "text-green-400" : "text-zinc-500"
              }`}
            >
              {match.team1Score}
            </span>
          )}
          {match.winnerId === match.team1Id && (
            <Trophy className="w-3 h-3 text-yellow-400 flex-shrink-0" />
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-zinc-800/80 mx-0" />

        {/* Team 2 */}
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-bold font-mono truncate flex-1 ${getTeamColor(match, match.team2Id)}`}>
            {match.team2Name ?? (match.team2Id ? `Equipo ${match.team2Id}` : "BYE")}
          </span>
          {isCompleted && match.team2Score !== null && (
            <span
              className={`text-sm font-black font-mono w-5 text-right ${
                match.winnerId === match.team2Id ? "text-green-400" : "text-zinc-500"
              }`}
            >
              {match.team2Score}
            </span>
          )}
          {match.winnerId === match.team2Id && (
            <Trophy className="w-3 h-3 text-yellow-400 flex-shrink-0" />
          )}
        </div>
      </div>

      {/* Pending indicator */}
      {isPending && !isBye && canEdit && (
        <div
          className="absolute bottom-1 right-2 text-xs font-mono opacity-60"
          style={{ color: "oklch(0.55 0.22 25)", fontSize: 9 }}
        >
          {hovered ? "CLICK PARA RESULTADO" : "PENDIENTE"}
        </div>
      )}
    </div>
  );
}

export default function BracketView({ matches, onSelectMatch, canEditResults }: BracketViewProps) {
  if (!matches || matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Swords className="w-12 h-12 text-zinc-700 mb-3" />
        <p className="text-zinc-500 font-mono text-sm">El bracket aún no ha sido generado</p>
        <p className="text-zinc-700 text-xs mt-1">Inicia el torneo para generar los enfrentamientos</p>
      </div>
    );
  }

  // Group matches by round
  const rounds = Array.from(new Set(matches.map((m) => m.round))).sort((a, b) => a - b);
  const matchesByRound = rounds.map((r) => matches.filter((m) => m.round === r));

  // Calculate positions for each match in each round
  // Round 1 has N matches, round 2 has N/2, etc.
  // Each match in round R occupies 2^(R-1) slots of the first round height
  const firstRoundCount = matchesByRound[0]?.length ?? 1;
  const slotH = CARD_H + ROW_GAP; // height of one first-round slot

  // Total height = firstRoundCount * slotH
  const totalH = firstRoundCount * slotH;

  // For each round, compute y-center positions
  const roundPositions: number[][] = rounds.map((_, ri) => {
    const count = matchesByRound[ri].length;
    const step = totalH / count;
    return Array.from({ length: count }, (_, i) => step * i + step / 2);
  });

  // SVG connector lines between rounds
  const connectors: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let ri = 0; ri < rounds.length - 1; ri++) {
    const srcPositions = roundPositions[ri];
    const dstPositions = roundPositions[ri + 1];
    const srcX = ri * (CARD_W + COL_GAP) + CARD_W;
    const dstX = (ri + 1) * (CARD_W + COL_GAP);

    // Each pair of source matches connects to one destination match
    for (let di = 0; di < dstPositions.length; di++) {
      const src1 = srcPositions[di * 2];
      const src2 = srcPositions[di * 2 + 1];
      const dst = dstPositions[di];

      if (src1 !== undefined) {
        connectors.push({ x1: srcX, y1: src1, x2: dstX, y2: dst });
      }
      if (src2 !== undefined) {
        connectors.push({ x1: srcX, y1: src2, x2: dstX, y2: dst });
      }
    }
  }

  const totalW = rounds.length * (CARD_W + COL_GAP) - COL_GAP;
  const svgPadding = 20;

  const roundLabels = (roundIndex: number, totalRounds: number) => {
    const remaining = totalRounds - roundIndex;
    if (remaining === 1) return "FINAL";
    if (remaining === 2) return "SEMIFINAL";
    if (remaining === 3) return "CUARTOS";
    return `RONDA ${roundIndex + 1}`;
  };

  return (
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
              className="text-center"
            >
              <span
                className="text-xs font-mono tracking-widest"
                style={{ color: "oklch(0.55 0.22 25)" }}
              >
                {roundLabels(ri, rounds.length)}
              </span>
            </div>
          ))}
        </div>

        {/* SVG connectors */}
        <svg
          style={{
            position: "absolute",
            top: 28,
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
                stroke="oklch(0.25 0.01 0)"
                strokeWidth={1.5}
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
                      onClick={() => onSelectMatch?.(match)}
                      canEdit={canEditResults}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
