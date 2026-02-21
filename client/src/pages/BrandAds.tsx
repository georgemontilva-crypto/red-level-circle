import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";
import { ExternalLink, ChevronLeft, ChevronRight, Megaphone } from "lucide-react";

// ─── Featured Carousel ────────────────────────────────────────────────────────
function FeaturedCarousel({ ads }: { ads: any[] }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackClick = trpc.ads.trackClick.useMutation();

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % ads.length);
    }, 5000);
  };

  useEffect(() => {
    if (ads.length > 1) startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [ads.length]);

  const goTo = (idx: number) => {
    setCurrent(idx);
    startTimer();
  };

  const prev = () => goTo((current - 1 + ads.length) % ads.length);
  const next = () => goTo((current + 1) % ads.length);

  const handleClick = (ad: any) => {
    if (ad.destinationUrl) {
      trackClick.mutate({ adId: ad.id });
      window.open(ad.destinationUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (ads.length === 0) return null;

  const ad = ads[current];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-zinc-900 group" style={{ height: "420px" }}>
      {/* Slides */}
      {ads.map((a, i) => (
        <div
          key={a.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? "auto" : "none" }}
        >
          {a.bannerImage ? (
            <img
              src={a.bannerImage}
              alt={a.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #1a0000, #0a0a0a)" }} />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {/* Content */}
          <div className="absolute bottom-0 left-0 p-8 max-w-xl">
            {a.logoImage && (
              <img src={a.logoImage} alt={a.brandName} className="h-8 w-auto object-contain mb-3" />
            )}
            <p className="text-red-400 font-mono text-xs tracking-widest uppercase mb-2">{a.brandName}</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 leading-tight" style={{ fontFamily: "Orbitron, monospace" }}>
              {a.title}
            </h2>
            {a.tagline && <p className="text-gray-300 text-sm mb-4">{a.tagline}</p>}
            {a.destinationUrl && (
              <button
                onClick={() => handleClick(a)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors"
              >
                {a.ctaLabel || "Ver más"}
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sponsored badge */}
          <div className="absolute top-4 right-4 px-2 py-1 rounded bg-black/60 backdrop-blur-sm text-gray-300 text-xs font-mono border border-white/10">
            PATROCINADO
          </div>
        </div>
      ))}

      {/* Navigation arrows */}
      {ads.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {ads.length > 1 && (
        <div className="absolute bottom-4 right-6 flex items-center gap-1.5">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="transition-all rounded-full"
              style={{
                width: i === current ? "20px" : "6px",
                height: "6px",
                background: i === current ? "#fff" : "rgba(255,255,255,0.3)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Small Card ───────────────────────────────────────────────────────────────
function SmallAdCard({ ad, onTrackClick }: { ad: any; onTrackClick: (id: number) => void }) {
  const handleClick = () => {
    if (ad.destinationUrl) {
      onTrackClick(ad.id);
      window.open(ad.destinationUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      className="rounded-xl overflow-hidden bg-zinc-900 border border-white/5 hover:border-white/20 cursor-pointer group transition-all hover:-translate-y-0.5"
      onClick={handleClick}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "3/4", maxHeight: "220px" }}>
        {ad.bannerImage ? (
          <img
            src={ad.bannerImage}
            alt={ad.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
            <Megaphone className="w-8 h-8 text-zinc-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      {/* Info */}
      <div className="p-3">
        <p className="font-bold text-sm text-white truncate">{ad.title}</p>
        {ad.brandName && <p className="text-gray-500 text-xs mt-0.5">{ad.brandName}</p>}
        {ad.ctaLabel && ad.destinationUrl && (
          <div className="flex items-center gap-1 text-red-400 text-xs mt-2 font-mono group-hover:text-red-300 transition-colors">
            {ad.ctaLabel} <ExternalLink className="w-3 h-3" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Wide Card ────────────────────────────────────────────────────────────────
function WideAdCard({ ad, onTrackClick }: { ad: any; onTrackClick: (id: number) => void }) {
  const handleClick = () => {
    if (ad.destinationUrl) {
      onTrackClick(ad.id);
      window.open(ad.destinationUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      className="relative rounded-xl overflow-hidden cursor-pointer group border border-white/5 hover:border-white/20 transition-all"
      style={{ height: "160px" }}
      onClick={handleClick}
    >
      {ad.bannerImage ? (
        <img
          src={ad.bannerImage}
          alt={ad.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-zinc-900" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      <div className="absolute inset-0 flex items-center p-6 gap-4">
        {ad.logoImage && (
          <img src={ad.logoImage} alt={ad.brandName} className="h-12 w-auto object-contain flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-red-400 font-mono text-xs tracking-widest uppercase mb-1">{ad.brandName}</p>
          <h3 className="text-xl font-black text-white truncate">{ad.title}</h3>
          {ad.tagline && <p className="text-gray-400 text-sm truncate mt-0.5">{ad.tagline}</p>}
        </div>
        {ad.destinationUrl && (
          <div className="flex-shrink-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-mono group-hover:bg-white/20 transition-colors">
              {ad.ctaLabel || "Ver más"}
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </div>
        )}
      </div>
      <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/50 text-gray-400 text-xs font-mono border border-white/10">
        PATROCINADO
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BrandAds() {
  const { data: ads = [] } = trpc.ads.list.useQuery();
  const trackClick = trpc.ads.trackClick.useMutation();

  const handleTrackClick = (adId: number) => trackClick.mutate({ adId });

  const featuredAds = ads.filter((a) => a.adType === "featured");
  const cardAds = ads.filter((a) => a.adType === "card");
  const wideAds = ads.filter((a) => a.adType === "wide");

  const hasAds = ads.length > 0;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">

        {/* ── Featured Carousel ── */}
        {featuredAds.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-5 rounded-full bg-red-500 inline-block" />
              <h2 className="text-lg font-black font-mono tracking-wide text-white uppercase">Destacados</h2>
            </div>
            <FeaturedCarousel ads={featuredAds} />
          </section>
        )}

        {/* ── Small Cards Grid ── */}
        {cardAds.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-5 rounded-full bg-zinc-500 inline-block" />
              <h2 className="text-lg font-black font-mono tracking-wide text-white uppercase">Populares</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {cardAds.map((ad) => (
                <SmallAdCard key={ad.id} ad={ad} onTrackClick={handleTrackClick} />
              ))}
            </div>
          </section>
        )}

        {/* ── Wide Cards ── */}
        {wideAds.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-5 rounded-full bg-zinc-500 inline-block" />
              <h2 className="text-lg font-black font-mono tracking-wide text-white uppercase">Anunciantes</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wideAds.map((ad) => (
                <WideAdCard key={ad.id} ad={ad} onTrackClick={handleTrackClick} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!hasAds && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Megaphone className="w-16 h-16 text-red-500/20 mb-4" />
            <p className="text-gray-500 font-mono text-lg mb-1">No hay anuncios activos</p>
            <p className="text-gray-600 text-sm">Los anuncios aparecerán aquí cuando estén configurados desde el panel de administración.</p>
          </div>
        )}

      </div>
    </div>
  );
}
