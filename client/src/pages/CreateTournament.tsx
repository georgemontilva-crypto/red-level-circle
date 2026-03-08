import { trpc } from "@/lib/trpc";
import PremiumLayout from "@/components/PremiumLayout";
import CustomSelect from "@/components/CustomSelect";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import { Trophy, ChevronRight, ChevronLeft, CheckCircle, Clock, Bell, Lock, Shield, Swords, Map, Users } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { DateTimePicker } from "@/components/DateTimePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Configuración por juego ────────────────────────────────────────────────
const GAMES = [
  "League of Legends", "Valorant", "Honor of Kings", "CS2", "FIFA", "Fortnite",
  "Dota 2", "Rocket League", "Apex Legends", "Overwatch 2", "Call of Duty",
  "Street Fighter 6", "Tekken 8", "Otro",
];

// Mapas disponibles por juego
const GAME_MAPS: Record<string, string[]> = {
  "Valorant": [
    "Ascent", "Bind", "Breeze", "Fracture", "Haven", "Icebox",
    "Lotus", "Pearl", "Split", "Sunset", "Abyss",
  ],
  "League of Legends": ["Summoner's Rift", "ARAM (Howling Abyss)", "TFT"],
  "CS2": [
    "Mirage", "Inferno", "Dust 2", "Nuke", "Overpass", "Ancient",
    "Anubis", "Vertigo", "Train", "Cache",
  ],
  "Overwatch 2": [
    "Blizzard World", "Busan", "Dorado", "Eichenwalde", "Hanamura",
    "Hollywood", "Ilios", "King's Row", "Lijiang Tower", "Nepal",
    "Numbani", "Oasis", "Rialto", "Route 66", "Watchpoint: Gibraltar",
  ],
  "Rocket League": ["DFH Stadium", "Mannfield", "Champions Field", "Urban Central", "Beckwith Park"],
  // Honor of Kings: el mapa se elige en el cliente del juego, no aplica selección de mapa
};

// Modos de juego por juego
const GAME_MODES: Record<string, { value: string; label: string }[]> = {
  "Valorant": [
    { value: "standard", label: "Estándar (Competitivo)" },
    { value: "spike_rush", label: "Spike Rush" },
    { value: "deathmatch", label: "Deathmatch" },
    { value: "team_deathmatch", label: "Team Deathmatch" },
    { value: "swift_play", label: "Swift Play" },
  ],
  "League of Legends": [
    { value: "tournament_draft", label: "Tournament Draft" },
    { value: "blind_pick", label: "Blind Pick" },
    { value: "all_random", label: "All Random" },
    { value: "captains_draft", label: "Captain's Draft" },
  ],
  "CS2": [
    { value: "competitive", label: "Competitivo (MR12)" },
    { value: "competitive_mr15", label: "Competitivo (MR15 - Clásico)" },
    { value: "wingman", label: "Wingman (2v2)" },
  ],
  "Overwatch 2": [
    { value: "competitive", label: "Competitivo" },
    { value: "quick_play", label: "Partida Rápida" },
  ],
  "Rocket League": [
    { value: "3v3", label: "3v3 Estándar" },
    { value: "2v2", label: "2v2 Dobles" },
    { value: "1v1", label: "1v1 Duelo" },
  ],
  "Honor of Kings": [
    { value: "tournament_5v5", label: "Modo Torneo 5v5 (Clásico)" },
    { value: "ranked_5v5", label: "Clasificatoria 5v5" },
    { value: "brawl_3v3", label: "Brawl 3v3" },
    { value: "duel_1v1", label: "Duelo 1v1" },
  ],
};

// Servidores/regiones por juego
const GAME_SERVERS: Record<string, { value: string; label: string }[]> = {
  "Valorant": [
    { value: "latam", label: "LATAM (Latinoamérica)" },
    { value: "latam_norte", label: "LATAM Norte" },
    { value: "latam_sur", label: "LATAM Sur" },
    { value: "br", label: "Brasil" },
    { value: "na", label: "North America" },
    { value: "eu", label: "Europe" },
  ],
  "League of Legends": [
    { value: "lan", label: "LAN (Latinoamérica Norte)" },
    { value: "las", label: "LAS (Latinoamérica Sur)" },
    { value: "br", label: "Brasil" },
    { value: "na", label: "North America" },
    { value: "euw", label: "Europe West" },
    { value: "eune", label: "Europe Nordic & East" },
  ],
  "CS2": [
    { value: "sa", label: "South America" },
    { value: "na", label: "North America" },
    { value: "eu", label: "Europe" },
  ],
  "Honor of Kings": [
    { value: "latam", label: "LATAM" },
    { value: "latam_norte", label: "LATAM Norte" },
    { value: "latam_sur", label: "LATAM Sur" },
    { value: "br", label: "Brasil" },
    { value: "sea", label: "Southeast Asia" },
    { value: "global", label: "Global" },
  ],
};

// Tamaño de equipo por defecto por juego
const GAME_TEAM_SIZE: Record<string, { min: number; max: number; label: string }> = {
  "Valorant": { min: 5, max: 7, label: "5 jugadores + 2 suplentes" },
  "League of Legends": { min: 5, max: 7, label: "5 jugadores + 2 suplentes" },
  "CS2": { min: 5, max: 7, label: "5 jugadores + 2 suplentes" },
  "Overwatch 2": { min: 5, max: 7, label: "5 jugadores + 2 suplentes" },
  "Rocket League": { min: 3, max: 4, label: "3 jugadores + 1 suplente" },
  "FIFA": { min: 1, max: 1, label: "1 jugador" },
  "Street Fighter 6": { min: 1, max: 1, label: "1 jugador" },
  "Tekken 8": { min: 1, max: 1, label: "1 jugador" },
  "Fortnite": { min: 1, max: 4, label: "1–4 jugadores" },
  "Apex Legends": { min: 3, max: 3, label: "3 jugadores" },
  "Honor of Kings": { min: 5, max: 7, label: "5 jugadores + 2 suplentes" },
};

// ¿El juego usa cuenta Riot? (para mostrar el toggle automáticamente)
const RIOT_GAMES = new Set(["League of Legends", "Valorant", "Teamfight Tactics"]);

// ─── Bracket types ───────────────────────────────────────────────────────────
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
  {
    value: "swiss",
    label: "Sistema Suizo",
    desc: "Empareja equipos con el mismo récord. Ideal para muchos participantes.",
  },
  {
    value: "round_robin",
    label: "Round Robin",
    desc: "Todos contra todos. Gana el de mejor récord al final.",
  },
];

const SERIES_FORMATS = [
  { value: "BO1", label: "BO1 — Partido Único", desc: "Un solo mapa decide el ganador. Ideal para fases de grupos." },
  { value: "BO2", label: "BO2 — Al Mejor de 2", desc: "Máximo 2 mapas. Puede terminar en empate (1-1)." },
  { value: "BO3", label: "BO3 — Al Mejor de 3", desc: "Primero en ganar 2 mapas avanza. El más común en torneos." },
  { value: "BO5", label: "BO5 — Al Mejor de 5", desc: "Primero en ganar 3 mapas. Para semifinales y finales." },
  { value: "BO7", label: "BO7 — Al Mejor de 7", desc: "Primero en ganar 4 mapas. Para grandes finales épicas." },
];

// ─── FormData ────────────────────────────────────────────────────────────────
interface FormData {
  name: string;
  game: string;
  customGame: string;
  description: string;
  rules: string;
  bracketType: "single_elimination" | "double_elimination" | "groups" | "swiss" | "round_robin";
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
  isPublic: boolean;
  banner: string;
  // Campos de configuración del juego
  region: string;
  gameMap: string;
  gameMode: string;
  draftType: string;
  checkInStart: string;
  checkInEnd: string;
  contactName: string;
  contactDiscord: string;
  contactDiscordServer: string;
  requireRiotAccount: boolean;
  maxFreeAgents: number;
}

const defaultForm: FormData = {
  name: "",
  game: "",
  customGame: "",
  description: "",
  rules: "",
  bracketType: "single_elimination",
  defaultSeriesFormat: "BO3",
  maxTeams: 16,
  minPlayersPerTeam: 1,
  maxPlayersPerTeam: 5,
  prizeDescription: "",
  prizeAmount: 0,
  prizeFirst: "",
  prizeSecond: "",
  prizeThird: "",
  registrationStart: "",
  registrationEnd: "",
  startDate: "",
  endDate: "",
  isPublic: true,
  banner: "",
  region: "",
  gameMap: "",
  gameMode: "",
  draftType: "tournament_draft",
  checkInStart: "",
  checkInEnd: "",
  contactName: "",
  contactDiscord: "",
  contactDiscordServer: "",
  requireRiotAccount: false,
  maxFreeAgents: 0,
};

// ─── Componentes UI ──────────────────────────────────────────────────────────
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
          background: "var(--bg-main)",
          border: "1px solid oklch(0.22 0.01 0)",
          color: "var(--text-primary)",
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

function NeonSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <CustomSelect
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      size="md"
    />
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
          background: "var(--bg-main)",
          border: "1px solid oklch(0.22 0.01 0)",
          color: "var(--text-primary)",
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

// ─── Sección de configuración específica por juego ───────────────────────────
function GameSpecificConfig({
  game,
  form,
  set,
}: {
  game: string;
  form: FormData;
  set: (key: keyof FormData) => (v: string | number | boolean) => void;
}) {
  const maps = GAME_MAPS[game];
  const modes = GAME_MODES[game];
  const servers = GAME_SERVERS[game];
  const isRiotGame = RIOT_GAMES.has(game);

  if (!maps && !modes && !servers && !isRiotGame) return null;

  const isValorant = game === "Valorant";
  const isLoL = game === "League of Legends";
  const isCS2 = game === "CS2";
  const isHoK = game === "Honor of Kings";

  return (
    <div
      className="rounded-xl p-4 space-y-4"
      style={{ background: "oklch(0.55 0.22 25 / 0.04)", border: "1px solid oklch(0.55 0.22 25 / 0.2)" }}
    >
      {/* Header con icono del juego */}
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "oklch(0.55 0.22 25 / 0.15)", border: "1px solid oklch(0.55 0.22 25 / 0.3)" }}
        >
          {isValorant ? <Shield size={14} style={{ color: "oklch(0.70 0.22 25)" }} /> :
           isLoL ? <Swords size={14} style={{ color: "oklch(0.70 0.22 25)" }} /> :
           isCS2 ? <Swords size={14} style={{ color: "oklch(0.70 0.22 25)" }} /> :
           isHoK ? <Swords size={14} style={{ color: "oklch(0.70 0.22 25)" }} /> :
           <Trophy size={14} style={{ color: "oklch(0.70 0.22 25)" }} />}
        </div>
        <span className="font-display text-xs font-bold tracking-widest" style={{ color: "oklch(0.70 0.22 25)" }}>
          CONFIGURACIÓN DE {game.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Servidor / Región */}
        {servers && (
          <NeonSelect
            label="SERVIDOR / REGIÓN"
            value={form.region}
            onChange={(v) => set("region")(v)}
            options={servers}
            placeholder="Selecciona servidor"
          />
        )}

        {/* Modo de juego — Valorant, Rocket League, Overwatch 2, Honor of Kings */}
        {modes && (isValorant || isHoK || game === "Rocket League" || game === "Overwatch 2") && (
          <NeonSelect
            label="MODO DE JUEGO"
            value={form.gameMode}
            onChange={(v) => set("gameMode")(v)}
            options={modes}
            placeholder="Selecciona modo"
          />
        )}

        {/* Draft type (solo LoL) */}
        {isLoL && modes && (
          <NeonSelect
            label="TIPO DE DRAFT"
            value={form.draftType}
            onChange={(v) => set("draftType")(v)}
            options={modes}
            placeholder="Selecciona draft"
          />
        )}

        {/* Formato de partida CS2 */}
        {isCS2 && modes && (
          <NeonSelect
            label="FORMATO DE PARTIDA"
            value={form.gameMode}
            onChange={(v) => set("gameMode")(v)}
            options={modes}
            placeholder="Selecciona formato"
          />
        )}
      </div>

      {/* Selección de mapas (multi-select visual para Valorant/CS2) */}
      {maps && (isValorant || isCS2) && (
        <div>
          <label className="block text-xs font-display tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Map size={11} />
            POOL DE MAPAS
          </label>
          <p className="text-xs text-zinc-500 mb-3">
            {isValorant
              ? "Selecciona el mapa por defecto o déjalo en 'Todos' para que se vote en cada match."
              : "Selecciona el mapa por defecto para el torneo."}
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => set("gameMap")("")}
              className="px-3 py-2 rounded-lg text-xs font-display tracking-wide transition-all duration-150"
              style={
                form.gameMap === ""
                  ? { background: "oklch(0.55 0.22 25 / 0.20)", border: "1px solid oklch(0.55 0.22 25 / 0.6)", color: "oklch(0.80 0.22 25)" }
                  : { background: "var(--bg-main)", border: "1px solid oklch(0.22 0.01 0)", color: "var(--text-muted)" }
              }
            >
              Todos
            </button>
            {maps.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => set("gameMap")(m)}
                className="px-3 py-2 rounded-lg text-xs font-display tracking-wide transition-all duration-150"
                style={
                  form.gameMap === m
                    ? { background: "oklch(0.55 0.22 25 / 0.20)", border: "1px solid oklch(0.55 0.22 25 / 0.6)", color: "oklch(0.80 0.22 25)" }
                    : { background: "var(--bg-main)", border: "1px solid oklch(0.22 0.01 0)", color: "var(--text-muted)" }
                }
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mapa único para LoL */}
      {isLoL && maps && (
        <NeonSelect
          label="MAPA"
          value={form.gameMap}
          onChange={(v) => set("gameMap")(v)}
          options={maps.map((m) => ({ value: m, label: m }))}
          placeholder="Selecciona mapa"
        />
      )}

      {/* Requerir cuenta Riot (LoL y Valorant) */}
      {isRiotGame && (
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => set("requireRiotAccount")(!form.requireRiotAccount)}
            className="relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0"
            style={{
              background: form.requireRiotAccount ? "oklch(0.55 0.22 25)" : "oklch(0.18 0.01 0)",
              boxShadow: form.requireRiotAccount ? "0 0 8px oklch(0.55 0.22 25 / 0.4)" : "none",
            }}
          >
            <div
              className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300"
              style={{ left: form.requireRiotAccount ? "calc(100% - 1.25rem)" : "0.25rem" }}
            />
          </button>
          <div>
            <span className="text-sm text-foreground font-display tracking-wider">
              Requerir cuenta Riot vinculada
            </span>
            <p className="text-xs text-zinc-500 mt-0.5">
              Los participantes deberán tener su cuenta de Riot Games vinculada en RLC para inscribirse.
            </p>
          </div>
        </div>
      )}

      {/* Draft de héroes Honor of Kings */}
      {isHoK && (
        <div>
          <label className="block text-xs font-display tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Swords size={11} />
            SISTEMA DE DRAFT
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "ban_pick", label: "Ban/Pick (Torneo)" },
              { value: "blind_pick", label: "Blind Pick" },
              { value: "all_random", label: "All Random" },
              { value: "captains_mode", label: "Captain's Mode" },
            ].map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => set("draftType")(d.value)}
                className="px-3 py-2 rounded-lg text-xs font-display tracking-wide transition-all duration-150 text-left"
                style={
                  form.draftType === d.value
                    ? { background: "oklch(0.55 0.22 25 / 0.20)", border: "1px solid oklch(0.55 0.22 25 / 0.6)", color: "oklch(0.80 0.22 25)" }
                    : { background: "var(--bg-main)", border: "1px solid oklch(0.22 0.01 0)", color: "var(--text-muted)" }
                }
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info adicional Honor of Kings */}
      {isHoK && (
        <div
          className="rounded-lg p-3 text-xs text-zinc-400 leading-relaxed"
          style={{ background: "oklch(0.14 0.01 0)", border: "1px solid oklch(0.20 0.01 0)" }}
        >
          <p className="font-semibold text-zinc-300 mb-1">ℹ️ Sobre las salas en Honor of Kings</p>
          <p>
            Las salas personalizadas en Honor of Kings se crean desde el menú del juego.
            El organizador debe compartir el código de sala en la página del match antes de cada partida.
            El modo <strong>Torneo 5v5</strong> habilita el sistema de ban/pick de héroes.
          </p>
        </div>
      )}

      {/* Info adicional Valorant */}
      {isValorant && (
        <div
          className="rounded-lg p-3 text-xs text-zinc-400 leading-relaxed"
          style={{ background: "oklch(0.14 0.01 0)", border: "1px solid oklch(0.20 0.01 0)" }}
        >
          <p className="font-semibold text-zinc-300 mb-1">ℹ️ Sobre los códigos de sala en Valorant</p>
          <p>
            Los códigos de sala de Valorant se generan manualmente por el organizador en el cliente del juego.
            El organizador debe compartir el código en la página del match antes de cada partida.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function CreateTournament() {
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const canCreate = isAuthenticated && user && (
    (user as any).role === "to" ||
    (user as any).role === "admin" ||
    (user as any).role === "super_admin" ||
    !!(user as any).canCreateTournaments
  );
  const [form, setForm] = useState<FormData>(defaultForm);
  const [step, setStep] = useState(1);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [createdName, setCreatedName] = useState("");
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

  // Al cambiar el juego, pre-rellenar valores por defecto del juego
  const handleGameChange = (game: string) => {
    const teamSize = GAME_TEAM_SIZE[game];
    const isRiot = RIOT_GAMES.has(game);
    setForm((prev) => ({
      ...prev,
      game,
      gameMap: "",
      gameMode: "",
      region: "",
      draftType: game === "League of Legends" ? "tournament_draft" : game === "Honor of Kings" ? "ban_pick" : prev.draftType,
      requireRiotAccount: isRiot ? true : false,
      minPlayersPerTeam: teamSize ? teamSize.min : 1,
      maxPlayersPerTeam: teamSize ? teamSize.max : 5,
    }));
  };

  const utils = trpc.useUtils();
  const createMutation = trpc.tournaments.create.useMutation({
    onSuccess: (data) => {
      setCreatedId(data.id);
      setCreatedName(form.name);
      utils.tournaments.list.invalidate();
      utils.tournaments.myTournaments.invalidate();
      utils.home.featuredTournaments.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    const finalGame = form.game === "Otro" ? form.customGame : form.game;
    if (!form.name.trim()) { toast.error("El nombre del torneo es requerido"); return; }
    if (!finalGame.trim()) { toast.error("El juego es requerido"); return; }

    // Construir gameMap: si hay gameMode también, combinarlo
    const gameMapValue = form.gameMap || undefined;
    const gameModeValue = form.gameMode || undefined;

    createMutation.mutate({
      name: form.name,
      game: finalGame,
      description: form.description || undefined,
      rules: form.rules || undefined,
      bracketType: form.bracketType as "single_elimination" | "double_elimination" | "groups",
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
      isPublic: form.isPublic,
      banner: form.banner || undefined,
      region: form.region || undefined,
      gameMap: gameMapValue,
      draftType: form.draftType || gameModeValue || undefined,
      checkInStart: form.checkInStart ? new Date(form.checkInStart).getTime() : undefined,
      checkInEnd: form.checkInEnd ? new Date(form.checkInEnd).getTime() : undefined,
      contactInfo: (form.contactName || form.contactDiscord || form.contactDiscordServer)
        ? JSON.stringify({
            name: form.contactName || undefined,
            discord: form.contactDiscord || undefined,
            discordServer: form.contactDiscordServer || undefined,
          })
        : undefined,
      requireRiotAccount: form.requireRiotAccount || undefined,
      maxFreeAgents: form.maxFreeAgents > 0 ? form.maxFreeAgents : undefined,
    });
  };

  // ── Guard: solo usuarios autenticados ──────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <PremiumLayout title="CREAR TORNEO">
        <div className="max-w-lg mx-auto">
          <div className="rounded-2xl p-8 sm:p-10 text-center" style={{ background: "#16191f", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(220,38,38,0.10)", border: "1px solid rgba(220,38,38,0.25)" }}>
              <Lock size={28} className="text-red-500" />
            </div>
            <h2 className="font-orbitron font-bold text-xl text-white mb-2">Acceso restringido</h2>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">Debes iniciar sesión para crear torneos en la plataforma.</p>
            <a href={getLoginUrl()}>
              <button className="px-6 py-3 rounded-xl font-orbitron font-bold text-sm text-white" style={{ background: "oklch(0.50 0.22 25)" }}>INICIAR SESIÓN</button>
            </a>
          </div>
        </div>
      </PremiumLayout>
    );
  }

  // ── Guard: solo TOs, admins y usuarios con permiso especial pueden crear torneos ──
  if (isAuthenticated && !canCreate) {
    return (
      <PremiumLayout title="CREAR TORNEO">
        <div className="max-w-lg mx-auto">
          <div className="rounded-2xl p-8 sm:p-10 text-center" style={{ background: "#16191f", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(220,38,38,0.10)", border: "1px solid rgba(220,38,38,0.25)" }}>
              <Shield size={28} className="text-red-500" />
            </div>
            <h2 className="font-orbitron font-bold text-xl text-white mb-2">Permiso insuficiente</h2>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              Solo los <strong className="text-white">Organizadores de Torneos (TO)</strong> pueden crear torneos en RLC.
              Completa el formulario de solicitud y el equipo lo revisará pronto.
            </p>
            <a href="/apply/role?role=to">
              <button className="px-6 py-3 rounded-xl font-orbitron font-bold text-sm text-white" style={{ background: "oklch(0.50 0.22 25)" }}>SOLICITAR ROL TO</button>
            </a>
          </div>
        </div>
      </PremiumLayout>
    );
  }

  // ── Success modal ──────────────────────────────────────────────────────────
  if (createdId !== null) {
    return (
      <PremiumLayout title="TORNEO ENVIADO">
        <div className="max-w-lg mx-auto">
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: "#16191f", border: "1px solid oklch(0.55 0.22 25 / 0.3)" }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: "oklch(0.55 0.22 25 / 0.12)", border: "2px solid oklch(0.55 0.22 25 / 0.5)" }}
            >
              <CheckCircle size={40} style={{ color: "oklch(0.65 0.22 25)" }} />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-widest mb-2" style={{ color: "var(--text-primary)" }}>
              ¡TORNEO ENVIADO!
            </h2>
            <p className="font-display font-bold tracking-wide text-lg mb-6" style={{ color: "oklch(0.65 0.22 25)" }}>
              {createdName}
            </p>
            <div className="space-y-3 mb-8 text-left">
              <div className="flex items-start gap-4 rounded-xl p-4" style={{ background: "oklch(0.55 0.22 25 / 0.08)", border: "1px solid oklch(0.55 0.22 25 / 0.2)" }}>
                <Clock size={20} className="mt-0.5 shrink-0" style={{ color: "oklch(0.65 0.18 80)" }} />
                <div>
                  <p className="font-display text-sm font-bold tracking-wider" style={{ color: "var(--text-primary)" }}>EN REVISIÓN</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Tu torneo está siendo revisado por el equipo de RLC.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-xl p-4" style={{ background: "oklch(0.14 0.01 0)", border: "1px solid oklch(0.22 0.01 0)" }}>
                <Bell size={20} className="mt-0.5 shrink-0" style={{ color: "oklch(0.55 0.18 220)" }} />
                <div>
                  <p className="font-display text-sm font-bold tracking-wider" style={{ color: "var(--text-primary)" }}>RECIBIRÁS UNA NOTIFICACIÓN</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Cuando sea aprobado, podrás comenzar a recibir inscripciones.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-xl p-4" style={{ background: "oklch(0.14 0.01 0)", border: "1px solid oklch(0.22 0.01 0)" }}>
                <Trophy size={20} className="mt-0.5 shrink-0" style={{ color: "oklch(0.65 0.18 80)" }} />
                <div>
                  <p className="font-display text-sm font-bold tracking-wider" style={{ color: "var(--text-primary)" }}>GESTIONA TU TORNEO</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Puedes ver el estado en "Mis Torneos" en cualquier momento.</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/dashboard/my-tournaments")}
                className="flex-1 py-3 rounded-xl font-display text-xs tracking-widest transition-all duration-200"
                style={{ background: "oklch(0.55 0.22 25)", color: "#fff", boxShadow: "0 0 12px oklch(0.55 0.22 25 / 0.4)" }}
              >
                VER MIS TORNEOS
              </button>
              <button
                onClick={() => navigate(`/dashboard/tournament/${createdId}`)}
                className="flex-1 py-3 rounded-xl font-display text-xs tracking-widest transition-all duration-200"
                style={{ background: "var(--bg-card)", border: "1px solid oklch(0.22 0.01 0)", color: "var(--text-muted)" }}
              >
                GESTIONAR TORNEO
              </button>
            </div>
          </div>
        </div>
      </PremiumLayout>
    );
  }

  const finalGame = form.game === "Otro" ? form.customGame : form.game;
  const teamSizeInfo = GAME_TEAM_SIZE[form.game];

  return (
    <PremiumLayout title="CREAR TORNEO">
      <div className="max-w-2xl mx-auto overflow-x-hidden">

        {/* Disclaimer screen */}
        {!showForm && (
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center flex-shrink-0">
                <Trophy size={18} className="text-red-400" />
              </div>
              <div>
                <h2 className="font-orbitron font-bold text-lg text-white tracking-wider">Antes de continuar</h2>
                <p className="text-zinc-400 text-xs mt-0.5">Lee y acepta los términos para organizar torneos en RLC</p>
              </div>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-5 mb-6 space-y-3 text-sm text-zinc-300 leading-relaxed">
              <p className="font-semibold text-red-400 uppercase tracking-wider text-xs">Acuerdo de responsabilidad del organizador</p>
              <p>Al crear un torneo en <span className="font-semibold text-white">Red Level Circle</span>, asumes la responsabilidad total como organizador. Esto incluye:</p>
              <ul className="space-y-2 pl-4 list-disc text-zinc-400">
                <li>Garantizar que el torneo se lleve a cabo en las fechas y condiciones publicadas.</li>
                <li><span className="text-white font-medium">Entregar los premios prometidos</span> a los ganadores en tiempo y forma.</li>
                <li>Cumplir con las <span className="text-white font-medium">normas comunitarias de RLC</span> en todo momento.</li>
                <li>No publicar torneos con información falsa, engañosa o con intención de estafar.</li>
              </ul>
              <div className="border-t border-red-500/20 pt-3 mt-3">
                <p className="text-red-300 font-semibold">
                  El incumplimiento resultará en la <span className="text-red-400 underline">suspensión temporal o eliminación permanente</span> de tu cuenta.
                </p>
              </div>
            </div>
            <label className="flex items-start gap-3 cursor-pointer group mb-6">
              <div
                onClick={() => setDisclaimerAccepted(!disclaimerAccepted)}
                className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${
                  disclaimerAccepted ? 'bg-red-600 border-red-600' : 'bg-zinc-800 border-zinc-600 group-hover:border-zinc-400'
                }`}
              >
                {disclaimerAccepted && (
                  <svg viewBox="0 0 12 10" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="1,5 4,8 11,1" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-zinc-300 leading-relaxed">
                He leído y acepto los términos anteriores. Entiendo que el incumplimiento puede resultar en la suspensión o eliminación permanente de mi cuenta.
              </span>
            </label>
            <button
              onClick={() => { if (disclaimerAccepted) setShowForm(true); }}
              disabled={!disclaimerAccepted}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Continuar con la creación del torneo
            </button>
          </div>
        )}

        {/* Form */}
        {showForm && (<>
        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3 flex-1">
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
                {s === 1 ? "INFO BÁSICA" : s === 2 ? "CONFIGURACIÓN" : "FECHAS Y PREMIO"}
              </span>
              {s < totalSteps && (
                <div
                  className="flex-1 h-px"
                  style={{ background: step > s ? "oklch(0.55 0.22 25 / 0.5)" : "oklch(0.18 0.01 0)" }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid oklch(0.18 0.01 0)" }}>

          {/* ── Step 1: Basic info ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold tracking-wider text-foreground mb-1">INFORMACIÓN BÁSICA</h2>
                <p className="text-muted-foreground text-sm">Configura los datos principales del torneo</p>
              </div>

              <NeonInput
                label="NOMBRE DEL TORNEO"
                value={form.name}
                onChange={set("name")}
                placeholder="Ej: Red Level Championship 2026"
                required
              />

              {/* Selector de juego */}
              <div>
                <label className="block text-xs font-orbitron tracking-widest text-muted-foreground mb-3">
                  JUEGO <span className="text-red-500">*</span>
                </label>
                <Select value={form.game} onValueChange={handleGameChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un juego" />
                  </SelectTrigger>
                  <SelectContent side="bottom" avoidCollisions={false} className="z-[9999]">
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

              {/* Tamaño de equipo sugerido */}
              {teamSizeInfo && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                  style={{ background: "oklch(0.55 0.22 25 / 0.06)", border: "1px solid oklch(0.55 0.22 25 / 0.15)" }}
                >
                  <Users size={13} style={{ color: "oklch(0.65 0.22 25)" }} />
                  <span style={{ color: "oklch(0.70 0.005 0)" }}>
                    Tamaño de equipo recomendado para <strong>{form.game}</strong>: {teamSizeInfo.label}
                  </span>
                </div>
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
                <label className="block text-xs font-display tracking-wider text-muted-foreground mb-2">BANNER DEL TORNEO</label>
                <div
                  className="relative w-full h-32 rounded-xl overflow-hidden cursor-pointer group"
                  style={{ border: "2px dashed oklch(0.30 0.01 0)", background: "var(--bg-main)" }}
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
                <input id="tournament-banner-input" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleBannerUpload} />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => set("isPublic")(!form.isPublic)}
                  className="relative w-12 h-6 rounded-full transition-all duration-300"
                  style={{ background: form.isPublic ? "oklch(0.55 0.22 25)" : "oklch(0.18 0.01 0)", boxShadow: form.isPublic ? "0 0 8px oklch(0.55 0.22 25 / 0.4)" : "none" }}
                >
                  <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300" style={{ left: form.isPublic ? "calc(100% - 1.25rem)" : "0.25rem" }} />
                </button>
                <span className="text-sm text-foreground font-display tracking-wider">Torneo público</span>
                <span className="text-xs text-muted-foreground">{form.isPublic ? "Visible para todos" : "Solo por invitación"}</span>
              </div>
            </div>
          )}

          {/* ── Step 2: Configuration ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold tracking-wider text-foreground mb-1">CONFIGURACIÓN</h2>
                <p className="text-muted-foreground text-sm">Define el formato, el juego y los requisitos</p>
              </div>

              {/* Configuración específica del juego — aparece primero si hay opciones */}
              {form.game && form.game !== "Otro" && (
                <GameSpecificConfig game={form.game} form={form} set={set} />
              )}

              {/* Estructura del torneo */}
              <div>
                <label className="block text-xs font-display tracking-wider text-muted-foreground mb-3">
                  ESTRUCTURA DEL TORNEO <span style={{ color: "oklch(0.65 0.22 25)" }}>*</span>
                </label>
                <div className="space-y-3">
                  {BRACKET_TYPES.map((bt) => (
                    <button
                      key={bt.value}
                      type="button"
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
                          className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                          style={{ borderColor: form.bracketType === bt.value ? "oklch(0.55 0.22 25)" : "oklch(0.35 0.005 0)" }}
                        >
                          {form.bracketType === bt.value && (
                            <div className="w-2 h-2 rounded-full" style={{ background: "oklch(0.55 0.22 25)" }} />
                          )}
                        </div>
                        <div>
                          <p className="font-display text-sm font-bold tracking-wide" style={{ color: form.bracketType === bt.value ? "oklch(0.75 0.22 25)" : "oklch(0.80 0.005 0)" }}>
                            {bt.label}
                          </p>
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
                  PARTIDAS POR ENFRENTAMIENTO (BO) <span style={{ color: "oklch(0.65 0.22 25)" }}>*</span>
                </label>
                <p className="text-xs text-zinc-500 mb-3">Cuántas partidas se juegan en cada cruce. Gana quien primero alcance el número de victorias requerido.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SERIES_FORMATS.map((sf) => (
                    <button
                      key={sf.value}
                      type="button"
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

              {/* Tamaño de equipos */}
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
                  label="MÍN. JUGADORES POR EQUIPO"
                  type="number"
                  value={form.minPlayersPerTeam}
                  onChange={(v) => set("minPlayersPerTeam")(parseInt(v) || 1)}
                  min={1}
                  max={20}
                />
                <NeonInput
                  label="MÁX. JUGADORES POR EQUIPO"
                  type="number"
                  value={form.maxPlayersPerTeam}
                  onChange={(v) => set("maxPlayersPerTeam")(parseInt(v) || 5)}
                  min={1}
                  max={20}
                />
              </div>
              {teamSizeInfo && (
                <p className="text-xs text-zinc-500 -mt-2">
                  Recomendado para {form.game}: {teamSizeInfo.label}
                </p>
              )}

              {/* Región genérica (para juegos sin servidores específicos) */}
              {!GAME_SERVERS[form.game] && (
                <NeonSelect
                  label="REGIÓN"
                  value={form.region}
                  onChange={(v) => set("region")(v)}
                  options={[
                    { value: "Latinoamérica Norte", label: "Latinoamérica Norte" },
                    { value: "Latinoamérica Sur", label: "Latinoamérica Sur" },
                    { value: "North America", label: "North America" },
                    { value: "Europe", label: "Europe" },
                    { value: "Brazil", label: "Brazil" },
                    { value: "Global", label: "Global" },
                  ]}
                  placeholder="Selecciona región"
                />
              )}
            </div>
          )}

          {/* ── Step 3: Dates and prize ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold tracking-wider text-foreground mb-1">FECHAS Y PREMIO</h2>
                <p className="text-muted-foreground text-sm">Define el calendario y los premios</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DateTimePicker label="INICIO DE INSCRIPCIONES" value={form.registrationStart} onChange={(e) => set("registrationStart")(e.target.value)} />
                <DateTimePicker label="CIERRE DE INSCRIPCIONES" value={form.registrationEnd} onChange={(e) => set("registrationEnd")(e.target.value)} />
                <DateTimePicker label="FECHA DE INICIO" value={form.startDate} onChange={(e) => set("startDate")(e.target.value)} />
                <DateTimePicker label="FECHA DE FIN" value={form.endDate} onChange={(e) => set("endDate")(e.target.value)} />
              </div>

              {/* Premio */}
              <div className="rounded-xl p-4" style={{ background: "var(--bg-main)", border: "1px solid oklch(0.22 0.01 0)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Trophy size={16} style={{ color: "oklch(0.65 0.18 80)" }} />
                  <span className="font-display text-sm font-bold tracking-wider text-foreground">PREMIO</span>
                </div>
                <div className="space-y-3">
                  <NeonInput
                    label="DESCRIPCIÓN DEL PREMIO"
                    value={form.prizeDescription}
                    onChange={set("prizeDescription")}
                    placeholder="Ej: Periféricos gaming, tarjetas de regalo, efectivo, etc."
                  />
                  <p className="text-xs text-zinc-500">Eres responsable de la entrega del premio a los ganadores.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                    <NeonInput label="🥇 1ER LUGAR" value={form.prizeFirst} onChange={set("prizeFirst")} placeholder="Ej: $100 USD" />
                    <NeonInput label="🥈 2DO LUGAR" value={form.prizeSecond} onChange={set("prizeSecond")} placeholder="Ej: $50 USD" />
                    <NeonInput label="🥉 3ER LUGAR" value={form.prizeThird} onChange={set("prizeThird")} placeholder="Ej: $25 USD" />
                  </div>
                </div>
              </div>

              {/* Check-in */}
              <div className="rounded-xl p-4" style={{ background: "var(--bg-main)", border: "1px solid oklch(0.22 0.01 0)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Bell size={16} style={{ color: "oklch(0.65 0.22 25)" }} />
                  <span className="font-display text-sm font-bold tracking-wider text-foreground">CHECK-IN</span>
                </div>
                <p className="text-xs text-zinc-500 mb-3">Los equipos deben confirmar su asistencia antes del torneo.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DateTimePicker label="INICIO CHECK-IN" value={form.checkInStart} onChange={(e) => set("checkInStart")(e.target.value)} />
                  <DateTimePicker label="FIN CHECK-IN" value={form.checkInEnd} onChange={(e) => set("checkInEnd")(e.target.value)} />
                </div>
              </div>

              {/* Contacto */}
              <div className="rounded-xl p-4" style={{ background: "var(--bg-main)", border: "1px solid oklch(0.22 0.01 0)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <ChevronRight size={16} style={{ color: "oklch(0.65 0.22 25)" }} />
                  <span className="font-display text-sm font-bold tracking-wider text-foreground">CONTACTO</span>
                </div>
                <div className="space-y-3">
                  <NeonInput label="NOMBRE DEL ORGANIZADOR" value={form.contactName} onChange={set("contactName")} placeholder="Ej: Juan Pérez" />
                  <NeonInput label="DISCORD DEL ORGANIZADOR" value={form.contactDiscord} onChange={set("contactDiscord")} placeholder="Ej: @juanperez" />
                  <NeonInput label="SERVIDOR DE DISCORD" value={form.contactDiscordServer} onChange={set("contactDiscordServer")} placeholder="https://discord.gg/..." />
                </div>
              </div>

              {/* Resumen */}
              <div className="rounded-xl p-4" style={{ background: "oklch(0.55 0.22 25 / 0.05)", border: "1px solid oklch(0.55 0.22 25 / 0.2)" }}>
                <h4 className="font-display text-xs font-bold tracking-wider mb-3" style={{ color: "oklch(0.65 0.22 25)" }}>RESUMEN DEL TORNEO</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nombre:</span>
                    <span className="text-foreground font-semibold">{form.name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Juego:</span>
                    <span className="text-foreground">{finalGame || "—"}</span>
                  </div>
                  {form.region && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Servidor:</span>
                      <span className="text-foreground">{form.region}</span>
                    </div>
                  )}
                  {form.gameMap && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mapa:</span>
                      <span className="text-foreground">{form.gameMap}</span>
                    </div>
                  )}
                  {form.gameMode && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Modo:</span>
                      <span className="text-foreground">{GAME_MODES[form.game]?.find(m => m.value === form.gameMode)?.label ?? form.gameMode}</span>
                    </div>
                  )}
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
                  {(form.draftType && form.draftType !== "tournament_draft" || form.game === "Honor of Kings") && form.draftType && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Draft:</span>
                      <span className="text-foreground">
                        {form.game === "League of Legends"
                          ? (GAME_MODES["League of Legends"]?.find(m => m.value === form.draftType)?.label ?? form.draftType)
                          : form.game === "Honor of Kings"
                          ? ([{value:"ban_pick",label:"Ban/Pick (Torneo)"},{value:"blind_pick",label:"Blind Pick"},{value:"all_random",label:"All Random"},{value:"captains_mode",label:"Captain's Mode"}].find(d => d.value === form.draftType)?.label ?? form.draftType)
                          : form.draftType}
                      </span>
                    </div>
                  )}
                  {form.requireRiotAccount && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cuenta Riot:</span>
                      <span className="text-green-400 text-xs">Requerida</span>
                    </div>
                  )}
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
                  if (step === 1 && !form.game) { toast.error("Selecciona un juego"); return; }
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
                disabled={createMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-display text-xs tracking-widest transition-all duration-300 disabled:opacity-50"
                style={{ background: "oklch(0.55 0.22 25)", color: "var(--text-primary)", boxShadow: "0 0 12px oklch(0.55 0.22 25 / 0.4)" }}
              >
                {createMutation.isPending ? "CREANDO..." : "CREAR TORNEO"}
                <Trophy size={14} />
              </button>
            )}
          </div>
        </div>
        </>)}
      </div>
    </PremiumLayout>
  );
}
