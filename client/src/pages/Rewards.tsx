import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Coins, Play, CheckCircle, Clock, Zap, Gift,
  Video, Megaphone, Calendar, Share2, Lock, X,
  Volume2, VolumeX, Shield, ShoppingBag, BadgeCheck
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { SectionBanner } from "@/components/SectionBanner";

// ─── Types ────────────────────────────────────────────────────────────────────
type Task = {
  id: number;
  title: string;
  description?: string | null;
  type: string;
  reward: number;
  contentUrl?: string | null;
  thumbnailUrl?: string | null;
  sponsorName?: string | null;
  sponsorLogoUrl?: string | null;
  expiresAt?: string | Date | null;
  durationSeconds?: number | null;
};

// ─── Format seconds to mm:ss ──────────────────────────────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// ─── Reward Claimed Modal (Discord-style) ─────────────────────────────────────
function RewardClaimedModal({
  task,
  newBalance,
  onClose,
}: {
  task: Task;
  newBalance: number;
  onClose: () => void;
}) {
  const [, navigate] = useLocation();

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ animation: "fadeIn 0.2s ease" }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "#1e1f22",
          animation: "scaleIn 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        {/* Breadcrumb */}
        <div className="px-5 pt-5 pb-0 flex items-center gap-2 text-xs text-zinc-500 font-mono">
          <span>Recompensa</span>
          <span>›</span>
          <span className="text-zinc-300">RLC Coins</span>
        </div>

        {/* Content */}
        <div className="flex gap-5 px-5 pt-4 pb-5">
          {/* Left: coin + amount */}
          <div className="flex flex-col items-center gap-3 min-w-[120px]">
            {/* Animated coin */}
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center relative"
              style={{
                background: "radial-gradient(circle at 35% 35%, oklch(0.80 0.20 85), oklch(0.55 0.22 75))",
                boxShadow: "0 0 40px oklch(0.65 0.22 80 / 0.6), inset 0 2px 8px rgba(255,255,255,0.3)",
                animation: "coinPop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both",
              }}
            >
              <Coins size={52} className="text-white drop-shadow-lg" />
              {/* Sparkles */}
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-yellow-300"
                  style={{
                    top: `${20 + Math.sin(i * 60 * Math.PI / 180) * 55}%`,
                    left: `${50 + Math.cos(i * 60 * Math.PI / 180) * 55}%`,
                    animation: `sparkle 0.6s ease ${0.2 + i * 0.05}s both`,
                    opacity: 0,
                  }}
                />
              ))}
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1.5 justify-center">
                <Coins size={18} className="text-yellow-400" />
                <span className="text-white font-black text-3xl font-mono">+{task.reward}</span>
              </div>
              <p className="text-zinc-400 text-xs mt-1">
                Tu saldo ahora es <span className="text-white font-bold">{newBalance}</span>. ¡Buen trabajo!
              </p>
            </div>
            <button
              onClick={() => { onClose(); navigate("/shop"); }}
              className="w-full py-2 rounded-xl text-sm font-bold text-zinc-300 border border-zinc-600 hover:border-zinc-400 hover:text-white transition-all"
              style={{ background: "#2b2d31" }}
            >
              <span className="flex items-center justify-center gap-1.5">
                <ShoppingBag size={13} /> Explorar la tienda
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="w-px bg-zinc-700/60 self-stretch" />

          {/* Right: task info */}
          <div className="flex flex-col justify-between flex-1 min-w-0">
            {/* Thumbnail */}
            {task.thumbnailUrl ? (
              <img
                src={task.thumbnailUrl}
                alt={task.title}
                className="w-full rounded-xl object-cover mb-3"
                style={{ aspectRatio: "16/9" }}
              />
            ) : (
              <div
                className="w-full rounded-xl mb-3 flex items-center justify-center bg-zinc-800"
                style={{ aspectRatio: "16/9" }}
              >
                <Gift size={28} className="text-zinc-600" />
              </div>
            )}
            <div>
              <p className="text-white font-bold text-sm leading-snug">{task.title}</p>
              {task.sponsorName && (
                <p className="text-zinc-500 text-xs mt-0.5">{task.sponsorName}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="mt-3 w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:brightness-110"
              style={{ background: "oklch(0.45 0.18 250)", boxShadow: "0 2px 12px oklch(0.45 0.18 250 / 0.3)" }}
            >
              Ver recompensa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Video Player Modal ───────────────────────────────────────────────────────
function VideoPlayerModal({
  task,
  onClose,
  onClaimed,
}: {
  task: Task;
  onClose: () => void;
  onClaimed: (newBalance: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ytIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const required = task.durationSeconds ?? 30;
  const isYoutube = task.contentUrl?.includes("youtube") || task.contentUrl?.includes("youtu.be");
  const isDirectVideo = task.contentUrl && !isYoutube;
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [claiming, setClaiming] = useState(false);
  // ytPlaying: starts true — auto-play when modal opens
  const [ytPlaying, setYtPlaying] = useState(isYoutube ? true : false);

  const claimMutation = trpc.rewards.claim.useMutation({
    onSuccess: (data) => {
      setClaiming(false);
      onClaimed(data.newBalance);
    },
    onError: (err) => {
      setClaiming(false);
      toast.error(err.message);
    },
  });

  // Direct video: sync elapsed with currentTime
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isDirectVideo) return;

    const onTimeUpdate = () => {
      const ct = Math.floor(video.currentTime);
      setElapsed(ct);
      if (ct >= required && !videoCompleted) {
        setVideoCompleted(true);
        video.pause();
      }
    };
    const onSeeking = () => {
      if (video.currentTime > elapsed + 1.5) video.currentTime = elapsed;
    };
    const onPause = () => {
      if (!videoCompleted && video.currentTime < required) {
        setTimeout(() => video.play().catch(() => {}), 100);
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("seeking", onSeeking);
    video.addEventListener("pause", onPause);
    video.play().catch(() => {});

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("seeking", onSeeking);
      video.removeEventListener("pause", onPause);
    };
  }, [elapsed, required, videoCompleted, isDirectVideo]);

  // YouTube: tick counter when ytPlaying is true
  useEffect(() => {
    if (!isYoutube) return;
    if (!ytPlaying || videoCompleted) {
      if (ytIntervalRef.current) { clearInterval(ytIntervalRef.current); ytIntervalRef.current = null; }
      return;
    }
    ytIntervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= required) {
          setVideoCompleted(true);
          if (ytIntervalRef.current) { clearInterval(ytIntervalRef.current); ytIntervalRef.current = null; }
        }
        return next;
      });
    }, 1000);
    return () => {
      if (ytIntervalRef.current) { clearInterval(ytIntervalRef.current); ytIntervalRef.current = null; }
    };
  }, [isYoutube, ytPlaying, videoCompleted, required]);

  // Auto-send playVideo to iframe after it loads (YouTube needs ~1.5s to accept commands)
  useEffect(() => {
    if (!isYoutube) return;
    const timer = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "playVideo", args: [] }),
        "*"
      );
    }, 1500);
    return () => clearTimeout(timer);
  }, [isYoutube]);

  // Send command to YouTube iframe via postMessage
  const ytCommand = (cmd: "playVideo" | "pauseVideo") => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: cmd, args: [] }),
      "*"
    );
  };

  const toggleYtPlay = () => {
    if (ytPlaying) {
      ytCommand("pauseVideo");
      setYtPlaying(false);
    } else {
      ytCommand("playVideo");
      setYtPlaying(true);
    }
  };

  const progress = Math.min((elapsed / required) * 100, 100);
  const remaining = Math.max(required - elapsed, 0);

  const getYoutubeEmbedUrl = (url: string) => {
    let videoId = "";
    if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1].split("?")[0];
    else if (url.includes("watch?v=")) videoId = url.split("watch?v=")[1].split("&")[0];
    else if (url.includes("embed/")) return url + (url.includes("?") ? "&" : "?") + "autoplay=1";
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&showinfo=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
  };

  const handleClaim = () => {
    if (!videoCompleted || claiming) return;
    setClaiming(true);
    claimMutation.mutate({ taskId: task.id });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      style={{ animation: "fadeIn 0.2s ease" }}
    >
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#111214", maxWidth: "min(900px, 95vw)", animation: "scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        {/* Video */}
        <div className="relative bg-black" style={{ aspectRatio: "16/9" }}>
          {isDirectVideo ? (
            <video
              ref={videoRef}
              src={task.contentUrl!}
              className="w-full h-full object-cover"
              playsInline
              muted={muted}
              disablePictureInPicture
              controlsList="nodownload nofullscreen noremoteplayback"
              style={{ pointerEvents: "none" }}
            />
          ) : isYoutube ? (
            <iframe
              ref={iframeRef}
              src={getYoutubeEmbedUrl(task.contentUrl!)}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
              <Gift size={48} className="text-zinc-700" />
            </div>
          )}

          {/* YouTube play/pause overlay — clickeable para pausar/reanudar el contador */}
          {isYoutube && !videoCompleted && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ cursor: "pointer", background: ytPlaying ? "transparent" : "rgba(0,0,0,0.50)" }}
              onClick={toggleYtPlay}
            >
              {!ytPlaying && (
                <div className="flex flex-col items-center gap-2" style={{ animation: "fadeIn 0.2s ease" }}>
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-white/30"
                    style={{ background: "rgba(0,0,0,0.65)" }}
                  >
                    {elapsed === 0
                      ? <Play size={28} className="text-white ml-1" />
                      : <svg width="20" height="24" viewBox="0 0 20 24" fill="white"><rect x="0" y="0" width="7" height="24" rx="2"/><rect x="13" y="0" width="7" height="24" rx="2"/></svg>
                    }
                  </div>
                  <p className="text-white/80 text-xs font-semibold">
                    {elapsed === 0 ? "Haz clic para iniciar" : "Contador pausado — clic para continuar"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Anti-skip badge */}
          {isDirectVideo && !videoCompleted && (
            <div className="absolute inset-0 pointer-events-none flex items-end justify-start p-3">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 text-xs text-zinc-400 font-mono">
                <Shield size={10} /> No se puede adelantar
              </div>
            </div>
          )}

          {/* Mute */}
          {isDirectVideo && (
            <button
              onClick={() => { setMuted((m) => !m); if (videoRef.current) videoRef.current.muted = !muted; }}
              className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
            >
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          )}

          {/* Completed overlay */}
          {videoCompleted && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.6)", animation: "fadeIn 0.3s ease" }}
            >
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: "#22c55e", boxShadow: "0 0 30px #22c55e80", animation: "coinPop 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}
                >
                  <CheckCircle size={32} className="text-white" />
                </div>
                <p className="text-white font-bold text-lg">¡Video completado!</p>
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5" style={{ background: "#1a1a1a" }}>
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: "oklch(0.55 0.22 25)",
              boxShadow: "0 0 8px oklch(0.55 0.22 25 / 0.7)",
            }}
          />
        </div>

        {/* Bottom bar */}
        <div className="px-3 sm:px-5 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          {/* Info row */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {task.sponsorLogoUrl ? (
              <img src={task.sponsorLogoUrl} alt="" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-zinc-700 shrink-0" />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                <Video size={14} className="text-zinc-500" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white text-xs sm:text-sm font-bold leading-tight truncate max-w-[180px] sm:max-w-[300px]">{task.title}</p>
              {task.sponsorName && (
                <div className="flex items-center gap-1">
                  <BadgeCheck size={10} className="text-green-400 shrink-0" />
                  <p className="text-zinc-400 text-xs truncate">{task.sponsorName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={videoCompleted ? handleClaim : undefined}
            disabled={!videoCompleted || claiming}
            className="w-full sm:w-auto shrink-0 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5"
            style={{
              background: videoCompleted
                ? "oklch(0.55 0.22 25)"
                : ytPlaying
                ? "oklch(0.35 0.22 25 / 0.6)"
                : "oklch(0.55 0.22 25 / 0.20)",
              color: "white",
              border: `1px solid ${videoCompleted ? "oklch(0.55 0.22 25)" : "oklch(0.55 0.22 25 / 0.35)"}`,
              boxShadow: videoCompleted ? "0 0 20px oklch(0.55 0.22 25 / 0.5)" : "none",
              cursor: videoCompleted ? "pointer" : "default",
              opacity: claiming ? 0.7 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {claiming ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : videoCompleted ? (
              <><CheckCircle size={13} /> <span>Reclamar +{task.reward} RLC 🎉</span></>
            ) : ytPlaying ? (
              <><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" /> <span>Viendo... ({formatTime(remaining)})</span></>
            ) : (
              <><Play size={13} /> <span>Ver video ({formatTime(remaining)})</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Quest Card (Discord-style rediseñado) ────────────────────────────────────
function QuestCard({
  task,
  isAuthenticated,
  onStart,
  claimed,
}: {
  task: Task;
  isAuthenticated: boolean;
  onStart: (task: Task) => void;
  claimed: boolean;
}) {
  const expiresAt = task.expiresAt ? new Date(task.expiresAt) : null;
  const expiresLabel = expiresAt ? `Termina el ${expiresAt.getDate()}/${expiresAt.getMonth() + 1}` : null;
  const isVideo = task.type === "video" || task.type === "ad";

  // Label de tipo de misión
  const missionTypeLabel =
    task.type === "video" ? "MISIÓN DE VIDEO" :
    task.type === "ad" ? "VER ANUNCIO" :
    task.type === "daily_login" ? "LOGIN DIARIO" :
    task.type === "share" ? "COMPARTIR" : "MISIÓN";

  // Icono del tipo
  const MissionIcon =
    task.type === "video" ? Video :
    task.type === "ad" ? Megaphone :
    task.type === "daily_login" ? Calendar :
    task.type === "share" ? Share2 : Zap;

  return (
    <div
      className="rounded-xl overflow-hidden border border-zinc-800/60 hover:border-zinc-600 transition-all duration-200 group flex flex-col"
      style={{ background: "#1e1f22" }}
    >
      {/* ── Thumbnail ── */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
        {task.thumbnailUrl ? (
          <img
            src={task.thumbnailUrl}
            alt={task.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" }}>
            {isVideo
              ? <Play size={36} className="text-zinc-600" />
              : <Gift size={36} className="text-zinc-600" />}
          </div>
        )}

        {/* Play overlay on hover */}
        {isVideo && task.thumbnailUrl && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}>
              <Play size={24} className="text-white ml-1" />
            </div>
          </div>
        )}

        {/* Play button always visible (top-right) */}
        {isVideo && (
          <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
            <Play size={14} className="text-white ml-0.5" />
          </div>
        )}

        {/* Reward badge top-left */}
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}>
          <Coins size={11} className="text-yellow-400" />
          <span className="text-yellow-400 font-bold font-mono text-xs">+{task.reward}</span>
        </div>
      </div>

      {/* ── Info section (fuera del thumbnail) ── */}
      <div className="px-3 py-2.5 flex flex-col gap-2.5 flex-1" style={{ background: "#1e1f22" }}>

        {/* Sponsor row + expiry */}
        <div className="flex items-center justify-between gap-2">
          {task.sponsorName ? (
            <div className="flex items-center gap-1.5">
              {task.sponsorLogoUrl ? (
                <img src={task.sponsorLogoUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
              ) : null}
              <span className="text-zinc-400 text-xs">
                Patrocinado por{" "}
              </span>
              <BadgeCheck size={13} className="text-green-400 shrink-0" />
              <span className="text-white text-xs font-semibold">{task.sponsorName}</span>
            </div>
          ) : (
            <span />
          )}
          {expiresLabel && (
            <span className="text-zinc-500 text-xs font-mono shrink-0">{expiresLabel}</span>
          )}
        </div>

        {/* Mission icon + type label + title */}
        <div className="flex items-start gap-2.5">
          {/* Icon circle: sponsor logo or mission icon */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
            style={{ background: "#2b2d31", border: "1.5px solid #3f4147" }}
          >
            {task.sponsorLogoUrl ? (
              <img src={task.sponsorLogoUrl} alt={task.sponsorName ?? ""} className="w-full h-full object-cover" />
            ) : (
              <MissionIcon size={16} style={{ color: "oklch(0.65 0.22 25)" }} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Type label in RLC red */}
            <p
              className="text-xs font-bold font-mono uppercase tracking-wider mb-0.5"
              style={{ color: "oklch(0.65 0.22 25)" }}
            >
              {task.sponsorName ? `MISIÓN ${task.sponsorName.toUpperCase()}: ${missionTypeLabel}` : missionTypeLabel}
            </p>
            {/* Title */}
            <p className="text-white text-sm font-bold leading-snug">
              Canjear <Coins size={11} className="inline text-yellow-400 mx-0.5 -mt-0.5" />
              <span className="text-yellow-400 font-mono">{task.reward}</span> de RLC Coins
            </p>
            {/* Description */}
            {task.description && (
              <p className="text-zinc-500 text-xs mt-0.5 line-clamp-1">{task.description}</p>
            )}
          </div>
        </div>

        {/* ── CTA Button ── */}
        <div className="mt-auto pt-1">
          {claimed ? (
            <div
              className="w-full py-2.5 rounded-lg font-bold text-sm text-center flex items-center justify-center gap-2"
              style={{ background: "#2b2d31", color: "#6b7280" }}
            >
              <CheckCircle size={14} className="text-green-500" /> Reclamado
            </div>
          ) : !isAuthenticated ? (
            <a
              href={getLoginUrl()}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-bold text-sm transition-all hover:brightness-110"
              style={{ background: "#2b2d31", color: "#9ca3af" }}
            >
              <Lock size={14} /> Inicia sesión para ganar
            </a>
          ) : (
            <button
              onClick={() => onStart(task)}
              className="w-full py-2.5 rounded-lg font-bold text-sm text-white transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                background: "oklch(0.50 0.22 25)",
                boxShadow: "0 2px 12px oklch(0.50 0.22 25 / 0.30)",
              }}
            >
              {isVideo ? (
                <><Play size={14} /> Ver video</>
              ) : task.type === "daily_login" ? (
                "Reclamar login diario"
              ) : (
                "Iniciar misión"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Rewards() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "claimed">("all");
  const [watchingTask, setWatchingTask] = useState<Task | null>(null);
  const [claimedTasks, setClaimedTasks] = useState<Set<number>>(new Set());
  const [rewardResult, setRewardResult] = useState<{ task: Task; newBalance: number } | null>(null);

  const { data: tasks = [] } = trpc.rewards.list.useQuery();
  const { data: me, refetch: refetchMe } = trpc.auth.me.useQuery();

  const handleStart = useCallback((task: Task) => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    setWatchingTask(task);
  }, [isAuthenticated]);

  const handleClaimed = useCallback((newBalance: number) => {
    if (!watchingTask) return;
    const task = watchingTask;
    setClaimedTasks((prev) => { const n = new Set(prev); n.add(task.id); return n; });
    setWatchingTask(null);
    setRewardResult({ task, newBalance });
    refetchMe();
  }, [watchingTask, refetchMe]);

  const userBalance = (me as { rlcBalance?: number } | null)?.rlcBalance ?? 0;
  const typedTasks = tasks as Task[];
  const displayTasks = activeTab === "claimed"
    ? typedTasks.filter((t) => claimedTasks.has(t.id))
    : typedTasks;

  return (
    <div className="min-h-screen" style={{ background: "#0b0b0d" }}>
      {/* ── Header bar ── */}
      <div className="sticky top-0 z-30 border-b border-zinc-800/60" style={{ background: "#111214" }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <nav className="flex items-center gap-1">
            {(["all", "claimed"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-sm font-mono transition-all ${
                  activeTab === tab ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab === "all" ? "Todas las misiones" : "Misiones reclamadas"}
              </button>
            ))}
          </nav>
          {isAuthenticated && (
            <div className="flex items-center gap-1.5 text-sm font-mono">
              <Coins size={14} className="text-yellow-400" />
              <span className="text-white font-bold">{userBalance}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Section Banner ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4">
        <SectionBanner sectionKey="rewards" height="h-32 sm:h-44" />
      </div>

      {/* ── Quest grid ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-lg">
            {activeTab === "all" ? "Misiones disponibles" : "Misiones reclamadas"}
          </h2>
          <span className="text-zinc-500 text-sm font-mono">{displayTasks.length} misiones</span>
        </div>

        {displayTasks.length === 0 ? (
          <div className="text-center py-24">
            <Gift size={48} className="text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 font-mono">
              {activeTab === "claimed" ? "Aún no has reclamado ninguna misión" : "No hay misiones disponibles aún"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayTasks.map((task) => (
              <QuestCard
                key={task.id}
                task={task as Task}
                isAuthenticated={isAuthenticated}
                onStart={handleStart}
                claimed={claimedTasks.has(task.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Video Modal ── */}
      {watchingTask && (
        <VideoPlayerModal
          task={watchingTask}
          onClose={() => setWatchingTask(null)}
          onClaimed={handleClaimed}
        />
      )}

      {/* ── Reward Claimed Modal ── */}
      {rewardResult && (
        <RewardClaimedModal
          task={rewardResult.task}
          newBalance={rewardResult.newBalance}
          onClose={() => setRewardResult(null)}
        />
      )}
    </div>
  );
}
