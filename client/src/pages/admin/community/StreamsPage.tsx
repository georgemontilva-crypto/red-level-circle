import { trpc } from "@/lib/trpc";
import { Megaphone, Radio } from "lucide-react";
import { PageHeader, EmptyState } from "../components/AdminUI";

export function StreamsPage() {
  const { data: streams } = trpc.streams.list.useQuery({});

  const live = (streams ?? []).filter((s: any) => s.isLive);
  const offline = (streams ?? []).filter((s: any) => !s.isLive);

  return (
    <div className="space-y-6 w-full">
      <PageHeader icon={Megaphone} title="STREAMS" subtitle="Monitorea los streams activos en la plataforma" />

      {live.length > 0 && (
        <div>
          <h3 className="font-orbitron text-sm text-red-400 mb-3 flex items-center gap-2">
            <Radio className="w-4 h-4 animate-pulse" /> EN VIVO ({live.length})
          </h3>
          <div className="space-y-2">
            {live.map((s: any) => (
              <div key={s.id} className="bg-zinc-900/60 border border-red-900/30 rounded-xl p-4 flex items-center gap-4">
                {s.thumbnailUrl && <img src={s.thumbnailUrl} alt="" className="w-16 h-10 rounded object-cover flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-rajdhani font-semibold truncate">{s.title}</p>
                  <p className="text-zinc-500 text-xs">{s.streamerName ?? s.userName} · {s.game}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-red-600/20 text-red-400 border border-red-600/30 px-2 py-0.5 rounded-full font-mono animate-pulse">● LIVE</span>
                  {s.viewerCount > 0 && <span className="text-xs text-zinc-400">{s.viewerCount} viewers</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {offline.length > 0 && (
        <div>
          <h3 className="font-orbitron text-sm text-zinc-500 mb-3 flex items-center gap-2">
            <Megaphone className="w-4 h-4" /> OFFLINE ({offline.length})
          </h3>
          <div className="space-y-2">
            {offline.slice(0, 20).map((s: any) => (
              <div key={s.id} className="bg-zinc-900/40 border border-white/5 rounded-xl p-4 flex items-center gap-4 opacity-70">
                {s.thumbnailUrl && <img src={s.thumbnailUrl} alt="" className="w-16 h-10 rounded object-cover flex-shrink-0 grayscale" />}
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-300 font-rajdhani font-semibold truncate">{s.title}</p>
                  <p className="text-zinc-600 text-xs">{s.streamerName ?? s.userName} · {s.game}</p>
                </div>
                <span className="text-xs text-zinc-600 font-mono">OFFLINE</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(streams?.length ?? 0) === 0 && (
        <EmptyState icon={Megaphone} title="No hay streams registrados" />
      )}
    </div>
  );
}
