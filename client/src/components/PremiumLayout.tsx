/**
 * PremiumLayout — wrapper simple para páginas del dashboard premium.
 * El sidebar global lo provee SidebarLayout en App.tsx.
 */
interface PremiumLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function PremiumLayout({ children, title }: PremiumLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {title && (
        <div className="px-4 sm:px-6 pt-6 pb-2 border-b border-zinc-800/50">
          <h1 className="font-orbitron font-black text-xl tracking-widest text-white">
            {title}
          </h1>
        </div>
      )}
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}
