/**
 * PageContainer — Contenedor global unificado para todas las páginas
 *
 * Proporciona padding lateral consistente en toda la plataforma.
 * El sidebar ocupa 240px (w-60), por lo que con 20px de padding
 * el margen total desde el borde izquierdo de la pantalla es de 260px.
 *
 * Padding responsivo:
 *   - Desktop (lg+): 20px  → margen total izquierdo = sidebar(240) + padding(20) = 260px
 *   - Tablet  (sm):  16px
 *   - Mobile:        12px
 *
 * No aplica max-width para que el contenido ocupe todo el ancho disponible.
 */

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div
      className={`w-full px-3 sm:px-4 lg:px-5 ${className}`}
    >
      {children}
    </div>
  );
}
