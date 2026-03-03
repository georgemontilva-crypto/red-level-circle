/**
 * PageContainer — Contenedor global unificado para todas las páginas
 *
 * Padding lateral consistente para que el contenido no se pegue al sidebar ni al borde derecho.
 *
 * Padding responsivo:
 *   - Desktop (lg+): 40px a cada lado
 *   - Tablet  (md):  28px
 *   - Mobile:        16px
 */

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div
      className={`w-full ${className}`}
      style={{
        paddingLeft: "clamp(16px, 2.5vw, 40px)",
        paddingRight: "clamp(16px, 2.5vw, 40px)",
      }}
    >
      {children}
    </div>
  );
}
