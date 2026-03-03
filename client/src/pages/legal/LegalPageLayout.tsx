import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

interface LegalPageLayoutProps {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  children: ReactNode;
}

export default function LegalPageLayout({
  title,
  subtitle,
  lastUpdated = "03 de marzo de 2026",
  children,
}: LegalPageLayoutProps) {
  return (
    <div
      className="min-h-screen"
      style={{ background: "#0a0a0a", color: "#e5e5e5", fontFamily: "'Rajdhani', sans-serif" }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-6 py-4 flex items-center gap-4"
        style={{
          background: "rgba(10,10,10,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <a
          href="/"
          className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          <ArrowLeft size={16} />
          Volver al inicio
        </a>
        <div className="flex-1" />
        <img
          src="/logocompleto.webp"
          alt="Red Level Circle"
          style={{ height: "28px", objectFit: "contain" }}
        />
      </div>

      {/* Hero */}
      <div
        className="px-6 py-16 text-center"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.55 0.22 25 / 0.12) 0%, transparent 70%)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          className="inline-block px-4 py-1 rounded-full text-xs font-mono tracking-widest uppercase mb-4"
          style={{
            background: "oklch(0.55 0.22 25 / 0.12)",
            border: "1px solid oklch(0.55 0.22 25 / 0.3)",
            color: "oklch(0.75 0.18 25)",
          }}
        >
          Documento Legal
        </div>
        <h1
          className="text-4xl md:text-5xl font-black font-mono tracking-widest uppercase mb-3"
          style={{ color: "#fff" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
            {subtitle}
          </p>
        )}
        <p className="text-sm font-mono" style={{ color: "rgba(255,255,255,0.30)" }}>
          Última actualización: {lastUpdated}
        </p>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="legal-content">{children}</div>

        {/* Footer links */}
        <div
          className="mt-16 pt-8 flex flex-wrap gap-4 justify-center"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          {[
            { href: "/legal/terminos", label: "Términos y Condiciones" },
            { href: "/legal/privacidad", label: "Privacidad" },
            { href: "/legal/cookies", label: "Cookies" },
            { href: "/legal/tienda", label: "Tienda y Recompensas" },
            { href: "/legal/aliados", label: "Alianzas" },
            { href: "/legal/devoluciones", label: "Devoluciones" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs font-mono tracking-wider uppercase transition-colors hover:opacity-80"
              style={{ color: "rgba(255,255,255,0.30)" }}
            >
              {link.label}
            </a>
          ))}
        </div>
        <p
          className="text-center text-xs mt-4 font-mono"
          style={{ color: "rgba(255,255,255,0.18)" }}
        >
          © {new Date().getFullYear()} Red Level Circle. Todos los derechos reservados.
        </p>
      </div>

      <style>{`
        .legal-content h2 {
          font-size: 1.35rem;
          font-weight: 800;
          font-family: 'Orbitron', monospace;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #fff;
          margin-top: 2.5rem;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(239, 68, 68, 0.25);
        }
        .legal-content h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: oklch(0.75 0.18 25);
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .legal-content p {
          font-size: 0.975rem;
          line-height: 1.8;
          color: rgba(255,255,255,0.65);
          margin-bottom: 1rem;
        }
        .legal-content ul, .legal-content ol {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .legal-content li {
          font-size: 0.975rem;
          line-height: 1.8;
          color: rgba(255,255,255,0.65);
          margin-bottom: 0.35rem;
        }
        .legal-content strong {
          color: rgba(255,255,255,0.85);
          font-weight: 700;
        }
        .legal-content a {
          color: oklch(0.65 0.22 25);
          text-decoration: underline;
        }
        .legal-content a:hover {
          opacity: 0.8;
        }
        .legal-content .highlight-box {
          background: oklch(0.55 0.22 25 / 0.08);
          border: 1px solid oklch(0.55 0.22 25 / 0.25);
          border-radius: 0.75rem;
          padding: 1rem 1.25rem;
          margin: 1.25rem 0;
        }
        .legal-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.25rem 0;
          font-size: 0.9rem;
        }
        .legal-content th {
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.70);
          font-weight: 700;
          text-align: left;
          padding: 0.6rem 0.9rem;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .legal-content td {
          color: rgba(255,255,255,0.55);
          padding: 0.6rem 0.9rem;
          border: 1px solid rgba(255,255,255,0.06);
        }
      `}</style>
    </div>
  );
}
