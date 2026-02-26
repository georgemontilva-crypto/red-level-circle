import { Link } from "wouter";
import { Eye, Radio } from "lucide-react";

export interface StreamCardData {
  id: number;
  title: string;
  streamerName?: string | null;
  platform: "twitch" | "youtube" | "discord" | "other";
  url: string;
  game?: string | null;
  isLive: boolean;
  viewerCount?: number | null;
  thumbnailUrl?: string | null;
}

const PLATFORM_BADGE: Record<string, { label: string; cls: string }> = {
  twitch:  { label: "TWITCH",  cls: "bg-purple-600/20 text-purple-300 border-purple-500/30" },
  youtube: { label: "YOUTUBE", cls: "bg-red-700/20 text-red-300 border-red-500/30" },
  discord: { label: "DISCORD", cls: "bg-indigo-600/20 text-indigo-300 border-indigo-500/30" },
  other:   { label: "STREAM",  cls: "bg-zinc-700/20 text-zinc-300 border-zinc-500/30" },
};

function formatViewers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

interface StreamCardProps {
  stream: StreamCardData;
}

export function StreamCard({ stream }: StreamCardProps) {
  const badge = PLATFORM_BADGE[stream.platform] ?? PLATFORM_BADGE.other;

  return (
    <Link href={`/streams/${stream.id}`}>
      <div className="group relative flex flex-col bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-red-500/60 hover:shadow-[0_0_24px_rgba(220,38,38,0.18)] hover:-translate-y-0.5 select-none">

        {/* ── Thumbnail ── */}
        <div className="relative w-full aspect-video overflow-hidden bg-zinc-950">
          {stream.thumbnailUrl ? (
            <img
              src={stream.thumbnailUrl}
              alt={stream.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Radio className="w-10 h-10 text-zinc-700" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-transparent to-transparent pointer-events-none" />

          {/* EN VIVO badge */}
          {stream.isLive && (
            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded tracking-widest shadow-lg">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              EN VIVO
            </div>
          )}

          {/* Platform badge */}
          <div className={`absolute top-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded border ${badge.cls}`}>
            {badge.label}
          </div>

          {/* Viewer count overlay */}
          {stream.viewerCount != null && stream.viewerCount > 0 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded">
              <Eye className="w-3 h-3 text-red-400" />
              {formatViewers(stream.viewerCount)}
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div className="flex items-start gap-3 p-3">
          {/* Streamer avatar placeholder */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
            <span className="text-xs font-bold text-zinc-400 font-mono">
              {((stream.streamerName ?? stream.title) || "?").charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold font-rajdhani leading-tight line-clamp-2 group-hover:text-red-300 transition-colors">
              {stream.title}
            </p>
            {stream.streamerName && (
              <p className="text-zinc-400 text-xs font-mono mt-0.5 truncate">
                {stream.streamerName}
              </p>
            )}
            {stream.game && (
              <p className="text-zinc-500 text-[11px] font-mono mt-0.5 truncate">
                {stream.game}
              </p>
            )}
          </div>
        </div>

        {/* Red glow bottom line on hover */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </div>
    </Link>
  );
}
