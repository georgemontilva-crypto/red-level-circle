/**
 * PageContainer — Contenedor global unificado para todas las páginas
 *
 * Proporciona:
 * - max-width: 1400px (ancho máximo consistente)
 * - Márgenes automáticos (centrado horizontal)
 * - Padding responsivo:
 *   - Desktop: 32px (px-8)
 *   - Tablet: 24px (px-6)
 *   - Mobile: 16px (px-4)
 *
 * Uso:
 * <PageContainer>
 *   Contenido de la página
 * </PageContainer>
 */

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div
      className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${className}`}
      style={{
        maxWidth: "1400px",
      }}
    >
      {children}
    </div>
  );
}
