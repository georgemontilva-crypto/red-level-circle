import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { SectionBanner } from "@/components/SectionBanner";
import {
  Crown, Youtube, Twitch, Twitter, Instagram, Facebook, Play,
  CheckCircle, Clock, XCircle, Send, Users,
  Gamepad2, Mic, Camera, Music, Zap, X,
} from "lucide-react";
import { toast } from "sonner";
import { DefaultBannerBg } from "@/components/DefaultBannerBg";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { UserAvatar } from "@/components/UserAvatar";

// ─── TikTok icon ──────────────────────────────────────────────────────────────
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  );
}

// ─── Kick icon ────────────────────────────────────────────────────────────────
function KickIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 2h4v8l4-8h4l-5 9 5 11h-4l-4-8v8H4V2z" />
    </svg>
  );
}

const CATEGORIES = [
  { value: "gaming", label: "Videojuegos", icon: Gamepad2 },
  { value: "esports", label: "Esports", icon: Zap },
  { value: "streaming", label: "Streaming", icon: Play },
  { value: "content", label: "Contenido", icon: Camera },
  { value: "education", label: "Educación", icon: Mic },
  { value: "entertainment", label: "Entretenimiento", icon: Music },
];

// ─── Social button ────────────────────────────────────────────────────────────
function SocialBtn({ href, icon, label }: { href: string; icon: React.ReactNode; label: string; color?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      title={label}
      className="flex items-center justify-center flex-1 py-2 rounded-xl text-sm font-semibold bg-gray-300 hover:bg-gray-200 text-black transition-colors"
    >
      {icon}
    </a>
  );
}

// ─── Creator Card ─────────────────────────────────────────────────────────────
function CreatorCard({ c, isLive }: { c: any; isLive?: boolean }) {
  const name = c.nickname ?? c.userName ?? "Creador";
  const cat = CATEGORIES.find(x => x.value === c.category);
  const [, navigate] = useLocation();

  const socials = [
    c.youtube   && { href: `https://youtube.com/@${c.youtube}`,   icon: <Youtube className="w-5 h-5" />,    label: "YouTube" },
    c.twitch    && { href: `https://twitch.tv/${c.twitch}`,        icon: <Twitch className="w-5 h-5" />,     label: "Twitch" },
    c.twitter   && { href: `https://twitter.com/${c.twitter}`,     icon: <Twitter className="w-5 h-5" />,    label: "Twitter" },
    c.instagram && { href: `https://instagram.com/${c.instagram}`, icon: <Instagram className="w-5 h-5" />,  label: "Instagram" },
    c.tiktok    && { href: `https://tiktok.com/@${c.tiktok}`,      icon: <TikTokIcon className="w-5 h-5" />, label: "TikTok" },
    c.facebook  && { href: `https://facebook.com/${c.facebook}`,   icon: <Facebook className="w-5 h-5" />,  label: "Facebook" },
    c.kick      && { href: `https://kick.com/${c.kick}`,           icon: <KickIcon className="w-5 h-5" />,   label: "Kick" },
  ].filter(Boolean) as { href: string; icon: React.ReactNode; label: string }[];

  const subtitle = cat ? `Creador de contenido de: ${cat.label}` : "Creador de contenido";

  return (
    <div className="w-full bg-black rounded-3xl shadow-2xl cursor-pointer" onClick={() => navigate(`/profile/${c.userId}`)}>
      {/* Banner Section */}
      <div className="relative h-48 w-full overflow-hidden rounded-3xl">
        {c.banner ? (
          <img src={c.banner} alt={name} className="w-full h-full object-cover" />
        ) : (
          <DefaultBannerBg />
        )}
        {/* LIVE badge */}
        {isLive && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg z-10"
            style={{ background: "oklch(0.50 0.22 25)", color: "white", boxShadow: "0 0 10px rgba(239,68,68,0.6)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            EN VIVO
          </div>
        )}
      </div>
      {/* Avatar / Logo - Overlapping */}
      <div className="relative px-6 pb-6">
        <div className="flex justify-center -mt-16 mb-4">
          <div
            style={{
              borderRadius: "50%",
              boxShadow: "0 0 0 4px black, 0 4px 24px rgba(0,0,0,0.5)",
              overflow: "visible",
              display: "inline-flex",
              position: "relative",
            }}
          >
            <UserAvatar
              avatar={c.avatar}
              name={name}
              activeFrameImage={(c as any).activeFrameImage}
              size={128}
              containerSize={128}
            />
          </div>
        </div>
        {/* Name and Description */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-white">{name}</h1>
            {c.isVerified && <VerifiedBadge size={18} />}
          </div>
          <p className="text-sm text-gray-400">{subtitle}</p>
        </div>
        {/* Social Buttons */}
        {socials.length > 0 ? (
          <div className="flex items-center gap-1.5">
            {socials.slice(0, 4).map((s, i) => (
              <SocialBtn key={i} href={s.href} icon={s.icon} label={s.label} />
            ))}
          </div>
        ) : (
          <Button
            onClick={e => { e.stopPropagation(); navigate(`/profile/${c.userId}`); }}
            className="w-full bg-gray-300 hover:bg-gray-200 text-black font-semibold py-2 rounded-full transition-colors"
          >
            Ver perfil
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Application Form ─────────────────────────────────────────────────────────
// Shown when user clicks "Aplicar ahora" — always shows the creator application
// form, regardless of approval status.
function ApplicationForm({ onClose }: { onClose?: () => void }) {
  const { isAuthenticated } = useAuth();
  const { data: myApp, refetch } = trpc.creators.getMyApplication.useQuery(undefined, { enabled: isAuthenticated });
  const submit = trpc.creators.submitApplication.useMutation({
    onSuccess: () => {
      toast.success("¡Solicitud enviada! La revisaremos pronto.");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    bio: "", category: "", youtube: "", twitch: "", twitter: "", instagram: "", tiktok: "", facebook: "", kick: "",
  });

  useEffect(() => {
    if (myApp) {
      setForm({
        bio: myApp.bio ?? "",
        category: myApp.category ?? "",
        youtube: myApp.youtube ?? "",
        twitch: myApp.twitch ?? "",
        twitter: myApp.twitter ?? "",
        instagram: myApp.instagram ?? "",
        tiktok: myApp.tiktok ?? "",
        facebook: (myApp as any).facebook ?? "",
        kick: (myApp as any).kick ?? "",
      });
    }
  }, [myApp]);

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.25)" }}>
              <Crown size={18} className="text-red-500" />
            </div>
            <div>
              <h3 className="font-orbitron font-bold text-white text-base leading-tight">Aplicar como Creador</h3>
              <p className="text-zinc-500 text-xs mt-0.5">Obtén tu badge verificado</p>
            </div>
          </div>
          {onClose && (
            <button type="button" onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="text-center py-8">
          <Crown size={36} className="text-red-500/30 mx-auto mb-4" />
          <h4 className="font-orbitron font-bold text-white text-base mb-2">Inicia sesión para aplicar</h4>
          <p className="text-zinc-500 text-sm mb-6">Necesitas una cuenta para solicitar ser creador oficial.</p>
          <a href={getLoginUrl()}>
            <button className="px-6 py-3 rounded-xl font-orbitron font-bold text-sm text-white transition-colors"
              style={{ background: "oklch(0.50 0.22 25)" }}>
              INICIAR SESIÓN
            </button>
          </a>
        </div>
      </div>
    );
  }

  // ── Already approved ───────────────────────────────────────────────────────
  if (myApp?.status === "approved") {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.25)" }}>
              <CheckCircle size={18} className="text-green-500" />
            </div>
            <div>
              <h3 className="font-orbitron font-bold text-white text-base leading-tight">Creador Verificado</h3>
              <p className="text-zinc-500 text-xs mt-0.5">Tu solicitud fue aprobada</p>
            </div>
          </div>
          {onClose && (
            <button type="button" onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h4 className="font-orbitron font-bold text-white text-lg mb-2">¡Ya eres Creador Oficial!</h4>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            Tu cuenta está verificada y apareces en la plataforma.<br />
            Usa el botón <span className="text-red-400 font-mono">Transmitir</span> para iniciar un live.
          </p>
          {onClose && (
            <button onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-orbitron font-bold text-xs text-zinc-400 hover:text-white border transition-colors"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              CERRAR
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Pending review ─────────────────────────────────────────────────────────
  if (myApp?.status === "pending") {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(234,179,8,0.10)", border: "1px solid rgba(234,179,8,0.25)" }}>
              <Clock size={18} className="text-yellow-500" />
            </div>
            <div>
              <h3 className="font-orbitron font-bold text-white text-base leading-tight">Solicitud Enviada</h3>
              <p className="text-zinc-500 text-xs mt-0.5">En revisión por el equipo</p>
            </div>
          </div>
          {onClose && (
            <button type="button" onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="text-center py-6">
          <Clock size={36} className="text-yellow-500/60 mx-auto mb-4" />
          <h4 className="font-orbitron font-bold text-white text-base mb-2">Solicitud en revisión</h4>
          <p className="text-zinc-400 text-sm mb-6">Tu solicitud está siendo revisada por el equipo. Te notificaremos pronto.</p>
        </div>
        {/* Submitted data summary */}
        {(form.bio || form.youtube || form.twitch || form.twitter) && (
          <div className="rounded-xl border p-4 space-y-2" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-3">Datos enviados</p>
            {form.bio && <p className="text-zinc-300 text-sm leading-relaxed">{form.bio}</p>}
            <div className="flex flex-wrap gap-2 mt-2">
              {form.youtube && <span className="text-xs text-zinc-500 font-mono flex items-center gap-1"><Youtube size={10} /> {form.youtube}</span>}
              {form.twitch && <span className="text-xs text-zinc-500 font-mono flex items-center gap-1"><Twitch size={10} /> {form.twitch}</span>}
              {form.twitter && <span className="text-xs text-zinc-500 font-mono flex items-center gap-1"><Twitter size={10} /> {form.twitter}</span>}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Rejected or no application yet ────────────────────────────────────────
  return (
    <form onSubmit={e => { e.preventDefault(); submit.mutate(form); }} className="flex flex-col">
      {/* Sticky header */}
      <div className="flex items-center justify-between px-5 py-4 border-b shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.25)" }}>
            <Crown size={16} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-orbitron font-bold text-white text-sm leading-tight">Solicitar Verificación</h3>
            <p className="text-zinc-500 text-[11px] mt-0.5">El equipo revisará tu solicitud</p>
          </div>
        </div>
        {onClose && (
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">

        {/* Rejected notice */}
        {myApp?.status === "rejected" && (
          <div className="flex items-start gap-3 p-3 rounded-xl"
            style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)" }}>
            <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-red-400 text-xs font-mono font-semibold">Solicitud rechazada — puedes actualizar y reenviar</p>
              {myApp.adminNote && <p className="text-zinc-400 text-xs mt-1">{myApp.adminNote}</p>}
            </div>
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
            Categoría *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-mono transition-all text-left ${
                  form.category === cat.value
                    ? "text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
                style={form.category === cat.value
                  ? { background: "rgba(220,38,38,0.15)", borderColor: "rgba(220,38,38,0.50)" }
                  : { background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }
                }
              >
                <cat.icon size={13} className={form.category === cat.value ? "text-red-400" : "text-zinc-500"} />
                <span className="text-xs">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
            Descripción / Bio *
          </label>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            placeholder="Cuéntanos sobre ti y tu contenido..."
            rows={3}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors resize-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(220,38,38,0.50)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
          />
        </div>

        {/* Social links */}
        <div>
          <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
            Redes sociales <span className="text-zinc-600 normal-case font-normal">(al menos una)</span>
          </label>
          <div className="space-y-2">
            {[
              { key: "youtube",   icon: Youtube,   placeholder: "tu_canal",   prefix: "youtube.com/@" },
              { key: "twitch",    icon: Twitch,    placeholder: "tu_usuario", prefix: "twitch.tv/" },
              { key: "twitter",   icon: Twitter,   placeholder: "tu_usuario", prefix: "twitter.com/" },
              { key: "instagram", icon: Instagram, placeholder: "tu_usuario", prefix: "instagram.com/" },
              { key: "tiktok",    icon: null,      placeholder: "tu_usuario", prefix: "tiktok.com/@",   label: "TT" },
              { key: "facebook",  icon: null,      placeholder: "tu_pagina",  prefix: "facebook.com/",  label: "FB" },
              { key: "kick",      icon: null,      placeholder: "tu_usuario", prefix: "kick.com/",      label: "KC" },
            ].map(({ key, icon: Icon, placeholder, prefix, label }: any) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {Icon ? (
                    <Icon size={13} className="text-zinc-500" />
                  ) : (
                    <span className="text-[9px] font-bold text-zinc-500 font-mono">{label}</span>
                  )}
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                  <span className="text-[10px] text-zinc-600 font-mono px-1 mb-0.5 truncate">{prefix}</span>
                  <input
                    type="text"
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = "rgba(220,38,38,0.50)"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="rounded-xl px-4 py-3 text-xs text-zinc-400 leading-relaxed"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="font-semibold text-zinc-300 mb-1 uppercase tracking-wider font-mono text-[10px]">Requisito mínimo</p>
          Para ser considerado creador oficial debes contar con al menos{" "}
          <strong className="text-white">1,000 seguidores</strong> en alguna de tus plataformas.
        </div>

        {submit.error && (
          <p className="text-red-400 text-xs">{submit.error.message}</p>
        )}
      </div>

      {/* Sticky footer */}
      <div className="px-5 pb-5 pt-3 shrink-0 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <button
          type="submit"
          disabled={submit.isPending || !form.bio || !form.category}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-orbitron font-bold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "oklch(0.50 0.22 25)" }}
        >
          {submit.isPending ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={14} />
          )}
          {myApp?.status === "rejected" ? "Reenviar solicitud" : "Enviar solicitud"}
        </button>
      </div>
    </form>
  );
}

// ─── Main Creators Page ───────────────────────────────────────────────────────
export default function Creators() {
  const { isAuthenticated } = useAuth();
  const { data: myApp } = trpc.creators.getMyApplication.useQuery(undefined, { enabled: isAuthenticated });
  const { data: creators, isLoading } = trpc.creators.listApproved.useQuery();
  const { data: liveUserIds } = trpc.streams.liveCreators.useQuery(undefined, { refetchInterval: 60_000 });
  const liveSet = new Set(liveUserIds ?? []);
  const [activeFilter, setActiveFilter] = useState("all");

  // Modal: application form
  const [showApplyForm, setShowApplyForm] = useState(false);

  useEffect(() => {
    if (window.location.hash === "#apply") {
      setShowApplyForm(true);
    }
  }, []);

  const liveCount = (creators ?? []).filter((c: any) => liveSet.has(c.userId)).length;
  const filtered = activeFilter === "live"
    ? (creators ?? []).filter((c: any) => liveSet.has(c.userId))
    : activeFilter === "all"
    ? creators ?? []
    : (creators ?? []).filter((c: any) => c.category === activeFilter);

  return (
    <div className="min-h-screen bg-background text-white overflow-x-hidden">
      {/* Section Banner */}
      <div className="pt-1">
        <SectionBanner hidden sectionKey="creators" height="h-48 sm:h-64 lg:h-72">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase tracking-widest text-red-400">Red Level Circle</span>
            <h1 className="font-orbitron font-black text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight drop-shadow-lg">
              CREADORES
            </h1>
          </div>
        </SectionBanner>
      </div>

      <div className="pb-16 py-6 space-y-6">

        {/* Filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => setActiveFilter("all")}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-mono transition-all ${
              activeFilter === "all" ? "bg-red-600 text-white" : "bg-card text-muted-foreground hover:text-white border border-border"
            }`}
          >
            Todos ({creators?.length ?? 0})
          </button>
          {liveCount > 0 && (
            <button
              onClick={() => setActiveFilter("live")}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold font-mono transition-all ${
                activeFilter === "live" ? "text-white" : "text-red-400 hover:text-white border border-red-800/50 hover:border-red-600"
              }`}
              style={activeFilter === "live" ? { background: "oklch(0.50 0.22 25)", boxShadow: "0 0 12px oklch(0.50 0.22 25 / 0.5)" } : { background: "var(--bg-card)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              EN VIVO ({liveCount})
            </button>
          )}
          {CATEGORIES.map(cat => {
            const count = (creators ?? []).filter((c: any) => c.category === cat.value).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.value}
                onClick={() => setActiveFilter(cat.value)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-mono transition-all ${
                  activeFilter === cat.value ? "bg-red-600 text-white" : "bg-card text-muted-foreground hover:text-white border border-border"
                }`}
              >
                <cat.icon size={12} /> {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-[#111111] border border-white/[0.06] overflow-hidden animate-pulse">
                <div className="bg-zinc-800/60" style={{ height: "160px" }} />
                <div className="p-4 pt-10 space-y-3">
                  <div className="h-4 bg-zinc-800/60 rounded w-2/3 mx-auto" />
                  <div className="h-3 bg-zinc-800/60 rounded w-1/2 mx-auto" />
                  <div className="flex gap-1.5 mt-3">
                    {[...Array(3)].map((_, j) => <div key={j} className="h-8 bg-zinc-800/60 rounded-xl flex-1" />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users size={48} className="text-zinc-700 mx-auto mb-4" />
            <h3 className="font-orbitron font-bold text-muted-foreground text-lg mb-2">
              {activeFilter === "live" ? "No hay creadores transmitiendo ahora" : activeFilter === "all" ? "Aún no hay creadores aprobados" : "No hay creadores en esta categoría"}
            </h3>
            <p className="text-muted-foreground text-sm">¡Sé el primero en aplicar!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((c: any) => <CreatorCard key={c.id} c={c} isLive={liveSet.has(c.userId)} />)}
          </div>
        )}

        {/* ── Floating action button: Solicitar ser Creador ── */}
        <button
          onClick={() => setShowApplyForm(true)}
          className="fixed bottom-6 right-4 sm:bottom-8 sm:right-8 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl font-orbitron font-bold text-sm text-white shadow-2xl transition-all hover:scale-105 active:scale-95"
          style={{ background: "oklch(0.50 0.22 25)", boxShadow: "0 0 24px oklch(0.50 0.22 25 / 0.4)" }}
          title="Solicitar ser Creador Oficial"
        >
          <Crown size={16} />
          <span className="hidden sm:inline">Ser Creador</span>
        </button>

        {/* ── Modal: Application Form ── */}
        {showApplyForm && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(6px)" }}
            onClick={e => { if (e.target === e.currentTarget) setShowApplyForm(false); }}
          >
            <div
              className="w-full sm:max-w-md flex flex-col sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden"
              style={{
                background: "#111114",
                border: "1px solid rgba(255,255,255,0.07)",
                maxHeight: "92dvh",
              }}
            >
              <ApplicationForm onClose={() => setShowApplyForm(false)} />
            </div>
          </div>
        )}



      </div>
    </div>
  );
}
