import { trpc } from "@/lib/trpc";
import { ReactNode } from "react";

interface SectionBannerProps {
  sectionKey: string;
  /** Altura del banner en clases Tailwind, ej: "h-40" o "h-56" */
  height?: string;
  /** Clase extra para el contenedor */
  className?: string;
  /** Contenido superpuesto sobre la imagen (título, descripción, etc.) */
  children?: ReactNode;
}

/**
 * Muestra el banner configurado por el admin para una sección específica.
 * Si no hay banner activo, muestra un fondo degradado oscuro.
 * Los children se renderizan superpuestos sobre la imagen.
 */
export function SectionBanner({
  sectionKey,
  height = "h-40 sm:h-56",
  className = "",
  children,
}: SectionBannerProps) {
  const { data: banner } = trpc.banners.getSection.useQuery({ sectionKey });

  const imageUrl = banner?.isActive ? banner.imageUrl : null;

  return (
    <div className={`relative w-full overflow-hidden rounded-xl mb-6 ${height} ${className}`}>
      {/* Background */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={banner?.title ?? sectionKey}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-red-950/20 to-black" />
      )}

      {/* Gradient overlay for text readability */}
      {(children || banner?.title || banner?.subtitle) && (
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Optional link covering entire banner */}
      {banner?.linkUrl && !children && (
        <a
          href={banner.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0"
          aria-label={banner.title ?? "Ver más"}
        />
      )}

      {/* Children (custom overlay content per page) */}
      {children && (
        <div className="absolute inset-0 flex items-center px-6 sm:px-10">
          {children}
        </div>
      )}

      {/* Fallback: title/subtitle from admin config (when no children) */}
      {!children && (banner?.title || banner?.subtitle) && (
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
    </div>
  );
}
