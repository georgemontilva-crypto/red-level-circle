import { trpc } from "@/lib/trpc";
import PremiumLayout from "@/components/PremiumLayout";
import { Users, PlusCircle, UserPlus, Shield, Gamepad2, Camera, Loader2, ExternalLink, Trophy, CheckCircle } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

function TeamImageUpload({
  teamId,
  type,
  currentUrl,
  onUploaded,
}: {
  teamId: number;
  type: "logo" | "banner";
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.teams.uploadImage.useMutation();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Solo imágenes"); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Máximo 8MB"); return; }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        const mimeType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
        const { url } = await uploadMutation.mutateAsync({ teamId, base64, mimeType, type });
        setPreview(url);
        onUploaded(url);
        toast.success(type === "logo" ? "Logo actualizado" : "Banner actualizado");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Error al subir imagen");
      setUploading(false);
    }
  };

  const displayUrl = preview || currentUrl;

  if (type === "logo") {
    return (
      <div
        className="relative w-14 h-14 rounded-xl cursor-pointer group shrink-0"
        onClick={() => inputRef.current?.click()}
      >
        {displayUrl ? (
          <img src={displayUrl} alt="Logo" className="w-14 h-14 rounded-xl object-cover border border-red-600/40" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xl font-black text-red-500">
            {/* placeholder */}
          </div>
        )}
        <div className="absolute inset-0 rounded-xl bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-20 rounded-xl cursor-pointer group overflow-hidden border border-zinc-800 hover:border-red-500/40 transition-colors"
      onClick={() => inputRef.current?.click()}
    >
      {displayUrl ? (
        <img src={displayUrl} alt="Banner" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-zinc-900 via-red-950/10 to-zinc-900 flex items-center justify-center gap-2">
          <Camera className="w-4 h-4 text-zinc-600" />
          <span className="text-xs text-zinc-600 font-mono">Subir banner</span>
        </div>
      )}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : (
          <>
            <Camera className="w-5 h-5 text-white" />
            <span className="text-xs text-white font-mono">Cambiar banner</span>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  );
}

export default function MyTeams() {
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamTag, setTeamTag] = useState("");
  const [teamGame, setTeamGame] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [teamLogos, setTeamLogos] = useState<Record<number, string>>({});
  const [teamBanners, setTeamBanners] = useState<Record<number, string>>({});

  const { data: teams, isLoading, refetch } = trpc.teams.myTeams.useQuery();

  const createMutation = trpc.teams.create.useMutation({
    onSuccess: () => {
      toast.success("¡Equipo creado exitosamente!");
      setShowCreate(false);
      setTeamName(""); setTeamTag(""); setTeamGame(""); setTeamDesc("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <PremiumLayout title="MIS EQUIPOS">
      <div className="max-w-4xl mx-auto space-y-6 overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {teams?.length ?? 0} equipo{(teams?.length ?? 0) !== 1 ? "s" : ""}
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-display text-xs tracking-widest transition-all duration-300"
            style={{ background: "oklch(0.55 0.22 25)", color: "oklch(0.98 0 0)", boxShadow: "0 0 12px oklch(0.55 0.22 25 / 0.4)" }}
          >
            <PlusCircle size={14} /> CREAR EQUIPO
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-xl h-40 animate-pulse" style={{ background: "oklch(0.10 0.005 0)" }} />
            ))}
          </div>
        ) : !teams || teams.length === 0 ? (
          <div className="rounded-2xl p-16 text-center" style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.18 0.01 0)" }}>
            <Users size={48} className="mx-auto mb-4" style={{ color: "oklch(0.25 0.01 0)" }} />
            <h3 className="font-display text-xl font-bold tracking-wider text-foreground mb-2">SIN EQUIPOS</h3>
            <p className="text-muted-foreground text-sm mb-6">Crea tu equipo para participar en torneos</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-8 py-3 rounded-xl font-display text-sm tracking-widest transition-all duration-300"
              style={{ background: "oklch(0.55 0.22 25)", color: "oklch(0.98 0 0)", boxShadow: "0 0 15px oklch(0.55 0.22 25 / 0.4)" }}
            >
              CREAR EQUIPO
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="rounded-xl overflow-hidden"
                style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.18 0.01 0)" }}
              >
                {/* Banner */}
                <TeamImageUpload
                  teamId={team.id}
                  type="banner"
                  currentUrl={teamBanners[team.id] || (team as any).banner}
                  onUploaded={(url) => setTeamBanners(prev => ({ ...prev, [team.id]: url }))}
                />

                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Logo */}
                    <div className="relative -mt-8">
                      <TeamImageUpload
                        teamId={team.id}
                        type="logo"
                        currentUrl={teamLogos[team.id] || (team as any).logo}
                        onUploaded={(url) => setTeamLogos(prev => ({ ...prev, [team.id]: url }))}
                      />
                      {!(teamLogos[team.id] || (team as any).logo) && (
                        <div className="absolute inset-0 w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xl font-black text-red-500 pointer-events-none">
                          {team.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display text-base font-bold tracking-wide text-foreground">{team.name}</h3>
                        {(team as any).tag && (
                          <span className="px-2 py-0.5 rounded text-xs font-mono bg-red-950/40 text-red-400 border border-red-800/30">
                            [{(team as any).tag}]
                          </span>
                        )}
                        {(team as any).isVerified && (
                          <CheckCircle size={14} className="text-blue-400" />
                        )}
                      </div>
                      {team.game && (
                        <div className="flex items-center gap-1 mt-1">
                          <Gamepad2 size={12} style={{ color: "oklch(0.50 0.005 0)" }} />
                          <span className="text-xs text-muted-foreground">{team.game}</span>
                        </div>
                      )}
                      {team.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{team.description}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <Link href={`/team/${team.id}`}>
                        <button
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors"
                          style={{ background: "oklch(0.55 0.22 25 / 0.15)", color: "oklch(0.65 0.22 25)", border: "1px solid oklch(0.55 0.22 25 / 0.3)" }}
                        >
                          <ExternalLink size={11} /> Ver perfil
                        </button>
                      </Link>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-800/50">
                    <div className="flex items-center gap-1.5">
                      <Shield size={12} className="text-red-500" />
                      <span className="text-xs font-display tracking-wider text-red-400">CAPITÁN</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Trophy size={12} className="text-yellow-500/70" />
                      <span className="text-xs text-muted-foreground">{(team as any).wins ?? 0}V / {(team as any).losses ?? 0}D</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <UserPlus size={12} className="text-zinc-500" />
                      <span className="text-xs text-muted-foreground">{(team as any).tournamentsPlayed ?? 0} torneos</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 0.85)" }}
          onClick={() => setShowCreate(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
            style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.55 0.22 25 / 0.3)", boxShadow: "0 0 40px oklch(0.55 0.22 25 / 0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl font-bold tracking-wider text-foreground mb-5">CREAR EQUIPO</h3>

            <div className="space-y-4">
              {[
                { label: "NOMBRE DEL EQUIPO *", value: teamName, setter: setTeamName, placeholder: "Ej: Red Dragons" },
                { label: "TAG DEL EQUIPO", value: teamTag, setter: setTeamTag, placeholder: "Ej: RDG (máx. 8 chars)" },
                { label: "JUEGO PRINCIPAL", value: teamGame, setter: setTeamGame, placeholder: "Ej: Valorant" },
              ].map(({ label, value, setter, placeholder }) => (
                <div key={label}>
                  <label className="block text-xs font-display tracking-wider text-muted-foreground mb-2">{label}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
                    style={{ background: "oklch(0.09 0.005 0)", border: "1px solid oklch(0.22 0.01 0)", color: "oklch(0.90 0.005 0)", outline: "none" }}
                    onFocus={(e) => { e.target.style.borderColor = "oklch(0.55 0.22 25)"; e.target.style.boxShadow = "0 0 8px oklch(0.55 0.22 25 / 0.3)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "oklch(0.22 0.01 0)"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-display tracking-wider text-muted-foreground mb-2">DESCRIPCIÓN</label>
                <textarea
                  value={teamDesc}
                  onChange={(e) => setTeamDesc(e.target.value)}
                  placeholder="Descripción del equipo..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none transition-all duration-200"
                  style={{ background: "oklch(0.09 0.005 0)", border: "1px solid oklch(0.22 0.01 0)", color: "oklch(0.90 0.005 0)", outline: "none" }}
                  onFocus={(e) => { e.target.style.borderColor = "oklch(0.55 0.22 25)"; e.target.style.boxShadow = "0 0 8px oklch(0.55 0.22 25 / 0.3)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "oklch(0.22 0.01 0)"; e.target.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-3 rounded-xl font-display text-xs tracking-widest"
                style={{ background: "transparent", border: "1px solid oklch(0.25 0.01 0)", color: "oklch(0.60 0.005 0)" }}
              >
                CANCELAR
              </button>
              <button
                onClick={() => {
                  if (!teamName.trim()) { toast.error("El nombre del equipo es requerido"); return; }
                  createMutation.mutate({ name: teamName, tag: teamTag || undefined, game: teamGame || undefined, description: teamDesc || undefined });
                }}
                disabled={createMutation.isPending}
                className="flex-1 py-3 rounded-xl font-display text-xs tracking-widest transition-all duration-300 disabled:opacity-50"
                style={{ background: "oklch(0.55 0.22 25)", color: "oklch(0.98 0 0)", boxShadow: "0 0 12px oklch(0.55 0.22 25 / 0.4)" }}
              >
                {createMutation.isPending ? "CREANDO..." : "CREAR"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PremiumLayout>
  );
}
