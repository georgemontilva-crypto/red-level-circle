import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Trophy, CheckCircle, XCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { PageHeader, EmptyState } from "../components/AdminUI";

export function TournamentsPage() {
  const { data: pending, refetch } = trpc.admin.pendingTournaments.useQuery();
  const approve = trpc.admin.approveTournament.useMutation({
    onSuccess: () => { toast.success("Torneo aprobado"); refetch(); },
    onError: e => toast.error(e.message),
  });
  const reject = trpc.admin.rejectTournament.useMutation({
    onSuccess: () => { toast.success("Torneo rechazado"); refetch(); },
    onError: e => toast.error(e.message),
  });

  return (
    <div className="space-y-6 w-full">
      <PageHeader icon={Trophy} title="TORNEOS" subtitle="Aprueba o rechaza torneos enviados por creadores" />
      {(pending?.length ?? 0) === 0 ? (
        <EmptyState icon={CheckCircle} title="Sin torneos pendientes" subtitle="Todos los torneos han sido revisados" />
      ) : (
        <div className="space-y-3">
          {pending?.map(t => (
            <div key={t.id} className="bg-zinc-900/60 border border-yellow-900/30 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-rajdhani font-bold text-lg">{t.name}</h3>
                  <p className="text-zinc-500 text-xs mt-1">
                    Creador: <span className="text-zinc-300">{t.organizerName ?? "Desconocido"}</span>
                    {t.organizerEmail && ` · ${t.organizerEmail}`}
                  </p>
                  <p className="text-zinc-500 text-xs">
                    Juego: <span className="text-red-400">{t.game}</span>
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link href={`/tournaments/${t.id}`}>
                    <Button size="sm" variant="outline" className="h-8 text-xs border-white/10 text-zinc-400 font-orbitron">
                      <Eye className="w-3 h-3 mr-1" /> VER
                    </Button>
                  </Link>
                  <Button size="sm" onClick={() => approve.mutate({ id: t.id })} disabled={approve.isPending}
                    className="h-8 text-xs bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-700/40 font-orbitron">
                    <CheckCircle className="w-3 h-3 mr-1" /> APROBAR
                  </Button>
                  <Button size="sm" onClick={() => reject.mutate({ id: t.id })} disabled={reject.isPending}
                    className="h-8 text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-700/40 font-orbitron">
                    <XCircle className="w-3 h-3 mr-1" /> RECHAZAR
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
