import { trpc } from "@/lib/trpc";
import PremiumLayout from "@/components/PremiumLayout";
import { useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  Users,
  Trophy,
  Eye,
  AlertCircle,
  History,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  Pendiente: {
    label: "Pendiente",
    color: "oklch(0.65 0.18 80)",
    icon: <Clock size={14} />,
  },
  Aprobado: {
    label: "Aprobado",
    color: "oklch(0.65 0.18 145)",
    icon: <CheckCircle size={14} />,
  },
  Rechazado: {
    label: "Rechazado",
    color: "oklch(0.55 0.22 25)",
    icon: <XCircle size={14} />,
  },
  Cancelado: {
    label: "Cancelado",
    color: "oklch(0.45 0.005 0)",
    icon: <AlertCircle size={14} />,
  },
};

export default function ManageRegistrations() {
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [actionModal, setActionModal] = useState<{
    regId: number;
    action: "Aprobado" | "Rechazado" | "Cancelado";
    teamName: string;
  } | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [auditModal, setAuditModal] = useState<number | null>(null);

  const { data: myTournaments } = trpc.tournaments.myTournaments.useQuery();
  const { data: registrations, refetch } = trpc.registrations.byTournament.useQuery(
    { tournamentId: selectedTournamentId!, status: statusFilter || undefined },
    { enabled: !!selectedTournamentId }
  );
  const { data: auditLog } = trpc.registrations.auditLog.useQuery(
    { registrationId: auditModal! },
    { enabled: !!auditModal }
  );

  const updateStatusMutation = trpc.registrations.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Estado actualizado correctamente");
      setActionModal(null);
      setActionMessage("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const filteredRegistrations = registrations?.filter((r) =>
    search
      ? r.teamName?.toLowerCase().includes(search.toLowerCase()) ||
        r.teamMessage?.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const statusCounts = registrations?.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <PremiumLayout title="GESTIÓN DE INSCRIPCIONES">
      <div className="max-w-6xl mx-auto space-y-6 overflow-x-hidden">
        {/* Tournament selector */}
        <div
          className="rounded-xl p-5"
          style={{
            background: "oklch(0.10 0.005 0)",
            border: "1px solid oklch(0.18 0.01 0)",
          }}
        >
          <label className="block text-xs font-display tracking-wider text-muted-foreground mb-3">
            SELECCIONAR TORNEO
          </label>
          {!myTournaments || myTournaments.length === 0 ? (
            <div className="text-center py-4">
              <Trophy size={24} className="mx-auto mb-2" style={{ color: "oklch(0.30 0.01 0)" }} />
              <p className="text-muted-foreground text-sm">No tienes torneos creados</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {myTournaments.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTournamentId(t.id)}
                  className="px-4 py-2 rounded-lg font-display text-xs tracking-wider transition-all duration-200"
                  style={
                    selectedTournamentId === t.id
                      ? {
                          background: "oklch(0.55 0.22 25)",
                          color: "oklch(0.98 0 0)",
                          boxShadow: "0 0 10px oklch(0.55 0.22 25 / 0.4)",
                        }
                      : {
                          background: "oklch(0.13 0.005 0)",
                          border: "1px solid oklch(0.22 0.01 0)",
                          color: "oklch(0.60 0.005 0)",
                        }
                  }
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedTournamentId && (
          <>
            {/* Status summary */}
            {statusCounts && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(statusFilter === status ? "" : status)}
                    className="rounded-xl p-4 text-center transition-all duration-200"
                    style={
                      statusFilter === status
                        ? {
                            background: `${cfg.color}15`,
                            border: `1px solid ${cfg.color}50`,
                          }
                        : {
                            background: "oklch(0.10 0.005 0)",
                            border: "1px solid oklch(0.18 0.01 0)",
                          }
                    }
                  >
                    <div className="flex justify-center mb-1" style={{ color: cfg.color }}>
                      {cfg.icon}
                    </div>
                    <div
                      className="font-display text-2xl font-black"
                      style={{ color: cfg.color }}
                    >
                      {statusCounts[status] ?? 0}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 font-display tracking-wider">
                      {cfg.label}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Filters */}
            <div
              className="rounded-xl p-4 flex flex-col sm:flex-row gap-3"
              style={{
                background: "oklch(0.10 0.005 0)",
                border: "1px solid oklch(0.18 0.01 0)",
              }}
            >
              <div className="flex-1 relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "oklch(0.45 0.005 0)" }}
                />
                <input
                  type="text"
                  placeholder="Buscar por equipo o mensaje..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg text-sm transition-all duration-200"
                  style={{
                    background: "oklch(0.09 0.005 0)",
                    border: "1px solid oklch(0.22 0.01 0)",
                    color: "oklch(0.90 0.005 0)",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "oklch(0.55 0.22 25)";
                    e.target.style.boxShadow = "0 0 6px oklch(0.55 0.22 25 / 0.3)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "oklch(0.22 0.01 0)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                  <SelectTrigger className="min-w-[180px]">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los estados</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([v, cfg]) => (
                      <SelectItem key={v} value={v}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: "oklch(0.10 0.005 0)",
                border: "1px solid oklch(0.18 0.01 0)",
              }}
            >
              {/* Table header */}
              <div
                className="grid grid-cols-12 gap-3 px-5 py-3 text-xs font-display tracking-wider"
                style={{
                  background: "oklch(0.09 0.005 0)",
                  borderBottom: "1px solid oklch(0.18 0.01 0)",
                  color: "oklch(0.50 0.005 0)",
                }}
              >
                <div className="col-span-3">EQUIPO</div>
                <div className="col-span-2">ESTADO</div>
                <div className="col-span-3">MENSAJE</div>
                <div className="col-span-2">FECHA</div>
                <div className="col-span-2 text-right">ACCIONES</div>
              </div>

              {/* Rows */}
              {!filteredRegistrations || filteredRegistrations.length === 0 ? (
                <div className="py-12 text-center">
                  <Users size={32} className="mx-auto mb-3" style={{ color: "oklch(0.25 0.01 0)" }} />
                  <p className="text-muted-foreground font-display tracking-wider text-sm">
                    No hay inscripciones
                  </p>
                  {statusFilter && (
                    <button
                      onClick={() => setStatusFilter("")}
                      className="mt-2 text-xs font-display tracking-wider"
                      style={{ color: "oklch(0.55 0.22 25)" }}
                    >
                      Limpiar filtro
                    </button>
                  )}
                </div>
              ) : (
                filteredRegistrations.map((reg, idx) => {
                  const cfg = STATUS_CONFIG[reg.status] ?? STATUS_CONFIG["Pendiente"];
                  return (
                    <div
                      key={reg.id}
                      className="grid grid-cols-12 gap-3 px-5 py-4 items-center transition-all duration-150"
                      style={{
                        borderBottom:
                          idx < filteredRegistrations.length - 1
                            ? "1px solid oklch(0.14 0.005 0)"
                            : "none",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "oklch(0.11 0.005 0)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {/* Team */}
                      <div className="col-span-3 flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{
                            background: "oklch(0.55 0.22 25 / 0.15)",
                            color: "oklch(0.65 0.22 25)",
                          }}
                        >
                          {reg.teamName?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <span className="text-sm text-foreground font-display tracking-wide truncate">
                          {reg.teamName ?? `Equipo #${reg.teamId}`}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <span
                          className="inline-flex items-center gap-1 text-xs font-display tracking-wider px-2 py-1 rounded-full"
                          style={{
                            background: `${cfg.color}15`,
                            border: `1px solid ${cfg.color}40`,
                            color: cfg.color,
                          }}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </div>

                      {/* Message */}
                      <div className="col-span-3">
                        <p className="text-xs text-muted-foreground truncate">
                          {reg.teamMessage ?? "Sin mensaje"}
                        </p>
                      </div>

                      {/* Date */}
                      <div className="col-span-2">
                        <span className="text-xs text-muted-foreground font-tech">
                          {new Date(reg.registeredAt).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex items-center justify-end gap-1">
                        {/* Audit log */}
                        <button
                          onClick={() => setAuditModal(reg.id)}
                          className="p-1.5 rounded-lg transition-all duration-150"
                          style={{
                            background: "oklch(0.13 0.005 0)",
                            color: "oklch(0.55 0.005 0)",
                          }}
                          title="Ver historial"
                        >
                          <History size={14} />
                        </button>

                        {reg.status === "Pendiente" && (
                          <>
                            <button
                              onClick={() =>
                                setActionModal({
                                  regId: reg.id,
                                  action: "Aprobado",
                                  teamName: reg.teamName ?? `Equipo #${reg.teamId}`,
                                })
                              }
                              className="p-1.5 rounded-lg transition-all duration-150"
                              style={{
                                background: "oklch(0.65 0.18 145 / 0.15)",
                                color: "oklch(0.65 0.18 145)",
                              }}
                              title="Aprobar"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() =>
                                setActionModal({
                                  regId: reg.id,
                                  action: "Rechazado",
                                  teamName: reg.teamName ?? `Equipo #${reg.teamId}`,
                                })
                              }
                              className="p-1.5 rounded-lg transition-all duration-150"
                              style={{
                                background: "oklch(0.55 0.22 25 / 0.15)",
                                color: "oklch(0.65 0.22 25)",
                              }}
                              title="Rechazar"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        {reg.status === "Aprobado" && (
                          <button
                            onClick={() =>
                              setActionModal({
                                regId: reg.id,
                                action: "Cancelado",
                                teamName: reg.teamName ?? `Equipo #${reg.teamId}`,
                              })
                            }
                            className="p-1.5 rounded-lg transition-all duration-150"
                            style={{
                              background: "oklch(0.45 0.005 0 / 0.2)",
                              color: "oklch(0.55 0.005 0)",
                            }}
                            title="Cancelar"
                          >
                            <AlertCircle size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Action Modal */}
      {actionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 0.8)" }}
          onClick={() => { setActionModal(null); setActionMessage(""); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{
              background: "oklch(0.10 0.005 0)",
              border: `1px solid ${STATUS_CONFIG[actionModal.action]?.color ?? "oklch(0.55 0.22 25)"}40`,
              boxShadow: `0 0 40px ${STATUS_CONFIG[actionModal.action]?.color ?? "oklch(0.55 0.22 25)"}15`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="p-2 rounded-lg"
                style={{
                  background: `${STATUS_CONFIG[actionModal.action]?.color}20`,
                  color: STATUS_CONFIG[actionModal.action]?.color,
                }}
              >
                {STATUS_CONFIG[actionModal.action]?.icon}
              </div>
              <div>
                <h3 className="font-display text-lg font-bold tracking-wider text-foreground">
                  {actionModal.action === "Aprobado"
                    ? "APROBAR EQUIPO"
                    : actionModal.action === "Rechazado"
                    ? "RECHAZAR EQUIPO"
                    : "CANCELAR INSCRIPCIÓN"}
                </h3>
                <p className="text-muted-foreground text-sm">{actionModal.teamName}</p>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-display tracking-wider text-muted-foreground mb-2">
                MENSAJE PARA EL EQUIPO (OPCIONAL)
              </label>
              <textarea
                value={actionMessage}
                onChange={(e) => setActionMessage(e.target.value)}
                placeholder={
                  actionModal.action === "Aprobado"
                    ? "Ej: Bienvenidos al torneo. Revisen el canal de Discord..."
                    : actionModal.action === "Rechazado"
                    ? "Ej: El equipo no cumple con los requisitos mínimos..."
                    : "Ej: La inscripción ha sido cancelada por..."
                }
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm font-sans resize-none transition-all duration-200"
                style={{
                  background: "oklch(0.09 0.005 0)",
                  border: "1px solid oklch(0.22 0.01 0)",
                  color: "oklch(0.90 0.005 0)",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "oklch(0.55 0.22 25)";
                  e.target.style.boxShadow = "0 0 8px oklch(0.55 0.22 25 / 0.3)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "oklch(0.22 0.01 0)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setActionModal(null); setActionMessage(""); }}
                className="flex-1 py-3 rounded-xl font-display text-xs tracking-widest"
                style={{
                  background: "transparent",
                  border: "1px solid oklch(0.25 0.01 0)",
                  color: "oklch(0.60 0.005 0)",
                }}
              >
                CANCELAR
              </button>
              <button
                onClick={() =>
                  updateStatusMutation.mutate({
                    id: actionModal.regId,
                    status: actionModal.action,
                    creatorMessage: actionMessage || undefined,
                  })
                }
                disabled={updateStatusMutation.isPending}
                className="flex-1 py-3 rounded-xl font-display text-xs tracking-widest transition-all duration-300 disabled:opacity-50"
                style={{
                  background: STATUS_CONFIG[actionModal.action]?.color,
                  color: "oklch(0.98 0 0)",
                  boxShadow: `0 0 12px ${STATUS_CONFIG[actionModal.action]?.color}50`,
                }}
              >
                {updateStatusMutation.isPending ? "PROCESANDO..." : "CONFIRMAR"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {auditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 0.8)" }}
          onClick={() => setAuditModal(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 max-h-[80vh] overflow-y-auto"
            style={{
              background: "oklch(0.10 0.005 0)",
              border: "1px solid oklch(0.22 0.01 0)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-5">
              <History size={18} style={{ color: "oklch(0.55 0.22 25)" }} />
              <h3 className="font-display text-lg font-bold tracking-wider text-foreground">
                HISTORIAL DE CAMBIOS
              </h3>
            </div>

            {!auditLog || auditLog.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">Sin historial</p>
            ) : (
              <div className="space-y-3">
                {auditLog.map((log) => {
                  const fromCfg = STATUS_CONFIG[log.previousStatus ?? ""] ?? null;
                  const toCfg = STATUS_CONFIG[log.newStatus] ?? null;
                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-xl"
                      style={{
                        background: "oklch(0.12 0.005 0)",
                        border: "1px solid oklch(0.20 0.01 0)",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {fromCfg && (
                          <span
                            className="text-xs font-display tracking-wider px-2 py-0.5 rounded-full"
                            style={{
                              background: `${fromCfg.color}15`,
                              border: `1px solid ${fromCfg.color}40`,
                              color: fromCfg.color,
                            }}
                          >
                            {fromCfg.label}
                          </span>
                        )}
                        {fromCfg && toCfg && (
                          <span className="text-muted-foreground text-xs">→</span>
                        )}
                        {toCfg && (
                          <span
                            className="text-xs font-display tracking-wider px-2 py-0.5 rounded-full"
                            style={{
                              background: `${toCfg.color}15`,
                              border: `1px solid ${toCfg.color}40`,
                              color: toCfg.color,
                            }}
                          >
                            {toCfg.label}
                          </span>
                        )}
                        <span className="ml-auto text-xs text-muted-foreground font-tech">
                          {new Date(log.changedAt).toLocaleString("es-ES")}
                        </span>
                      </div>
                      {log.note && (
                        <p className="text-xs text-muted-foreground italic">
                          "{log.note}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setAuditModal(null)}
              className="mt-5 w-full py-3 rounded-xl font-display text-xs tracking-widest"
              style={{
                background: "transparent",
                border: "1px solid oklch(0.25 0.01 0)",
                color: "oklch(0.60 0.005 0)",
              }}
            >
              CERRAR
            </button>
          </div>
        </div>
      )}
    </PremiumLayout>
  );
}
