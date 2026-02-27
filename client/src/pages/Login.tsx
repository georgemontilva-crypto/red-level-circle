import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, Trophy, Swords, BarChart3 } from "lucide-react";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin neon-text" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Left panel - cyberpunk visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[oklch(0.08_0.03_25)] to-black" />

        {/* Neon circle decoration */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-72 h-72 rounded-full"
            style={{
              border: "2px solid oklch(0.60 0.26 25)",
              boxShadow:
                "0 0 30px oklch(0.60 0.26 25 / 0.7), 0 0 80px oklch(0.55 0.22 25 / 0.4), 0 0 150px oklch(0.50 0.20 25 / 0.2), inset 0 0 30px oklch(0.55 0.22 25 / 0.1)",
            }}
          />
          <div
            className="absolute w-56 h-56 rounded-full"
            style={{
              border: "1px solid oklch(0.55 0.22 25 / 0.4)",
              boxShadow: "0 0 15px oklch(0.55 0.22 25 / 0.3)",
            }}
          />
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.55 0.22 25 / 0.3) 1px, transparent 1px), linear-gradient(90deg, oklch(0.55 0.22 25 / 0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Radial glow */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, oklch(0.55 0.22 25 / 0.15) 0%, transparent 70%)",
          }}
        />

        {/* Logo bottom left */}
        <div className="absolute bottom-10 left-10">
          <span className="font-display text-xl tracking-widest">
            <span className="neon-text">RED</span>
            <span className="text-foreground">LEVEL</span>
            <span className="text-muted-foreground text-sm ml-1">CIRCLE</span>
          </span>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            {/* Mobile logo */}
            <div className="lg:hidden mb-6">
              <span className="font-display text-2xl tracking-widest">
                <span className="neon-text">RED</span>
                <span className="text-foreground">LEVEL</span>
                <span className="text-muted-foreground text-sm ml-1">CIRCLE</span>
              </span>
            </div>
            <h1
              className="font-display text-3xl font-bold tracking-[0.2em] text-foreground uppercase"
              style={{ letterSpacing: "0.25em" }}
            >
              INICIA SESIÓN
            </h1>
            <p className="text-muted-foreground font-sans text-sm tracking-wide">
              Ingresa tus datos y accede a tu cuenta
            </p>
          </div>

          {/* Login button with Manus OAuth */}
          <div className="space-y-4">
            <button
              onClick={handleLogin}
              className="w-full py-4 px-6 rounded-full font-display text-sm tracking-[0.2em] uppercase font-semibold transition-all duration-300 flex items-center justify-center gap-3"
              style={{
                background: "transparent",
                border: "1px solid oklch(0.55 0.22 25)",
                color: "oklch(0.90 0.005 0)",
                boxShadow: "0 0 8px oklch(0.55 0.22 25 / 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "oklch(0.55 0.22 25 / 0.15)";
                e.currentTarget.style.boxShadow =
                  "0 0 20px oklch(0.55 0.22 25 / 0.6), 0 0 40px oklch(0.55 0.22 25 / 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.boxShadow = "0 0 8px oklch(0.55 0.22 25 / 0.3)";
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="oklch(0.55 0.22 25)" strokeWidth="1.5" />
                <path d="M12 6v6l4 2" stroke="oklch(0.70 0.28 25)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              ENTRAR CON MANUS
            </button>

            {/* Divider */}
            <div className="relative flex items-center gap-4">
              <div className="flex-1 h-px" style={{ background: "oklch(0.22 0.01 0)" }} />
              <span className="text-muted-foreground text-sm">ó</span>
              <div className="flex-1 h-px" style={{ background: "oklch(0.22 0.01 0)" }} />
            </div>

            {/* Info box */}
            <div
              className="rounded-xl p-4 text-center"
              style={{
                background: "oklch(0.10 0.005 0)",
                border: "1px solid oklch(0.20 0.01 0)",
              }}
            >
              <p className="text-muted-foreground text-sm leading-relaxed">
                Red Level Circle usa{" "}
                <span className="neon-text-sm font-semibold">Manus OAuth</span> para una
                autenticación segura. Serás redirigido al portal de Manus para iniciar sesión.
              </p>
            </div>

            {/* Register link */}
            <p className="text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <button
                onClick={handleLogin}
                className="font-semibold transition-colors duration-200"
                style={{ color: "oklch(0.65 0.22 25)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "oklch(0.75 0.26 25)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "oklch(0.65 0.22 25)")
                }
              >
                Regístrate
              </button>
            </p>
          </div>

          {/* Features preview */}
          <div className="pt-6 border-t" style={{ borderColor: "oklch(0.15 0.005 0)" }}>
            <p className="text-xs text-muted-foreground text-center mb-4 tracking-widest uppercase font-display">
              Plataforma de Esports
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg p-3 text-center" style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.18 0.01 0)" }}>
                <div className="flex justify-center mb-1"><Trophy size={20} style={{ color: "oklch(0.65 0.18 80)" }} /></div>
                <div className="text-xs text-muted-foreground font-display tracking-wider">Torneos</div>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.18 0.01 0)" }}>
                <div className="flex justify-center mb-1"><Swords size={20} style={{ color: "oklch(0.55 0.22 25)" }} /></div>
                <div className="text-xs text-muted-foreground font-display tracking-wider">Equipos</div>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.18 0.01 0)" }}>
                <div className="flex justify-center mb-1"><BarChart3 size={20} style={{ color: "oklch(0.55 0.18 220)" }} /></div>
                <div className="text-xs text-muted-foreground font-display tracking-wider">Rankings</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
