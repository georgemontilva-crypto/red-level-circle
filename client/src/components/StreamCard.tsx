import { useState } from "react";
import { Link } from "wouter";
import { Eye, Radio, Trophy, Video } from "lucide-react";

export interface StreamCardData {
  id: number;
  title: string;
  streamerName?: string | null;
  platform: "twitch" | "youtube" | "discord" | "other";
  url: string;
  embedUrl?: string | null;
  game?: string | null;
  isLive: boolean;
  viewerCount?: number | null;
  thumbnailUrl?: string | null;
  /** "tournament" = official broadcast, "creator" = content creator stream */
  type?: "tournament" | "creator" | null;
}

const PLATFORM_BADGE: Record<string, { label: string; cls: string }> = {
  twitch:  { label: "TWITCH",  cls: "bg-purple-600/20 text-purple-300 border-purple-500/30" },
  youtube: { label: "YOUTUBE", cls: "bg-red-700/20 text-red-300 border-red-500/30" },
  discord: { label: "DISCORD", cls: "bg-indigo-600/20 text-indigo-300 border-indigo-500/30" },
  other:   { label: "STREAM",  cls: "bg-muted/20 text-secondary-foreground border-zinc-500/30" },
};

function formatViewers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

/**
 * Extract Twitch login from a Twitch URL.
 * e.g. https://www.twitch.tv/karapro → "karapro"
 */
function extractTwitchLogin(url: string): string | null {
  try {
    const m = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/**
 * Extract YouTube video/channel ID from a YouTube URL for thumbnail.
 * Supports: watch?v=ID, youtu.be/ID, /live/ID
 */
function extractYouTubeVideoId(url: string): string | null {
  try {
    const m =
      url.match(/[?&]v=([a-zA-Z0-9_-]{11})/) ||
      url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/) ||
      url.match(/\/live\/([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/**
 * Resolve the best thumbnail URL for a stream.
 * Priority: DB thumbnailUrl → Twitch CDN live preview → YouTube maxres → null
 */
function resolveThumbnail(stream: StreamCardData): string | null {
  if (stream.thumbnailUrl) return stream.thumbnailUrl;

  if (stream.platform === "twitch") {
    const login = extractTwitchLogin(stream.url);
    if (login) {
      // Twitch CDN live preview — no API key needed, refreshes every ~60s
      return `https://static-cdn.jtvnw.net/previews-ttv/live_user_${login.toLowerCase()}-440x248.jpg`;
    }
  }

  if (stream.platform === "youtube") {
    const videoId = extractYouTubeVideoId(stream.url);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
  }

  return null;
}

interface StreamCardProps {
  stream: StreamCardData;
}

export function StreamCard({ stream }: StreamCardProps) {
  const badge = PLATFORM_BADGE[stream.platform] ?? PLATFORM_BADGE.other;
  const [hovered, setHovered] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [thumbError, setThumbError] = useState(false);

  // Only show live preview for Twitch streams with embedUrl when hovered
  const canPreview = stream.isLive && !!stream.embedUrl && stream.platform === "twitch";

  // Resolve thumbnail with fallbacks
  const thumbnail = thumbError ? null : resolveThumbnail(stream);

  return (
    <Link href={`/streams/${stream.id}`}>
      <div
        className="group relative flex flex-col bg-card border border-border/60 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-red-500/60 hover:shadow-[0_0_24px_rgba(220,38,38,0.18)] hover:-translate-y-0.5 select-none"
        onMouseEnter={() => canPreview && setHovered(true)}
        onMouseLeave={() => { setHovered(false); setIframeLoaded(false); }}
      >

        {/* ── Thumbnail / Live Preview ── */}
        <div className="relative w-full aspect-video overflow-hidden bg-card">

          {/* Static thumbnail (always rendered, hidden when iframe is loaded) */}
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={stream.title}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                hovered && iframeLoaded ? "opacity-0" : "opacity-100 group-hover:scale-105"
              }`}
              draggable={false}
              onError={() => setThumbError(true)}
            />
          ) : (
            <div className={`absolute inset-0 w-full h-full flex items-center justify-center transition-opacity duration-300 ${hovered && iframeLoaded ? "opacity-0" : "opacity-100"}`}>
              <Radio className="w-10 h-10 text-zinc-700" />
            </div>
          )}

          {/* Live preview iframe — only for Twitch, only on hover */}
          {canPreview && hovered && stream.embedUrl && (
            <iframe
              src={stream.embedUrl}
              className={`absolute inset-0 w-full h-full border-0 transition-opacity duration-500 ${iframeLoaded ? "opacity-100" : "opacity-0"}`}
              allow="autoplay; encrypted-media"
              allowFullScreen={false}
              onLoad={() => setIframeLoaded(true)}
              title={stream.title}
            />
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

          {/* Type badge: TORNEO or CREADOR */}
          {stream.type === "tournament" && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
              <Trophy className="w-2.5 h-2.5" />
              TORNEO
            </div>
          )}
          {stream.type === "creator" && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
              <Video className="w-2.5 h-2.5" />
              CREADOR
            </div>
          )}

          {/* Platform badge */}
          <div className={`absolute top-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded border ${badge.cls}`}>
            {badge.label}
          </div>

          {/* Viewer count overlay */}
          {stream.viewerCount != null && stream.viewerCount > 0 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-background/70 text-white text-[10px] font-mono px-2 py-0.5 rounded">
              <Eye className="w-3 h-3 text-red-400" />
              {formatViewers(stream.viewerCount)}
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div className="flex items-start gap-3 p-3">
          {/* Streamer avatar placeholder */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden">
            <span className="text-xs font-bold text-muted-foreground font-mono">
              {((stream.streamerName ?? stream.title) || "?").charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold font-rajdhani leading-tight line-clamp-2 group-hover:text-red-300 transition-colors">
              {stream.title}
            </p>
            {stream.streamerName && (
              <p className="text-muted-foreground text-xs font-mono mt-0.5 truncate">
                {stream.streamerName}
              </p>
            )}
            {stream.game && (
              <p className="text-muted-foreground text-[11px] font-mono mt-0.5 truncate">
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
