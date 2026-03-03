import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { MapPin, CheckCircle, XCircle, Star, Trash2, Clock, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "../components/AdminUI";

function AllyRow({ a, onUpdate, onDelete }: { a: any; onUpdate: (data: any) => void; onDelete: () => void }) {
  const [note, setNote] = useState(a.adminNote ?? "");
  const [showImages, setShowImages] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const uploadAllyImage = trpc.allies.uploadImage.useMutation();

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "cover"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const setter = type === "logo" ? setUploadingLogo : setUploadingCover;
    setter(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve((ev.target?.result as string).split(",")[1]);
        reader.readAsDataURL(file);
      });
      const mimeType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "image/avif";
      const result = await uploadAllyImage.mutateAsync({ base64, mimeType, allyId: a.id, type });
      onUpdate({ id: a.id, [type === "logo" ? "logo" : "coverImage"]: result.url });
      toast.success(`${type === "logo" ? "Logo" : "Banner"} actualizado`);
    } catch {
      toast.error("Error al subir imagen");
    } finally {
      setter(false);
    }
  };

  return (
    <div className="bg-zinc-900/60 border border-white/8 rounded-xl overflow-hidden">
      {/* Main row - compact */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Logo */}
        <div className="relative group flex-shrink-0">
          {a.logo ? (
            <img src={a.logo} alt={a.name} className="w-9 h-9 rounded-lg object-contain bg-zinc-800 border border-white/10 p-0.5" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center border border-white/10">
              <MapPin className="w-4 h-4 text-red-500" />
            </div>
          )}
          <label className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center" title="Cambiar logo">
            <Upload className="w-3 h-3 text-white" />
            <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, "logo")} disabled={uploadingLogo} />
          </label>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-white truncate">{a.name}</span>
            {a.isFeatured && <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0 rounded font-mono leading-5">DEST.</span>}
            <span className={`text-xs px-1.5 py-0 rounded font-mono leading-5 border ${
              a.status === "approved" ? "bg-green-500/20 text-green-400 border-green-500/30" :
              a.status === "rejected" ? "bg-red-500/20 text-red-400 border-red-500/30" :
              "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
            }`}>
              {a.status === "approved" ? "OK" : a.status === "rejected" ? "REJ" : "PEND"}
            </span>
          </div>
          <p className="text-zinc-500 text-xs truncate">
            {[a.city, a.country].filter(Boolean).join(", ")}
            {a.email && ` · ${a.email}`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {a.status !== "approved" && (
            <button onClick={() => onUpdate({ id: a.id, status: "approved" })}
              className="p-1.5 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white transition-colors text-xs" title="Aprobar">
              <CheckCircle className="w-3.5 h-3.5" />
            </button>
          )}
          {a.status !== "rejected" && (
            <button onClick={() => onUpdate({ id: a.id, status: "rejected", adminNote: note })}
              className="p-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors text-xs" title="Rechazar">
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => onUpdate({ id: a.id, isFeatured: !a.isFeatured })}
            className={`p-1.5 rounded-lg transition-colors text-xs ${a.isFeatured ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/40" : "text-zinc-500 hover:bg-zinc-700 hover:text-yellow-400"}`}
            title={a.isFeatured ? "Quitar destacado" : "Destacar"}>
            <Star className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setShowImages(v => !v)}
            className={`p-1.5 rounded-lg transition-colors text-xs ${showImages ? "bg-blue-500/20 text-blue-400" : "text-zinc-500 hover:bg-zinc-700 hover:text-blue-400"}`}
            title="Gestionar imágenes">
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { if (window.confirm("¿Eliminar este aliado?")) onDelete(); }}
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-red-900/40 hover:text-red-400 transition-colors text-xs" title="Eliminar">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Image management panel - expandable */}
      {showImages && (
        <div className="border-t border-white/5 px-3 py-3 bg-zinc-950/40">
          <p className="text-xs text-zinc-400 font-rajdhani uppercase mb-2">Imágenes del aliado</p>
          <div className="grid grid-cols-2 gap-3">
            {/* Logo */}
            <div>
              <p className="text-xs text-zinc-500 mb-1">Logo / Ícono</p>
              <div className="relative group border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-lg overflow-hidden transition-colors">
                {a.logo ? (
                  <img src={a.logo} alt="logo" className="w-full h-20 object-contain bg-zinc-900 p-2" />
                ) : (
                  <div className="w-full h-20 bg-zinc-900 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-zinc-600" />
                  </div>
                )}
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex flex-col items-center justify-center gap-1">
                  <Upload className="w-4 h-4 text-white" />
                  <span className="text-xs text-white">{uploadingLogo ? "Subiendo..." : "Cambiar logo"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, "logo")} disabled={uploadingLogo} />
                </label>
              </div>
            </div>
            {/* Cover/Banner */}
            <div>
              <p className="text-xs text-zinc-500 mb-1">Banner / Portada</p>
              <div className="relative group border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-lg overflow-hidden transition-colors">
                {a.coverImage ? (
                  <img src={a.coverImage} alt="cover" className="w-full h-20 object-cover" />
                ) : (
                  <div className="w-full h-20 bg-zinc-900 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-zinc-600" />
                  </div>
                )}
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex flex-col items-center justify-center gap-1">
                  <Upload className="w-4 h-4 text-white" />
                  <span className="text-xs text-white">{uploadingCover ? "Subiendo..." : "Cambiar banner"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, "cover")} disabled={uploadingCover} />
                </label>
              </div>
            </div>
          </div>
          {/* Note */}
          <div className="mt-2">
            <input
              className="w-full text-xs bg-zinc-800 border border-white/10 rounded px-2 py-1.5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20"
              placeholder="Nota admin (opcional)..."
              value={note}
              onChange={e => setNote(e.target.value)}
              onBlur={() => { if (note !== (a.adminNote ?? "")) onUpdate({ id: a.id, adminNote: note }); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function AlliesPage() {
  const utils = trpc.useUtils();
  const { data: allies } = trpc.allies.adminList.useQuery();
  const updateAlly = trpc.allies.update.useMutation({
    onSuccess: () => { toast.success("Aliado actualizado"); utils.allies.adminList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteAlly = trpc.allies.delete.useMutation({
    onSuccess: () => { toast.success("Aliado eliminado"); utils.allies.adminList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const byStatus = {
    pending: (allies ?? []).filter((a: any) => a.status === "pending"),
    approved: (allies ?? []).filter((a: any) => a.status === "approved"),
    rejected: (allies ?? []).filter((a: any) => a.status === "rejected"),
  };

  const Section = ({ label, color, icon: Icon, items }: { label: string; color: string; icon: any; items: any[] }) => (
    items.length > 0 ? (
      <div>
        <h3 className={`font-orbitron text-xs mb-2 flex items-center gap-1.5 ${color}`}>
          <Icon className="w-3.5 h-3.5" /> {label} ({items.length})
        </h3>
        <div className="space-y-1.5">
          {items.map((a: any) => (
            <AllyRow key={a.id} a={a}
              onUpdate={data => updateAlly.mutate(data)}
              onDelete={() => deleteAlly.mutate({ id: a.id })}
            />
          ))}
        </div>
      </div>
    ) : null
  );

  return (
    <div className="space-y-5 w-full">
      <PageHeader icon={MapPin} title="ALIADOS" subtitle="Gestiona el directorio de tiendas y sponsors" />

      <Section label="Pendientes" color="text-yellow-400" icon={Clock} items={byStatus.pending} />
      <Section label="Aprobados" color="text-green-400" icon={CheckCircle} items={byStatus.approved} />
      <Section label="Rechazados" color="text-red-400" icon={XCircle} items={byStatus.rejected} />

      {(allies?.length ?? 0) === 0 && (
        <EmptyState icon={MapPin} title="No hay solicitudes de aliados aún" />
      )}
    </div>
  );
}

export default AlliesPage;
