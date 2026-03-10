import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import {
  Flag, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp,
  Globe, MessageSquare, Building2, User, Mail, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "../components/AdminUI";
import { UserAvatar } from "@/components/UserAvatar";

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  to: { label: "Organizador (TO)", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  cdc: { label: "Creador de Contenido", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  partner: { label: "Partner / Aliado", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
};

function RoleRequestRow({ req, onReview }: { req: any; onReview: (id: number, action: "approved" | "rejected", note?: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState<"approved" | "rejected" | null>(null);

  const roleInfo = ROLE_LABELS[req.requestedRole] ?? { label: req.requestedRole.toUpperCase(), color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" };
  const displayName = req.userNickname ?? req.userName ?? "Usuario desconocido";

  const handleAction = (action: "approved" | "rejected") => {
    if (confirming === action) {
      onReview(req.id, action, note || undefined);
      setConfirming(null);
    } else {
      setConfirming(action);
      setTimeout(() => setConfirming(null), 4000);
    }
  };

  return (
    <div className="bg-zinc-900/60 border border-white/8 rounded-xl overflow-hidden">
      {/* Compact row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
          <UserAvatar avatar={req.userAvatar} name={displayName} size={36} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">{displayName}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded border font-mono ${roleInfo.color}`}>
              {roleInfo.label}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded border font-mono ${
              req.status === "approved" ? "bg-green-500/20 text-green-400 border-green-500/30" :
              req.status === "rejected" ? "bg-red-500/20 text-red-400 border-red-500/30" :
              "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
            }`}>
              {req.status === "approved" ? "APROBADO" : req.status === "rejected" ? "RECHAZADO" : "PENDIENTE"}
            </span>
          </div>
          <p className="text-zinc-500 text-xs truncate mt-0.5">
            {req.orgName && <span className="mr-2">{req.orgName}</span>}
            {req.userEmail && <span className="text-zinc-600">{req.userEmail}</span>}
            <span className="ml-2 text-zinc-700">
              {new Date(req.createdAt).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {req.status === "pending" && (
            <>
              <button
                onClick={() => handleAction("approved")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  confirming === "approved"
                    ? "bg-green-600 text-white animate-pulse"
                    : "bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white"
                }`}
                title={confirming === "approved" ? "Confirmar aprobación" : "Aprobar"}
              >
                {confirming === "approved" ? "¿Confirmar?" : "Aprobar"}
              </button>
              <button
                onClick={() => handleAction("rejected")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  confirming === "rejected"
                    ? "bg-red-600 text-white animate-pulse"
                    : "bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white"
                }`}
                title={confirming === "rejected" ? "Confirmar rechazo" : "Rechazar"}
              >
                {confirming === "rejected" ? "¿Confirmar?" : "Rechazar"}
              </button>
            </>
          )}
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-700 hover:text-white transition-colors"
            title={expanded ? "Colapsar" : "Ver detalles"}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-white/8 px-4 py-4 bg-zinc-950/30 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User info */}
            <div className="space-y-2">
              <p className="text-xs font-orbitron text-zinc-500 tracking-widest">INFORMACIÓN DEL SOLICITANTE</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                  <span className="text-zinc-300">{displayName}</span>
                  {req.userRole && (
                    <span className="text-xs text-zinc-600 font-mono">({req.userRole})</span>
                  )}
                </div>
                {req.userEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                    <span className="text-zinc-400">{req.userEmail}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                  <span className="text-zinc-400">
                    Enviado el {new Date(req.createdAt).toLocaleDateString("es", {
                      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Organization info */}
            <div className="space-y-2">
              <p className="text-xs font-orbitron text-zinc-500 tracking-widest">ORGANIZACIÓN / PROYECTO</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                  <span className="text-zinc-300 font-semibold">{req.orgName}</span>
                </div>
                {req.discordContact && (
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                    <span className="text-zinc-400">{req.discordContact}</span>
                  </div>
                )}
                {req.websiteUrl && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                    <a href={req.websiteUrl} target="_blank" rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline truncate">
                      {req.websiteUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {req.orgDescription && (
            <div>
              <p className="text-xs font-orbitron text-zinc-500 tracking-widest mb-2">DESCRIPCIÓN</p>
              <p className="text-sm text-zinc-300 bg-zinc-900/60 rounded-lg p-3 border border-white/5 whitespace-pre-wrap">
                {req.orgDescription}
              </p>
            </div>
          )}

          {/* Experience */}
          {req.experience && (
            <div>
              <p className="text-xs font-orbitron text-zinc-500 tracking-widest mb-2">EXPERIENCIA / MOTIVACIÓN</p>
              <p className="text-sm text-zinc-300 bg-zinc-900/60 rounded-lg p-3 border border-white/5 whitespace-pre-wrap">
                {req.experience}
              </p>
            </div>
          )}

          {/* Review note (if reviewed) */}
          {req.reviewNote && (
            <div>
              <p className="text-xs font-orbitron text-zinc-500 tracking-widest mb-2">NOTA DE REVISIÓN</p>
              <p className="text-sm text-zinc-400 bg-zinc-900/60 rounded-lg p-3 border border-white/5 italic">
                {req.reviewNote}
              </p>
            </div>
          )}

          {/* Review actions with note */}
          {req.status === "pending" && (
            <div className="pt-2 border-t border-white/8">
              <p className="text-xs font-orbitron text-zinc-500 tracking-widest mb-3">ACCIÓN</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Nota para el usuario (opcional)..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="flex-1 bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 transition-colors placeholder:text-zinc-600"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                    onClick={() => onReview(req.id, "approved", note || undefined)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Aprobar solicitud
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-600/40 text-red-400 hover:bg-red-600/20 hover:border-red-500"
                    onClick={() => onReview(req.id, "rejected", note || undefined)}
                  >
                    <XCircle className="w-4 h-4 mr-1.5" />
                    Rechazar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type StatusFilter = "pending" | "approved" | "rejected" | "all";

export function RoleRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");

  const { data: requests, refetch, isLoading } = trpc.roleRequests.adminList.useQuery({ status: statusFilter });

  const review = trpc.roleRequests.review.useMutation({
    onSuccess: () => {
      toast.success("Solicitud actualizada correctamente");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleReview = (requestId: number, action: "approved" | "rejected", reviewNote?: string) => {
    review.mutate({ requestId, action, reviewNote });
  };

  const counts = {
    pending: requests?.filter(r => r.status === "pending").length ?? 0,
    approved: requests?.filter(r => r.status === "approved").length ?? 0,
    rejected: requests?.filter(r => r.status === "rejected").length ?? 0,
  };

  const tabs: { key: StatusFilter; label: string; color: string }[] = [
    { key: "pending", label: "Pendientes", color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" },
    { key: "approved", label: "Aprobadas", color: "text-green-400 border-green-500/30 bg-green-500/10" },
    { key: "rejected", label: "Rechazadas", color: "text-red-400 border-red-500/30 bg-red-500/10" },
    { key: "all", label: "Todas", color: "text-zinc-400 border-zinc-500/30 bg-zinc-500/10" },
  ];

  return (
    <div className="space-y-8 w-full">
      <PageHeader
        icon={Flag}
        title="SOLICITUDES DE ROL"
        subtitle="Gestiona las solicitudes de Organizador (TO), Creador de Contenido y Partner"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
          <p className="font-orbitron font-black text-2xl text-yellow-400">{counts.pending}</p>
          <p className="text-xs text-zinc-500 mt-1 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" /> Pendientes
          </p>
        </div>
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
          <p className="font-orbitron font-black text-2xl text-green-400">{counts.approved}</p>
          <p className="text-xs text-zinc-500 mt-1 flex items-center justify-center gap-1">
            <CheckCircle className="w-3 h-3" /> Aprobadas
          </p>
        </div>
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
          <p className="font-orbitron font-black text-2xl text-red-400">{counts.rejected}</p>
          <p className="text-xs text-zinc-500 mt-1 flex items-center justify-center gap-1">
            <XCircle className="w-3 h-3" /> Rechazadas
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-xs font-orbitron font-semibold tracking-wider border transition-all ${
              statusFilter === tab.key
                ? tab.color
                : "text-zinc-500 border-white/8 bg-zinc-900/40 hover:border-white/20 hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !requests || requests.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="Sin solicitudes"
          subtitle={
            statusFilter === "pending"
              ? "No hay solicitudes de rol pendientes de revisión"
              : `No hay solicitudes con estado "${statusFilter}"`
          }
        />
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <RoleRequestRow
              key={req.id}
              req={req}
              onReview={handleReview}
            />
          ))}
        </div>
      )}
    </div>
  );
}
