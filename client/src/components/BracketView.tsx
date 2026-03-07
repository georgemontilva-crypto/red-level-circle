/**
 * BracketView — Visualización interactiva de brackets de torneo.
 * Soporta single_elimination, double_elimination (con secciones W/L/GF) y groups+playoffs.
 * El seriesFormat se lee del campo notes (JSON) de cada match.
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
  notes?: string | null;
  bracketPosition?: { round: number; position: number; side?: string } | null;
  /** Formato de la serie si ya fue configurada (BO1/BO2/BO3/BO5/BO7) */
  seriesFormat?: string | null;
  seriesScore1?: number | null;
  seriesScore2?: number | null;
}

interface BracketViewProps {
  matches: BracketMatch[];
  onDeclareWinner?: (matchId: number, team1Score: number, team2Score: number) => Promise<void>;
  canEditResults?: boolean;
  showDemo?: boolean;
  defaultSeriesFormat?: string;
}

const CARD_H = 90;
const CARD_W = 240;
const COL_GAP = 88;
const ROW_GAP = 28;

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

function getSeriesFormat(match: BracketMatch, defaultFmt?: string): string | null {
  // Priority: match.seriesFormat > notes JSON > defaultFmt
  if (match.seriesFormat) return match.seriesFormat;
  if (match.notes) {
    try {
      const parsed = JSON.parse(match.notes);
      if (parsed?.seriesFormat) return parsed.seriesFormat;
    } catch {
      // notes is plain text (e.g. "BYE")
    }
  }
  return defaultFmt ?? null;
}

function getMatchSide(match: BracketMatch): string {
  if (match.bracketPosition && typeof match.bracketPosition === "object") {
    return (match.bracketPosition as any).side ?? "winners";
  }
  return "winners";
}

function getMatchInfo(match: BracketMatch): string | null {
  if (match.notes) {
    try {
      const parsed = JSON.parse(match.notes);
      return parsed?.info ?? null;
    } catch {
      return match.notes === "BYE" ? "BYE" : null;
    }
  }
  return null;
}

// ─── Score Modal ──────────────────────────────────────────────────────────────
function ScoreModal({
  match,
  onClose,
  onSubmit,
  defaultSeriesFormat,
}: {
  match: BracketMatch;
  onClose: () => void;
  onSubmit: (matchId: number, s1: number, s2: number) => Promise<void>;
  defaultSeriesFormat?: string;
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

  const fmt = getSeriesFormat(match, defaultSeriesFormat);

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
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-1">
          <Swords size={16} style={{ color: "oklch(0.55 0.22 25)" }} />
          <h3 className="font-display text-base font-bold tracking-wider text-foreground">
            REGISTRAR RESULTADO
          </h3>
          {fmt && (
            <span
              className="ml-auto text-xs font-mono font-bold px-2 py-0.5 rounded"
              style={{ background: "oklch(0.55 0.22 25 / 0.15)", color: "oklch(0.65 0.22 25)" }}
            >
              {fmt}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-mono mb-5">
          #{match.matchNumber} · {match.team1Name ?? "TBD"} vs {match.team2Name ?? "TBD"}
        </p>

        <div className="space-y-3 mb-4">
          {[
            { name: match.team1Name, val: s1, set: setS1, score: n1, other: n2 },
            { name: match.team2Name, val: s2, set: setS2, score: n2, other: n1 },
          ].map((team, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: "oklch(0.55 0.22 25 / 0.15)", color: "oklch(0.65 0.22 25)" }}
              >
                {(team.name ?? "?").charAt(0).toUpperCase()}
              </div>
              <span className="flex-1 text-sm font-display tracking-wide text-foreground truncate">
                {team.name ?? "TBD"}
              </span>
              <input
                type="number"
                min={0}
                max={99}
                value={team.val}
                onChange={(e) => team.set(e.target.value)}
                placeholder="0"
                className="w-16 px-2 py-2 rounded-lg text-center text-lg font-mono font-bold transition-all duration-200"
                style={{
                  background: "var(--bg-main)",
                  border: valid && !isDraw && team.score > team.other
                    ? "1px solid oklch(0.65 0.18 145 / 0.7)"
                    : "1px solid oklch(0.22 0.01 0)",
                  color: valid && !isDraw && team.score > team.other
                    ? "oklch(0.75 0.18 145)"
                    : "oklch(0.90 0.005 0)",
                  outline: "none",
                }}
              />
            </div>
          ))}
        </div>

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
            style={{ background: "transparent", border: "1px solid oklch(0.22 0.01 0)", color: "var(--text-muted)" }}
          >
            CANCELAR
          </button>
          <button
            onClick={handleSubmit}
            disabled={!valid || isDraw || saving}
            className="flex-1 py-2.5 rounded-xl font-display text-xs tracking-widest transition-all duration-200 disabled:opacity-40"
            style={{ background: "oklch(0.55 0.22 25)", color: "var(--text-primary)", boxShadow: "0 0 12px oklch(0.55 0.22 25 / 0.35)" }}
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
  defaultSeriesFormat,
}: {
  match: BracketMatch;
  canEdit?: boolean;
  onOpenScoreModal?: (match: BracketMatch) => void;
  isDemo?: boolean;
  defaultSeriesFormat?: string;
}) {
  const isPending = match.status === "pending";
  const isCompleted = match.status === "completed";
  const hasBothTeams = match.team1Id !== null && match.team2Id !== null;
  const canDeclare = canEdit && isPending && hasBothTeams && !isDemo;
  const fmt = getSeriesFormat(match, defaultSeriesFormat);
  const info = getMatchInfo(match);
  const isGrandFinal = info === "GRAND_FINAL";
  const isBracketReset = info === "BRACKET_RESET";

  const borderColor = isGrandFinal
    ? "oklch(0.65 0.18 80 / 0.6)"
    : isCompleted
    ? "oklch(0.65 0.18 145 / 0.45)"
    : "oklch(0.20 0.01 0)";

  const glowShadow = isGrandFinal
    ? "0 0 20px oklch(0.65 0.18 80 / 0.25)"
    : isCompleted
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
        {isWinner && <Trophy className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
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
        <span
          className={`text-sm font-black font-mono w-5 text-right flex-shrink-0 ${
            isCompleted
              ? isWinner ? "text-green-400" : "text-muted-foreground"
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
        background: isGrandFinal
          ? "oklch(0.65 0.18 80 / 0.06)"
          : isDemo ? "oklch(0.09 0.005 0)" : "oklch(0.10 0.005 0)",
        border: `1px solid ${borderColor}`,
        boxShadow: glowShadow,
        opacity: isDemo && match.team1Id === null ? 0.5 : isBracketReset && match.team1Id === null ? 0.4 : 1,
      }}
      onClick={() => canDeclare && onOpenScoreModal?.(match)}
    >
      <div className="absolute top-1 left-2 text-xs font-mono opacity-30" style={{ fontSize: 9 }}>
        #{match.matchNumber}
      </div>

      {/* Badge de formato de serie */}
      {fmt && !isDemo && (
        <div
          className="absolute top-1 right-2 text-xs font-mono font-bold"
          style={{ fontSize: 8, color: isGrandFinal ? "oklch(0.65 0.18 80)" : "oklch(0.65 0.22 25)", opacity: 0.85 }}
        >
          {fmt}
          {match.seriesScore1 != null && match.seriesScore2 != null && (
            <span style={{ color: "oklch(0.80 0.005 0)" }}>
              {" "}{match.seriesScore1}-{match.seriesScore2}
            </span>
          )}
        </div>
      )}

      {isDemo && (
        <div className="absolute top-1 right-2 text-xs font-mono opacity-40" style={{ fontSize: 8, color: "oklch(0.55 0.22 25)" }}>
          EJEMPLO
        </div>
      )}

      {canDeclare && (
        <div
          className="absolute top-1 right-2 text-xs font-mono opacity-50"
          style={{ fontSize: 8, color: "oklch(0.55 0.22 25)" }}
        >
          CLIC PARA REGISTRAR
        </div>
      )}

      {isGrandFinal && (
        <div className="absolute bottom-1 left-2 text-xs font-mono font-bold" style={{ fontSize: 8, color: "oklch(0.65 0.18 80)", opacity: 0.8 }}>
          GRAN FINAL
        </div>
      )}
      {isBracketReset && (
        <div className="absolute bottom-1 left-2 text-xs font-mono font-bold" style={{ fontSize: 8, color: "oklch(0.55 0.18 220)", opacity: 0.7 }}>
          BRACKET RESET
        </div>
      )}

      <div className="flex flex-col justify-center h-full pt-3 gap-0">
        <TeamRow teamId={match.team1Id} teamName={match.team1Name} score={match.team1Score} />
        <div className="h-px mx-3" style={{ background: "var(--bg-hover)" }} />
        <TeamRow teamId={match.team2Id} teamName={match.team2Name} score={match.team2Score} />
      </div>
    </div>
  );
}

// ─── SingleBracketSection ─────────────────────────────────────────────────────
function SingleBracketSection({
  sectionMatches,
  sectionLabel,
  sectionColor,
  canEditResults,
  onOpenScoreModal,
  isDemo,
  defaultSeriesFormat,
}: {
  sectionMatches: BracketMatch[];
  sectionLabel?: string;
  sectionColor?: string;
  canEditResults?: boolean;
  onOpenScoreModal?: (m: BracketMatch) => void;
  isDemo?: boolean;
  defaultSeriesFormat?: string;
}) {
  const rounds = Array.from(new Set(sectionMatches.map((m) => m.round))).sort((a, b) => a - b);
  const matchesByRound = rounds.map((r) => sectionMatches.filter((m) => m.round === r));
  const firstRoundCount = matchesByRound[0]?.length ?? 1;
  const slotH = CARD_H + ROW_GAP;
  const totalH = Math.max(firstRoundCount * slotH, CARD_H + ROW_GAP);

  const roundPositions: number[][] = rounds.map((_, ri) => {
    const count = matchesByRound[ri].length;
    const step = totalH / count;
    return Array.from({ length: count }, (_, i) => step * i + step / 2);
  });

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
      if (src1 !== undefined) connectors.push({ x1: srcX, y1: src1, x2: dstX, y2: dst, done: srcMatch1?.status === "completed" });
      if (src2 !== undefined) connectors.push({ x1: srcX, y1: src2, x2: dstX, y2: dst, done: srcMatch2?.status === "completed" });
    }
  }

  const totalW = rounds.length * (CARD_W + COL_GAP) - COL_GAP;
  const svgPadding = 20;
  const color = sectionColor ?? "oklch(0.55 0.22 25)";

  return (
    <div className="mb-8">
      {sectionLabel && (
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1" style={{ background: `${color}30` }} />
          <span
            className="text-xs font-display tracking-widest px-3 py-1 rounded-full font-bold"
            style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}
          >
            {sectionLabel}
          </span>
          <div className="h-px flex-1" style={{ background: `${color}30` }} />
        </div>
      )}
      <div className="overflow-x-auto pb-4">
        <div style={{ position: "relative", width: totalW + svgPadding * 2, minWidth: totalW + svgPadding * 2 }}>
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
                  style={{ color, background: `${color}08`, border: `1px solid ${color}20` }}
                >
                  {roundLabel(ri, rounds.length)}
                </span>
              </div>
            ))}
          </div>

          {/* SVG connectors */}
          <svg
            style={{ position: "absolute", top: 36, left: svgPadding, width: totalW, height: totalH, pointerEvents: "none", overflow: "visible" }}
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
                    <div key={match.id} style={{ position: "absolute", top: yCenter - CARD_H / 2, left: 0 }}>
                      <MatchCard
                        match={match}
                        canEdit={canEditResults}
                        onOpenScoreModal={onOpenScoreModal}
                        isDemo={isDemo}
                        defaultSeriesFormat={defaultSeriesFormat}
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

// ─── BracketView ──────────────────────────────────────────────────────────────
export default function BracketView({
  matches,
  onDeclareWinner,
  canEditResults,
  showDemo = false,
  defaultSeriesFormat,
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

  // Detect if this is a double elimination bracket
  const sides = new Set(effectiveMatches.map((m) => getMatchSide(m)));
  const isDoubleElim = sides.has("losers") || sides.has("grand_final");
  const hasGroups = sides.has("groups");
  const hasPlayoffs = sides.has("playoffs");

  return (
    <>
      <div>
        {isDemo && (
          <div
            className="mb-4 px-4 py-2.5 rounded-lg text-xs font-mono flex items-center gap-2"
            style={{ background: "oklch(0.55 0.22 25 / 0.08)", border: "1px solid oklch(0.55 0.22 25 / 0.25)", color: "oklch(0.65 0.22 25)" }}
          >
            <Trophy className="w-3.5 h-3.5 flex-shrink-0" />
            Vista previa — Este es un ejemplo de cómo se verá el bracket cuando el torneo esté en curso.
          </div>
        )}

        {isDoubleElim ? (
          // ── DOUBLE ELIMINATION VIEW ──────────────────────────────────────────
          <>
            <SingleBracketSection
              sectionMatches={effectiveMatches.filter((m) => getMatchSide(m) === "winners")}
              sectionLabel="BRACKET DE GANADORES"
              sectionColor="oklch(0.65 0.18 145)"
              canEditResults={canEditResults}
              onOpenScoreModal={setScoreModal}
              isDemo={isDemo}
              defaultSeriesFormat={defaultSeriesFormat}
            />
            {effectiveMatches.some((m) => getMatchSide(m) === "losers") && (
              <SingleBracketSection
                sectionMatches={effectiveMatches.filter((m) => getMatchSide(m) === "losers")}
                sectionLabel="BRACKET DE PERDEDORES"
                sectionColor="oklch(0.55 0.22 25)"
                canEditResults={canEditResults}
                onOpenScoreModal={setScoreModal}
                isDemo={isDemo}
                defaultSeriesFormat={defaultSeriesFormat}
              />
            )}
            {effectiveMatches.some((m) => getMatchSide(m) === "grand_final") && (
              <SingleBracketSection
                sectionMatches={effectiveMatches.filter((m) => getMatchSide(m) === "grand_final")}
                sectionLabel="GRAN FINAL"
                sectionColor="oklch(0.65 0.18 80)"
                canEditResults={canEditResults}
                onOpenScoreModal={setScoreModal}
                isDemo={isDemo}
                defaultSeriesFormat={defaultSeriesFormat}
              />
            )}
          </>
        ) : hasGroups || hasPlayoffs ? (
          // ── GROUPS + PLAYOFFS VIEW ───────────────────────────────────────────
          <>
            {effectiveMatches.some((m) => getMatchSide(m) === "groups") && (
              <SingleBracketSection
                sectionMatches={effectiveMatches.filter((m) => getMatchSide(m) === "groups")}
                sectionLabel="FASE DE GRUPOS"
                sectionColor="oklch(0.55 0.18 220)"
                canEditResults={canEditResults}
                onOpenScoreModal={setScoreModal}
                isDemo={isDemo}
                defaultSeriesFormat={defaultSeriesFormat}
              />
            )}
            {effectiveMatches.some((m) => getMatchSide(m) === "playoffs") && (
              <SingleBracketSection
                sectionMatches={effectiveMatches.filter((m) => getMatchSide(m) === "playoffs")}
                sectionLabel="PLAYOFFS"
                sectionColor="oklch(0.65 0.18 80)"
                canEditResults={canEditResults}
                onOpenScoreModal={setScoreModal}
                isDemo={isDemo}
                defaultSeriesFormat={defaultSeriesFormat}
              />
            )}
          </>
        ) : (
          // ── SINGLE ELIMINATION VIEW ──────────────────────────────────────────
          <SingleBracketSection
            sectionMatches={effectiveMatches}
            canEditResults={canEditResults}
            onOpenScoreModal={setScoreModal}
            isDemo={isDemo}
            defaultSeriesFormat={defaultSeriesFormat}
          />
        )}
      </div>

      {scoreModal && (
        <ScoreModal
          match={scoreModal}
          onClose={() => setScoreModal(null)}
          onSubmit={async (matchId, s1, s2) => {
            await onDeclareWinner?.(matchId, s1, s2);
            setScoreModal(null);
          }}
          defaultSeriesFormat={defaultSeriesFormat}
        />
      )}
    </>
  );
}
