import { trpc } from "@/lib/trpc";
import PremiumLayout from "@/components/PremiumLayout";
import {
  Users, PlusCircle, UserPlus, Shield, Gamepad2, Camera, Loader2, Plus,
  ExternalLink, Trophy, CheckCircle, Search, X, Trash2, Crown, UserMinus,
  ArrowRightLeft, AlertTriangle,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { UserAvatar } from "@/components/UserAvatar";

// ─── Image Upload Component ───────────────────────────────────────────────────
function TeamImageUpload({
  teamId, type, currentUrl, onUploaded,
}: { teamId: number; type: "logo" | "banner"; currentUrl?: string | null; onUploaded: (url: string) => void }) {
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
    } catch { toast.error("Error al subir imagen"); setUploading(false); }
  };

  const displayUrl = preview || currentUrl;

  if (type === "logo") {
    return (
      <div className="relative w-16 h-16 rounded-full cursor-pointer group shrink-0" onClick={() => inputRef.current?.click()}>
        {displayUrl ? (
          <img src={displayUrl} alt="Logo" className="w-16 h-16 rounded-full object-cover" style={{ border: "2px solid oklch(0.55 0.22 25 / 0.5)" }} />
        ) : (
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black" style={{ background: "oklch(0.13 0.005 0)", border: "2px solid oklch(0.22 0.01 0)", color: "oklch(0.55 0.22 25)" }}>
            <Shield size={24} />
          </div>
        )}
        <div className="absolute inset-0 rounded-full bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-24 rounded-xl cursor-pointer group overflow-hidden" style={{ border: "1px dashed oklch(0.30 0.01 0)", background: "oklch(0.09 0.005 0)" }} onClick={() => inputRef.current?.click()}>
      {displayUrl ? <img src={displayUrl} alt="Banner" className="w-full h-full object-cover" /> : (
        <div className="w-full h-full flex items-center justify-center gap-2">
          <Camera className="w-4 h-4" style={{ color: "oklch(0.40 0.005 0)" }} />
          <span className="text-xs font-display tracking-wider" style={{ color: "oklch(0.40 0.005 0)" }}>SUBIR BANNER</span>
        </div>
      )}
      <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : (
          <><Camera className="w-5 h-5 text-white" /><span className="text-xs text-white font-display">CAMBIAR BANNER</span></>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  );
}

// ─── Player Search Component ──────────────────────────────────────────────────
function PlayerSearch({ teamId, onAdded }: { teamId: number; onAdded: () => void }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<"player" | "substitute" | "coach">("player");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const { data: results, isLoading } = trpc.teams.searchUsers.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 }
  );

  const addMutation = trpc.teams.addMember.useMutation({
    onSuccess: () => { toast.success("Jugador añadido al equipo"); onAdded(); setQuery(""); setDebouncedQuery(""); },
    onError: (err) => toast.error(err.message),
  });

  const ROLE_LABELS: Record<string, string> = { player: "Jugador", substitute: "Suplente", coach: "Entrenador" };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "oklch(0.45 0.005 0)" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por @nickname o nombre..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
            style={{ background: "oklch(0.09 0.005 0)", border: "1px solid oklch(0.22 0.01 0)", color: "oklch(0.90 0.005 0)", outline: "none" }}
            onFocus={(e) => { e.target.style.borderColor = "oklch(0.55 0.22 25)"; }}
            onBlur={(e) => { e.target.style.borderColor = "oklch(0.22 0.01 0)"; }}
          />
        </div>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as any)}
          className="px-3 py-2.5 rounded-xl text-xs font-display tracking-wider"
          style={{ background: "oklch(0.09 0.005 0)", border: "1px solid oklch(0.22 0.01 0)", color: "oklch(0.70 0.005 0)", outline: "none" }}
        >
          {(["player", "substitute", "coach"] as const).map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      {debouncedQuery.length >= 2 && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid oklch(0.20 0.01 0)" }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-4 gap-2">
              <Loader2 size={14} className="animate-spin" style={{ color: "oklch(0.55 0.22 25)" }} />
              <span className="text-xs text-muted-foreground">Buscando...</span>
            </div>
          ) : !results || results.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-xs text-muted-foreground">No se encontraron usuarios con ese nickname</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "oklch(0.15 0.005 0)" }}>
              {results.map((user) => (
                <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                  <UserAvatar
                    avatar={user.avatar}
                    name={user.nickname ?? user.name}
                    activeFrameImage={(user as any).activeFrameImage}
                    size={32}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {user.nickname ? `@${user.nickname}` : user.name}
                    </p>
                    {user.mainGame && <p className="text-xs text-muted-foreground truncate">{user.mainGame}</p>}
                  </div>
                  <button
                    onClick={() => addMutation.mutate({ teamId, userId: user.id, role: selectedRole })}
                    disabled={addMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display tracking-wider transition-all duration-200 disabled:opacity-50 shrink-0"
                    style={{ background: "oklch(0.55 0.22 25 / 0.15)", border: "1px solid oklch(0.55 0.22 25 / 0.4)", color: "oklch(0.65 0.22 25)" }}
                  >
                    <UserPlus size={12} /> AÑADIR
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Transfer Captaincy Modal ─────────────────────────────────────────────────
function TransferCaptaincyModal({ team, members, onClose, onSuccess }: {
  team: any; members: any[]; onClose: () => void; onSuccess: () => void;
}) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const transferMutation = trpc.teams.transferCaptaincy.useMutation({
    onSuccess: () => {
      toast.success("Capitanía transferida correctamente");
      onSuccess();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const eligibleMembers = members.filter((m) => m.role !== "captain");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "oklch(0 0 0 / 0.85)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.55 0.18 80 / 0.4)", boxShadow: "0 0 40px oklch(0.55 0.18 80 / 0.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <ArrowRightLeft size={16} style={{ color: "oklch(0.65 0.18 80)" }} />
            <h3 className="font-display text-lg font-bold tracking-wider text-foreground">TRANSFERIR CAPITANÍA</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X size={16} style={{ color: "oklch(0.55 0.005 0)" }} />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Selecciona el miembro del equipo <span style={{ color: "oklch(0.65 0.22 25)" }}>{team.name}</span> al que deseas transferir la capitanía. Esta acción no se puede deshacer.
        </p>

        {eligibleMembers.length === 0 ? (
          <div className="text-center py-6">
            <Users size={32} className="mx-auto mb-3" style={{ color: "oklch(0.30 0.01 0)" }} />
            <p className="text-sm text-muted-foreground">No hay otros miembros en el equipo.</p>
            <p className="text-xs text-muted-foreground mt-1">Añade jugadores antes de transferir la capitanía.</p>
          </div>
        ) : (
          <div className="space-y-2 mb-5">
            {eligibleMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedUserId(member.userId)}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200"
                style={selectedUserId === member.userId
                  ? { background: "oklch(0.55 0.18 80 / 0.15)", border: "1px solid oklch(0.55 0.18 80 / 0.5)" }
                  : { background: "oklch(0.08 0.005 0)", border: "1px solid oklch(0.15 0.005 0)" }
                }
              >
                <UserAvatar avatar={member.avatar} name={member.nickname ?? member.userName} activeFrameImage={member.activeFrameImage} size={36} />
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-foreground">
                    {member.nickname ? `@${member.nickname}` : member.userName}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                </div>
                {selectedUserId === member.userId && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "oklch(0.55 0.18 80)" }}>
                    <CheckCircle size={12} style={{ color: "oklch(0.98 0 0)" }} />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-display text-xs tracking-widest"
            style={{ background: "transparent", border: "1px solid oklch(0.25 0.01 0)", color: "oklch(0.60 0.005 0)" }}
          >
            CANCELAR
          </button>
          <button
            onClick={() => selectedUserId && transferMutation.mutate({ teamId: team.id, newCaptainUserId: selectedUserId })}
            disabled={!selectedUserId || transferMutation.isPending}
            className="flex-1 py-3 rounded-xl font-display text-xs tracking-widest transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "oklch(0.55 0.18 80)", color: "oklch(0.10 0 0)", boxShadow: selectedUserId ? "0 0 12px oklch(0.55 0.18 80 / 0.4)" : "none" }}
          >
            {transferMutation.isPending ? "TRANSFIRIENDO..." : "TRANSFERIR"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dissolve Team Dialog ─────────────────────────────────────────────────────
function DissolveTeamDialog({ team, onClose, onSuccess }: {
  team: any; onClose: () => void; onSuccess: () => void;
}) {
  const [confirmName, setConfirmName] = useState("");
  const dissolveMutation = trpc.teams.dissolve.useMutation({
    onSuccess: () => {
      toast.success("Equipo disuelto correctamente");
      onSuccess();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const isConfirmed = confirmName.trim() === team.name.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "oklch(0 0 0 / 0.85)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.55 0.22 25 / 0.4)", boxShadow: "0 0 40px oklch(0.55 0.22 25 / 0.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} style={{ color: "oklch(0.65 0.22 25)" }} />
            <h3 className="font-display text-lg font-bold tracking-wider text-foreground">DISOLVER EQUIPO</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X size={16} style={{ color: "oklch(0.55 0.005 0)" }} />
          </button>
        </div>

        <div className="p-4 rounded-xl mb-5" style={{ background: "oklch(0.55 0.22 25 / 0.08)", border: "1px solid oklch(0.55 0.22 25 / 0.2)" }}>
          <p className="text-sm" style={{ color: "oklch(0.75 0.22 25)" }}>
            Esta acción eliminará permanentemente el equipo <strong>{team.name}</strong> y todos sus datos, incluyendo el roster y el historial. No se puede deshacer.
          </p>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-display tracking-wider text-muted-foreground mb-2">
            ESCRIBE EL NOMBRE DEL EQUIPO PARA CONFIRMAR
          </label>
          <input
            type="text"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={team.name}
            className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
            style={{ background: "oklch(0.09 0.005 0)", border: `1px solid ${isConfirmed ? "oklch(0.55 0.22 25)" : "oklch(0.22 0.01 0)"}`, color: "oklch(0.90 0.005 0)", outline: "none" }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-display text-xs tracking-widest"
            style={{ background: "transparent", border: "1px solid oklch(0.25 0.01 0)", color: "oklch(0.60 0.005 0)" }}
          >
            CANCELAR
          </button>
          <button
            onClick={() => dissolveMutation.mutate({ teamId: team.id })}
            disabled={!isConfirmed || dissolveMutation.isPending}
            className="flex-1 py-3 rounded-xl font-display text-xs tracking-widest transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "oklch(0.55 0.22 25)", color: "oklch(0.98 0 0)", boxShadow: isConfirmed ? "0 0 12px oklch(0.55 0.22 25 / 0.4)" : "none" }}
          >
            {dissolveMutation.isPending ? "DISOLVIENDO..." : "DISOLVER EQUIPO"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Team Roster Panel ────────────────────────────────────────────────────────
const MAX_MEMBERS = 10;

function TeamRoster({ team, onMemberRemoved, onTeamChanged }: { team: any; onMemberRemoved: () => void; onTeamChanged: () => void }) {
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showDissolve, setShowDissolve] = useState(false);
  const { data: members, refetch } = trpc.teams.byId.useQuery({ id: team.id });
  const removeMutation = trpc.teams.removeMember.useMutation({
    onSuccess: () => { toast.success("Jugador eliminado del equipo"); refetch(); onMemberRemoved(); },
    onError: (err) => toast.error(err.message),
  });

  const ROLE_LABELS: Record<string, string> = { captain: "Capitán", player: "Jugador", substitute: "Suplente", coach: "Entrenador" };
  const ROLE_COLORS: Record<string, string> = {
    captain: "oklch(0.65 0.18 80)",
    player: "oklch(0.65 0.22 25)",
    substitute: "oklch(0.55 0.18 220)",
    coach: "oklch(0.65 0.18 145)",
  };

  const allMembers = members?.members ?? [];
  const isAtLimit = allMembers.length >= MAX_MEMBERS;

  return (
    <div className="mt-4 pt-4" style={{ borderTop: "1px solid oklch(0.15 0.005 0)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users size={14} style={{ color: "oklch(0.55 0.22 25)" }} />
          <span className="text-xs font-display tracking-wider text-foreground">ROSTER</span>
          {/* Member counter badge */}
          <span
            className="px-2 py-0.5 rounded-full text-xs font-display tracking-wider"
            style={isAtLimit
              ? { background: "oklch(0.55 0.22 25 / 0.2)", color: "oklch(0.65 0.22 25)", border: "1px solid oklch(0.55 0.22 25 / 0.4)" }
              : { background: "oklch(0.15 0.005 0)", color: "oklch(0.55 0.005 0)", border: "1px solid oklch(0.22 0.01 0)" }
            }
          >
            {allMembers.length}/{MAX_MEMBERS}
          </span>
          {isAtLimit && (
            <span className="text-xs font-display tracking-wider" style={{ color: "oklch(0.65 0.22 25)" }}>COMPLETO</span>
          )}
        </div>
        <button
          onClick={() => !isAtLimit && setShowAddPlayer(!showAddPlayer)}
          disabled={isAtLimit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display tracking-wider transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={showAddPlayer
            ? { background: "oklch(0.55 0.22 25 / 0.15)", border: "1px solid oklch(0.55 0.22 25 / 0.5)", color: "oklch(0.65 0.22 25)" }
            : { background: "transparent", border: "1px solid oklch(0.25 0.01 0)", color: "oklch(0.55 0.005 0)" }
          }
          title={isAtLimit ? "El equipo está completo (máximo 10 miembros)" : ""}
        >
          {showAddPlayer ? <X size={12} /> : <UserPlus size={12} />}
          {showAddPlayer ? "CERRAR" : "AÑADIR JUGADOR"}
        </button>
      </div>

      {/* Add player search */}
      {showAddPlayer && !isAtLimit && (
        <div className="mb-4 p-3 rounded-xl" style={{ background: "oklch(0.08 0.005 0)", border: "1px solid oklch(0.55 0.22 25 / 0.2)" }}>
          <p className="text-xs text-muted-foreground mb-3 font-display tracking-wider">Busca un jugador registrado en la plataforma:</p>
          <PlayerSearch teamId={team.id} onAdded={() => { refetch(); setShowAddPlayer(false); }} />
        </div>
      )}

      {/* Members list */}
      {allMembers.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">Sin jugadores en el roster. ¡Añade a tu primer jugador!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allMembers.map((member: any) => (
            <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-xl group" style={{ background: "oklch(0.08 0.005 0)" }}>
              <UserAvatar
                avatar={member.avatar}
                name={member.nickname ?? member.userName}
                activeFrameImage={member.activeFrameImage}
                size={32}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/profile/${member.userId}`}>
                    <span className="text-sm font-semibold text-foreground hover:underline cursor-pointer truncate">
                      {member.nickname ? `@${member.nickname}` : member.userName}
                    </span>
                  </Link>
                  {member.role === "captain" && <Crown size={12} style={{ color: "oklch(0.65 0.18 80)" }} />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-xs font-display tracking-wider px-1.5 py-0.5 rounded"
                    style={{ background: `${ROLE_COLORS[member.role] ?? "oklch(0.55 0.005 0)"}20`, color: ROLE_COLORS[member.role] ?? "oklch(0.55 0.005 0)" }}
                  >
                    {ROLE_LABELS[member.role] ?? member.role}
                  </span>
                  {member.gameId && <span className="text-xs text-muted-foreground">ID: {member.gameId}</span>}
                </div>
              </div>
              {/* Remove button — only for non-captain members */}
              {member.role !== "captain" && (
                <button
                  onClick={() => removeMutation.mutate({ teamId: team.id, memberId: member.id })}
                  disabled={removeMutation.isPending}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all duration-200 disabled:opacity-50"
                  style={{ color: "oklch(0.55 0.22 25)", background: "oklch(0.55 0.22 25 / 0.1)" }}
                  title="Eliminar del equipo"
                >
                  <UserMinus size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Captain actions */}
      <div className="flex gap-2 mt-4 pt-3" style={{ borderTop: "1px solid oklch(0.12 0.005 0)" }}>
        <button
          onClick={() => setShowTransfer(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-display tracking-wider transition-all duration-200"
          style={{ background: "oklch(0.55 0.18 80 / 0.1)", border: "1px solid oklch(0.55 0.18 80 / 0.25)", color: "oklch(0.65 0.18 80)" }}
          title="Transferir la capitanía a otro miembro"
        >
          <ArrowRightLeft size={12} /> TRANSFERIR CAPITANÍA
        </button>
        <button
          onClick={() => setShowDissolve(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-display tracking-wider transition-all duration-200"
          style={{ background: "oklch(0.55 0.22 25 / 0.08)", border: "1px solid oklch(0.55 0.22 25 / 0.2)", color: "oklch(0.55 0.22 25)" }}
          title="Disolver el equipo permanentemente"
        >
          <Trash2 size={12} /> DISOLVER EQUIPO
        </button>
      </div>

      {/* Modals */}
      {showTransfer && (
        <TransferCaptaincyModal
          team={team}
          members={allMembers}
          onClose={() => setShowTransfer(false)}
          onSuccess={() => { refetch(); onTeamChanged(); }}
        />
      )}
      {showDissolve && (
        <DissolveTeamDialog
          team={team}
          onClose={() => setShowDissolve(false)}
          onSuccess={() => { onTeamChanged(); }}
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyTeams() {
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamTag, setTeamTag] = useState("");
  const [teamGame, setTeamGame] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [teamLogo, setTeamLogo] = useState("");
  const [teamBannerCreate, setTeamBannerCreate] = useState("");
  const [uploadingCreate, setUploadingCreate] = useState<"logo" | "banner" | null>(null);
  const [teamLogos, setTeamLogos] = useState<Record<number, string>>({});
  const [teamBanners, setTeamBanners] = useState<Record<number, string>>({});

  const { data: me } = trpc.auth.me.useQuery();
  const { data: teams, isLoading, refetch } = trpc.teams.myTeams.useQuery();
  // Bloquear creación si el usuario ya es capitán de algún equipo
  const captainTeam = teams?.find((t) => t.captainId === me?.id);
  const isAlreadyCaptain = !!captainTeam;
  const uploadImageCreate = trpc.profile.uploadImage.useMutation();

  const createMutation = trpc.teams.create.useMutation({
    onSuccess: () => {
      toast.success("¡Equipo creado! Ahora añade jugadores al roster.");
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
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={() => !isAlreadyCaptain && setShowCreate(true)}
              disabled={isAlreadyCaptain}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-display text-xs tracking-widest transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              style={isAlreadyCaptain
                ? { background: "oklch(0.20 0.005 0)", color: "oklch(0.45 0.005 0)", border: "1px solid oklch(0.25 0.01 0)" }
                : { background: "oklch(0.55 0.22 25)", color: "oklch(0.98 0 0)", boxShadow: "0 0 12px oklch(0.55 0.22 25 / 0.4)" }
              }
              title={isAlreadyCaptain ? `Ya eres capitán de "${captainTeam?.name}"` : "Crear nuevo equipo"}
            >
              <PlusCircle size={14} /> CREAR EQUIPO
            </button>
            {isAlreadyCaptain && (
              <p className="text-xs" style={{ color: "oklch(0.55 0.18 80)" }}>
                Ya eres capitán de &ldquo;{captainTeam?.name}&rdquo;
              </p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2].map((i) => <div key={i} className="rounded-xl h-40 animate-pulse" style={{ background: "oklch(0.10 0.005 0)" }} />)}
          </div>
        ) : !teams || teams.length === 0 ? (
          <div className="rounded-2xl p-16 text-center" style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.18 0.01 0)" }}>
            <Users size={48} className="mx-auto mb-4" style={{ color: "oklch(0.25 0.01 0)" }} />
            <h3 className="font-display text-xl font-bold tracking-wider text-foreground mb-2">SIN EQUIPOS</h3>
            <p className="text-muted-foreground text-sm mb-6">Crea tu equipo para participar en torneos</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-8 py-3 rounded-xl font-display text-sm tracking-widest"
              style={{ background: "oklch(0.55 0.22 25)", color: "oklch(0.98 0 0)", boxShadow: "0 0 15px oklch(0.55 0.22 25 / 0.4)" }}
            >
              CREAR EQUIPO
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map((team) => (
              <div key={team.id} className="rounded-2xl overflow-hidden" style={{ background: "oklch(0.10 0.005 0)", border: "1px solid oklch(0.18 0.01 0)" }}>
                {/* Banner */}
                <TeamImageUpload
                  teamId={team.id}
                  type="banner"
                  currentUrl={teamBanners[team.id] || (team as any).banner}
                  onUploaded={(url) => setTeamBanners(prev => ({ ...prev, [team.id]: url }))}
                />

                <div className="p-5">
                  <div className="flex items-center gap-4">
                    {/* Logo */}
                    <div className="relative shrink-0">
                      <TeamImageUpload
                        teamId={team.id}
                        type="logo"
                        currentUrl={teamLogos[team.id] || (team as any).logo}
                        onUploaded={(url) => setTeamLogos(prev => ({ ...prev, [team.id]: url }))}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display text-lg font-bold tracking-wide text-foreground">{team.name}</h3>
                        {(team as any).tag && (
                          <span className="px-2 py-0.5 rounded text-xs font-mono" style={{ background: "oklch(0.55 0.22 25 / 0.15)", color: "oklch(0.65 0.22 25)", border: "1px solid oklch(0.55 0.22 25 / 0.3)" }}>
                            [{(team as any).tag}]
                          </span>
                        )}
                        {(team as any).isVerified && <CheckCircle size={14} className="text-blue-400" />}
                      </div>
                      {team.game && (
                        <div className="flex items-center gap-1 mt-1">
                          <Gamepad2 size={12} style={{ color: "oklch(0.50 0.005 0)" }} />
                          <span className="text-xs text-muted-foreground">{team.game}</span>
                        </div>
                      )}
                      {team.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{team.description}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <Link href={`/teams/${team.id}`}>
                        <button
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display tracking-wider transition-colors"
                          style={{ background: "oklch(0.55 0.22 25 / 0.15)", color: "oklch(0.65 0.22 25)", border: "1px solid oklch(0.55 0.22 25 / 0.3)" }}
                        >
                          <ExternalLink size={11} /> VER PERFIL
                        </button>
                      </Link>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid oklch(0.15 0.005 0)" }}>
                    <div className="flex items-center gap-1.5">
                      <Shield size={12} style={{ color: "oklch(0.55 0.22 25)" }} />
                      <span className="text-xs font-display tracking-wider" style={{ color: "oklch(0.65 0.22 25)" }}>CAPITÁN</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Trophy size={12} style={{ color: "oklch(0.65 0.18 80)" }} />
                      <span className="text-xs text-muted-foreground">{(team as any).wins ?? 0}V / {(team as any).losses ?? 0}D</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Gamepad2 size={12} style={{ color: "oklch(0.50 0.005 0)" }} />
                      <span className="text-xs text-muted-foreground">{(team as any).tournamentsPlayed ?? 0} torneos</span>
                    </div>
                  </div>

                  {/* Roster management */}
                  <TeamRoster team={team} onMemberRemoved={refetch} onTeamChanged={refetch} />
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
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-bold tracking-wider text-foreground">CREAR EQUIPO</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X size={16} style={{ color: "oklch(0.55 0.005 0)" }} />
              </button>
            </div>

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

            {/* Logo y Banner */}
            <div className="grid grid-cols-2 gap-3">
              {[{ label: "LOGO DEL EQUIPO", field: "logo" as const, val: teamLogo, set: setTeamLogo }, { label: "BANNER DEL EQUIPO", field: "banner" as const, val: teamBannerCreate, set: setTeamBannerCreate }].map(({ label, field, val, set }) => (
                <div key={field}>
                  <label className="block text-xs font-display tracking-wider text-muted-foreground mb-2">{label}</label>
                  {val && <img src={val} alt="" className={`w-full ${field === "banner" ? "h-16" : "h-12"} object-cover rounded-lg mb-2 border border-white/10`} />}
                  <label className="cursor-pointer block">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-display tracking-wider transition-colors" style={{ background: "oklch(0.09 0.005 0)", border: "1px solid oklch(0.22 0.01 0)", color: "oklch(0.60 0.005 0)" }}>
                      {uploadingCreate === field ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> : <Plus size={12} />}
                      {uploadingCreate === field ? "SUBIENDO..." : "SUBIR IMAGEN"}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0]; if (!file) return;
                      if (file.size > 5 * 1024 * 1024) { toast.error("Máximo 5MB"); return; }
                      setUploadingCreate(field);
                      try {
                        const reader = new FileReader();
                        reader.onload = async (ev) => {
                          const base64 = (ev.target?.result as string).split(",")[1];
                          const result = await uploadImageCreate.mutateAsync({ base64, mimeType: file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp", type: "banner" });
                          set(result.url);
                          setUploadingCreate(null);
                        };
                        reader.onerror = () => { toast.error("Error al leer el archivo"); setUploadingCreate(null); };
                        reader.readAsDataURL(file);
                      } catch { toast.error("Error al subir imagen"); setUploadingCreate(null); }
                    }} />
                  </label>
                </div>
              ))}
            </div>

            <div className="mt-2 p-3 rounded-xl" style={{ background: "oklch(0.55 0.22 25 / 0.05)", border: "1px solid oklch(0.55 0.22 25 / 0.15)" }}>
              <p className="text-xs text-muted-foreground">
                <span style={{ color: "oklch(0.65 0.22 25)" }}>Tip:</span> Después de crear el equipo, podrás añadir jugadores buscando por su @nickname.
              </p>
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
                  createMutation.mutate({ name: teamName, tag: teamTag || undefined, game: teamGame || undefined, description: teamDesc || undefined, logo: teamLogo || undefined, banner: teamBannerCreate || undefined });
                }}
                disabled={createMutation.isPending}
                className="flex-1 py-3 rounded-xl font-display text-xs tracking-widest transition-all duration-300 disabled:opacity-50"
                style={{ background: "oklch(0.55 0.22 25)", color: "oklch(0.98 0 0)", boxShadow: "0 0 12px oklch(0.55 0.22 25 / 0.4)" }}
              >
                {createMutation.isPending ? "CREANDO..." : "CREAR EQUIPO"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PremiumLayout>
  );
}
