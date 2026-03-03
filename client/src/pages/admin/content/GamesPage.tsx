import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Gamepad2, Plus, Trash2, Edit3, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "../components/AdminUI";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, arrayMove, useSortable, rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableGameCard({ g, onEdit, onDelete }: { g: any; onEdit: (g: any) => void; onDelete: (g: any) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: g.slug });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 10 : undefined };
  return (
    <div ref={setNodeRef} style={style} className="relative group rounded-xl overflow-hidden border border-white/8 bg-zinc-900/60">
      <div {...attributes} {...listeners} className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing bg-black/60 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-3 h-3 text-zinc-400" />
      </div>
      {g.bannerUrl ? (
        <img src={g.bannerUrl} alt={g.name} className="w-full h-32 object-cover" />
      ) : (
        <div className="w-full h-32 bg-zinc-800 flex items-center justify-center"><Gamepad2 className="w-8 h-8 text-zinc-600" /></div>
      )}
      <div className="p-3">
        <p className="text-white font-rajdhani font-semibold text-sm truncate">{g.name}</p>
        {g.genre && <p className="text-zinc-500 text-xs">{g.genre}</p>}
      </div>
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(g)} className="bg-black/80 hover:bg-zinc-700 rounded p-1"><Edit3 className="w-3 h-3 text-white" /></button>
        <button onClick={() => onDelete(g)} className="bg-black/80 hover:bg-red-900/80 rounded p-1"><Trash2 className="w-3 h-3 text-red-400" /></button>
      </div>
    </div>
  );
}

export function GamesPage() {
  const { data: games, refetch } = trpc.games.list.useQuery();
  const [localGames, setLocalGames] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", slug: "", banner: "", logo: "", genre: "", description: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"banner" | "logo" | null>(null);
  const uploadImage = trpc.admin.uploadImage.useMutation();
  const upsert = trpc.games.upsert.useMutation({
    onSuccess: () => { toast.success("Juego guardado"); refetch(); setForm({ name: "", slug: "", banner: "", logo: "", genre: "", description: "" }); setEditing(null); },
    onError: e => toast.error(e.message),
  });
  const del = trpc.games.delete.useMutation({
    onSuccess: () => { toast.success("Juego eliminado"); refetch(); },
    onError: e => toast.error(e.message),
  });
  const reorder = trpc.games.reorder.useMutation({
    onSuccess: () => toast.success("Orden guardado"),
    onError: e => toast.error(e.message),
  });

  useEffect(() => { if (games) setLocalGames(games); }, [games]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localGames.findIndex((g: any) => g.slug === active.id);
    const newIndex = localGames.findIndex((g: any) => g.slug === over.id);
    const reordered = arrayMove(localGames, oldIndex, newIndex);
    setLocalGames(reordered);
    reorder.mutate({ items: reordered.map((g: any, i: number) => ({ slug: g.slug, sortOrder: i })) });
  };

  const handleUpload = async (field: "banner" | "logo", file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("Máx 5MB"); return; }
    setUploading(field);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const result = await uploadImage.mutateAsync({ base64, mimeType: file.type as any, folder: "games" });
        setForm(f => ({ ...f, [field]: result.url }));
        setUploading(null);
      };
      reader.readAsDataURL(file);
    } catch { toast.error("Error al subir imagen"); setUploading(null); }
  };

  const autoSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const startEdit = (g: any) => { setEditing(g.slug); setForm({ name: g.name, slug: g.slug, banner: g.bannerUrl ?? "", logo: g.logo ?? "", genre: g.genre ?? "", description: g.description ?? "" }); };
  const cancelEdit = () => { setEditing(null); setForm({ name: "", slug: "", banner: "", logo: "", genre: "", description: "" }); };

  return (
    <div className="space-y-6 w-full">
      <PageHeader icon={Gamepad2} title="JUEGOS" subtitle="Gestiona los juegos disponibles en la plataforma" />

      {/* Form */}
      <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-5 space-y-4">
        <p className="text-white font-orbitron text-sm">{editing ? "EDITAR JUEGO" : "AGREGAR JUEGO"}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">NOMBRE *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: editing ? f.slug : autoSlug(e.target.value) }))}
              className="w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none" placeholder="Ej: Valorant" />
          </div>
          <div>
            <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">SLUG (ID único)</label>
            <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              className="w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none" placeholder="Ej: valorant" />
          </div>
          <div>
            <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">GÉNERO</label>
            <input value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}
              className="w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none" placeholder="Ej: FPS, MOBA, Battle Royale" />
          </div>
          <div>
            <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">DESCRIPCIÓN</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none" placeholder="Descripción corta" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(["banner", "logo"] as const).map(field => (
            <div key={field}>
              <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">{field === "banner" ? "PORTADA / BANNER *" : "LOGO (opcional)"}</label>
              <div className="flex items-center gap-3">
                {form[field] && <img src={form[field]} alt="" className={`object-cover rounded border border-white/10 ${field === "banner" ? "w-16 h-10" : "w-10 h-10"}`} />}
                <label className="cursor-pointer">
                  <div className="bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg px-3 py-2 text-zinc-400 text-xs font-rajdhani flex items-center gap-2">
                    {uploading === field ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> : <Plus className="w-3 h-3" />}
                    {uploading === field ? "Subiendo..." : "Subir imagen"}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(field, e.target.files[0])} />
                </label>
              </div>
              <input value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                className="mt-2 w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-2 text-zinc-400 text-xs outline-none" placeholder="O pega URL de imagen" />
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <Button onClick={() => upsert.mutate({ name: form.name, slug: form.slug || autoSlug(form.name), banner: form.banner, logo: form.logo, genre: form.genre, description: form.description })}
            disabled={!form.name || upsert.isPending} className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs">
            {upsert.isPending ? "Guardando..." : editing ? "ACTUALIZAR" : "AGREGAR JUEGO"}
          </Button>
          {editing && <Button variant="outline" onClick={cancelEdit} className="border-white/10 text-zinc-400 font-orbitron text-xs">CANCELAR</Button>}
        </div>
      </div>

      {/* Games grid with drag-and-drop */}
      <div className="flex items-center gap-2 mb-2">
        <GripVertical className="w-4 h-4 text-zinc-600" />
        <p className="text-zinc-500 text-xs font-rajdhani">Arrastra las tarjetas para reordenar.</p>
        {reorder.isPending && <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />}
      </div>
      {!localGames || localGames.length === 0 ? (
        <p className="text-zinc-600 text-sm text-center py-8 font-rajdhani">Sin juegos registrados</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={localGames.map((g: any) => g.slug)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {localGames.map((g: any) => (
                <SortableGameCard key={g.slug} g={g} onEdit={startEdit}
                  onDelete={(g) => { if (confirm(`¿Eliminar ${g.name}?`)) del.mutate({ slug: g.slug }); }} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
