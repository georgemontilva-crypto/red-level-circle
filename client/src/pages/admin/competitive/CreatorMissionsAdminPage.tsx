import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Clapperboard, Plus, ChevronLeft, ExternalLink, Check, X,
  Users, Clock, Award, Link2, Eye, Trash2, Edit2, AlertCircle
} from "lucide-react";
import { PageHeader } from "../components/AdminUI";

// ─── Types ────────────────────────────────────────────────────────────────────
type Mission = {
  id: number; title: string; description: string; requirements: string | null;
  resourcesUrl: string | null; platforms: string | null; rewardRlc: number;
  bonusRlc: number; startDate: Date | null; endDate: Date | null;
  isActive: boolean; createdAt: Date;
  acceptCount: number; pendingCount: number; approvedCount: number;
};

// ─── Create/Edit Form ─────────────────────────────────────────────────────────
function MissionForm({ initial, onSave, onCancel }: {
  initial?: Partial<Mission>;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    requirements: initial?.requirements ?? "",
    resourcesUrl: initial?.resourcesUrl ?? "",
    platforms: initial?.platforms ?? "",
    rewardRlc: initial?.rewardRlc ?? 100,
    bonusRlc: initial?.bonusRlc ?? 50,
    startDate: initial?.startDate ? new Date(initial.startDate).toISOString().slice(0, 16) : "",
    endDate: initial?.endDate ? new Date(initial.endDate).toISOString().slice(0, 16) : "",
    isActive: initial?.isActive ?? true,
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 space-y-5">
      <h3 className="font-orbitron text-white font-bold text-lg">
        {initial?.id ? "Editar misión" : "Nueva misión para creadores"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-1 block">Título *</label>
          <input value={form.title} onChange={e => set("title", e.target.value)}
            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
            placeholder="Ej: Crea un Reel sobre el torneo de Valorant" />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-1 block">Descripción *</label>
          <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4}
            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 resize-none"
            placeholder="Describe la misión en detalle..." />
        </div>

        {/* Requirements */}
        <div className="md:col-span-2">
          <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-1 block">Requisitos específicos</label>
          <textarea value={form.requirements} onChange={e => set("requirements", e.target.value)} rows={3}
            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 resize-none"
            placeholder="Ej: Mencionar @RedLevelCompetitivo, usar #RLC #Gaming, duración mínima 30s..." />
        </div>

        {/* Resources URL */}
        <div className="md:col-span-2">
          <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-1 block">
            Link de recursos (Drive, Dropbox, etc.)
          </label>
          <input value={form.resourcesUrl} onChange={e => set("resourcesUrl", e.target.value)}
            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
            placeholder="https://drive.google.com/..." />
        </div>

        {/* Platforms */}
        <div className="md:col-span-2">
          <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-1 block">Plataformas</label>
          <input value={form.platforms} onChange={e => set("platforms", e.target.value)}
            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
            placeholder="Instagram, TikTok, YouTube, Twitter..." />
        </div>

        {/* Reward RLC */}
        <div>
          <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-1 block">Recompensa RLC *</label>
          <input type="number" min={1} value={form.rewardRlc} onChange={e => set("rewardRlc", Number(e.target.value))}
            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
        </div>

        {/* Bonus RLC */}
        <div>
          <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-1 block">
            Bonus RLC (más likes/compartidas al final del mes)
          </label>
          <input type="number" min={0} value={form.bonusRlc} onChange={e => set("bonusRlc", Number(e.target.value))}
            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
        </div>

        {/* Start Date */}
        <div>
          <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-1 block">Fecha inicio</label>
          <input type="datetime-local" value={form.startDate} onChange={e => set("startDate", e.target.value)}
            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
        </div>

        {/* End Date */}
        <div>
          <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-1 block">Fecha límite</label>
          <input type="datetime-local" value={form.endDate} onChange={e => set("endDate", e.target.value)}
            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
        </div>

        {/* Active */}
        <div className="flex items-center gap-3">
          <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => set("isActive", e.target.checked)}
            className="w-4 h-4 accent-red-600" />
          <label htmlFor="isActive" className="text-sm text-zinc-300">Misión activa (visible para creadores)</label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={() => onSave(form)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors">
          {initial?.id ? "Guardar cambios" : "Crear misión"}
        </button>
        <button onClick={onCancel}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── Mission Detail View ──────────────────────────────────────────────────────
function MissionDetail({ missionId, onBack }: { missionId: number; onBack: () => void }) {
  const { data, refetch } = trpc.creatorMissions.adminDetail.useQuery({ missionId });
  const reviewMutation = trpc.creatorMissions.adminReview.useMutation({
    onSuccess: () => { toast.success("Revisión guardada"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const [reviewState, setReviewState] = useState<Record<number, { note: string }>>({});

  if (!data) return <div className="text-zinc-500 text-sm p-8">Cargando...</div>;

  const { mission, accepts, submissions } = data;

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors">
        <ChevronLeft className="w-4 h-4" /> Volver a misiones
      </button>

      {/* Mission Info */}
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-orbitron text-white font-bold text-xl">{mission.title}</h2>
            <p className="text-zinc-400 text-sm mt-1">{mission.description}</p>
          </div>
          <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${mission.isActive ? "bg-green-500/20 text-green-400" : "bg-zinc-700 text-zinc-400"}`}>
            {mission.isActive ? "Activa" : "Inactiva"}
          </span>
        </div>

        {mission.requirements && (
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">Requisitos</p>
            <p className="text-zinc-300 text-sm whitespace-pre-wrap">{mission.requirements}</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-zinc-800 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{mission.rewardRlc}</p>
            <p className="text-xs text-zinc-500">RLC recompensa</p>
          </div>
          <div className="bg-zinc-800 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-400">{mission.bonusRlc}</p>
            <p className="text-xs text-zinc-500">RLC bonus mensual</p>
          </div>
          <div className="bg-zinc-800 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{accepts.length}</p>
            <p className="text-xs text-zinc-500">Tomaron la misión</p>
          </div>
          <div className="bg-zinc-800 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-orange-400">{submissions.filter(s => s.status === "pending").length}</p>
            <p className="text-xs text-zinc-500">Pendientes de revisión</p>
          </div>
        </div>

        {mission.resourcesUrl && (
          <a href={mission.resourcesUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
            <Link2 className="w-4 h-4" /> Ver recursos (Drive/Dropbox)
            <ExternalLink className="w-3 h-3" />
          </a>
        )}

        {mission.platforms && (
          <p className="text-sm text-zinc-400"><span className="text-zinc-500">Plataformas:</span> {mission.platforms}</p>
        )}
      </div>

      {/* Participants who accepted */}
      {accepts.length > 0 && (
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" /> Creadores que tomaron la misión ({accepts.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {accepts.map((a, i) => (
              <div key={i} className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-1.5">
                {a.avatar ? (
                  <img src={a.avatar} className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400">
                    {(a.nickname || a.name || "?")[0].toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-zinc-300">{a.nickname || a.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submissions */}
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4 text-orange-400" /> Entregas ({submissions.length})
        </h3>

        {submissions.length === 0 ? (
          <p className="text-zinc-500 text-sm">Ningún creador ha enviado su entrega todavía.</p>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <div key={sub.id} className={`border rounded-xl p-4 space-y-3 ${
                sub.status === "approved" ? "border-green-600/30 bg-green-900/10" :
                sub.status === "rejected" ? "border-red-600/30 bg-red-900/10" :
                "border-orange-600/30 bg-orange-900/10"
              }`}>
                {/* Creator info */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {sub.avatar ? (
                      <img src={sub.avatar} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-sm text-zinc-400">
                        {(sub.nickname || sub.name || "?")[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-white font-semibold text-sm">{sub.nickname || sub.name}</p>
                      <p className="text-zinc-500 text-xs">
                        Enviado {new Date(sub.submittedAt).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    sub.status === "approved" ? "bg-green-500/20 text-green-400" :
                    sub.status === "rejected" ? "bg-red-500/20 text-red-400" :
                    "bg-orange-500/20 text-orange-400"
                  }`}>
                    {sub.status === "approved" ? "✓ Aprobado" : sub.status === "rejected" ? "✗ Rechazado" : "⏳ Pendiente"}
                  </span>
                </div>

                {/* Links */}
                <div className="space-y-1.5">
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Links enviados</p>
                  {sub.links.map((link, li) => (
                    <a key={li} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors group">
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{link.url}</span>
                      {link.platform && <span className="text-zinc-500 text-xs shrink-0">({link.platform})</span>}
                    </a>
                  ))}
                </div>

                {/* Admin note if exists */}
                {sub.adminNote && (
                  <div className="bg-zinc-800 rounded-lg px-3 py-2">
                    <p className="text-xs text-zinc-500 font-semibold mb-1">Nota del admin</p>
                    <p className="text-sm text-zinc-300">{sub.adminNote}</p>
                  </div>
                )}

                {/* Review actions */}
                {sub.status === "pending" && (
                  <div className="space-y-2 pt-1">
                    <textarea
                      placeholder="Nota para el creador (opcional, se enviará con la notificación)..."
                      value={reviewState[sub.id]?.note ?? ""}
                      onChange={e => setReviewState(prev => ({ ...prev, [sub.id]: { note: e.target.value } }))}
                      rows={2}
                      className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => reviewMutation.mutate({ submissionId: sub.id, action: "approved", adminNote: reviewState[sub.id]?.note })}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-4 py-2 rounded-lg transition-colors">
                        <Check className="w-4 h-4" /> Aprobar
                      </button>
                      <button
                        onClick={() => reviewMutation.mutate({ submissionId: sub.id, action: "rejected", adminNote: reviewState[sub.id]?.note })}
                        className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white font-bold text-sm px-4 py-2 rounded-lg transition-colors">
                        <X className="w-4 h-4" /> Rechazar
                      </button>
                    </div>
                  </div>
                )}

                {sub.rewardPaid && (
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> Recompensa pagada
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function CreatorMissionsAdminPage() {
  const [view, setView] = useState<"list" | "create" | "edit" | "detail">("list");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Mission> | null>(null);

  const { data: missions = [], refetch } = trpc.creatorMissions.adminList.useQuery();
  const createMutation = trpc.creatorMissions.adminCreate.useMutation({
    onSuccess: () => { toast.success("Misión creada y creadores notificados"); refetch(); setView("list"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.creatorMissions.adminUpdate.useMutation({
    onSuccess: () => { toast.success("Misión actualizada"); refetch(); setView("list"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.creatorMissions.adminDelete.useMutation({
    onSuccess: () => { toast.success("Misión eliminada"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  // ── Detail view
  if (view === "detail" && selectedId) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <MissionDetail missionId={selectedId} onBack={() => setView("list")} />
      </div>
    );
  }

  // ── Create / Edit form
  if (view === "create" || view === "edit") {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <button onClick={() => setView("list")} className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" /> Volver
        </button>
        <MissionForm
          initial={editData ?? undefined}
          onSave={(data) => {
            if (view === "edit" && editData?.id) {
              updateMutation.mutate({ id: editData.id, ...data });
            } else {
              createMutation.mutate(data);
            }
          }}
          onCancel={() => setView("list")}
        />
      </div>
    );
  }

  // ── List view
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <PageHeader icon={Clapperboard} title="MISIONES CREADORES" subtitle="Gestiona misiones de contenido para creadores aprobados" />
        <button
          onClick={() => { setEditData(null); setView("create"); }}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-4 py-2.5 rounded-lg transition-colors shrink-0">
          <Plus className="w-4 h-4" /> Nueva misión
        </button>
      </div>

      {missions.length === 0 ? (
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-12 text-center">
          <Clapperboard className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 font-semibold">No hay misiones para creadores</p>
          <p className="text-zinc-600 text-sm mt-1">Crea la primera misión para notificar a los creadores</p>
        </div>
      ) : (
        <div className="space-y-3">
          {missions.map((m) => (
            <div key={m.id} className="bg-zinc-900 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white truncate">{m.title}</h3>
                    <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${m.isActive ? "bg-green-500/20 text-green-400" : "bg-zinc-700 text-zinc-500"}`}>
                      {m.isActive ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-sm line-clamp-2">{m.description}</p>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-red-400 font-bold">{m.rewardRlc} RLC</span>
                    </span>
                    {m.bonusRlc > 0 && (
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="text-yellow-400 font-bold">+{m.bonusRlc} RLC bonus</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {m.acceptCount} tomaron
                    </span>
                    {m.pendingCount > 0 && (
                      <span className="flex items-center gap-1 text-orange-400 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" /> {m.pendingCount} pendiente{m.pendingCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {m.approvedCount > 0 && (
                      <span className="flex items-center gap-1 text-green-400">
                        <Check className="w-3.5 h-3.5" /> {m.approvedCount} aprobado{m.approvedCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {m.endDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Vence {new Date(m.endDate).toLocaleDateString("es", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => { setSelectedId(m.id); setView("detail"); }}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Ver detalle y entregas">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setEditData(m); setView("edit"); }}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Editar">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm(`¿Eliminar "${m.title}"?`)) deleteMutation.mutate({ id: m.id }); }}
                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
