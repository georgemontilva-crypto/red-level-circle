/**
 * SeriesPanel.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Panel de resultados de serie BOx para el bracket.
 *
 * Muestra:
 *   - Formato de la serie (BO1/BO2/BO3/BO5/BO7) con marcador actual (ej. 1 - 0)
 *   - Lista de mapas individuales con estado y resultado
 *   - Formulario para registrar el resultado de cada mapa (solo para organizadores)
 *   - Indicador de estado de apuestas (abierto / cerrado / en escrow)
 *
 * Uso:
 *   <SeriesPanel matchId={match.id} team1Name="Red Dragons" team2Name="Blue Storm"
 *                team1Id={1} team2Id={2} tournamentId={5} canEdit={true} />
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Swords, Trophy, Lock, Unlock, CheckCircle, Clock, X, ChevronDown, ChevronUp } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SeriesPanelProps {
  matchId: number;
  tournamentId: number;
  team1Id: number;
  team2Id: number;
  team1Name: string;
  team2Name: string;
  canEdit?: boolean;
  /** Callback cuando la serie se completa */
  onSeriesComplete?: (winnerId: number | null, isDraw: boolean) => void;
}

const FORMAT_LABELS: Record<string, string> = {
  BO1: "Mejor de 1",
  BO2: "Mejor de 2",
  BO3: "Mejor de 3",
  BO5: "Mejor de 5",
  BO7: "Mejor de 7",
};

const MAP_STATUS_COLORS: Record<string, string> = {
  pending: "oklch(0.45 0.01 0)",
  in_progress: "oklch(0.75 0.18 60)",
  completed: "oklch(0.65 0.18 145)",
  cancelled: "oklch(0.35 0.01 0)",
};

// ─── Componente principal ─────────────────────────────────────────────────────

export function SeriesPanel({
  matchId,
  tournamentId,
  team1Id,
  team2Id,
  team1Name,
  team2Name,
  canEdit = false,
  onSeriesComplete,
}: SeriesPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [reportingMap, setReportingMap] = useState<number | null>(null);
  const [s1, setS1] = useState("");
  const [s2, setS2] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch series data
  const { data, refetch, isLoading } = trpc.series.byMatch.useQuery(
    { matchId },
    { refetchInterval: 10_000 } // polling cada 10s para tiempo real
  );

  const reportMapMutation = trpc.series.reportMap.useMutation({
    onSuccess: async (result) => {
      await refetch();
      setReportingMap(null);
      setS1("");
      setS2("");
      setSaving(false);
      if (result.seriesComplete && onSeriesComplete) {
        onSeriesComplete(result.seriesWinnerId, result.isDraw);
      }
    },
    onError: (err) => {
      setError(err.message);
      setSaving(false);
    },
  });

  const handleReportMap = async (mapNumber: number) => {
    const n1 = parseInt(s1);
    const n2 = parseInt(s2);
    if (isNaN(n1) || isNaN(n2)) {
      setError("Ingresa scores válidos");
      return;
    }
    setError(null);
    setSaving(true);
    reportMapMutation.mutate({
      seriesId: data!.series.id,
      mapNumber,
      scoreTeam1: n1,
      scoreTeam2: n2,
      team1Id,
      team2Id,
      tournamentId,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--bg-card)" }}>
        <div className="w-4 h-4 rounded-full animate-pulse" style={{ background: "var(--bg-hover)" }} />
        <span className="text-xs text-muted-foreground">Cargando serie...</span>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { series, maps } = data;
  const isCompleted = series.status === "completed";
  const winnerName = series.seriesWinnerId === team1Id
    ? team1Name
    : series.seriesWinnerId === team2Id
    ? team2Name
    : null;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-card)",
        border: "1px solid oklch(0.55 0.22 25 / 0.25)",
      }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <Swords size={14} style={{ color: "oklch(0.65 0.22 25)" }} />
        <span className="text-xs font-display font-bold tracking-widest text-foreground flex-1 text-left">
          {FORMAT_LABELS[series.format] ?? series.format}
        </span>

        {/* Marcador de la serie */}
        <div className="flex items-center gap-2 font-mono">
          <span
            className="text-sm font-black"
            style={{
              color: series.winsTeam1 > series.winsTeam2
                ? "oklch(0.72 0.18 145)"
                : "oklch(0.75 0.01 0)",
            }}
          >
            {series.winsTeam1}
          </span>
          <span className="text-xs text-zinc-600">—</span>
          <span
            className="text-sm font-black"
            style={{
              color: series.winsTeam2 > series.winsTeam1
                ? "oklch(0.72 0.18 145)"
                : "oklch(0.75 0.01 0)",
            }}
          >
            {series.winsTeam2}
          </span>
        </div>

        {/* Estado */}
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded-full"
          style={{
            background: isCompleted
              ? "oklch(0.65 0.18 145 / 0.12)"
              : series.status === "in_progress"
              ? "oklch(0.75 0.18 60 / 0.12)"
              : "oklch(0.45 0.01 0 / 0.3)",
            color: isCompleted
              ? "oklch(0.72 0.18 145)"
              : series.status === "in_progress"
              ? "oklch(0.80 0.18 60)"
              : "oklch(0.55 0.01 0)",
          }}
        >
          {isCompleted ? "FINALIZADA" : series.status === "in_progress" ? "EN CURSO" : "PENDIENTE"}
        </span>

        {expanded ? <ChevronUp size={12} className="text-zinc-600" /> : <ChevronDown size={12} className="text-zinc-600" />}
      </button>

      {/* Ganador de la serie */}
      {isCompleted && winnerName && (
        <div
          className="flex items-center gap-2 px-4 py-2"
          style={{ background: "oklch(0.65 0.18 145 / 0.07)", borderTop: "1px solid oklch(0.65 0.18 145 / 0.15)" }}
        >
          <Trophy size={12} style={{ color: "oklch(0.72 0.18 145)" }} />
          <span className="text-xs font-mono" style={{ color: "oklch(0.72 0.18 145)" }}>
            Ganador de la serie: <strong>{winnerName}</strong>
          </span>
        </div>
      )}

      {/* BO2 empate */}
      {isCompleted && !winnerName && series.format === "BO2" && (
        <div
          className="flex items-center gap-2 px-4 py-2"
          style={{ background: "oklch(0.75 0.18 60 / 0.07)", borderTop: "1px solid oklch(0.75 0.18 60 / 0.15)" }}
        >
          <span className="text-xs font-mono" style={{ color: "oklch(0.80 0.18 60)" }}>
            Serie empatada 1-1 — apuestas reembolsadas
          </span>
        </div>
      )}

      {/* Lista de mapas */}
      {expanded && (
        <div style={{ borderTop: "1px solid oklch(0.18 0.01 0)" }}>
          {maps.map((map) => {
            const isReporting = reportingMap === map.mapNumber;
            const isMapCompleted = map.status === "completed";
            const isCancelled = map.isCancelled || map.status === "cancelled";
            const mapWinnerName = map.winnerId === team1Id
              ? team1Name
              : map.winnerId === team2Id
              ? team2Name
              : null;

            return (
              <div
                key={map.id}
                style={{
                  borderBottom: "1px solid oklch(0.15 0.01 0)",
                  opacity: isCancelled ? 0.4 : 1,
                }}
              >
                {/* Fila del mapa */}
                <div className="flex items-center gap-3 px-4 py-2.5">
                  {/* Número del mapa */}
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0"
                    style={{
                      background: isCancelled
                        ? "oklch(0.18 0.01 0)"
                        : isMapCompleted
                        ? "oklch(0.65 0.18 145 / 0.15)"
                        : "oklch(0.55 0.22 25 / 0.12)",
                      color: MAP_STATUS_COLORS[map.status],
                    }}
                  >
                    {isCancelled ? <X size={10} /> : map.mapNumber}
                  </div>

                  {/* Nombre del mapa (si existe) */}
                  {map.mapName && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {map.mapName}
                    </span>
                  )}

                  {/* Resultado del mapa */}
                  {isMapCompleted ? (
                    <div className="flex items-center gap-2 flex-1">
                      <span
                        className="text-xs font-display font-bold truncate"
                        style={{ color: map.winnerId === team1Id ? "oklch(0.72 0.18 145)" : "oklch(0.65 0.01 0)" }}
                      >
                        {team1Name}
                      </span>
                      <span className="font-mono text-xs font-black text-foreground">
                        {map.scoreTeam1} — {map.scoreTeam2}
                      </span>
                      <span
                        className="text-xs font-display font-bold truncate"
                        style={{ color: map.winnerId === team2Id ? "oklch(0.72 0.18 145)" : "oklch(0.65 0.01 0)" }}
                      >
                        {team2Name}
                      </span>
                    </div>
                  ) : isCancelled ? (
                    <span className="text-xs text-zinc-600 flex-1">No jugado</span>
                  ) : (
                    <span className="text-xs text-zinc-600 flex-1 flex items-center gap-1">
                      <Clock size={10} />
                      Pendiente
                    </span>
                  )}

                  {/* Botón de registrar resultado */}
                  {canEdit && !isMapCompleted && !isCancelled && !isCompleted && (
                    <button
                      className="text-[10px] font-mono px-2 py-1 rounded-md transition-colors flex-shrink-0"
                      style={{
                        background: isReporting ? "oklch(0.55 0.22 25 / 0.2)" : "oklch(0.55 0.22 25 / 0.1)",
                        color: "oklch(0.65 0.22 25)",
                        border: "1px solid oklch(0.55 0.22 25 / 0.3)",
                      }}
                      onClick={() => {
                        if (isReporting) {
                          setReportingMap(null);
                          setS1("");
                          setS2("");
                          setError(null);
                        } else {
                          setReportingMap(map.mapNumber);
                          setS1("");
                          setS2("");
                          setError(null);
                        }
                      }}
                    >
                      {isReporting ? "Cancelar" : "Registrar"}
                    </button>
                  )}
                </div>

                {/* Formulario de resultado del mapa */}
                {isReporting && (
                  <div
                    className="px-4 pb-3 space-y-2"
                    style={{ background: "oklch(0.10 0.005 0 / 0.5)" }}
                  >
                    <div className="flex items-center gap-2">
                      {/* Team 1 score */}
                      <span className="text-xs font-display truncate flex-1 text-foreground">
                        {team1Name}
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={999}
                        value={s1}
                        onChange={(e) => setS1(e.target.value)}
                        placeholder="0"
                        autoFocus
                        className="w-14 px-2 py-1 rounded-lg text-center text-lg font-mono font-black"
                        style={{
                          background: "var(--bg-main)",
                          border: "1px solid oklch(0.25 0.01 0)",
                          color: "oklch(0.90 0.005 0)",
                          outline: "none",
                        }}
                      />
                      <span className="text-xs text-zinc-600 font-mono">—</span>
                      <input
                        type="number"
                        min={0}
                        max={999}
                        value={s2}
                        onChange={(e) => setS2(e.target.value)}
                        placeholder="0"
                        className="w-14 px-2 py-1 rounded-lg text-center text-lg font-mono font-black"
                        style={{
                          background: "var(--bg-main)",
                          border: "1px solid oklch(0.25 0.01 0)",
                          color: "oklch(0.90 0.005 0)",
                          outline: "none",
                        }}
                      />
                      <span className="text-xs font-display truncate flex-1 text-right text-foreground">
                        {team2Name}
                      </span>
                    </div>

                    {error && (
                      <p className="text-[10px] font-mono" style={{ color: "oklch(0.65 0.22 25)" }}>
                        {error}
                      </p>
                    )}

                    <button
                      disabled={saving || s1 === "" || s2 === ""}
                      onClick={() => handleReportMap(map.mapNumber)}
                      className="w-full py-1.5 rounded-lg text-xs font-display font-bold tracking-wider transition-opacity disabled:opacity-40"
                      style={{
                        background: "oklch(0.55 0.22 25)",
                        color: "white",
                      }}
                    >
                      {saving ? "Guardando..." : "Confirmar resultado del mapa"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Estado de apuestas */}
      {series.betsOpenAt && series.betsCloseAt && (
        <div
          className="flex items-center gap-2 px-4 py-2"
          style={{
            borderTop: "1px solid oklch(0.15 0.01 0)",
            background: "oklch(0.10 0.005 0 / 0.3)",
          }}
        >
          {new Date() >= series.betsOpenAt && new Date() <= series.betsCloseAt ? (
            <>
              <Unlock size={11} style={{ color: "oklch(0.72 0.18 145)" }} />
              <span className="text-[10px] font-mono" style={{ color: "oklch(0.72 0.18 145)" }}>
                Apuestas abiertas
              </span>
            </>
          ) : new Date() > series.betsCloseAt ? (
            <>
              <Lock size={11} className="text-zinc-600" />
              <span className="text-[10px] font-mono text-zinc-600">
                Apuestas cerradas
                {series.escrowAmount > 0 && ` · ${series.escrowAmount} RLC en escrow`}
              </span>
            </>
          ) : (
            <>
              <Clock size={11} className="text-zinc-600" />
              <span className="text-[10px] font-mono text-zinc-600">
                Apuestas abren a las{" "}
                {new Date(series.betsOpenAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Botón para crear una serie BOx ──────────────────────────────────────────

interface CreateSeriesButtonProps {
  matchId: number;
  tournamentId: number;
  /** Formato por defecto del torneo (pre-seleccionado) */
  defaultFormat?: "BO1" | "BO2" | "BO3" | "BO5" | "BO7";
  onCreated?: () => void;
}

export function CreateSeriesButton({ matchId, tournamentId, defaultFormat = "BO3", onCreated }: CreateSeriesButtonProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<"BO1" | "BO2" | "BO3" | "BO5" | "BO7">(defaultFormat);
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMutation = trpc.series.create.useMutation({
    onSuccess: () => {
      setSaving(false);
      setOpen(false);
      onCreated?.();
    },
    onError: (err) => {
      setError(err.message);
      setSaving(false);
    },
  });

  const handleCreate = () => {
    setError(null);
    setSaving(true);
    createMutation.mutate({
      matchId,
      tournamentId,
      format,
      scheduledAt: scheduledAt || undefined,
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-bold tracking-wider transition-colors"
        style={{
          background: "oklch(0.55 0.22 25 / 0.12)",
          color: "oklch(0.65 0.22 25)",
          border: "1px solid oklch(0.55 0.22 25 / 0.3)",
        }}
      >
        <Swords size={12} />
        Configurar Serie
      </button>
    );
  }

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{
        background: "var(--bg-card)",
        border: "1px solid oklch(0.55 0.22 25 / 0.3)",
      }}
    >
      <div className="flex items-center gap-2">
        <Swords size={13} style={{ color: "oklch(0.65 0.22 25)" }} />
        <span className="text-xs font-display font-bold tracking-widest text-foreground">
          CONFIGURAR SERIE
        </span>
        <button onClick={() => setOpen(false)} className="ml-auto text-zinc-600 hover:text-zinc-400">
          <X size={13} />
        </button>
      </div>

      {/* Formato */}
      <div className="space-y-1">
        <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Formato</label>
        <div className="flex gap-2 flex-wrap">
          {(["BO1", "BO2", "BO3", "BO5", "BO7"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className="px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors"
              style={{
                background: format === f ? "oklch(0.55 0.22 25)" : "oklch(0.55 0.22 25 / 0.1)",
                color: format === f ? "white" : "oklch(0.65 0.22 25)",
                border: `1px solid ${format === f ? "oklch(0.55 0.22 25)" : "oklch(0.55 0.22 25 / 0.25)"}`,
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-zinc-600 font-mono">{FORMAT_LABELS[format]}</p>
      </div>

      {/* Fecha programada (opcional) */}
      <div className="space-y-1">
        <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
          Fecha del Match 1 (opcional, para apuestas)
        </label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="w-full px-3 py-1.5 rounded-lg text-xs font-mono"
          style={{
            background: "var(--bg-main)",
            border: "1px solid oklch(0.22 0.01 0)",
            color: "oklch(0.80 0.005 0)",
            outline: "none",
          }}
        />
      </div>

      {error && (
        <p className="text-[10px] font-mono" style={{ color: "oklch(0.65 0.22 25)" }}>
          {error}
        </p>
      )}

      <button
        disabled={saving}
        onClick={handleCreate}
        className="w-full py-2 rounded-lg text-xs font-display font-bold tracking-wider transition-opacity disabled:opacity-40"
        style={{ background: "oklch(0.55 0.22 25)", color: "white" }}
      >
        {saving ? "Creando..." : `Crear Serie ${format}`}
      </button>
    </div>
  );
}
