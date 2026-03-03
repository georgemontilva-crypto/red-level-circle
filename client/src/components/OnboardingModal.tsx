import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Coins, Loader2, ChevronRight } from "lucide-react";

interface OnboardingModalProps {
  onComplete: () => void;
  /** loginMethod of the current user — passed from App.tsx */
  loginMethod?: string | null;
}

export default function OnboardingModal({ onComplete, loginMethod }: OnboardingModalProps) {
  const isGoogle = loginMethod === "google";
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);

  const updateMutation = trpc.profile.updateMine.useMutation({
    onSuccess: () => {
      setSaving(false);
      onComplete();
      toast.success("¡Bienvenido a Red Level Circle!", {
        description: "Tu cuenta está lista. ¡Comienza a competir!",
        style: { background: "var(--bg-main)", border: "1px solid #22c55e", color: "var(--text-primary)" },
      });
    },
    onError: (err) => {
      toast.error(err.message);
      setSaving(false);
    },
  });

  const handleComplete = () => {
    if (isGoogle && !nickname.trim()) {
      toast.error("Por favor ingresa un nickname");
      return;
    }
    setSaving(true);
    // All users enter as "player" by default — role upgrades require application
    updateMutation.mutate({
      ...(isGoogle && nickname.trim() ? { nickname: nickname.trim() } : {}),
      profileType: "player",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #120000 100%)",
          border: "1px solid rgba(220,38,38,0.3)",
          boxShadow: "0 0 60px rgba(220,38,38,0.1), 0 25px 50px rgba(0,0,0,0.8)",
        }}
      >
        {/* Header */}
        <div className="relative overflow-hidden px-6 pt-8 pb-6">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,0,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,0,0.5) 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          />
          <div className="relative text-center">
            {/* Brand icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 mb-4 overflow-hidden">
              <img
                src="/favicon.webp"
                alt="Red Level Circle"
                className="w-10 h-10 object-contain"
                style={{ filter: "drop-shadow(0 0 6px rgba(220,38,38,0.6))" }}
              />
            </div>
            <h1 className="font-orbitron font-black text-2xl text-white mb-2">
              BIENVENIDO A<br />
              <span className="text-red-500">RED LEVEL CIRCLE</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              {isGoogle
                ? "Elige tu alias para comenzar a competir"
                : "Tu cuenta está lista. ¡Comienza a competir!"}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-4">
          {/* Nickname field — only for Google users */}
          {isGoogle && (
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-2 tracking-widest">
                ELIGE TU NICKNAME
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value.replace(/\s/g, ""))}
                placeholder="Tu alias público (ej: ProGamer99)"
                maxLength={64}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && nickname.trim() && handleComplete()}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-red-500 transition-colors placeholder-muted-foreground font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Este será tu nombre visible en torneos y rankings. Sin espacios.
              </p>
            </div>
          )}

          {/* Welcome coins */}
          <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-center gap-3">
              <Coins className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <div>
                <p className="text-yellow-400 font-bold text-sm font-mono">¡500 RLC COINS DE BIENVENIDA!</p>
                <p className="text-muted-foreground text-xs">Ya están en tu cartera. Úsalos en la tienda.</p>
              </div>
            </div>
          </div>

          {/* Info: role by application only */}
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Entras como <span className="text-white font-semibold">Jugador</span>. Para ser Creador de Contenido o Creador de Torneos debes aplicar mediante formulario y recibir aprobación.
          </p>

          <button
            onClick={handleComplete}
            disabled={saving || (isGoogle && !nickname.trim())}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-orbitron font-bold tracking-wider transition-all"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> GUARDANDO...</>
            ) : (
              <>EMPEZAR <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
