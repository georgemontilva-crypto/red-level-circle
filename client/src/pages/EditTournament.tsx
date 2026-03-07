import { trpc } from "@/lib/trpc";
import PremiumLayout from "@/components/PremiumLayout";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Trophy, ChevronRight, ChevronLeft, Loader2, Shield, Calendar, Medal } from "lucide-react";
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
  { value: "single_elimination", label: "Eliminación Simple", desc: "El equipo que pierde queda eliminado. Rápido y directo." },
  { value: "double_elimination", label: "Doble Eliminación", desc: "Los equipos tienen una segunda oportunidad antes de ser eliminados." },
  { value: "groups", label: "Fase de Grupos", desc: "Todos los equipos se enfrentan entre sí en una fase de grupos." },
];
const SERIES_FORMATS = [
  { value: "BO1", label: "BO1 — Partido Único", desc: "Un solo mapa decide el ganador. Ideal para fases de grupos." },
  { value: "BO2", label: "BO2 — Al Mejor de 2", desc: "Máximo 2 mapas. Puede terminar en empate (1-1)." },
  { value: "BO3", label: "BO3 — Al Mejor de 3", desc: "Primero en ganar 2 mapas avanza. El más común en torneos." },
  { value: "BO5", label: "BO5 — Al Mejor de 5", desc: "Primero en ganar 3 mapas. Para semifinales y finales." },
  { value: "BO7", label: "BO7 — Al Mejor de 7", desc: "Primero en ganar 4 mapas. Para grandes finales épicas." },
];
const REGIONS = [
  { value: "Latinoamérica Norte", label: "Latinoamérica Norte (LAN)" },
  { value: "Latinoamérica Sur", label: "Latinoamérica Sur (LAS)" },
  { value: "North America", label: "North America (NA)" },
  { value: "Brazil", label: "Brazil (BR)" },
  { value: "Europe", label: "Europe (EUW/EUNE)" },
  { value: "Korea", label: "Korea (KR)" },
  { value: "Japan", label: "Japan (JP)" },
  { value: "Oceania", label: "Oceania (OCE)" },
  { value: "Global", label: "Global (Sin restricción)" },
];

interface FormData {
  name: string;
  game: string;
  customGame: string;
  description: string;
  rules: string;
  bracketType: "single_elimination" | "double_elimination" | "groups";
  defaultSeriesFormat: "BO1" | "BO2" | "BO3" | "BO5" | "BO7";
  maxTeams: number;
  minPlayersPerTeam: number;
  maxPlayersPerTeam: number;
  prizeDescription: string;
  prizeAmount: number;
  prizeFirst: string;
  prizeSecond: string;
  prizeThird: string;
  registrationStart: string;
  registrationEnd: string;
  startDate: string;
  endDate: string;
  checkInStart: string;
  checkInEnd: string;
  isPublic: boolean;
  banner: string;
  region: string;
  requireRiotAccount: boolean;
  contactName: string;
  contactDiscord: string;
  contactDiscordServer: string;
}

function toDatetimeLocal(ts: Date | null | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function NeonInput({ label, type = "text", value, onChange, placeholder, required, min, max }: {
  label: string; type?: string; value: string | number; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; min?: number; max?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-display tracking-wider text-muted-foreground mb-2">
        {label} {required && <span style={{ color: "oklch(0.65 0.22 25)" }}>*</span>}
      </label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} required={required} min={min} max={max}
        className="w-full px-4 py-3 rounded-xl text-sm font-sans transition-all duration-200"
        style={{ background: "var(--bg-main)", border: "1px solid oklch(0.22 0.01 0)", color: "var(--text-primary)", outline: "none" }}
        onFocus={(e) => { e.target.style.borderColor = "oklch(0.55 0.22 25)"; e.target.style.boxShadow = "0 0 8px oklch(0.55 0.22 25 / 0.3)"; }}
        onBlur={(e) => { e.target.style.borderColor = "oklch(0.22 0.01 0)"; e.target.style.boxShadow = "none"; }}
      />
    </div>
  );
}

function NeonTextarea({ label, value, onChange, placeholder, rows = 4 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-display tracking-wider text-muted-foreground mb-2">{label}</label>
      <textarea
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full px-4 py-3 rounded-xl text-sm font-sans resize-none transition-all duration-200"
        style={{ background: "var(--bg-main)", border: "1px solid oklch(0.22 0.01 0)", color: "var(--text-primary)", outline: "none" }}
        onFocus={(e) => { e.target.style.borderColor = "oklch(0.55 0.22 25)"; e.target.style.boxShadow = "0 0 8px oklch(0.55 0.22 25 / 0.3)"; }}
        onBlur={(e) => { e.target.style.borderColor = "oklch(0.22 0.01 0)"; e.target.style.boxShadow = "none"; }}
      />
    </div>
  );
}

function Toggle({ label, description, value, onChange }: { label: string; description?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(!value)}
        className="relative w-12 h-6 rounded-full transition-all duration-300 shrink-0"
        style={{ background: value ? "oklch(0.55 0.22 25)" : "oklch(0.18 0.01 0)", boxShadow: value ? "0 0 8px oklch(0.55 0.22 25 / 0.4)" : "none" }}
      >
        <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300" style={{ left: value ? "calc(100% - 1.25rem)" : "0.25rem" }} />
      </button>
      <div>
        <span className="text-sm text-foreground font-display tracking-wider">{label}</span>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

export default function EditTournament() {
  const { id } = useParams<{ id: string }>();
  const tournamentId = parseInt(id ?? "0");
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const totalSteps = 4;

  const [form, setForm] = useState<FormData>({
    name: "", game: "", customGame: "", description: "", rules: "",
    bracketType: "single_elimination", defaultSeriesFormat: "BO3", maxTeams: 16, minPlayersPerTeam: 1,
    maxPlayersPerTeam: 5, prizeDescription: "", prizeAmount: 0,
    prizeFirst: "", prizeSecond: "", prizeThird: "",
    registrationStart: "", registrationEnd: "", startDate: "", endDate: "",
    checkInStart: "", checkInEnd: "",
    isPublic: true, banner: "",
    region: "Global", requireRiotAccount: false,
    contactName: "", contactDiscord: "", contactDiscordServer: "",
  });

  const { data: tournament, isLoading } = trpc.tournaments.byId.useQuery(
    { id: tournamentId },
    { enabled: !!tournamentId }
  );

  // Pre-load form with tournament data
  useEffect(() => {
    if (tournament && !initialized) {
      const t = tournament as any;
      const knownGames = GAMES.filter((g) => g !== "Otro");
      const isKnownGame = knownGames.includes(tournament.game);
      setForm({
        name: tournament.name ?? "",
        game: isKnownGame ? tournament.game : "Otro",
        customGame: isKnownGame ? "" : (tournament.game ?? ""),
        description: tournament.description ?? "",
        rules: tournament.rules ?? "",
        bracketType: (tournament.bracketType as FormData["bracketType"]) ?? "single_elimination",
        defaultSeriesFormat: (t.defaultSeriesFormat as FormData["defaultSeriesFormat"]) ?? "BO3",
        maxTeams: tournament.maxTeams ?? 16,
        minPlayersPerTeam: tournament.minPlayersPerTeam ?? 1,
        maxPlayersPerTeam: tournament.maxPlayersPerTeam ?? 5,
        prizeDescription: tournament.prizeDescription ?? "",
        prizeAmount: tournament.prizeAmount ?? 0,
        prizeFirst: t.prizeFirst ?? "",
        prizeSecond: t.prizeSecond ?? "",
        prizeThird: t.prizeThird ?? "",
        registrationStart: toDatetimeLocal(tournament.registrationStart),
        registrationEnd: toDatetimeLocal(tournament.registrationEnd),
        startDate: toDatetimeLocal(tournament.startDate),
        endDate: toDatetimeLocal(tournament.endDate),
        checkInStart: toDatetimeLocal(t.checkInStart),
        checkInEnd: toDatetimeLocal(t.checkInEnd),
        isPublic: tournament.isPublic ?? true,
        banner: tournament.banner ?? "",
        region: t.region ?? "Global",
        requireRiotAccount: t.requireRiotAccount ?? false,
        contactName: t.contactName ?? "",
        contactDiscord: t.contactDiscord ?? "",
        contactDiscordServer: t.contactDiscordServer ?? "",
      });
      setInitialized(true);
    }
  }, [tournament, initialized]);

  const set = (key: keyof FormData) => (val: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [key]: val }));

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
        const result = await uploadImage.mutateAsync({
          base64, mimeType: file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp", type: "banner",
        });
        set("banner")(result.url);
        toast.success("Banner actualizado");
        setUploadingBanner(false);
      };
      reader.onerror = () => { toast.error("Error al leer el archivo"); setUploadingBanner(false); };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Error al subir el banner");
      setUploadingBanner(false);
    }
  };

  const utils = trpc.useUtils();
  const updateMutation = trpc.tournaments.update.useMutation({
    onSuccess: () => {
      toast.success("¡Torneo actualizado correctamente!");
      utils.tournaments.list.invalidate();
      utils.tournaments.myTournaments.invalidate();
      utils.tournaments.byId.invalidate({ id: tournamentId });
      utils.home.featuredTournaments.invalidate();
      navigate(`/dashboard/tournament/${tournamentId}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    const finalGame = form.game === "Otro" ? form.customGame : form.game;
    if (!form.name.trim()) { toast.error("El nombre del torneo es requerido"); return; }
    if (!finalGame.trim()) { toast.error("El juego es requerido"); return; }
    updateMutation.mutate({
      id: tournamentId,
      name: form.name,
      game: finalGame,
      description: form.description || undefined,
      rules: form.rules || undefined,
      bracketType: form.bracketType,
      defaultSeriesFormat: form.defaultSeriesFormat,
      maxTeams: form.maxTeams,
      minPlayersPerTeam: form.minPlayersPerTeam,
      maxPlayersPerTeam: form.maxPlayersPerTeam,
      prizeDescription: form.prizeDescription || undefined,
      prizeAmount: form.prizeAmount,
      prizeFirst: form.prizeFirst || undefined,
      prizeSecond: form.prizeSecond || undefined,
      prizeThird: form.prizeThird || undefined,
      registrationStart: form.registrationStart ? new Date(form.registrationStart).getTime() : undefined,
      registrationEnd: form.registrationEnd ? new Date(form.registrationEnd).getTime() : undefined,
      startDate: form.startDate ? new Date(form.startDate).getTime() : undefined,
      endDate: form.endDate ? new Date(form.endDate).getTime() : undefined,
      checkInStart: form.checkInStart ? new Date(form.checkInStart).getTime() : undefined,
      checkInEnd: form.checkInEnd ? new Date(form.checkInEnd).getTime() : undefined,
      isPublic: form.isPublic,
      banner: form.banner || undefined,
      region: form.region !== "Global" ? form.region : undefined,
      requireRiotAccount: form.requireRiotAccount,
      contactName: form.contactName || undefined,
      contactDiscord: form.contactDiscord || undefined,
      contactDiscordServer: form.contactDiscordServer || undefined,
    });
  };

  if (isLoading) {
    return (
      <PremiumLayout title="EDITAR TORNEO">
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin" style={{ color: "oklch(0.55 0.22 25)" }} />
        </div>
      </PremiumLayout>
    );
  }

  if (!tournament) {
    return (
      <PremiumLayout title="EDITAR TORNEO">
        <div className="text-center py-24">
          <Trophy size={48} className="mx-auto mb-4" style={{ color: "oklch(0.25 0.01 0)" }} />
          <p className="text-muted-foreground font-display tracking-wider">Torneo no encontrado</p>
        </div>
      </PremiumLayout>
    );
  }

  const stepLabels = ["INFO BÁSICA", "CONFIGURACIÓN", "FECHAS Y CHECK-IN", "PREMIOS Y CONTACTO"];

  return (
    <PremiumLayout title={`EDITAR: ${tournament.name}`}>
      <div className="max-w-2xl mx-auto overflow-x-hidden">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2 shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-display text-sm font-bold transition-all duration-300"
                style={
                  step >= s
                    ? { background: "oklch(0.55 0.22 25)", color: "var(--text-primary)", boxShadow: "0 0 10px oklch(0.55 0.22 25 / 0.4)" }
                    : { background: "var(--bg-card)", border: "1px solid oklch(0.22 0.01 0)", color: "oklch(0.45 0.005 0)" }
                }
              >
                {s}
              </div>
              <span
                className="text-xs font-display tracking-wider hidden sm:block"
                style={{ color: step >= s ? "oklch(0.80 0.005 0)" : "oklch(0.45 0.005 0)" }}
              >
                {stepLabels[s - 1]}
              </span>
              {s < totalSteps && (
                <div className="w-6 h-px" style={{ background: step > s ? "oklch(0.55 0.22 25 / 0.5)" : "oklch(0.18 0.01 0)" }} />
              )}
            </div>
          ))}
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl p-6 space-y-5"
          style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}
        >
          {/* Step 1: Basic info */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold tracking-wider text-foreground mb-1">INFORMACIÓN BÁSICA</h2>
                <p className="text-muted-foreground text-sm">Edita los datos principales del torneo</p>
              </div>
              <NeonInput label="NOMBRE DEL TORNEO" value={form.name} onChange={set("name")} placeholder="Ej: Red Dragons Cup 2025" required />
              <div>
                <label className="block text-xs font-display tracking-wider text-muted-foreground mb-2">
                  JUEGO PRINCIPAL <span style={{ color: "oklch(0.65 0.22 25)" }}>*</span>
                </label>
                <Select value={form.game} onValueChange={set("game")}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar juego" /></SelectTrigger>
                  <SelectContent>
                    {GAMES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.game === "Otro" && (
                  <div className="mt-3">
                    <NeonInput label="NOMBRE DEL JUEGO" value={form.customGame} onChange={set("customGame")} placeholder="Nombre del juego" required />
                  </div>
                )}
              </div>
              <NeonTextarea label="DESCRIPCIÓN" value={form.description} onChange={set("description")} placeholder="Describe el torneo..." rows={3} />
              <NeonTextarea label="REGLAS" value={form.rules} onChange={set("rules")} placeholder="Reglas del torneo..." rows={5} />
              {/* Banner upload */}
              <div>
                <label className="block text-xs font-display tracking-wider text-muted-foreground mb-2">BANNER DEL TORNEO</label>
                <div
                  className="relative w-full h-32 rounded-xl overflow-hidden cursor-pointer group"
                  style={{ border: "2px dashed oklch(0.30 0.01 0)", background: "var(--bg-main)" }}
                  onClick={() => document.getElementById("edit-tournament-banner-input")?.click()}
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
                <input id="edit-tournament-banner-input" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleBannerUpload} />
              </div>
              {/* Public toggle */}
              <Toggle label="Torneo público" description={form.isPublic ? "Visible para todos" : "Solo por invitación"} value={form.isPublic} onChange={set("isPublic")} />
            </div>
          )}

          {/* Step 2: Configuration */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold tracking-wider text-foreground mb-1">CONFIGURACIÓN</h2>
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
                          ? { background: "oklch(0.55 0.22 25 / 0.12)", border: "1px solid oklch(0.55 0.22 25 / 0.5)" }
                          : { background: "var(--bg-main)", border: "1px solid oklch(0.22 0.01 0)" }
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                          style={{ borderColor: form.bracketType === bt.value ? "oklch(0.55 0.22 25)" : "oklch(0.30 0.01 0)" }}
                        >
                          {form.bracketType === bt.value && (
                            <div className="w-2 h-2 rounded-full" style={{ background: "oklch(0.55 0.22 25)" }} />
                          )}
                        </div>
                        <div>
                          <p className="font-display text-sm font-bold tracking-wider text-foreground">{bt.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{bt.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {/* Formato de serie */}
              <div>
                <label className="block text-xs font-display tracking-wider text-muted-foreground mb-3">
                  FORMATO DE SERIE <span style={{ color: "oklch(0.65 0.22 25)" }}>*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SERIES_FORMATS.map((sf) => (
                    <button
                      key={sf.value}
                      onClick={() => set("defaultSeriesFormat")(sf.value)}
                      className="text-left p-3 rounded-xl transition-all duration-200"
                      style={
                        form.defaultSeriesFormat === sf.value
                          ? { background: "oklch(0.55 0.22 25 / 0.12)", border: "1px solid oklch(0.55 0.22 25 / 0.5)" }
                          : { background: "var(--bg-main)", border: "1px solid oklch(0.22 0.01 0)" }
                      }
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                          style={{ borderColor: form.defaultSeriesFormat === sf.value ? "oklch(0.55 0.22 25)" : "oklch(0.35 0.005 0)" }}
                        >
                          {form.defaultSeriesFormat === sf.value && (
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.55 0.22 25)" }} />
                          )}
                        </div>
                        <div>
                          <p className="font-display text-xs font-bold tracking-wide" style={{ color: form.defaultSeriesFormat === sf.value ? "oklch(0.75 0.22 25)" : "oklch(0.80 0.005 0)" }}>
                            {sf.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{sf.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <NeonInput label="MÁX. EQUIPOS" type="number" value={form.maxTeams} onChange={(v) => set("maxTeams")(parseInt(v) || 2)} min={2} max={256} />
                <NeonInput label="MÍN. JUGADORES" type="number" value={form.minPlayersPerTeam} onChange={(v) => set("minPlayersPerTeam")(parseInt(v) || 1)} min={1} max={20} />
                <NeonInput label="MÁX. JUGADORES" type="number" value={form.maxPlayersPerTeam} onChange={(v) => set("maxPlayersPerTeam")(parseInt(v) || 1)} min={1} max={20} />
              </div>
              {/* Región */}
              <div>
                <label className="block text-xs font-display tracking-wider text-muted-foreground mb-2">REGIÓN DEL TORNEO</label>
                <Select value={form.region} onValueChange={set("region")}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar región" /></SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* Riot Account required */}
              <div className="rounded-xl p-4" style={{ background: "var(--bg-main)", border: "1px solid oklch(0.22 0.01 0)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={14} style={{ color: "oklch(0.65 0.18 220)" }} />
                  <span className="font-display text-xs font-bold tracking-wider" style={{ color: "oklch(0.65 0.18 220)" }}>REQUISITOS DE CUENTA</span>
                </div>
                <Toggle
                  label="Requiere cuenta Riot vinculada"
                  description="Los participantes deben tener su cuenta de Riot Games vinculada en su perfil"
                  value={form.requireRiotAccount}
                  onChange={set("requireRiotAccount")}
                />
              </div>
            </div>
          )}

          {/* Step 3: Dates & Check-in */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold tracking-wider text-foreground mb-1">FECHAS Y CHECK-IN</h2>
                <p className="text-muted-foreground text-sm">Define el calendario del torneo</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NeonInput label="INICIO DE INSCRIPCIONES" type="datetime-local" value={form.registrationStart} onChange={set("registrationStart")} />
                <NeonInput label="CIERRE DE INSCRIPCIONES" type="datetime-local" value={form.registrationEnd} onChange={set("registrationEnd")} />
                <NeonInput label="FECHA DE INICIO" type="datetime-local" value={form.startDate} onChange={set("startDate")} />
                <NeonInput label="FECHA DE FIN" type="datetime-local" value={form.endDate} onChange={set("endDate")} />
              </div>
              {/* Check-in window */}
              <div className="rounded-xl p-4" style={{ background: "var(--bg-main)", border: "1px solid oklch(0.22 0.01 0)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={14} style={{ color: "oklch(0.65 0.18 145)" }} />
                  <span className="font-display text-xs font-bold tracking-wider" style={{ color: "oklch(0.65 0.18 145)" }}>VENTANA DE CHECK-IN</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Período en el que los equipos deben confirmar su asistencia antes del inicio del torneo</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <NeonInput label="INICIO DEL CHECK-IN" type="datetime-local" value={form.checkInStart} onChange={set("checkInStart")} />
                  <NeonInput label="FIN DEL CHECK-IN" type="datetime-local" value={form.checkInEnd} onChange={set("checkInEnd")} />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Prizes & Contact */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold tracking-wider text-foreground mb-1">PREMIOS Y CONTACTO</h2>
                <p className="text-muted-foreground text-sm">Define los premios y la información de contacto</p>
              </div>
              {/* Prizes */}
              <div className="rounded-xl p-4" style={{ background: "var(--bg-main)", border: "1px solid oklch(0.22 0.01 0)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Medal size={14} style={{ color: "oklch(0.65 0.18 80)" }} />
                  <span className="font-display text-xs font-bold tracking-wider" style={{ color: "oklch(0.65 0.18 80)" }}>PREMIOS POR PUESTO</span>
                </div>
                <div className="space-y-3">
                  <NeonInput label="🥇 1ER LUGAR" value={form.prizeFirst} onChange={set("prizeFirst")} placeholder="Ej: $500 USD, Periféricos gaming..." />
                  <NeonInput label="🥈 2DO LUGAR" value={form.prizeSecond} onChange={set("prizeSecond")} placeholder="Ej: $250 USD, Tarjeta de regalo..." />
                  <NeonInput label="🥉 3ER LUGAR" value={form.prizeThird} onChange={set("prizeThird")} placeholder="Ej: $100 USD, Skin exclusiva..." />
                  <NeonTextarea label="DESCRIPCIÓN GENERAL DEL PREMIO" value={form.prizeDescription} onChange={set("prizeDescription")} placeholder="Información adicional sobre los premios y su entrega..." rows={2} />
                </div>
              </div>
              {/* Contact */}
              <div className="rounded-xl p-4" style={{ background: "var(--bg-main)", border: "1px solid oklch(0.22 0.01 0)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-display text-xs font-bold tracking-wider text-muted-foreground">INFORMACIÓN DE CONTACTO</span>
                </div>
                <div className="space-y-3">
                  <NeonInput label="NOMBRE DEL ORGANIZADOR" value={form.contactName} onChange={set("contactName")} placeholder="Nombre o alias" />
                  <NeonInput label="DISCORD DEL ORGANIZADOR" value={form.contactDiscord} onChange={set("contactDiscord")} placeholder="usuario#0000 o @usuario" />
                  <NeonInput label="SERVIDOR DE DISCORD" value={form.contactDiscordServer} onChange={set("contactDiscordServer")} placeholder="https://discord.gg/..." />
                </div>
              </div>
              {/* Summary */}
              <div className="rounded-xl p-4" style={{ background: "oklch(0.55 0.22 25 / 0.05)", border: "1px solid oklch(0.55 0.22 25 / 0.2)" }}>
                <h4 className="font-display text-xs font-bold tracking-wider mb-3" style={{ color: "oklch(0.65 0.22 25)" }}>RESUMEN</h4>
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
                    <span className="text-foreground">{BRACKET_TYPES.find((b) => b.value === form.bracketType)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Serie:</span>
                    <span className="text-foreground">{SERIES_FORMATS.find((s) => s.value === form.defaultSeriesFormat)?.label ?? form.defaultSeriesFormat}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Equipos:</span>
                    <span className="text-foreground">Máx. {form.maxTeams}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Región:</span>
                    <span className="text-foreground">{form.region}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cuenta Riot:</span>
                    <span className="text-foreground">{form.requireRiotAccount ? "Requerida" : "No requerida"}</span>
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
                style={{ background: "transparent", border: "1px solid oklch(0.25 0.01 0)", color: "oklch(0.60 0.005 0)" }}
              >
                <ChevronLeft size={14} /> ATRÁS
              </button>
            )}
            <div className="flex-1" />
            {step < totalSteps ? (
              <button
                onClick={() => {
                  if (step === 1 && !form.name.trim()) { toast.error("El nombre del torneo es requerido"); return; }
                  if (step === 1 && !form.game) { toast.error("El juego es requerido"); return; }
                  setStep((s) => s + 1);
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-display text-xs tracking-widest transition-all duration-300"
                style={{ background: "oklch(0.55 0.22 25)", color: "var(--text-primary)", boxShadow: "0 0 12px oklch(0.55 0.22 25 / 0.4)" }}
              >
                SIGUIENTE <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-display text-xs tracking-widest transition-all duration-300 disabled:opacity-50"
                style={{ background: "oklch(0.55 0.22 25)", color: "var(--text-primary)", boxShadow: "0 0 12px oklch(0.55 0.22 25 / 0.4)" }}
              >
                {updateMutation.isPending ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
                <Trophy size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </PremiumLayout>
  );
}
