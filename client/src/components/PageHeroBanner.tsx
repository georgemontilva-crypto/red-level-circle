/**
 * PageHeroBanner — Banner de cabecera para páginas de sección
 *
 * Muestra el nombre de la sección sobre el fondo oscuro con patrón diagonal rojo
 * idéntico al banner CTA del Home (¿Listo para competir?).
 *
 * Uso:
 *   <PageHeroBanner title="TORNEOS" subtitle="Compite y demuestra tu nivel" icon={<Trophy />} />
 */

interface PageHeroBannerProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export default function PageHeroBanner({ title, subtitle, icon }: PageHeroBannerProps) {
  return (
    <section className="relative rounded-2xl overflow-hidden mb-8">
      {/* Fondo: degradado rojo oscuro a negro (igual que el CTA del Home) */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-950/60 via-black to-black" />
      {/* Patrón diagonal rojo sutil */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, var(--accent-red) 0, var(--accent-red) 1px, transparent 0, transparent 50%)",
          backgroundSize: "20px 20px",
        }}
      />
      {/* Contenido */}
      <div className="relative px-8 py-8 sm:px-12 sm:py-10 flex items-center gap-4">
        {icon && (
          <span className="text-red-500 flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10">
            {icon}
          </span>
        )}
        <div>
          <h1 className="font-orbitron font-black text-3xl sm:text-4xl text-white tracking-wider uppercase">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground font-rajdhani text-sm mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </section>
  );
}
