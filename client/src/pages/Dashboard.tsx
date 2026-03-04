import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PremiumLayout from "@/components/PremiumLayout";
import { Trophy, Users, ClipboardList, PlusCircle, ChevronRight, Crown, Swords, Coins, AlertTriangle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Borrador", color: "oklch(0.55 0.18 220)" },
  registration_open: { label: "Inscripciones Abiertas", color: "oklch(0.65 0.18 145)" },
  registration_closed: { label: "Inscripciones Cerradas", color: "oklch(0.55 0.22 25)" },
  in_progress: { label: "En Curso", color: "oklch(0.65 0.18 80)" },
  completed: { label: "Finalizado", color: "var(--text-muted)" },
  cancelled: { label: "Cancelado", color: "oklch(0.40 0.005 0)" },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const isPremium = user?.role === "premium" || user?.role === "admin" || user?.role === "super_admin";

  const { data: myTournaments, isLoading: loadingTournaments } = trpc.tournaments.myTournaments.useQuery(
    undefined,
    { enabled: isPremium }
  );
  const { data: pendingCount } = trpc.registrations.pendingCount.useQuery(
    undefined,
    { enabled: isPremium }
  );
  const { data: myTeams, isLoading: loadingTeams } = trpc.teams.myTeams.useQuery();

  const { data: wallet } = trpc.auth.wallet.useQuery();
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);

  const upgradeMutation = trpc.auth.upgradeToPremiun.useMutation({
    onSuccess: () => {
      toast.success("¡Cuenta actualizada a Premium! Recarga la página para ver los cambios.");
      setShowUpgradeConfirm(false);
      setTimeout(() => window.location.reload(), 1500);
    },
    onError: (err) => {
      toast.error(err.message);
      setShowUpgradeConfirm(false);
    },
  });

  const stats = isPremium
    ? [
        {
          label: "Torneos Creados",
          value: myTournaments?.length ?? 0,
          icon: <Trophy size={22} />,
          color: "oklch(0.55 0.22 25)",
          href: "/dashboard/tournaments",
        },
        {
          label: "Inscripciones Pendientes",
          value: pendingCount ?? 0,
          icon: <ClipboardList size={22} />,
          color: "oklch(0.65 0.18 80)",
          href: "/dashboard/registrations",
          highlight: (pendingCount ?? 0) > 0,
        },
        {
          label: "Mis Equipos",
          value: myTeams?.length ?? 0,
          icon: <Users size={22} />,
          color: "oklch(0.55 0.18 145)",
          href: "/dashboard/teams",
        },
      ]
    : [
        {
          label: "Mis Equipos",
          value: myTeams?.length ?? 0,
          icon: <Users size={22} />,
          color: "oklch(0.55 0.18 145)",
          href: "/dashboard/teams",
        },
      ];

  return (
    <PremiumLayout title="DASHBOARD">
      <div className="space-y-8 pt-6">
        {/* Welcome */}
        <div>
          <h2 className="font-display text-2xl font-bold tracking-wider text-foreground">
            Bienvenido, <span className="neon-text">{user?.name ?? "Jugador"}</span>
          </h2>
          <p className="text-muted-foreground mt-1">
            {isPremium
              ? "Panel de control premium — gestiona tus torneos y equipos"
              : "Panel de control — gestiona tus equipos y participa en torneos"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <div
                className="rounded-xl p-5 cursor-pointer transition-all duration-300 relative overflow-hidden"
                style={{
                  background: "var(--bg-card)",
                  border: stat.highlight
                    ? `1px solid ${stat.color}60`
                    : "1px solid oklch(0.18 0.01 0)",
                  boxShadow: stat.highlight ? `0 0 15px ${stat.color}20` : "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${stat.color}50`;
                  e.currentTarget.style.boxShadow = `0 0 20px ${stat.color}15`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = stat.highlight
                    ? `${stat.color}60`
                    : "oklch(0.18 0.01 0)";
                  e.currentTarget.style.boxShadow = stat.highlight ? `0 0 15px ${stat.color}20` : "none";
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-muted-foreground text-xs font-display tracking-wider mb-2">
                      {stat.label}
                    </p>
                    <p
                      className="font-display text-4xl font-black"
                      style={{ color: stat.color }}
                    >
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: `${stat.color}15`, color: stat.color }}
                  >
                    {stat.icon}
                  </div>
                </div>
                {stat.highlight && (
                  <div
                    className="mt-3 text-xs font-display tracking-wider"
                    style={{ color: stat.color }}
                  >
                    ● Requieren atención
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Premium upgrade prompt */}
        {!isPremium && (
          <div
            className="rounded-xl p-6 relative overflow-hidden"
            style={{
              background: "var(--bg-card)",
              border: "1px solid oklch(0.55 0.22 25 / 0.3)",
              boxShadow: "0 0 30px oklch(0.55 0.22 25 / 0.08)",
            }}
          >
            <div
              className="absolute inset-0 opacity-5"
              style={{
                background:
                  "radial-gradient(ellipse at top right, oklch(0.55 0.22 25) 0%, transparent 60%)",
              }}
            />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className="p-3 rounded-xl"
                  style={{
                    background: "oklch(0.55 0.22 25 / 0.15)",
                    border: "1px solid oklch(0.55 0.22 25 / 0.3)",
                  }}
                >
                  <Crown size={24} style={{ color: "oklch(0.65 0.22 25)" }} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold tracking-wider text-foreground mb-1">
                    ACTUALIZA A PREMIUM
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                    Crea y gestiona tus propios torneos, aprueba equipos y controla cada aspecto del evento.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUpgradeConfirm(true)}
                disabled={upgradeMutation.isPending}
                className="shrink-0 px-6 py-3 rounded-lg font-display text-sm tracking-widest transition-all duration-300 disabled:opacity-50"
                style={{
                  background: "oklch(0.55 0.22 25)",
                  color: "var(--text-primary)",
                  boxShadow: "0 0 15px oklch(0.55 0.22 25 / 0.4)",
                }}
              >
                MEJORAR PLAN — 500 RLC
              </button>
             </div>
          </div>
        )}

        {/* Modal de confirmación de upgrade */}
        {showUpgradeConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div
              className="w-full max-w-md mx-4 rounded-2xl p-6 space-y-5"
              style={{ background: "oklch(0.11 0.005 0)", border: "1px solid oklch(0.55 0.22 25 / 0.40)" }}
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl" style={{ background: "oklch(0.55 0.22 25 / 0.15)", border: "1px solid oklch(0.55 0.22 25 / 0.30)" }}>
                  <Crown size={22} style={{ color: "oklch(0.65 0.22 25)" }} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold tracking-wider text-white">MEJORAR A PREMIUM</h3>
                  <p className="text-zinc-500 text-xs">Confirmación de pago</p>
                </div>
              </div>

              {/* Costo */}
              <div className="rounded-xl p-4 space-y-3" style={{ background: "oklch(0.14 0.005 0)", border: "1px solid oklch(0.20 0.005 0)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-sm">Costo del plan Premium</span>
                  <span className="font-display font-bold text-white flex items-center gap-1.5">
                    <Coins size={15} style={{ color: "oklch(0.75 0.18 80)" }} />
                    500 RLC
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-sm">Tu saldo actual</span>
                  <span className="font-display font-bold flex items-center gap-1.5" style={{ color: (wallet?.balance ?? 0) >= 500 ? "oklch(0.65 0.18 145)" : "oklch(0.60 0.22 25)" }}>
                    <Coins size={15} style={{ color: "oklch(0.75 0.18 80)" }} />
                    {wallet?.balance ?? 0} RLC
                  </span>
                </div>
                <div className="border-t pt-3" style={{ borderColor: "oklch(0.20 0.005 0)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 text-sm">Saldo tras el pago</span>
                    <span className="font-display font-bold text-white">
                      {Math.max(0, (wallet?.balance ?? 0) - 500)} RLC
                    </span>
                  </div>
                </div>
              </div>

              {/* Advertencia si no tiene saldo */}
              {(wallet?.balance ?? 0) < 500 && (
                <div className="flex items-start gap-2.5 rounded-lg p-3" style={{ background: "oklch(0.18 0.08 25 / 0.30)", border: "1px solid oklch(0.45 0.18 25 / 0.40)" }}>
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: "oklch(0.65 0.22 25)" }} />
                  <p className="text-xs" style={{ color: "oklch(0.70 0.18 25)" }}>
                    No tienes suficientes RLC Coins. Necesitas 500 RLC pero tienes {wallet?.balance ?? 0}. Completa misiones o participa en torneos para ganar más RLC.
                  </p>
                </div>
              )}

              {/* Beneficios */}
              <div className="space-y-1.5">
                <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-2">Incluye acceso a:</p>
                {[
                  "Crear y gestionar torneos propios",
                  "Panel de inscripciones y equipos",
                  "Estadísticas avanzadas de torneos",
                  "Badge Premium en tu perfil",
                ].map(b => (
                  <div key={b} className="flex items-center gap-2 text-xs text-zinc-300">
                    <span style={{ color: "oklch(0.65 0.22 25)" }}>✓</span> {b}
                  </div>
                ))}
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowUpgradeConfirm(false)}
                  disabled={upgradeMutation.isPending}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => upgradeMutation.mutate()}
                  disabled={upgradeMutation.isPending || (wallet?.balance ?? 0) < 500}
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                  style={{ background: "oklch(0.55 0.22 25)", color: "white", boxShadow: "0 0 15px oklch(0.55 0.22 25 / 0.35)" }}
                >
                  {upgradeMutation.isPending ? "PROCESANDO..." : "CONFIRMAR — 500 RLC"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick actions */}
        {isPremium && (
          <div>
            <h3 className="font-display text-sm font-bold tracking-wider text-muted-foreground mb-4">
              ACCIONES RÁPIDAS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/dashboard/create-tournament">
                <div
                  className="rounded-xl p-5 cursor-pointer transition-all duration-300 flex items-center gap-4"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid oklch(0.18 0.01 0)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "oklch(0.55 0.22 25 / 0.4)";
                    e.currentTarget.style.boxShadow = "0 0 15px oklch(0.55 0.22 25 / 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "oklch(0.18 0.01 0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      background: "oklch(0.55 0.22 25 / 0.15)",
                      color: "oklch(0.65 0.22 25)",
                    }}
                  >
                    <PlusCircle size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-sm font-bold tracking-wider text-foreground">
                      Crear Torneo
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configura un nuevo torneo
                    </p>
                  </div>
                  <ChevronRight size={16} style={{ color: "oklch(0.40 0.005 0)" }} />
                </div>
              </Link>

              <Link href="/dashboard/registrations">
                <div
                  className="rounded-xl p-5 cursor-pointer transition-all duration-300 flex items-center gap-4"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid oklch(0.18 0.01 0)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "oklch(0.55 0.22 25 / 0.4)";
                    e.currentTarget.style.boxShadow = "0 0 15px oklch(0.55 0.22 25 / 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "oklch(0.18 0.01 0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      background: "oklch(0.65 0.18 80 / 0.15)",
                      color: "oklch(0.65 0.18 80)",
                    }}
                  >
                    <ClipboardList size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-sm font-bold tracking-wider text-foreground">
                      Gestionar Inscripciones
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {pendingCount ? `${pendingCount} pendiente(s)` : "Revisar solicitudes"}
                    </p>
                  </div>
                  <ChevronRight size={16} style={{ color: "oklch(0.40 0.005 0)" }} />
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Recent tournaments */}
        {isPremium && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm font-bold tracking-wider text-muted-foreground">
                MIS TORNEOS RECIENTES
              </h3>
              <Link href="/dashboard/tournaments">
                <button
                  className="text-xs font-display tracking-wider flex items-center gap-1 transition-colors"
                  style={{ color: "oklch(0.55 0.22 25)" }}
                >
                  VER TODOS <ChevronRight size={12} />
                </button>
              </Link>
            </div>

            {loadingTournaments ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl h-16 animate-pulse"
                    style={{ background: "var(--bg-card)" }}
                  />
                ))}
              </div>
            ) : myTournaments && myTournaments.length > 0 ? (
              <div className="space-y-3">
                {myTournaments.slice(0, 3).map((t) => {
                  const statusInfo = STATUS_LABELS[t.status] ?? { label: t.status, color: "var(--text-muted)" };
                  return (
                    <Link key={t.id} href={`/dashboard/tournament/${t.id}`}>
                      <div
                        className="rounded-xl p-4 cursor-pointer transition-all duration-200 flex items-center gap-4"
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
                        <div
                          className="p-2 rounded-lg"
                          style={{
                            background: "oklch(0.55 0.22 25 / 0.1)",
                            color: "oklch(0.55 0.22 25)",
                          }}
                        >
                          <Swords size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-sm font-bold tracking-wide text-foreground truncate">
                            {t.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{t.game}</p>
                        </div>
                        <span
                          className="text-xs font-display tracking-wider px-2 py-1 rounded-full shrink-0"
                          style={{
                            background: `${statusInfo.color}20`,
                            border: `1px solid ${statusInfo.color}40`,
                            color: statusInfo.color,
                          }}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div
                className="rounded-xl p-8 text-center"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid oklch(0.18 0.01 0)",
                }}
              >
                <Trophy size={32} className="mx-auto mb-3" style={{ color: "oklch(0.25 0.01 0)" }} />
                <p className="text-muted-foreground text-sm font-display tracking-wider">
                  No has creado torneos aún
                </p>
                <Link href="/dashboard/create-tournament">
                  <button
                    className="mt-4 px-5 py-2 rounded-lg font-display text-xs tracking-widest transition-all duration-200"
                    style={{
                      background: "oklch(0.55 0.22 25 / 0.15)",
                      border: "1px solid oklch(0.55 0.22 25 / 0.3)",
                      color: "oklch(0.65 0.22 25)",
                    }}
                  >
                    CREAR PRIMER TORNEO
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </PremiumLayout>
  );
}
