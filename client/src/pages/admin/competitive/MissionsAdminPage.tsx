import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import {
  Plus, Trash2, Edit2, X, Check, Trophy, ToggleLeft, ToggleRight,
  Upload, Clock, Coins, Play, Users
} from "lucide-react";
import { PageHeader } from "../components/AdminUI";

interface MissionForm {
  title: string;
  description: string;
  videoUrl: string;
  bannerBase64: string;
  bannerMime: string;
  sponsorName: string;
  sponsorLogoBase64: string;
  sponsorLogoMime: string;
  rewardRlc: number;
  requiredWatchSeconds: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const EMPTY_FORM: MissionForm = {
  title: "",
  description: "",
  videoUrl: "",
  bannerBase64: "",
  bannerMime: "",
  sponsorName: "",
  sponsorLogoBase64: "",
  sponsorLogoMime: "",
  rewardRlc: 100,
  requiredWatchSeconds: 30,
  startDate: "",
  endDate: "",
  isActive: true,
};

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ImageUploadField({
  label,
  preview,
  onFile,
  uploading,
  accept = "image/*",
}: {
  label: string;
  preview: string;
  onFile: (file: File) => void;
  uploading?: boolean;
  accept?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">{label}</label>
      <label className="relative flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 cursor-pointer hover:border-red-500/50 transition-colors overflow-hidden">
        {preview ? (
          <img src={preview} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />
        ) : null}
        <div className="relative z-10 flex flex-col items-center gap-1 text-zinc-500">
          {uploading ? (
            <div className="w-5 h-5 border-2 border-zinc-500 border-t-red-400 rounded-full animate-spin" />
          ) : (
            <Upload size={20} />
          )}
          <span className="text-xs">{uploading ? "Subiendo..." : "Seleccionar archivo"}</span>
        </div>
        <input
          type="file"
          accept={accept}
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
        />
      </label>
    </div>
  );
}

export function MissionsAdminPage() {
  const utils = trpc.useUtils();
  const { data: missions = [], refetch } = trpc.missions.admin.list.useQuery();

  const invalidate = () => {
    refetch();
    utils.missions.list.invalidate();
  };

  const createMission = trpc.missions.admin.create.useMutation({
    onSuccess: () => { toast.success("Misión creada"); invalidate(); setShowCreate(false); setForm(EMPTY_FORM); },
    onError: (e) => toast.error(e.message),
  });

  const updateMission = trpc.missions.admin.update.useMutation({
    onSuccess: () => { toast.success("Misión actualizada"); invalidate(); setEditingId(null); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMission = trpc.missions.admin.delete.useMutation({
    onSuccess: () => { toast.success("Misión eliminada"); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<MissionForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<MissionForm>>({});
  const [bannerPreview, setBannerPreview] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [editBannerPreview, setEditBannerPreview] = useState("");
  const [editLogoPreview, setEditLogoPreview] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);

  const handleBannerFile = async (file: File, isEdit = false) => {
    if (!file.type.startsWith("image/")) { toast.error("Solo imágenes"); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Máx 8MB"); return; }
    setUploading("banner");
    const base64 = await toBase64(file);
    const preview = URL.createObjectURL(file);
    if (isEdit) {
      setEditForm(f => ({ ...f, bannerBase64: base64, bannerMime: file.type }));
      setEditBannerPreview(preview);
    } else {
      setForm(f => ({ ...f, bannerBase64: base64, bannerMime: file.type }));
      setBannerPreview(preview);
    }
    setUploading(null);
  };

  const handleLogoFile = async (file: File, isEdit = false) => {
    if (!file.type.startsWith("image/")) { toast.error("Solo imágenes"); return; }
    if (file.size > 4 * 1024 * 1024) { toast.error("Máx 4MB"); return; }
    setUploading("logo");
    const base64 = await toBase64(file);
    const preview = URL.createObjectURL(file);
    if (isEdit) {
      setEditForm(f => ({ ...f, sponsorLogoBase64: base64, sponsorLogoMime: file.type }));
      setEditLogoPreview(preview);
    } else {
      setForm(f => ({ ...f, sponsorLogoBase64: base64, sponsorLogoMime: file.type }));
      setLogoPreview(preview);
    }
    setUploading(null);
  };

  const handleCreate = () => {
    if (!form.title.trim()) { toast.error("El título es requerido"); return; }
    if (!form.videoUrl.trim()) { toast.error("La URL del video es requerida"); return; }
    if (form.rewardRlc < 1) { toast.error("La recompensa debe ser mayor a 0"); return; }
    createMission.mutate({
      title: form.title,
      description: form.description || undefined,
      videoUrl: form.videoUrl,
      bannerBase64: form.bannerBase64 || undefined,
      bannerMime: form.bannerMime || undefined,
      sponsorName: form.sponsorName || undefined,
      sponsorLogoBase64: form.sponsorLogoBase64 || undefined,
      sponsorLogoMime: form.sponsorLogoMime || undefined,
      rewardRlc: form.rewardRlc,
      requiredWatchSeconds: form.requiredWatchSeconds,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      isActive: form.isActive,
    });
  };

  const startEdit = (m: typeof missions[0]) => {
    setEditingId(m.id);
    setEditForm({
      title: m.title,
      description: m.description ?? "",
      videoUrl: m.videoUrl,
      sponsorName: m.sponsorName ?? "",
      rewardRlc: m.rewardRlc,
      requiredWatchSeconds: m.requiredWatchSeconds,
      startDate: m.startDate ? new Date(m.startDate).toISOString().slice(0, 16) : "",
      endDate: m.endDate ? new Date(m.endDate).toISOString().slice(0, 16) : "",
      isActive: m.isActive,
    });
    setEditBannerPreview(m.bannerUrl ?? "");
    setEditLogoPreview(m.sponsorLogo ?? "");
  };

  const handleUpdate = () => {
    if (!editingId) return;
    updateMission.mutate({
      id: editingId,
      title: editForm.title,
      description: editForm.description,
      videoUrl: editForm.videoUrl,
      bannerBase64: editForm.bannerBase64,
      bannerMime: editForm.bannerMime,
      sponsorName: editForm.sponsorName,
      sponsorLogoBase64: editForm.sponsorLogoBase64,
      sponsorLogoMime: editForm.sponsorLogoMime,
      rewardRlc: editForm.rewardRlc,
      requiredWatchSeconds: editForm.requiredWatchSeconds,
      startDate: editForm.startDate || null,
      endDate: editForm.endDate || null,
      isActive: editForm.isActive,
    });
  };

  const toggleActive = (m: typeof missions[0]) => {
    updateMission.mutate({ id: m.id, isActive: !m.isActive });
  };

  const MissionFormFields = ({
    f,
    setF,
    bannerPrev,
    logoPrev,
    isEdit,
  }: {
    f: Partial<MissionForm>;
    setF: (fn: (prev: Partial<MissionForm>) => Partial<MissionForm>) => void;
    bannerPrev: string;
    logoPrev: string;
    isEdit: boolean;
  }) => (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Título *</label>
        <input
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50"
          placeholder="Ej: Mira el trailer de Valorant"
          value={f.title ?? ""}
          onChange={(e) => setF(p => ({ ...p, title: e.target.value }))}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Descripción</label>
        <textarea
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50 resize-none"
          rows={2}
          placeholder="Descripción corta de la misión..."
          value={f.description ?? ""}
          onChange={(e) => setF(p => ({ ...p, description: e.target.value }))}
        />
      </div>

      {/* Video URL */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">URL del video * (Cloudflare R2)</label>
        <input
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50 font-mono"
          placeholder="https://pub-xxxx.r2.dev/missions/video.mp4"
          value={f.videoUrl ?? ""}
          onChange={(e) => setF(p => ({ ...p, videoUrl: e.target.value }))}
        />
      </div>

      {/* Banner + Sponsor Logo */}
      <div className="grid grid-cols-2 gap-4">
        <ImageUploadField
          label="Banner de misión"
          preview={bannerPrev}
          onFile={(file) => isEdit ? handleBannerFile(file, true) : handleBannerFile(file, false)}
          uploading={uploading === "banner"}
        />
        <ImageUploadField
          label="Logo del sponsor"
          preview={logoPrev}
          onFile={(file) => isEdit ? handleLogoFile(file, true) : handleLogoFile(file, false)}
          uploading={uploading === "logo"}
        />
      </div>

      {/* Sponsor name */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Nombre del sponsor</label>
        <input
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50"
          placeholder="Ej: Riot Games"
          value={f.sponsorName ?? ""}
          onChange={(e) => setF(p => ({ ...p, sponsorName: e.target.value }))}
        />
      </div>

      {/* Reward + Duration */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Recompensa (RLC) *</label>
          <div className="relative">
            <Coins size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-400" />
            <input
              type="number" min={1}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-8 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50"
              value={f.rewardRlc ?? 100}
              onChange={(e) => setF(p => ({ ...p, rewardRlc: parseInt(e.target.value) || 0 }))}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Segundos requeridos *</label>
          <div className="relative">
            <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="number" min={5}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-8 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50"
              value={f.requiredWatchSeconds ?? 30}
              onChange={(e) => setF(p => ({ ...p, requiredWatchSeconds: parseInt(e.target.value) || 30 }))}
            />
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Fecha inicio</label>
          <input
            type="datetime-local"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50"
            value={f.startDate ?? ""}
            onChange={(e) => setF(p => ({ ...p, startDate: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Fecha fin</label>
          <input
            type="datetime-local"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50"
            value={f.endDate ?? ""}
            onChange={(e) => setF(p => ({ ...p, endDate: e.target.value }))}
          />
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3">
        <div>
          <p className="text-white text-sm font-semibold">Misión activa</p>
          <p className="text-zinc-500 text-xs">Los usuarios pueden ver y aceptar esta misión</p>
        </div>
        <button
          type="button"
          onClick={() => setF(p => ({ ...p, isActive: !p.isActive }))}
          className="text-2xl"
        >
          {f.isActive
            ? <ToggleRight size={28} className="text-green-400" />
            : <ToggleLeft size={28} className="text-zinc-600" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="MISIONES"
        subtitle="Gestiona misiones patrocinadas con video"
        icon={Trophy}
      />

      {/* Create button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => { setShowCreate(true); setForm(EMPTY_FORM); setBannerPreview(""); setLogoPreview(""); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors"
        >
          <Plus size={16} />
          Nueva misión
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 bg-zinc-900/60 border border-zinc-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Plus size={18} className="text-red-400" />
              Nueva misión
            </h2>
            <button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <MissionFormFields
            f={form}
            setF={(fn) => setForm(prev => fn(prev) as MissionForm)}
            bannerPrev={bannerPreview}
            logoPrev={logoPreview}
            isEdit={false}
          />
          <div className="flex gap-3 mt-5">
            <button
              onClick={handleCreate}
              disabled={createMission.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {createMission.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : <Check size={16} />}
              Crear misión
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Missions list */}
      {missions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Trophy size={40} className="text-zinc-700 mb-3" />
          <p className="text-zinc-500 font-semibold">No hay misiones creadas</p>
          <p className="text-zinc-600 text-sm mt-1">Crea la primera misión patrocinada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {missions.map((m) => (
            <div key={m.id} className="bg-zinc-900/60 border border-zinc-700/50 rounded-2xl overflow-hidden">
              {editingId === m.id ? (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-white font-bold flex items-center gap-2">
                      <Edit2 size={16} className="text-red-400" />
                      Editando: {m.title}
                    </h3>
                    <button onClick={() => setEditingId(null)} className="text-zinc-500 hover:text-white">
                      <X size={18} />
                    </button>
                  </div>
                  <MissionFormFields
                    f={editForm}
                    setF={setEditForm}
                    bannerPrev={editBannerPreview}
                    logoPrev={editLogoPreview}
                    isEdit={true}
                  />
                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={handleUpdate}
                      disabled={updateMission.isPending}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors disabled:opacity-50"
                    >
                      {updateMission.isPending ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : <Check size={16} />}
                      Guardar cambios
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4">
                  {/* Banner thumbnail */}
                  <div className="w-20 h-14 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
                    {m.bannerUrl ? (
                      <img src={m.bannerUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Trophy size={20} className="text-zinc-600" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-white font-semibold text-sm truncate">{m.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.isActive ? "bg-green-500/15 text-green-400" : "bg-zinc-700 text-zinc-400"}`}>
                        {m.isActive ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                    {m.sponsorName && (
                      <p className="text-zinc-500 text-xs mb-1">{m.sponsorName}</p>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-yellow-400 text-xs font-semibold">
                        <Coins size={11} /> {m.rewardRlc} RLC
                      </span>
                      <span className="flex items-center gap-1 text-zinc-500 text-xs">
                        <Clock size={11} /> {m.requiredWatchSeconds}s
                      </span>
                      <span className="flex items-center gap-1 text-zinc-500 text-xs">
                        <Play size={11} />
                        <a href={m.videoUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white underline truncate max-w-[120px]">
                          Ver video
                        </a>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleActive(m)}
                      title={m.isActive ? "Desactivar" : "Activar"}
                      className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                      {m.isActive
                        ? <ToggleRight size={20} className="text-green-400" />
                        : <ToggleLeft size={20} className="text-zinc-600" />}
                    </button>
                    <button
                      onClick={() => startEdit(m)}
                      className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => { if (confirm(`¿Eliminar "${m.title}"?`)) deleteMission.mutate({ id: m.id }); }}
                      className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-zinc-600 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
