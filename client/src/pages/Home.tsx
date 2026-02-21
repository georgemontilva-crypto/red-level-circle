import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Trophy, Radio, Newspaper, TrendingUp, Star, ChevronRight, Users, Calendar, Zap, Shield } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";


function HeroSection() {
  const { isAuthenticated } = useAuth();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 bg-gradient-radial from-red-950/20 via-transparent to-transparent" style={{ backgroundImage: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(127,0,0,0.15), transparent)" }} />
      {/* Grid lines */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "linear-gradient(rgba(255,0,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,0,0.3) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      {/* Neon circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-red-500/10 opacity-40" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-red-500/20 opacity-30" style={{ boxShadow: "0 0 60px rgba(220,38,38,0.1), inset 0 0 60px rgba(220,38,38,0.05)" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-red-500/30 opacity-20" style={{ boxShadow: "0 0 40px rgba(220,38,38,0.2)" }} />

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-1.5 mb-8">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-400 font-mono text-xs tracking-widest">PLATAFORMA DE ESPORTS</span>
        </div>
        <h1 className="font-orbitron font-black text-5xl md:text-7xl text-white mb-6 leading-tight">
          <span className="text-red-500">RED</span>LEVEL<br />
          <span className="text-zinc-400 text-3xl md:text-4xl tracking-widest">CIRCLE</span>
        </h1>
        <p className="text-zinc-400 font-rajdhani text-lg md:text-xl mb-10 max-w-2xl mx-auto">
          La plataforma definitiva para organizar, participar y seguir torneos de esports. Compite, apuesta y escala en el ranking global.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/tournaments">
            <Button className="bg-red-600 hover:bg-red-700 font-orbitron text-sm tracking-wider px-8 py-6 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
              <Trophy className="w-4 h-4 mr-2" /> VER TORNEOS
            </Button>
          </Link>
          {!isAuthenticated && (
            <a href={getLoginUrl()}>
              <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:border-red-500 font-orbitron text-sm tracking-wider px-8 py-6">
                CREAR CUENTA
              </Button>
            </a>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mt-16 max-w-lg mx-auto">
          {[
            { label: "TORNEOS", value: "100+", icon: Trophy },
            { label: "EQUIPOS", value: "500+", icon: Users },
            { label: "PREMIOS", value: "50K RLC", icon: Star },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <p className="font-orbitron font-black text-xl text-white">{stat.value}</p>
              <p className="text-xs font-mono text-zinc-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
        <div className="w-px h-8 bg-gradient-to-b from-transparent to-red-500" />
        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" />
      </div>
    </section>
  );
}

function UpcomingTournaments() {
  const { data: tournaments, isLoading } = trpc.tournaments.list.useQuery({
    status: "registration_open",
  });

  return (
    <section className="py-16 max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-red-500 rounded-full" />
          <div>
            <h2 className="font-orbitron font-black text-2xl text-white tracking-wider">PRÓXIMOS TORNEOS</h2>
            <p className="text-zinc-500 font-rajdhani text-sm">Inscripciones abiertas ahora</p>
          </div>
        </div>
        <Link href="/tournaments">
          <button className="flex items-center gap-1 text-red-400 hover:text-red-300 font-mono text-xs transition-colors">
            VER TODOS <ChevronRight className="w-3 h-3" />
          </button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 bg-zinc-900/50 rounded-xl animate-pulse" />)}
        </div>
      ) : tournaments && tournaments.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.slice(0, 6).map((t) => (
            <Link key={t.id} href={`/tournaments/${t.id}`}>
              <div className="group bg-zinc-900/80 border border-zinc-800 hover:border-red-500/40 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-[0_0_20px_rgba(220,38,38,0.1)]">
                <div className="h-28 relative overflow-hidden">
                  {t.banner ? (
                    <img src={t.banner} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-950/40 to-zinc-900 flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-red-500/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                  <div className="absolute top-2 right-2">
                    <span className="text-xs font-mono bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded">INSCRIPCIONES</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-orbitron font-bold text-sm text-white group-hover:text-red-400 transition-colors line-clamp-1">{t.name}</h3>
                    <span className="text-xs text-red-400 font-mono shrink-0">{t.game}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-2">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{t.maxTeams} equipos</span>
                    {t.startDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(t.startDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-zinc-900/30 border border-zinc-800 rounded-xl">
          <Trophy className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
          <p className="text-zinc-600 font-rajdhani">No hay torneos con inscripciones abiertas en este momento.</p>
          <Link href="/tournaments">
            <button className="mt-3 text-red-400 hover:text-red-300 font-mono text-xs">VER TODOS LOS TORNEOS →</button>
          </Link>
        </div>
      )}
    </section>
  );
}

function LiveStreams() {
  const { data: streams } = trpc.streams.list.useQuery({ liveOnly: true });
  if (!streams || streams.length === 0) return null;

  return (
    <section className="py-16 bg-zinc-950/50 border-y border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <div className="w-1 h-8 bg-red-500 rounded-full" />
            <div>
              <h2 className="font-orbitron font-black text-2xl text-white tracking-wider">EN VIVO AHORA</h2>
              <p className="text-zinc-500 font-rajdhani text-sm">{streams.length} transmisión{streams.length !== 1 ? "es" : ""} activa{streams.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <Link href="/streams">
            <button className="flex items-center gap-1 text-red-400 hover:text-red-300 font-mono text-xs transition-colors">
              VER TODAS <ChevronRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {streams.slice(0, 3).map((s) => (
            <Link key={s.id} href="/streams">
              <div className="group relative bg-zinc-900/80 border border-red-500/20 rounded-xl overflow-hidden cursor-pointer hover:border-red-500/50 transition-all">
                <div className="h-36 bg-zinc-950 flex items-center justify-center relative">
                  {s.thumbnailUrl ? (
                    <img src={s.thumbnailUrl} alt={s.title} className="w-full h-full object-cover" />
                  ) : (
                    <Radio className="w-10 h-10 text-zinc-700" />
                  )}
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded font-mono animate-pulse">
                    <Radio className="w-3 h-3" /> EN VIVO
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-rajdhani font-bold text-sm text-white group-hover:text-red-400 transition-colors line-clamp-1">{s.title}</p>
                  <p className="text-xs text-zinc-500 font-mono mt-1">{s.platform.toUpperCase()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function RankingPreview() {
  const { data: ranking } = trpc.ranking.teams.useQuery({ limit: 5 });
  if (!ranking || ranking.length === 0) return null;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <section className="py-16 max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-red-500 rounded-full" />
          <div>
            <h2 className="font-orbitron font-black text-2xl text-white tracking-wider">RANKING GLOBAL</h2>
            <p className="text-zinc-500 font-rajdhani text-sm">Los mejores equipos de la plataforma</p>
          </div>
        </div>
        <Link href="/ranking">
          <button className="flex items-center gap-1 text-red-400 hover:text-red-300 font-mono text-xs transition-colors">
            VER COMPLETO <ChevronRight className="w-3 h-3" />
          </button>
        </Link>
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        {ranking.map((team, i) => (
          <Link key={team.id} href={`/teams/${team.id}`}>
            <div className="flex items-center gap-4 px-5 py-4 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors cursor-pointer group">
              <div className="w-8 text-center">
                {i < 3 ? <span className="text-lg">{medals[i]}</span> : <span className="font-mono text-sm text-zinc-500">{i + 1}</span>}
              </div>
              {team.logo ? (
                <img src={team.logo} alt={team.name} className="w-9 h-9 rounded object-cover" />
              ) : (
                <div className="w-9 h-9 rounded bg-red-500/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-red-400" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-rajdhani font-bold text-sm text-white group-hover:text-red-400 transition-colors">{team.name}</p>
                <p className="text-xs text-zinc-600">{team.game ?? "Multi-juego"}</p>
              </div>
              <div className="text-right">
                <p className="font-orbitron font-bold text-sm text-yellow-400">{team.points.toLocaleString()}</p>
                <p className="text-xs text-zinc-600 font-mono">pts</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function NewsPreview() {
  const { data: news } = trpc.news.list.useQuery({ limit: 3 });
  if (!news || news.length === 0) return null;

  return (
    <section className="py-16 bg-zinc-950/50 border-y border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-red-500 rounded-full" />
            <div>
              <h2 className="font-orbitron font-black text-2xl text-white tracking-wider">ÚLTIMAS NOTICIAS</h2>
              <p className="text-zinc-500 font-rajdhani text-sm">Mantente al día con el mundo de los esports</p>
            </div>
          </div>
          <Link href="/news">
            <button className="flex items-center gap-1 text-red-400 hover:text-red-300 font-mono text-xs transition-colors">
              VER TODAS <ChevronRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {news.map((article) => (
            <Link key={article.id} href={`/news/${article.slug}`}>
              <div className="group bg-zinc-900/80 border border-zinc-800 hover:border-red-500/30 rounded-xl overflow-hidden transition-all cursor-pointer">
                {article.coverImage && (
                  <div className="h-36 overflow-hidden">
                    <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                <div className="p-4">
                  <span className="text-xs font-mono text-zinc-500">{article.category.toUpperCase()}</span>
                  <h3 className="font-rajdhani font-bold text-sm text-white group-hover:text-red-400 transition-colors line-clamp-2 mt-1">{article.title}</h3>
                  <p className="text-xs text-zinc-600 mt-2">{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("es-ES") : ""}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function PromotionsSection() {
  const { data: promos } = trpc.promotions.list.useQuery();
  if (!promos || promos.length === 0) return null;

  return (
    <section className="py-16 max-w-7xl mx-auto px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-1 h-8 bg-red-500 rounded-full" />
        <div>
          <h2 className="font-orbitron font-black text-2xl text-white tracking-wider">PROMOCIONES</h2>
          <p className="text-zinc-500 font-rajdhani text-sm">Ofertas y eventos especiales</p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {promos.map((promo: { id: number; title: string; description: string | null; linkUrl: string | null; linkLabel: string | null; endDate?: Date | null }) => (
          <div key={promo.id} className="relative bg-gradient-to-r from-red-950/40 to-zinc-900 border border-red-500/20 rounded-xl p-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-start gap-3">
              <Zap className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-orbitron font-bold text-white mb-1">{promo.title}</h3>
                <p className="text-zinc-400 font-rajdhani text-sm">{promo.description}</p>
                {promo.endDate && (
                  <p className="text-xs font-mono text-zinc-600 mt-2">
                    Hasta: {new Date(promo.endDate).toLocaleDateString("es-ES")}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTASection() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return null;

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-red-950/20 via-zinc-950 to-red-950/20" />
      <div className="relative max-w-3xl mx-auto px-4 text-center">
        <h2 className="font-orbitron font-black text-3xl text-white mb-4 tracking-wider">¿LISTO PARA COMPETIR?</h2>
        <p className="text-zinc-400 font-rajdhani text-lg mb-8">Únete a Red Level Circle y forma parte de la comunidad de esports más grande. Crea tu equipo, inscríbete en torneos y escala el ranking.</p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a href={getLoginUrl()}>
            <Button className="bg-red-600 hover:bg-red-700 font-orbitron text-sm tracking-wider px-8 py-6 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
              COMENZAR GRATIS
            </Button>
          </a>
          <Link href="/tournaments">
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:border-red-500 font-orbitron text-sm tracking-wider px-8 py-6">
              EXPLORAR TORNEOS
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-800/50 py-8 bg-black">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-orbitron font-black text-lg tracking-widest">
            <span className="text-red-500">RED</span><span className="text-white">LEVEL</span>
            <span className="text-zinc-600 text-sm ml-1">CIRCLE</span>
          </span>
          <div className="flex items-center gap-6 text-xs font-mono text-zinc-600">
            <Link href="/tournaments"><span className="hover:text-zinc-400 cursor-pointer transition-colors">TORNEOS</span></Link>
            <Link href="/ranking"><span className="hover:text-zinc-400 cursor-pointer transition-colors">RANKING</span></Link>
            <Link href="/news"><span className="hover:text-zinc-400 cursor-pointer transition-colors">NOTICIAS</span></Link>
            <Link href="/streams"><span className="hover:text-zinc-400 cursor-pointer transition-colors">EN VIVO</span></Link>
            <Link href="/betting"><span className="hover:text-zinc-400 cursor-pointer transition-colors">APUESTAS</span></Link>
          </div>
          <p className="text-xs text-zinc-700 font-mono">© 2025 RED LEVEL CIRCLE</p>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <HeroSection />
      <UpcomingTournaments />
      <LiveStreams />
      <RankingPreview />
      <NewsPreview />
      <PromotionsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
