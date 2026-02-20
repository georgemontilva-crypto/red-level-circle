import { trpc } from "@/lib/trpc";
import PremiumLayout from "@/components/PremiumLayout";
import { Users, PlusCircle, UserPlus, Shield, Gamepad2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function MyTeams() {
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamGame, setTeamGame] = useState("");
  const [teamDesc, setTeamDesc] = useState("");

  const { data: teams, isLoading, refetch } = trpc.teams.myTeams.useQuery();

  const createMutation = trpc.teams.create.useMutation({
    onSuccess: () => {
      toast.success("¡Equipo creado exitosamente!");
      setShowCreate(false);
      setTeamName("");
      setTeamGame("");
      setTeamDesc("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <PremiumLayout title="MIS EQUIPOS">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {teams?.length ?? 0} equipo{(teams?.length ?? 0) !== 1 ? "s" : ""}
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-display text-xs tracking-widest transition-all duration-300"
            style={{
              background: "oklch(0.55 0.22 25)",
              color: "oklch(0.98 0 0)",
              boxShadow: "0 0 12px oklch(0.55 0.22 25 / 0.4)",
            }}
          >
            <PlusCircle size={14} /> CREAR EQUIPO
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-xl h-32 animate-pulse"
                style={{ background: "oklch(0.10 0.005 0)" }}
              />
            ))}
          </div>
        ) : !teams || teams.length === 0 ? (
          <div
            className="rounded-2xl p-16 text-center"
            style={{
              background: "oklch(0.10 0.005 0)",
              border: "1px solid oklch(0.18 0.01 0)",
            }}
          >
            <Users size={48} className="mx-auto mb-4" style={{ color: "oklch(0.25 0.01 0)" }} />
            <h3 className="font-display text-xl font-bold tracking-wider text-foreground mb-2">
              SIN EQUIPOS
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Crea tu equipo para participar en torneos
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-8 py-3 rounded-xl font-display text-sm tracking-widest transition-all duration-300"
              style={{
                background: "oklch(0.55 0.22 25)",
                color: "oklch(0.98 0 0)",
                boxShadow: "0 0 15px oklch(0.55 0.22 25 / 0.4)",
              }}
            >
              CREAR EQUIPO
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="rounded-xl p-5 transition-all duration-200"
                style={{
                  background: "oklch(0.10 0.005 0)",
                  border: "1px solid oklch(0.18 0.01 0)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "oklch(0.55 0.22 25 / 0.3)";
                  e.currentTarget.style.boxShadow = "0 0 15px oklch(0.55 0.22 25 / 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "oklch(0.18 0.01 0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shrink-0"
                    style={{
                      background: "oklch(0.55 0.22 25 / 0.15)",
                      border: "1px solid oklch(0.55 0.22 25 / 0.3)",
                      color: "oklch(0.65 0.22 25)",
                    }}
                  >
                    {team.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-base font-bold tracking-wide text-foreground truncate">
                      {team.name}
                    </h3>
                    {team.game && (
                      <div className="flex items-center gap-1 mt-1">
                        <Gamepad2 size={12} style={{ color: "oklch(0.50 0.005 0)" }} />
                        <span className="text-xs text-muted-foreground">{team.game}</span>
                      </div>
                    )}
                    {team.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {team.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-2">
                      <Shield size={12} style={{ color: "oklch(0.55 0.22 25)" }} />
                      <span className="text-xs font-display tracking-wider" style={{ color: "oklch(0.55 0.22 25)" }}>
                        CAPITÁN
                      </span>
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
          style={{ background: "oklch(0 0 0 / 0.8)" }}
          onClick={() => setShowCreate(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{
              background: "oklch(0.10 0.005 0)",
              border: "1px solid oklch(0.55 0.22 25 / 0.3)",
              boxShadow: "0 0 40px oklch(0.55 0.22 25 / 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl font-bold tracking-wider text-foreground mb-5">
              CREAR EQUIPO
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-display tracking-wider text-muted-foreground mb-2">
                  NOMBRE DEL EQUIPO <span style={{ color: "oklch(0.65 0.22 25)" }}>*</span>
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Ej: Red Dragons"
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
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

              <div>
                <label className="block text-xs font-display tracking-wider text-muted-foreground mb-2">
                  JUEGO PRINCIPAL
                </label>
                <input
                  type="text"
                  value={teamGame}
                  onChange={(e) => setTeamGame(e.target.value)}
                  placeholder="Ej: Valorant"
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
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

              <div>
                <label className="block text-xs font-display tracking-wider text-muted-foreground mb-2">
                  DESCRIPCIÓN
                </label>
                <textarea
                  value={teamDesc}
                  onChange={(e) => setTeamDesc(e.target.value)}
                  placeholder="Descripción del equipo..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none transition-all duration-200"
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
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-3 rounded-xl font-display text-xs tracking-widest"
                style={{
                  background: "transparent",
                  border: "1px solid oklch(0.25 0.01 0)",
                  color: "oklch(0.60 0.005 0)",
                }}
              >
                CANCELAR
              </button>
              <button
                onClick={() => {
                  if (!teamName.trim()) { toast.error("El nombre del equipo es requerido"); return; }
                  createMutation.mutate({
                    name: teamName,
                    game: teamGame || undefined,
                    description: teamDesc || undefined,
                  });
                }}
                disabled={createMutation.isPending}
                className="flex-1 py-3 rounded-xl font-display text-xs tracking-widest transition-all duration-300 disabled:opacity-50"
                style={{
                  background: "oklch(0.55 0.22 25)",
                  color: "oklch(0.98 0 0)",
                  boxShadow: "0 0 12px oklch(0.55 0.22 25 / 0.4)",
                }}
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
