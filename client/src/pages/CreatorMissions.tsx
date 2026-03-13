import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Clapperboard, ChevronLeft, ExternalLink, Plus, Trash2,
  Award, Clock, Link2, CheckCircle2, AlertCircle, Lock,
  Send, Loader2, Calendar, Coins, Flame,
} from "lucide-react";

const ACCENT = "#FF2D2D";

// ─── Types ────────────────────────────────────────────────────────────────────
type Mission = {
  id: number;
  title: string;
  description: string;
  requirements: string | null;
  resourcesUrl: string | null;
  platforms: string | null;
  rewardRlc: number;
  bonusRlc: number;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
  accepted: boolean;
  submission: {
    id: number;
    status: "pending" | "approved" | "rejected";
    adminNote: string | null;
    rewardPaid: boolean;
    links: { url: string; platform: string | null }[];
  } | null;
};

const PLATFORMS = ["Instagram", "TikTok", "YouTube", "Twitter/X", "Facebook", "Kick", "Otro"];

// ─── Stepper ──────────────────────────────────────────────────────────────────
function MissionStepper({ mission }: { mission: Mission }) {
  const sub = mission.submission;
  let step = 0;
  if (mission.accepted) step = 1;
  if (sub) step = 2;
  if (sub?.status === "approved") step = 3;

  const steps = [
    { label: "Tomar", icon: Clapperboard },
    { label: "Publicar", icon: Flame },
    { label: "Entregar", icon: Send },
  ];

  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => {
        const done = step > i;
        const active = step === i;
        const Icon = s.icon;
        return (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center border transition-all"
                style={{
                  background: done ? ACCENT : active ? `${ACCENT}25` : "rgba(255,255,255,0.05)",
                  borderColor: done || active ? ACCENT : "rgba(255,255,255,0.12)",
                }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: done ? "#fff" : active ? ACCENT : "#52525b" }} />
              </div>
              <span
                className="text-[10px] font-mono tracking-widest"
                style={{ color: done || active ? "#fff" : "#52525b" }}
              >
                {s.label.toUpperCase()}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="h-px flex-1 mb-4 transition-all"
                style={{ background: step > i + 1 ? ACCENT : "rgba(255,255,255,0.08)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Platform chips ───────────────────────────────────────────────────────────
function PlatformChips({ platforms }: { platforms: string }) {
  const chips = platforms?.split(",").map(p => p.trim()).filter(Boolean) ?? [];
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((p, i) => (
        <span
          key={i}
          className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider"
          style={{ background: "rgba(255,45,45,0.10)", border: "1px solid rgba(255,45,45,0.25)", color: "#fca5a5" }}
        >
          {p}
        </span>
      ))}
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function MissionProgress({ mission }: { mission: Mission }) {
  const sub = mission.submission;
  const steps = ["Sin tomar", "Aceptada", "En revisión", "Aprobada"];
  let current = 0;
  if (mission.accepted) current = 1;
  if (sub?.status === "pending") current = 2;
  if (sub?.status === "approved") current = 3;
  const pct = (current / (steps.length - 1)) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        {steps.map((s, i) => (
          <span
            key={i}
            className="text-[9px] font-mono tracking-wider"
            style={{ color: i <= current ? "#fff" : "#52525b" }}
          >
            {s.toUpperCase()}
          </span>
        ))}
      </div>
      <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div
          className="h-1 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: sub?.status === "rejected" ? "#ef4444" : ACCENT }}
        />
      </div>
    </div>
  );
}

// ─── Mission Card ─────────────────────────────────────────────────────────────
function MissionCard({ mission, onClick }: { mission: Mission; onClick: () => void }) {
  const isExpired = mission.endDate && new Date(String(mission.endDate)) < new Date();
  const sub = mission.submission;

  const msLeft = mission.endDate ? new Date(String(mission.endDate)).getTime() - Date.now() : null;
  const daysLeft = msLeft !== null ? Math.ceil(msLeft / 86_400_000) : null;
  const urgentExpiry = daysLeft !== null && daysLeft <= 3 && daysLeft > 0;

  return (
    <div
      onClick={onClick}
      className="rounded-2xl cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] space-y-4 p-5"
      style={{
        background: "#16191f",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.4)",
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}35` }}
          >
            <Clapperboard className="w-4 h-4" style={{ color: ACCENT }} />
          </div>
          <h3 className="font-orbitron font-bold text-white text-sm leading-snug">{mission.title}</h3>
        </div>

        {sub?.status === "approved" && (
          <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80" }}>
            <CheckCircle2 className="w-3 h-3" /> Aprobada
          </span>
        )}
        {sub?.status === "pending" && (
          <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)", color: "#fb923c" }}>
            <Clock className="w-3 h-3" /> En revisión
          </span>
        )}
        {sub?.status === "rejected" && (
          <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
            <AlertCircle className="w-3 h-3" /> Rechazada
          </span>
        )}
        {!sub && mission.accepted && (
          <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa" }}>
            <Clapperboard className="w-3 h-3" /> Aceptada
          </span>
        )}
      </div>

      <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2">{mission.description}</p>

      {/* Platforms */}
      {mission.platforms && <PlatformChips platforms={mission.platforms} />}

      {/* Rewards + expiry */}
      <div className="flex flex-wrap items-center gap-3">
        {sub?.status === "approved" ? (
          <span className="flex items-center gap-1.5 text-xs font-bold"
            style={{ color: "#4ade80" }}>
            <Coins className="w-3.5 h-3.5" /> +{mission.rewardRlc} RLC ganados
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: ACCENT }}>
            <Award className="w-3.5 h-3.5" /> {mission.rewardRlc} RLC
          </span>
        )}
        {mission.bonusRlc > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-yellow-400">
            <Award className="w-3.5 h-3.5" /> +{mission.bonusRlc} bonus
          </span>
        )}
        {mission.endDate && (
          <span
            className="flex items-center gap-1 text-xs ml-auto"
            style={{ color: isExpired ? "#f87171" : urgentExpiry ? "#fb923c" : "#71717a" }}
          >
            <Clock className="w-3 h-3" />
            {isExpired
              ? "Venció"
              : urgentExpiry
              ? `Vence en ${daysLeft}d`
              : `Vence ${new Date(String(mission.endDate)).toLocaleDateString("es", { day: "numeric", month: "short" })}`}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {!sub?.status || sub.status !== "rejected" ? (
        <MissionProgress mission={mission} />
      ) : (
        <div className="h-1 rounded-full" style={{ background: "rgba(239,68,68,0.25)" }} />
      )}
    </div>
  );
}

// ─── Mission Detail ───────────────────────────────────────────────────────────
function MissionDetail({ mission, onBack, onRefetch }: {
  mission: Mission;
  onBack: () => void;
  onRefetch: () => void;
}) {
  const isExpired = mission.endDate && new Date(String(mission.endDate)) < new Date();
  const sub = mission.submission;

  const [links, setLinks] = useState<{ url: string; platform: string }[]>(
    (sub?.links ?? []).map(l => ({ url: l.url, platform: l.platform ?? "" }))
  );
  const [submitting, setSubmitting] = useState(false);

  const acceptMutation = trpc.creatorMissions.accept.useMutation({
    onSuccess: () => { toast.success("¡Misión aceptada! Ahora complétala y sube tus links."); onRefetch(); },
    onError: (e) => toast.error(e.message),
  });

  const submitMutation = trpc.creatorMissions.submit.useMutation({
    onSuccess: () => {
      toast.success("¡Entrega enviada! El admin revisará tu contenido pronto.");
      setSubmitting(false);
      onRefetch();
    },
    onError: (e) => { toast.error(e.message); setSubmitting(false); },
  });

  const addLink = () => setLinks(l => [...l, { url: "", platform: "" }]);
  const removeLink = (i: number) => setLinks(l => l.filter((_, idx) => idx !== i));
  const updateLink = (i: number, field: "url" | "platform", val: string) =>
    setLinks(l => l.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const handleSubmit = () => {
    const validLinks = links.filter(l => l.url.trim());
    if (validLinks.length === 0) { toast.error("Debes añadir al menos un link"); return; }
    setSubmitting(true);
    submitMutation.mutate({ missionId: mission.id, links: validLinks });
  };

  return (
    <div className="space-y-5">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors">
        <ChevronLeft className="w-4 h-4" /> Volver a misiones
      </button>

      {/* Header card with gradient */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(255,45,45,0.12) 0%, #16191f 60%)",
          border: "1px solid rgba(255,45,45,0.2)",
        }}
      >
        <div className="p-6 space-y-5">
          {/* Title + status */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clapperboard className="w-4 h-4" style={{ color: ACCENT }} />
                <span className="text-xs font-mono tracking-widest" style={{ color: ACCENT }}>MISIÓN PARA CREADORES</span>
              </div>
              <h2 className="font-orbitron text-white font-bold text-2xl leading-tight">{mission.title}</h2>
            </div>
            {sub?.status === "approved" && (
              <span className="shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80" }}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Aprobada
              </span>
            )}
            {sub?.status === "pending" && (
              <span className="shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)", color: "#fb923c" }}>
                <Clock className="w-3.5 h-3.5" /> En revisión
              </span>
            )}
            {sub?.status === "rejected" && (
              <span className="shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                <AlertCircle className="w-3.5 h-3.5" /> Rechazada
              </span>
            )}
          </div>

          {/* Stepper */}
          <MissionStepper mission={mission} />

          {/* Rewards */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: "rgba(255,45,45,0.10)", border: "1px solid rgba(255,45,45,0.2)" }}>
              <Award className="w-4 h-4" style={{ color: ACCENT }} />
              <span className="font-bold text-sm" style={{ color: ACCENT }}>{mission.rewardRlc} RLC</span>
              <span className="text-zinc-500 text-xs">al ser aprobado</span>
            </div>
            {mission.bonusRlc > 0 && (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
                <Award className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 font-bold text-sm">+{mission.bonusRlc} RLC</span>
                <span className="text-zinc-500 text-xs">bonus</span>
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
            {mission.startDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Desde {new Date(String(mission.startDate)).toLocaleDateString("es", { day: "numeric", month: "long" })}
              </span>
            )}
            {mission.endDate && (
              <span className={`flex items-center gap-1.5 ${isExpired ? "text-red-400" : ""}`}>
                <Clock className="w-4 h-4" />
                {isExpired ? "Venció el" : "Vence el"}{" "}
                {new Date(String(mission.endDate)).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            )}
          </div>

          {/* Platforms */}
          {mission.platforms && <PlatformChips platforms={mission.platforms} />}
        </div>
      </div>

      {/* Description */}
      <div className="rounded-2xl p-5 space-y-3"
        style={{ background: "#16191f", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h3 className="font-orbitron font-bold text-xs text-zinc-400 tracking-widest">DESCRIPCIÓN</h3>
        <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{mission.description}</p>
      </div>

      {/* Requirements */}
      {mission.requirements && (
        <div className="rounded-2xl p-5 space-y-3"
          style={{ background: "#16191f", border: "1px solid rgba(249,115,22,0.15)" }}>
          <h3 className="font-orbitron font-bold text-xs text-orange-400 tracking-widest flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5" /> REQUISITOS ESPECÍFICOS
          </h3>
          <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{mission.requirements}</p>
        </div>
      )}

      {/* Resources */}
      {mission.resourcesUrl && (
        <div className="rounded-2xl p-5 space-y-3"
          style={{ background: "#16191f", border: "1px solid rgba(59,130,246,0.15)" }}>
          <h3 className="font-orbitron font-bold text-xs text-blue-400 tracking-widest flex items-center gap-2">
            <Link2 className="w-3.5 h-3.5" /> RECURSOS DISPONIBLES
          </h3>
          <a
            href={mission.resourcesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-colors group"
            style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}
          >
            <span className="text-blue-400 text-sm truncate group-hover:text-blue-300 transition-colors">
              {mission.resourcesUrl}
            </span>
            <ExternalLink className="w-4 h-4 text-blue-400 shrink-0" />
          </a>
        </div>
      )}

      {/* Accept button */}
      {!mission.accepted && !isExpired && (
        <button
          onClick={() => acceptMutation.mutate({ missionId: mission.id })}
          disabled={acceptMutation.isPending}
          className="w-full font-orbitron font-bold text-sm text-white py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 animate-pulse hover:animate-none"
          style={{ background: ACCENT, boxShadow: `0 0 24px ${ACCENT}55` }}
        >
          {acceptMutation.isPending
            ? <><Loader2 className="w-5 h-5 animate-spin" /> TOMANDO MISIÓN...</>
            : <><Clapperboard className="w-5 h-5" /> TOMAR MISIÓN</>
          }
        </button>
      )}

      {isExpired && !sub && (
        <div className="rounded-xl p-4 text-center text-zinc-500 text-sm"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          Esta misión ya venció y no acepta nuevas participaciones.
        </div>
      )}

      {/* Submit section */}
      {mission.accepted && !sub && (
        <div className="rounded-2xl p-5 space-y-5"
          style={{ background: "#16191f", border: "1px solid rgba(255,45,45,0.15)" }}>
          <div>
            <h3 className="font-orbitron font-bold text-xs tracking-widest flex items-center gap-2 mb-1" style={{ color: ACCENT }}>
              <Send className="w-3.5 h-3.5" /> SUBIR TU ENTREGA
            </h3>
            <p className="text-zinc-500 text-xs">
              Publica tu contenido en redes y pega los links aquí. Puedes añadir múltiples si publicaste en varias plataformas.
            </p>
          </div>

          <div className="space-y-3">
            {links.map((link, i) => (
              <div key={i} className="rounded-xl p-3 space-y-2"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono text-zinc-500 tracking-widest">
                    LINK DE TU PUBLICACIÓN {links.length > 1 ? `#${i + 1}` : ""}
                  </label>
                  {links.length > 1 && (
                    <button onClick={() => removeLink(i)}
                      className="p-1 text-zinc-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input
                  value={link.url}
                  onChange={e => updateLink(i, "url", e.target.value)}
                  placeholder="https://www.instagram.com/p/... o https://www.tiktok.com/..."
                  className="w-full rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none transition-colors placeholder-zinc-700"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={e => { e.currentTarget.style.borderColor = `${ACCENT}60`; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                />
                <select
                  value={link.platform}
                  onChange={e => updateLink(i, "platform", e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: link.platform ? "#fff" : "#52525b",
                  }}
                >
                  <option value="">Plataforma (opcional)</option>
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            ))}
          </div>

          <button onClick={addLink}
            className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors">
            <Plus className="w-3.5 h-3.5" /> AÑADIR OTRO LINK
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full font-orbitron font-bold text-sm text-white py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: ACCENT }}
          >
            {submitting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> ENVIANDO...</>
              : <><Send className="w-4 h-4" /> ENVIAR ENTREGA</>
            }
          </button>
        </div>
      )}

      {/* Submission status */}
      {sub && (
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{
            background: sub.status === "approved"
              ? "rgba(34,197,94,0.06)"
              : sub.status === "rejected"
              ? "rgba(239,68,68,0.06)"
              : "rgba(249,115,22,0.06)",
            border: `1px solid ${
              sub.status === "approved"
                ? "rgba(34,197,94,0.25)"
                : sub.status === "rejected"
                ? "rgba(239,68,68,0.25)"
                : "rgba(249,115,22,0.25)"
            }`,
          }}
        >
          <h3 className="font-orbitron font-bold text-xs text-zinc-400 tracking-widest">TU ENTREGA</h3>

          <div className="space-y-2">
            {(sub.links ?? []).map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{link.url}</span>
                {link.platform && <span className="text-zinc-600 text-xs shrink-0">({link.platform})</span>}
              </a>
            ))}
          </div>

          {sub.status === "pending" && (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}>
              <Clock className="w-5 h-5 text-orange-400 shrink-0" />
              <div>
                <p className="text-orange-400 font-semibold text-sm">En revisión</p>
                <p className="text-zinc-500 text-xs">El admin revisará tu contenido y recibirás una notificación con el resultado.</p>
              </div>
            </div>
          )}
          {sub.status === "approved" && (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
              <div>
                <p className="text-green-400 font-semibold text-sm">
                  ¡Aprobada!{sub.rewardPaid ? ` — ${mission.rewardRlc} RLC acreditados` : ""}
                </p>
                {sub.adminNote && <p className="text-zinc-400 text-xs mt-0.5">{sub.adminNote}</p>}
              </div>
            </div>
          )}
          {sub.status === "rejected" && (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <p className="text-red-400 font-semibold text-sm">Rechazada</p>
                {sub.adminNote && <p className="text-zinc-400 text-xs mt-0.5">{sub.adminNote}</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CreatorMissionsPage() {
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  const { data: creatorApp, isLoading: loadingCreator } = trpc.creators.getMyApplication.useQuery();
  const isApprovedCreator = creatorApp?.status === "approved";

  const { data: missions = [], refetch, isLoading } = trpc.creatorMissions.list.useQuery(undefined, {
    enabled: isApprovedCreator,
  });

  // If viewing detail
  if (selectedMission) {
    const fresh = missions.find(m => m.id === selectedMission.id) ?? selectedMission;
    return (
      <div className="w-full px-4 py-6" style={{ background: "#0a0a0a", minHeight: "100vh" }}>
        <MissionDetail
          mission={fresh}
          onBack={() => setSelectedMission(null)}
          onRefetch={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 space-y-6" style={{ background: "#0a0a0a", minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}35` }}
        >
          <Clapperboard className="w-5 h-5" style={{ color: ACCENT }} />
        </div>
        <div>
          <h1 className="font-orbitron text-white font-bold text-xl tracking-wide">MISIONES CREADORES</h1>
          <p className="text-zinc-500 text-xs font-mono">Crea contenido y gana RLC</p>
        </div>
      </div>

      {/* Not a creator */}
      {!loadingCreator && !isApprovedCreator && (
        <div className="rounded-2xl p-10 text-center space-y-5"
          style={{ background: "#16191f", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <Lock className="w-7 h-7 text-zinc-600" />
          </div>
          <div>
            <h3 className="font-orbitron font-bold text-white text-lg tracking-wide">Sección exclusiva para creadores</h3>
            <p className="text-zinc-500 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
              Esta sección es exclusiva para Creadores Oficiales aprobados de Red Level Circle.
            </p>
          </div>
          <a
            href="/apply/creator"
            className="inline-flex items-center gap-2 font-orbitron font-bold text-sm text-white px-6 py-3 rounded-xl transition-all hover:scale-105"
            style={{ background: ACCENT, boxShadow: `0 0 20px ${ACCENT}40` }}
          >
            <Clapperboard className="w-4 h-4" /> Solicitar ser Creador Oficial
          </a>
        </div>
      )}

      {/* Loading */}
      {isApprovedCreator && isLoading && (
        <div className="text-center py-16 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: ACCENT }} />
          <p className="text-zinc-500 text-sm font-mono">Cargando misiones...</p>
        </div>
      )}

      {/* Empty */}
      {isApprovedCreator && !isLoading && missions.length === 0 && (
        <div className="rounded-2xl p-12 text-center space-y-3"
          style={{ background: "#16191f", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Clapperboard className="w-12 h-12 mx-auto" style={{ color: "rgba(255,45,45,0.2)" }} />
          <p className="font-orbitron font-bold text-zinc-400 text-sm tracking-wide">Sin misiones disponibles</p>
          <p className="text-zinc-600 text-xs">El equipo publicará misiones pronto. Recibirás una notificación cuando haya nuevas.</p>
        </div>
      )}

      {/* Mission list */}
      {isApprovedCreator && !isLoading && missions.length > 0 && (
        <div className="space-y-3">
          {missions.map(m => (
            <MissionCard key={m.id} mission={m} onClick={() => setSelectedMission(m)} />
          ))}
        </div>
      )}
    </div>
  );
}
