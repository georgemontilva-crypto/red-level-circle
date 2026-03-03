import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { Crown, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "../components/AdminUI";
import { UserAvatar } from "@/components/UserAvatar";

function CreatorRow({ c, onReview }: { c: any; onReview: (id: number, status: string, note?: string) => void }) {
  const [note, setNote] = useState(c.adminNote ?? "");
  return (
    <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/8">
      <div className="flex items-start gap-4">
        {c.avatar ? (
          <UserAvatar avatar={c.avatar} name={c.name} size={48} />
        ) : (
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
            <span className="text-lg font-black text-red-500">{(c.nickname ?? c.userName ?? "?").charAt(0).toUpperCase()}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white">{c.nickname ?? c.userName}</span>
            {c.category && <span className="text-xs font-mono text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{c.category}</span>}
            {c.subscribers > 0 && <span className="text-xs text-zinc-500">{c.subscribers.toLocaleString()} seguidores</span>}
          </div>
          {c.bio && <p className="text-zinc-500 text-sm mt-1 line-clamp-2">{c.bio}</p>}
          <p className="text-zinc-700 text-xs mt-1">Aplicó: {new Date(c.appliedAt).toLocaleDateString("es")}</p>
        </div>
        {c.status === "pending" && (
          <div className="flex flex-col gap-2 shrink-0">
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
              onClick={() => onReview(c.id, "approved")}>
              <CheckCircle className="w-3 h-3 mr-1" /> Aprobar
            </Button>
            <Button size="sm" variant="outline" className="border-red-600/40 text-red-400 hover:bg-red-600/20 text-xs h-8"
              onClick={() => onReview(c.id, "rejected", note)}>
              <XCircle className="w-3 h-3 mr-1" /> Rechazar
            </Button>
            <input type="text" placeholder="Motivo (opcional)" value={note} onChange={e => setNote(e.target.value)}
              className="text-xs bg-zinc-800 border border-white/10 rounded-lg px-2 py-1 text-white placeholder:text-zinc-600 w-32 focus:outline-none" />
          </div>
        )}
        {c.status === "approved" && (
          <div className="flex flex-col gap-1 items-end shrink-0">
            <span className="flex items-center gap-1 text-xs text-green-400 font-mono"><CheckCircle className="w-3 h-3" /> Aprobado</span>
            <Button size="sm" variant="outline" className="border-red-600/40 text-red-400 hover:bg-red-600/20 text-xs h-7"
              onClick={() => onReview(c.id, "rejected")}>Revocar</Button>
          </div>
        )}
        {c.status === "rejected" && (
          <div className="flex flex-col gap-1 items-end shrink-0">
            <span className="flex items-center gap-1 text-xs text-red-400 font-mono"><XCircle className="w-3 h-3" /> Rechazado</span>
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-7"
              onClick={() => onReview(c.id, "approved")}>Aprobar</Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function CreatorsPage() {
  const { data: pending, refetch } = trpc.creators.listPending.useQuery();
  const review = trpc.creators.review.useMutation({
    onSuccess: () => { toast.success("Solicitud actualizada"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const byStatus = {
    pending: pending?.filter(c => c.status === "pending") ?? [],
    approved: pending?.filter(c => c.status === "approved") ?? [],
    rejected: pending?.filter(c => c.status === "rejected") ?? [],
  };

  const handleReview = (id: number, status: string, adminNote?: string) => {
    review.mutate({ id, status: status as any, adminNote });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader icon={Crown} title="CREADORES" subtitle="Gestiona las solicitudes de creadores oficiales" />

      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
          <p className="font-orbitron font-black text-2xl text-yellow-400">{byStatus.pending.length}</p>
          <p className="text-xs text-zinc-500 mt-1 flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> En revisión</p>
        </div>
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
          <p className="font-orbitron font-black text-2xl text-green-400">{byStatus.approved.length}</p>
          <p className="text-xs text-zinc-500 mt-1 flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> Aprobados</p>
        </div>
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
          <p className="font-orbitron font-black text-2xl text-red-400">{byStatus.rejected.length}</p>
          <p className="text-xs text-zinc-500 mt-1 flex items-center justify-center gap-1"><XCircle className="w-3 h-3" /> Rechazados</p>
        </div>
      </div>

      {byStatus.pending.length > 0 && (
        <div>
          <h3 className="font-orbitron text-sm text-yellow-400 mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> PENDIENTES ({byStatus.pending.length})</h3>
          <div className="space-y-3">{byStatus.pending.map(c => <CreatorRow key={c.id} c={c} onReview={handleReview} />)}</div>
        </div>
      )}
      {byStatus.approved.length > 0 && (
        <div>
          <h3 className="font-orbitron text-sm text-green-400 mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> APROBADOS ({byStatus.approved.length})</h3>
          <div className="space-y-3">{byStatus.approved.map(c => <CreatorRow key={c.id} c={c} onReview={handleReview} />)}</div>
        </div>
      )}
      {byStatus.rejected.length > 0 && (
        <div>
          <h3 className="font-orbitron text-sm text-red-400 mb-3 flex items-center gap-2"><XCircle className="w-4 h-4" /> RECHAZADOS ({byStatus.rejected.length})</h3>
          <div className="space-y-3">{byStatus.rejected.map(c => <CreatorRow key={c.id} c={c} onReview={handleReview} />)}</div>
        </div>
      )}
      {(pending?.length ?? 0) === 0 && (
        <EmptyState icon={Crown} title="No hay solicitudes de creadores aún" />
      )}
    </div>
  );
}
