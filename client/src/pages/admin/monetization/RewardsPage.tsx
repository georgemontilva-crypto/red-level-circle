import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import {
  Gift, Plus, Edit3, Trash2, Sparkles, CheckCircle2,
  Video, Megaphone, LogIn, Share2, UserPlus, Clock, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "../components/AdminUI";

// ─── Constantes de economía calibrada ────────────────────────────────────────
const ECONOMY = {
  RLC_PER_HOUR: 800,
  RLC_PER_DAY: 1600,
  RLC_PER_MONTH: 48000,
  USD_RATE: 1000, // 1000 RLC = $1 USD
};

// ─── Icono por tipo de tarea ─────────────────────────────────────────────────
const typeIcons: Record<string, React.ElementType> = {
  video: Video,
  ad: Megaphone,
  daily_login: LogIn,
  share: Share2,
  follow: UserPlus,
};

const typeLabels: Record<string, string> = {
  video: "Ver video",
  ad: "Ver anuncio",
  daily_login: "Login diario",
  share: "Compartir",
  follow: "Seguir",
};

const typeColors: Record<string, string> = {
  video: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  ad: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  daily_login: "text-green-400 bg-green-500/10 border-green-500/20",
  share: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  follow: "text-pink-400 bg-pink-500/10 border-pink-500/20",
};

// ─── AI Reward Card ───────────────────────────────────────────────────────────
function AIRewardCard({ report, onAccept }: { report: any; onAccept: (reward: number) => void }) {
  const daysToEarn = (report.suggestedReward / ECONOMY.RLC_PER_DAY).toFixed(1);
  return (
    <div className="bg-gradient-to-br from-red-950/40 to-zinc-900/80 border border-red-700/40 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-red-600/20 border border-red-600/40 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-red-400" />
        </div>
        <span className="text-xs font-orbitron text-red-400 uppercase tracking-wider">RLC Economy Architect</span>
      </div>

      {/* Rango de recompensa */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-black/20 rounded-lg p-2.5 text-center">
          <p className="text-xs text-zinc-500 font-mono mb-0.5">MÍNIMO</p>
          <p className="text-sm font-orbitron font-bold text-zinc-300">{report.minReward?.toLocaleString()}</p>
          <p className="text-xs text-zinc-600">RLC</p>
        </div>
        <div className="bg-red-600/15 border border-red-600/30 rounded-lg p-2.5 text-center">
          <p className="text-xs text-zinc-400 font-mono mb-0.5">SUGERIDO</p>
          <p className="text-xl font-orbitron font-bold text-red-400">{report.suggestedReward?.toLocaleString()}</p>
          <p className="text-xs text-zinc-500">RLC</p>
        </div>
        <div className="bg-black/20 rounded-lg p-2.5 text-center">
          <p className="text-xs text-zinc-500 font-mono mb-0.5">MÁXIMO</p>
          <p className="text-sm font-orbitron font-bold text-zinc-300">{report.maxReward?.toLocaleString()}</p>
          <p className="text-xs text-zinc-600">RLC</p>
        </div>
      </div>

      {/* Contexto económico */}
      <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
        <TrendingUp className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
        <p className="text-xs text-zinc-400 font-rajdhani">
          Equivale a <span className="text-white font-semibold">{daysToEarn} días</span> de actividad activa
          · <span className="text-white font-semibold">${(report.suggestedReward / ECONOMY.USD_RATE).toFixed(2)} USD</span>
        </p>
      </div>

      <p className="text-xs text-zinc-400 font-rajdhani leading-relaxed">{report.rationale}</p>

      {report.engagementTip && (
        <div className="bg-blue-950/30 border border-blue-800/30 rounded-lg px-3 py-2">
          <p className="text-xs text-blue-300 font-rajdhani">
            <span className="font-semibold text-blue-400">💡 Tip de engagement:</span> {report.engagementTip}
          </p>
        </div>
      )}

      <Button
        onClick={() => onAccept(report.suggestedReward)}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs"
      >
        APLICAR {report.suggestedReward?.toLocaleString()} RLC
      </Button>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function RewardsPage() {
  const emptyForm = {
    title: "",
    description: "",
    type: "video" as "video" | "ad" | "daily_login" | "share" | "follow",
    rewardAmount: "",
    contentUrl: "",
    thumbnailUrl: "",
    sponsorName: "",
    durationSeconds: "30",
  };

  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [aiReport, setAiReport] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: rewards, refetch } = trpc.admin.listRewards.useQuery();

  const suggestReward = trpc.admin.suggestReward.useMutation({
    onSuccess: (data) => { setAiReport(data); toast.success("Recompensa sugerida por IA"); },
    onError: e => toast.error("Error IA: " + e.message),
  });

  const create = trpc.admin.createReward.useMutation({
    onSuccess: () => {
      toast.success("Tarea creada");
      setForm(emptyForm);
      setAiReport(null);
      setShowForm(false);
      refetch();
    },
    onError: e => toast.error(e.message),
  });

  const toggleActive = trpc.admin.updateReward.useMutation({
    onSuccess: () => refetch(),
    onError: e => toast.error(e.message),
  });

  const del = trpc.admin.deleteReward.useMutation({
    onSuccess: () => { toast.success("Tarea eliminada"); refetch(); },
    onError: e => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!form.title || !form.rewardAmount) return;
    create.mutate({
      title: form.title,
      description: form.description || undefined,
      type: form.type,
      rewardAmount: parseInt(form.rewardAmount) || 0,
      contentUrl: form.contentUrl || undefined,
      thumbnailUrl: form.thumbnailUrl || undefined,
      sponsorName: form.sponsorName || undefined,
      durationSeconds: parseInt(form.durationSeconds) || 30,
    });
  };

  const inputCls = "w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none placeholder:text-zinc-600";

  // ── Estadísticas rápidas de la economía ──────────────────────────────────
  const totalRewards = rewards?.length ?? 0;
  const activeRewards = rewards?.filter((r: any) => r.isActive).length ?? 0;
  const maxDailyRLC = rewards
    ?.filter((r: any) => r.isActive)
    .reduce((sum: number, r: any) => sum + (r.reward * (r.maxClaimsPerDay ?? 1)), 0) ?? 0;

  return (
    <div className="space-y-6 w-full">
      <PageHeader icon={Gift} title="RECOMPENSAS" subtitle="Gestiona tareas y misiones con precios sugeridos por IA" />

      {/* Economía calibrada - resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "RLC/hora", value: ECONOMY.RLC_PER_HOUR.toLocaleString(), color: "text-red-400", sub: "actividad activa" },
          { label: "RLC/día", value: ECONOMY.RLC_PER_DAY.toLocaleString(), color: "text-orange-400", sub: "2h de actividad" },
          { label: "RLC/mes", value: ECONOMY.RLC_PER_MONTH.toLocaleString(), color: "text-yellow-400", sub: "para producto $40" },
          { label: "Tareas activas", value: `${activeRewards}/${totalRewards}`, color: "text-green-400", sub: `máx ${maxDailyRLC.toLocaleString()} RLC/día` },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="bg-zinc-900/60 border border-white/8 rounded-xl p-3">
            <p className="text-zinc-500 text-xs font-mono uppercase mb-1">{label}</p>
            <p className={`text-xl font-orbitron font-bold ${color}`}>{value}</p>
            <p className="text-zinc-600 text-xs font-rajdhani mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Botón nueva tarea */}
      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-2" /> NUEVA TAREA
        </Button>
      )}

      {/* Formulario de creación */}
      {showForm && (
        <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-white font-orbitron text-sm">NUEVA TAREA DE RECOMPENSA</p>
            <button onClick={() => { setShowForm(false); setAiReport(null); setForm(emptyForm); }} className="text-zinc-500 hover:text-white text-xs font-rajdhani">CANCELAR</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">TÍTULO *</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className={inputCls}
                placeholder="Ej: Ver el trailer de la Season 5"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">TIPO DE TAREA</label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">🎬 Ver video</SelectItem>
                  <SelectItem value="ad">📢 Ver anuncio</SelectItem>
                  <SelectItem value="daily_login">🔑 Login diario</SelectItem>
                  <SelectItem value="share">🔗 Compartir contenido</SelectItem>
                  <SelectItem value="follow">👤 Seguir a alguien</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">DURACIÓN (segundos)</label>
              <input
                type="number"
                value={form.durationSeconds}
                onChange={e => setForm(f => ({ ...f, durationSeconds: e.target.value }))}
                className={inputCls}
                placeholder="30"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">PATROCINADOR (opcional)</label>
              <input
                value={form.sponsorName}
                onChange={e => setForm(f => ({ ...f, sponsorName: e.target.value }))}
                className={inputCls}
                placeholder="Ej: Razer, HyperX..."
              />
            </div>
            <div>
              <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">URL DEL CONTENIDO</label>
              <input
                value={form.contentUrl}
                onChange={e => setForm(f => ({ ...f, contentUrl: e.target.value }))}
                className={inputCls}
                placeholder="https://youtube.com/..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">DESCRIPCIÓN</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className={inputCls}
                placeholder="Descripción breve de la tarea..."
              />
            </div>
          </div>

          {/* RLC Economy Architect */}
          <div className="flex items-center justify-between bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-3">
            <div>
              <p className="text-xs font-orbitron text-red-400 uppercase tracking-wider">✦ RLC Economy Architect</p>
              <p className="text-xs text-zinc-500 font-rajdhani mt-0.5">
                La IA sugiere la recompensa óptima basada en el tipo de tarea y la economía calibrada
              </p>
            </div>
            <Button
              type="button"
              disabled={!form.title || suggestReward.isPending}
              onClick={() => suggestReward.mutate({
                title: form.title,
                type: form.type,
                description: form.description || undefined,
                sponsorName: form.sponsorName || undefined,
                durationSeconds: parseInt(form.durationSeconds) || undefined,
              })}
              className="flex-shrink-0 ml-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-orbitron text-xs px-4 py-2 h-auto"
            >
              {suggestReward.isPending
                ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Analizando...</>
                : <><Sparkles className="w-3.5 h-3.5 mr-2" />SUGERIR REWARD IA</>}
            </Button>
          </div>

          {/* AI Report */}
          {aiReport && (
            <AIRewardCard
              report={aiReport}
              onAccept={(reward) => {
                setForm(f => ({ ...f, rewardAmount: String(reward) }));
                setAiReport(null);
              }}
            />
          )}

          {/* Campo de recompensa manual */}
          <div>
            <label className="text-zinc-400 text-xs font-rajdhani mb-1 block">
              RECOMPENSA (RLC) *
              {form.rewardAmount && (
                <span className="ml-2 text-zinc-500">
                  ≈ {(parseInt(form.rewardAmount) / ECONOMY.RLC_PER_DAY).toFixed(1)} días de actividad
                  · ${(parseInt(form.rewardAmount) / ECONOMY.USD_RATE).toFixed(3)} USD
                </span>
              )}
            </label>
            <input
              type="number"
              value={form.rewardAmount}
              onChange={e => setForm(f => ({ ...f, rewardAmount: e.target.value }))}
              className={inputCls}
              placeholder="Ej: 150"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!form.title || !form.rewardAmount || create.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs"
            >
              {create.isPending ? "Creando..." : "CREAR TAREA"}
            </Button>
          </div>
        </div>
      )}

      {/* Lista de tareas */}
      <div className="space-y-2">
        <p className="text-zinc-500 text-xs font-orbitron uppercase tracking-wider">
          Tareas registradas ({totalRewards})
        </p>
        {!rewards || rewards.length === 0 ? (
          <div className="bg-zinc-900/40 border border-white/8 rounded-xl p-8 text-center">
            <Gift className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 font-rajdhani text-sm">Sin tareas registradas</p>
            <p className="text-zinc-600 font-rajdhani text-xs mt-1">Crea la primera tarea con el botón de arriba</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(rewards as any[]).map((task) => {
              const TypeIcon = typeIcons[task.type] ?? Gift;
              const colorCls = typeColors[task.type] ?? "text-zinc-400 bg-zinc-500/10 border-zinc-500/20";
              const daysToEarn = (task.reward / ECONOMY.RLC_PER_DAY).toFixed(1);
              return (
                <div
                  key={task.id}
                  className={`relative bg-zinc-900/60 border rounded-xl p-4 space-y-3 transition-opacity ${task.isActive ? "border-white/10 opacity-100" : "border-white/5 opacity-50"}`}
                >
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${colorCls}`}>
                      <TypeIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-rajdhani font-semibold text-sm leading-tight truncate">{task.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded border font-mono ${colorCls}`}>
                        {typeLabels[task.type] ?? task.type}
                      </span>
                    </div>
                  </div>

                  {/* Recompensa */}
                  <div className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-yellow-400 font-orbitron font-bold text-lg leading-none">{task.reward.toLocaleString()}</p>
                      <p className="text-zinc-500 text-xs font-mono">RLC</p>
                    </div>
                    <div className="text-right">
                      <p className="text-zinc-400 text-xs font-rajdhani">{daysToEarn} días</p>
                      <p className="text-zinc-600 text-xs font-mono">${(task.reward / ECONOMY.USD_RATE).toFixed(3)} USD</p>
                    </div>
                  </div>

                  {/* Info adicional */}
                  <div className="flex items-center gap-3 text-xs text-zinc-500 font-rajdhani">
                    {task.durationSeconds && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {task.durationSeconds}s
                      </span>
                    )}
                    {task.sponsorName && (
                      <span className="text-zinc-400 truncate">{task.sponsorName}</span>
                    )}
                    {task.isActive && (
                      <span className="flex items-center gap-1 text-green-400 ml-auto">
                        <CheckCircle2 className="w-3 h-3" /> Activa
                      </span>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 pt-1 border-t border-white/5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleActive.mutate({ id: task.id, isActive: !task.isActive })}
                      className={`flex-1 text-xs font-orbitron h-7 border-white/10 ${task.isActive ? "text-zinc-400 hover:text-red-400" : "text-green-400 hover:text-green-300"}`}
                    >
                      {task.isActive ? "DESACTIVAR" : "ACTIVAR"}
                    </Button>
                    <button
                      onClick={() => { if (confirm(`¿Eliminar "${task.title}"?`)) del.mutate({ id: task.id }); }}
                      className="bg-black/40 hover:bg-red-900/40 border border-white/5 rounded-lg p-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
