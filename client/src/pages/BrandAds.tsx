import { trpc } from "@/lib/trpc";
import { ExternalLink, Megaphone, TrendingUp, Users, Zap, Mail, Star, Shield } from "lucide-react";

export default function BrandAds() {
  const { data: ads = [] } = trpc.ads.list.useQuery();

  const trackClick = trpc.ads.trackClick.useMutation();

  const handleAdClick = (adId: number, url: string) => {
    trackClick.mutate({ adId });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const featuredAds = ads.filter((a) => a.isFeatured);
  const premiumAds = ads.filter((a) => a.isPremium && !a.isFeatured);
  const standardAds = ads.filter((a) => !a.isFeatured && !a.isPremium);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0a0000 0%, #1a0000 40%, #0a0a0a 100%)" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Vertical light beams like Epic Games */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px opacity-20"
              style={{
                left: `${15 + i * 15}%`,
                background: "linear-gradient(to bottom, transparent, #ff0000, transparent)",
                animation: `pulse ${2 + i * 0.3}s ease-in-out infinite alternate`,
              }}
            />
          ))}
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Megaphone className="w-8 h-8 text-red-500" />
              <span className="text-red-500 font-mono text-sm tracking-widest uppercase">Para Marcas</span>
            </div>
            <h1 className="text-6xl font-black tracking-tight mb-4 leading-none" style={{ fontFamily: "Orbitron, monospace" }}>
              LLEGA A LA<br />
              <span className="text-red-500" style={{ textShadow: "0 0 30px #ff0000" }}>COMUNIDAD</span><br />
              GAMER
            </h1>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              Conecta tu marca con miles de jugadores apasionados. Publicidad premium en la plataforma líder de torneos de esports.
            </p>
            <a
              href="mailto:ads@redlevelcircle.gg"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-mono font-bold transition-all text-lg"
              style={{ boxShadow: "0 0 20px rgba(255,0,0,0.3)" }}
            >
              <Mail className="w-5 h-5" />
              Contactar para Publicar
            </a>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="border-y border-white/5 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: <Users className="w-6 h-6 text-red-400" />, value: "10K+", label: "Jugadores activos" },
            { icon: <TrendingUp className="w-6 h-6 text-blue-400" />, value: "500+", label: "Torneos realizados" },
            { icon: <Zap className="w-6 h-6 text-yellow-400" />, value: "95%", label: "Tasa de engagement" },
            { icon: <Star className="w-6 h-6 text-green-400" />, value: "15+", label: "Juegos soportados" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="flex justify-center mb-2">{stat.icon}</div>
              <p className="text-3xl font-black font-mono text-white">{stat.value}</p>
              <p className="text-gray-500 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Featured Ads — Epic Games style large banners */}
        {featuredAds.length > 0 && (
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <Star className="w-5 h-5 text-yellow-400" />
              <h2 className="text-2xl font-black font-mono tracking-wide">DESTACADOS</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {featuredAds.map((ad) => (
                <div
                  key={ad.id}
                  className="relative rounded-2xl overflow-hidden cursor-pointer group"
                  style={{ minHeight: "280px" }}
                  onClick={() => ad.destinationUrl && handleAdClick(ad.id, ad.destinationUrl)}
                >
                  {ad.bannerImage ? (
                    <img src={ad.bannerImage} alt={ad.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1a0000, #0a0a0a)" }} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    {ad.logoImage && (
                      <img src={ad.logoImage} alt={ad.brandName ?? ""} className="h-10 w-auto object-contain mb-3 self-start" />
                    )}
                    <h3 className="text-2xl font-black text-white mb-1">{ad.title}</h3>
                    {ad.tagline && <p className="text-gray-300 text-sm mb-3">{ad.tagline}</p>}
                    {ad.ctaLabel && ad.destinationUrl && (
                      <div className="flex items-center gap-2 text-white font-mono font-bold text-sm group-hover:text-red-400 transition-colors">
                        {ad.ctaLabel}
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="absolute top-4 right-4 px-2 py-1 rounded bg-yellow-500 text-black text-xs font-bold font-mono">
                    PATROCINADO
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Premium Ads — Medium cards */}
        {premiumAds.length > 0 && (
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-5 h-5 text-purple-400" />
              <h2 className="text-2xl font-black font-mono tracking-wide">PREMIUM</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {premiumAds.map((ad) => (
                <div
                  key={ad.id}
                  className="relative rounded-xl overflow-hidden cursor-pointer group border border-purple-500/20 hover:border-purple-500/50 transition-all"
                  style={{ minHeight: "200px" }}
                  onClick={() => ad.destinationUrl && handleAdClick(ad.id, ad.destinationUrl)}
                >
                  {ad.bannerImage ? (
                    <img src={ad.bannerImage} alt={ad.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 bg-zinc-900" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute inset-0 p-5 flex flex-col justify-end">
                    <h3 className="text-lg font-bold text-white mb-1">{ad.title}</h3>
                    {ad.tagline && <p className="text-gray-400 text-xs">{ad.tagline}</p>}
                    {ad.ctaLabel && (
                      <div className="flex items-center gap-1 text-purple-400 font-mono text-xs mt-2 group-hover:text-purple-300 transition-colors">
                        {ad.ctaLabel} <ExternalLink className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 px-1.5 py-0.5 rounded bg-purple-500/80 text-white text-xs font-mono">
                    PREMIUM
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Standard Ads */}
        {standardAds.length > 0 && (
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <Megaphone className="w-5 h-5 text-gray-400" />
              <h2 className="text-2xl font-black font-mono tracking-wide text-gray-300">ANUNCIANTES</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {standardAds.map((ad) => (
                <div
                  key={ad.id}
                  className="rounded-xl border border-white/10 bg-zinc-900 overflow-hidden cursor-pointer hover:border-white/30 transition-all group"
                  onClick={() => ad.destinationUrl && handleAdClick(ad.id, ad.destinationUrl)}
                >
                  <div className="aspect-video bg-zinc-800 overflow-hidden">
                    {ad.bannerImage ? (
                      <img src={ad.bannerImage} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Megaphone className="w-8 h-8 text-gray-700" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-sm text-white truncate">{ad.title}</p>
                    {ad.brandName && <p className="text-gray-500 text-xs">{ad.brandName}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {ads.length === 0 && (
          <div className="text-center py-16">
            <Megaphone className="w-16 h-16 text-red-500/30 mx-auto mb-4" />
            <p className="text-gray-500 font-mono text-lg mb-2">No hay anuncios activos</p>
            <p className="text-gray-600 text-sm">¿Quieres publicitar tu marca aquí?</p>
          </div>
        )}

        {/* Advertising Plans */}
        <div className="mt-16">
          <h2 className="text-3xl font-black font-mono text-center mb-10">
            PLANES DE <span className="text-red-500">PUBLICIDAD</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "ESTÁNDAR",
                price: "Desde $50 USD/mes",
                color: "border-white/20",
                features: ["Banner en sección de anunciantes", "Estadísticas básicas de clics", "Soporte por email"],
                icon: <Megaphone className="w-6 h-6" />,
              },
              {
                name: "PREMIUM",
                price: "Desde $150 USD/mes",
                color: "border-purple-500/50",
                highlight: true,
                features: ["Banner en sección Premium", "Mayor visibilidad", "Estadísticas avanzadas", "Soporte prioritario"],
                icon: <Shield className="w-6 h-6" />,
              },
              {
                name: "DESTACADO",
                price: "Desde $300 USD/mes",
                color: "border-yellow-500/50",
                features: ["Banner principal hero", "Máxima visibilidad", "Integración en torneos", "Estadísticas en tiempo real", "Account manager dedicado"],
                icon: <Star className="w-6 h-6" />,
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`rounded-2xl border p-6 ${plan.color} ${plan.highlight ? "bg-purple-500/5" : "bg-zinc-900"} relative`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-500 rounded-full text-white text-xs font-bold font-mono">
                    MÁS POPULAR
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${plan.highlight ? "bg-purple-500/20 text-purple-400" : "bg-red-500/10 text-red-400"}`}>
                    {plan.icon}
                  </div>
                  <div>
                    <h3 className="font-black font-mono text-lg">{plan.name}</h3>
                    <p className="text-gray-400 text-sm">{plan.price}</p>
                  </div>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="mailto:ads@redlevelcircle.gg"
                  className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-mono font-bold text-sm transition-all ${
                    plan.highlight
                      ? "bg-purple-500 hover:bg-purple-600 text-white"
                      : "border border-red-500/50 text-red-400 hover:bg-red-500/10"
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Contactar
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
