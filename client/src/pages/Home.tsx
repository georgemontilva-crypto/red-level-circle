import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { useState, useRef, useEffect } from "react";
import {
  Trophy, Users, Zap, ChevronRight, ChevronLeft, Play,
  Newspaper, Star, Youtube, Twitch, Twitter, Instagram,
  Calendar, Gamepad2, Crown, UserPlus, ArrowRight, ExternalLink
} from "lucide-react";

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

// ─── Hero Section (Epic Games style) ─────────────────────────────────────────
function HeroSection() {
  const { data: ads } = trpc.ads.list.useQuery();
  const { data: featuredTournaments } = trpc.home.featuredTournaments.useQuery();
  const [activeIdx, setActiveIdx] = useState(0);

  // Combine featured ads + featured tournaments for the hero
  const heroItems = [
    ...(ads?.filter((a: any) => a.isFeatured).slice(0, 3).map((a: any) => ({
      type: "ad" as const,
      id: a.id,
      title: a.title,
      subtitle: a.tagline ?? a.brandName,
      description: a.description ?? "",
      image: a.bannerImage,
      accentColor: a.accentColor ?? "#ff0000",
      ctaLabel: a.ctaLabel ?? "Ver más",
      ctaUrl: a.destinationUrl ?? "#",
    })) ?? []),
    ...(featuredTournaments?.slice(0, 3).map(t => ({
      type: "tournament" as const,
      id: t.id,
      title: t.name,
      subtitle: t.game ?? "Torneo",
      description: `Premio: ${t.prizeAmount ? `${t.prizeAmount} RLC` : "Por definir"} · Inicio: ${formatDate(t.startDate)}`,
      image: t.banner ?? "",
      accentColor: "#dc2626",
      ctaLabel: "Ver torneo",
      ctaUrl: `/tournament/${t.id}`,
    })) ?? []),
  ];

  // Sidebar items: all featured tournaments
  const sidebarItems = featuredTournaments ?? [];

  useEffect(() => {
    if (heroItems.length <= 1) return;
    const timer = setInterval(() => setActiveIdx(i => (i + 1) % heroItems.length), 6000);
    return () => clearInterval(timer);
  }, [heroItems.length]);

  const active = heroItems[activeIdx];

  return (
    <div className="flex gap-3 h-[420px] sm:h-[480px]">
      {/* Main hero */}
      <div className="relative flex-1 rounded-2xl overflow-hidden group cursor-pointer">
        {/* Background */}
        {active?.image ? (
          <img src={active.image} alt={active?.title} className="absolute inset-0 w-full h-full object-cover transition-all duration-700" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-red-950/30 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />

        {/* Content */}
        {active && (
          <div className="absolute bottom-0 left-0 p-6 sm:p-8 max-w-lg">
            <p className="text-xs font-mono text-red-400 tracking-widest uppercase mb-2">{active.subtitle}</p>
            <h1 className="font-orbitron font-black text-2xl sm:text-4xl text-white leading-tight mb-3">{active.title}</h1>
            {active.description && (
              <p className="text-zinc-300 text-sm mb-5 line-clamp-2">{active.description}</p>
            )}
            <div className="flex items-center gap-3">
              {active.type === "tournament" ? (
                <Link href={active.ctaUrl}>
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-orbitron text-sm font-bold text-white transition-all hover:scale-105"
                    style={{ background: active.accentColor, boxShadow: `0 0 20px ${active.accentColor}60` }}>
                    <Trophy size={16} /> {active.ctaLabel}
                  </button>
                </Link>
              ) : (
                <a href={active.ctaUrl} target="_blank" rel="noopener noreferrer">
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-orbitron text-sm font-bold text-white transition-all hover:scale-105"
                    style={{ background: active.accentColor, boxShadow: `0 0 20px ${active.accentColor}60` }}>
                    <ExternalLink size={16} /> {active.ctaLabel}
                  </button>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Navigation dots */}
        {heroItems.length > 1 && (
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5">
            {heroItems.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`rounded-full transition-all ${i === activeIdx ? "w-6 h-2 bg-red-500" : "w-2 h-2 bg-white/30 hover:bg-white/60"}`}
              />
            ))}
          </div>
        )}

        {/* Arrow nav */}
        {heroItems.length > 1 && (
          <>
            <button onClick={() => setActiveIdx(i => (i - 1 + heroItems.length) % heroItems.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setActiveIdx(i => (i + 1) % heroItems.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80">
              <ChevronRight size={16} />
            </button>
          </>
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
            <Link key={t.id} href={`/tournament/${t.id}`}>
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

// ─── Horizontal Scroll Carousel ───────────────────────────────────────────────
function HScrollCarousel({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-orbitron font-bold text-white text-lg flex items-center gap-2">
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
    <Link href={`/tournament/${t.id}`}>
      <div className="shrink-0 w-72 rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:-translate-y-1"
        style={{ scrollSnapAlign: "start", background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.18 0.01 0)", boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "oklch(0.55 0.22 25 / 0.5)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px oklch(0.55 0.22 25 / 0.2)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "oklch(0.18 0.01 0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)"; }}
      >
        {/* Banner image */}
        <div className="relative h-44 bg-zinc-900 overflow-hidden">
          {t.banner ? (
            <img src={t.banner} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, oklch(0.12 0.02 25) 0%, oklch(0.08 0.005 0) 100%)" }}>
              <Trophy size={40} style={{ color: "oklch(0.55 0.22 25 / 0.3)" }} />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, oklch(0.10 0.005 0) 0%, transparent 60%)" }} />
          {/* Status badge */}
          <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold text-white ${st.color}`}
            style={{ backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.5)" }}>
            {t.status === "in_progress" && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            {st.text}
          </div>
          {/* Game badge */}
          {t.game && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-mono"
              style={{ background: "rgba(0,0,0,0.6)", color: "oklch(0.65 0.22 25)", border: "1px solid oklch(0.55 0.22 25 / 0.3)", backdropFilter: "blur(8px)" }}>
              {t.game}
            </div>
          )}
        </div>
        {/* Info */}
        <div className="p-4">
          <p className="text-white font-bold text-base truncate font-display">{t.name}</p>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">🪙</span>
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
        {u.avatar ? (
          <img src={u.avatar} alt={u.nickname ?? u.name} className="w-14 h-14 rounded-full object-cover mx-auto border-2 border-zinc-700 group-hover:border-red-600/40 transition-colors" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-zinc-800 border-2 border-zinc-700 mx-auto flex items-center justify-center">
            <span className="text-xl font-black text-red-500">{(u.nickname ?? u.name ?? "?").charAt(0).toUpperCase()}</span>
          </div>
        )}
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
  return (
    <Link href={`/profile/${c.userId}`}>
      <div className="shrink-0 w-52 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/50 hover:border-red-600/40 transition-all cursor-pointer group" style={{ scrollSnapAlign: "start" }}>
        {/* Banner */}
        <div className="relative h-20 bg-gradient-to-br from-zinc-800 to-red-950/20">
          {c.banner && <img src={c.banner} alt="" className="w-full h-full object-cover" />}
          {/* Avatar */}
          <div className="absolute -bottom-6 left-4">
            {c.avatar ? (
              <img src={c.avatar} alt={name} className="w-12 h-12 rounded-full object-cover border-3 border-zinc-900 group-hover:border-red-600/40 transition-colors" style={{ borderWidth: 3 }} />
            ) : (
              <div className="w-12 h-12 rounded-full bg-zinc-800 border-3 border-zinc-900 flex items-center justify-center" style={{ borderWidth: 3 }}>
                <span className="text-lg font-black text-red-500">{name.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
        </div>
        <div className="pt-8 px-4 pb-4">
          <p className="text-white font-bold text-sm truncate">{name}</p>
          {c.category && <p className="text-red-400 text-xs font-mono capitalize">{c.category}</p>}
          {c.bio && <p className="text-zinc-500 text-xs mt-1 line-clamp-2">{c.bio}</p>}
          {/* Social links */}
          <div className="flex items-center gap-2 mt-3">
            {c.youtube && <a href={`https://youtube.com/@${c.youtube}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-zinc-500 hover:text-red-500 transition-colors"><Youtube size={14} /></a>}
            {c.twitch && <a href={`https://twitch.tv/${c.twitch}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-zinc-500 hover:text-purple-400 transition-colors"><Twitch size={14} /></a>}
            {c.twitter && <a href={`https://twitter.com/${c.twitter}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-zinc-500 hover:text-sky-400 transition-colors"><Twitter size={14} /></a>}
            {c.instagram && <a href={`https://instagram.com/${c.instagram}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-zinc-500 hover:text-pink-400 transition-colors"><Instagram size={14} /></a>}
          </div>
        </div>
      </div>
    </Link>
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

// ─── Main Home ────────────────────────────────────────────────────────────────
export default function Home() {
  const { isAuthenticated, user } = useAuth();

  const { data: allTournaments } = trpc.tournaments.list.useQuery({ status: undefined, game: undefined });
  const { data: news } = trpc.news.list.useQuery({ limit: 10 });
  const { data: recentUsers } = trpc.home.recentUsers.useQuery();
  const { data: suggestedUsers } = trpc.home.suggestedUsers.useQuery(undefined, { enabled: isAuthenticated });
  const { data: creators } = trpc.creators.listApproved.useQuery();

  const activeTournaments = allTournaments?.filter(t =>
    t.status === "registration_open" || t.status === "in_progress"
  ) ?? [];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-10">

        {/* ── Hero ── */}
        <HeroSection />

        {/* ── Torneos activos ── */}
        {activeTournaments.length > 0 && (
          <HScrollCarousel title="Torneos Activos" href="/tournaments">
            {activeTournaments.map(t => <TournamentCard key={t.id} t={t} />)}
          </HScrollCarousel>
        )}

        {/* ── Noticias ── */}
        {(news?.length ?? 0) > 0 && (
          <HScrollCarousel title="Últimas Noticias" href="/news">
            {news!.map(n => <NewsCard key={n.id} n={n} />)}
          </HScrollCarousel>
        )}

        {/* ── Creadores Oficiales ── */}
        {(creators?.length ?? 0) > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-orbitron font-bold text-white text-lg flex items-center gap-2">
                  <Star size={18} className="text-yellow-400" /> Creadores Oficiales
                </h2>
                <p className="text-zinc-500 text-xs mt-0.5">Creadores de contenido verificados de la plataforma</p>
              </div>
              <Link href="/creators">
                <button className="flex items-center gap-1.5 text-xs font-mono text-red-400 hover:text-red-300 transition-colors">
                  Ver todos <ArrowRight size={14} />
                </button>
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
              {creators!.map(c => <CreatorCard key={c.id} c={c} />)}
            </div>
          </section>
        )}

        {/* ── Quizás conozcas ── */}
        {((isAuthenticated ? suggestedUsers : recentUsers)?.length ?? 0) > 0 && (
          <HScrollCarousel title="Quizás Conozcas" href="/community">
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
                <Users size={18} className="text-blue-400" /> Nuevos en la Plataforma
              </h2>
              <Link href="/community">
                <button className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors">
                  Ver comunidad <ArrowRight size={14} />
                </button>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {recentUsers!.slice(0, 6).map(u => (
                <Link key={u.id} href={`/profile/${u.id}`}>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/50 hover:border-zinc-700 transition-colors cursor-pointer">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.nickname ?? u.name ?? ""} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                        <span className="text-sm font-black text-red-500">{(u.nickname ?? u.name ?? "?").charAt(0).toUpperCase()}</span>
                      </div>
                    )}
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
                <a href={getLoginUrl()}>
                  <button className="px-6 py-3 rounded-xl font-orbitron font-bold text-sm text-white transition-all hover:scale-105"
                    style={{ background: "oklch(0.55 0.22 25)", boxShadow: "0 0 20px oklch(0.55 0.22 25 / 0.4)" }}>
                    REGISTRARSE
                  </button>
                </a>
                <Link href="/tournaments">
                  <button className="px-6 py-3 rounded-xl font-orbitron font-bold text-sm text-white border border-zinc-700 hover:border-zinc-500 transition-colors bg-zinc-900/60">
                    VER TORNEOS
                  </button>
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
