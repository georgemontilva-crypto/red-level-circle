import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Users, Trophy, Swords, Star, Shield, ChevronLeft, Crown, UserPlus } from "lucide-react";
import { Link, useParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";


const ROLE_LABELS: Record<string, string> = {
  captain: "CAPITÁN",
  player: "JUGADOR",
  substitute: "SUPLENTE",
  coach: "COACH",
};

const ROLE_COLORS: Record<string, string> = {
  captain: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  player: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  substitute: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30",
  coach: "text-purple-400 bg-purple-500/10 border-purple-500/30",
};

export default function TeamProfile() {
  const { id } = useParams<{ id: string }>();
  const teamId = parseInt(id ?? "0");
  const { isAuthenticated, user } = useAuth();

  const { data: team, isLoading, refetch } = trpc.teams.byId.useQuery(
    { id: teamId },
    { enabled: !!teamId }
  );

  const joinTeam = trpc.teams.addMember.useMutation({
    onSuccess: () => { toast.success("¡Solicitud enviada!"); refetch(); },
    onError: (err: { message: string }) => toast.error("Error", { description: err.message }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="pt-24 max-w-4xl mx-auto px-4">
          <div className="h-48 bg-zinc-900/50 rounded-xl animate-pulse mb-6" />
          <div className="grid md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 bg-zinc-900/50 rounded-xl animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-orbitron text-2xl text-zinc-600 mb-4">EQUIPO NO ENCONTRADO</h2>
          <Link href="/ranking"><Button className="bg-red-600 hover:bg-red-700 font-orbitron text-xs">VER RANKING</Button></Link>
        </div>
      </div>
    );
  }

  const winRate = team.wins + team.losses > 0
    ? Math.round((team.wins / (team.wins + team.losses)) * 100)
    : 0;

  const isMember = team.members?.some((m: any) => m.userId === user?.id);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pt-24 pb-16 max-w-5xl mx-auto px-4">
        {/* Back */}
        <Link href="/ranking">
          <button className="flex items-center gap-1 text-zinc-500 hover:text-white text-xs font-mono mb-6 transition-colors">
            <ChevronLeft className="w-4 h-4" /> VOLVER AL RANKING
          </button>
        </Link>

        {/* Team header */}
        <div className="relative bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden mb-6">
          {/* Banner */}
          <div className="h-32 relative overflow-hidden">
            {team.banner ? (
              <img src={team.banner} alt={team.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-red-950/50 via-zinc-900 to-zinc-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-8 mb-4">
              {team.logo ? (
                <img src={team.logo} alt={team.name} className="w-20 h-20 rounded-xl object-cover border-2 border-zinc-800 relative z-10" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-red-500/20 border-2 border-zinc-800 flex items-center justify-center relative z-10">
                  <Shield className="w-10 h-10 text-red-400" />
                </div>
              )}
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="font-orbitron font-black text-2xl text-white">{team.name}</h1>
                  {team.tag && <span className="font-mono text-sm text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">[{team.tag}]</span>}
                  {team.isVerified && <span className="text-xs font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded">✓ VERIFICADO</span>}
                </div>
                <p className="text-zinc-400 font-rajdhani text-sm mt-1">{team.game ?? "Multi-juego"}</p>
              </div>
              {isAuthenticated && !isMember && (
                <Button
                  onClick={() => user && joinTeam.mutate({ teamId, userId: user.id })}
                  disabled={joinTeam.isPending}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 font-orbitron text-xs">
                  <UserPlus className="w-3 h-3 mr-1" /> UNIRSE
                </Button>
              )}
            </div>
            {team.description && <p className="text-zinc-400 font-rajdhani text-sm">{team.description}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "PUNTOS", value: team.points.toLocaleString(), icon: Star, color: "text-yellow-400" },
            { label: "VICTORIAS", value: team.wins, icon: Trophy, color: "text-green-400" },
            { label: "DERROTAS", value: team.losses, icon: Swords, color: "text-red-400" },
            { label: "WIN RATE", value: `${winRate}%`, icon: Shield, color: "text-blue-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-center">
              <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
              <p className={`font-orbitron font-black text-2xl ${stat.color}`}>{stat.value}</p>
              <p className="text-xs font-mono text-zinc-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Members */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-red-400" />
              <h2 className="font-orbitron font-bold text-sm text-white tracking-wider">JUGADORES</h2>
            </div>
            {team.members && team.members.length > 0 ? (
              <div className="space-y-3">
                {team.members.map((member: any) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                      {member.role === "captain" ? <Crown className="w-4 h-4 text-yellow-400" /> : <Users className="w-4 h-4 text-zinc-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-rajdhani font-bold text-sm text-white">{member.userName ?? `Usuario #${member.userId}`}</p>
                      {member.gameTag && <p className="text-xs text-zinc-600 font-mono">{member.gameTag}</p>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded border font-mono ${ROLE_COLORS[member.role] ?? "text-zinc-400 bg-zinc-800 border-zinc-700"}`}>
                      {ROLE_LABELS[member.role] ?? member.role.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-600 font-rajdhani text-sm text-center py-4">Sin miembros registrados</p>
            )}
          </div>

          {/* Achievements */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <h2 className="font-orbitron font-bold text-sm text-white tracking-wider">LOGROS</h2>
            </div>
            {team.achievements && team.achievements.length > 0 ? (
              <div className="space-y-3">
                {team.achievements.map((ach: any) => (
                  <div key={ach.id} className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg">
                    <Trophy className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-rajdhani font-bold text-sm text-white">{ach.title}</p>
                      {ach.description && <p className="text-xs text-zinc-500 mt-0.5">{ach.description}</p>}
                      <p className="text-xs text-zinc-600 font-mono mt-1">{new Date(ach.awardedAt).toLocaleDateString("es-ES")}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="w-10 h-10 mx-auto mb-2 text-zinc-700" />
                <p className="text-zinc-600 font-rajdhani text-sm">Sin logros aún</p>
              </div>
            )}
          </div>
        </div>


      </div>
    </div>
  );
}
