import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Coins, Play, CheckCircle, Clock, Star, Zap, Gift,
  Video, Megaphone, Calendar, Share2, Lock
} from "lucide-react";
import { getLoginUrl } from "@/const";

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  video: { label: "Ver Video", icon: <Video className="w-5 h-5" />, color: "text-red-400 bg-red-500/10 border-red-500/30" },
  ad: { label: "Ver Anuncio", icon: <Megaphone className="w-5 h-5" />, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  daily_login: { label: "Login Diario", icon: <Calendar className="w-5 h-5" />, color: "text-green-400 bg-green-500/10 border-green-500/30" },
  share: { label: "Compartir", icon: <Share2 className="w-5 h-5" />, color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
  follow: { label: "Seguir", icon: <Star className="w-5 h-5" />, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" },
};

function CountdownTimer({ seconds, onComplete }: { seconds: number; onComplete: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const progress = ((seconds - remaining) / seconds) * 100;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#1a1a1a" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="34" fill="none"
            stroke="#ff0000" strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear", filter: "drop-shadow(0 0 6px #ff0000)" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-black font-mono text-white">{remaining}</span>
        </div>
      </div>
      <p className="text-gray-400 text-sm font-mono">Espera para reclamar...</p>
    </div>
  );
}

export default function Rewards() {
  const { isAuthenticated } = useAuth();
  const [watchingTask, setWatchingTask] = useState<number | null>(null);
  const [completedWatch, setCompletedWatch] = useState<Set<number>>(new Set());
  const [claimedToday, setClaimedToday] = useState<Set<number>>(new Set());

  const { data: tasks = [] } = trpc.rewards.list.useQuery();
  const { data: me, refetch: refetchMe } = trpc.auth.me.useQuery();

  const claimMutation = trpc.rewards.claim.useMutation({
    onSuccess: (data) => {
      toast.success(`+${data.reward} RLC Coins ganados!`, {
        description: `Nuevo balance: ${data.newBalance} RLC`,
        style: { background: "#0a0a0a", border: "1px solid #22c55e", color: "#fff" },
      });
      setWatchingTask(null);
      setClaimedToday((prev) => { const n = new Set(prev); n.add(data.reward); return n; });
      refetchMe();
    },
    onError: (err) => {
      toast.error(err.message, {
        style: { background: "#0a0a0a", border: "1px solid #ff0000", color: "#fff" },
      });
      setWatchingTask(null);
    },
  });

  const handleStartTask = (taskId: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setWatchingTask(taskId);
  };

  const handleTimerComplete = (taskId: number) => {
    setCompletedWatch((prev) => { const n = new Set<number>(); prev.forEach(v => n.add(v)); n.add(taskId); return n; });
  };

  const handleClaim = (taskId: number) => {
    claimMutation.mutate({ taskId });
  };

  const userBalance = (me as { rlcBalance?: number } | null)?.rlcBalance ?? 0;

  // Group tasks by type
  const tasksByType = tasks.reduce<Record<string, typeof tasks>>((acc, task) => {
    const type = task.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(task);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #001a00 50%, #0a0a0a 100%)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #00ff44, transparent)" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-14">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Gift className="w-7 h-7 text-green-500" />
                <span className="text-green-500 font-mono text-sm tracking-widest uppercase">Sistema de Recompensas</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-2" style={{ fontFamily: "Orbitron, monospace" }}>
                GANA <span className="text-green-400" style={{ textShadow: "0 0 20px #00ff44" }}>RLC COINS</span>
              </h1>
              <p className="text-gray-400 max-w-lg">
                Completa tareas diarias, ve videos y anuncios para acumular RLC Coins. Úsalos en la tienda o en apuestas.
              </p>
            </div>
            {isAuthenticated && me && (
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 px-5 py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-yellow-400 font-black font-mono text-2xl">{userBalance}</p>
                    <p className="text-gray-500 text-xs font-mono">RLC COINS</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* How it works */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { icon: <Play className="w-6 h-6 text-red-400" />, title: "1. Elige una tarea", desc: "Selecciona un video o anuncio disponible" },
            { icon: <Clock className="w-6 h-6 text-yellow-400" />, title: "2. Completa el tiempo", desc: "Espera el contador para verificar que viste el contenido" },
            { icon: <Coins className="w-6 h-6 text-green-400" />, title: "3. Reclama tu premio", desc: "Los RLC Coins se acreditan automáticamente" },
          ].map((step, i) => (
            <div key={i} className="p-4 rounded-xl border border-white/10 bg-zinc-900 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                {step.icon}
              </div>
              <p className="font-bold font-mono text-sm mb-1">{step.title}</p>
              <p className="text-gray-500 text-xs">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Tasks */}
        {tasks.length === 0 ? (
          <div className="text-center py-24">
            <Gift className="w-16 h-16 text-green-500/30 mx-auto mb-4" />
            <p className="text-gray-500 font-mono text-lg">No hay tareas disponibles aún</p>
            <p className="text-gray-600 text-sm mt-2">Los administradores agregarán tareas pronto</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(tasksByType).map(([type, typeTasks]) => {
              const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.video;
              return (
                <div key={type}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg border ${cfg.color}`}>{cfg.icon}</div>
                    <h2 className="text-xl font-black font-mono tracking-wide">{cfg.label.toUpperCase()}S</h2>
                    <span className="text-gray-600 font-mono text-sm">({typeTasks.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {typeTasks.map((task) => {
                      const isWatching = watchingTask === task.id;
                      const isCompleted = completedWatch.has(task.id);

                      return (
                        <div
                          key={task.id}
                          className={`rounded-xl border bg-zinc-900 overflow-hidden transition-all ${
                            isWatching ? "border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.2)]" : "border-white/10 hover:border-white/20"
                          }`}
                        >
                          {/* Video preview */}
                          {task.contentUrl && (
                            <div className="relative aspect-video bg-zinc-800 overflow-hidden">
                              {isWatching ? (
                                <iframe
                                  src={task.contentUrl.includes("youtube") || task.contentUrl.includes("youtu.be")
                                    ? task.contentUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/") + "?autoplay=1&mute=0"
                                    : task.contentUrl
                                  }
                                  className="w-full h-full"
                                  allow="autoplay; fullscreen"
                                  allowFullScreen
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                  <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center">
                                    <Play className="w-8 h-8 text-red-400 ml-1" />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h3 className="font-bold text-white">{task.title}</h3>
                                {task.description && (
                                  <p className="text-gray-500 text-sm mt-0.5">{task.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0 px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                                <Coins className="w-3 h-3 text-yellow-400" />
                                <span className="text-yellow-400 font-bold font-mono text-sm">+{task.reward}</span>
                              </div>
                            </div>

                            {task.durationSeconds && (
                              <div className="flex items-center gap-1 text-gray-500 text-xs font-mono mb-3">
                                <Clock className="w-3 h-3" />
                                {task.durationSeconds}s requeridos
                              </div>
                            )}

                            {/* Action */}
                            {isWatching ? (
                              <div className="flex flex-col items-center gap-3 py-2">
                                {!isCompleted ? (
                                  <CountdownTimer
                                    seconds={task.durationSeconds ?? 30}
                                    onComplete={() => handleTimerComplete(task.id)}
                                  />
                                ) : (
                                  <div className="flex flex-col items-center gap-2">
                                    <CheckCircle className="w-10 h-10 text-green-400" />
                                    <p className="text-green-400 font-mono text-sm">¡Listo para reclamar!</p>
                                    <button
                                      onClick={() => handleClaim(task.id)}
                                      disabled={claimMutation.isPending}
                                      className="px-6 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-mono font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                      <Coins className="w-4 h-4" />
                                      Reclamar +{task.reward} RLC
                                    </button>
                                  </div>
                                )}
                                <button
                                  onClick={() => { setWatchingTask(null); setCompletedWatch((prev) => { const n = new Set<number>(); prev.forEach(v => { if (v !== task.id) n.add(v); }); return n; }); }}
                                  className="text-gray-600 text-xs hover:text-gray-400 transition-colors"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : !isAuthenticated ? (
                              <a
                                href={getLoginUrl()}
                                className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-zinc-800 text-gray-400 font-mono text-sm hover:bg-zinc-700 transition-all"
                              >
                                <Lock className="w-4 h-4" />
                                Inicia sesión para ganar
                              </a>
                            ) : (
                              <button
                                onClick={() => handleStartTask(task.id)}
                                className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-mono font-bold transition-all"
                              >
                                <Play className="w-4 h-4" />
                                {task.type === "daily_login" ? "Reclamar" : "Iniciar"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-12 p-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-start gap-4">
            <Zap className="w-8 h-8 text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-yellow-400 font-mono mb-1">LÍMITES DIARIOS</h3>
              <p className="text-gray-400 text-sm">
                Cada tarea tiene un límite diario de reclamaciones para garantizar la equidad. Los límites se reinician a medianoche.
                Acumula RLC Coins y canjéalos en la tienda de cosméticos, productos o úsalos en apuestas de torneos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
