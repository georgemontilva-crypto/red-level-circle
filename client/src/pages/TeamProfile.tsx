import { trpc } from "@/lib/trpc";
import { Users, Trophy, Swords, Star, Shield, ChevronLeft, Crown, UserPlus, CheckCircle, Gamepad2, Globe, Calendar, Target, TrendingUp, Award, Twitter, MessageSquare } from "lucide-react";
import { Link, useParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  captain: "Capitán",
  player: "Jugador",
  substitute: "Suplente",
  coach: "Coach",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  completed: { label: "Completado", color: "text-green-400" },
  in_progress: { label: "En curso", color: "text-yellow-400" },
  registration_open: { label: "Inscripciones abiertas", color: "text-blue-400" },
  cancelled: { label: "Cancelado", color: "text-zinc-500" },
};

function StatCard({ icon, value, label, color = "text-red-400" }: {
  icon: React.ReactNode; value: number | string; label: string; color?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/50">
      <div className={`${color} mb-1`}>{icon}</div>
      <span className={`text-2xl font-black font-display ${color}`}>{value}</span>
      <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function TeamProfile() {
  const { id } = useParams<{ id: string }>();
  const teamId = parseInt(id ?? "0");
  const { isAuthenticated, user } = useAuth();

  // Use publicProfile for rich data including stats, members with avatars, tournament history
  const { data: team, isLoading, refetch } = trpc.teams.publicProfile.useQuery(
    { id: teamId },
    { enabled: !!teamId }
  );

  const joinTeam = trpc.teams.addMember.useMutation({
    onSuccess: () => { toast.success("¡Solicitud enviada!"); refetch(); },
    onError: (err: { message: string }) => toast.error("Error", { description: err.message }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
          <p className="font-mono text-zinc-500 text-sm">Cargando perfil del equipo...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500/30 mx-auto mb-4" />
          <p className="font-orbitron text-xl mb-2">Equipo no encontrado</p>
          <Link href="/ranking">
            <button className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-mono text-sm transition-colors">
              ← Ver Ranking
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const isCaptain = user?.id === team.captainId;
  const isMember = team.members?.some((m: any) => m.userId === user?.id);
  const wonTournaments = team.registrations.filter((r: any) => r.tournamentWinnerId === teamId && r.tournamentStatus === "completed");
  const lostTournaments = team.registrations.filter((r: any) => r.tournamentWinnerId !== teamId && r.tournamentStatus === "completed");
  const activeTournaments = team.registrations.filter((r: any) => r.tournamentStatus === "in_progress" || r.tournamentStatus === "registration_open");

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Back button */}
      <div className="absolute top-4 left-4 z-20">
        <button onClick={() => window.history.back()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur border border-zinc-700/50 text-zinc-400 hover:text-white text-xs font-mono transition-colors">
          <ChevronLeft size={14} /> Volver
        </button>
      </div>

      {/* Captain actions */}
      {isCaptain && (
        <div className="absolute top-4 right-4 z-20">
          <Link href="/dashboard/teams">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur border border-red-600/40 text-red-400 hover:text-red-300 text-xs font-mono transition-colors">
              <Shield size={14} /> Gestionar
            </button>
          </Link>
        </div>
      )}

      {/* Banner */}
      <div className="relative w-full h-52 sm:h-64 overflow-hidden">
        {team.banner ? (
          <img src={team.banner} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-red-950/20 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      </div>

      {/* Logo + Name header */}
      <div className="relative px-4 sm:px-6 -mt-12 pb-4">
        <div className="flex items-end gap-4">
          {/* Logo */}
          <div className="relative shrink-0">
            {team.logo ? (
              <img
                src={team.logo}
                alt={team.name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-black shadow-2xl"
                style={{ boxShadow: "0 0 30px oklch(0.55 0.22 25 / 0.4)" }}
              />
            ) : (
              <div
                className="w-24 h-24 rounded-2xl border-4 border-black flex items-center justify-center text-4xl font-black"
                style={{ background: "oklch(0.55 0.22 25 / 0.2)", boxShadow: "0 0 30px oklch(0.55 0.22 25 / 0.3)", color: "oklch(0.65 0.22 25)" }}
              >
                {team.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name & badges */}
          <div className="pb-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-orbitron font-black text-2xl sm:text-3xl text-white">{team.name}</h1>
              {team.tag && (
                <span className="px-2 py-0.5 rounded text-sm font-mono bg-red-950/50 text-red-400 border border-red-800/40">
                  [{team.tag}]
                </span>
              )}
              {team.isVerified && <CheckCircle size={20} className="text-blue-400 shrink-0" />}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {team.game && (
                <div className="flex items-center gap-1">
                  <Gamepad2 size={13} className="text-zinc-500" />
                  <span className="text-sm text-zinc-400">{team.game}</span>
                </div>
              )}
              {team.country && (
                <div className="flex items-center gap-1">
                  <Globe size={13} className="text-zinc-500" />
                  <span className="text-sm text-zinc-400">{team.country}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar size={13} className="text-zinc-500" />
                <span className="text-sm text-zinc-500">
                  Desde {new Date(team.createdAt).toLocaleDateString("es", { month: "long", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          {/* Join button */}
          {isAuthenticated && !isMember && !isCaptain && (
            <div className="pb-2 shrink-0">
              <button
                onClick={() => user && joinTeam.mutate({ teamId, userId: user.id })}
                disabled={joinTeam.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-mono text-sm transition-all"
                style={{ background: "oklch(0.55 0.22 25)", color: "white", boxShadow: "0 0 12px oklch(0.55 0.22 25 / 0.4)" }}
              >
                <UserPlus size={14} /> Unirse
              </button>
            </div>
          )}
        </div>

        {team.description && (
          <p className="mt-4 text-zinc-400 text-sm leading-relaxed max-w-2xl">{team.description}</p>
        )}

        {/* Social links */}
        {(team.socialDiscord || team.socialTwitch || team.socialTwitter) && (
          <div className="flex items-center gap-3 mt-3">
            {team.socialDiscord && (
              <a href={`https://discord.gg/${team.socialDiscord}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-indigo-400 transition-colors font-mono">
                <MessageSquare size={13} /> Discord
              </a>
            )}
            {team.socialTwitter && (
              <a href={`https://twitter.com/${team.socialTwitter}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-sky-400 transition-colors font-mono">
                <Twitter size={13} /> Twitter
              </a>
            )}
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="px-4 sm:px-6 pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<Trophy size={20} />} value={team.stats.tournamentsWon} label="Victorias" color="text-yellow-400" />
          <StatCard icon={<Swords size={20} />} value={team.stats.tournamentsPlayed} label="Torneos" color="text-red-400" />
          <StatCard icon={<Target size={20} />} value={team.stats.tournamentsLost} label="Derrotas" color="text-zinc-400" />
          <StatCard icon={<Users size={20} />} value={team.members.length} label="Jugadores" color="text-blue-400" />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 pb-12 space-y-8 max-w-4xl mx-auto">

        {/* Achievements */}
        {team.achievements.length > 0 && (
          <section>
            <h2 className="font-orbitron text-sm tracking-widest text-red-400 mb-4 flex items-center gap-2">
              <Award size={16} /> LOGROS
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {team.achievements.map((ach: any) => (
                <div key={ach.id} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/60 border border-yellow-500/20">
                  <Trophy size={18} className="text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-white">{ach.title}</p>
                    {ach.description && <p className="text-xs text-zinc-500 mt-0.5">{ach.description}</p>}
                    <p className="text-xs text-zinc-600 mt-1">{new Date(ach.awardedAt).toLocaleDateString("es")}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Players */}
        <section>
          <h2 className="font-orbitron text-sm tracking-widest text-red-400 mb-4 flex items-center gap-2">
            <Users size={16} /> JUGADORES ({team.members.length})
          </h2>
          {team.members.length === 0 ? (
            <div className="text-center py-10 rounded-xl bg-zinc-900/40 border border-zinc-800/50">
              <Users size={32} className="mx-auto mb-3 text-zinc-700" />
              <p className="text-zinc-500 font-mono text-sm">Sin jugadores registrados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {team.members.map((member: any) => (
                <Link key={member.id} href={`/profile/${member.userId}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/50 hover:border-red-500/30 transition-colors cursor-pointer group">
                    {/* Avatar */}
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.nickname || member.userName || "?"} className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700 group-hover:border-red-600/40 transition-colors shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center shrink-0">
                        <span className="text-lg font-black text-red-500">
                          {(member.nickname || member.userName || "?").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white truncate">
                          {member.nickname || member.userName || "Jugador"}
                        </span>
                        {member.role === "captain" && <Crown size={12} className="text-yellow-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-zinc-500 font-mono">{ROLE_LABELS[member.role] ?? member.role}</span>
                        {member.country && <span className="text-xs text-zinc-600">· {member.country}</span>}
                      </div>
                      {/* Mini stats */}
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1">
                          <TrendingUp size={10} className="text-green-500" />
                          <span className="text-xs text-green-400">{member.stats?.tournamentsWon ?? 0}V</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Swords size={10} className="text-zinc-500" />
                          <span className="text-xs text-zinc-500">{member.stats?.tournamentsPlayed ?? 0} torneos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Tournament History */}
        <section>
          <h2 className="font-orbitron text-sm tracking-widest text-red-400 mb-4 flex items-center gap-2">
            <Trophy size={16} /> HISTORIAL DE TORNEOS
          </h2>

          {team.registrations.length === 0 ? (
            <div className="text-center py-12 rounded-xl bg-zinc-900/40 border border-zinc-800/50">
              <Trophy size={32} className="mx-auto mb-3 text-zinc-700" />
              <p className="text-zinc-500 font-mono text-sm">Sin torneos registrados aún</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Active */}
              {activeTournaments.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-mono text-yellow-400 mb-2 tracking-wider">EN CURSO</p>
                  {activeTournaments.map((reg: any) => (
                    <Link key={reg.id} href={`/tournament/${reg.tournamentId}`}>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-950/20 border border-yellow-500/20 hover:border-yellow-500/40 transition-colors cursor-pointer mb-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{reg.tournamentName}</p>
                          <p className="text-xs text-zinc-500">{reg.tournamentGame}</p>
                        </div>
                        <span className={`text-xs font-mono ${STATUS_LABELS[reg.tournamentStatus ?? ""]?.color ?? "text-zinc-500"}`}>
                          {STATUS_LABELS[reg.tournamentStatus ?? ""]?.label ?? reg.tournamentStatus}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Won */}
              {wonTournaments.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-mono text-yellow-400 mb-2 tracking-wider">VICTORIAS</p>
                  {wonTournaments.map((reg: any) => (
                    <Link key={reg.id} href={`/tournament/${reg.tournamentId}`}>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-950/10 border border-yellow-500/20 hover:border-yellow-500/40 transition-colors cursor-pointer mb-2">
                        <Trophy size={16} className="text-yellow-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{reg.tournamentName}</p>
                          <p className="text-xs text-zinc-500">{reg.tournamentGame}</p>
                        </div>
                        <span className="text-xs font-mono text-yellow-400">CAMPEÓN</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Participated */}
              {lostTournaments.length > 0 && (
                <div>
                  <p className="text-xs font-mono text-zinc-500 mb-2 tracking-wider">PARTICIPACIONES</p>
                  {lostTournaments.map((reg: any) => (
                    <Link key={reg.id} href={`/tournament/${reg.tournamentId}`}>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700 transition-colors cursor-pointer mb-2">
                        <Swords size={16} className="text-zinc-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-300 truncate">{reg.tournamentName}</p>
                          <p className="text-xs text-zinc-600">{reg.tournamentGame}</p>
                        </div>
                        <span className="text-xs font-mono text-zinc-600">PARTICIPÓ</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
