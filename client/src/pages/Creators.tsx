import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { SectionBanner } from "@/components/SectionBanner";
import {
  Crown, Youtube, Twitch, Twitter, Instagram, Facebook, Play,
  Users, Gamepad2, Mic, Camera, Music, Zap,
} from "lucide-react";
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

// ─── Main Creators Page ───────────────────────────────────────────────────────
export default function Creators() {
  const { data: creators, isLoading } = trpc.creators.listApproved.useQuery();
  const { data: liveUserIds } = trpc.streams.liveCreators.useQuery(undefined, { refetchInterval: 60_000 });
  const liveSet = new Set(liveUserIds ?? []);
  const [activeFilter, setActiveFilter] = useState("all");

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
        <a
          href="/apply/creator"
          className="fixed bottom-6 right-4 sm:bottom-8 sm:right-8 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl font-orbitron font-bold text-sm text-white shadow-2xl transition-all hover:scale-105 active:scale-95"
          style={{ background: "oklch(0.50 0.22 25)", boxShadow: "0 0 24px oklch(0.50 0.22 25 / 0.4)" }}
          title="Solicitar ser Creador Oficial"
        >
          <Crown size={16} />
          <span className="hidden sm:inline">Ser Creador</span>
        </a>



      </div>
    </div>
  );
}
