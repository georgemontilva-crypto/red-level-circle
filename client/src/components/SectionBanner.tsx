import { trpc } from "@/lib/trpc";

interface SectionBannerProps {
  sectionKey: string;
  /** Altura del banner en clases Tailwind, ej: "h-40" o "h-56" */
  height?: string;
  /** Clase extra para el contenedor */
  className?: string;
}

/**
 * Muestra el banner configurado por el admin para una sección específica.
 * Si no hay banner activo, no renderiza nada.
 */
export function SectionBanner({ sectionKey, height = "h-40 sm:h-56", className = "" }: SectionBannerProps) {
  const { data: banner } = trpc.banners.getSection.useQuery({ sectionKey });

  if (!banner || !banner.isActive) return null;

  // Detectar si es móvil para usar la imagen correspondiente
  const imageUrl = banner.imageUrl;
  if (!imageUrl) return null;

  return (
    <div className={`relative w-full overflow-hidden rounded-xl mb-6 ${height} ${className}`}>
      <img
        src={imageUrl}
        alt={banner.title ?? sectionKey}
        className="w-full h-full object-cover"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      {/* Optional title/subtitle */}
      {(banner.title || banner.subtitle) && (
        <div className="absolute bottom-0 left-0 p-4 sm:p-6">
          {banner.title && (
            <h2 className="font-orbitron font-black text-xl sm:text-3xl text-white tracking-wider drop-shadow-lg">
              {banner.title}
            </h2>
          )}
          {banner.subtitle && (
            <p className="text-zinc-300 text-sm font-rajdhani mt-1 drop-shadow">{banner.subtitle}</p>
          )}
        </div>
      )}
      {/* Optional link */}
      {banner.linkUrl && (
        <a
          href={banner.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0"
          aria-label={banner.title ?? "Ver más"}
        />
      )}
    </div>
  );
}
