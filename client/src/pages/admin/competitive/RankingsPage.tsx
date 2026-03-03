import { trpc } from "@/lib/trpc";
import { BarChart2, Trophy, Star } from "lucide-react";
import { PageHeader } from "../components/AdminUI";
import { Link } from "wouter";

export function RankingsPage() {
  const { data: teams } = trpc.admin.listTeams.useQuery();

  const sorted = [...(teams ?? [])].sort((a: any, b: any) => {
    const scoreA = (a.wins ?? 0) * 3 - (a.losses ?? 0);
    const scoreB = (b.wins ?? 0) * 3 - (b.losses ?? 0);
    return scoreB - scoreA;
  });

  return (
    <div className="space-y-6 w-full">
      <PageHeader icon={BarChart2} title="RANKINGS" subtitle="Clasificación de equipos por rendimiento en torneos" />
      <div className="space-y-2">
        {sorted.map((team: any, i: number) => (
          <div key={team.id} className="bg-zinc-900/60 border border-white/8 rounded-xl p-4 flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-orbitron font-bold text-sm flex-shrink-0 ${
              i === 0 ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
              i === 1 ? "bg-zinc-400/20 text-zinc-300 border border-zinc-400/30" :
              i === 2 ? "bg-orange-700/20 text-orange-400 border border-orange-700/30" :
              "bg-zinc-800 text-zinc-500"
            }`}>
              {i + 1}
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {team.logo ? <img src={team.logo} alt="" className="w-full h-full object-cover" /> : <Trophy className="w-5 h-5 text-zinc-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-rajdhani font-semibold truncate">{team.name}</p>
                {team.tag && <span className="text-xs font-mono text-zinc-500">[{team.tag}]</span>}
              </div>
              <p className="text-zinc-500 text-xs">{team.game ?? "Multi-juego"} · {team.tournamentsPlayed ?? 0} torneos</p>
            </div>
            <div className="flex items-center gap-4 text-sm font-orbitron">
              <div className="text-center">
                <p className="text-green-400 font-bold">{team.wins ?? 0}</p>
                <p className="text-zinc-600 text-xs">V</p>
              </div>
              <div className="text-center">
                <p className="text-red-400 font-bold">{team.losses ?? 0}</p>
                <p className="text-zinc-600 text-xs">D</p>
              </div>
              <div className="text-center">
                <p className="text-yellow-400 font-bold">{(team.wins ?? 0) * 3 - (team.losses ?? 0)}</p>
                <p className="text-zinc-600 text-xs">PTS</p>
              </div>
            </div>
            <Link href={`/teams/${team.id}`}>
              <button className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-rajdhani">Ver →</button>
            </Link>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="text-center py-12 text-zinc-600">
            <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-orbitron text-sm">Sin datos de ranking</p>
          </div>
        )}
      </div>
    </div>
  );
}
