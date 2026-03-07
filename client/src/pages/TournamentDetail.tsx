import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import BracketView from "@/components/BracketView";
import {
  Trophy,
  Calendar,
  Users,
  Shield,
  ChevronLeft,
  Swords,
  Clock,
  AlertCircle,
  CheckCircle,
  Star,
  Zap,
  Crown,
  LayoutList,
  History,
  ListOrdered,
  Megaphone,
  Bot,
  MapPin,
  Globe,
  MessageSquare,
  UserPlus,
  BarChart2,
  ChevronRight,
  Info,
} from "lucide-react";
import { useState, useRef } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Constants ────────────────────────────────────────────────────────────────
const BRACKET_LABELS: Record<string, string> = {
  single_elimination: "Eliminación Simple",
  double_elimination: "Doble Eliminación",
  groups: "Fase de Grupos",
};
const STATUS_COLORS: Record<string, string> = {
  registration_open: "oklch(0.65 0.18 145)",
  in_progress: "oklch(0.65 0.18 80)",
  completed: "oklch(0.50 0.005 0)",
  draft: "oklch(0.55 0.18 220)",
  registration_closed: "oklch(0.55 0.22 25)",
  cancelled: "oklch(0.40 0.005 0)",
};
const STATUS_LABELS: Record<string, string> = {
  registration_open: "INSCRIPCIONES ABIERTAS",
  in_progress: "EN CURSO",
  completed: "FINALIZADO",
  draft: "PRÓXIMAMENTE",
  registration_closed: "INSCRIPCIONES CERRADAS",
  cancelled: "CANCELADO",
};
const DRAFT_LABELS: Record<string, string> = {
  tournament_draft: "Tournament Draft",
  blind_pick: "Blind Pick",
  all_random: "All Random",
  captains_draft: "Captain's Draft",
};

function getRoundLabel(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semifinal";
  if (fromEnd === 2) return "Cuartos de Final";
  return `Ronda ${round}`;
}

// ─── Info Card (Battlefy-style) ───────────────────────────────────────────────
function InfoCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "var(--bg-card)",
        border: "1px solid oklch(0.18 0.01 0)",
      }}
    >
      <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-1">{label}</div>
      <div className="font-display text-base font-bold text-foreground tracking-wide leading-tight">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Team Card for Participants ───────────────────────────────────────────────
function ParticipantCard({
  team,
  checkedIn,
}: {
  team: {
    teamId: number;
    teamName: string;
    teamLogo: string | null;
    teamTag: string | null;
    teamPoints: number;
    teamIsVerified: boolean;
    captainName: string | null;
    rankPosition: number;
    tournamentWins: number;
    tournamentLosses: number;
  };
  checkedIn?: boolean;
}) {
  return (
    <Link href={`/teams/${team.teamId}`}>
      <div
        className="rounded-xl p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] relative overflow-hidden"
        style={{
          background: "var(--bg-card)",
          border: `1px solid ${checkedIn ? "oklch(0.65 0.18 145 / 0.4)" : "oklch(0.18 0.01 0)"}`,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "oklch(0.55 0.22 25 / 0.5)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 20px oklch(0.55 0.22 25 / 0.1)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = checkedIn
            ? "oklch(0.65 0.18 145 / 0.4)"
            : "oklch(0.18 0.01 0)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        }}
      >
        {checkedIn && (
          <div
            className="absolute top-2 right-2 text-xs font-mono px-1.5 py-0.5 rounded"
            style={{
              background: "oklch(0.65 0.18 145 / 0.15)",
              color: "oklch(0.65 0.18 145)",
              border: "1px solid oklch(0.65 0.18 145 / 0.3)",
            }}
          >
            ✓ CHECK-IN
          </div>
        )}
        {/* Logo */}
        <div className="flex justify-center mb-3">
          {team.teamLogo ? (
            <img
              src={team.teamLogo}
              alt={team.teamName}
              className="w-14 h-14 rounded-full object-cover"
              style={{ border: "2px solid oklch(0.55 0.22 25 / 0.4)" }}
            />
          ) : (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black"
              style={{
                background: "oklch(0.55 0.22 25 / 0.15)",
                border: "2px solid oklch(0.55 0.22 25 / 0.4)",
                color: "oklch(0.70 0.28 25)",
              }}
            >
              {team.teamName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {/* Name + tag */}
        <div className="text-center mb-1">
          <div className="flex items-center justify-center gap-1">
            <span className="font-display text-sm font-bold tracking-wide text-foreground truncate max-w-[120px]">
              {team.teamName}
            </span>
            {team.teamIsVerified && (
              <CheckCircle size={12} style={{ color: "oklch(0.65 0.18 145)", flexShrink: 0 }} />
            )}
          </div>
          {team.teamTag && (
            <span className="text-xs font-mono text-muted-foreground">[{team.teamTag}]</span>
          )}
        </div>
        {/* Captain */}
        {team.captainName && (
          <div className="text-center">
            <span
              className="text-xs font-mono px-2 py-0.5 rounded"
              style={{
                background: "oklch(0.55 0.22 25 / 0.1)",
                color: "oklch(0.65 0.22 25)",
              }}
            >
              CAPITÁN
            </span>
            <span className="text-xs text-muted-foreground ml-1">{team.captainName}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── Result Row ───────────────────────────────────────────────────────────────
function ResultRow({
  match,
  totalRounds,
}: {
  match: {
    id: number;
    round: number | null;
    matchNumber: number | null;
    team1Id: number | null;
    team2Id: number | null;
    team1Name: string | null;
    team2Name: string | null;
    team1Logo: string | null;
    team2Logo: string | null;
    team1Score: number | null;
    team2Score: number | null;
    winnerId: number | null;
    notes: string | null;
    completedAt: Date | null;
  };
  totalRounds: number;
}) {
  if (match.notes === "BYE") return null;
  const team1Won = match.winnerId === match.team1Id;
  const team2Won = match.winnerId === match.team2Id;
  const roundLabel = getRoundLabel(match.round ?? 1, totalRounds);

  return (
    <div
      className="rounded-xl p-4 transition-all duration-200"
      style={{
        background: "var(--bg-card)",
        border: "1px solid oklch(0.18 0.01 0)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-mono px-2 py-0.5 rounded"
          style={{
            background: "oklch(0.55 0.22 25 / 0.1)",
            color: "oklch(0.65 0.22 25)",
            border: "1px solid oklch(0.55 0.22 25 / 0.2)",
          }}
        >
          {roundLabel}
        </span>
        {match.completedAt && (
          <span className="text-xs text-muted-foreground font-mono">
            {new Date(match.completedAt).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
            })}
          </span>
        )}
      </div>
      <div className="space-y-2">
        {[
          { name: match.team1Name, logo: match.team1Logo, won: team1Won, lost: team2Won, score: match.team1Score },
          { name: match.team2Name, logo: match.team2Logo, won: team2Won, lost: team1Won, score: match.team2Score },
        ].map((t, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {t.logo ? (
                <img src={t.logo} alt={t.name ?? ""} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "oklch(0.55 0.22 25 / 0.15)", color: "oklch(0.70 0.28 25)" }}
                >
                  {(t.name ?? "?").charAt(0).toUpperCase()}
                </div>
              )}
              <span
                className="font-display text-sm tracking-wide truncate"
                style={{
                  color: t.won ? "oklch(0.75 0.18 145)" : t.lost ? "oklch(0.45 0.005 0)" : "oklch(0.70 0.005 0)",
                  textDecoration: t.lost ? "line-through" : "none",
                }}
              >
                {t.name ?? "TBD"}
              </span>
            </div>
            <span
              className="font-orbitron text-lg font-bold ml-3"
              style={{ color: t.won ? "oklch(0.75 0.18 145)" : "oklch(0.50 0.005 0)" }}
            >
              {t.score ?? "-"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Announcement Row ─────────────────────────────────────────────────────────
function AnnouncementRow({
  announcement,
}: {
  announcement: {
    id: number;
    authorName: string | null;
    message: string;
    isSystem: boolean;
    createdAt: Date | string;
  };
}) {
  const timeAgo = (date: Date | string) => {
    const d = new Date(date);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `hace ${days} día${days > 1 ? "s" : ""}`;
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? "s" : ""}`;
    if (mins > 0) return `hace ${mins} minuto${mins > 1 ? "s" : ""}`;
    return "ahora mismo";
  };

  return (
    <div
      className="flex gap-4 p-4 rounded-xl transition-all"
      style={{
        background: "var(--bg-card)",
        border: "1px solid oklch(0.18 0.01 0)",
      }}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {announcement.isSystem ? (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.55 0.18 220 / 0.2)", border: "1px solid oklch(0.55 0.18 220 / 0.4)" }}
          >
            <Bot size={18} style={{ color: "oklch(0.65 0.18 220)" }} />
          </div>
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: "oklch(0.55 0.22 25 / 0.2)", border: "1px solid oklch(0.55 0.22 25 / 0.4)", color: "oklch(0.70 0.28 25)" }}
          >
            {(announcement.authorName ?? "O").charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-display text-sm font-bold text-foreground">
            {announcement.authorName ?? "Sistema"}
          </span>
          {announcement.isSystem && (
            <span
              className="text-xs font-mono px-1.5 py-0.5 rounded"
              style={{
                background: "oklch(0.55 0.18 220 / 0.15)",
                color: "oklch(0.65 0.18 220)",
                border: "1px solid oklch(0.55 0.18 220 / 0.3)",
              }}
            >
              [Sistema]
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">{timeAgo(announcement.createdAt)}</span>
        </div>
        <p className="text-sm text-secondary-foreground leading-relaxed">{announcement.message}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TournamentDetail() {
  const { id: idStr } = useParams<{ id: string }>();
  const id = parseInt(idStr ?? "0");
  const { user, isAuthenticated } = useAuth();

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [teamMessage, setTeamMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "participants" | "brackets" | "stats" | "announcements" | "freeagents">("overview");
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInTeamId, setCheckInTeamId] = useState<number | null>(null);

  const { data: tournament, isLoading } = trpc.tournaments.byId.useQuery({ id });
  const { data: myTeams } = trpc.teams.myTeams.useQuery(undefined, { enabled: !!isAuthenticated });
  const { data: matches, refetch: refetchMatches } = trpc.matches.byTournament.useQuery({ tournamentId: id });
  const { data: registeredTeams, refetch: refetchTeams } = trpc.tournaments.registeredTeams.useQuery({ tournamentId: id });
  const { data: results, refetch: refetchResults } = trpc.ranking.getResults.useQuery({ tournamentId: id });
  const { data: upcomingMatches } = trpc.ranking.upcomingMatches.useQuery({ tournamentId: id, limit: 6 });
  const { data: announcements, refetch: refetchAnnouncements } = trpc.tournaments.announcements.useQuery({ tournamentId: id });
  const { data: checkins, refetch: refetchCheckins } = trpc.tournaments.getCheckins.useQuery({ tournamentId: id });
  const { data: freeAgents, refetch: refetchFreeAgents } = trpc.tournaments.getFreeAgents.useQuery({ tournamentId: id });
  const [showFreeAgentModal, setShowFreeAgentModal] = useState(false);
  const [freeAgentRole, setFreeAgentRole] = useState("");
  const [freeAgentMessage, setFreeAgentMessage] = useState("");

  const registerFreeAgentMutation = trpc.tournaments.registerFreeAgent.useMutation({
    onSuccess: () => {
      toast.success("¡Te registraste como agente libre! Los capitanes de equipo podrán contactarte.");
      setShowFreeAgentModal(false);
      setFreeAgentRole("");
      setFreeAgentMessage("");
      refetchFreeAgents();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateResultMutation = trpc.matches.updateResult.useMutation({
    onSuccess: () => {
      toast.success("Resultado registrado");
      refetchMatches();
      refetchTeams();
      refetchResults();
    },
    onError: (err) => toast.error(err.message),
  });

  const generateBracketMutation = trpc.matches.generateBracketManual.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Bracket generado con ${data.matchCount} partidos`);
      refetchMatches();
      // Auto-announcement
      createAnnouncementMutation.mutate({
        tournamentId: id,
        message: "🎮 ¡El bracket ha comenzado! Encuentra tu primer partido en la sección BRACKETS y haz clic para ver a tu oponente.",
      });
    },
    onError: (err) => toast.error(err.message),
  });

  const registerMutation = trpc.registrations.register.useMutation({
    onSuccess: () => {
      toast.success("¡Solicitud de inscripción enviada! El organizador revisará tu solicitud.");
      setShowRegisterModal(false);
      setSelectedTeamId(null);
      setTeamMessage("");
      refetchTeams();
    },
    onError: (err) => toast.error(err.message),
  });

  const createAnnouncementMutation = trpc.tournaments.createAnnouncement.useMutation({
    onSuccess: () => {
      setNewAnnouncement("");
      refetchAnnouncements();
    },
    onError: (err) => toast.error(err.message),
  });

  const checkInMutation = trpc.tournaments.checkIn.useMutation({
    onSuccess: () => {
      toast.success("✅ Check-in realizado correctamente");
      setShowCheckInModal(false);
      setCheckInTeamId(null);
      refetchCheckins();
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div
          className="w-12 h-12 rounded-full border-2 animate-spin"
          style={{ borderColor: "oklch(0.55 0.22 25)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h2 className="font-display text-xl font-bold text-foreground mb-2">Torneo no encontrado</h2>
          <Link href="/tournaments">
            <button
              className="mt-4 px-6 py-2 rounded-lg font-display text-sm tracking-wider"
              style={{ background: "oklch(0.55 0.22 25)", color: "white" }}
            >
              VER TORNEOS
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const tAny = tournament as any;
  const statusColor = STATUS_COLORS[tournament.status] ?? "oklch(0.55 0.22 25)";
  const statusLabel = STATUS_LABELS[tournament.status] ?? tournament.status;
  const isOrganizer = user?.id === tournament.creatorId || user?.role === "admin" || user?.role === "super_admin";
  const canGenerateBracket =
    isOrganizer &&
    (tournament.status === "registration_closed" || tournament.status === "in_progress") &&
    (!matches || matches.length === 0);
  const hasBracket = matches && matches.length > 0;
  const totalRounds = matches ? Math.max(...matches.map((m: any) => m.round ?? 1), 1) : 1;
  const completedResults = results?.filter((r: any) => r.notes !== "BYE") ?? [];

  // Check-in window active?
  const now = new Date();
  const checkInActive =
    tAny.checkInStart && tAny.checkInEnd
      ? now >= new Date(tAny.checkInStart) && now <= new Date(tAny.checkInEnd)
      : false;

  // Parse contactInfo
  let contactInfo: { name?: string; discord?: string; email?: string; discordServer?: string } | null = null;
  try {
    if (tAny.contactInfo) contactInfo = JSON.parse(tAny.contactInfo);
  } catch {}

  // Parse schedule
  let schedule: { round: string; date: string; time?: string; description?: string }[] = [];
  try {
    if (tAny.schedule) schedule = JSON.parse(tAny.schedule);
  } catch {}

  // Tabs
  const tabs = [
    { id: "overview" as const, label: "GENERAL", icon: <LayoutList size={14} /> },
    {
      id: "participants" as const,
      label: "PARTICIPANTES",
      icon: <Users size={14} />,
      count: registeredTeams?.length,
    },
    {
      id: "brackets" as const,
      label: "BRACKETS",
      icon: <Swords size={14} />,
      count: hasBracket
        ? `${matches!.filter((m: any) => m.status === "completed").length}/${matches!.length}`
        : undefined,
    },
    {
      id: "stats" as const,
      label: "ESTADÍSTICAS",
      icon: <BarChart2 size={14} />,
      count: completedResults.length > 0 ? completedResults.length : undefined,
    },
    {
      id: "announcements" as const,
      label: "ANUNCIOS",
      icon: <Megaphone size={14} />,
      count: announcements?.length ?? 0,
    },
    {
      id: "freeagents" as const,
      label: "AGENTES LIBRES",
      icon: <UserPlus size={14} />,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ─── HEADER TITLE ─────────────────────────────────────────────────────── */}
      <div
        className="relative"
        style={{
          background: tournament.banner
            ? `linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.92) 100%), url(${tournament.banner}) center/cover no-repeat`
            : "linear-gradient(135deg, oklch(0.12 0.03 25) 0%, oklch(0.07 0.005 0) 100%)",
        }}
      >
        {/* Back button */}
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <Link href="/tournaments">
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-secondary-foreground hover:text-white transition-colors text-xs font-mono tracking-wider"
              style={{
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(8px)",
              }}
            >
              <ChevronLeft size={14} /> VOLVER A TORNEOS
            </button>
          </Link>
        </div>

        {/* Title block */}
        <div className="max-w-6xl mx-auto px-4 py-8 pb-6">
          <h1
            className="font-display text-4xl md:text-5xl font-black tracking-wider text-white mb-4 drop-shadow-lg"
            style={{ textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}
          >
            {tournament.name}
          </h1>

          {/* Info cards row (Battlefy-style) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
            <InfoCard label="Juego" value={tournament.game ?? "League of Legends"} />
            <InfoCard
              label="Fecha y Hora"
              value={
                tournament.startDate
                  ? new Date(tournament.startDate).toLocaleDateString("es-ES", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Por confirmar"
              }
              sub={
                tournament.startDate
                  ? new Date(tournament.startDate).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : undefined
              }
            />
            <InfoCard
              label="Formato"
              value={BRACKET_LABELS[tournament.bracketType] ?? tournament.bracketType}
              sub={
                tournament.minPlayersPerTeam === tournament.maxPlayersPerTeam
                  ? `${tournament.minPlayersPerTeam}v${tournament.minPlayersPerTeam}`
                  : `${tournament.minPlayersPerTeam}-${tournament.maxPlayersPerTeam} jugadores`
              }
            />
            <InfoCard
              label="Mapa y Tipo"
              value={tAny.gameMap ?? "Summoners Rift"}
              sub={DRAFT_LABELS[tAny.draftType ?? "tournament_draft"]}
            />
            {/* Organizer card */}
            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--bg-card)",
                border: "1px solid oklch(0.18 0.01 0)",
              }}
            >
              <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-2">Organizador</div>
              {tournament.creatorId ? (
                <Link href={`/profile/${tournament.creatorId}`} className="flex items-center gap-2 group">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: "oklch(0.55 0.22 25 / 0.2)",
                      border: "1px solid oklch(0.55 0.22 25 / 0.5)",
                      color: "oklch(0.70 0.28 25)",
                    }}
                  >
                    {tournament.creatorName?.charAt(0)?.toUpperCase() ?? "O"}
                  </div>
                  <span className="font-display text-sm font-bold text-foreground group-hover:text-red-400 transition-colors truncate">
                    {tournament.creatorName ?? "Organizador"}
                  </span>
                </Link>
              ) : (
                <span className="font-display text-sm font-bold text-foreground">
                  {tournament.creatorName ?? "Organizador"}
                </span>
              )}
            </div>
          </div>

          {/* Region row */}
          {tAny.region && (
            <div className="flex items-center gap-2 mb-2">
              <Globe size={14} className="text-muted-foreground" />
              <span className="text-sm text-secondary-foreground font-mono">{tAny.region}</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── TABS NAV ─────────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-30"
        style={{
          background: "var(--bg-main)",
          borderBottom: "1px solid oklch(0.18 0.01 0)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-4 py-4 text-xs font-display tracking-widest whitespace-nowrap transition-all duration-200 relative flex-shrink-0"
                  style={{
                    color: isActive ? "oklch(0.70 0.28 25)" : "oklch(0.50 0.005 0)",
                    borderBottom: isActive ? "2px solid oklch(0.55 0.22 25)" : "2px solid transparent",
                  }}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.count !== undefined && tab.count !== 0 && (
                    <span
                      className="text-xs font-mono px-1.5 py-0.5 rounded-full"
                      style={{
                        background: isActive ? "oklch(0.55 0.22 25 / 0.2)" : "oklch(0.18 0.01 0)",
                        color: isActive ? "oklch(0.70 0.28 25)" : "oklch(0.45 0.005 0)",
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── TAB CONTENT ──────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8 pb-20">

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">

              {/* Status + registration count */}
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="text-xs font-display tracking-wider px-3 py-1 rounded-full font-bold"
                  style={{
                    background: `${statusColor}20`,
                    border: `1px solid ${statusColor}50`,
                    color: statusColor,
                  }}
                >
                  {statusLabel}
                </span>
                <span className="text-sm text-muted-foreground font-mono">
                  {registeredTeams?.length ?? 0} / {tournament.maxTeams} EQUIPOS REGISTRADOS
                </span>
                {checkInActive && (
                  <span
                    className="text-xs font-display tracking-wider px-3 py-1 rounded-full font-bold animate-pulse"
                    style={{
                      background: "oklch(0.65 0.18 80 / 0.2)",
                      border: "1px solid oklch(0.65 0.18 80 / 0.5)",
                      color: "oklch(0.65 0.18 80)",
                    }}
                  >
                    ⏰ CHECK-IN ABIERTO
                  </span>
                )}
              </div>

              {/* Description */}
              {tournament.description && (
                <div
                  className="rounded-xl p-6"
                  style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
                >
                  <h2 className="font-display text-sm font-bold tracking-wider text-foreground mb-3 flex items-center gap-2">
                    <Info size={14} style={{ color: "oklch(0.55 0.22 25)" }} />
                    DETALLES
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                    {tournament.description}
                  </p>
                </div>
              )}

              {/* Rules */}
              {tournament.rules && (
                <div
                  className="rounded-xl p-6"
                  style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
                >
                  <h2 className="font-display text-sm font-bold tracking-wider text-foreground mb-3">REGLAMENTO</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                    {tournament.rules}
                  </p>
                </div>
              )}

              {/* Prizes */}
              {(tournament.prizeFirst || tournament.prizeSecond || tournament.prizeThird || tournament.prizeDescription) && (
                <div
                  className="rounded-xl p-6"
                  style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
                >
                  <h2 className="font-display text-sm font-bold tracking-wider text-foreground mb-4 flex items-center gap-2">
                    <Trophy size={14} style={{ color: "oklch(0.65 0.18 80)" }} />
                    PREMIOS
                  </h2>
                  {tournament.prizeDescription && !tournament.prizeFirst && (
                    <p className="text-muted-foreground text-sm">{tournament.prizeDescription}</p>
                  )}
                  <div className="space-y-3">
                    {tournament.prizeFirst && (
                      <div
                        className="flex items-center gap-3 p-3 rounded-lg"
                        style={{ background: "oklch(0.65 0.18 80 / 0.08)", border: "1px solid oklch(0.65 0.18 80 / 0.2)" }}
                      >
                        <Crown size={18} style={{ color: "oklch(0.65 0.18 80)" }} />
                        <div>
                          <div className="text-xs text-muted-foreground font-mono">1er LUGAR</div>
                          <div className="font-display text-sm font-bold text-foreground">{tournament.prizeFirst}</div>
                        </div>
                      </div>
                    )}
                    {tournament.prizeSecond && (
                      <div
                        className="flex items-center gap-3 p-3 rounded-lg"
                        style={{ background: "oklch(0.75 0.005 0 / 0.08)", border: "1px solid oklch(0.50 0.005 0 / 0.3)" }}
                      >
                        <Star size={18} style={{ color: "oklch(0.75 0.005 0)" }} />
                        <div>
                          <div className="text-xs text-muted-foreground font-mono">2do LUGAR</div>
                          <div className="font-display text-sm font-bold text-foreground">{tournament.prizeSecond}</div>
                        </div>
                      </div>
                    )}
                    {tournament.prizeThird && (
                      <div
                        className="flex items-center gap-3 p-3 rounded-lg"
                        style={{ background: "oklch(0.55 0.18 50 / 0.08)", border: "1px solid oklch(0.55 0.18 50 / 0.2)" }}
                      >
                        <Star size={18} style={{ color: "oklch(0.55 0.18 50)" }} />
                        <div>
                          <div className="text-xs text-muted-foreground font-mono">3er LUGAR</div>
                          <div className="font-display text-sm font-bold text-foreground">{tournament.prizeThird}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Schedule */}
              {schedule.length > 0 && (
                <div
                  className="rounded-xl p-6"
                  style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
                >
                  <h2 className="font-display text-sm font-bold tracking-wider text-foreground mb-4 flex items-center gap-2">
                    <Calendar size={14} style={{ color: "oklch(0.55 0.22 25)" }} />
                    CALENDARIO
                  </h2>
                  <div className="space-y-3">
                    {schedule.map((s, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ background: "oklch(0.55 0.22 25)" }}
                        />
                        <div>
                          <div className="font-display text-sm font-bold text-foreground">{s.round}</div>
                          <div className="text-xs text-muted-foreground">
                            {s.date} {s.time && `· ${s.time}`}
                          </div>
                          {s.description && (
                            <div className="text-xs text-secondary-foreground mt-0.5">{s.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact */}
              {contactInfo && (
                <div
                  className="rounded-xl p-6"
                  style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
                >
                  <h2 className="font-display text-sm font-bold tracking-wider text-foreground mb-4">CONTACTO</h2>
                  <div className="space-y-2">
                    {contactInfo.name && (
                      <p className="text-sm text-secondary-foreground">{contactInfo.name}</p>
                    )}
                    {contactInfo.discord && (
                      <p className="text-sm text-secondary-foreground">
                        <span className="text-muted-foreground">Discord: </span>
                        {contactInfo.discord}
                      </p>
                    )}
                    {contactInfo.email && (
                      <p className="text-sm text-secondary-foreground">
                        <span className="text-muted-foreground">Email: </span>
                        {contactInfo.email}
                      </p>
                    )}
                    {contactInfo.discordServer && (
                      <a
                        href={contactInfo.discordServer}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-mono"
                        style={{ color: "oklch(0.55 0.18 220)" }}
                      >
                        Discord Server →
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Upcoming matches */}
              {upcomingMatches && upcomingMatches.length > 0 && (
                <div
                  className="rounded-xl p-6"
                  style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
                >
                  <h2 className="font-display text-sm font-bold tracking-wider text-foreground mb-4 flex items-center gap-2">
                    <Clock size={14} style={{ color: "oklch(0.55 0.22 25)" }} />
                    PRÓXIMOS PARTIDOS
                  </h2>
                  <div className="space-y-3">
                    {upcomingMatches.map((m: any) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{ background: "var(--bg-card)", border: "1px solid oklch(0.20 0.01 0)" }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span
                            className="text-xs font-mono px-2 py-0.5 rounded flex-shrink-0"
                            style={{
                              background: "oklch(0.55 0.22 25 / 0.1)",
                              color: "oklch(0.65 0.22 25)",
                              border: "1px solid oklch(0.55 0.22 25 / 0.2)",
                            }}
                          >
                            R{m.round}
                          </span>
                          <span className="font-display text-sm text-foreground truncate">{m.team1Name ?? "TBD"}</span>
                          <span className="text-muted-foreground text-xs font-mono flex-shrink-0">VS</span>
                          <span className="font-display text-sm text-foreground truncate">{m.team2Name ?? "TBD"}</span>
                        </div>
                        {m.scheduledAt && (
                          <span className="text-xs text-muted-foreground font-mono ml-3 flex-shrink-0">
                            {new Date(m.scheduledAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* JOIN / Register CTA */}
              <div
                className="rounded-xl p-5"
                style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
              >
                <div className="text-xs font-display tracking-widest text-muted-foreground mb-3">INSCRIPCIÓN</div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display text-sm font-bold text-foreground">REGISTRAR EQUIPO</span>
                </div>
                {tournament.status === "registration_open" ? (
                  isAuthenticated ? (
                    <button
                      onClick={() => setShowRegisterModal(true)}
                      className="w-full py-3 rounded-lg font-display text-sm tracking-widest transition-all duration-300"
                      style={{
                        background: "oklch(0.55 0.22 25)",
                        color: "white",
                        boxShadow: "0 0 15px oklch(0.55 0.22 25 / 0.4)",
                      }}
                    >
                      Inscribir Equipo
                    </button>
                  ) : (
                    <button
                      onClick={() => (window.location.href = getLoginUrl())}
                      className="w-full py-3 rounded-lg font-display text-sm tracking-widest transition-all duration-300"
                      style={{ background: "oklch(0.55 0.22 25)", color: "white" }}
                    >
                      INICIAR SESIÓN
                    </button>
                  )
                ) : (
                  <div
                    className="flex items-center gap-2 text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <AlertCircle size={16} />
                    <span className="font-display tracking-wider text-xs">
                      {tournament.status === "completed"
                        ? "Torneo finalizado"
                        : tournament.status === "in_progress"
                        ? "Torneo en curso"
                        : "Inscripciones cerradas"}
                    </span>
                  </div>
                )}
              </div>

              {/* Check-in CTA */}
              {checkInActive && isAuthenticated && (
                <div
                  className="rounded-xl p-5"
                  style={{
                    background: "oklch(0.65 0.18 80 / 0.05)",
                    border: "1px solid oklch(0.65 0.18 80 / 0.3)",
                  }}
                >
                  <div className="text-xs font-display tracking-widest mb-2" style={{ color: "oklch(0.65 0.18 80)" }}>
                    ⏰ CHECK-IN ABIERTO
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Haz check-in antes del inicio del torneo para confirmar tu participación.
                  </p>
                  <button
                    onClick={() => setShowCheckInModal(true)}
                    className="w-full py-2.5 rounded-lg font-display text-xs tracking-widest transition-all duration-300"
                    style={{
                      background: "oklch(0.65 0.18 80 / 0.2)",
                      border: "1px solid oklch(0.65 0.18 80 / 0.5)",
                      color: "oklch(0.65 0.18 80)",
                    }}
                  >
                    HACER CHECK-IN
                  </button>
                </div>
              )}

              {/* Dates */}
              <div
                className="rounded-xl p-5"
                style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
              >
                <h3 className="font-display text-xs font-bold tracking-wider text-muted-foreground mb-4 uppercase">
                  Fechas Importantes
                </h3>
                <div className="space-y-3">
                  {tournament.registrationStart && (
                    <div className="flex items-start gap-3">
                      <Clock size={14} className="mt-0.5 flex-shrink-0" style={{ color: "oklch(0.55 0.22 25)" }} />
                      <div>
                        <div className="text-xs text-muted-foreground">Inicio inscripciones</div>
                        <div className="text-sm text-foreground font-display tracking-wide">
                          {new Date(tournament.registrationStart).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                  )}
                  {tournament.registrationEnd && (
                    <div className="flex items-start gap-3">
                      <Clock size={14} className="mt-0.5 flex-shrink-0" style={{ color: "oklch(0.55 0.22 25)" }} />
                      <div>
                        <div className="text-xs text-muted-foreground">Cierre inscripciones</div>
                        <div className="text-sm text-foreground font-display tracking-wide">
                          {new Date(tournament.registrationEnd).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                  )}
                  {tAny.checkInStart && (
                    <div className="flex items-start gap-3">
                      <CheckCircle size={14} className="mt-0.5 flex-shrink-0" style={{ color: "oklch(0.65 0.18 80)" }} />
                      <div>
                        <div className="text-xs text-muted-foreground">Check-in</div>
                        <div className="text-sm text-foreground font-display tracking-wide">
                          {new Date(tAny.checkInStart).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                          {" — "}
                          {new Date(tAny.checkInEnd).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                        </div>
                      </div>
                    </div>
                  )}
                  {tournament.startDate && (
                    <div className="flex items-start gap-3">
                      <Calendar size={14} className="mt-0.5 flex-shrink-0" style={{ color: "oklch(0.65 0.18 80)" }} />
                      <div>
                        <div className="text-xs text-muted-foreground">Inicio del torneo</div>
                        <div className="text-sm text-foreground font-display tracking-wide">
                          {new Date(tournament.startDate).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                  )}
                  {tournament.endDate && (
                    <div className="flex items-start gap-3">
                      <Calendar size={14} className="mt-0.5 flex-shrink-0" style={{ color: "oklch(0.65 0.18 80)" }} />
                      <div>
                        <div className="text-xs text-muted-foreground">Fin del torneo</div>
                        <div className="text-sm text-foreground font-display tracking-wide">
                          {new Date(tournament.endDate).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Requirements */}
              {(tAny.requireRiotAccount || tAny.region) && (
                <div
                  className="rounded-xl p-5"
                  style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
                >
                  <h3 className="font-display text-xs font-bold tracking-wider text-muted-foreground mb-3 uppercase">
                    Requisitos
                  </h3>
                  <div className="space-y-2">
                    {tAny.requireRiotAccount && (
                      <div className="flex items-center gap-2 text-sm text-secondary-foreground">
                        <Shield size={14} style={{ color: "oklch(0.55 0.22 25)" }} />
                        Cuenta Riot vinculada requerida
                      </div>
                    )}
                    {tAny.region && (
                      <div className="flex items-center gap-2 text-sm text-secondary-foreground">
                        <MapPin size={14} style={{ color: "oklch(0.55 0.22 25)" }} />
                        Región: {tAny.region}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PARTICIPANTS TAB ──────────────────────────────────────────────────── */}
        {activeTab === "participants" && (
          <div>
            {/* Filters row */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-mono px-3 py-1.5 rounded-full cursor-pointer"
                  style={{
                    background: "oklch(0.55 0.22 25 / 0.15)",
                    border: "1px solid oklch(0.55 0.22 25 / 0.4)",
                    color: "oklch(0.65 0.22 25)",
                  }}
                >
                  Inscritos
                </span>
                {checkins && checkins.length > 0 && (
                  <span
                    className="text-xs font-mono px-3 py-1.5 rounded-full cursor-pointer"
                    style={{
                      background: "oklch(0.65 0.18 145 / 0.1)",
                      border: "1px solid oklch(0.65 0.18 145 / 0.3)",
                      color: "oklch(0.65 0.18 145)",
                    }}
                  >
                    Con Check-in ({checkins.length})
                  </span>
                )}
              </div>
              <div className="ml-auto text-sm text-muted-foreground font-mono">
                {registeredTeams?.length ?? 0} EQUIPOS
              </div>
            </div>

            {!registeredTeams || registeredTeams.length === 0 ? (
              <div
                className="rounded-xl p-12 text-center"
                style={{ background: "var(--bg-card)", border: "1px dashed oklch(0.22 0.01 0)" }}
              >
                <Users size={40} className="mx-auto mb-4 opacity-30" />
                <p className="font-display text-sm tracking-wider text-muted-foreground">
                  Aún no hay equipos inscritos
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {registeredTeams.map((team: any) => {
                  const isCheckedIn = checkins?.some((c: any) => c.teamId === team.teamId) ?? false;
                  return (
                    <ParticipantCard key={team.teamId} team={team} checkedIn={isCheckedIn} />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── BRACKETS TAB ─────────────────────────────────────────────────────── */}
        {activeTab === "brackets" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold tracking-wider text-foreground flex items-center gap-2">
                <Swords size={18} style={{ color: "oklch(0.55 0.22 25)" }} />
                BRACKET
                {hasBracket && (
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded-full ml-1"
                    style={{
                      background: "oklch(0.65 0.18 80 / 0.15)",
                      color: "oklch(0.65 0.18 80)",
                      border: "1px solid oklch(0.65 0.18 80 / 0.3)",
                    }}
                  >
                    {matches!.filter((m: any) => m.status === "completed").length}/{matches!.length} partidas
                  </span>
                )}
              </h2>
              {isOrganizer && hasBracket && tournament.status === "in_progress" && (
                <button
                  onClick={() => generateBracketMutation.mutate({ tournamentId: id })}
                  disabled={generateBracketMutation.isPending}
                  className="px-4 py-1.5 rounded-lg font-display text-xs tracking-widest transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid oklch(0.55 0.22 25 / 0.4)",
                    color: "oklch(0.70 0.28 25)",
                  }}
                >
                  {generateBracketMutation.isPending ? "REGENERANDO..." : "REGENERAR BRACKET"}
                </button>
              )}
            </div>
            {!hasBracket ? (
              <div
                className="rounded-xl p-12 text-center"
                style={{ background: "var(--bg-card)", border: "1px dashed oklch(0.22 0.01 0)" }}
              >
                <Swords size={40} className="mx-auto mb-4 opacity-30" />
                <p className="font-display text-sm tracking-wider text-muted-foreground mb-2">
                  {tournament.status === "registration_open"
                    ? "El bracket se generará cuando cierren las inscripciones"
                    : tournament.status === "registration_closed" && isOrganizer
                    ? "Las inscripciones están cerradas. Genera el bracket para comenzar."
                    : "El bracket aún no ha sido generado"}
                </p>
                {canGenerateBracket && (
                  <button
                    onClick={() => generateBracketMutation.mutate({ tournamentId: id })}
                    disabled={generateBracketMutation.isPending}
                    className="mt-4 px-6 py-2.5 rounded-lg font-display text-sm tracking-widest transition-all duration-300 disabled:opacity-50"
                    style={{ background: "oklch(0.55 0.22 25)", color: "white", boxShadow: "0 0 20px oklch(0.55 0.22 25 / 0.4)" }}
                  >
                    <Zap size={14} className="inline mr-1.5" />
                    {generateBracketMutation.isPending ? "GENERANDO..." : "GENERAR BRACKET AHORA"}
                  </button>
                )}
              </div>
            ) : (
              <div
                className="rounded-xl overflow-x-auto"
                style={{ background: "var(--bg-main)", border: "1px solid oklch(0.15 0.01 0)" }}
              >
                <div className="p-6" style={{ minWidth: "fit-content" }}>
                  <BracketView
                    matches={matches ?? []}
                    showDemo={false}
                    canEditResults={tournament.status === "in_progress" && isOrganizer}
                    onDeclareWinner={async (matchId: number, team1Score: number, team2Score: number) => {
                      await updateResultMutation.mutateAsync({ matchId, tournamentId: id, team1Score, team2Score });
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STATS TAB ────────────────────────────────────────────────────────── */}
        {activeTab === "stats" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-bold tracking-wider text-foreground flex items-center gap-2">
                <BarChart2 size={18} style={{ color: "oklch(0.55 0.22 25)" }} />
                RESULTADOS
              </h2>
              {completedResults.length > 0 && (
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded-full"
                  style={{
                    background: "oklch(0.65 0.18 145 / 0.15)",
                    color: "oklch(0.65 0.18 145)",
                    border: "1px solid oklch(0.65 0.18 145 / 0.3)",
                  }}
                >
                  {completedResults.length} partidas completadas
                </span>
              )}
            </div>

            {completedResults.length === 0 ? (
              <div
                className="rounded-xl p-12 text-center"
                style={{ background: "var(--bg-card)", border: "1px dashed oklch(0.22 0.01 0)" }}
              >
                <ListOrdered size={40} className="mx-auto mb-4 opacity-30" />
                <p className="font-display text-sm tracking-wider text-muted-foreground">
                  Aún no hay partidas completadas
                </p>
              </div>
            ) : (
              <div>
                {(Array.from(new Set(completedResults.map((r: any) => r.round ?? 1))) as number[])
                  .sort((a: number, b: number) => a - b)
                  .map((round: number) => {
                    const roundMatches = completedResults.filter((r: any) => (r.round ?? 1) === round);
                    return (
                      <div key={round} className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-px flex-1" style={{ background: "var(--bg-hover)" }} />
                          <span
                            className="font-display text-xs tracking-widest px-3 py-1 rounded-full"
                            style={{
                              background: "oklch(0.55 0.22 25 / 0.1)",
                              color: "oklch(0.65 0.22 25)",
                              border: "1px solid oklch(0.55 0.22 25 / 0.25)",
                            }}
                          >
                            {getRoundLabel(round, totalRounds).toUpperCase()}
                          </span>
                          <div className="h-px flex-1" style={{ background: "var(--bg-hover)" }} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {roundMatches.map((match: any) => (
                            <ResultRow key={match.id} match={match} totalRounds={totalRounds} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* ── ANNOUNCEMENTS TAB ────────────────────────────────────────────────── */}
        {activeTab === "announcements" && (
          <div>
            {/* Organizer: post announcement */}
            {isOrganizer && (
              <div
                className="rounded-xl p-5 mb-6"
                style={{ background: "var(--bg-card)", border: "1px solid oklch(0.55 0.22 25 / 0.3)" }}
              >
                <h3 className="font-display text-sm font-bold tracking-wider text-foreground mb-3 flex items-center gap-2">
                  <Megaphone size={14} style={{ color: "oklch(0.55 0.22 25)" }} />
                  PUBLICAR ANUNCIO
                </h3>
                <textarea
                  value={newAnnouncement}
                  onChange={(e) => setNewAnnouncement(e.target.value)}
                  placeholder="Escribe un anuncio para los participantes..."
                  rows={3}
                  className="w-full rounded-lg px-3 py-2 text-sm text-foreground resize-none mb-3"
                  style={{
                    background: "var(--bg-main)",
                    border: "1px solid oklch(0.22 0.01 0)",
                    outline: "none",
                  }}
                />
                <button
                  onClick={() => {
                    if (!newAnnouncement.trim()) return;
                    createAnnouncementMutation.mutate({ tournamentId: id, message: newAnnouncement.trim() });
                  }}
                  disabled={createAnnouncementMutation.isPending || !newAnnouncement.trim()}
                  className="px-5 py-2 rounded-lg font-display text-xs tracking-widest transition-all duration-200 disabled:opacity-50"
                  style={{ background: "oklch(0.55 0.22 25)", color: "white" }}
                >
                  {createAnnouncementMutation.isPending ? "PUBLICANDO..." : "PUBLICAR"}
                </button>
              </div>
            )}

            {/* Announcements list */}
            {!announcements || announcements.length === 0 ? (
              <div
                className="rounded-xl p-12 text-center"
                style={{ background: "var(--bg-card)", border: "1px dashed oklch(0.22 0.01 0)" }}
              >
                <Megaphone size={40} className="mx-auto mb-4 opacity-30" />
                <p className="font-display text-sm tracking-wider text-muted-foreground">
                  No hay anuncios todavía
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(announcements as any[]).map((a) => (
                  <AnnouncementRow key={a.id} announcement={a} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── FREE AGENTS TAB ───────────────────────────────────────────────────── */}
        {activeTab === "freeagents" && (
          <div className="space-y-4">
            {/* Header + botón de registrarse */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-sm font-bold tracking-wider text-foreground">AGENTES LIBRES</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Jugadores sin equipo buscando equipo para este torneo.
                </p>
              </div>
              {isAuthenticated && tournament.status === "registration_open" && (
                <button
                  onClick={() => setShowFreeAgentModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-display text-xs tracking-widest transition-all duration-200"
                  style={{
                    background: "oklch(0.55 0.18 220 / 0.15)",
                    border: "1px solid oklch(0.55 0.18 220 / 0.4)",
                    color: "oklch(0.65 0.18 220)",
                  }}
                >
                  <UserPlus size={14} /> REGISTRARME
                </button>
              )}
            </div>

            {!freeAgents || freeAgents.length === 0 ? (
              <div
                className="rounded-xl p-12 text-center"
                style={{ background: "var(--bg-card)", border: "1px dashed oklch(0.22 0.01 0)" }}
              >
                <UserPlus size={40} className="mx-auto mb-4 opacity-30" />
                <p className="font-display text-sm tracking-wider text-muted-foreground">
                  No hay agentes libres registrados
                </p>
                {!isAuthenticated && (
                  <p className="text-xs text-muted-foreground mt-2">Inicia sesión para registrarte como agente libre</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(freeAgents as any[]).map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-start gap-3 p-4 rounded-xl"
                    style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden"
                      style={{ background: "oklch(0.55 0.18 220 / 0.15)", color: "oklch(0.65 0.18 220)" }}
                    >
                      {agent.userAvatar
                        ? <img src={agent.userAvatar} alt="" className="w-full h-full object-cover" />
                        : (agent.userNickname ?? agent.userName ?? "?").charAt(0).toUpperCase()
                      }
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display text-sm font-bold text-foreground truncate">
                          {agent.userNickname ?? agent.userName}
                        </span>
                        {agent.role && (
                          <span
                            className="px-2 py-0.5 rounded-full font-display text-xs tracking-wider"
                            style={{ background: "oklch(0.55 0.22 25 / 0.15)", color: "oklch(0.65 0.22 25)" }}
                          >
                            {agent.role}
                          </span>
                        )}
                      </div>
                      {agent.riotGameName && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {agent.riotGameName}#{agent.riotTagLine} · {agent.riotRegion?.toUpperCase()}
                        </p>
                      )}
                      {agent.message && (
                        <p className="text-xs text-foreground/70 mt-1 leading-relaxed line-clamp-2">{agent.message}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── FREE AGENT MODAL ───────────────────────────────────────────────────── */}
      {showFreeAgentModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 0.8)" }}
          onClick={() => setShowFreeAgentModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{
              background: "var(--bg-card)",
              border: "1px solid oklch(0.55 0.18 220 / 0.4)",
              boxShadow: "0 0 40px oklch(0.55 0.18 220 / 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <UserPlus size={18} style={{ color: "oklch(0.65 0.18 220)" }} />
              <h3 className="font-display text-base font-bold tracking-wider text-foreground">REGISTRARSE COMO AGENTE LIBRE</h3>
            </div>
            <p className="text-xs text-muted-foreground font-mono mb-4">
              Tu perfil será visible para los capitanes de equipo que busquen jugadores para este torneo.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">ROL PRINCIPAL</label>
                <select
                  value={freeAgentRole}
                  onChange={(e) => setFreeAgentRole(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    background: "oklch(0.12 0.005 0)",
                    border: "1px solid oklch(0.25 0.01 0)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="">Seleccionar rol...</option>
                  <option value="Top">Top</option>
                  <option value="Jungle">Jungle</option>
                  <option value="Mid">Mid</option>
                  <option value="ADC">ADC</option>
                  <option value="Support">Support</option>
                  <option value="Fill">Fill</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-display tracking-wider text-muted-foreground mb-1">MENSAJE (opcional)</label>
                <textarea
                  value={freeAgentMessage}
                  onChange={(e) => setFreeAgentMessage(e.target.value)}
                  placeholder="Ej: Platino 1, main mid, busco equipo serio..."
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-lg px-3 py-2 text-sm font-mono resize-none outline-none"
                  style={{
                    background: "oklch(0.12 0.005 0)",
                    border: "1px solid oklch(0.25 0.01 0)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowFreeAgentModal(false)}
                className="flex-1 py-3 rounded-xl font-display text-xs tracking-widest"
                style={{ background: "transparent", border: "1px solid oklch(0.25 0.01 0)", color: "oklch(0.60 0.005 0)" }}
              >
                CANCELAR
              </button>
              <button
                onClick={() => {
                  registerFreeAgentMutation.mutate({
                    tournamentId: id,
                    role: freeAgentRole || undefined,
                    message: freeAgentMessage || undefined,
                  });
                }}
                disabled={registerFreeAgentMutation.isPending}
                className="flex-1 py-3 rounded-xl font-display text-xs tracking-widest transition-all duration-300 disabled:opacity-50"
                style={{
                  background: "oklch(0.55 0.18 220)",
                  color: "var(--text-primary)",
                  boxShadow: "0 0 12px oklch(0.55 0.18 220 / 0.4)",
                }}
              >
                {registerFreeAgentMutation.isPending ? "REGISTRANDO..." : "CONFIRMAR"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── REGISTER MODAL ───────────────────────────────────────────────────── */}
      {showRegisterModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 0.8)" }}
          onClick={() => setShowRegisterModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{
              background: "var(--bg-card)",
              border: "1px solid oklch(0.55 0.22 25 / 0.3)",
              boxShadow: "0 0 40px oklch(0.55 0.22 25 / 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-xl font-bold tracking-wider text-foreground mb-2">
              INSCRIBIR EQUIPO
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              Selecciona el equipo que deseas inscribir en{" "}
              <span className="text-foreground font-semibold">{tournament.name}</span>
            </p>
            {/* Aviso de cuenta Riot requerida */}
            {(tAny.requireRiotAccount) && (
              <div
                className="flex items-start gap-2 rounded-lg p-3 mb-4"
                style={{ background: "oklch(0.65 0.18 80 / 0.08)", border: "1px solid oklch(0.65 0.18 80 / 0.3)" }}
              >
                <Info size={14} className="mt-0.5 flex-shrink-0" style={{ color: "oklch(0.65 0.18 80)" }} />
                <p className="text-xs" style={{ color: "oklch(0.65 0.18 80)" }}>
                  Este torneo requiere una <strong>cuenta de Riot vinculada</strong>. Si no la tienes, ve a tu perfil y vincúlala antes de inscribirte.
                  {tAny.region && <span> Región requerida: <strong>{tAny.region}</strong>.</span>}
                </p>
              </div>
            )}
            {/* Cupo disponible */}
            {tAny.maxTeams && (
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                <span>Cupo disponible</span>
                <span className="font-display font-bold" style={{ color: (registeredTeams?.length ?? 0) >= tAny.maxTeams ? "oklch(0.65 0.22 25)" : "oklch(0.65 0.18 145)" }}>
                  {registeredTeams?.length ?? 0} / {tAny.maxTeams} equipos aprobados
                </span>
              </div>
            )}
            {!myTeams || myTeams.length === 0 ? (
              <div className="text-center py-6">
                <Shield size={32} className="mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground text-sm mb-4">No tienes equipos creados</p>
                <Link href="/my-teams">
                  <button
                    className="px-4 py-2 rounded-lg font-display text-xs tracking-widest"
                    style={{ background: "oklch(0.55 0.22 25)", color: "white" }}
                  >
                    CREAR EQUIPO
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(myTeams as any[]).map((team) => (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeamId(team.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left"
                      style={
                        selectedTeamId === team.id
                          ? { background: "oklch(0.55 0.22 25 / 0.15)", border: "1px solid oklch(0.55 0.22 25 / 0.5)" }
                          : { background: "var(--bg-card)", border: "1px solid oklch(0.20 0.01 0)" }
                      }
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: "oklch(0.55 0.22 25 / 0.2)", color: "oklch(0.70 0.28 25)" }}
                      >
                        {team.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-display tracking-wide text-foreground">{team.name}</div>
                        {team.game && <div className="text-xs text-muted-foreground">{team.game}</div>}
                      </div>
                      {selectedTeamId === team.id && (
                        <CheckCircle size={16} className="ml-auto" style={{ color: "oklch(0.65 0.22 25)" }} />
                      )}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-display tracking-wider text-muted-foreground mb-2">
                    MENSAJE PARA EL ORGANIZADOR (OPCIONAL)
                  </label>
                  <textarea
                    value={teamMessage}
                    onChange={(e) => setTeamMessage(e.target.value)}
                    placeholder="Cuéntale algo al organizador..."
                    rows={3}
                    className="w-full rounded-lg px-3 py-2 text-sm text-foreground resize-none"
                    style={{
                      background: "var(--bg-main)",
                      border: "1px solid oklch(0.22 0.01 0)",
                      outline: "none",
                    }}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRegisterModal(false)}
                    className="flex-1 py-2.5 rounded-lg font-display text-xs tracking-widest transition-all duration-200"
                    style={{ background: "var(--bg-main)", border: "1px solid oklch(0.22 0.01 0)", color: "var(--text-muted)" }}
                  >
                    CANCELAR
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedTeamId) return;
                      registerMutation.mutate({
                        tournamentId: id,
                        teamId: selectedTeamId,
                        teamMessage: teamMessage || undefined,
                      });
                    }}
                    disabled={!selectedTeamId || registerMutation.isPending}
                    className="flex-1 py-2.5 rounded-lg font-display text-xs tracking-widest transition-all duration-300 disabled:opacity-50"
                    style={{ background: "oklch(0.55 0.22 25)", color: "white" }}
                  >
                    {registerMutation.isPending ? "ENVIANDO..." : "CONFIRMAR"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── CHECK-IN MODAL ───────────────────────────────────────────────────── */}
      {showCheckInModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 0.8)" }}
          onClick={() => setShowCheckInModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{
              background: "var(--bg-card)",
              border: "1px solid oklch(0.65 0.18 80 / 0.3)",
              boxShadow: "0 0 40px oklch(0.65 0.18 80 / 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-xl font-bold tracking-wider text-foreground mb-2">
              CHECK-IN
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Selecciona el equipo para hacer check-in en <span className="text-foreground font-semibold">{tournament.name}</span>
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {(registeredTeams ?? []).filter((t: any) => {
                // Solo mostrar equipos del usuario
                return myTeams?.some((mt: any) => mt.id === t.teamId);
              }).map((team: any) => {
                const alreadyCheckedIn = checkins?.some((c: any) => c.teamId === team.teamId);
                return (
                  <button
                    key={team.teamId}
                    onClick={() => !alreadyCheckedIn && setCheckInTeamId(team.teamId)}
                    disabled={!!alreadyCheckedIn}
                    className="w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left disabled:opacity-60"
                    style={
                      checkInTeamId === team.teamId
                        ? { background: "oklch(0.65 0.18 80 / 0.15)", border: "1px solid oklch(0.65 0.18 80 / 0.5)" }
                        : { background: "var(--bg-card)", border: "1px solid oklch(0.20 0.01 0)" }
                    }
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: "oklch(0.55 0.22 25 / 0.2)", color: "oklch(0.70 0.28 25)" }}
                    >
                      {team.teamName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-display tracking-wide text-foreground">{team.teamName}</span>
                    {alreadyCheckedIn && (
                      <span
                        className="ml-auto text-xs font-mono px-2 py-0.5 rounded"
                        style={{ background: "oklch(0.65 0.18 145 / 0.15)", color: "oklch(0.65 0.18 145)" }}
                      >
                        ✓ Ya hizo check-in
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCheckInModal(false)}
                className="flex-1 py-2.5 rounded-lg font-display text-xs tracking-widest"
                style={{ background: "var(--bg-main)", border: "1px solid oklch(0.22 0.01 0)", color: "var(--text-muted)" }}
              >
                CANCELAR
              </button>
              <button
                onClick={() => {
                  if (!checkInTeamId) return;
                  checkInMutation.mutate({ tournamentId: id, teamId: checkInTeamId });
                }}
                disabled={!checkInTeamId || checkInMutation.isPending}
                className="flex-1 py-2.5 rounded-lg font-display text-xs tracking-widest disabled:opacity-50"
                style={{ background: "oklch(0.65 0.18 80 / 0.3)", border: "1px solid oklch(0.65 0.18 80 / 0.5)", color: "oklch(0.65 0.18 80)" }}
              >
                {checkInMutation.isPending ? "CONFIRMANDO..." : "CONFIRMAR CHECK-IN"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
