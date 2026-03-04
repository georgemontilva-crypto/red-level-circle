import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { BadgeCheck, CheckCircle, XCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "../components/AdminUI";
import { UserAvatar } from "@/components/UserAvatar";

export function VerificationsPage() {
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const { data: requests, refetch } = trpc.verification.list.useQuery({ status: filter });
  const review = trpc.verification.review.useMutation({
    onSuccess: () => { toast.success("Solicitud actualizada"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const [notes, setNotes] = useState<Record<number, string>>({});

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-600/40",
    approved: "bg-blue-500/20 text-blue-400 border-blue-600/40",
    rejected: "bg-red-500/20 text-red-400 border-red-600/40",
  };

  return (
    <div className="space-y-6 w-full">
      <PageHeader icon={BadgeCheck} title="VERIFICACIONES" subtitle="Aprueba o rechaza solicitudes de verificación de usuarios" />

      <div className="flex gap-2 flex-wrap">
        {(["pending", "approved", "rejected", "all"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-orbitron tracking-wider transition-all border ${filter === s ? "bg-red-600 text-white border-red-600" : "border-white/10 text-zinc-500 hover:border-zinc-500"}`}>
            {s === "pending" ? "PENDIENTES" : s === "approved" ? "APROBADOS" : s === "rejected" ? "RECHAZADOS" : "TODOS"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {!requests || requests.length === 0 ? (
          <div className="text-center py-12">
            <BadgeCheck className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 font-rajdhani">No hay solicitudes {filter !== "all" ? `con estado "${filter}"` : ""}</p>
          </div>
        ) : requests.map((req: any) => (
          <div key={req.id} className="bg-zinc-900/60 border border-white/8 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div style={{ overflow: "visible", display: "inline-flex", flexShrink: 0 }}>
                <UserAvatar
                  avatar={req.avatar}
                  name={req.nickname ?? req.userName}
                  activeFrameImage={req.activeFrameImage}
                  size={40}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-rajdhani font-semibold">{req.nickname ?? req.userName ?? "Usuario"}</p>
                  {req.userIsVerified && <BadgeCheck className="w-4 h-4 text-blue-400" />}
                </div>
                <p className="text-zinc-500 text-xs font-mono">
                  Solicitado: {new Date(req.requestedAt).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}
                  {req.reviewedAt && ` · Revisado: ${new Date(req.reviewedAt).toLocaleDateString("es", { day: "numeric", month: "short" })}`}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-orbitron border ${statusColors[req.status] ?? statusColors.pending}`}>
                {req.status === "pending" ? "PENDIENTE" : req.status === "approved" ? "APROBADO" : "RECHAZADO"}
              </span>
            </div>
            {req.reason && (
              <div className="bg-zinc-800/60 rounded-lg px-4 py-3 border border-white/5">
                <p className="text-xs text-zinc-500 font-mono mb-1">MOTIVO DEL USUARIO:</p>
                <p className="text-zinc-300 text-sm">{req.reason}</p>
              </div>
            )}
            {req.adminNote && (
              <div className="bg-red-900/20 rounded-lg px-4 py-3 border border-red-700/30">
                <p className="text-xs text-red-400 font-mono mb-1">NOTA DEL ADMIN:</p>
                <p className="text-zinc-300 text-sm">{req.adminNote}</p>
              </div>
            )}
            {req.status === "pending" && (
              <div className="space-y-2">
                <input value={notes[req.id] ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [req.id]: e.target.value }))}
                  placeholder="Nota opcional para el usuario..."
                  className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => review.mutate({ requestId: req.id, status: "approved", adminNote: notes[req.id] })} disabled={review.isPending}
                    className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-700/40 font-orbitron text-xs h-8">
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> VERIFICAR
                  </Button>
                  <Button size="sm" onClick={() => review.mutate({ requestId: req.id, status: "rejected", adminNote: notes[req.id] })} disabled={review.isPending}
                    className="bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-700/40 font-orbitron text-xs h-8">
                    <XCircle className="w-3.5 h-3.5 mr-1.5" /> RECHAZAR
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
