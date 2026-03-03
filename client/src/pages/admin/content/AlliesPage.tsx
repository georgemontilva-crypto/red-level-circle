import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { MapPin, CheckCircle, XCircle, Star, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "../components/AdminUI";

function AllyRow({ a, onUpdate, onDelete }: { a: any; onUpdate: (data: any) => void; onDelete: () => void }) {
  const [note, setNote] = useState(a.adminNote ?? "");
  return (
    <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/8">
      <div className="flex items-start gap-4">
        {a.logo ? (
          <img src={a.logo} alt={a.name} className="w-12 h-12 rounded-lg object-contain bg-zinc-800 border border-white/10 p-1 flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-red-500" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white">{a.name}</span>
            {a.isFeatured && <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-mono">DESTACADO</span>}
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono border ${
              a.status === "approved" ? "bg-green-500/20 text-green-400 border-green-500/30" :
              a.status === "rejected" ? "bg-red-500/20 text-red-400 border-red-500/30" :
              "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
            }`}>
              {a.status === "approved" ? "APROBADO" : a.status === "rejected" ? "RECHAZADO" : "PENDIENTE"}
            </span>
          </div>
          {(a.city || a.country) && (
            <p className="text-zinc-500 text-xs mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {[a.city, a.country].filter(Boolean).join(", ")}
            </p>
          )}
          {a.email && <p className="text-zinc-500 text-xs mt-0.5">{a.email}</p>}
          {a.description && <p className="text-zinc-500 text-xs mt-1 line-clamp-2">{a.description}</p>}
          {a.website && <a href={a.website} target="_blank" rel="noopener noreferrer" className="text-red-400 text-xs mt-0.5 hover:underline block truncate">{a.website}</a>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 items-center">
        {a.status !== "approved" && (
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs"
            onClick={() => onUpdate({ id: a.id, status: "approved" })}>
            <CheckCircle className="w-3 h-3 mr-1" /> Aprobar
          </Button>
        )}
        {a.status !== "rejected" && (
          <Button size="sm" variant="destructive" className="h-7 text-xs"
            onClick={() => onUpdate({ id: a.id, status: "rejected", adminNote: note })}>
            <XCircle className="w-3 h-3 mr-1" /> Rechazar
          </Button>
        )}
        <Button size="sm" variant="outline" className="h-7 text-xs border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
          onClick={() => onUpdate({ id: a.id, isFeatured: !a.isFeatured })}>
          <Star className="w-3 h-3 mr-1" /> {a.isFeatured ? "Quitar destacado" : "Destacar"}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs text-red-400 hover:text-red-300"
          onClick={() => { if (window.confirm("¿Eliminar este aliado?")) onDelete(); }}>
          <Trash2 className="w-3 h-3 mr-1" /> Eliminar
        </Button>
        <input
          className="flex-1 min-w-[120px] text-xs bg-zinc-800 border border-white/10 rounded px-2 py-1 text-white placeholder:text-zinc-500"
          placeholder="Nota admin..."
          value={note}
          onChange={e => setNote(e.target.value)}
          onBlur={() => { onUpdate({ id: a.id, adminNote: note }); }}
        />
      </div>
    </div>
  );
}

export function AlliesPage() {
  const { data: allies, refetch } = trpc.allies.adminList.useQuery();
  const updateAlly = trpc.allies.update.useMutation({
    onSuccess: () => { toast.success("Aliado actualizado"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteAlly = trpc.allies.delete.useMutation({
    onSuccess: () => { toast.success("Aliado eliminado"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const byStatus = {
    pending: (allies ?? []).filter((a: any) => a.status === "pending"),
    approved: (allies ?? []).filter((a: any) => a.status === "approved"),
    rejected: (allies ?? []).filter((a: any) => a.status === "rejected"),
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader icon={MapPin} title="ALIADOS" subtitle="Gestiona el directorio de tiendas y sponsors" />

      {byStatus.pending.length > 0 && (
        <div>
          <h3 className="font-orbitron text-sm text-yellow-400 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Pendientes ({byStatus.pending.length})
          </h3>
          <div className="space-y-3">
            {byStatus.pending.map((a: any) => (
              <AllyRow key={a.id} a={a}
                onUpdate={data => updateAlly.mutate(data)}
                onDelete={() => deleteAlly.mutate({ id: a.id })}
              />
            ))}
          </div>
        </div>
      )}
      {byStatus.approved.length > 0 && (
        <div>
          <h3 className="font-orbitron text-sm text-green-400 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Aprobados ({byStatus.approved.length})
          </h3>
          <div className="space-y-3">
            {byStatus.approved.map((a: any) => (
              <AllyRow key={a.id} a={a}
                onUpdate={data => updateAlly.mutate(data)}
                onDelete={() => deleteAlly.mutate({ id: a.id })}
              />
            ))}
          </div>
        </div>
      )}
      {byStatus.rejected.length > 0 && (
        <div>
          <h3 className="font-orbitron text-sm text-red-400 mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4" /> Rechazados ({byStatus.rejected.length})
          </h3>
          <div className="space-y-3">
            {byStatus.rejected.map((a: any) => (
              <AllyRow key={a.id} a={a}
                onUpdate={data => updateAlly.mutate(data)}
                onDelete={() => deleteAlly.mutate({ id: a.id })}
              />
            ))}
          </div>
        </div>
      )}
      {(allies?.length ?? 0) === 0 && (
        <EmptyState icon={MapPin} title="No hay solicitudes de aliados aún" />
      )}
    </div>
  );
}
