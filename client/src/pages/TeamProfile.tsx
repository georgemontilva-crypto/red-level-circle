import { UserAvatar } from "@/components/UserAvatar";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Link, useParams } from "wouter";
import RosterCard from "@/components/RosterCard";
import {
  ChevronLeft, Shield, Trophy, Swords, Star, Users,
  ExternalLink, Twitter, MessageSquare, Tv2,
  CheckCircle, Crown, TrendingUp, Target, Calendar,
  Globe, Award, Hash, Flame, Zap, Medal, Lock,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

// Todos los colores de acento son rojo RLC — la identidad del sitio siempre prevalece
const RLC_RED = { from: "#0d0d0d", to: "#1a0505", glow: "rgba(220,38,38,0.25)", accent: "#dc2626", mid: "#2a0a0a" };
function getGameColor(_slug?: string | null) { return RLC_RED; }

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  captain:    { label: "Capitán",  color: "#fbbf24" },
  player:     { label: "Jugador",  color: "var(--text-secondary)" },
  substitute: { label: "Suplente", color: "#6366f1" },
  coach:      { label: "Entrenador",    color: "#22c55e" },
};

const TOURNAMENT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  completed:         { label: "Finalizado",    color: "var(--text-secondary)", bg: "rgba(161,161,170,0.08)" },
  in_progress:       { label: "En curso",      color: "#facc15", bg: "rgba(250,204,21,0.08)"  },
  registration_open: { label: "Inscripciones", color: "#60a5fa", bg: "rgba(96,165,250,0.08)"  },
  cancelled:         { label: "Cancelado",     color: "#6b7280", bg: "rgba(107,114,128,0.08)" },
};

function StatCard({ icon, value, label, accent }: { icon: React.ReactNode; value: string | number; label: string; accent: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-4 rounded-2xl text-center"
      style={{ background: "#16191f", border: "1px solid #22262e" }}>
      <div style={{ color: accent }}>{icon}</div>
      <span className="text-2xl font-black font-mono" style={{ color: accent }}>{value}</span>
      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}

function WinRateBar({ wins, losses, accent }: { wins: number; losses: number; accent: string }) {
  const total = wins + losses;
  const rate = total > 0 ? Math.round((wins / total) * 100) : null;
  const color = rate === null ? "#52525b" : rate >= 60 ? "#4ade80" : rate >= 40 ? "#facc15" : "#f87171";
  return (
    <div className="flex flex-col gap-1.5 p-4 rounded-2xl"
      style={{ background: "#16191f", border: "1px solid #22262e" }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Tasa de Victoria</span>
        <span className="text-lg font-black font-mono" style={{ color }}>{rate !== null ? `${rate}%` : "—"}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-hover)" }}>
        {rate !== null && (
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${rate}%`, background: color }} />
        )}
      </div>
      <div className="flex justify-between text-xs font-mono mt-0.5">
        <span style={{ color: "#4ade80" }}>{wins}V</span>
        <span style={{ color: "#f87171" }}>{losses}D</span>
      </div>
    </div>
  );
}

// ─── Performance Chart ───────────────────────────────────────────────────────
function PerformanceChart({ history, accent }: { history: any[]; accent: string }) {
  const chartData = useMemo(() => {
    const byMonth: Record<string, { month: string; victorias: number; derrotas: number }> = {};
    for (const reg of history) {
      const date = reg.tournamentStartDate ? new Date(reg.tournamentStartDate) : new Date(reg.registeredAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
      if (!byMonth[key]) byMonth[key] = { month: label, victorias: 0, derrotas: 0 };
      byMonth[key].victorias += reg.wins ?? 0;
      byMonth[key].derrotas += reg.losses ?? 0;
    }
    return Object.values(byMonth).slice(-8);
  }, [history]);

  if (chartData.length === 0) return null;

  return (
    <div className="rounded-2xl p-5 mb-6" style={{ background: "var(--bg-main)", border: "1px solid oklch(0.16 0.01 0)" }}>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={16} style={{ color: accent }} />
        <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">Rendimiento Mensual</h3>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.16 0.01 0)" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "var(--bg-main)", border: "1px solid #27272a", borderRadius: "8px", fontFamily: "monospace", fontSize: "12px" }}
            labelStyle={{ color: "var(--text-secondary)" }}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar dataKey="victorias" name="Victorias" fill="#4ade80" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="derrotas" name="Derrotas" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Achievements Panel ───────────────────────────────────────────────────────
type AchievementDef = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  rarity: "common" | "rare" | "epic" | "legendary";
  check: (wins: number, titles: number, tournaments: number) => boolean;
};

const RARITY_COLORS = {
  common:    { bg: "rgba(161,161,170,0.08)", border: "rgba(161,161,170,0.2)", text: "var(--text-secondary)", label: "Común" },
  rare:      { bg: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.25)",  text: "#60a5fa", label: "Raro" },
  epic:      { bg: "rgba(168,85,247,0.08)",  border: "rgba(168,85,247,0.25)",  text: "#a855f7", label: "Épico" },
  legendary: { bg: "rgba(250,204,21,0.08)",  border: "rgba(250,204,21,0.25)",  text: "#fbbf24", label: "Legendario" },
  mythic:    { bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.35)",   text: "#f87171", label: "Mítico" },
};

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: "first_tournament", title: "Primer Torneo", description: "Participó en su primer torneo", icon: <Swords size={18} />, rarity: "common", check: (_, __, t) => t >= 1 },
  { id: "first_win", title: "Primera Victoria", description: "Ganó su primera partida en torneo", icon: <Star size={18} />, rarity: "common", check: (w) => w >= 1 },
  { id: "five_wins", title: "Cinco Victorias", description: "Acumuló 5 victorias en torneos", icon: <Zap size={18} />, rarity: "rare", check: (w) => w >= 5 },
  { id: "ten_wins", title: "Diez Victorias", description: "Acumuló 10 victorias en torneos", icon: <Flame size={18} />, rarity: "rare", check: (w) => w >= 10 },
  { id: "first_title", title: "Primer Título", description: "Ganó su primer torneo", icon: <Trophy size={18} />, rarity: "epic", check: (_, t) => t >= 1 },
  { id: "three_titles", title: "Triple Campeón", description: "Ganó 3 torneos", icon: <Crown size={18} />, rarity: "epic", check: (_, t) => t >= 3 },
  { id: "five_titles", title: "Dinastía", description: "Ganó 5 torneos", icon: <Medal size={18} />, rarity: "legendary", check: (_, t) => t >= 5 },
  { id: "veteran", title: "Veterano", description: "Participó en 10 o más torneos", icon: <Shield size={18} />, rarity: "epic", check: (_, __, t) => t >= 10 },
];

function AchievementsPanel({ achievements, tournamentHistory, wins, accent }: {
  achievements: any[];
  tournamentHistory: any[];
  wins: number;
  accent: string;
}) {
  const totalTournaments = tournamentHistory.length;
  const totalTitles = tournamentHistory.filter((r: any) => r.isWinner).length;
  const totalWins = wins;

  const unlockedAutoIds = useMemo(() =>
    new Set(ACHIEVEMENT_DEFS.filter(def => def.check(totalWins, totalTitles, totalTournaments)).map(d => d.id)),
    [totalWins, totalTitles, totalTournaments]
  );

  const manualAchievements = achievements.filter((a: any) => !ACHIEVEMENT_DEFS.find(d => d.id === a.title));

  return (
    <div>
      {/* Auto-unlockable achievements */}
      <div className="mb-6">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Logros del Sistema</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACHIEVEMENT_DEFS.map((def) => {
            const unlocked = unlockedAutoIds.has(def.id);
            const r = RARITY_COLORS[def.rarity];
            return (
              <div key={def.id}
                className="flex items-start gap-3 p-4 rounded-2xl transition-all duration-200"
                style={{
                  background: unlocked ? r.bg : "oklch(0.07 0.003 0)",
                  border: `1px solid ${unlocked ? r.border : "oklch(0.12 0.005 0)"}`,
                  opacity: unlocked ? 1 : 0.5,
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: unlocked ? r.bg : "oklch(0.10 0.005 0)", color: unlocked ? r.text : "#52525b" }}>
                  {unlocked ? def.icon : <Lock size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-sm" style={{ color: unlocked ? "white" : "#52525b" }}>{def.title}</p>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: unlocked ? r.bg : "transparent", color: unlocked ? r.text : "#3f3f46", border: `1px solid ${unlocked ? r.border : "#27272a"}` }}>{r.label}</span>
                  </div>
                  <p className="text-xs font-mono mt-0.5" style={{ color: unlocked ? "var(--text-secondary)" : "#3f3f46" }}>{def.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual achievements from tournaments */}
      {manualAchievements.length > 0 && (
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Logros de Torneos</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {manualAchievements.map((ach: any) => (
              <div key={ach.id} className="flex items-start gap-3 p-4 rounded-2xl"
                style={{ background: "rgba(250,204,21,0.05)", border: "1px solid rgba(250,204,21,0.2)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(250,204,21,0.1)" }}>
                  <Trophy size={18} className="text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono font-bold text-white text-sm">{ach.title}</p>
                  {ach.description && <p className="text-xs text-muted-foreground mt-0.5">{ach.description}</p>}
                  <p className="text-xs font-mono text-zinc-700 mt-1">
                    {new Date(ach.awardedAt).toLocaleDateString("es-ES", { year: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {manualAchievements.length === 0 && unlockedAutoIds.size === 0 && (
        <div className="flex flex-col items-center justify-center py-12 rounded-2xl"
          style={{ background: "var(--bg-main)", border: "1px solid oklch(0.16 0.01 0)" }}>
          <Award size={36} className="text-zinc-700 mb-3" />
          <p className="font-mono text-muted-foreground">Aún no hay logros desbloqueados</p>
          <p className="font-mono text-zinc-700 text-xs mt-1">Participa en torneos para desbloquear logros</p>
        </div>
      )}
    </div>
  );
}

function TournamentRow({ reg, accent, teamId }: { reg: any; accent: string; teamId: number }) {
  const isWinner = reg.tournamentWinnerId === teamId && reg.tournamentStatus === "completed";
  const isActive = reg.tournamentStatus === "in_progress";
  const statusInfo = TOURNAMENT_STATUS[reg.tournamentStatus ?? ""] ?? { label: reg.tournamentStatus, color: "var(--text-secondary)", bg: "rgba(161,161,170,0.08)" };
  return (
    <Link href={`/tournaments/${reg.tournamentId}`}>
      <div
        className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all duration-200 group mb-2"
        style={{
          background: isWinner ? "rgba(250,204,21,0.05)" : isActive ? "rgba(250,204,21,0.04)" : "oklch(0.09 0.005 0)",
          border: `1px solid ${isWinner ? "rgba(250,204,21,0.2)" : isActive ? "rgba(250,204,21,0.15)" : "oklch(0.16 0.01 0)"}`,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = isWinner ? "rgba(250,204,21,0.4)" : "oklch(0.25 0.01 0)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = isWinner ? "rgba(250,204,21,0.2)" : isActive ? "rgba(250,204,21,0.15)" : "oklch(0.16 0.01 0)"; }}
      >
        <div className="shrink-0">
          {isWinner ? (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(250,204,21,0.15)" }}>
              <Trophy size={16} className="text-yellow-400" />
            </div>
          ) : isActive ? (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(250,204,21,0.1)" }}>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--bg-card)" }}>
              <Swords size={14} className="text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono font-semibold text-white truncate group-hover:text-secondary-foreground transition-colors">
            {reg.tournamentName}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {reg.tournamentGame && <span className="text-xs font-mono text-muted-foreground">{reg.tournamentGame}</span>}
            {reg.tournamentStartDate && (
              <span className="text-xs font-mono text-zinc-700">· {new Date(reg.tournamentStartDate).getFullYear()}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isWinner ? (
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg"
              style={{ background: "rgba(250,204,21,0.15)", border: "1px solid rgba(250,204,21,0.3)", color: "#fbbf24" }}>
              CAMPEÓN
            </span>
          ) : (
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg"
              style={{ background: statusInfo.bg, color: statusInfo.color }}>
              {statusInfo.label}
            </span>
          )}
          <ExternalLink size={12} className="text-zinc-700 group-hover:text-muted-foreground transition-colors" />
        </div>
      </div>
    </Link>
  );
}

export default function TeamProfile() {
  const { id } = useParams<{ id: string }>();
  const teamId = parseInt(id ?? "0");
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState<"roster" | "history" | "achievements">("roster");

  const { data: team, isLoading, refetch } = trpc.teams.publicProfile.useQuery(
    { id: teamId },
    { enabled: !!teamId }
  );
  const { data: rankPos } = trpc.teams.rankPosition.useQuery(
    { id: teamId },
    { enabled: !!teamId }
  );
  const { data: tournamentHistory } = trpc.ranking.teamHistory.useQuery(
    { teamId },
    { enabled: !!teamId }
  );

  const joinTeam = trpc.teams.addMember.useMutation({
    onSuccess: () => { toast.success("¡Solicitud enviada!"); refetch(); },
    onError: (err: { message: string }) => toast.error("Error", { description: err.message }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
          <p className="font-mono text-muted-foreground text-sm">Cargando perfil del equipo...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500/30 mx-auto mb-4" />
          <p className="font-mono text-xl mb-2 text-white">Equipo no encontrado</p>
          <Link href="/ranking">
            <button className="mt-4 px-6 py-2 rounded-lg font-mono text-sm transition-colors" style={{ background: "#dc2626" }}>
              ← Ver Ranking
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const c = getGameColor(team.gameSlug);
  const isCaptain = user?.id === team.captainId;
  const isMember = team.members?.some((m: any) => m.userId === user?.id);
  const wonTournaments = (tournamentHistory ?? []).filter((r: any) => r.isWinner);
  const activeTournaments = (tournamentHistory ?? []).filter((r: any) => r.tournamentStatus === "in_progress" || r.tournamentStatus === "registration_open");
  return (
    <div className="min-h-screen text-white" style={{ background: "var(--bg-background)" }}>
      {/* ── Banner + header (mismo estilo que UserProfile) ── */}
      <div
        className="w-full"
        style={{ paddingLeft: 'clamp(16px, 2.5vw, 40px)', paddingRight: 'clamp(16px, 2.5vw, 40px)', background: 'var(--bg-main)' }}
      >
        <div className="relative w-full rounded-xl overflow-visible" style={{ background: "#16191f" }}>

          {/* Banner */}
          <div className="w-full h-40 sm:h-56 relative rounded-xl overflow-hidden">
            {/* Default background */}
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${c.from} 0%, ${c.mid} 50%, ${c.to} 100%)` }} />
            <div className="absolute inset-0 opacity-5"
              style={{ backgroundImage: `repeating-linear-gradient(0deg, ${c.accent} 0px, ${c.accent} 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, ${c.accent} 0px, ${c.accent} 1px, transparent 1px, transparent 40px)` }} />
            {team.banner && (
              <img src={team.banner} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
            )}
            {/* Acciones en el banner */}
            <div className="absolute top-3 left-3 z-20">
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs transition-colors"
                style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "white"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
              >
                <ChevronLeft size={14} /> Volver
              </button>
            </div>
            {isCaptain && (
              <div className="absolute top-3 right-3 z-20">
                <Link href="/dashboard/teams">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs transition-colors"
                    style={{ background: "rgba(0,0,0,0.6)", border: `1px solid ${c.accent}40`, color: c.accent }}>
                    <Shield size={14} /> Gestionar
                  </button>
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Contenido principal ── */}
      <div className="pb-16 max-w-7xl mx-auto" style={{ paddingLeft: 'clamp(16px, 2.5vw, 40px)', paddingRight: 'clamp(16px, 2.5vw, 40px)' }}>
        <div className="relative z-10" style={{ paddingTop: "16px" }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 mb-8">
            {/* Logo superpuesto al banner */}
            <div
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden shrink-0"
              style={{
                border: "3px solid #dc2626",
                background: "var(--bg-card)",
                marginTop: "-52px",
                position: "relative",
                zIndex: 10,
              }}
            >
              {team.logo ? (
                <img src={team.logo || undefined} alt={team.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Shield size={40} style={{ color: c.accent, opacity: 0.5 }} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="font-mono font-black text-3xl sm:text-4xl text-white tracking-tight">{team.name}</h1>
                {team.tag && (
                  <span className="text-sm font-mono font-bold px-2 py-0.5 rounded-lg"
                    style={{ background: `${c.accent}18`, border: `1px solid ${c.accent}33`, color: c.accent }}>
                    [{team.tag}]
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {team.isVerified && (
                  <span className="flex items-center gap-1 text-xs font-mono font-semibold px-2.5 py-1 rounded-lg"
                    style={{ background: "rgba(250,204,21,0.1)", border: "1px solid rgba(250,204,21,0.3)", color: "#fbbf24" }}>
                    <CheckCircle size={11} /> EQUIPO OFICIAL
                  </span>
                )}
                {wonTournaments.length > 0 && (
                  <span className="flex items-center gap-1 text-xs font-mono font-semibold px-2.5 py-1 rounded-lg"
                    style={{ background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.2)", color: "#fbbf24" }}>
                    <Crown size={11} /> {wonTournaments.length}x CAMPEÓN
                  </span>
                )}
                {activeTournaments.length > 0 && (
                  <span className="flex items-center gap-1 text-xs font-mono font-semibold px-2.5 py-1 rounded-lg"
                    style={{ background: "rgba(250,204,21,0.06)", border: "1px solid rgba(250,204,21,0.15)", color: "#facc15" }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" /> EN COMPETICIÓN
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-muted-foreground">
                {(team.game || team.gameSlug) && (
                  <span className="flex items-center gap-1.5" style={{ color: c.accent }}>
                    <Target size={13} /> {team.game ?? team.gameSlug}
                  </span>
                )}
                {team.country && (
                  <span className="flex items-center gap-1.5">
                    <Globe size={13} /> {team.country}
                  </span>
                )}
                {rankPos && (
                  <span className="flex items-center gap-1.5">
                    <Hash size={13} /> #{rankPos.globalPosition} Global
                  </span>
                )}
                {team.createdAt && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} /> Desde {new Date(team.createdAt).getFullYear()}
                  </span>
                )}
              </div>
              {(team.socialDiscord || team.socialTwitch || team.socialTwitter) && (
                <div className="flex items-center gap-3 mt-3">
                  {team.socialDiscord && (
                    <a href={team.socialDiscord} target="_blank" rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-indigo-400 transition-colors">
                      <MessageSquare size={16} />
                    </a>
                  )}
                  {team.socialTwitch && (
                    <a href={team.socialTwitch} target="_blank" rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-purple-400 transition-colors">
                      <Tv2 size={16} />
                    </a>
                  )}
                  {team.socialTwitter && (
                    <a href={team.socialTwitter} target="_blank" rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-sky-400 transition-colors">
                      <Twitter size={16} />
                    </a>
                  )}
                </div>
              )}
            </div>
            {isAuthenticated && !isMember && !isCaptain && (
              <button
                onClick={() => joinTeam.mutate({ teamId, userId: user!.id, role: "player" })}
                disabled={joinTeam.isPending}
                className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-sm font-semibold transition-all duration-200"
                style={{ background: `linear-gradient(135deg, ${c.from} 0%, ${c.mid} 100%)`, border: `1px solid ${c.accent}55`, color: c.accent }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 20px ${c.glow}`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
              >
                <Users size={15} /> {joinTeam.isPending ? "Enviando..." : "Unirse al equipo"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <StatCard icon={<TrendingUp size={20} />} value={rankPos ? `#${rankPos.globalPosition}` : "—"} label="Ranking Global" accent="#dc2626" />
            <StatCard icon={<Trophy size={20} />} value={team.stats?.tournamentsPlayed ?? 0} label="Torneos" accent="#dc2626" />
            <StatCard icon={<Crown size={20} />} value={wonTournaments.length} label="Títulos" accent="#dc2626" />
            <StatCard icon={<Star size={20} />} value={team.points ?? 0} label="Puntos RLC" accent="#dc2626" />
          </div>
          <div className="mb-8">
            <WinRateBar wins={team.wins ?? 0} losses={team.losses ?? 0} accent={c.accent} />
          </div>

          <div className="flex gap-1 mb-6 p-1 rounded-xl"
            style={{ background: "var(--bg-main)", border: "1px solid oklch(0.16 0.01 0)", width: "fit-content" }}>
            {([
              { key: "roster",       label: "Alineación",  icon: <Users size={14} />,  count: team.members?.length },
              { key: "history",      label: "Torneos", icon: <Trophy size={14} />, count: tournamentHistory?.length },
              { key: "achievements", label: "Logros",  icon: <Award size={14} />,  count: team.achievements?.length },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-semibold transition-all duration-200"
                style={{
                  background: activeTab === tab.key ? c.accent + "18" : "transparent",
                  color: activeTab === tab.key ? c.accent : "var(--text-muted)",
                  border: activeTab === tab.key ? `1px solid ${c.accent}33` : "1px solid transparent",
                }}
              >
                {tab.icon}
                {tab.label}
                {(tab.count ?? 0) > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeTab === "roster" && (
            <section className="mb-12">
              {!team.members || team.members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Users size={32} className="text-zinc-700 mb-3" />
                  <p className="text-sm text-muted-foreground">Sin roster registrado aún</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
                  {team.members.map((m: any) => (
                    <RosterCard
                      key={m.id}
                      playerName={m.nickname ?? m.userName ?? m.username ?? m.name ?? "Jugador"}
                      realName={m.nickname ? (m.userName ?? undefined) : undefined}
                      role={m.gameRole ?? m.role ?? undefined}
                      region={m.competitiveRegion ?? m.country ?? undefined}
                      game={m.mainGame ?? undefined}
                      elo={m.elo ?? null}
                      photoUrl={m.rosterImageUrl ?? m.rosterPhoto ?? m.avatar ?? m.photoUrl ?? null}
                      team={team.name ?? undefined}
                      isCaptain={m.userId === team.captainId}
                      userId={m.userId}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === "history" && (
            <section className="mb-12">
              <PerformanceChart history={tournamentHistory ?? []} accent={c.accent} />
              {(!tournamentHistory || tournamentHistory.length === 0) ? (
                <div>
                  <div className="mb-4">
                    <div className="flex flex-col items-center justify-center py-12 rounded-2xl"
                      style={{ background: "var(--bg-main)", border: "1px solid oklch(0.16 0.01 0)" }}>
                      <Trophy size={32} className="text-zinc-700 mb-3" />
                      <p className="font-mono text-muted-foreground">Sin historial de torneos</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Historial de Torneos</p>
                  </div>
                  <div className="mb-4">
                    {tournamentHistory.map((reg: any) => (
                      <TournamentRow key={reg.id} reg={reg} accent={c.accent} teamId={teamId} />
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-mono text-zinc-700 mt-4">
                      {tournamentHistory.length} torneo{tournamentHistory.length !== 1 ? "s" : ""} en total
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === "achievements" && (
            <section className="mb-12">
              <AchievementsPanel
                achievements={team.achievements ?? []}
                tournamentHistory={tournamentHistory ?? []}
                wins={team.wins ?? 0}
                accent={c.accent}
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
