import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Gamepad2, Crown, Swords, ChevronRight, Coins, Trophy, Star, Loader2 } from "lucide-react";

interface OnboardingModalProps {
  onComplete: () => void;
}

const PROFILE_TYPES = [
  {
    value: "player" as const,
    label: "Jugador",
    icon: Gamepad2,
    desc: "Participa en torneos, forma equipos y compite por premios",
    color: "border-blue-500/50 bg-blue-500/5",
    activeColor: "border-blue-500 bg-blue-500/15",
    iconColor: "text-blue-400",
  },
  {
    value: "team_captain" as const,
    label: "Capitán de Equipo",
    icon: Crown,
    desc: "Lidera un equipo, recluta jugadores y lleva a tu equipo a la victoria",
    color: "border-yellow-500/50 bg-yellow-500/5",
    activeColor: "border-yellow-500 bg-yellow-500/15",
    iconColor: "text-yellow-400",
  },
  {
    value: "event_creator" as const,
    label: "Creador de Eventos",
    icon: Swords,
    desc: "Organiza torneos, gestiona inscripciones y crea la comunidad",
    color: "border-red-500/50 bg-red-500/5",
    activeColor: "border-red-500 bg-red-500/15",
    iconColor: "text-red-400",
  },
];

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState("");
  const [profileType, setProfileType] = useState<"player" | "team_captain" | "event_creator">("player");
  const [saving, setSaving] = useState(false);

  const updateMutation = trpc.profile.updateMine.useMutation({
    onSuccess: () => {
      setSaving(false);
      onComplete();
      toast.success("¡Bienvenido a Red Level Circle!", {
        description: "Tu perfil ha sido configurado. ¡Comienza a competir!",
        style: { background: "var(--bg-main)", border: "1px solid #22c55e", color: "var(--text-primary)" },
      });
    },
    onError: (err) => {
      toast.error(err.message);
      setSaving(false);
    },
  });

  const handleComplete = () => {
    if (!nickname.trim()) {
      toast.error("Por favor ingresa un nickname");
      return;
    }
    setSaving(true);
    updateMutation.mutate({ nickname: nickname.trim(), profileType });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #120000 100%)",
          border: "1px solid rgba(220,38,38,0.3)",
          boxShadow: "0 0 60px rgba(220,38,38,0.1), 0 25px 50px rgba(0,0,0,0.8)",
        }}
      >
        {/* Header */}
        <div className="relative overflow-hidden px-6 pt-8 pb-6">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "linear-gradient(rgba(255,0,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,0,0.5) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 mb-4">
              <Trophy className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="font-orbitron font-black text-2xl text-white mb-2">
              BIENVENIDO A<br />
              <span className="text-red-500">RED LEVEL CIRCLE</span>
            </h1>
            <p className="text-muted-foreground text-sm">Configura tu perfil para comenzar a competir</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1 rounded-full transition-all duration-300 ${
                  s === step ? "w-8 bg-red-500" : s < step ? "w-4 bg-red-500/60" : "w-4 bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-2 tracking-widest">
                  ELIGE TU NICKNAME
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Tu alias en la plataforma..."
                  maxLength={64}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && nickname.trim() && setStep(2)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-red-500 transition-colors placeholder-muted-foreground font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1.5">Este será tu nombre visible en torneos y rankings</p>
              </div>

              {/* Bonus info */}
              <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                <div className="flex items-center gap-3">
                  <Coins className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-400 font-bold text-sm font-mono">¡500 RLC COINS DE BIENVENIDA!</p>
                    <p className="text-muted-foreground text-xs">Ya están en tu cartera. Úsalos en apuestas o la tienda.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => nickname.trim() && setStep(2)}
                disabled={!nickname.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-orbitron font-bold tracking-wider transition-all"
              >
                SIGUIENTE <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-3 tracking-widest">
                  ¿CÓMO PARTICIPARÁS?
                </label>
                <div className="space-y-2">
                  {PROFILE_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setProfileType(type.value)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        profileType === type.value ? type.activeColor : type.color
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-background/30 ${type.iconColor}`}>
                          <type.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold font-mono text-sm ${profileType === type.value ? "text-white" : "text-secondary-foreground"}`}>
                            {type.label}
                          </p>
                          <p className="text-muted-foreground text-xs mt-0.5">{type.desc}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                          profileType === type.value ? "border-white bg-white/30" : "border-zinc-600"
                        }`} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:text-white hover:border-zinc-500 font-mono text-sm transition-all"
                >
                  ATRÁS
                </button>
                <button
                  onClick={handleComplete}
                  disabled={saving}
                  className="flex-2 flex-grow-[2] flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-orbitron font-bold tracking-wider transition-all"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> GUARDANDO...</>
                  ) : (
                    <><Star className="w-4 h-4" /> EMPEZAR</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
