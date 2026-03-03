import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Shield, CheckCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { PageHeader, EmptyState } from "../components/AdminUI";

export function TeamsPage() {
  const { data: teams, refetch } = trpc.admin.listTeams.useQuery();
  const verifyTeam = trpc.admin.verifyTeam.useMutation({
    onSuccess: () => { toast.success("Estado actualizado"); refetch(); },
    onError: e => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader icon={Shield} title="EQUIPOS" subtitle="Verifica y administra los equipos registrados" />
      {(!teams || teams.length === 0) ? (
        <EmptyState icon={Shield} title="Sin equipos registrados" />
      ) : (
        <div className="space-y-2">
          {teams.map((team: any) => (
            <div key={team.id} className="bg-zinc-900/60 border border-white/8 rounded-xl p-4 flex items-center gap-4 flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {team.logo ? <img src={team.logo} alt="" className="w-full h-full object-cover" /> : <Shield className="w-5 h-5 text-zinc-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-rajdhani font-semibold truncate">{team.name}</p>
                  {team.tag && <span className="text-xs font-mono text-zinc-500">[{team.tag}]</span>}
                  {team.isVerified && <CheckCircle className="w-3.5 h-3.5 text-blue-400" />}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-zinc-500 text-xs">{team.game ?? "Multi-juego"}</span>
                  <span className="text-yellow-400 text-xs font-orbitron">{team.wins}V / {team.losses}D</span>
                  <span className="text-zinc-500 text-xs">{team.tournamentsPlayed ?? 0} torneos</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/teams/${team.id}`}>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-white/10 text-zinc-400">
                    <Eye className="w-3 h-3 mr-1" /> Ver
                  </Button>
                </Link>
                <Button size="sm" onClick={() => verifyTeam.mutate({ teamId: team.id, verified: !team.isVerified })} disabled={verifyTeam.isPending}
                  className={`h-7 text-xs font-orbitron border ${team.isVerified ? "bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border-blue-700/40" : "bg-green-600/20 hover:bg-green-600/40 text-green-400 border-green-700/40"}`}>
                  {team.isVerified ? "QUITAR VERIFICACIÓN" : "VERIFICAR"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
