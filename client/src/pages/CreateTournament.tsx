import { trpc } from "@/lib/trpc";
import PremiumLayout from "@/components/PremiumLayout";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import { Trophy, ChevronRight, ChevronLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GAMES = [
  "League of Legends", "Valorant", "CS2", "FIFA", "Fortnite",
  "Dota 2", "Rocket League", "Apex Legends", "Overwatch 2", "Call of Duty",
  "Street Fighter 6", "Tekken 8", "Otro",
];

const BRACKET_TYPES = [
  {
    value: "single_elimination",
    label: "Eliminación Simple",
    desc: "El equipo que pierde queda eliminado. Rápido y directo.",
  },
  {
    value: "double_elimination",
    label: "Doble Eliminación",
    desc: "Los equipos tienen una segunda oportunidad antes de ser eliminados.",
  },
  {
    value: "groups",
    label: "Fase de Grupos",
    desc: "Todos los equipos se enfrentan entre sí en una fase de grupos.",
  },
];

interface FormData {
  name: string;
  game: string;
  customGame: string;
  description: string;
  rules: string;
  bracketType: "single_elimination" | "double_elimination" | "groups";
  maxTeams: number;
  minPlayersPerTeam: number;
  maxPlayersPerTeam: number;
  prizeDescription: string;
  prizeAmount: number;
  registrationStart: string;
  registrationEnd: string;
  startDate: string;
  endDate: string;
  isPublic: boolean;
  banner: string;
}

const defaultForm: FormData = {
  name: "",
  game: "",
  customGame: "",
  description: "",
  rules: "",
  bracketType: "single_elimination",
  maxTeams: 16,
  minPlayersPerTeam: 1,
  maxPlayersPerTeam: 5,
  prizeDescription: "",
  prizeAmount: 0,
  registrationStart: "",
  registrationEnd: "",
  startDate: "",
  endDate: "",
  isPublic: true,
  banner: "",
};

function NeonInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  min,
  max,
}: {
  label: string;
  type?: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-display tracking-wider text-muted-foreground mb-2">
        {label} {required && <span style={{ color: "oklch(0.65 0.22 25)" }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        className="w-full px-4 py-3 rounded-xl text-sm font-sans transition-all duration-200"
        style={{
          background: "oklch(0.09 0.005 0)",
          border: "1px solid oklch(0.22 0.01 0)",
          color: "oklch(0.90 0.005 0)",
          outline: "none",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "oklch(0.55 0.22 25)";
          e.target.style.boxShadow = "0 0 8px oklch(0.55 0.22 25 / 0.3)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "oklch(0.22 0.01 0)";
          e.target.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

function NeonTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-display tracking-wider text-muted-foreground mb-2">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 rounded-xl text-sm font-sans resize-none transition-all duration-200"
        style={{
          background: "oklch(0.09 0.005 0)",
          border: "1px solid oklch(0.22 0.01 0)",
          color: "oklch(0.90 0.005 0)",
          outline: "none",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "oklch(0.55 0.22 25)";
          e.target.style.boxShadow = "0 0 8px oklch(0.55 0.22 25 / 0.3)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "oklch(0.22 0.01 0)";
          e.target.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

export default function CreateTournament() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState<FormData>(defaultForm);
  const [step, setStep] = useState(1);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const totalSteps = 3;

  const uploadImage = trpc.profile.uploadImage.useMutation();

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("La imagen no puede superar 5MB"); return; }
    setUploadingBanner(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const result = await uploadImage.mutateAsync({ base64, mimeType: file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp", type: "banner" });
        set("banner")(result.url);
        toast.success("Banner subido correctamente");
        setUploadingBanner(false);
      };
      reader.onerror = () => { toast.error("Error al leer el archivo"); setUploadingBanner(false); };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Error al subir el banner");
      setUploadingBanner(false);
    }
  };

  const set = (key: keyof FormData) => (val: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const createMutation = trpc.tournaments.create.useMutation({
    onSuccess: (data) => {
      toast.success("¡Torneo creado exitosamente!");
      navigate(`/dashboard/tournament/${data.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    const finalGame = form.game === "Otro" ? form.customGame : form.game;
    if (!form.name.trim()) { toast.error("El nombre del torneo es requerido"); return; }
    if (!finalGame.trim()) { toast.error("El juego es requerido"); return; }

    createMutation.mutate({
      name: form.name,
      game: finalGame,
      description: form.description || undefined,
      rules: form.rules || undefined,
      bracketType: form.bracketType,
      maxTeams: form.maxTeams,
      minPlayersPerTeam: form.minPlayersPerTeam,
      maxPlayersPerTeam: form.maxPlayersPerTeam,
      prizeDescription: form.prizeDescription || undefined,
      prizeAmount: form.prizeAmount,
      registrationStart: form.registrationStart ? new Date(form.registrationStart).getTime() : undefined,
      registrationEnd: form.registrationEnd ? new Date(form.registrationEnd).getTime() : undefined,
      startDate: form.startDate ? new Date(form.startDate).getTime() : undefined,
      endDate: form.endDate ? new Date(form.endDate).getTime() : undefined,
      isPublic: form.isPublic,
      banner: form.banner || undefined,
    });
  };

  return (
    <PremiumLayout title="CREAR TORNEO">
      <div className="max-w-2xl mx-auto overflow-x-hidden">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3 flex-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-display text-sm font-bold transition-all duration-300"
                style={
                  step >= s
                    ? {
                        background: "oklch(0.55 0.22 25)",
                        color: "oklch(0.98 0 0)",
                        boxShadow: "0 0 10px oklch(0.55 0.22 25 / 0.4)",
                      }
                    : {
                        background: "oklch(0.13 0.005 0)",
                        border: "1px solid oklch(0.22 0.01 0)",
                        color: "oklch(0.45 0.005 0)",
                      }
                }
              >
                {s}
              </div>
              <span
                className="text-xs font-display tracking-wider hidden sm:block"
                style={{ color: step >= s ? "oklch(0.80 0.005 0)" : "oklch(0.45 0.005 0)" }}
              >
                {s === 1 ? "INFO BÁSICA" : s === 2 ? "CONFIGURACIÓN" : "FECHAS Y PREMIO"}
              </span>
              {s < totalSteps && (
                <div
                  className="flex-1 h-px"
                  style={{
                    background:
                      step > s ? "oklch(0.55 0.22 25 / 0.5)" : "oklch(0.18 0.01 0)",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <div
          className="rounded-2xl p-6"
          style={{
            background: "oklch(0.10 0.005 0)",
            border: "1px solid oklch(0.18 0.01 0)",
          }}
        >
          {/* Step 1: Basic info */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold tracking-wider text-foreground mb-1">
                  INFORMACIÓN BÁSICA
                </h2>
                <p className="text-muted-foreground text-sm">Configura los datos principales del torneo</p>
              </div>

              <NeonInput
                label="NOMBRE DEL TORNEO"
                value={form.name}
                onChange={set("name")}
                placeholder="Ej: Red Level Championship 2026"
                required
              />

              <div>
                <label className="block text-xs font-orbitron tracking-widest text-muted-foreground mb-3">
                  JUEGO <span className="text-red-500">*</span>
                </label>
                <Select value={form.game} onValueChange={(v) => set("game")(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un juego" />
                  </SelectTrigger>
                  <SelectContent>
                    {GAMES.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.game === "Otro" && (
                <NeonInput
                  label="NOMBRE DEL JUEGO"
                  value={form.customGame}
                  onChange={set("customGame")}
                  placeholder="Nombre del juego"
                  required
                />
              )}

              <NeonTextarea
                label="DESCRIPCIÓN"
                value={form.description}
                onChange={set("description")}
                placeholder="Describe el torneo, sus objetivos y lo que lo hace especial..."
                rows={3}
              />

              <NeonTextarea
                label="REGLAS"
                value={form.rules}
                onChange={set("rules")}
                placeholder="Reglas del torneo, código de conducta, restricciones..."
                rows={5}
              />

              {/* Banner upload */}
              <div>
                <label className="block text-xs font-display tracking-wider text-muted-foreground mb-2">
                  BANNER DEL TORNEO
                </label>
                <div
                  className="relative w-full h-32 rounded-xl overflow-hidden cursor-pointer group"
                  style={{ border: "2px dashed oklch(0.30 0.01 0)", background: "oklch(0.09 0.005 0)" }}
                  onClick={() => document.getElementById("tournament-banner-input")?.click()}
                >
                  {form.banner ? (
                    <img src={form.banner} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <Trophy size={24} style={{ color: "oklch(0.40 0.005 0)" }} />
                      <span className="text-xs text-muted-foreground font-display tracking-wider">
                        {uploadingBanner ? "SUBIENDO..." : "CLICK PARA SUBIR BANNER"}
                      </span>
                      <span className="text-xs" style={{ color: "oklch(0.35 0.005 0)" }}>PNG, JPG · Máx. 5MB</span>
                    </div>
                  )}
                  {form.banner && (
                    <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-display tracking-wider">CAMBIAR BANNER</span>
                    </div>
                  )}
                  {uploadingBanner && (
                    <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <input
                  id="tournament-banner-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleBannerUpload}
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => set("isPublic")(!form.isPublic)}
                  className="relative w-12 h-6 rounded-full transition-all duration-300"
                  style={{
                    background: form.isPublic ? "oklch(0.55 0.22 25)" : "oklch(0.18 0.01 0)",
                    boxShadow: form.isPublic ? "0 0 8px oklch(0.55 0.22 25 / 0.4)" : "none",
                  }}
                >
                  <div
                    className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300"
                    style={{ left: form.isPublic ? "calc(100% - 1.25rem)" : "0.25rem" }}
                  />
                </button>
                <span className="text-sm text-foreground font-display tracking-wider">
                  Torneo público
                </span>
                <span className="text-xs text-muted-foreground">
                  {form.isPublic ? "Visible para todos" : "Solo por invitación"}
                </span>
              </div>
            </div>
          )}

          {/* Step 2: Configuration */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold tracking-wider text-foreground mb-1">
                  CONFIGURACIÓN
                </h2>
                <p className="text-muted-foreground text-sm">Define el formato y los requisitos</p>
              </div>

              <div>
                <label className="block text-xs font-display tracking-wider text-muted-foreground mb-3">
                  TIPO DE BRACKET <span style={{ color: "oklch(0.65 0.22 25)" }}>*</span>
                </label>
                <div className="space-y-3">
                  {BRACKET_TYPES.map((bt) => (
                    <button
                      key={bt.value}
                      onClick={() => set("bracketType")(bt.value)}
                      className="w-full text-left p-4 rounded-xl transition-all duration-200"
                      style={
                        form.bracketType === bt.value
                          ? {
                              background: "oklch(0.55 0.22 25 / 0.12)",
                              border: "1px solid oklch(0.55 0.22 25 / 0.5)",
                            }
                          : {
                              background: "oklch(0.09 0.005 0)",
                              border: "1px solid oklch(0.22 0.01 0)",
                            }
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                          style={{
                            borderColor:
                              form.bracketType === bt.value
                                ? "oklch(0.55 0.22 25)"
                                : "oklch(0.35 0.005 0)",
                          }}
                        >
                          {form.bracketType === bt.value && (
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ background: "oklch(0.55 0.22 25)" }}
                            />
                          )}
                        </div>
                        <div>
                          <p
                            className="font-display text-sm font-bold tracking-wide"
                            style={{
                              color:
                                form.bracketType === bt.value
                                  ? "oklch(0.75 0.22 25)"
                                  : "oklch(0.80 0.005 0)",
                            }}
                          >
                            {bt.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{bt.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <NeonInput
                  label="MÁX. EQUIPOS"
                  type="number"
                  value={form.maxTeams}
                  onChange={(v) => set("maxTeams")(parseInt(v) || 16)}
                  min={2}
                  max={256}
                />
                <NeonInput
                  label="MÍN. JUGADORES"
                  type="number"
                  value={form.minPlayersPerTeam}
                  onChange={(v) => set("minPlayersPerTeam")(parseInt(v) || 1)}
                  min={1}
                  max={20}
                />
                <NeonInput
                  label="MÁX. JUGADORES"
                  type="number"
                  value={form.maxPlayersPerTeam}
                  onChange={(v) => set("maxPlayersPerTeam")(parseInt(v) || 5)}
                  min={1}
                  max={20}
                />
              </div>
            </div>
          )}

          {/* Step 3: Dates and prize */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold tracking-wider text-foreground mb-1">
                  FECHAS Y PREMIO
                </h2>
                <p className="text-muted-foreground text-sm">Define el calendario y los premios</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NeonInput
                  label="INICIO DE INSCRIPCIONES"
                  type="datetime-local"
                  value={form.registrationStart}
                  onChange={set("registrationStart")}
                />
                <NeonInput
                  label="CIERRE DE INSCRIPCIONES"
                  type="datetime-local"
                  value={form.registrationEnd}
                  onChange={set("registrationEnd")}
                />
                <NeonInput
                  label="FECHA DE INICIO"
                  type="datetime-local"
                  value={form.startDate}
                  onChange={set("startDate")}
                />
                <NeonInput
                  label="FECHA DE FIN"
                  type="datetime-local"
                  value={form.endDate}
                  onChange={set("endDate")}
                />
              </div>

              <div
                className="rounded-xl p-4"
                style={{
                  background: "oklch(0.09 0.005 0)",
                  border: "1px solid oklch(0.22 0.01 0)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Trophy size={16} style={{ color: "oklch(0.65 0.18 80)" }} />
                  <span className="font-display text-sm font-bold tracking-wider text-foreground">
                    PREMIO
                  </span>
                </div>
                <div className="space-y-3">
                  <NeonInput
                    label="DESCRIPCIÓN DEL PREMIO"
                    value={form.prizeDescription}
                    onChange={set("prizeDescription")}
                    placeholder="Ej: Periféricos gaming, tarjetas de regalo, etc."
                  />
                  <NeonInput
                    label="PUNTOS DE PLATAFORMA"
                    type="number"
                    value={form.prizeAmount}
                    onChange={(v) => set("prizeAmount")(parseInt(v) || 0)}
                    min={0}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Summary */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: "oklch(0.55 0.22 25 / 0.05)",
                  border: "1px solid oklch(0.55 0.22 25 / 0.2)",
                }}
              >
                <h4 className="font-display text-xs font-bold tracking-wider mb-3" style={{ color: "oklch(0.65 0.22 25)" }}>
                  RESUMEN DEL TORNEO
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nombre:</span>
                    <span className="text-foreground font-semibold">{form.name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Juego:</span>
                    <span className="text-foreground">{(form.game === "Otro" ? form.customGame : form.game) || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Formato:</span>
                    <span className="text-foreground">
                      {BRACKET_TYPES.find((b) => b.value === form.bracketType)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Equipos:</span>
                    <span className="text-foreground">Máx. {form.maxTeams}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-display text-xs tracking-widest transition-all duration-200"
                style={{
                  background: "transparent",
                  border: "1px solid oklch(0.25 0.01 0)",
                  color: "oklch(0.60 0.005 0)",
                }}
              >
                <ChevronLeft size={14} /> ATRÁS
              </button>
            )}
            <div className="flex-1" />
            {step < totalSteps ? (
              <button
                onClick={() => {
                  if (step === 1 && !form.name.trim()) {
                    toast.error("El nombre del torneo es requerido");
                    return;
                  }
                  if (step === 1 && !form.game) {
                    toast.error("Selecciona un juego");
                    return;
                  }
                  setStep((s) => s + 1);
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-display text-xs tracking-widest transition-all duration-300"
                style={{
                  background: "oklch(0.55 0.22 25)",
                  color: "oklch(0.98 0 0)",
                  boxShadow: "0 0 12px oklch(0.55 0.22 25 / 0.4)",
                }}
              >
                SIGUIENTE <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-display text-xs tracking-widest transition-all duration-300 disabled:opacity-50"
                style={{
                  background: "oklch(0.55 0.22 25)",
                  color: "oklch(0.98 0 0)",
                  boxShadow: "0 0 12px oklch(0.55 0.22 25 / 0.4)",
                }}
              >
                {createMutation.isPending ? "CREANDO..." : "CREAR TORNEO"}
                <Trophy size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </PremiumLayout>
  );
}
