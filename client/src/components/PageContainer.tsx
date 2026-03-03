/**
 * PageContainer — Contenedor global unificado para todas las páginas
 *
 * Padding lateral consistente para que el contenido no se pegue al sidebar.
 *
 * Padding responsivo:
 *   - Desktop (lg+): 32px a cada lado
 *   - Tablet  (sm):  20px
 *   - Mobile:        16px
 */

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`w-full px-4 sm:px-5 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
