import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Play, CheckCircle2, Lock, Clock, Coins,
  X, AlertTriangle, ChevronRight, Zap, Star
} from "lucide-react";
import { SectionBanner } from "@/components/SectionBanner";

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

// ─── Circular Progress ────────────────────────────────────────────────────────
function CircularProgress({ percent, size = 56 }: { percent: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={percent >= 100 ? "#22c55e" : "#ef4444"}
        strokeWidth={4}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
    </svg>
  );
}

// ─── Mission Video Player ─────────────────────────────────────────────────────
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
  const [watchedSeconds, setWatchedSeconds] = useState(userMission?.watchedSeconds ?? 0);
  const [isCompleted, setIsCompleted] = useState(userMission?.completed ?? false);
  const [isClaimed, setIsClaimed] = useState(userMission?.claimed ?? false);
  const [tabWarning, setTabWarning] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const lastReportedRef = useRef(watchedSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateProgress = trpc.missions.updateProgress.useMutation();
  const claimMutation = trpc.missions.claim.useMutation();

  const required = mission.requiredWatchSeconds;
  const percent = Math.min((watchedSeconds / required) * 100, 100);

  // Tab visibility fraud detection
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

  // Track progress every 5 seconds
  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.paused || video.ended) return;
      const current = Math.floor(video.currentTime);
      if (current <= lastReportedRef.current) return; // no backward jumps
      // Anti-fraud: max 10s jump
      const safe = Math.min(current, lastReportedRef.current + 10);
      lastReportedRef.current = safe;
      setWatchedSeconds(safe);
      try {
        const result = await updateProgress.mutateAsync({
          missionId: mission.id,
          watchedSeconds: safe,
        });
        if (result.completed) {
          setIsCompleted(true);
          video.pause();
        }
        onProgressUpdate(safe);
      } catch (e) {
        console.error("Progress update failed", e);
      }
    }, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [mission.id]);

  // Block seeking (anti-fraud)
  const handleSeeking = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const maxAllowed = (lastReportedRef.current / required) * video.duration;
    if (video.currentTime > maxAllowed + 2) {
      video.currentTime = maxAllowed;
    }
  }, [required]);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      await claimMutation.mutateAsync({ missionId: mission.id });
      setIsClaimed(true);
      onClaim();
    } catch (e) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-[#111115] rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/08">
          <div>
            <h2 className="text-white font-bold text-lg">{mission.title}</h2>
            {mission.sponsorName && (
              <p className="text-white/40 text-xs mt-0.5">Patrocinado por {mission.sponsorName}</p>
            )}
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Video */}
        <div className="relative bg-black">
          <video
            ref={videoRef}
            src={mission.videoUrl}
            className="w-full max-h-[360px] object-contain"
            controlsList="nodownload nofullscreen"
            disablePictureInPicture
            onSeeking={handleSeeking}
            onContextMenu={(e) => e.preventDefault()}
          />
          {(isCompleted || isClaimed) && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="text-center">
                <CheckCircle2 className="text-green-400 mx-auto mb-2" size={48} />
                <p className="text-white font-bold text-lg">
                  {isClaimed ? "¡Recompensa reclamada!" : "¡Misión completada!"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tab warning */}
        <AnimatePresence>
          {tabWarning && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-4 mt-3 flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 rounded-xl px-4 py-2.5"
            >
              <AlertTriangle size={16} className="text-amber-400 shrink-0" />
              <p className="text-amber-300 text-xs">El video se pausó porque cambiaste de pestaña. El progreso solo cuenta mientras ves el video.</p>
              <button onClick={() => setTabWarning(false)} className="ml-auto text-amber-400/60 hover:text-amber-400">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-white/40" />
              <span className="text-white/60 text-xs">
                {watchedSeconds}s / {required}s
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Coins size={14} className="text-yellow-400" />
              <span className="text-yellow-400 font-bold text-sm">{mission.rewardRlc} RLC</span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-white/08 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: percent >= 100 ? "#22c55e" : "linear-gradient(90deg, #ef4444, #ff6b6b)" }}
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-white/30 text-xs">0%</span>
            <span className={`text-xs font-semibold ${percent >= 100 ? "text-green-400" : "text-white/50"}`}>
              {Math.round(percent)}%
            </span>
          </div>
        </div>

        {/* Claim button */}
        <div className="px-5 pb-5">
          {isClaimed ? (
            <div className="flex items-center justify-center gap-2 py-3 bg-green-500/10 border border-green-500/20 rounded-xl">
              <CheckCircle2 size={18} className="text-green-400" />
              <span className="text-green-400 font-semibold">Recompensa reclamada</span>
            </div>
          ) : isCompleted ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClaim}
              disabled={claiming}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
            >
              {claiming ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Zap size={16} />
                  Reclamar {mission.rewardRlc} RLC
                </>
              )}
            </motion.button>
          ) : (
            <div className="flex items-center justify-center gap-2 py-3 bg-white/04 border border-white/08 rounded-xl">
              <Lock size={16} className="text-white/30" />
              <span className="text-white/40 text-sm">Completa el video para reclamar</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Mission Card ─────────────────────────────────────────────────────────────
function MissionCard({
  mission,
  userMission,
  onAccept,
  onWatch,
}: {
  mission: Mission;
  userMission: UserMission | undefined;
  onAccept: () => void;
  onWatch: () => void;
}) {
  const required = mission.requiredWatchSeconds;
  const watched = userMission?.watchedSeconds ?? 0;
  const percent = Math.min((watched / required) * 100, 100);
  const isAccepted = !!userMission?.accepted;
  const isCompleted = !!userMission?.completed;
  const isClaimed = !!userMission?.claimed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative rounded-2xl overflow-hidden border border-white/08 bg-[#111115] flex flex-col"
      style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.4)" }}
    >
      {/* Banner */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-[#1a0505] to-[#2d0a0a]">
        {mission.bannerUrl ? (
          <img
            src={mission.bannerUrl}
            alt={mission.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Trophy size={48} className="text-red-500/30" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111115] via-transparent to-transparent" />

        {/* Sponsor logo */}
        {mission.sponsorLogo && (
          <div className="absolute top-3 left-3 w-8 h-8 rounded-lg overflow-hidden bg-black/50 backdrop-blur-sm border border-white/10">
            <img src={mission.sponsorLogo} alt={mission.sponsorName ?? ""} className="w-full h-full object-contain p-1" />
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          {isClaimed ? (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/20 border border-green-500/30 text-green-400">
              <CheckCircle2 size={11} /> Completada
            </span>
          ) : isCompleted ? (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 border border-yellow-500/30 text-yellow-400">
              <Star size={11} /> Lista para reclamar
            </span>
          ) : isAccepted ? (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 border border-blue-500/30 text-blue-400">
              <Play size={11} /> En progreso
            </span>
          ) : null}
        </div>

        {/* Circular progress overlay */}
        {isAccepted && !isClaimed && (
          <div className="absolute bottom-3 right-3">
            <div className="relative">
              <CircularProgress percent={percent} size={44} />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">
                {Math.round(percent)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Sponsor name */}
        {mission.sponsorName && (
          <p className="text-white/40 text-xs font-medium uppercase tracking-wider">{mission.sponsorName}</p>
        )}

        {/* Title */}
        <h3 className="text-white font-bold text-base leading-tight line-clamp-2">{mission.title}</h3>

        {/* Description */}
        {mission.description && (
          <p className="text-white/50 text-xs leading-relaxed line-clamp-2">{mission.description}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-auto pt-2 border-t border-white/06">
          <div className="flex items-center gap-1.5">
            <Coins size={13} className="text-yellow-400" />
            <span className="text-yellow-400 font-bold text-sm">{mission.rewardRlc} RLC</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-white/30" />
            <span className="text-white/40 text-xs">{Math.ceil(required / 60)} min</span>
          </div>
        </div>

        {/* Progress bar (if accepted) */}
        {isAccepted && !isClaimed && (
          <div className="h-1.5 bg-white/08 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: percent >= 100 ? "#22c55e" : "linear-gradient(90deg, #ef4444, #ff6b6b)" }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        )}

        {/* CTA Button */}
        {isClaimed ? (
          <div className="flex items-center justify-center gap-2 py-2.5 bg-green-500/08 border border-green-500/15 rounded-xl">
            <CheckCircle2 size={15} className="text-green-400" />
            <span className="text-green-400 text-sm font-semibold">Recompensa reclamada</span>
          </div>
        ) : isCompleted ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onWatch}
            className="w-full py-2.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
          >
            <Zap size={15} />
            Reclamar {mission.rewardRlc} RLC
          </motion.button>
        ) : isAccepted ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onWatch}
            className="w-full py-2.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 bg-white/08 border border-white/10 hover:bg-white/12 transition-colors"
          >
            <Play size={15} />
            Continuar misión
            <ChevronRight size={14} className="ml-auto" />
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAccept}
            className="w-full py-2.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
          >
            <Trophy size={15} />
            Aceptar misión
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Missions Page ────────────────────────────────────────────────────────────
export default function MissionsPage() {
  const { data: missions = [], isLoading } = trpc.missions.list.useQuery();
  const { data: myProgress = [] } = trpc.missions.myProgress.useQuery();
  const utils = trpc.useUtils();

  const acceptMutation = trpc.missions.accept.useMutation({
    onSuccess: () => utils.missions.myProgress.invalidate(),
  });

  const [activePlayer, setActivePlayer] = useState<Mission | null>(null);

  const getProgress = (missionId: number) =>
    myProgress.find((p) => p.missionId === missionId);

  const handleAccept = async (mission: Mission) => {
    await acceptMutation.mutateAsync({ missionId: mission.id });
    setActivePlayer(mission);
  };

  const handleWatch = (mission: Mission) => {
    setActivePlayer(mission);
  };

  const handleProgressUpdate = () => {
    utils.missions.myProgress.invalidate();
  };

  const handleClaim = () => {
    utils.missions.myProgress.invalidate();
    utils.auth.me.invalidate();
    setActivePlayer(null);
  };

  // Stats
  const completedCount = myProgress.filter((p) => p.claimed).length;
  const inProgressCount = myProgress.filter((p) => p.accepted && !p.claimed).length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      {/* Section Banner */}
      <SectionBanner section="missions" />

      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
            <Trophy size={16} className="text-white" />
          </div>
          <h1 className="text-white font-black text-2xl tracking-tight" style={{ fontFamily: "Orbitron, sans-serif" }}>
            MISIONES
          </h1>
        </div>
        <p className="text-white/40 text-sm ml-11">Completa misiones y gana RLC</p>

        {/* Stats */}
        {myProgress.length > 0 && (
          <div className="flex gap-3 mt-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/04 border border-white/08 rounded-xl">
              <CheckCircle2 size={14} className="text-green-400" />
              <span className="text-white/60 text-xs">{completedCount} completadas</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/04 border border-white/08 rounded-xl">
              <Play size={14} className="text-blue-400" />
              <span className="text-white/60 text-xs">{inProgressCount} en progreso</span>
            </div>
          </div>
        )}
      </div>

      {/* Mission Grid */}
      <div className="px-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-white/04 animate-pulse" />
            ))}
          </div>
        ) : missions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-white/04 border border-white/08">
              <Trophy size={28} className="text-white/20" />
            </div>
            <h3 className="text-white/60 font-semibold text-lg mb-1">Sin misiones disponibles</h3>
            <p className="text-white/30 text-sm">Vuelve pronto para nuevas misiones patrocinadas</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {missions.map((mission, i) => (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <MissionCard
                  mission={mission as Mission}
                  userMission={getProgress(mission.id)}
                  onAccept={() => handleAccept(mission as Mission)}
                  onWatch={() => handleWatch(mission as Mission)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
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
