import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Trophy, Users, Swords, ChevronRight, Zap, Shield, Star } from "lucide-react";
import { Link } from "wouter";

const GAME_LABELS: Record<string, string> = {
  single_elimination: "Eliminación Simple",
  double_elimination: "Doble Eliminación",
  groups: "Fase de Grupos",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  registration_open: { label: "Inscripciones Abiertas", color: "oklch(0.65 0.18 145)" },
  in_progress: { label: "En Curso", color: "oklch(0.65 0.18 80)" },
  completed: { label: "Finalizado", color: "oklch(0.55 0.005 0)" },
  draft: { label: "Próximamente", color: "oklch(0.55 0.18 220)" },
  registration_closed: { label: "Inscripciones Cerradas", color: "oklch(0.55 0.22 25)" },
  cancelled: { label: "Cancelado", color: "oklch(0.45 0.005 0)" },
};

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const { data: tournaments, isLoading } = trpc.tournaments.list.useQuery({
    status: "registration_open",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          background: "oklch(0.07 0.005 0 / 0.95)",
          borderBottom: "1px solid oklch(0.20 0.01 0)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Link href="/">
          <span className="font-display text-xl tracking-widest cursor-pointer">
            <span className="neon-text">RED</span>
            <span className="text-foreground">LEVEL</span>
            <span className="text-muted-foreground text-sm ml-1">CIRCLE</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/tournaments">
            <span className="text-muted-foreground hover:text-foreground transition-colors font-display text-sm tracking-wider cursor-pointer">
              TORNEOS
            </span>
          </Link>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <button
                className="px-5 py-2 rounded-full font-display text-xs tracking-widest transition-all duration-300"
                style={{
                  background: "oklch(0.55 0.22 25)",
                  color: "oklch(0.98 0 0)",
                  boxShadow: "0 0 12px oklch(0.55 0.22 25 / 0.4)",
                }}
              >
                DASHBOARD
              </button>
            </Link>
          ) : (
            <button
              onClick={() => (window.location.href = getLoginUrl())}
              className="px-5 py-2 rounded-full font-display text-xs tracking-widest transition-all duration-300"
              style={{
                background: "oklch(0.55 0.22 25)",
                color: "oklch(0.98 0 0)",
                boxShadow: "0 0 12px oklch(0.55 0.22 25 / 0.4)",
              }}
            >
              INGRESAR
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background effects */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, oklch(0.55 0.22 25 / 0.08) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.55 0.22 25 / 0.5) 1px, transparent 1px), linear-gradient(90deg, oklch(0.55 0.22 25 / 0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Large neon circle */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            border: "1px solid oklch(0.55 0.22 25)",
            boxShadow: "0 0 80px oklch(0.55 0.22 25 / 0.3), inset 0 0 80px oklch(0.55 0.22 25 / 0.1)",
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-30"
          style={{
            border: "1px solid oklch(0.55 0.22 25 / 0.6)",
            boxShadow: "0 0 40px oklch(0.55 0.22 25 / 0.4)",
          }}
        />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 font-display text-xs tracking-widest"
            style={{
              background: "oklch(0.55 0.22 25 / 0.1)",
              border: "1px solid oklch(0.55 0.22 25 / 0.4)",
              color: "oklch(0.70 0.28 25)",
            }}
          >
            <Zap size={12} />
            PLATAFORMA DE ESPORTS PREMIUM
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-black tracking-wider mb-6 leading-tight">
            <span className="text-foreground">DOMINA</span>
            <br />
            <span className="neon-text animate-neon-text">EL CÍRCULO</span>
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-sans">
            Crea torneos épicos, forma equipos legendarios y compite por la gloria en la plataforma
            de esports más avanzada.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link href="/tournaments">
                <button
                  className="px-8 py-4 rounded-full font-display text-sm tracking-widest transition-all duration-300 flex items-center gap-2"
                  style={{
                    background: "oklch(0.55 0.22 25)",
                    color: "oklch(0.98 0 0)",
                    boxShadow: "0 0 20px oklch(0.55 0.22 25 / 0.5), 0 0 40px oklch(0.55 0.22 25 / 0.2)",
                  }}
                >
                  VER TORNEOS <ChevronRight size={16} />
                </button>
              </Link>
            ) : (
              <button
                onClick={() => (window.location.href = getLoginUrl())}
                className="px-8 py-4 rounded-full font-display text-sm tracking-widest transition-all duration-300 flex items-center gap-2"
                style={{
                  background: "oklch(0.55 0.22 25)",
                  color: "oklch(0.98 0 0)",
                  boxShadow: "0 0 20px oklch(0.55 0.22 25 / 0.5), 0 0 40px oklch(0.55 0.22 25 / 0.2)",
                }}
              >
                COMENZAR AHORA <ChevronRight size={16} />
              </button>
            )}
            <Link href="/tournaments">
              <button
                className="px-8 py-4 rounded-full font-display text-sm tracking-widest transition-all duration-300"
                style={{
                  background: "transparent",
                  border: "1px solid oklch(0.30 0.01 0)",
                  color: "oklch(0.75 0.005 0)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "oklch(0.55 0.22 25 / 0.5)";
                  e.currentTarget.style.color = "oklch(0.90 0.005 0)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "oklch(0.30 0.01 0)";
                  e.currentTarget.style.color = "oklch(0.75 0.005 0)";
                }}
              >
                EXPLORAR TORNEOS
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-16 max-w-lg mx-auto">
            {[
              { label: "Torneos", value: "∞", icon: <Trophy size={20} /> },
              { label: "Equipos", value: "∞", icon: <Users size={20} /> },
              { label: "Batallas", value: "∞", icon: <Swords size={20} /> },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex justify-center mb-2 neon-text">{stat.icon}</div>
                <div className="font-display text-2xl font-bold neon-text">{stat.value}</div>
                <div className="text-muted-foreground text-xs font-display tracking-widest mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active tournaments */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-wider text-foreground">
                TORNEOS ACTIVOS
              </h2>
              <p className="text-muted-foreground mt-1">Inscripciones abiertas ahora mismo</p>
            </div>
            <Link href="/tournaments">
              <button
                className="flex items-center gap-2 font-display text-xs tracking-widest transition-colors"
                style={{ color: "oklch(0.65 0.22 25)" }}
              >
                VER TODOS <ChevronRight size={14} />
              </button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-xl h-48 animate-pulse"
                  style={{ background: "oklch(0.10 0.005 0)" }}
                />
              ))}
            </div>
          ) : tournaments && tournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.slice(0, 6).map((t) => {
                const statusInfo = STATUS_LABELS[t.status] ?? { label: t.status, color: "oklch(0.55 0.005 0)" };
                return (
                  <Link key={t.id} href={`/tournaments/${t.id}`}>
                    <div
                      className="rounded-xl p-5 cursor-pointer transition-all duration-300 group"
                      style={{
                        background: "oklch(0.10 0.005 0)",
                        border: "1px solid oklch(0.18 0.01 0)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "oklch(0.55 0.22 25 / 0.4)";
                        e.currentTarget.style.boxShadow = "0 0 20px oklch(0.55 0.22 25 / 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "oklch(0.18 0.01 0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span
                          className="text-xs font-display tracking-wider px-2 py-1 rounded-full"
                          style={{
                            background: `${statusInfo.color}20`,
                            border: `1px solid ${statusInfo.color}50`,
                            color: statusInfo.color,
                          }}
                        >
                          {statusInfo.label}
                        </span>
                        <span
                          className="text-xs font-tech"
                          style={{ color: "oklch(0.55 0.005 0)" }}
                        >
                          {t.game}
                        </span>
                      </div>
                      <h3 className="font-display text-lg font-bold text-foreground mb-2 tracking-wide group-hover:neon-text-sm transition-all">
                        {t.name}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                        {t.description ?? "Sin descripción"}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: "oklch(0.55 0.005 0)" }} className="font-display tracking-wider">
                          {GAME_LABELS[t.bracketType] ?? t.bracketType}
                        </span>
                        {t.prizeDescription && (
                          <span style={{ color: "oklch(0.65 0.18 80)" }} className="font-display tracking-wider">
                            🏆 {t.prizeDescription}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div
              className="rounded-xl p-12 text-center"
              style={{
                background: "oklch(0.10 0.005 0)",
                border: "1px solid oklch(0.18 0.01 0)",
              }}
            >
              <Trophy size={40} className="mx-auto mb-4" style={{ color: "oklch(0.30 0.01 0)" }} />
              <p className="text-muted-foreground font-display tracking-wider">
                No hay torneos activos en este momento
              </p>
              <p className="text-muted-foreground text-sm mt-2">Vuelve pronto para nuevos torneos</p>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4" style={{ background: "oklch(0.09 0.005 0)" }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl font-bold tracking-wider text-center text-foreground mb-12">
            POR QUÉ <span className="neon-text">RED LEVEL CIRCLE</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Trophy size={32} />,
                title: "Torneos Profesionales",
                desc: "Crea torneos con brackets automáticos, gestión de inscripciones y seguimiento en tiempo real.",
              },
              {
                icon: <Shield size={32} />,
                title: "Sistema Premium",
                desc: "Los usuarios premium tienen acceso completo a la creación y gestión de torneos con herramientas avanzadas.",
              },
              {
                icon: <Star size={32} />,
                title: "Experiencia Épica",
                desc: "Interfaz diseñada para la comunidad gamer con estética cyberpunk y funcionalidades de alto nivel.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-xl text-center"
                style={{
                  background: "oklch(0.11 0.005 0)",
                  border: "1px solid oklch(0.18 0.01 0)",
                }}
              >
                <div className="neon-text flex justify-center mb-4">{f.icon}</div>
                <h3 className="font-display text-lg font-bold text-foreground mb-3 tracking-wider">
                  {f.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="py-20 px-4 text-center relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, oklch(0.55 0.22 25 / 0.05) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="font-display text-4xl font-bold tracking-wider text-foreground mb-4">
              ÚNETE AL <span className="neon-text">CÍRCULO</span>
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Regístrate gratis y comienza a competir en torneos de esports
            </p>
            <button
              onClick={() => (window.location.href = getLoginUrl())}
              className="px-10 py-4 rounded-full font-display text-sm tracking-widest transition-all duration-300"
              style={{
                background: "oklch(0.55 0.22 25)",
                color: "oklch(0.98 0 0)",
                boxShadow: "0 0 25px oklch(0.55 0.22 25 / 0.5)",
              }}
            >
              CREAR CUENTA GRATIS
            </button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer
        className="py-8 px-6 text-center"
        style={{ borderTop: "1px solid oklch(0.15 0.005 0)" }}
      >
        <span className="font-display text-lg tracking-widest">
          <span className="neon-text">RED</span>
          <span className="text-foreground">LEVEL</span>
          <span className="text-muted-foreground text-sm ml-1">CIRCLE</span>
        </span>
        <p className="text-muted-foreground text-xs mt-2 font-tech">
          © 2026 Red Level Circle. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
