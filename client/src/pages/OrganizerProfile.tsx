import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Trophy, Users, Calendar, Globe, MessageSquare,
  Twitter, Twitch, ChevronRight, UserPlus, UserCheck,
  MapPin, Clock, CheckCircle, XCircle, PlayCircle, Award
} from "lucide-react";

// ── Game icon map ─────────────────────────────────────────────────────────────
const GAME_ICONS: Record<string, string> = {
  "valorant": "/games/valorant.png",
  "league-of-legends": "/games/lol.png",
  "counter-strike": "/games/cs2.png",
  "dota-2": "/games/dota2.png",
  "apex-legends": "/games/apex.png",
  "overwatch": "/games/ow2.png",
  "rocket-league": "/games/rl.png",
  "honor-of-kings": "/games/hok.png",
  "fortnite": "/games/fortnite.png",
};

const GAME_SLUG_MAP: Record<string, string> = {
  "Valorant": "valorant",
  "League of Legends": "league-of-legends",
  "CS2": "counter-strike",
  "Dota 2": "dota-2",
  "Apex Legends": "apex-legends",
  "Overwatch 2": "overwatch",
  "Rocket League": "rocket-league",
  "Honor of Kings": "honor-of-kings",
  "Fortnite": "fortnite",
};

const BRACKET_LABELS: Record<string, string> = {
  single_elimination: "Eliminación Simple",
  double_elimination: "Eliminación Doble",
  groups: "Grupos",
  swiss: "Sistema Suizo",
  round_robin: "Round Robin",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  registration_open: { label: "Inscripciones Abiertas", color: "text-green-400", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  registration_closed: { label: "Inscripciones Cerradas", color: "text-yellow-400", icon: <Clock className="w-3.5 h-3.5" /> },
  in_progress: { label: "En Progreso", color: "text-blue-400", icon: <PlayCircle className="w-3.5 h-3.5" /> },
  completed: { label: "Finalizado", color: "text-zinc-400", icon: <Award className="w-3.5 h-3.5" /> },
  cancelled: { label: "Cancelado", color: "text-red-400", icon: <XCircle className="w-3.5 h-3.5" /> },
};

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  to: { label: "Tournament Organizer", color: "text-purple-400" },
  cdc: { label: "Creador de Contenido", color: "text-blue-400" },
  partner: { label: "Partner", color: "text-green-400" },
  admin: { label: "Administrador", color: "text-red-400" },
  super_admin: { label: "Super Admin", color: "text-yellow-400" },
};

function TournamentRow({ t }: { t: any }) {
  const gameSlug = GAME_SLUG_MAP[t.game] ?? t.game?.toLowerCase().replace(/\s+/g, "-");
  const gameIcon = GAME_ICONS[gameSlug];
  const status = STATUS_CONFIG[t.status];
  const date = t.startDate ? new Date(t.startDate) : null;

  return (
    <Link href={`/tournaments/${t.id}`}>
      <div className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer border-b border-border/50 last:border-0">
        {/* Game icon */}
        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800 flex items-center justify-center">
          {gameIcon ? (
            <img src={gameIcon} alt={t.game} className="w-full h-full object-cover" />
          ) : (
            <Trophy className="w-5 h-5 text-zinc-500" />
          )}
        </div>
        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{t.name}</p>
          <p className="text-xs text-muted-foreground">{t.game}</p>
        </div>
        {/* Type */}
        <div className="hidden md:block w-36 text-xs text-muted-foreground">
          {BRACKET_LABELS[t.bracketType] ?? t.bracketType}
        </div>
        {/* Date */}
        <div className="hidden md:block w-40 text-xs text-muted-foreground">
          {date ? date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "—"}
        </div>
        {/* Participants */}
        <div className="hidden sm:flex items-center gap-1 w-24 text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          <span>{t.participantCount} / {t.maxTeams}</span>
        </div>
        {/* Status */}
        <div className={`hidden sm:flex items-center gap-1 text-xs font-mono ${status?.color ?? "text-muted-foreground"}`}>
          {status?.icon}
          <span className="hidden lg:inline">{status?.label ?? t.status}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
      </div>
    </Link>
  );
}

function TournamentTable({ tournaments, emptyMsg }: { tournaments: any[]; emptyMsg: string }) {
  if (tournaments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm font-mono">{emptyMsg}</div>
    );
  }
  return (
    <div>
      {/* Header */}
      <div className="hidden md:flex items-center gap-4 px-4 py-2 border-b border-border text-xs font-mono text-muted-foreground tracking-widest">
        <div className="w-10 flex-shrink-0" />
        <div className="flex-1">NOMBRE</div>
        <div className="w-36">TIPO</div>
        <div className="w-40">FECHA</div>
        <div className="hidden sm:block w-24">PARTICIPANTES</div>
        <div className="hidden sm:block w-32">ESTADO</div>
        <div className="w-4" />
      </div>
      {tournaments.map(t => <TournamentRow key={t.id} t={t} />)}
    </div>
  );
}

export default function OrganizerProfile() {
  const params = useParams<{ id: string }>();
  const userId = parseInt(params.id ?? "0");
  const { user: me } = useAuth();

  const { data, isLoading, error } = trpc.organizers.profile.useQuery(
    { userId },
    { enabled: !!userId }
  );

  const { data: isFollowingData } = trpc.social.isFollowing.useQuery(
    { targetUserId: userId },
    { enabled: !!me && !!userId }
  );
  const followMutation = trpc.social.follow.useMutation({
    onSuccess: () => window.location.reload(),
  });
  const unfollowMutation = trpc.social.unfollow.useMutation({
    onSuccess: () => window.location.reload(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Trophy className="w-12 h-12 text-zinc-600 mx-auto" />
          <p className="text-muted-foreground font-mono">Organizador no encontrado</p>
          <Link href="/tournaments">
            <span className="text-red-400 hover:text-red-300 text-sm font-mono cursor-pointer">← Ver torneos</span>
          </Link>
        </div>
      </div>
    );
  }

  const { user, followerCount, upcoming, past } = data;
  const roleInfo = ROLE_LABELS[user.role] ?? { label: user.role, color: "text-zinc-400" };
  const isOwnProfile = me?.id === userId;
  const isFollowing = isFollowingData?.isFollowing ?? false;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="relative border-b border-border"
        style={{ background: "linear-gradient(180deg, rgba(220,38,38,0.08) 0%, transparent 100%)" }}
      >
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-red-500/40 bg-zinc-800">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.nickname ?? user.name ?? ""} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-zinc-500" />
                  </div>
                )}
              </div>
              {/* Role badge on avatar */}
              <div className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-xs font-orbitron font-bold border bg-background ${
                user.role === "to" ? "border-purple-500/50 text-purple-300" :
                user.role === "cdc" ? "border-blue-500/50 text-blue-300" :
                user.role === "partner" ? "border-green-500/50 text-green-300" :
                "border-zinc-500/50 text-zinc-300"
              }`}>
                {user.role === "to" ? "TO" : user.role === "cdc" ? "CDC" : user.role === "partner" ? "PARTNER" : user.role.toUpperCase()}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="font-orbitron font-bold text-2xl text-white truncate">
                {user.orgName ?? user.nickname ?? user.name ?? "Organizador"}
              </h1>
              {user.orgName && (user.nickname ?? user.name) && (
                <p className="text-muted-foreground text-sm mt-0.5">
                  @{user.nickname ?? user.name}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className={`text-xs font-mono ${roleInfo.color}`}>{roleInfo.label}</span>
                {user.country && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" /> {user.country}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" /> {followerCount} seguidores
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Trophy className="w-3 h-3" /> {upcoming.length + past.length} torneos
                </span>
              </div>
              {user.orgDescription && (
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  {user.orgDescription}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Social links */}
              {user.socialTwitch && (
                <a href={`https://twitch.tv/${user.socialTwitch}`} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-lg border border-border hover:border-purple-500/50 text-muted-foreground hover:text-purple-400 transition-colors">
                  <Twitch className="w-4 h-4" />
                </a>
              )}
              {user.socialTwitter && (
                <a href={`https://x.com/${user.socialTwitter}`} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-lg border border-border hover:border-blue-500/50 text-muted-foreground hover:text-blue-400 transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {user.socialDiscord && (
                <a href="#" title={`Discord: ${user.socialDiscord}`}
                  className="p-2 rounded-lg border border-border hover:border-indigo-500/50 text-muted-foreground hover:text-indigo-400 transition-colors">
                  <MessageSquare className="w-4 h-4" />
                </a>
              )}
              {/* Follow button */}
              {me && !isOwnProfile && (
                <button
                  onClick={() => isFollowing
                    ? unfollowMutation.mutate({ targetUserId: userId })
                    : followMutation.mutate({ targetUserId: userId })
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-mono text-sm font-bold transition-all ${
                    isFollowing
                      ? "border-zinc-600 text-muted-foreground hover:border-red-500/50 hover:text-red-400"
                      : "border-red-500/50 bg-red-600/10 text-red-400 hover:bg-red-600/20"
                  }`}
                >
                  {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {isFollowing ? "Siguiendo" : "Seguir"}
                </button>
              )}
              {isOwnProfile && (
                <Link href="/settings">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-white hover:border-zinc-500 font-mono text-sm transition-colors">
                    Editar perfil
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Upcoming tournaments */}
        <section>
          <h2 className="font-orbitron text-sm tracking-widest text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-red-400" />
            TORNEOS PRÓXIMOS
            <span className="ml-auto text-xs text-muted-foreground font-mono">{upcoming.length} torneos</span>
          </h2>
          <div className="rounded-xl border border-border overflow-hidden" style={{ background: "#13161d" }}>
            <TournamentTable
              tournaments={upcoming}
              emptyMsg="No hay torneos próximos"
            />
          </div>
        </section>

        {/* Past tournaments */}
        <section>
          <h2 className="font-orbitron text-sm tracking-widest text-white mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-zinc-500" />
            TORNEOS PASADOS
            <span className="ml-auto text-xs text-muted-foreground font-mono">{past.length} torneos</span>
          </h2>
          <div className="rounded-xl border border-border overflow-hidden" style={{ background: "#13161d" }}>
            <TournamentTable
              tournaments={past}
              emptyMsg="No hay torneos finalizados"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
