import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  Camera, User, Globe, MessageSquare, Save, ChevronLeft, ChevronDown,
  Twitter, Gamepad2, MapPin, Shield, Crown, Swords, Loader2,
  BadgeCheck, Clock, XCircle, Radio, ShoppingBag
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { getRolesForGame, COMPETITIVE_REGIONS } from "../../../shared/gameRoles";

const GAME_SLUG_MAP: Record<string, string> = {
  "League of Legends": "league-of-legends",
  "Valorant": "valorant",
  "CS2": "counter-strike",
  "Dota 2": "dota-2",
  "Fortnite": "fortnite",
  "Apex Legends": "apex-legends",
  "Overwatch 2": "overwatch",
  "Rocket League": "rocket-league",
  "Honor of Kings": "honor-of-kings",
  "Mobile Legends": "mobile-legends",
};

const GAMES = [
  "League of Legends", "Valorant", "CS2", "Dota 2", "Fortnite",
  "Apex Legends", "Overwatch 2", "Rainbow Six Siege", "Rocket League",
  "FIFA", "Call of Duty", "PUBG", "Minecraft", "Hearthstone", "Otro"
];

const COUNTRIES = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica",
  "Cuba", "Ecuador", "El Salvador", "España", "Guatemala", "Honduras",
  "México", "Nicaragua", "Panamá", "Paraguay", "Perú", "Puerto Rico",
  "República Dominicana", "Uruguay", "Venezuela", "Otro"
];

// ── Custom Select ────────────────────────────────────────────────────────────
function CustomSelect({
  value, onChange, options, placeholder = "Seleccionar", disabled = false, className = ""
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm transition-colors ${
          disabled
            ? "opacity-40 cursor-not-allowed bg-card border-border text-muted-foreground"
            : open
            ? "bg-card border-red-500/70 text-white"
            : "bg-card border-border text-white hover:border-zinc-600"
        }`}
        style={{ background: "var(--bg-card)" }}
      >
        <span className={selected ? "text-white" : "text-muted-foreground"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${ open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-lg border border-red-900/40 overflow-hidden"
          style={{ background: "var(--bg-card)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}
        >
          <div className="max-h-56 overflow-y-auto">
            {placeholder && (
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-muted-foreground hover:bg-red-950/30 transition-colors"
              >
                {placeholder}
              </button>
            )}
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  opt.value === value
                    ? "bg-red-900/40 text-red-300"
                    : "text-white hover:bg-red-950/30"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AvatarUpload({ currentUrl, onUpload }: { currentUrl?: string | null; onUpload: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploading, preview, handleFile } = useAvatarUpload({ onSuccess: onUpload });
  const displayUrl = preview || currentUrl;
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative w-24 h-24 cursor-pointer group"
        style={{ borderRadius: "50%" }}
        onClick={() => inputRef.current?.click()}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Avatar"
            className="w-24 h-24 object-cover border-2 border-red-600"
            style={{ borderRadius: "50%" }}
          />
        ) : (
          <div
            className="w-24 h-24 bg-secondary border-2 border-border flex items-center justify-center"
            style={{ borderRadius: "50%" }}
          >
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
        )}
        <div
          className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          style={{ borderRadius: "50%" }}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground font-mono">Haz clic para cambiar · Se recorta a 288×288 px</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}
function BannerUpload({ currentUrl, canUpload = false, onUpload }: { currentUrl?: string | null; canUpload?: boolean; onUpload: (url: string) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.profile.uploadImage.useMutation();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El banner no puede superar 10MB");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        const mimeType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
        const { url } = await uploadMutation.mutateAsync({ base64, mimeType, type: "banner" });
        setPreview(url);
        onUpload(url);
        toast.success("Banner actualizado");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Error al subir el banner");
      setUploading(false);
    }
  };

  const displayUrl = preview || currentUrl;

  return (
    <div className="space-y-2">
      <div
        className={`relative w-full h-32 rounded-xl overflow-hidden border transition-colors ${
          canUpload
            ? "cursor-pointer group border-border hover:border-red-500/50"
            : "border-border/40"
        }`}
        onClick={() => canUpload && inputRef.current?.click()}
      >
        {/* Default gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-950/70 via-zinc-950 to-black" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, #dc2626 0, #dc2626 1px, transparent 0, transparent 50%)",
            backgroundSize: "20px 20px",
          }}
        />
        {displayUrl && (
          <img src={displayUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
        )}
        {canUpload ? (
          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : (
              <div className="text-center">
                <Camera className="w-8 h-8 text-white mx-auto mb-1" />
                <p className="text-sm text-white font-mono">{displayUrl ? "Cambiar banner" : "Subir banner"}</p>
              </div>
            )}
          </div>
        ) : (
          /* No permission: show shop CTA at bottom-right */
          <Link href="/shop">
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono cursor-pointer transition-all hover:scale-105"
              style={{ background: "rgba(0,0,0,0.75)", border: "1px solid oklch(0.55 0.22 25 / 0.5)", color: "oklch(0.75 0.22 25)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Fondos en la tienda</span>
            </div>
          </Link>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>
    </div>
  );
}

function RosterPhotoUpload({ currentUrl }: { currentUrl?: string | null }) {
  const [generatedCardUrl, setGeneratedCardUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: hasApproved, isLoading: checkingTeam } = trpc.profile.hasApprovedTeam.useQuery();

  // Nuevo endpoint que genera la card compuesta automáticamente en servidor
  const uploadMutation = trpc.profile.uploadRosterCard.useMutation({
    onSuccess: ({ url }) => {
      setGeneratedCardUrl(url);
      toast.success("Ficha competitiva generada y guardada");
      setUploading(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setUploading(false);
    },
  });

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Solo se permiten imágenes"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("La imagen no puede superar 10MB"); return; }
    const supportedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/bmp", "image/tiff"];
    if (!supportedTypes.includes(file.type)) { toast.error("Formato no soportado. Usa JPG, PNG o WEBP."); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      const mimeType = file.type as "image/jpeg" | "image/png" | "image/webp";
      await uploadMutation.mutateAsync({ base64, mimeType });
    };
    reader.readAsDataURL(file);
  };

  const displayUrl = generatedCardUrl || currentUrl;
  const canUpload = hasApproved?.canUpload;

  return (
    <div className="space-y-4">
      <h2 className="font-orbitron text-sm tracking-widest text-red-400 flex items-center gap-2">
        <Shield className="w-4 h-4" /> FICHA COMPETITIVA (ROSTER CARD)
      </h2>
      <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
        <p className="text-muted-foreground text-sm">
          Sube tu foto y el sistema generará automáticamente tu ficha competitiva con el diseño oficial.
          No editas colores ni texto — el sistema los aplica por ti.
        </p>
        {checkingTeam ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-mono">
            <Loader2 className="w-4 h-4 animate-spin" /> Verificando membresía...
          </div>
        ) : !canUpload ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary/60 border border-border">
            <Shield className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-mono text-muted-foreground">Función bloqueada</p>
              <p className="text-xs text-muted-foreground mt-0.5">Debes pertenecer a un equipo para generar tu ficha competitiva. Pide a un capitán que te añada a su equipo.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Preview de la card generada */}
            <div className="flex-shrink-0">
              <div
                className="relative cursor-pointer group rounded-xl overflow-hidden border-2 border-border hover:border-red-500 transition-colors shadow-xl"
                style={{ width: 140, aspectRatio: "2/3" }}
                onClick={() => inputRef.current?.click()}
              >
                {displayUrl ? (
                  <img src={displayUrl} alt="Ficha competitiva" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-b from-zinc-800 to-zinc-900 flex flex-col items-center justify-center gap-2">
                    <User className="w-10 h-10 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-mono text-center px-2">Sin ficha</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-white" />
                      <span className="text-xs text-white font-mono">CAMBIAR</span>
                    </>
                  )}
                </div>
              </div>
              {displayUrl && (
                <p className="text-xs text-muted-foreground font-mono text-center mt-2">600 × 900 px</p>
              )}
            </div>
            {/* Instrucciones */}
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm text-white font-bold mb-1">Cómo funciona</p>
                <ul className="space-y-1.5 text-xs text-muted-foreground font-mono">
                  <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">1.</span><span>Sube una foto tuya (cualquier proporción)</span></li>
                  <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">2.</span><span>El sistema recorta a 2:3 y aplica el diseño oficial oscuro</span></li>
                  <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">3.</span><span>Tu nick, rol y logo del equipo se añaden automáticamente</span></li>
                  <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">4.</span><span>La ficha aparece en perfil de equipo, ranking y brackets</span></li>
                </ul>
              </div>
              <div className="pt-1">
                <p className="text-xs text-muted-foreground mb-2">Formatos: JPG, PNG, WEBP · Máx. 10MB</p>
                <button
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-mono text-xs font-bold tracking-widest transition-colors flex items-center gap-2"
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  {uploading ? "GENERANDO FICHA..." : displayUrl ? "ACTUALIZAR FOTO" : "SUBIR FOTO"}
                </button>
              </div>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/bmp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Creator Channels Section ─────────────────────────────────────────────────
function CreatorChannelsSection() {
  const utils = trpc.useUtils();
  const { data: creatorApp, isLoading } = trpc.creators.getMyApplication.useQuery();
  const [channelForm, setChannelForm] = useState({ twitch: "", youtube: "" });
  const [channelInit, setChannelInit] = useState(false);
  const [savingChannels, setSavingChannels] = useState(false);

  if (creatorApp && !channelInit) {
    setChannelForm({
      twitch: creatorApp.twitch ?? "",
      youtube: creatorApp.youtube ?? "",
    });
    setChannelInit(true);
  }

  const updateChannels = trpc.creators.updateChannels.useMutation({
    onSuccess: () => {
      toast.success("Canales actualizados. El sistema detectará tu stream automáticamente.", {
        style: { background: "var(--bg-main)", border: "1px solid #22c55e", color: "var(--text-primary)" },
      });
      utils.creators.getMyApplication.invalidate();
      setSavingChannels(false);
    },
    onError: (err) => { toast.error(err.message); setSavingChannels(false); },
  });

  if (isLoading) return null;
  if (!creatorApp || creatorApp.status !== "approved") return null;

  return (
    <div className="space-y-4">
      <h2 className="font-orbitron text-sm tracking-widest text-purple-400 flex items-center gap-2">
        <Radio className="w-4 h-4" /> CANALES DE STREAMING
      </h2>
      <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-5 space-y-4">
        <p className="text-muted-foreground text-sm">
          Registra tu canal de Twitch o YouTube. El sistema detectará automáticamente cuando estés en vivo
          y mostrará tu stream en la sección{" "}
          <span className="text-red-400 font-bold">EN VIVO</span> sin que tengas que hacer nada.
        </p>
        <div className="space-y-3">
          {/* Twitch */}
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1.5 tracking-widest flex items-center gap-1">
              <span className="text-purple-400">●</span> TWITCH (detección automática)
            </label>
            <div className="flex items-center">
              <span className="bg-secondary border border-r-0 border-purple-500/30 rounded-l-lg px-3 py-2.5 text-muted-foreground text-sm">twitch.tv/</span>
              <input
                type="text"
                value={channelForm.twitch}
                onChange={(e) => setChannelForm((f) => ({ ...f, twitch: e.target.value.replace(/^@/, "").trim() }))}
                placeholder="tu_canal"
                maxLength={128}
                className="flex-1 bg-card border border-purple-500/30 rounded-r-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors placeholder-muted-foreground"
              />
            </div>
            {channelForm.twitch && (
              <p className="mt-1 text-xs text-purple-400 font-mono">
                → El sistema verificará twitch.tv/{channelForm.twitch} cada 2 minutos
              </p>
            )}
          </div>
          {/* YouTube */}
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1.5 tracking-widest">YOUTUBE</label>
            <div className="flex items-center">
              <span className="bg-secondary border border-r-0 border-border rounded-l-lg px-3 py-2.5 text-muted-foreground text-sm">youtube.com/@</span>
              <input
                type="text"
                value={channelForm.youtube}
                onChange={(e) => setChannelForm((f) => ({ ...f, youtube: e.target.value.replace(/^@/, "").trim() }))}
                placeholder="tu_canal"
                maxLength={256}
                className="flex-1 bg-card border border-border rounded-r-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors placeholder-muted-foreground"
              />
            </div>
          </div>
        </div>
        <button
          onClick={() => { setSavingChannels(true); updateChannels.mutate(channelForm); }}
          disabled={savingChannels || updateChannels.isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-orbitron font-bold text-sm tracking-widest transition-all"
          style={{ boxShadow: "0 0 16px rgba(168,85,247,0.3)" }}
        >
          {savingChannels ? <><Loader2 className="w-4 h-4 animate-spin" /> GUARDANDO...</> : <><Save className="w-4 h-4" /> GUARDAR CANALES</>}
        </button>
      </div>
    </div>
  );
}

function VerificationSection() {
  const { data: myRequest, refetch } = trpc.verification.myRequest.useQuery();
  const requestMutation = trpc.verification.request.useMutation({
    onSuccess: () => { toast.success("Solicitud enviada correctamente"); refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const [reason, setReason] = useState("");
  const [showForm, setShowForm] = useState(false);

  const statusInfo = {
    pending: { icon: <Clock className="w-4 h-4 text-yellow-400" />, label: "Pendiente de revisión", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30" },
    approved: { icon: <BadgeCheck className="w-4 h-4 text-blue-400" />, label: "Verificado", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30" },
    rejected: { icon: <XCircle className="w-4 h-4 text-red-400" />, label: "Rechazado", color: "text-red-400", bg: "bg-red-400/10 border-red-400/30" },
  };

  return (
    <div className="space-y-4">
      <h2 className="font-orbitron text-sm tracking-widest text-red-400 flex items-center gap-2">
        <BadgeCheck className="w-4 h-4" /> VERIFICACIÓN DE CUENTA
      </h2>
      <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
        <p className="text-muted-foreground text-sm">
          La verificación confirma que eres un creador, jugador profesional u organización reconocida en la comunidad.
          El badge <BadgeCheck size={14} className="inline text-blue-400" /> aparecerá en tu perfil y en toda la plataforma.
        </p>
        {myRequest ? (
          <div>
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${statusInfo[myRequest.status as keyof typeof statusInfo]?.bg ?? "bg-secondary border-border"}`}>
              {statusInfo[myRequest.status as keyof typeof statusInfo]?.icon}
              <span className={`font-mono font-bold text-sm ${statusInfo[myRequest.status as keyof typeof statusInfo]?.color ?? "text-muted-foreground"}`}>
                {statusInfo[myRequest.status as keyof typeof statusInfo]?.label ?? myRequest.status}
              </span>
            </div>
            {myRequest.adminNote && (
              <p className="mt-3 text-sm text-muted-foreground bg-secondary/50 rounded-lg px-4 py-3 border border-border">
                <span className="text-muted-foreground font-mono text-xs">NOTA DEL ADMIN: </span>{myRequest.adminNote}
              </p>
            )}
            {myRequest.status === "rejected" && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 w-full py-2 rounded-lg border border-border text-muted-foreground hover:text-white hover:border-zinc-500 font-mono text-sm transition-colors"
              >
                Volver a solicitar
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-orbitron font-bold text-sm tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            <BadgeCheck className="w-4 h-4" /> SOLICITAR VERIFICACIÓN
          </button>
        )}
        {showForm && (
          <div className="space-y-3 pt-2 border-t border-border">
            <label className="block text-xs font-mono text-muted-foreground tracking-widest">¿POR QUÉ DEBERÍAS SER VERIFICADO?</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explica brevemente quién eres, tu trayectoria, seguidores, logros..."
              rows={4}
              maxLength={500}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder-muted-foreground resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{reason.length}/500</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2 rounded-lg border border-border text-muted-foreground hover:text-white font-mono text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { requestMutation.mutate({ reason }); setShowForm(false); }}
                disabled={reason.length < 10 || requestMutation.isPending}
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-mono font-bold text-sm transition-colors"
              >
                {requestMutation.isPending ? "Enviando..." : "Enviar solicitud"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  const { isAuthenticated, user } = useAuth();
  const { data: me, refetch } = trpc.auth.me.useQuery();
  const { data: creatorApp } = trpc.creators.getMyApplication.useQuery();
  const isApprovedCreator = creatorApp?.status === "approved";

  const [form, setForm] = useState({
    nickname: "",
    bio: "",
    mainGame: "",
    gameRole: "",
    elo: "",
    competitiveRegion: "",
    gameId: "",
    competitiveScore: 0,
    country: "",
    profileType: "player" as "player" | "team_captain" | "event_creator",
    socialDiscord: "",
    socialTwitch: "",
    socialTwitter: "",
    avatar: "",
    bannerUrl: "",
  });
  const [saving, setSaving] = useState(false);

  // Initialize form from user data — use useEffect to avoid setState-in-render anti-pattern
  useEffect(() => {
    if (!me) return;
    const u = me as {
      nickname?: string; bio?: string; mainGame?: string; gameRole?: string;
      elo?: string; competitiveRegion?: string; gameId?: string; competitiveScore?: number; country?: string;
      profileType?: string; socialDiscord?: string; socialTwitch?: string;
      socialTwitter?: string; avatar?: string; bannerUrl?: string;
    };
    setForm({
      nickname: u.nickname ?? "",
      bio: u.bio ?? "",
      mainGame: u.mainGame ?? "",
      gameRole: u.gameRole ?? "",
      elo: u.elo ?? "",
      competitiveRegion: u.competitiveRegion ?? "",
      gameId: u.gameId ?? "",
      competitiveScore: u.competitiveScore ?? 0,
      country: u.country ?? "",
      profileType: (u.profileType as "player" | "team_captain" | "event_creator") ?? "player",
      socialDiscord: u.socialDiscord ?? "",
      socialTwitch: u.socialTwitch ?? "",
      socialTwitter: u.socialTwitter ?? "",
      avatar: u.avatar ?? "",
      bannerUrl: u.bannerUrl ?? "",
    });
  }, [me]);

  const updateMutation = trpc.profile.updateMine.useMutation({
    onSuccess: () => {
      toast.success("Perfil actualizado correctamente", {
        style: { background: "var(--bg-main)", border: "1px solid #22c55e", color: "var(--text-primary)" },
      });
      refetch();
      setSaving(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setSaving(false);
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500/30 mx-auto mb-4" />
          <p className="font-orbitron text-xl mb-4">Acceso Restringido</p>
          <a href={getLoginUrl()} className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-mono font-bold transition-colors">
            Iniciar Sesión
          </a>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    setSaving(true);
    // Send all fields so the backend always receives the latest values
    updateMutation.mutate({
      nickname: form.nickname || undefined,
      bio: form.bio || undefined,
      mainGame: form.mainGame || undefined,
      gameRole: form.gameRole || undefined,
      elo: form.elo || undefined,
      competitiveRegion: form.competitiveRegion || undefined,
      country: form.country || undefined,
      socialDiscord: form.socialDiscord || undefined,
      socialTwitch: form.socialTwitch || undefined,
      socialTwitter: form.socialTwitter || undefined,
      avatar: form.avatar || undefined,
      bannerUrl: form.bannerUrl || undefined,
      profileType: form.profileType,
      gameId: form.gameId || null,
      competitiveScore: form.competitiveScore || null,
    });
  };

  const profileTypeOptions = [
    { value: "player", label: "Jugador", icon: <Gamepad2 className="w-4 h-4" />, desc: "Participa en torneos como jugador" },
    { value: "team_captain", label: "Capitán de Equipo", icon: <Crown className="w-4 h-4" />, desc: "Lidera y gestiona un equipo" },
    { value: "event_creator", label: "Creador de Eventos", icon: <Swords className="w-4 h-4" />, desc: "Organiza torneos y eventos" },
  ];

  return (
    <div className="min-h-screen bg-background text-white overflow-x-hidden">
      {/* Header */}
      <div className="pt-6 pb-4 border-b border-border/50">
        <div className="flex items-center gap-4">
          <Link href={`/profile/${user?.id}`}>
            <button className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors font-mono text-sm">
              <ChevronLeft className="w-4 h-4" /> Mi Perfil
            </button>
          </Link>
          <div className="w-px h-4 bg-secondary" />
          <h1 className="font-orbitron font-black text-xl tracking-widest text-white">CONFIGURACIÓN</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Banner & Avatar */}
        <div className="space-y-4">
          <h2 className="font-orbitron text-sm tracking-widest text-red-400 flex items-center gap-2">
            <Camera className="w-4 h-4" /> IMÁGENES DE PERFIL
          </h2>
          <BannerUpload
            currentUrl={form.bannerUrl || null}
            canUpload={(me as { canUploadBanner?: boolean; role?: string })?.canUploadBanner === true || (me as { role?: string })?.role === "admin"}
            onUpload={(url) => setForm((f) => ({ ...f, bannerUrl: url }))}
          />
          <div className="flex items-center gap-4">
            <AvatarUpload
              currentUrl={form.avatar || null}
              onUpload={(url) => setForm((f) => ({ ...f, avatar: url }))}
            />
            <div>
              <p className="font-bold text-white">{(me as { name?: string })?.name ?? "Usuario"}</p>
              <p className="text-muted-foreground text-sm font-mono">{form.nickname || "Sin nickname"}</p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="font-orbitron text-sm tracking-widest text-red-400 flex items-center gap-2">
            <User className="w-4 h-4" /> INFORMACIÓN BÁSICA
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5 tracking-widest">NICKNAME</label>
              <input
                type="text"
                value={form.nickname}
                onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
                placeholder="Tu alias en la plataforma"
                maxLength={64}
                className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors placeholder-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5 tracking-widest">BIO</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Cuéntanos sobre ti..."
                maxLength={500}
                rows={3}
                className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors placeholder-muted-foreground resize-none"
              />
              <p className="text-xs text-muted-foreground text-right mt-1">{form.bio.length}/500</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-1.5 tracking-widest">JUEGO PRINCIPAL</label>
                <CustomSelect
                  value={form.mainGame}
                  onChange={(val) => setForm((f) => ({ ...f, mainGame: val, gameRole: "" }))}
                  options={GAMES.map((g) => ({ value: g, label: g }))}
                  placeholder="Seleccionar juego"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-1.5 tracking-widest flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> PAÍS
                </label>
                <CustomSelect
                  value={form.country}
                  onChange={(val) => setForm((f) => ({ ...f, country: val }))}
                  options={COUNTRIES.map((c) => ({ value: c, label: c }))}
                  placeholder="Seleccionar país"
                />
              </div>
            </div>
            {/* Competitive profile fields */}
            <div className="pt-2 border-t border-border/60">
              <h3 className="font-orbitron text-xs tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                <Gamepad2 className="w-3.5 h-3.5" /> PERFIL COMPETITIVO
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1.5 tracking-widest">ROL PRINCIPAL</label>
                  <CustomSelect
                    value={form.gameRole}
                    onChange={(val) => setForm((f) => ({ ...f, gameRole: val }))}
                    options={getRolesForGame(GAME_SLUG_MAP[form.mainGame] ?? null).map((r) => ({ value: r.value, label: r.label }))}
                    placeholder={form.mainGame ? "Seleccionar rol" : "Elige un juego primero"}
                    disabled={!form.mainGame}
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1.5 tracking-widest">ELO / RANGO</label>
                  <input
                    type="text"
                    value={form.elo}
                    onChange={(e) => setForm((f) => ({ ...f, elo: e.target.value }))}
                    placeholder="Ej: Diamond II, Radiant..."
                    maxLength={64}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors placeholder-muted-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1.5 tracking-widest">REGIÓN COMPETITIVA</label>
                  <CustomSelect
                    value={form.competitiveRegion}
                    onChange={(val) => setForm((f) => ({ ...f, competitiveRegion: val }))}
                    options={COMPETITIVE_REGIONS.map((r) => ({ value: r.value, label: r.label }))}
                    placeholder="Seleccionar región"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1.5 tracking-widest">ID EN EL JUEGO</label>
                  <input
                    type="text"
                    value={form.gameId}
                    onChange={(e) => setForm((f) => ({ ...f, gameId: e.target.value }))}
                    placeholder="Ej: SummonerName#EUW"
                    maxLength={128}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors placeholder-muted-foreground"
                  />
                  <p className="text-[10px] text-muted-foreground font-mono mt-1">Tu nombre de usuario en el juego</p>
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1.5 tracking-widest">PUNTAJE COMPETITIVO</label>
                  <input
                    type="number"
                    value={form.competitiveScore || ""}
                    onChange={(e) => setForm((f) => ({ ...f, competitiveScore: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                    min={0}
                    max={99999}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors placeholder-muted-foreground"
                  />
                  <p className="text-[10px] text-muted-foreground font-mono mt-1">Puntos RLC acumulados en torneos</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Type — read-only, assigned by admin */}
        <div className="space-y-4">
          <h2 className="font-orbitron text-sm tracking-widest text-red-400 flex items-center gap-2">
            <Shield className="w-4 h-4" /> TIPO DE PERFIL
          </h2>
          {(() => {
            const current = profileTypeOptions.find((o) => o.value === form.profileType) ?? profileTypeOptions[0];
            return (
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card/60">
                <div className="flex items-center gap-2 text-red-400">
                  {current.icon}
                  <span className="font-mono font-bold text-sm text-white">{current.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{current.desc}</p>
                <span className="ml-auto text-xs font-mono text-muted-foreground/50 select-none">Asignado por administrador</span>
              </div>
            );
          })()}
        </div>

        {/* Social Links — only visible to approved content creators */}
        {isApprovedCreator && (
        <div className="space-y-4">
          <h2 className="font-orbitron text-sm tracking-widest text-red-400 flex items-center gap-2">
            <Globe className="w-4 h-4" /> REDES SOCIALES
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5 tracking-widest flex items-center gap-1">
                <Twitter className="w-3 h-3" /> TWITTER / X
              </label>
              <div className="flex items-center">
                <span className="bg-secondary border border-r-0 border-border rounded-l-lg px-3 py-2.5 text-muted-foreground text-sm">@</span>
                <input
                  type="text"
                  value={form.socialTwitter}
                  onChange={(e) => setForm((f) => ({ ...f, socialTwitter: e.target.value }))}
                  placeholder="usuario"
                  maxLength={128}
                  className="flex-1 bg-card border border-border rounded-r-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors placeholder-muted-foreground"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5 tracking-widest flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> DISCORD
              </label>
              <input
                type="text"
                value={form.socialDiscord}
                onChange={(e) => setForm((f) => ({ ...f, socialDiscord: e.target.value }))}
                placeholder="usuario o servidor"
                maxLength={128}
                className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors placeholder-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5 tracking-widest">TWITCH</label>
              <div className="flex items-center">
                <span className="bg-secondary border border-r-0 border-border rounded-l-lg px-3 py-2.5 text-muted-foreground text-sm">twitch.tv/</span>
                <input
                  type="text"
                  value={form.socialTwitch}
                  onChange={(e) => setForm((f) => ({ ...f, socialTwitch: e.target.value }))}
                  placeholder="canal"
                  maxLength={128}
                  className="flex-1 bg-card border border-border rounded-r-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors placeholder-muted-foreground"
                />
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Roster Photo */}
        <RosterPhotoUpload currentUrl={(me as { rosterPhoto?: string })?.rosterPhoto ?? null} />
        {/* Creator Channels */}
        <CreatorChannelsSection />
        {/* Verification */}
        <VerificationSection />
        {/* Save Button */}
        <div className="pb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-orbitron font-bold tracking-widest transition-all"
            style={{ boxShadow: "0 0 20px rgba(220,38,38,0.3)" }}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                GUARDANDO...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                GUARDAR CAMBIOS
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
