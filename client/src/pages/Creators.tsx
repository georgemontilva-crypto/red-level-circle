import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { SectionBanner } from "@/components/SectionBanner";
import { CreatorStreamPanel } from "@/components/CreatorStreamPanel";
import {
  Star, Crown, Youtube, Twitch, Twitter, Instagram, Play,
  CheckCircle, Clock, XCircle, Send, Users, Check,
  Gamepad2, Mic, Camera, Music, Zap, ExternalLink, X,
} from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/UserAvatar";
import { DefaultBannerBg } from "@/components/DefaultBannerBg";
import { Button } from "@/components/ui/button";

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
function SocialBtn({ href, icon, label, color }: { href: string; icon: React.ReactNode; label: string; color: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      title={label}
      className={`flex items-center justify-center gap-1.5 flex-1 min-w-0 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border ${color}`}
    >
      {icon}
      <span className="truncate hidden sm:inline">{label}</span>
    </a>
  );
}

// ─── Creator Card ─────────────────────────────────────────────────────────────
function CreatorCard({ c, isLive }: { c: any; isLive?: boolean }) {
  const name = c.nickname ?? c.userName ?? "Creador";
  const cat = CATEGORIES.find(x => x.value === c.category);
  const [, navigate] = useLocation();

  const socials = [
    c.youtube   && { href: `https://youtube.com/@${c.youtube}`,    icon: <Youtube className="w-3.5 h-3.5 flex-shrink-0" />,   label: "YouTube",   color: "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-red-900/50 hover:text-red-300 hover:border-red-800" },
    c.twitch    && { href: `https://twitch.tv/${c.twitch}`,         icon: <Twitch className="w-3.5 h-3.5 flex-shrink-0" />,    label: "Twitch",    color: "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-purple-900/50 hover:text-purple-300 hover:border-purple-800" },
    c.twitter   && { href: `https://twitter.com/${c.twitter}`,      icon: <Twitter className="w-3.5 h-3.5 flex-shrink-0" />,   label: "Twitter",   color: "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-sky-900/50 hover:text-sky-300 hover:border-sky-800" },
    c.instagram && { href: `https://instagram.com/${c.instagram}`,  icon: <Instagram className="w-3.5 h-3.5 flex-shrink-0" />, label: "Instagram", color: "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-pink-900/50 hover:text-pink-300 hover:border-pink-800" },
    c.tiktok    && { href: `https://tiktok.com/@${c.tiktok}`,       icon: <TikTokIcon className="w-3.5 h-3.5 flex-shrink-0" />, label: "TikTok",  color: "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-600/50 hover:text-white hover:border-zinc-500" },
    c.facebook  && { href: `https://facebook.com/${c.facebook}`,    icon: <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />, label: "Facebook", color: "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-blue-900/50 hover:text-blue-300 hover:border-blue-800" },
    c.kick      && { href: `https://kick.com/${c.kick}`,            icon: <KickIcon className="w-3.5 h-3.5 flex-shrink-0" />,  label: "Kick",      color: "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-green-900/50 hover:text-green-300 hover:border-green-800" },
  ].filter(Boolean) as { href: string; icon: React.ReactNode; label: string; color: string }[];

  // Subtitle: category label + games/platforms
  const subtitle = cat ? `Creador de contenido de: ${cat.label}` : "Creador de contenido";

  return (
    <div
      onClick={() => navigate(`/profile/${c.userId}`)}
      className="w-full max-w-sm bg-black rounded-3xl shadow-2xl cursor-pointer"
    >
      {/* Banner Section */}
      <div className="relative h-48 w-full overflow-hidden rounded-3xl">
        {c.banner ? (
          <img
            src={c.banner}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <DefaultBannerBg />
        )}
        {/* LIVE badge */}
        {isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white font-black text-[10px] tracking-wider z-10"
            style={{ background: "oklch(0.50 0.22 25)", boxShadow: "0 0 10px rgba(239,68,68,0.6)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            EN VIVO
          </div>
        )}
        {/* Category badge */}
        {!isLive && cat && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 text-[10px] text-zinc-300 font-mono border border-white/10 z-10">
            <cat.icon size={9} /> {cat.label}
          </div>
        )}
      </div>
      {/* Avatar Section - Overlapping */}
      <div className="relative px-6 pb-6">
        {/* Avatar Circle */}
        <div className="flex justify-center -mt-20 mb-4">
          <div className="w-32 h-32 rounded-full border-4 border-black shadow-lg overflow-hidden">
            <UserAvatar
              avatar={c.avatar}
              name={name}
              activeFrameImage={c.activeFrameImage}
              size={128}
            />
          </div>
        </div>
        {/* Name and Description */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-white">{name}</h1>
            {c.isVerified && <Check className="w-5 h-5 text-blue-500 fill-blue-500" />}
          </div>
          <p className="text-sm text-gray-400">{subtitle}</p>
        </div>
        {/* Social Buttons */}
        {socials.length > 0 && (
          <div className="flex items-center gap-1.5">
            {socials.slice(0, 4).map((s, i) => (
              <SocialBtn key={i} href={s.href} icon={s.icon} label={s.label} color={s.color} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Application Form ─────────────────────────────────────────────────────────
function ApplicationForm({ onSuccess, onClose }: { onSuccess?: () => void; onClose?: () => void }) {
  const { isAuthenticated, user } = useAuth();
  const { data: myApp, refetch } = trpc.creators.getMyApplication.useQuery(undefined, { enabled: isAuthenticated });
  const submit = trpc.creators.submitApplication.useMutation({
    onSuccess: () => {
      toast.success("¡Solicitud enviada! La revisaremos pronto.");
      refetch();
      onSuccess?.();
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

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <Crown size={40} className="text-red-500/40 mx-auto mb-4" />
        <h3 className="font-orbitron font-bold text-white text-lg mb-2">Inicia sesión para aplicar</h3>
        <p className="text-muted-foreground text-sm mb-6">Necesitas una cuenta para solicitar ser creador oficial.</p>
        <a href={getLoginUrl()}>
          <button className="px-6 py-3 rounded-xl font-orbitron font-bold text-sm text-white bg-red-600 hover:bg-red-700 transition-colors">
            INICIAR SESIÓN
          </button>
        </a>
      </div>
    );
  }

  if (myApp?.status === "approved") {
    return (
      <div className="max-w-2xl mx-auto">
        <CreatorStreamPanel creatorApp={myApp} />
      </div>
    );
  }

  if (myApp?.status === "pending") {
    return (
      <div className="text-center py-12">
        <Clock size={40} className="text-yellow-500 mx-auto mb-4" />
        <h3 className="font-orbitron font-bold text-white text-lg mb-2">Solicitud en revisión</h3>
        <p className="text-muted-foreground text-sm">Tu solicitud está siendo revisada por el equipo. Te notificaremos pronto.</p>
        <div className="mt-6 p-4 rounded-xl bg-card border border-border text-left max-w-md mx-auto">
          <p className="text-xs font-mono text-muted-foreground mb-2">DATOS ENVIADOS</p>
          {form.bio && <p className="text-secondary-foreground text-sm">{form.bio}</p>}
          <div className="flex flex-wrap gap-2 mt-3">
            {form.youtube && <span className="text-xs text-muted-foreground font-mono flex items-center gap-1"><Youtube size={10} /> {form.youtube}</span>}
            {form.twitch && <span className="text-xs text-muted-foreground font-mono flex items-center gap-1"><Twitch size={10} /> {form.twitch}</span>}
            {form.twitter && <span className="text-xs text-muted-foreground font-mono flex items-center gap-1"><Twitter size={10} /> {form.twitter}</span>}
          </div>
        </div>
      </div>
    );
  }

  if (myApp?.status === "rejected") {
    // Allow re-application
  }

  return (
    <form onSubmit={e => { e.preventDefault(); submit.mutate(form); }} className="space-y-5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-orbitron font-bold text-lg text-white">Solicitar Verificación</h3>
          <p className="text-zinc-400 text-xs mt-0.5">Completa el formulario y el equipo revisará tu solicitud</p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      {myApp?.status === "rejected" && (
        <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/40">
          <p className="text-red-400 text-xs font-mono flex items-center gap-2"><XCircle size={12} /> Solicitud rechazada — puedes actualizar y reenviar</p>
          {myApp.adminNote && <p className="text-zinc-400 text-xs mt-1">{myApp.adminNote}</p>}
        </div>
      )}

      {/* Category */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Categoría *</label>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setForm(f => ({ ...f, category: cat.value }))}
              className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-mono transition-all ${
                form.category === cat.value
                  ? "border-red-600/70 bg-red-600/20 text-white"
                  : "border-white/10 bg-zinc-800/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              }`}
            >
              <cat.icon size={14} /> {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Descripción / Bio *</label>
        <textarea
          value={form.bio}
          onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
          placeholder="Cuéntanos sobre ti y tu contenido..."
          rows={3}
          className="w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/60 transition-colors resize-none"
        />
      </div>

      {/* Social links */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Redes sociales (al menos una)</label>
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
              <div className="w-8 h-8 rounded-lg bg-zinc-700/60 border border-white/10 flex items-center justify-center shrink-0">
                {Icon ? (
                  <Icon size={14} className="text-zinc-400" />
                ) : (
                  <span className="text-[9px] font-bold text-zinc-400 font-mono">{label}</span>
                )}
              </div>
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono pointer-events-none">{prefix}</span>
                <input
                  type="text"
                  value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-zinc-800/60 border border-white/10 rounded-lg py-2 pr-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/60 transition-colors"
                  style={{ paddingLeft: `${prefix.length * 7 + 12}px` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/40 px-4 py-3 text-xs text-zinc-400 leading-relaxed">
        <p className="font-semibold text-zinc-300 mb-1 uppercase tracking-wider font-mono text-[10px]">Requisito mínimo</p>
        Para ser considerado creador oficial de Red Level Circle debes contar con al menos <strong className="text-white">1,000 seguidores</strong> en alguna de tus plataformas.
      </div>

      {submit.error && (
        <p className="text-red-400 text-xs">{submit.error.message}</p>
      )}

      <button
        type="submit"
        disabled={submit.isPending || !form.bio || !form.category}
        className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {submit.isPending ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Send size={15} />
        )}
        {myApp?.status === "rejected" ? "Reenviar solicitud" : "Enviar solicitud"}
      </button>
    </form>
  );
}

// ─── Main Creators Page ───────────────────────────────────────────────────────
export default function Creators() {
  const { data: creators, isLoading } = trpc.creators.listApproved.useQuery();
  const { data: liveUserIds } = trpc.streams.liveCreators.useQuery(undefined, { refetchInterval: 60_000 });
  const liveSet = new Set(liveUserIds ?? []);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (window.location.hash === "#apply") {
      setShowForm(true);
      setTimeout(() => {
        document.getElementById("apply-section")?.scrollIntoView({ behavior: "smooth" });
      }, 300);
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
      <div className="pt-4">
        <SectionBanner sectionKey="creators" height="h-48 sm:h-64 lg:h-72">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase tracking-widest text-red-400">Red Level Circle</span>
            <h1 className="font-orbitron font-black text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight drop-shadow-lg">
              CREADORES
            </h1>
          </div>
        </SectionBanner>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-16 space-y-10">

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((c: any) => <CreatorCard key={c.id} c={c} isLive={liveSet.has(c.userId)} />)}
          </div>
        )}

        {/* Floating apply button */}
        <div className="fixed bottom-8 right-8 z-50">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl font-orbitron font-bold text-sm text-white shadow-2xl transition-all hover:scale-105 active:scale-95"
            style={{ background: "oklch(0.55 0.22 25)", boxShadow: "0 0 24px oklch(0.55 0.22 25 / 0.5)" }}
            title="Solicitar ser Creador Oficial"
          >
            <Crown size={16} />
            <span className="hidden sm:inline">Ser Creador</span>
          </button>
        </div>

        {/* Modal */}
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
            onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}
          >
            <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl overflow-y-auto max-h-[90vh] shadow-2xl">
              <ApplicationForm onSuccess={() => setShowForm(false)} onClose={() => setShowForm(false)} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
