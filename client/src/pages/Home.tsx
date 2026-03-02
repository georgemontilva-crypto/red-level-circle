import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Trophy, Users, Zap, ChevronRight, ChevronLeft,
  Play, Newspaper, Star, Youtube, Twitch, Twitter, Instagram,
  Calendar, Gamepad2, Crown, UserPlus, ArrowRight,
  Swords, Target, TrendingUp, Globe, Medal, Coins, Flame,
  Shield, Clock, CheckCircle2, BarChart3, RefreshCw,
  GitBranch, User2, Hash
} from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { TournamentCard as UniversalTournamentCard } from "@/components/TournamentCard";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d: Date | string | null | undefined) {
  if (!d) return "Por anunciar";
  return new Date(d).toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
function bracketLabel(b: string) {
  const m: Record<string, string> = {
    single_elimination: "Eliminación Simple",
    double_elimination: "Eliminación Doble",
    groups: "Grupos",
  };
  return m[b] ?? b;
}
function statusLabel(s: string) {
  const map: Record<string, { text: string; color: string; dot: string }> = {
    registration_open: { text: "Inscripciones abiertas", color: "text-green-400", dot: "bg-green-500" },
    in_progress: { text: "En curso", color: "text-yellow-400", dot: "bg-yellow-400 animate-pulse" },
    upcoming: { text: "Próximamente", color: "text-blue-400", dot: "bg-blue-500" },
    completed: { text: "Finalizado", color: "text-muted-foreground", dot: "bg-zinc-600" },
  };
  return map[s] ?? { text: s, color: "text-muted-foreground", dot: "bg-zinc-600" };
}

// ─── Hero Section — carrusel automático estilo Epic Games Store ────────────────
const SLIDE_DURATION = 8000; // 8 segundos por slide (spec)

function HeroSection() {
  const { data: adsData } = trpc.ads.list.useQuery();
  const trackClick = trpc.ads.trackClick.useMutation();
  const trackImpression = trpc.ads.trackImpression.useMutation();

  const slides = (adsData ?? []).filter((a: any) => a.isActive && a.bannerImage);

  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [paused, setPaused] = useState(false);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const pausedAtRef = useRef<number>(0);
  const elapsedBeforePauseRef = useRef<number>(0);

  const goTo = useCallback((idx: number) => {
    if (idx === activeIdx) return;
    if (progressRef.current) clearTimeout(progressRef.current);
    setTransitioning(true);
    setTimeout(() => {
      setActiveIdx(idx);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
      setTransitioning(false);
    }, 250);
  }, [activeIdx]);

  // Tick de progreso
  useEffect(() => {
    if (slides.length === 0 || paused) return;
    startTimeRef.current = Date.now() - elapsedBeforePauseRef.current;
    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        const next = (activeIdx + 1) % slides.length;
        setTransitioning(true);
        elapsedBeforePauseRef.current = 0;
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
  }, [activeIdx, slides.length, paused]);

  // Pausa: guardar progreso actual
  const handlePause = () => {
    if (progressRef.current) clearTimeout(progressRef.current);
    elapsedBeforePauseRef.current = (progress / 100) * SLIDE_DURATION;
    setPaused(true);
  };
  const handleResume = () => {
    setPaused(false);
  };

  // Track impression
  useEffect(() => {
    if (slides.length > 0 && slides[activeIdx]) {
      trackImpression.mutate({ adId: slides[activeIdx].id });
    }
  }, [activeIdx, slides.length]);

  const current = slides[activeIdx];

  // Fallback sin ads
  if (slides.length === 0) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "24px", height: "420px" }} className="max-lg:block">
        <div className="relative rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: "rgba(255,255,255,0.03)", height: "420px" }}>
          <p className="text-sm text-center px-6" style={{ color: "var(--text-muted)" }}>Añade marcas desde el Panel Admin → Publicidades para activar el carrusel</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="lg:grid max-lg:block w-full"
      style={{ gridTemplateColumns: "3fr 1fr", gap: "24px" }}
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
    >
      {/* ─── BANNER PRINCIPAL ─── */}
      <div
        className="relative overflow-hidden cursor-pointer w-full"
        style={{ height: "clamp(240px, 50vw, 480px)", borderRadius: "12px", overflow: "hidden" }}
        onClick={() => {
          if (current?.destinationUrl) {
            trackClick.mutate({ adId: current.id });
            window.open(current.destinationUrl, "_blank");
          }
        }}
      >
        {/* Imagen con fade */}
        <div className="absolute inset-0" style={{ opacity: transitioning ? 0 : 1, transition: "opacity 250ms ease" }}>
          <img
            src={current?.bannerImage ?? ""}
            alt={current?.brandName ?? ""}
            className="w-full h-full object-cover object-center"
          />
          {/* Gradient inferior */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 45%, transparent 70%)" }} />
        </div>

        {/* Contenido inferior */}
        {current && (
          <div
            className="absolute bottom-0 left-0 right-0 p-5 sm:p-7"
            style={{ opacity: transitioning ? 0 : 1, transition: "opacity 250ms ease" }}
          >
            {current.logoImage && (
              <img src={current.logoImage} alt={current.brandName} className="h-7 sm:h-9 mb-2 sm:mb-3 object-contain" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.6))" }} />
            )}
            {current.tagline && (
              <p className="text-xs font-semibold uppercase tracking-widest mb-1 sm:mb-1.5" style={{ color: current.accentColor ?? "rgba(255,255,255,0.7)" }}>{current.tagline}</p>
            )}
            <h2 className="text-lg sm:text-2xl font-bold text-white mb-3 sm:mb-4 leading-tight" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>{current.title}</h2>
            {/* UN Único botón minimalista */}
            {current.destinationUrl && (
              <button
                className="px-4 py-1.5 sm:px-5 sm:py-2 rounded-lg text-sm font-semibold transition-all duration-150"
                style={{ background: "rgba(255,255,255,0.92)", color: "#111", backdropFilter: "blur(4px)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.92)")}
              >
                {current.ctaLabel ?? "Ver más"}
              </button>
            )}
          </div>
        )}

        {/* Badge publicidad */}
        <div className="absolute top-3 left-3 px-2 py-0.5 rounded text-xs" style={{ background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.45)" }}>Publicidad</div>
      </div>

      {/* ─── TARJETAS LATERALES — solo desktop ─── */}
      <div className="hidden lg:flex flex-col" style={{ gap: "4px" }}>
        {slides.map((ad: any, i: number) => {
          const isActive = i === activeIdx;
          return (
            <div
              key={ad.id}
              className="relative cursor-pointer overflow-hidden"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "10px 12px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.04)",
                isolation: "isolate",
              }}
              onClick={() => goTo(i)}
            >
              {/* Fondo de progreso que se llena — el contenedor mismo */}
              {isActive && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    width: `${progress}%`,
                    transition: "width 30ms linear",
                    borderRadius: "8px",
                    zIndex: 0,
                  }}
                />
              )}
              {/* Portada vertical estilo Epic */}
              <div
                className="shrink-0 overflow-hidden relative z-10"
                style={{ width: "56px", height: "72px", borderRadius: "6px", background: "#1a1a1f" }}
              >
                <img src={ad.bannerImage} alt={ad.brandName} className="w-full h-full object-cover" />
              </div>
              {/* Texto */}
              <div className="flex-1 min-w-0 relative z-10">
                <p
                  className="text-sm font-semibold leading-snug"
                  style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.65)", wordBreak: "break-word", whiteSpace: "normal" }}
                >
                  {ad.brandName}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* En móvil no se muestran tarjetas laterales — solo el banner */}
    </div>
  );
}

// ─── Platform Stats ───────────────────────────────────────────────────────────
function PlatformStats() {
  const { data: stats } = trpc.home.stats.useQuery();
  const items = [
    { icon: <Users size={20} className="text-blue-400" />, label: "Jugadores", value: stats ? formatNumber(stats.totalUsers) : "—", iconBg: "rgba(47,107,255,0.1)" },
    { icon: <Trophy size={20} className="text-yellow-400" />, label: "Torneos", value: stats ? formatNumber(stats.totalTournaments) : "—", iconBg: "rgba(255,215,0,0.1)" },
    { icon: <Swords size={20} className="text-red-400" />, label: "Equipos", value: stats ? formatNumber(stats.totalTeams) : "—", iconBg: "rgba(239,68,68,0.1)" },
    { icon: <Flame size={20} className="text-orange-400" />, label: "Activos ahora", value: stats ? formatNumber(stats.activeTournaments) : "—", iconBg: "rgba(251,146,60,0.1)" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-2xl p-4 flex items-start justify-between" style={{ background: "var(--bg-card)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
          <div>
            <p className="text-xs font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{item.label}</p>
            <p className="font-orbitron font-black text-2xl text-white">{item.value}</p>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: item.iconBg }}>
            {item.icon}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tournament Card — usa componente universal ────────────────────────────────
function TournamentCard({ t }: { t: any }) {
  return <UniversalTournamentCard tournament={t} />;
}

// ─── Horizontal Scroll Carousel ───────────────────────────────────────────────
function HScrollSection({ title, href, icon, children, viewAllLabel = "Ver todos" }: {
  title: string; href?: string; icon?: React.ReactNode; children: React.ReactNode; viewAllLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-orbitron font-bold text-foreground text-lg flex items-center gap-2">
          {icon}{title}
        </h2>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex gap-1">
            <button onClick={() => scroll(-1)} className="w-7 h-7 rounded-full bg-muted hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => scroll(1)} className="w-7 h-7 rounded-full bg-muted hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
          {href && (
            <Link href={href} className="flex items-center gap-1 text-xs font-mono text-red-400 hover:text-red-300 transition-colors">
              {viewAllLabel} <ArrowRight size={13} />
            </Link>
          )}
        </div>
      </div>
      <div ref={ref} className="flex gap-3 overflow-x-auto pb-2" style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {children}
      </div>
    </section>
  );
}

// ─── Games List (solo MOBAs / team vs team) ───────────────────────────────────
function GamesSection({ allTournaments }: { allTournaments: any[] }) {
  const { data: gamesList } = trpc.games.list.useQuery();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth + 16 : 200;
    el.scrollBy({ left: dir === "right" ? cardWidth * 2 : -cardWidth * 2, behavior: "smooth" });
  };

  if (!gamesList || gamesList.length === 0) return null;
  const countByGame = allTournaments.reduce((acc: Record<string, number>, t: any) => {
    if (t.game) acc[t.game] = (acc[t.game] ?? 0) + 1;
    return acc;
  }, {});
  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-orbitron font-bold text-foreground text-lg flex items-center gap-2">
          <Gamepad2 size={18} className="text-red-500" /> Juegos
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            className="w-7 h-7 rounded-full bg-muted hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-7 h-7 rounded-full bg-muted hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Siguiente"
          >
            <ChevronRight size={14} />
          </button>
          <Link href="/tournaments" className="flex items-center gap-1.5 text-xs font-mono text-red-400 hover:text-red-300 transition-colors ml-1">
            Ver torneos <ArrowRight size={14} />
          </Link>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="games-scroll flex flex-row gap-4 pb-3"
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          scrollBehavior: "smooth",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          /* hide scrollbar cross-browser */
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
        onMouseEnter={e => (e.currentTarget.style.cursor = "grab")}
        onMouseLeave={e => (e.currentTarget.style.cursor = "default")}
      >
        {gamesList.map(g => (
          <Link
            key={g.id}
            href={`/tournaments?game=${g.slug}`}
            className="games-card"
            style={{ scrollSnapAlign: "start" }}
          >
            <div
              className="group relative rounded-2xl overflow-hidden cursor-pointer bg-card"
              style={{
                width: "100%",
                aspectRatio: "3 / 4",
                border: "1px solid oklch(0.18 0.01 0)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              }}
            >
              {(g.banner || g.logo) ? (
                <img src={g.banner ?? g.logo ?? ""} alt={g.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, oklch(0.12 0.02 25) 0%, oklch(0.08 0.005 0) 100%)" }}>
                  <Gamepad2 size={48} style={{ color: "oklch(0.55 0.22 25 / 0.3)" }} />
                </div>
              )}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }} />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "linear-gradient(to top, oklch(0.55 0.22 25 / 0.25) 0%, transparent 60%)" }} />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="font-orbitron font-bold text-foreground text-sm leading-tight mb-1.5 group-hover:text-red-300 transition-colors">{g.name}</p>
                <div className="flex items-center gap-1.5">
                  <Trophy size={11} className="text-red-400" />
                  <span className="text-xs font-mono text-muted-foreground">{countByGame[g.name] ?? 0} torneo{(countByGame[g.name] ?? 0) !== 1 ? "s" : ""}</span>
                </div>
              </div>
              {(countByGame[g.name] ?? 0) > 0 && (
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-green-500" style={{ boxShadow: "0 0 8px #22c55e" }} />
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Mission Card (full visible, horizontal scroll) ───────────────────────────
function MissionCard({ m }: { m: any }) {
  return (
    <Link href="/rewards">
      <div
        className="shrink-0 w-72 rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:-translate-y-1"
        style={{ scrollSnapAlign: "start", background: "var(--bg-card)", border: "1px solid oklch(0.20 0.01 0)", boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "oklch(0.45 0.18 145 / 0.5)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "oklch(0.20 0.01 0)"; }}
      >
        {/* Thumbnail */}
        <div className="relative h-44 bg-card overflow-hidden">
          {m.thumbnailUrl ? (
            <img src={m.thumbnailUrl} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : m.sponsorLogoUrl ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
              <img src={m.sponsorLogoUrl} alt={m.sponsorName ?? ""} className="max-h-16 max-w-full object-contain p-4" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-950/30 to-zinc-900">
              <Play size={40} className="text-green-400/40" />
            </div>
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, oklch(0.12 0.005 0) 0%, transparent 60%)" }} />
          {/* Type badge */}
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-xs font-mono font-semibold capitalize"
            style={{ background: "rgba(0,0,0,0.70)", color: "oklch(0.65 0.18 145)", border: "1px solid oklch(0.45 0.18 145 / 0.4)", backdropFilter: "blur(8px)" }}>
            {m.type === "video" ? <><Play size={9} className="inline mr-0.5" />Video</> : m.type === "ad" ? <><Zap size={9} className="inline mr-0.5" />Publicidad</> : m.type}
          </div>
        </div>
        {/* Body */}
        <div className="p-4 space-y-2">
          {m.sponsorName && <p className="text-muted-foreground text-xs font-mono truncate">{m.sponsorName}</p>}
          <p className="text-foreground font-bold text-sm line-clamp-2 leading-snug group-hover:text-green-300 transition-colors">{m.title}</p>
          {m.durationSeconds && (
            <div className="flex items-center gap-1 text-muted-foreground text-xs font-mono">
              <Clock size={10} /> {Math.ceil(m.durationSeconds / 60)} min
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <span className="text-muted-foreground text-xs font-mono">Recompensa</span>
            <span className="font-orbitron font-black text-base text-yellow-400">+{m.reward} RLC</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Creator Card (más grande, 4 en escritorio) ───────────────────────────────
function CreatorCard({ c, isLive }: { c: any; isLive?: boolean }) {
  const name = c.nickname ?? c.userName ?? "Creador";
  const [, navigate] = useLocation();
  return (
    <div
      className="shrink-0 w-60 rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:-translate-y-1"
      style={{ scrollSnapAlign: "start", background: "var(--bg-card)", border: isLive ? "1px solid oklch(0.50 0.22 25 / 0.6)" : "1px solid oklch(0.20 0.01 0)", boxShadow: isLive ? "0 0 16px oklch(0.50 0.22 25 / 0.25)" : undefined }}
      onClick={() => navigate(`/profile/${c.userId}`)}
    >
      {/* Banner */}
      <div className="h-28 bg-gradient-to-br from-zinc-800 to-red-950/20 overflow-hidden relative">
        {c.banner && <img src={c.banner} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 50%, oklch(0.12 0.005 0) 100%)" }} />
        {isLive && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-foreground font-bold text-xs tracking-wider" style={{ background: "oklch(0.50 0.22 25)", boxShadow: "0 0 8px oklch(0.50 0.22 25 / 0.7)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            EN VIVO
          </div>
        )}
      </div>
      {/* Avatar overlap */}
      <div className="relative" style={{ height: 0 }}>
        <div className="absolute -top-8 left-4" style={{ border: "3px solid oklch(0.12 0.005 0)", borderRadius: "9999px", display: "inline-block", zIndex: 10 }}>
          <UserAvatar avatar={c.avatar} name={name} activeFrameImage={c.activeFrameImage} size={56} />
        </div>
      </div>
      {/* Body */}
      <div className="pt-10 px-4 pb-4">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-foreground font-bold text-sm truncate">{name}</p>
          {c.isVerified && <VerifiedBadge size={14} />}
        </div>
        {c.category && <p className="text-red-400 text-xs font-mono capitalize mb-1">{c.category}</p>}
        {c.bio && <p className="text-muted-foreground text-xs line-clamp-2 mb-3">{c.bio}</p>}
        {/* Social links */}
        <div className="flex items-center gap-2.5">
          {c.youtube && (
            <a href={`https://youtube.com/@${c.youtube}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              className="text-muted-foreground hover:text-red-500 transition-colors"><Youtube size={15} /></a>
          )}
          {c.twitch && (
            <a href={`https://twitch.tv/${c.twitch}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              className="text-muted-foreground hover:text-purple-400 transition-colors"><Twitch size={15} /></a>
          )}
          {c.twitter && (
            <a href={`https://twitter.com/${c.twitter}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              className="text-muted-foreground hover:text-sky-400 transition-colors"><Twitter size={15} /></a>
          )}
          {c.instagram && (
            <a href={`https://instagram.com/${c.instagram}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              className="text-muted-foreground hover:text-pink-400 transition-colors"><Instagram size={15} /></a>
          )}
          {c.subscribers && (
            <span className="ml-auto text-muted-foreground text-xs font-mono">{formatNumber(c.subscribers)} subs</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── News Card ────────────────────────────────────────────────────────────────
function NewsCard({ n }: { n: any }) {
  return (
    <Link href={`/news/${n.slug ?? n.id}`}>
      <div className="shrink-0 w-64 rounded-xl overflow-hidden bg-card border border-border/50 hover:border-border transition-all cursor-pointer group" style={{ scrollSnapAlign: "start" }}>
        <div className="h-36 bg-muted overflow-hidden">
          {n.imageUrl ? (
            <img src={n.imageUrl} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
              <Newspaper size={28} className="text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="p-3">
          {n.category && <span className="text-xs font-mono text-red-400 uppercase tracking-wider">{n.category}</span>}
          <p className="text-foreground font-semibold text-sm mt-1 line-clamp-2 leading-snug">{n.title}</p>
          <p className="text-muted-foreground text-xs mt-1">{new Date(n.publishedAt ?? n.createdAt).toLocaleDateString("es", { day: "numeric", month: "short" })}</p>
        </div>
      </div>
    </Link>
  );
}

// ─── Combined Teams + People Section ─────────────────────────────────────────
function TeamsAndPeopleSection() {
  const { isAuthenticated, user } = useAuth();
  const { data: topTeams, refetch: refetchTeams } = trpc.home.topTeams.useQuery();
  const { data: recentUsers, refetch: refetchUsers } = trpc.home.recentUsers.useQuery();
  const { data: suggestedUsers, refetch: refetchSuggested } = trpc.home.suggestedUsers.useQuery(
    undefined, { enabled: isAuthenticated }
  );
  const follow = trpc.follows.follow.useMutation();
  const utils = trpc.useUtils();

  // Offset para mostrar diferentes equipos/personas en cada refresh
  const [teamOffset, setTeamOffset] = useState(0);
  const [userOffset, setUserOffset] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const people = isAuthenticated ? suggestedUsers : recentUsers;
  const allTeams = topTeams ?? [];
  const allPeople = (people ?? []).filter((u: any) => !isAuthenticated || u.id !== user?.id);

  // Rotate displayed items — sin duplicar cuando hay menos de 8 elementos
  const displayedTeams = allTeams.length > 0
    ? (() => {
        if (allTeams.length <= 8) return allTeams.slice(0, 8);
        const start = teamOffset % allTeams.length;
        const doubled = [...allTeams, ...allTeams];
        return doubled.slice(start, start + 8).slice(0, 8);
      })()
    : [];
  const displayedPeople = allPeople.length > 0
    ? (() => {
        if (allPeople.length <= 8) return allPeople.slice(0, 8);
        const start = userOffset % allPeople.length;
        const doubled = [...allPeople, ...allPeople];
        return doubled.slice(start, start + 8).slice(0, 8);
      })()
    : [];

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTeamOffset(prev => prev + 4);
      setUserOffset(prev => prev + 4);
      setLastRefresh(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = useCallback(() => {
    setTeamOffset(prev => prev + 4);
    setUserOffset(prev => prev + 4);
    setLastRefresh(Date.now());
    refetchTeams();
    if (isAuthenticated) refetchSuggested();
    else refetchUsers();
  }, [isAuthenticated, refetchTeams, refetchSuggested, refetchUsers]);

  const medals = ["#1", "#2", "#3"];

  if (allTeams.length === 0 && allPeople.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-orbitron font-bold text-foreground text-lg flex items-center gap-2">
          <Users size={18} className="text-blue-400" /> Comunidad
        </h2>
        <button
          onClick={handleManualRefresh}
          className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          title="Actualizar"
        >
          <RefreshCw size={13} /> Actualizar
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Top Teams */}
        <div className="rounded-2xl border border-border/50 overflow-hidden" style={{ background: "var(--bg-card)" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <h3 className="font-orbitron font-bold text-sm text-foreground flex items-center gap-2">
              <Shield size={15} className="text-red-400" /> Top Equipos
            </h3>
            <Link href="/teams" className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          {/* Scrollable list */}
          <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
            {displayedTeams.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground text-xs font-mono">No hay equipos aún</p>
              </div>
            ) : displayedTeams.map((team: any, i: number) => (
              <Link key={`${team.id}-${i}`} href={`/teams/${team.id}`}>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 hover:bg-muted/40 transition-colors cursor-pointer group last:border-0">
                  {/* Rank */}
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-orbitron font-black text-xs"
                    style={{
                      background: i < 3 ? "oklch(0.55 0.22 25 / 0.15)" : "oklch(0.15 0.01 0)",
                      color: i < 3 ? "oklch(0.75 0.22 25)" : "oklch(0.40 0.01 0)",
                    }}>
                    {i < 3 ? medals[i] : `#${teamOffset + i + 1}`}
                  </div>
                  {/* Logo */}
                  <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                    {team.logo ? (
                      <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                    ) : (
                      <Shield size={14} className="text-muted-foreground" />
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-semibold text-sm truncate group-hover:text-red-300 transition-colors">{team.name}</p>
                    {team.game && <p className="text-muted-foreground text-xs font-mono truncate">{team.game}</p>}
                  </div>
                  {/* Points */}
                  <div className="text-right shrink-0">
                    <p className="font-orbitron font-bold text-sm" style={{ color: "oklch(0.65 0.18 80)" }}>{team.points ?? 0}</p>
                    <p className="text-zinc-700 text-xs font-mono">pts</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right: People you may know */}
        <div className="rounded-2xl border border-border/50 overflow-hidden" style={{ background: "var(--bg-card)" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <h3 className="font-orbitron font-bold text-sm text-foreground flex items-center gap-2">
              <User2 size={15} className="text-blue-400" /> {isAuthenticated ? "Quizás Conozcas" : "Nuevos Jugadores"}
            </h3>
            <Link href="/community" className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          {/* Scrollable list */}
          <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
            {displayedPeople.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground text-xs font-mono">No hay jugadores aún</p>
              </div>
            ) : displayedPeople.map((u: any, i: number) => (
              <Link key={`${u.id}-${i}`} href={`/profile/${u.id}`}>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 hover:bg-muted/40 transition-colors cursor-pointer group last:border-0">
                  <UserAvatar
                    avatar={u.avatar}
                    name={u.nickname ?? u.name}
                    activeFrameImage={u.activeFrameImage}
                    size={38}
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-semibold text-sm truncate group-hover:text-blue-300 transition-colors">
                      {u.nickname ?? u.name ?? "Usuario"}
                    </p>
                    <p className="text-muted-foreground text-xs font-mono truncate">@{u.name ?? "user"}</p>
                  </div>
                  {isAuthenticated && user?.id !== u.id && (
                    <button
                      onClick={e => {
                        e.preventDefault();
                        follow.mutate({ userId: u.id }, {
                          onSuccess: () => {
                            utils.home.recentUsers.invalidate();
                            utils.home.suggestedUsers.invalidate();
                          }
                        });
                      }}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 transition-colors"
                    >
                      <UserPlus size={10} /> Seguir
                    </button>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Ad Banner Section (full width, auto-scroll) ─────────────────────────────
function AdBannerSection({ ads }: { ads: any[] }) {
  const activeAds = ads.filter((a: any) => a.isActive);
  const [adIndex, setAdIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const currentIdx = adIndex % (activeAds.length || 1);
  const currentAd = activeAds.length > 0 ? activeAds[currentIdx] : null;

  const goTo = useCallback((next: number) => {
    setVisible(false);
    setTimeout(() => {
      setAdIndex(next);
      setVisible(true);
    }, 420);
  }, []);

  useEffect(() => {
    if (activeAds.length <= 1) return;
    const timer = setInterval(() => goTo(adIndex + 1), 5000);
    return () => clearInterval(timer);
  }, [activeAds.length, adIndex, goTo]);

  if (!currentAd) return null;
  return (
    <section className="relative w-full overflow-hidden">
      <a
        href={currentAd.destinationUrl || "#"}
        target={currentAd.destinationUrl ? "_blank" : "_self"}
        rel="noopener noreferrer"
        className="block w-full"
        style={{
          display: "block",
          transition: "opacity 700ms cubic-bezier(0.4,0,0.2,1), transform 700ms cubic-bezier(0.4,0,0.2,1), filter 700ms cubic-bezier(0.4,0,0.2,1)",
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0.98)",
          filter: visible ? "blur(0px)" : "blur(3px)",
          willChange: "opacity, transform, filter",
        }}
      >
        <img
          src={currentAd.bannerImage}
          alt={currentAd.title}
          className="w-full h-auto block"
        />
      </a>
      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-xs font-mono pointer-events-none"
        style={{ background: "rgba(0,0,0,0.70)", color: "oklch(0.55 0.01 0)", border: "1px solid oklch(0.30 0.01 0)", backdropFilter: "blur(8px)" }}>
        Publicidad
      </div>
      {activeAds.length > 1 && (
        <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5">
          {activeAds.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === currentIdx ? "20px" : "8px",
                height: "8px",
                background: i === currentIdx ? "white" : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Main Home ────────────────────────────────────────────────────────────────
export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data: allTournaments } = trpc.tournaments.list.useQuery({ status: undefined });
  const { data: featuredTournaments } = trpc.home.featuredTournaments.useQuery();
  const { data: news } = trpc.news.list.useQuery({ limit: 10 });
  const { data: creators } = trpc.creators.listApproved.useQuery();
  const { data: missions } = trpc.home.availableMissions.useQuery();
  const { data: sideAds } = trpc.ads.list.useQuery();
  const { data: liveUserIds } = trpc.streams.liveCreators.useQuery(undefined, { refetchInterval: 60_000 });
  const liveSet = new Set(liveUserIds ?? []);
  const liveCreatorsList = (creators ?? []).filter((c: any) => liveSet.has(c.userId));

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

        {/* 1. Hero carousel — estilo Epic Games Store */}
        <div className="px-3 sm:px-6 lg:px-10" style={{ paddingTop: "15px" }}>
          <HeroSection />
        </div>

      {/* Resto del contenido con padding interno */}
      <div className="px-3 sm:px-6 lg:px-10 py-6 space-y-10">

        {/* 2. Stats */}
        <PlatformStats />

        {/* 2.5 Creadores en Vivo Ahora — solo visible cuando hay streams activos */}
        {liveCreatorsList.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-orbitron font-bold text-foreground text-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Creadores en Vivo Ahora
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold text-foreground" style={{ background: "oklch(0.50 0.22 25)", boxShadow: "0 0 8px oklch(0.50 0.22 25 / 0.5)" }}>
                  {liveCreatorsList.length}
                </span>
              </h2>
              <Link href="/creators?filter=live" className="flex items-center gap-1 text-xs font-mono text-red-400 hover:text-red-300 transition-colors">
                Ver todos <ArrowRight size={13} />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {liveCreatorsList.map((c: any) => (
                <Link key={c.id} href={`/profile/${c.userId}`}>
                  <div
                    className="shrink-0 w-52 rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:-translate-y-1"
                    style={{ background: "var(--bg-card)", border: "1px solid oklch(0.55 0.22 25 / 0.5)", boxShadow: "0 0 16px oklch(0.55 0.22 25 / 0.2)" }}
                  >
                    <div className="relative h-32 overflow-hidden">
                      {c.banner ? (
                        <img src={c.banner} alt={c.displayName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-950/40 to-zinc-900" />
                      )}
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
                      {/* EN VIVO badge */}
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold text-foreground" style={{ background: "oklch(0.50 0.22 25)", boxShadow: "0 0 8px oklch(0.50 0.22 25 / 0.6)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        EN VIVO
                      </div>
                    </div>
                    <div className="p-3 flex items-center gap-2.5">
                      <UserAvatar avatar={c.avatar} name={c.displayName} size="sm" />
                      <div className="min-w-0">
                        <p className="text-foreground text-sm font-bold truncate">{c.displayName}</p>
                        <p className="text-muted-foreground text-xs truncate">{c.category ?? "Creador"}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
        {/* 3. Torneos activos */}
        {(featuredTournaments?.length ?? 0) > 0 && (
          <HScrollSection
            title="Torneos Activos"
            href="/tournaments"
            icon={<Trophy size={18} className="text-red-500" />}
          >
            {featuredTournaments!.map(t => <TournamentCard key={t.id} t={t} />)}
          </HScrollSection>
        )}

        {/* 4. Lista de juegos (MOBAs / team vs team) */}
        <GamesSection allTournaments={allTournaments ?? []} />

        {/* 5. Misiones disponibles — scroll horizontal completo */}
        {(missions?.length ?? 0) > 0 && (
          <HScrollSection
            title="Misiones Disponibles"
            href="/rewards"
            icon={<Target size={18} className="text-green-400" />}
            viewAllLabel="Ver todas"
          >
            {missions!.map((m: any) => <MissionCard key={m.id} m={m} />)}
          </HScrollSection>
        )}

        {/* 8. Noticias */}
        {(news?.length ?? 0) > 0 && (
          <HScrollSection
            title="Últimas Noticias"
            href="/news"
            icon={<Newspaper size={18} className="text-muted-foreground" />}
          >
            {news!.map(n => <NewsCard key={n.id} n={n} />)}
          </HScrollSection>
        )}

        {/* 9. Equipos + Personas (sección combinada con scroll interno y auto-refresh) */}
        <TeamsAndPeopleSection />

        {/* 10. CTA para no autenticados */}
        {!isAuthenticated && (
          <section className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-950/60 via-black to-black" />
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "repeating-linear-gradient(45deg, var(--accent-red) 0, var(--accent-red) 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />
            <div className="relative p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="font-orbitron font-black text-2xl sm:text-3xl text-foreground mb-2">¿Listo para competir?</h2>
                <p className="text-muted-foreground text-sm max-w-md">Únete a la plataforma de esports más grande. Inscríbete en torneos, crea tu equipo y escala en el ranking global.</p>
              </div>
              <div className="flex gap-3 shrink-0">
                <a href={getLoginUrl()} className="px-6 py-3 rounded-xl font-orbitron font-bold text-sm text-foreground transition-all hover:scale-105"
                  style={{ background: "oklch(0.55 0.22 25)", boxShadow: "0 0 20px oklch(0.55 0.22 25 / 0.4)" }}>
                  REGISTRARSE
                </a>
                <Link href="/tournaments" className="px-6 py-3 rounded-xl font-orbitron font-bold text-sm text-foreground border border-border hover:border-zinc-500 transition-colors bg-card/60">
                  VER TORNEOS
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 10. CTA Creadores */}
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
                  <h3 className="font-orbitron font-bold text-foreground text-lg">Conoce a nuestros creadores</h3>
                  <p className="text-muted-foreground text-xs mt-1">Streamers, YouTubers y creadores verificados de la plataforma</p>
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
                  <h3 className="font-orbitron font-bold text-foreground text-lg">Aplica como creador oficial</h3>
                  <p className="text-muted-foreground text-xs mt-1">Obtén tu badge verificado y aparece en la plataforma</p>
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
