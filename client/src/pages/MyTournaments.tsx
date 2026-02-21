import { trpc } from "@/lib/trpc";
import PremiumLayout from "@/components/PremiumLayout";
import { Trophy, PlusCircle, ChevronRight, Swords, Users, Settings, Edit } from "lucide-react";
import { Link } from "wouter";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Borrador", color: "oklch(0.55 0.18 220)" },
  registration_open: { label: "Inscripciones Abiertas", color: "oklch(0.65 0.18 145)" },
  registration_closed: { label: "Inscripciones Cerradas", color: "oklch(0.55 0.22 25)" },
  in_progress: { label: "En Curso", color: "oklch(0.65 0.18 80)" },
  completed: { label: "Finalizado", color: "oklch(0.50 0.005 0)" },
  cancelled: { label: "Cancelado", color: "oklch(0.40 0.005 0)" },
};

const BRACKET_LABELS: Record<string, string> = {
  single_elimination: "Elim. Simple",
  double_elimination: "Doble Elim.",
  groups: "Grupos",
};

export default function MyTournaments() {
  const { data: tournaments, isLoading } = trpc.tournaments.myTournaments.useQuery();

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
                color: "oklch(0.98 0 0)",
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
                style={{ background: "oklch(0.10 0.005 0)" }}
              />
            ))}
          </div>
        ) : !tournaments || tournaments.length === 0 ? (
          <div
            className="rounded-2xl p-16 text-center"
            style={{
              background: "oklch(0.10 0.005 0)",
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
                  color: "oklch(0.98 0 0)",
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
              const statusInfo = STATUS_LABELS[t.status] ?? { label: t.status, color: "oklch(0.55 0.005 0)" };
              return (
                <div
                  key={t.id}
                  className="rounded-xl p-5 transition-all duration-200"
                  style={{
                    background: "oklch(0.10 0.005 0)",
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
                            background: "oklch(0.13 0.005 0)",
                            color: "oklch(0.55 0.005 0)",
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
                            background: "oklch(0.13 0.005 0)",
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
                            background: "oklch(0.13 0.005 0)",
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PremiumLayout>
  );
}
