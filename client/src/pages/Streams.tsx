import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Radio, Eye, ExternalLink, Tv } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const PLATFORM_COLORS: Record<string, string> = {
  twitch: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  youtube: "text-red-400 bg-red-500/10 border-red-500/30",
  discord: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
  other: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30",
};

const PLATFORM_ICONS: Record<string, string> = {
  twitch: "🎮",
  youtube: "▶️",
  discord: "💬",
  other: "📺",
};

export default function Streams() {
  const [showLiveOnly, setShowLiveOnly] = useState(false);
  const [selectedStream, setSelectedStream] = useState<any>(null);
  const { isAuthenticated } = useAuth();

  const { data: streams, isLoading } = trpc.streams.list.useQuery({
    liveOnly: showLiveOnly || undefined,
  });

  const liveStreams = streams?.filter(s => s.isLive) ?? [];
  const allStreams = streams ?? [];

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <span className="font-orbitron font-black text-xl tracking-widest cursor-pointer">
              <span className="text-red-500">RED</span><span className="text-white">LEVEL</span>
              <span className="text-zinc-400 text-sm ml-1">CIRCLE</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-rajdhani font-semibold tracking-wider">
            <Link href="/tournaments"><span className="text-zinc-400 hover:text-white transition-colors cursor-pointer">TORNEOS</span></Link>
            <Link href="/ranking"><span className="text-zinc-400 hover:text-white transition-colors cursor-pointer">RANKING</span></Link>
            <Link href="/news"><span className="text-zinc-400 hover:text-white transition-colors cursor-pointer">NOTICIAS</span></Link>
            <Link href="/streams"><span className="text-white cursor-pointer">EN VIVO</span></Link>
            <Link href="/betting"><span className="text-zinc-400 hover:text-white transition-colors cursor-pointer">APUESTAS</span></Link>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard"><Button size="sm" className="bg-red-600 hover:bg-red-700 font-orbitron text-xs tracking-wider">DASHBOARD</Button></Link>
            ) : (
              <a href={getLoginUrl()}><Button size="sm" className="bg-red-600 hover:bg-red-700 font-orbitron text-xs tracking-wider">INGRESAR</Button></a>
            )}
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            {liveStreams.length > 0 && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            <Radio className="w-5 h-5 text-red-500" />
            <h1 className="font-orbitron font-black text-3xl text-white tracking-wider">TRANSMISIONES</h1>
            {liveStreams.length > 0 && (
              <span className="text-xs font-mono bg-red-600 text-white px-2 py-0.5 rounded animate-pulse">
                {liveStreams.length} EN VIVO
              </span>
            )}
          </div>
          <p className="text-zinc-500 font-rajdhani">Sigue los torneos en tiempo real desde Discord, Twitch y YouTube</p>
        </div>

        {/* Filter */}
        <div className="flex gap-3 mb-8">
          <button onClick={() => setShowLiveOnly(false)}
            className={`text-xs font-mono px-3 py-2 rounded border transition-all ${!showLiveOnly ? "bg-red-600 border-red-600 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-red-500/50"}`}>
            TODOS
          </button>
          <button onClick={() => setShowLiveOnly(true)}
            className={`flex items-center gap-1.5 text-xs font-mono px-3 py-2 rounded border transition-all ${showLiveOnly ? "bg-red-600 border-red-600 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-red-500/50"}`}>
            <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
            EN VIVO
          </button>
        </div>

        {/* Featured stream player */}
        {selectedStream && (
          <div className="mb-8">
            <div className="bg-zinc-900 border border-red-500/30 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-rajdhani font-bold text-white">{selectedStream.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border font-mono ${PLATFORM_COLORS[selectedStream.platform]}`}>
                    {PLATFORM_ICONS[selectedStream.platform]} {selectedStream.platform.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a href={selectedStream.url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-400 hover:border-red-500 font-orbitron text-xs">
                      <ExternalLink className="w-3 h-3 mr-1" /> ABRIR
                    </Button>
                  </a>
                  <button onClick={() => setSelectedStream(null)} className="text-zinc-500 hover:text-white text-xs font-mono">✕ CERRAR</button>
                </div>
              </div>
              {selectedStream.embedUrl ? (
                <div className="aspect-video">
                  <iframe
                    src={selectedStream.embedUrl}
                    className="w-full h-full"
                    allowFullScreen
                    allow="autoplay; encrypted-media"
                    title={selectedStream.title}
                  />
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center bg-zinc-950">
                  <div className="text-center">
                    <Tv className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 font-rajdhani mb-4">Vista previa no disponible</p>
                    <a href={selectedStream.url} target="_blank" rel="noopener noreferrer">
                      <Button className="bg-red-600 hover:bg-red-700 font-orbitron text-xs">
                        <ExternalLink className="w-3 h-3 mr-1" /> VER EN {selectedStream.platform.toUpperCase()}
                      </Button>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Streams grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-zinc-900/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : allStreams.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allStreams.map((stream) => (
              <div key={stream.id}
                onClick={() => setSelectedStream(stream)}
                className="group bg-zinc-900/80 border border-zinc-800 hover:border-red-500/50 rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.1)]">
                <div className="h-36 relative overflow-hidden bg-zinc-950">
                  {stream.thumbnailUrl ? (
                    <img src={stream.thumbnailUrl} alt={stream.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Tv className="w-10 h-10 text-zinc-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                  {stream.isLive && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded font-mono animate-pulse">
                      <Radio className="w-3 h-3" /> EN VIVO
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`text-xs px-2 py-0.5 rounded border font-mono ${PLATFORM_COLORS[stream.platform]}`}>
                      {PLATFORM_ICONS[stream.platform]} {stream.platform.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-rajdhani font-bold text-sm text-white group-hover:text-red-400 transition-colors line-clamp-1 mb-1">{stream.title}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      {stream.viewerCount && stream.viewerCount > 0 && (
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{stream.viewerCount.toLocaleString()}</span>
                      )}
                    </div>
                    <a href={stream.url} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-zinc-500 hover:text-red-400 transition-colors">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Radio className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
            <h3 className="font-orbitron font-bold text-xl text-zinc-600 mb-2">SIN TRANSMISIONES</h3>
            <p className="text-zinc-600 font-rajdhani">No hay transmisiones {showLiveOnly ? "en vivo " : ""}disponibles.</p>
          </div>
        )}
      </div>
    </div>
  );
}
