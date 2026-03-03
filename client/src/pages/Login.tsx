import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
    <div className="fixed inset-0 flex overflow-hidden" style={{ background: "#0a0a0a" }}>

      {/* ══════════════════════════════════════════════════
          BACKGROUND IMAGE — full bleed, behind everything
          (visible on mobile too)
      ══════════════════════════════════════════════════ */}
      <img
        src="/backgroundredfluid.webp"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.80 }}
      />
      {/* Global dark overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.45)" }}
      />

      {/* ══════════════════════════════════════════════════
          LEFT PANEL — desktop only (lg+)
          Logo + slogan centered over the background
      ══════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center">
        {/* Glassmorphism logo card */}
        <div
          className="relative z-10 flex flex-col items-center px-14 py-12 rounded-3xl"
          style={{
            background: "rgba(8, 8, 8, 0.50)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 8px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Logo — large */}
          <img
            src="/logocompleto.webp"
            alt="Red Level Circle"
            className="object-contain mb-7"
            style={{
              width: "300px",
              filter: "drop-shadow(0 0 32px oklch(0.55 0.22 25 / 0.55))",
            }}
          />

          {/* Divider */}
          <div
            className="w-20 h-px mb-6"
            style={{
              background:
                "linear-gradient(90deg, transparent, oklch(0.55 0.22 25 / 0.9), transparent)",
            }}
          />

          {/* Slogan */}
          <p
            className="text-center font-mono tracking-[0.2em] uppercase leading-loose"
            style={{ color: "rgba(255,255,255,0.70)", fontSize: "0.85rem", maxWidth: "260px" }}
          >
            Entra al círculo.{" "}
            <span style={{ color: "oklch(0.65 0.22 25)", display: "block" }}>
              Demuestra tu nivel.
            </span>
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          RIGHT PANEL — form
          Desktop: dark solid panel
          Mobile: full screen, gradient from transparent → dark
      ══════════════════════════════════════════════════ */}
      <div className="flex-1 relative flex flex-col overflow-y-auto">

        {/* Mobile gradient overlay: transparent top → dark bottom */}
        <div
          className="lg:hidden absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(13,13,13,0) 0%, rgba(13,13,13,0.55) 30%, rgba(13,13,13,0.92) 55%, rgba(13,13,13,1) 75%)",
          }}
        />

        {/* Desktop: solid dark background for the right panel */}
        <div
          className="hidden lg:block absolute inset-0"
          style={{ background: "#0d0d0d" }}
        />

        {/* Subtle red glow at top (desktop) */}
        <div
          className="hidden lg:block absolute top-0 left-0 right-0 h-64 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 40% at 50% 0%, oklch(0.55 0.22 25 / 0.07) 0%, transparent 70%)",
          }}
        />

        {/* ── Mobile: logo at top ── */}
        <div className="lg:hidden relative z-10 flex justify-center pt-12 pb-4">
          <img
            src="/logocompleto.webp"
            alt="Red Level Circle"
            className="object-contain"
            style={{
              width: "180px",
              filter: "drop-shadow(0 0 20px oklch(0.55 0.22 25 / 0.6))",
            }}
          />
        </div>

        {/* ── Mobile: slogan ── */}
        <div className="lg:hidden relative z-10 text-center pb-6 px-6">
          <p
            className="font-mono tracking-[0.18em] uppercase text-sm leading-loose"
            style={{ color: "rgba(255,255,255,0.60)" }}
          >
            Entra al círculo.{" "}
            <span style={{ color: "oklch(0.65 0.22 25)" }}>Demuestra tu nivel.</span>
          </p>
        </div>

        {/* ── Form container ── */}
        <div className="relative z-10 flex-1 flex items-start lg:items-center justify-center px-6 pb-10">
          <div className="w-full max-w-md">

            {/* Mode Toggle */}
            <div
              className="flex rounded-xl p-1 mb-7"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {(["login", "register"] as AuthMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold font-mono tracking-wider uppercase transition-all duration-200"
                  style={{
                    background: mode === m ? neonRed : "transparent",
                    color: mode === m ? "#fff" : "rgba(255,255,255,0.4)",
                    boxShadow: mode === m ? `0 0 16px oklch(0.55 0.22 25 / 0.4)` : "none",
                  }}
                >
                  {m === "login" ? "Iniciar Sesión" : "Registrarse"}
                </button>
              ))}
            </div>

            {/* Title */}
            <div className="mb-7">
              <h2
                className="text-2xl font-black font-mono tracking-widest uppercase"
                style={{ color: "#fff" }}
              >
                {mode === "login" ? "Bienvenido de vuelta" : "Crea tu cuenta"}
              </h2>
              <p className="text-sm mt-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                {mode === "login"
                  ? "Ingresa tus credenciales para acceder"
                  : "Únete a la comunidad de esports"}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label
                    className="block text-xs font-semibold tracking-widest uppercase mb-1.5"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    Nombre de usuario
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre o alias"
                    required
                    minLength={2}
                    maxLength={64}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "#fff",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = neonRed)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)")}
                  />
                </div>
              )}

              <div>
                <label
                  className="block text-xs font-semibold tracking-widest uppercase mb-1.5"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "#fff",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = neonRed)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)")}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold tracking-widest uppercase mb-1.5"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "register" ? "Mínimo 8 caracteres" : "Tu contraseña"}
                    required
                    minLength={mode === "register" ? 8 : 1}
                    className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "#fff",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = neonRed)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{
                    background: "oklch(0.55 0.22 25 / 0.1)",
                    border: "1px solid oklch(0.55 0.22 25 / 0.3)",
                    color: "oklch(0.80 0.18 25)",
                  }}
                >
                  {error}
                </div>
              )}
              {success && (
                <div
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{
                    background: "oklch(0.55 0.18 145 / 0.1)",
                    border: "1px solid oklch(0.55 0.18 145 / 0.3)",
                    color: "oklch(0.75 0.18 145)",
                  }}
                >
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-mono text-sm tracking-[0.25em] uppercase font-bold transition-all duration-300 flex items-center justify-center gap-2 mt-2"
                style={{
                  background: loading ? "oklch(0.40 0.15 25)" : neonRed,
                  color: "#fff",
                  boxShadow: loading ? "none" : `0 0 24px oklch(0.55 0.22 25 / 0.5)`,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Procesando...</>
                ) : mode === "login" ? (
                  "Entrar"
                ) : (
                  "Crear Cuenta"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center gap-4 my-6">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
              <span
                className="text-xs tracking-widest uppercase font-mono"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                o continúa con
              </span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            </div>

            {/* Google Sign-In */}
            {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
              <div id="google-signin-btn" className="w-full flex justify-center" />
            ) : (
              <div
                className="rounded-xl px-4 py-3 text-center text-xs"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.25)",
                }}
              >
                Google Sign-In no configurado
                <br />
                <span style={{ color: "oklch(0.55 0.22 25 / 0.6)" }}>
                  Agrega VITE_GOOGLE_CLIENT_ID en Railway
                </span>
              </div>
            )}

            {/* Switch mode link */}
            <p
              className="text-center text-xs mt-6 font-mono"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setError(null);
                  setSuccess(null);
                }}
                className="font-bold transition-colors hover:opacity-80"
                style={{ color: neonRed }}
              >
                {mode === "login" ? "Regístrate" : "Inicia sesión"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
