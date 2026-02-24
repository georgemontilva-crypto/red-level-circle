import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";
import {
  Trophy, Users, Zap, ChevronRight, ChevronLeft, Play,
  Newspaper, Star, Youtube, Twitch, Twitter, Instagram,
  Calendar, Gamepad2, Crown, UserPlus, ArrowRight, ExternalLink,
  Swords, Target, TrendingUp, Globe, Medal, Coins, Flame,
  Shield, Clock, CheckCircle2, BarChart3
} from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d: Date | string | null | undefined) {
  if (!d) return "Por anunciar";
  return new Date(d).toLocaleDateString("es", { day: "numeric", month: "short" });
}
function statusLabel(s: string) {
  const map: Record<string, { text: string; color: string }> = {
    registration_open: { text: "Inscripciones abiertas", color: "bg-green-500" },
    in_progress: { text: "En curso", color: "bg-yellow-500" },
    upcoming: { text: "Próximamente", color: "bg-blue-500" },
    completed: { text: "Finalizado", color: "bg-zinc-600" },
  };
  return map[s] ?? { text: s, color: "bg-zinc-600" };
}
function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// ─── Hero Section (Epic Games style) ─────────────────────────────────────────
function HeroSection() {
  const { data: homeBanner } = trpc.banners.getSection.useQuery({ sectionKey: "home" });
  const { data: featuredTournaments } = trpc.home.featuredTournaments.useQuery();
  const [activeIdx, setActiveIdx] = useState(0);
  const sidebarItems = featuredTournaments ?? [];
  const heroBgImage = homeBanner?.isActive ? homeBanner.imageUrl : null;
  return (
    <div className="flex gap-3 h-[420px] sm:h-[480px]">
      {/* Main hero */}
      <div className="relative flex-1 rounded-2xl overflow-hidden">
        {heroBgImage ? (
          <img
            src={heroBgImage}
            alt={homeBanner?.title ?? "Banner inicio"}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-red-950/30 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
        {(homeBanner?.title || homeBanner?.subtitle) && (
          <div className="absolute bottom-0 left-0 p-6 sm:p-8 max-w-lg">
            {homeBanner.title && (
              <h1 className="font-orbitron font-black text-2xl sm:text-4xl text-white leading-tight mb-2 drop-shadow-lg">
                {homeBanner.title}
              </h1>
            )}
            {homeBanner.subtitle && (
              <p className="text-zinc-300 text-sm drop-shadow">{homeBanner.subtitle}</p>
            )}
            {homeBanner.linkUrl && (
              <a
                href={homeBanner.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-orbitron text-sm font-bold text-white bg-red-600 hover:bg-red-500 transition-all hover:scale-105"
              >
                <ExternalLink size={16} /> Ver más
              </a>
            )}
          </div>
        )}
        {/* Default hero content if no banner title */}
        {!homeBanner?.title && (
          <div className="absolute bottom-0 left-0 p-6 sm:p-8 max-w-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 font-mono text-xs tracking-widest uppercase">Plataforma de Esports</span>
            </div>
            <h1 className="font-orbitron font-black text-3xl sm:text-5xl text-white leading-tight mb-3 drop-shadow-lg">
              RED LEVEL<br /><span style={{ color: "oklch(0.65 0.22 25)" }}>CIRCLE</span>
            </h1>
            <p className="text-zinc-300 text-sm drop-shadow">Compite. Domina. Escala al siguiente nivel.</p>
          </div>
        )}
      </div>
      {/* Sidebar: Featured tournaments */}
      <div className="hidden lg:flex flex-col w-72 gap-1.5 overflow-y-auto scrollbar-none">
        {sidebarItems.length === 0 ? (
          <div className="flex-1 rounded-xl bg-zinc-900/60 border border-zinc-800/50 flex items-center justify-center">
            <p className="text-zinc-600 text-xs font-mono text-center px-4">Los torneos destacados aparecerán aquí</p>
          </div>
        ) : sidebarItems.map((t, i) => {
          const st = statusLabel(t.status ?? "");
          return (
            <Link key={t.id} href={`/tournaments/${t.id}`}>
              <div className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                i === activeIdx ? "bg-zinc-800 border-red-600/40" : "bg-zinc-900/60 border-zinc-800/50 hover:bg-zinc-800/80 hover:border-zinc-700"
              }`}>
                <div className="w-14 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                  {t.banner ? (
                    <img src={t.banner} alt={t.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Trophy size={16} className="text-red-500/50" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{t.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${st.color}`} />
                    <span className="text-xs text-zinc-500 truncate">{st.text}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Platform Stats ───────────────────────────────────────────────────────────
function PlatformStats() {
  const { data: stats } = trpc.home.stats.useQuery();
  const items = [
    {
      icon: <Users size={20} className="text-blue-400" />,
      label: "Jugadores",
      value: stats ? formatNumber(stats.totalUsers) : "—",
      color: "from-blue-950/40 to-transparent",
      border: "border-blue-900/30",
    },
    {
      icon: <Trophy size={20} className="text-yellow-400" />,
      label: "Torneos",
      value: stats ? formatNumber(stats.totalTournaments) : "—",
      color: "from-yellow-950/40 to-transparent",
      border: "border-yellow-900/30",
    },
    {
      icon: <Swords size={20} className="text-red-400" />,
      label: "Equipos",
      value: stats ? formatNumber(stats.totalTeams) : "—",
      color: "from-red-950/40 to-transparent",
      border: "border-red-900/30",
    },
    {
      icon: <Flame size={20} className="text-orange-400" />,
      label: "Activos ahora",
      value: stats ? formatNumber(stats.activeTournaments) : "—",
      color: "from-orange-950/40 to-transparent",
      border: "border-orange-900/30",
    },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item, i) => (
        <div
          key={i}
          className={`relative rounded-2xl overflow-hidden border ${item.border} p-4`}
          style={{ background: "oklch(0.10 0.005 0)" }}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${item.color}`} />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-1">{item.label}</p>
              <p className="font-orbitron font-black text-2xl text-white">{item.value}</p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.15 0.01 0)" }}>
              {item.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Top Teams Leaderboard ────────────────────────────────────────────────────
function TopTeamsLeaderboard() {
  const { data: topTeams } = trpc.home.topTeams.useQuery();
  if (!topTeams || topTeams.length === 0) return null;
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-orbitron font-bold text-white text-lg flex items-center gap-2">
          <BarChart3 size={18} className="text-yellow-400" /> Top Equipos
        </h2>
        <Link href="/ranking" className="flex items-center gap-1.5 text-xs font-mono text-red-400 hover:text-red-300 transition-colors">
          Ver ranking completo <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {topTeams.slice(0, 6).map((team: any, i: number) => (
          <Link key={team.id} href={`/teams/${team.id}`}>
            <div
              className="flex items-center gap-3 p-4 rounded-2xl border border-zinc-800/50 hover:border-zinc-700 transition-all cursor-pointer group"
              style={{ background: "oklch(0.10 0.005 0)" }}
            >
              {/* Rank */}
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-orbitron font-black text-sm"
                style={{
                  background: i < 3 ? "oklch(0.55 0.22 25 / 0.15)" : "oklch(0.15 0.01 0)",
                  color: i < 3 ? "oklch(0.75 0.22 25)" : "oklch(0.45 0.01 0)",
                  border: i < 3 ? "1px solid oklch(0.55 0.22 25 / 0.3)" : "1px solid transparent",
                }}>
                {i < 3 ? medals[i] : `#${i + 1}`}
              </div>
              {/* Logo */}
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-zinc-800">
                {team.logo ? (
                  <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Shield size={16} className="text-zinc-600" />
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate group-hover:text-red-300 transition-colors">{team.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {team.game && <span className="text-zinc-600 text-xs font-mono truncate">{team.game}</span>}
                </div>
              </div>
              {/* Points */}
              <div className="text-right shrink-0">
                <p className="font-orbitron font-bold text-sm" style={{ color: "oklch(0.65 0.18 80)" }}>{team.points ?? 0}</p>
                <p className="text-zinc-600 text-xs font-mono">pts</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Active Tournaments Section ───────────────────────────────────────────────
function ActiveTournamentsSection() {
  const { data: featured } = trpc.home.featuredTournaments.useQuery();
  if (!featured || featured.length === 0) return null;
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-orbitron font-bold text-white text-lg flex items-center gap-2">
          <Trophy size={18} className="text-red-500" /> Torneos Activos
        </h2>
        <Link href="/tournaments" className="flex items-center gap-1.5 text-xs font-mono text-red-400 hover:text-red-300 transition-colors">
          Ver todos <ArrowRight size={14} />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2" style={{ scrollSnapType: "x mandatory" }}>
        {featured.map(t => <TournamentCard key={t.id} t={t} />)}
      </div>
    </section>
  );
}

// ─── Horizontal Scroll Carousel ───────────────────────────────────────────────
function HScrollCarousel({ title, href, icon, children }: { title: string; href?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-orbitron font-bold text-white text-lg flex items-center gap-2">
          {icon}
          {title}
          {href && (
            <Link href={href}>
              <span className="text-red-400 hover:text-red-300 transition-colors"><ChevronRight size={20} /></span>
            </Link>
          )}
        </h2>
        <div className="flex gap-1.5">
          <button onClick={() => scroll(-1)} className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => scroll(1)} className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div ref={ref} className="flex gap-3 overflow-x-auto scrollbar-none pb-2" style={{ scrollSnapType: "x mandatory" }}>
        {children}
      </div>
    </section>
  );
}

// ─── Tournament Card ──────────────────────────────────────────────────────────
function TournamentCard({ t }: { t: any }) {
  const st = statusLabel(t.status ?? "");
  return (
    <Link href={`/tournaments/${t.id}`}>
      <div className="shrink-0 w-72 rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:-translate-y-1"
        style={{ scrollSnapAlign: "start", background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.18 0.01 0)", boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "oklch(0.55 0.22 25 / 0.5)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px oklch(0.55 0.22 25 / 0.2)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "oklch(0.18 0.01 0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)"; }}
      >
        <div className="relative h-44 bg-zinc-900 overflow-hidden">
          {t.banner ? (
            <img src={t.banner} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, oklch(0.12 0.02 25) 0%, oklch(0.08 0.005 0) 100%)" }}>
              <Trophy size={40} style={{ color: "oklch(0.55 0.22 25 / 0.3)" }} />
            </div>
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, oklch(0.10 0.005 0) 0%, transparent 60%)" }} />
          {t.game && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-mono"
              style={{ background: "rgba(0,0,0,0.65)", color: "oklch(0.65 0.22 25)", border: "1px solid oklch(0.55 0.22 25 / 0.3)", backdropFilter: "blur(8px)" }}>
              {t.game}
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="text-white font-bold text-base truncate font-display mb-3">{t.name}</p>
          <div className="flex items-center gap-1.5 mb-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${
              t.status === "registration_open" ? "bg-green-500" :
              t.status === "in_progress" ? "bg-yellow-400 animate-pulse" :
              "bg-zinc-500"
            }`} />
            <span className={`text-xs font-mono font-semibold ${
              t.status === "registration_open" ? "text-green-400" :
              t.status === "in_progress" ? "text-yellow-400" :
              "text-zinc-500"
            }`}>{st.text}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🪙</span>
              <span className="font-orbitron font-bold text-sm" style={{ color: "oklch(0.65 0.18 80)" }}>{t.prizeAmount ? `${t.prizeAmount} RLC` : "—"}</span>
            </div>
            <span className="text-zinc-500 text-xs flex items-center gap-1 font-mono"><Calendar size={11} />{formatDate(t.startDate)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── User Card (small) ────────────────────────────────────────────────────────
function UserCard({ u, showFollow = false }: { u: any; showFollow?: boolean }) {
  const { isAuthenticated, user } = useAuth();
  const follow = trpc.follows.follow.useMutation();
  const utils = trpc.useUtils();
  return (
    <Link href={`/profile/${u.id}`}>
      <div className="shrink-0 w-36 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/50 hover:border-red-600/30 transition-all cursor-pointer group text-center p-4" style={{ scrollSnapAlign: "start" }}>
        <div className="flex justify-center">
          <UserAvatar
            avatar={u.avatar}
            name={u.nickname ?? u.name}
            activeFrameImage={u.activeFrameImage}
            size={56}
            className="border-2 border-zinc-700 group-hover:border-red-600/40 transition-colors rounded-full"
          />
        </div>
        <p className="text-white text-xs font-semibold mt-2 truncate">{u.nickname ?? u.name ?? "Usuario"}</p>
        <p className="text-zinc-600 text-xs font-mono truncate">@{u.name ?? "user"}</p>
        {showFollow && isAuthenticated && user?.id !== u.id && (
          <button
            onClick={e => { e.preventDefault(); follow.mutate({ userId: u.id }, { onSuccess: () => utils.home.recentUsers.invalidate() }); }}
            className="mt-2 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors mx-auto"
          >
            <UserPlus size={10} /> Seguir
          </button>
        )}
      </div>
    </Link>
  );
}

// ─── Creator Card ─────────────────────────────────────────────────────────────
function CreatorCard({ c }: { c: any }) {
  const name = c.nickname ?? c.userName ?? "Creador";
  const [, navigate] = useLocation();
  return (
    <div
      className="shrink-0 w-52 rounded-xl bg-zinc-900 border border-zinc-800/50 hover:border-red-600/40 transition-all cursor-pointer group"
      style={{ scrollSnapAlign: "start", overflow: "visible" }}
      onClick={() => navigate(`/profile/${c.userId}`)}
    >
      <div className="relative h-20 bg-gradient-to-br from-zinc-800 to-red-950/20 rounded-t-xl overflow-hidden">
        {c.banner && <img src={c.banner} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="relative" style={{ height: 0 }}>
        <div className="absolute -top-6 left-4" style={{ border: "3px solid oklch(0.10 0.005 0)", borderRadius: "9999px", display: "inline-block", zIndex: 10 }}>
          <UserAvatar
            avatar={c.avatar}
            name={name}
            activeFrameImage={c.activeFrameImage}
            size={48}
          />
        </div>
      </div>
      <div className="pt-8 px-4 pb-4 rounded-b-xl" style={{ background: "oklch(0.12 0.005 0)" }}>
        <div className="flex items-center gap-1.5">
          <p className="text-white font-bold text-sm truncate">{name}</p>
          {c.isVerified && <VerifiedBadge size={14} />}
        </div>
        {c.category && <p className="text-red-400 text-xs font-mono capitalize">{c.category}</p>}
        {c.bio && <p className="text-zinc-500 text-xs mt-1 line-clamp-2">{c.bio}</p>}
        <div className="flex items-center gap-2 mt-3">
          {c.youtube && <a href={`https://youtube.com/@${c.youtube}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-zinc-500 hover:text-red-500 transition-colors"><Youtube size={14} /></a>}
          {c.twitch && <a href={`https://twitch.tv/${c.twitch}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-zinc-500 hover:text-purple-400 transition-colors"><Twitch size={14} /></a>}
          {c.twitter && <a href={`https://twitter.com/${c.twitter}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-zinc-500 hover:text-sky-400 transition-colors"><Twitter size={14} /></a>}
          {c.instagram && <a href={`https://instagram.com/${c.instagram}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-zinc-500 hover:text-pink-400 transition-colors"><Instagram size={14} /></a>}
        </div>
      </div>
    </div>
  );
}

// ─── News Card ────────────────────────────────────────────────────────────────
function NewsCard({ n }: { n: any }) {
  return (
    <Link href={`/news/${n.slug ?? n.id}`}>
      <div className="shrink-0 w-64 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/50 hover:border-zinc-700 transition-all cursor-pointer group" style={{ scrollSnapAlign: "start" }}>
        <div className="h-36 bg-zinc-800 overflow-hidden">
          {n.imageUrl ? (
            <img src={n.imageUrl} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
              <Newspaper size={28} className="text-zinc-600" />
            </div>
          )}
        </div>
        <div className="p-3">
          {n.category && (
            <span className="text-xs font-mono text-red-400 uppercase tracking-wider">{n.category}</span>
          )}
          <p className="text-white font-semibold text-sm mt-1 line-clamp-2 leading-snug">{n.title}</p>
          <p className="text-zinc-600 text-xs mt-1">{formatDate(n.publishedAt ?? n.createdAt)}</p>
        </div>
      </div>
    </Link>
  );
}

// ─── Missions Preview ─────────────────────────────────────────────────────────
function MissionsPreview() {
  const { data: missions } = trpc.home.availableMissions.useQuery();
  if (!missions || missions.length === 0) return null;
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-orbitron font-bold text-white text-lg flex items-center gap-2">
            <Target size={18} className="text-green-400" /> Misiones Disponibles
          </h2>
          <p className="text-zinc-500 text-xs mt-0.5">Completa misiones y gana RLC Coins</p>
        </div>
        <Link href="/rewards" className="flex items-center gap-1.5 text-xs font-mono text-green-400 hover:text-green-300 transition-colors">
          Ver todas <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {missions.slice(0, 3).map((m: any) => (
          <Link key={m.id} href="/rewards">
            <div
              className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-800/50 hover:border-green-900/50 transition-all cursor-pointer group"
              style={{ background: "oklch(0.10 0.005 0)" }}
            >
              {/* Thumbnail or icon */}
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-zinc-800 flex items-center justify-center">
                {m.thumbnailUrl ? (
                  <img src={m.thumbnailUrl} alt={m.title} className="w-full h-full object-cover" />
                ) : m.sponsorLogoUrl ? (
                  <img src={m.sponsorLogoUrl} alt={m.sponsorName ?? ""} className="w-full h-full object-contain p-2" />
                ) : (
                  <Play size={20} className="text-green-400" />
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                {m.sponsorName && (
                  <p className="text-zinc-500 text-xs font-mono mb-0.5 truncate">{m.sponsorName}</p>
                )}
                <p className="text-white font-semibold text-sm line-clamp-2 leading-snug group-hover:text-green-300 transition-colors">{m.title}</p>
              </div>
              {/* Reward */}
              <div className="text-right shrink-0">
                <p className="font-orbitron font-bold text-sm text-yellow-400">+{m.reward}</p>
                <p className="text-zinc-600 text-xs font-mono">RLC</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Games Section ────────────────────────────────────────────────────────────
function GamesSection({ allTournaments }: { allTournaments: any[] }) {
  const { data: gamesList } = trpc.games.list.useQuery();
  if (!gamesList || gamesList.length === 0) return null;
  const tournamentCountByGame = allTournaments.reduce((acc: Record<string, number>, t: any) => {
    if (t.game) acc[t.game] = (acc[t.game] ?? 0) + 1;
    return acc;
  }, {});
  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-orbitron font-bold text-white text-lg flex items-center gap-2">
          <Gamepad2 size={18} className="text-red-500" /> Torneos por Juego
        </h2>
        <Link href="/tournaments" className="flex items-center gap-1.5 text-xs font-mono text-red-400 hover:text-red-300 transition-colors">
          Ver todos <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {gamesList.map(g => (
          <Link key={g.id} href={`/tournaments?game=${encodeURIComponent(g.name)}`}>
            <div className="group relative rounded-2xl overflow-hidden cursor-pointer aspect-[3/4] bg-zinc-900"
              style={{ border: "1px solid oklch(0.18 0.01 0)", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}
            >
              {(g.banner || g.logo) ? (
                <img
                  src={g.banner ?? g.logo ?? ""}
                  alt={g.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, oklch(0.12 0.02 25) 0%, oklch(0.08 0.005 0) 100%)" }}>
                  <Gamepad2 size={48} style={{ color: "oklch(0.55 0.22 25 / 0.3)" }} />
                </div>
              )}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }} />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "linear-gradient(to top, oklch(0.55 0.22 25 / 0.25) 0%, transparent 60%)" }} />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="font-orbitron font-bold text-white text-sm leading-tight mb-1.5 group-hover:text-red-300 transition-colors">{g.name}</p>
                <div className="flex items-center gap-1.5">
                  <Trophy size={11} className="text-red-400" />
                  <span className="text-xs font-mono text-zinc-400">
                    {tournamentCountByGame[g.name] ?? 0} torneo{(tournamentCountByGame[g.name] ?? 0) !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              {(tournamentCountByGame[g.name] ?? 0) > 0 && (
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-green-500"
                  style={{ boxShadow: "0 0 8px #22c55e" }} />
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Recent Teams ─────────────────────────────────────────────────────────────
function RecentTeamsSection() {
  const { data: topTeams } = trpc.home.topTeams.useQuery();
  if (!topTeams || topTeams.length === 0) return null;
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-orbitron font-bold text-white text-lg flex items-center gap-2">
          <Shield size={18} className="text-blue-400" /> Equipos Destacados
        </h2>
        <Link href="/teams" className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors">
          Ver equipos <ArrowRight size={14} />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
        {topTeams.map((team: any) => (
          <Link key={team.id} href={`/teams/${team.id}`}>
            <div
              className="shrink-0 w-48 rounded-2xl overflow-hidden border border-zinc-800/50 hover:border-red-600/30 transition-all cursor-pointer group"
              style={{ background: "oklch(0.10 0.005 0)", scrollSnapAlign: "start" }}
            >
              {/* Banner */}
              <div className="h-20 bg-gradient-to-br from-zinc-800 to-red-950/20 overflow-hidden relative">
                {team.banner && <img src={team.banner} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
                {/* Verified badge */}
                {team.isVerified && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <CheckCircle2 size={12} className="text-white" />
                  </div>
                )}
              </div>
              {/* Logo */}
              <div className="relative" style={{ height: 0 }}>
                <div className="absolute -top-6 left-3" style={{ border: "2px solid oklch(0.10 0.005 0)", borderRadius: "0.75rem", display: "inline-block", zIndex: 10 }}>
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center">
                    {team.logo ? (
                      <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                    ) : (
                      <Shield size={18} className="text-zinc-600" />
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-8 px-3 pb-3">
                <p className="text-white font-bold text-sm truncate group-hover:text-red-300 transition-colors">{team.name}</p>
                {team.game && <p className="text-zinc-500 text-xs font-mono truncate mt-0.5">{team.game}</p>}
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <Trophy size={10} className="text-yellow-500" />
                    <span className="text-zinc-400 text-xs font-mono">{team.tournamentsWon ?? 0}W</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={10} className="text-green-500" />
                    <span className="text-zinc-400 text-xs font-mono">{team.points ?? 0}pts</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Main Home ────────────────────────────────────────────────────────────────
export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const { data: allTournaments } = trpc.tournaments.list.useQuery({ status: undefined, game: undefined });
  const { data: news } = trpc.news.list.useQuery({ limit: 10 });
  const { data: recentUsers } = trpc.home.recentUsers.useQuery();
  const { data: suggestedUsers } = trpc.home.suggestedUsers.useQuery(undefined, { enabled: isAuthenticated });
  const { data: creators } = trpc.creators.listApproved.useQuery();

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-10">

        {/* ── Hero ── */}
        <HeroSection />

        {/* ── Platform Stats ── */}
        <PlatformStats />

        {/* ── Torneos Activos ── */}
        <ActiveTournamentsSection />

        {/* ── Top Equipos (Leaderboard) ── */}
        <TopTeamsLeaderboard />

        {/* ── Misiones Disponibles ── */}
        <MissionsPreview />

        {/* ── Juegos ── */}
        <GamesSection allTournaments={allTournaments ?? []} />

        {/* ── Noticias ── */}
        {(news?.length ?? 0) > 0 && (
          <HScrollCarousel
            title="Últimas Noticias"
            href="/news"
            icon={<Newspaper size={18} className="text-zinc-400" />}
          >
            {news!.map(n => <NewsCard key={n.id} n={n} />)}
          </HScrollCarousel>
        )}

        {/* ── Creadores Oficiales ── */}
        {(creators?.length ?? 0) > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-orbitron font-bold text-white text-lg flex items-center gap-2">
                  <Star size={18} className="text-purple-400" /> Creadores Oficiales
                </h2>
                <p className="text-zinc-500 text-xs mt-0.5">Creadores de contenido verificados de la plataforma</p>
              </div>
              <Link href="/creators" className="flex items-center gap-1.5 text-xs font-mono text-red-400 hover:text-red-300 transition-colors">
                Ver todos <ArrowRight size={14} />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
              {creators!.map(c => <CreatorCard key={c.id} c={c} />)}
            </div>
          </section>
        )}

        {/* ── Equipos Destacados ── */}
        <RecentTeamsSection />

        {/* ── Quizás conozcas ── */}
        {((isAuthenticated ? suggestedUsers : recentUsers)?.length ?? 0) > 0 && (
          <HScrollCarousel
            title="Quizás Conozcas"
            href="/community"
            icon={<Users size={18} className="text-blue-400" />}
          >
            {(isAuthenticated ? suggestedUsers! : recentUsers!).map(u => (
              <UserCard key={u.id} u={u} showFollow={isAuthenticated} />
            ))}
          </HScrollCarousel>
        )}

        {/* ── Nuevos jugadores ── */}
        {(recentUsers?.length ?? 0) > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-orbitron font-bold text-white text-lg flex items-center gap-2">
                <UserPlus size={18} className="text-blue-400" /> Nuevos en la Plataforma
              </h2>
              <Link href="/community" className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors">
                Ver comunidad <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {recentUsers!.slice(0, 6).map(u => (
                <Link key={u.id} href={`/profile/${u.id}`}>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/50 hover:border-zinc-700 transition-colors cursor-pointer">
                    <UserAvatar
                      avatar={u.avatar}
                      name={u.nickname ?? u.name}
                      activeFrameImage={u.activeFrameImage}
                      size={32}
                    />
                    <div className="min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{u.nickname ?? u.name ?? "Usuario"}</p>
                      <p className="text-zinc-600 text-xs">{formatDate(u.createdAt)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── CTA para no autenticados ── */}
        {!isAuthenticated && (
          <section className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-950/60 via-black to-black" />
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "repeating-linear-gradient(45deg, #ff0000 0, #ff0000 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />
            <div className="relative p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="font-orbitron font-black text-2xl sm:text-3xl text-white mb-2">
                  ¿Listo para competir?
                </h2>
                <p className="text-zinc-400 text-sm max-w-md">
                  Únete a la plataforma de esports más grande. Inscríbete en torneos, crea tu equipo y escala en el ranking global.
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                <a href={getLoginUrl()}
                  className="px-6 py-3 rounded-xl font-orbitron font-bold text-sm text-white transition-all hover:scale-105"
                  style={{ background: "oklch(0.55 0.22 25)", boxShadow: "0 0 20px oklch(0.55 0.22 25 / 0.4)" }}>
                  REGISTRARSE
                </a>
                <Link href="/tournaments"
                  className="px-6 py-3 rounded-xl font-orbitron font-bold text-sm text-white border border-zinc-700 hover:border-zinc-500 transition-colors bg-zinc-900/60">
                  VER TORNEOS
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── Sección Creadores (CTA) ── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/creators">
            <div className="relative rounded-2xl overflow-hidden cursor-pointer group h-40">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-950/60 via-zinc-900 to-black" />
              <div className="relative p-6 h-full flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <Play size={20} className="text-purple-400" />
                  <span className="font-orbitron text-sm text-purple-400 tracking-wider">CREADORES DE CONTENIDO</span>
                </div>
                <div>
                  <h3 className="font-orbitron font-bold text-white text-lg">Conoce a nuestros creadores</h3>
                  <p className="text-zinc-500 text-xs mt-1">Streamers, YouTubers y creadores verificados de la plataforma</p>
                </div>
                <div className="flex items-center gap-1 text-purple-400 text-xs font-mono group-hover:gap-2 transition-all">
                  Ver creadores <ArrowRight size={12} />
                </div>
              </div>
            </div>
          </Link>
          <Link href="/creators#apply">
            <div className="relative rounded-2xl overflow-hidden cursor-pointer group h-40">
              <div className="absolute inset-0 bg-gradient-to-br from-red-950/60 via-zinc-900 to-black" />
              <div className="relative p-6 h-full flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <Crown size={20} className="text-red-400" />
                  <span className="font-orbitron text-sm text-red-400 tracking-wider">¿ERES CREADOR?</span>
                </div>
                <div>
                  <h3 className="font-orbitron font-bold text-white text-lg">Aplica como creador oficial</h3>
                  <p className="text-zinc-500 text-xs mt-1">Obtén tu badge verificado y aparece en la plataforma</p>
                </div>
                <div className="flex items-center gap-1 text-red-400 text-xs font-mono group-hover:gap-2 transition-all">
                  Aplicar ahora <ArrowRight size={12} />
                </div>
              </div>
            </div>
          </Link>
        </section>

      </div>
    </div>
  );
}
