import { useState, useEffect } from "react";
import { Trophy, Swords, BarChart3, Eye, EyeOff, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Google Sign-In helper ────────────────────────────────────────────────────
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (element: HTMLElement, config: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

type AuthMode = "login" | "register";

export default function Login() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  // Load Google Identity Services script
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCallback,
        });
        const btn = document.getElementById("google-signin-btn");
        if (btn) {
          window.google.accounts.id.renderButton(btn, {
            theme: "filled_black",
            size: "large",
            width: "100%",
            text: "continue_with",
            shape: "pill",
          });
        }
      }
    };
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, [mode]);

  async function handleGoogleCallback(response: { credential: string }) {
    setError(null);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: response.credential }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al iniciar sesión con Google"); return; }
      window.location.href = "/";
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login" ? { email, password } : { email, password, name };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Ocurrió un error."); return; }
      if (mode === "register") setSuccess("¡Cuenta creada! Redirigiendo...");
      setTimeout(() => { window.location.href = "/"; }, 800);
    } catch {
      setError("Error de conexión. Verifica tu internet.");
    } finally {
      setLoading(false);
    }
  }

  const neonRed = "oklch(0.55 0.22 25)";

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg-base, #0d0d0d)" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, oklch(0.55 0.22 25 / 0.08) 0%, transparent 70%)` }} />
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-[0.3em] uppercase font-display" style={{ color: "var(--text-primary, #fff)" }}>
            <span style={{ color: neonRed }}>RED</span>LEVEL
          </h1>
          <p className="text-xs tracking-[0.4em] uppercase mt-1" style={{ color: "var(--text-muted, rgba(255,255,255,0.5))" }}>CIRCLE</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: "var(--bg-card, rgba(255,255,255,0.04))", border: "1px solid oklch(0.22 0.01 0)", boxShadow: "0 0 40px oklch(0.55 0.22 25 / 0.05)" }}>
          {/* Mode Toggle */}
          <div className="flex rounded-xl p-1 mb-6" style={{ background: "var(--bg-hover, rgba(255,255,255,0.06))" }}>
            {(["login", "register"] as AuthMode[]).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold font-display tracking-wider uppercase transition-all duration-200"
                style={{ background: mode === m ? neonRed : "transparent", color: mode === m ? "#fff" : "var(--text-muted, rgba(255,255,255,0.5))", boxShadow: mode === m ? `0 0 12px ${neonRed}60` : "none" }}>
                {m === "login" ? "Iniciar Sesión" : "Registrarse"}
              </button>
            ))}
          </div>

          {/* Title */}
          <div className="mb-6">
            <h2 className="text-xl font-bold font-display tracking-wide uppercase" style={{ color: "var(--text-primary, #fff)" }}>
              {mode === "login" ? "Bienvenido de vuelta" : "Crea tu cuenta"}
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted, rgba(255,255,255,0.5))" }}>
              {mode === "login" ? "Ingresa tus credenciales para acceder" : "Únete a la comunidad de esports"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase mb-1.5" style={{ color: "var(--text-muted, rgba(255,255,255,0.5))" }}>Nombre de usuario</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre o alias" required minLength={2} maxLength={64}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{ background: "var(--bg-hover, rgba(255,255,255,0.06))", border: "1px solid oklch(0.22 0.01 0)", color: "var(--text-primary, #fff)" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = neonRed)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "oklch(0.22 0.01 0)")} />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase mb-1.5" style={{ color: "var(--text-muted, rgba(255,255,255,0.5))" }}>Correo electrónico</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={{ background: "var(--bg-hover, rgba(255,255,255,0.06))", border: "1px solid oklch(0.22 0.01 0)", color: "var(--text-primary, #fff)" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = neonRed)}
                onBlur={(e) => (e.currentTarget.style.borderColor = "oklch(0.22 0.01 0)")} />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase mb-1.5" style={{ color: "var(--text-muted, rgba(255,255,255,0.5))" }}>Contraseña</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Mínimo 8 caracteres" : "Tu contraseña"} required minLength={mode === "register" ? 8 : 1}
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{ background: "var(--bg-hover, rgba(255,255,255,0.06))", border: "1px solid oklch(0.22 0.01 0)", color: "var(--text-primary, #fff)" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = neonRed)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "oklch(0.22 0.01 0)")} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: "var(--text-muted, rgba(255,255,255,0.4))" }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "oklch(0.55 0.22 25 / 0.1)", border: "1px solid oklch(0.55 0.22 25 / 0.3)", color: "oklch(0.80 0.18 25)" }}>{error}</div>
            )}
            {success && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "oklch(0.55 0.18 145 / 0.1)", border: "1px solid oklch(0.55 0.18 145 / 0.3)", color: "oklch(0.75 0.18 145)" }}>{success}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-display text-sm tracking-[0.2em] uppercase font-semibold transition-all duration-300 flex items-center justify-center gap-2 mt-2"
              style={{ background: loading ? "oklch(0.40 0.15 25)" : neonRed, color: "#fff", boxShadow: loading ? "none" : `0 0 20px ${neonRed}60`, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? (<><Loader2 size={16} className="animate-spin" /> Procesando...</>) : mode === "login" ? "Entrar" : "Crear Cuenta"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center gap-4 my-5">
            <div className="flex-1 h-px" style={{ background: "oklch(0.22 0.01 0)" }} />
            <span className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted, rgba(255,255,255,0.4))" }}>o continúa con</span>
            <div className="flex-1 h-px" style={{ background: "oklch(0.22 0.01 0)" }} />
          </div>

          {/* Google Sign-In */}
          {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
            <div id="google-signin-btn" className="w-full flex justify-center" />
          ) : (
            <div className="rounded-xl px-4 py-3 text-center text-xs" style={{ background: "var(--bg-hover, rgba(255,255,255,0.04))", border: "1px solid oklch(0.22 0.01 0)", color: "var(--text-muted, rgba(255,255,255,0.3))" }}>
              Google Sign-In no configurado<br />
              <span style={{ color: "oklch(0.55 0.22 25 / 0.7)" }}>Agrega VITE_GOOGLE_CLIENT_ID en Railway</span>
            </div>
          )}

          {/* Footer */}
          <div className="pt-6 border-t mt-6" style={{ borderColor: "oklch(0.18 0.01 0)" }}>
            <p className="text-xs text-center mb-4 tracking-widest uppercase font-display" style={{ color: "var(--text-muted, rgba(255,255,255,0.3))" }}>Plataforma de Esports</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <Trophy size={18} style={{ color: "oklch(0.65 0.18 80)" }} />, label: "Torneos" },
                { icon: <Swords size={18} style={{ color: neonRed }} />, label: "Equipos" },
                { icon: <BarChart3 size={18} style={{ color: "oklch(0.55 0.18 220)" }} />, label: "Rankings" },
              ].map(({ icon, label }) => (
                <div key={label} className="rounded-lg p-3 text-center" style={{ background: "var(--bg-card, rgba(255,255,255,0.03))", border: "1px solid oklch(0.18 0.01 0)" }}>
                  <div className="flex justify-center mb-1">{icon}</div>
                  <div className="text-xs font-display tracking-wider" style={{ color: "var(--text-muted, rgba(255,255,255,0.4))" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
