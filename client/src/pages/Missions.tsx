import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, CheckCircle2, Clock, X,
  RefreshCw, Lock, MoreHorizontal, Coins,
  Volume2, VolumeX, Maximize, RotateCcw, RotateCw,
} from "lucide-react";
import { toast } from "sonner";

// ─── Ad Hero Banner (same as Home) ───────────────────────────────────────────
const SLIDE_DURATION = 8000;
function MissionsHeroBanner() {
  const { data: adsData } = trpc.ads.list.useQuery();
  const trackClick = trpc.ads.trackClick.useMutation();
  const trackImpression = trpc.ads.trackImpression.useMutation();
  const slides = (adsData ?? []).filter((a: any) => a.isActive && a.bannerImage);
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const progressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const goTo = useCallback((idx: number) => {
    if (idx === activeIdx) return;
    if (progressRef.current) clearTimeout(progressRef.current);
    setTransitioning(true);
    setTimeout(() => {
      setActiveIdx(idx);
      setProgress(0);
      startTimeRef.current = Date.now();
      setTransitioning(false);
    }, 250);
  }, [activeIdx]);

  useEffect(() => {
    if (slides.length === 0) return;
    startTimeRef.current = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        const next = (activeIdx + 1) % slides.length;
        setTransitioning(true);
        setTimeout(() => {
          setActiveIdx(next);
          setProgress(0);
          startTimeRef.current = Date.now();
          setTransitioning(false);
        }, 250);
        return;
      }
      progressRef.current = setTimeout(tick, 30);
    };
    progressRef.current = setTimeout(tick, 30);
    return () => { if (progressRef.current) clearTimeout(progressRef.current); };
  }, [activeIdx, slides.length]);

  useEffect(() => {
    if (slides.length > 0 && slides[activeIdx]) {
      trackImpression.mutate({ adId: slides[activeIdx].id });
    }
  }, [activeIdx, slides.length]);

  const current = slides[activeIdx];
  if (slides.length === 0) return null;

  return (
    <div
      className="lg:grid max-lg:block w-full"
      style={{ gridTemplateColumns: "3fr 1fr", gap: "24px" }}
    >
      {/* Banner principal */}
      <div
        className="relative overflow-hidden cursor-pointer w-full"
        style={{ height: "clamp(240px, 50vw, 480px)", borderRadius: "12px" }}
        onClick={() => {
          if (current?.destinationUrl) {
            trackClick.mutate({ adId: current.id });
            window.open(current.destinationUrl, "_blank");
          }
        }}
      >
        <div className="absolute inset-0" style={{ opacity: transitioning ? 0 : 1, transition: "opacity 250ms ease" }}>
          {current?.mobileImage && (
            <img src={current.mobileImage} alt={current?.brandName ?? ""} className="block md:hidden w-full h-full object-cover object-center" />
          )}
          <img
            src={current?.bannerImage ?? ""}
            alt={current?.brandName ?? ""}
            className={current?.mobileImage ? "hidden md:block w-full h-full object-cover object-center" : "w-full h-full object-cover object-center"}
          />
        </div>
        <div className="absolute top-3 left-3 px-2 py-0.5 rounded text-xs" style={{ background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.45)" }}>Publicidad</div>
      </div>
      {/* Tarjetas laterales — solo desktop */}
      <div className="hidden lg:flex flex-col" style={{ gap: "4px" }}>
        {slides.map((ad: any, i: number) => {
          const isActive = i === activeIdx;
          return (
            <div
              key={ad.id}
              className="relative cursor-pointer overflow-hidden"
              style={{ display: "flex", alignItems: "center", gap: "14px", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", isolation: "isolate" }}
              onClick={() => goTo(i)}
            >
              {isActive && (
                <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(255,255,255,0.07)", width: `${progress}%`, transition: "width 30ms linear", borderRadius: "8px", zIndex: 0 }} />
              )}
              <div className="shrink-0 overflow-hidden relative z-10 flex items-center justify-center" style={{ width: "56px", height: "56px", borderRadius: "8px", background: "#1a1a1f" }}>
                <img src={ad.logoImage ?? ad.bannerImage} alt={ad.brandName} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 relative z-10">
                <p className="text-sm font-semibold leading-snug" style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.65)", wordBreak: "break-word", whiteSpace: "normal" }}>{ad.brandName}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Mission = {
  id: number;
  title: string;
  description: string | null;
  bannerUrl: string | null;
  videoUrl: string;
  sponsorName: string | null;
  sponsorLogo: string | null;
  rewardRlc: number;
  requiredWatchSeconds: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
};

type UserMission = {
  id: number;
  userId: number;
  missionId: number;
  accepted: boolean;
  watchedSeconds: number;
  completed: boolean;
  claimed: boolean;
  completedAt: string | null;
};

// ─── Circular reward icon (Discord-style) ────────────────────────────────────
function RewardIcon({ size = 64, progress = 0, logoUrl }: { size?: number; progress?: number; logoUrl?: string | null }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;
  const isComplete = progress >= 100;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
        {progress > 0 && (
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={isComplete ? "#22c55e" : "#ef4444"}
            strokeWidth={3}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.4s ease" }}
          />
        )}
      </svg>
      <div
        className="absolute inset-[4px] rounded-full overflow-hidden flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #1a0a0a, #2d1010)" }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="" className="w-full h-full object-contain p-1" />
        ) : (
          <Coins size={size * 0.38} className="text-red-400" />
        )}
      </div>
    </div>
  );
}

// ─── Format time remaining ────────────────────────────────────────────────────
function formatTimeRemaining(endDate: string | null): string | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `Termina el ${end.getDate()}/${end.getMonth() + 1}`;
  if (hours > 0) return `${hours}h ${mins}m restantes`;
  return `${mins}m restantes`;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Custom Video Player Controls (Discord-style) ────────────────────────────
// No native controls — custom play/pause, skip ±10s, mute, time, fullscreen.
// The seekbar is completely absent so users cannot skip forward.
function CustomVideoControls({
  videoRef,
  currentTime,
  duration,
  isPlaying,
  isMuted,
  onPlayPause,
  onMute,
  onSkip,
  onFullscreen,
}: {
  videoRef: React.RefObject<HTMLVideoElement>;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isMuted: boolean;
  onPlayPause: () => void;
  onMute: () => void;
  onSkip: (delta: number) => void;
  onFullscreen: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
    >
      {/* Play / Pause */}
      <button
        onClick={onPlayPause}
        className="text-white/90 hover:text-white transition-colors flex-shrink-0"
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
      </button>

      {/* Skip back 10s */}
      <button
        onClick={() => onSkip(-10)}
        className="text-white/70 hover:text-white transition-colors flex-shrink-0 relative"
        title="Retroceder 10s"
      >
        <RotateCcw size={16} />
        <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold mt-0.5">10</span>
      </button>

      {/* Skip forward 10s — only allowed up to accumulated watch time */}
      <button
        onClick={() => onSkip(10)}
        className="text-white/70 hover:text-white transition-colors flex-shrink-0 relative"
        title="Avanzar 10s (solo hasta lo visto)"
      >
        <RotateCw size={16} />
        <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold mt-0.5">10</span>
      </button>

      {/* Time display */}
      <span className="text-white/70 text-xs font-mono flex-shrink-0">
        {formatTime(currentTime)} / {formatTime(duration || 0)}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Mute */}
      <button
        onClick={onMute}
        className="text-white/70 hover:text-white transition-colors flex-shrink-0"
      >
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>

      {/* Fullscreen */}
      <button
        onClick={onFullscreen}
        className="text-white/70 hover:text-white transition-colors flex-shrink-0"
      >
        <Maximize size={16} />
      </button>
    </div>
  );
}

// ─── Mission Video Player Modal (Discord-style) ───────────────────────────────
function MissionVideoPlayer({
  mission,
  userMission,
  onClose,
  onProgressUpdate,
  onClaim,
}: {
  mission: Mission;
  userMission: UserMission | null;
  onClose: () => void;
  onProgressUpdate: (watchedSeconds: number) => void;
  onClaim: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Accumulated real watch time (anti-fraud: only counts while playing, not seeking)
  const accumulatedRef = useRef(userMission?.watchedSeconds ?? 0);
  const lastReportedRef = useRef(userMission?.watchedSeconds ?? 0);

  const [watchedSeconds, setWatchedSeconds] = useState(userMission?.watchedSeconds ?? 0);
  const [isCompleted, setIsCompleted] = useState(userMission?.completed ?? false);
  const [isClaimed, setIsClaimed] = useState(userMission?.claimed ?? false);
  const [tabWarning, setTabWarning] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // Player UI state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateProgress = trpc.missions.updateProgress.useMutation();
  const claimMutation = trpc.missions.claim.useMutation();

  const required = mission.requiredWatchSeconds;
  const percent = Math.min((watchedSeconds / required) * 100, 100);

  // ── Auto-hide controls after 3s of inactivity ──────────────────────────────
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  // ── Tab visibility fraud detection ─────────────────────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        videoRef.current?.pause();
        setTabWarning(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // ── Video event listeners ───────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let tickInterval: ReturnType<typeof setInterval> | null = null;
    let reportInterval: ReturnType<typeof setInterval> | null = null;

    // In replay mode (already claimed), play freely without tracking
    const isReplayMode = userMission?.claimed === true;

    const startTracking = () => {
      setIsPlaying(true);
      if (isReplayMode) return; // No tracking needed in replay mode
      // Count 1 real second of watch time per tick
      tickInterval = setInterval(() => {
        accumulatedRef.current = Math.min(accumulatedRef.current + 1, required);
        setWatchedSeconds(accumulatedRef.current);
        if (accumulatedRef.current >= required) {
          setIsCompleted(true);
          // Do NOT pause in replay mode — but we won't reach here anyway
        }
      }, 1000);
      // Report to server every 5s
      reportInterval = setInterval(async () => {
        const current = accumulatedRef.current;
        if (current <= lastReportedRef.current) return;
        lastReportedRef.current = current;
        try {
          const result = await updateProgress.mutateAsync({ missionId: mission.id, watchedSeconds: current });
          if (result.completed) { setIsCompleted(true); }
          onProgressUpdate(current);
        } catch (e) { console.error("Progress update failed", e); }
      }, 5000);
    };

    const stopTracking = () => {
      setIsPlaying(false);
      if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
      if (reportInterval) { clearInterval(reportInterval); reportInterval = null; }
    };

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => setDuration(video.duration);

    video.addEventListener("play", startTracking);
    video.addEventListener("pause", stopTracking);
    video.addEventListener("ended", stopTracking);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      stopTracking();
      video.removeEventListener("play", startTracking);
      video.removeEventListener("pause", stopTracking);
      video.removeEventListener("ended", stopTracking);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [mission.id, required]);

  // ── Anti-cheat: block seeking forward beyond accumulated time ───────────────
  // We intercept the seeking event and snap back if user tries to go past what they've watched.
  // In replay mode (already claimed), seeking is unrestricted
  const isReplayMode = userMission?.claimed === true;

  const handleSeeking = useCallback(() => {
    if (isReplayMode) return; // Allow free seeking in replay mode
    const video = videoRef.current;
    if (!video) return;
    // Allow seeking backward freely, but cap forward seeks at accumulated seconds
    if (video.currentTime > accumulatedRef.current + 0.5) {
      video.currentTime = accumulatedRef.current;
    }
  }, [isReplayMode]);

  // ── Custom controls handlers ────────────────────────────────────────────────
  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
    resetControlsTimer();
  };

  const handleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleSkip = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = video.currentTime + delta;
    // Forward skip: cap at accumulated watch time
    if (delta > 0) {
      video.currentTime = Math.min(newTime, accumulatedRef.current);
    } else {
      video.currentTime = Math.max(0, newTime);
    }
    resetControlsTimer();
  };

  const handleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  };

  const handleClaim = async () => {
    if (claiming || isClaimed) return;
    setClaiming(true);
    try {
      // Flush final progress to server before claiming
      const current = accumulatedRef.current;
      if (current > lastReportedRef.current) {
        try {
          await updateProgress.mutateAsync({ missionId: mission.id, watchedSeconds: current });
          lastReportedRef.current = current;
        } catch (e) {
          console.error("Final flush failed", e);
        }
      }
      await claimMutation.mutateAsync({ missionId: mission.id });
      setIsClaimed(true);
      toast.success(`¡Reclamaste ${mission.rewardRlc} RLC! 🎉`);
      onClaim();
    } catch (e: any) {
      const msg = e?.message ?? "Error al reclamar la recompensa";
      toast.error(msg);
      console.error("Claim failed", e);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.96, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 16 }}
        className="relative w-full max-w-[1100px] rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#111214" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white/60 hover:text-white hover:bg-black/70 transition-all"
        >
          <X size={16} />
        </button>

        {/* Video area — NO native controls */}
        <div
          ref={containerRef}
          className="relative bg-black select-none"
          style={{ aspectRatio: "16/9" }}
          onMouseMove={resetControlsTimer}
          onMouseEnter={resetControlsTimer}
          onClick={handlePlayPause}
        >
          <video
            ref={videoRef}
            src={mission.videoUrl}
            className="w-full h-full object-contain"
            // NO controls prop — completely custom player
            disablePictureInPicture
            onSeeking={handleSeeking}
            onContextMenu={(e) => e.preventDefault()}
            playsInline
          />

          {/* Center play/pause overlay on click */}
          <AnimatePresence>
            {!isPlaying && !tabWarning && (
              <motion.div
                key="play-overlay"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-black/60">
                  <Play size={28} fill="white" className="text-white ml-1" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab warning overlay */}
          <AnimatePresence>
            {tabWarning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/70 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-[#1e1f22]/95 rounded-2xl px-6 py-5 max-w-xs text-center shadow-xl border border-white/10">
                  <p className="text-white/90 text-sm leading-relaxed">
                    Pausamos el video mientras no estabas. Reanúdalo para seguir progresando en tu misión.
                  </p>
                  <button
                    onClick={() => { setTabWarning(false); videoRef.current?.play(); }}
                    className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all"
                    style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                  >
                    Reanudar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Custom controls bar — appears on hover/activity */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-0 left-0 right-0 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <CustomVideoControls
                  videoRef={videoRef}
                  currentTime={currentTime}
                  duration={duration}
                  isPlaying={isPlaying}
                  isMuted={isMuted}
                  onPlayPause={handlePlayPause}
                  onMute={handleMute}
                  onSkip={handleSkip}
                  onFullscreen={handleFullscreen}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mission progress bar (the ONLY progress bar — red, below video, not interactive) */}
        <div className="h-1 w-full" style={{ background: "rgba(255,255,255,0.08)" }}>
          <motion.div
            className="h-full"
            style={{ background: percent >= 100 ? "#22c55e" : "#ef4444" }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Bottom info bar (Discord-style) */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ background: "#111214" }}>
          <RewardIcon size={44} progress={percent} logoUrl={mission.sponsorLogo} />

          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{mission.title}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {mission.sponsorName && (
                <>
                  <CheckCircle2 size={11} className="text-green-400 flex-shrink-0" />
                  <span className="text-white/50 text-xs">{mission.sponsorName}</span>
                  <span className="text-white/20 text-xs">·</span>
                </>
              )}
              <span className="text-white/50 text-xs truncate">
                {isClaimed
                  ? "Recompensa reclamada"
                  : isCompleted
                  ? `¡Completado! Reclama tus ${mission.rewardRlc} RLC`
                  : `${formatTime(watchedSeconds)} / ${formatTime(required)}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isClaimed ? (
              // Estado gris permanente — ya reclamado, no se puede volver a reclamar
              <button
                disabled
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold cursor-not-allowed"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <CheckCircle2 size={14} className="text-green-400" />
                Recompensa reclamada
              </button>
            ) : isCompleted ? (
              <motion.button
                whileHover={claiming ? {} : { scale: 1.02 }}
                whileTap={claiming ? {} : { scale: 0.98 }}
                onClick={handleClaim}
                disabled={claiming}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60 flex items-center gap-1.5"
                style={{ background: claiming ? "rgba(255,255,255,0.15)" : "linear-gradient(135deg, #ef4444, #dc2626)" }}
              >
                {claiming ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Reclamando...</>
                ) : (
                  <><Coins size={14} /> Reclamar {mission.rewardRlc} RLC</>
                )}
              </motion.button>
            ) : (
              <button
                disabled
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border text-white/40 text-sm cursor-not-allowed"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
              >
                <Lock size={13} />
                Reclamar recompensa
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Mission Card (Discord Quests style) ─────────────────────────────────────
function MissionCard({
  mission,
  userMission,
  onAccept,
  onWatch,
  accepting,
}: {
  mission: Mission;
  userMission: UserMission | undefined;
  onAccept: () => void;
  onWatch: () => void;
  accepting: boolean;
}) {
  const required = mission.requiredWatchSeconds;
  const watched = userMission?.watchedSeconds ?? 0;
  const percent = Math.min((watched / required) * 100, 100);
  const isAccepted = !!userMission?.accepted;
  const isCompleted = !!userMission?.completed;
  const isClaimed = !!userMission?.claimed;
  const timeRemaining = formatTimeRemaining(mission.endDate);

  const remainingSeconds = Math.max(0, required - watched);
  const remainingDisplay = `${Math.floor(remainingSeconds / 60)}:${(remainingSeconds % 60).toString().padStart(2, "0")}`;

  const [isHovered, setIsHovered] = useState(false);
  const hoverVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = hoverVideoRef.current;
    if (!video) return;
    if (isHovered) {
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isHovered]);

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{
        background: "#1e1f22",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Banner / Video preview area */}
      <div className="relative overflow-hidden" style={{ height: 168 }}>
        {mission.bannerUrl ? (
          <img
            src={mission.bannerUrl}
            alt={mission.title}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transition: "opacity 0.3s ease", opacity: isHovered ? 0 : 1 }}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full" style={{ background: "linear-gradient(135deg, #1a0505, #2d0a0a)" }} />
        )}

        {/* Video preview on hover */}
        <video
          ref={hoverVideoRef}
          src={mission.videoUrl}
          className="absolute inset-0 w-full h-full object-cover"
          muted loop playsInline preload="none"
          style={{ transition: "opacity 0.3s ease", opacity: isHovered ? 1 : 0 }}
        />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.85) 100%)" }}
        />

        {/* Sponsor logo */}
        {mission.sponsorLogo && (
          <div className="absolute bottom-3 left-3 z-10">
            <img src={mission.sponsorLogo} alt={mission.sponsorName ?? ""} className="object-contain drop-shadow-lg" style={{ height: 36, maxWidth: 140 }} />
          </div>
        )}
        {mission.sponsorName && !mission.sponsorLogo && (
          <div className="absolute bottom-3 left-3 z-10">
            <span className="text-white font-black text-xl tracking-tight drop-shadow-lg" style={{ fontFamily: "Orbitron, sans-serif", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
              {mission.sponsorName.toUpperCase()}
            </span>
          </div>
        )}

        {/* Top-right controls */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          {!isClaimed && (
            <button onClick={(e) => { e.stopPropagation(); onWatch(); }} className="w-8 h-8 rounded-full flex items-center justify-center bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-all">
              <Play size={13} fill="currentColor" />
            </button>
          )}
          <button onClick={(e) => e.stopPropagation()} className="w-8 h-8 rounded-full flex items-center justify-center bg-black/50 text-white/60 hover:bg-black/70 hover:text-white transition-all">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Sponsor row */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={12} className="text-green-400 flex-shrink-0" />
          <span className="text-white/60 text-xs font-medium">Patrocinado por {mission.sponsorName ?? "RLC"}</span>
        </div>
        {timeRemaining && <span className="text-white/40 text-xs">{timeRemaining}</span>}
      </div>

      {/* Mission info row */}
      <div className="flex items-start gap-3 px-4 py-3">
        <RewardIcon size={64} progress={isAccepted ? percent : 0} logoUrl={mission.sponsorLogo} />
        <div className="flex-1 min-w-0">
          <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">
            MISIÓN {mission.sponsorName?.toUpperCase() ?? "RLC"}
          </p>
          <h3 className="text-white font-bold text-sm leading-snug line-clamp-2">
            {isClaimed ? (
              <span className="flex items-center gap-1.5"><Coins size={13} className="text-yellow-400 flex-shrink-0" />{mission.rewardRlc} RLC</span>
            ) : mission.title}
          </h3>
          <p className="text-white/45 text-xs mt-0.5 line-clamp-2 leading-relaxed">
            {isClaimed ? "Reclamaste esta recompensa" : mission.description ?? `Gana ${mission.rewardRlc} RLC completando esta misión`}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }} />

      {/* Action buttons */}
      <div className="flex gap-2 px-4 py-3">
        {isClaimed ? (
          <>
            <button onClick={onWatch} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white/70 hover:text-white transition-colors" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <RefreshCw size={13} /> Ver de nuevo
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
              Ver recompensa
            </button>
          </>
        ) : isCompleted ? (
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={onWatch} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
            <Coins size={14} /> Reclamar {mission.rewardRlc} RLC
          </motion.button>
        ) : isAccepted ? (
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={onWatch} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
            <Clock size={14} /> Mirar ({remainingDisplay} restantes)
          </motion.button>
        ) : (
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={onAccept} disabled={accepting} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
            {accepting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Aceptar misión"}
          </motion.button>
        )}
      </div>
    </div>
  );
}

// ─── Missions Page ────────────────────────────────────────────────────────────
export default function MissionsPage() {
  const { data: missions = [], isLoading } = trpc.missions.list.useQuery();
  const { data: myProgress = [] } = trpc.missions.myProgress.useQuery();
  const utils = trpc.useUtils();

  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const acceptMutation = trpc.missions.accept.useMutation({
    onSuccess: () => utils.missions.myProgress.invalidate(),
  });

  const [activePlayer, setActivePlayer] = useState<Mission | null>(null);

  const getProgress = (missionId: number) => myProgress.find((p) => p.missionId === missionId);

  const handleAccept = async (mission: Mission) => {
    setAcceptingId(mission.id);
    try {
      await acceptMutation.mutateAsync({ missionId: mission.id });
      setActivePlayer(mission);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleWatch = (mission: Mission) => setActivePlayer(mission);
  const handleProgressUpdate = () => utils.missions.myProgress.invalidate();
  const handleClaim = () => {
    utils.missions.myProgress.invalidate();
    utils.auth.me.invalidate();
    setActivePlayer(null);
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: "#0a0a0a" }}>
      {/* Hero banner de publicidades — igual al del Home */}
      <div className="px-0 sm:px-4 pt-2">
        <MissionsHeroBanner />
      </div>

      <div className="px-4 pt-6 pb-5">
        <h1 className="text-white font-black text-2xl tracking-tight" style={{ fontFamily: "Orbitron, sans-serif" }}>MISIONES</h1>
        <p className="text-white/40 text-sm mt-1">Completa misiones patrocinadas y gana RLC</p>
      </div>

      <div className="px-4 mb-5">
        <div className="flex gap-1 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <button className="px-4 pb-2.5 text-sm font-semibold text-white border-b-2 border-red-500 -mb-px">Todas las misiones</button>
          <button className="px-4 pb-2.5 text-sm font-medium text-white/40 hover:text-white/70 transition-colors">Misiones reclamadas</button>
        </div>
      </div>

      {/* Grid de misiones — sin padding lateral en móvil para ir a pantalla completa */}
      <div className="px-0 sm:px-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 sm:rounded-xl animate-pulse" style={{ background: "#1e1f22" }} />
            ))}
          </div>
        ) : missions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#1e1f22", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Coins size={28} className="text-white/20" />
            </div>
            <h3 className="text-white/60 font-semibold text-lg mb-1">Sin misiones disponibles</h3>
            <p className="text-white/30 text-sm">Vuelve pronto para nuevas misiones patrocinadas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 sm:gap-4">
            {missions.map((mission, i) => (
              <motion.div key={mission.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <MissionCard
                  mission={mission as Mission}
                  userMission={getProgress(mission.id)}
                  onAccept={() => handleAccept(mission as Mission)}
                  onWatch={() => handleWatch(mission as Mission)}
                  accepting={acceptingId === mission.id}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {activePlayer && (
          <MissionVideoPlayer
            mission={activePlayer}
            userMission={getProgress(activePlayer.id) ?? null}
            onClose={() => setActivePlayer(null)}
            onProgressUpdate={handleProgressUpdate}
            onClaim={handleClaim}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
