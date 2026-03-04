import { trpc } from "@/lib/trpc";
import PremiumLayout from "@/components/PremiumLayout";
import { Trophy, PlusCircle, Users, Settings, Edit, Trash2, AlertTriangle, X } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Borrador", color: "oklch(0.55 0.18 220)" },
  pending_approval: { label: "Pendiente", color: "oklch(0.65 0.18 60)" },
  registration_open: { label: "Inscripciones Abiertas", color: "oklch(0.65 0.18 145)" },
  registration_closed: { label: "Inscripciones Cerradas", color: "oklch(0.55 0.22 25)" },
  in_progress: { label: "En Curso", color: "oklch(0.65 0.18 80)" },
  completed: { label: "Finalizado", color: "var(--text-muted)" },
  cancelled: { label: "Cancelado", color: "oklch(0.40 0.005 0)" },
};

const BRACKET_LABELS: Record<string, string> = {
  single_elimination: "Elim. Simple",
  double_elimination: "Doble Elim.",
  groups: "Grupos",
};

// Statuses where deletion is blocked
const BLOCKED_DELETE = ["in_progress", "completed"];

export default function MyTournaments() {
  const utils = trpc.useUtils();
  const { data: tournaments, isLoading } = trpc.tournaments.myTournaments.useQuery();
  const deleteMutation = trpc.tournaments.delete.useMutation({
    onSuccess: () => {
      toast.success("Torneo eliminado correctamente.");
      utils.tournaments.myTournaments.invalidate();
      setConfirmId(null);
    },
    onError: (err) => {
      toast.error(err.message ?? "Error al eliminar el torneo.");
      setConfirmId(null);
    },
  });

  const [confirmId, setConfirmId] = useState<number | null>(null);
  const confirmTournament = tournaments?.find((t) => t.id === confirmId);

  return (
    <PremiumLayout title="MIS TORNEOS">
      <div className="max-w-5xl mx-auto space-y-6 overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">
              {tournaments?.length ?? 0} torneo{(tournaments?.length ?? 0) !== 1 ? "s" : ""} creado
              {(tournaments?.length ?? 0) !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/dashboard/create-tournament">
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-display text-xs tracking-widest transition-all duration-300"
              style={{
                background: "oklch(0.55 0.22 25)",
                color: "var(--text-primary)",
                boxShadow: "0 0 12px oklch(0.55 0.22 25 / 0.4)",
              }}
            >
              <PlusCircle size={14} /> CREAR TORNEO
            </button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl h-24 animate-pulse"
                style={{ background: "var(--bg-card)" }}
              />
            ))}
          </div>
        ) : !tournaments || tournaments.length === 0 ? (
          <div
            className="rounded-2xl p-16 text-center"
            style={{
              background: "var(--bg-card)",
              border: "1px solid oklch(0.18 0.01 0)",
            }}
          >
            <Trophy size={48} className="mx-auto mb-4" style={{ color: "oklch(0.25 0.01 0)" }} />
            <h3 className="font-display text-xl font-bold tracking-wider text-foreground mb-2">
              AÚN NO HAY TORNEOS
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Crea tu primer torneo y comienza a gestionar equipos
            </p>
            <Link href="/dashboard/create-tournament">
              <button
                className="px-8 py-3 rounded-xl font-display text-sm tracking-widest transition-all duration-300"
                style={{
                  background: "oklch(0.55 0.22 25)",
                  color: "var(--text-primary)",
                  boxShadow: "0 0 15px oklch(0.55 0.22 25 / 0.4)",
                }}
              >
                CREAR PRIMER TORNEO
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tournaments.map((t) => {
              const statusInfo = STATUS_LABELS[t.status] ?? { label: t.status, color: "var(--text-muted)" };
              const canDelete = !BLOCKED_DELETE.includes(t.status);
              return (
                <div
                  key={t.id}
                  className="rounded-xl p-5 transition-all duration-200"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid oklch(0.18 0.01 0)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "oklch(0.55 0.22 25 / 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "oklch(0.18 0.01 0)";
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span
                          className="text-xs font-display tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            background: `${statusInfo.color}20`,
                            border: `1px solid ${statusInfo.color}40`,
                            color: statusInfo.color,
                          }}
                        >
                          {statusInfo.label}
                        </span>
                        <span
                          className="text-xs font-tech px-2 py-0.5 rounded"
                          style={{
                            background: "var(--bg-card)",
                            color: "var(--text-muted)",
                          }}
                        >
                          {t.game}
                        </span>
                        <span
                          className="text-xs font-display tracking-wider"
                          style={{ color: "oklch(0.45 0.005 0)" }}
                        >
                          {BRACKET_LABELS[t.bracketType] ?? t.bracketType}
                        </span>
                      </div>
                      <h3 className="font-display text-lg font-bold tracking-wide text-foreground truncate">
                        {t.name}
                      </h3>
                      {t.description && (
                        <p className="text-muted-foreground text-sm mt-1 line-clamp-1">
                          {t.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users size={12} /> Máx. {t.maxTeams} equipos
                        </span>
                        {t.startDate && (
                          <span>
                            {new Date(t.startDate).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/tournaments/${t.id}`}>
                        <button
                          className="px-3 py-2 rounded-lg font-display text-xs tracking-wider transition-all duration-200"
                          style={{
                            background: "var(--bg-card)",
                            border: "1px solid oklch(0.22 0.01 0)",
                            color: "oklch(0.60 0.005 0)",
                          }}
                        >
                          VER
                        </button>
                      </Link>
                      <Link href={`/dashboard/edit-tournament/${t.id}`}>
                        <button
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-display text-xs tracking-wider transition-all duration-200"
                          style={{
                            background: "var(--bg-card)",
                            border: "1px solid oklch(0.55 0.22 25 / 0.4)",
                            color: "oklch(0.65 0.22 25)",
                          }}
                        >
                          <Edit size={12} /> EDITAR
                        </button>
                      </Link>
                      <Link href={`/dashboard/tournament/${t.id}`}>
                        <button
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-display text-xs tracking-wider transition-all duration-200"
                          style={{
                            background: "oklch(0.55 0.22 25 / 0.15)",
                            border: "1px solid oklch(0.55 0.22 25 / 0.3)",
                            color: "oklch(0.65 0.22 25)",
                          }}
                        >
                          <Settings size={12} /> GESTIONAR
                        </button>
                      </Link>
                      {/* Delete button — hidden for in_progress / completed */}
                      {canDelete && (
                        <button
                          onClick={() => setConfirmId(t.id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-display text-xs tracking-wider transition-all duration-200"
                          style={{
                            background: "oklch(0.35 0.18 25 / 0.15)",
                            border: "1px solid oklch(0.45 0.18 25 / 0.4)",
                            color: "oklch(0.60 0.18 25)",
                          }}
                          title="Eliminar torneo"
                        >
                          <Trash2 size={12} /> ELIMINAR
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Confirmation Modal ── */}
      {confirmId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => setConfirmId(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl p-8"
            style={{
              background: "#16191f",
              border: "1px solid oklch(0.45 0.18 25 / 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setConfirmId(null)}
              className="absolute top-4 right-4 p-1 rounded-lg transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              <X size={18} />
            </button>

            {/* Icon */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "oklch(0.35 0.18 25 / 0.2)", border: "1px solid oklch(0.45 0.18 25 / 0.4)" }}
            >
              <AlertTriangle size={28} style={{ color: "oklch(0.60 0.18 25)" }} />
            </div>

            <h2
              className="font-display text-xl font-bold tracking-widest text-center mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              ELIMINAR TORNEO
            </h2>
            <p className="text-center text-sm mb-1" style={{ color: "var(--text-muted)" }}>
              ¿Estás seguro de que deseas eliminar
            </p>
            <p
              className="text-center font-display font-bold tracking-wide mb-5"
              style={{ color: "oklch(0.65 0.22 25)" }}
            >
              "{confirmTournament?.name}"
            </p>
            <p className="text-center text-xs mb-8" style={{ color: "oklch(0.45 0.005 0)" }}>
              Esta acción es irreversible. Se eliminarán todas las inscripciones, partidos y apuestas asociadas.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 py-3 rounded-xl font-display text-xs tracking-widest transition-all duration-200"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid oklch(0.22 0.01 0)",
                  color: "var(--text-muted)",
                }}
              >
                CANCELAR
              </button>
              <button
                onClick={() => deleteMutation.mutate({ id: confirmId })}
                disabled={deleteMutation.isPending}
                className="flex-1 py-3 rounded-xl font-display text-xs tracking-widest transition-all duration-200 disabled:opacity-50"
                style={{
                  background: "oklch(0.45 0.18 25)",
                  border: "1px solid oklch(0.50 0.20 25)",
                  color: "#fff",
                }}
              >
                {deleteMutation.isPending ? "ELIMINANDO..." : "SÍ, ELIMINAR"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PremiumLayout>
  );
}
