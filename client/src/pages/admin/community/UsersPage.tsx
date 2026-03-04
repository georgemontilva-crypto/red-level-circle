import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { Users, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "../components/AdminUI";
import { UserAvatar } from "@/components/UserAvatar";

export function UsersPage() {
  const [search, setSearch] = useState("");
  const [rlcForm, setRlcForm] = useState<{ userId: number; amount: string; reason: string } | null>(null);
  const { data: users, refetch } = trpc.admin.listUsers.useQuery({ search: search || undefined });
  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => { toast.success("Rol actualizado"); refetch(); },
    onError: e => toast.error(e.message),
  });
  const updateBannerPermission = trpc.admin.updateBannerPermission.useMutation({
    onSuccess: () => { toast.success("Permiso de banner actualizado"); refetch(); },
    onError: e => toast.error(e.message),
  });
  const updateVerified = trpc.admin.updateVerified.useMutation({
    onSuccess: () => { toast.success("Estado de verificación actualizado"); refetch(); },
    onError: e => toast.error(e.message),
  });
  const adjustRLC = trpc.admin.adjustRLC.useMutation({
    onSuccess: () => { toast.success("RLC ajustado"); setRlcForm(null); refetch(); },
    onError: e => toast.error(e.message),
  });

  const roleColors: Record<string, string> = {
    super_admin: "bg-purple-500/20 text-purple-300 border-purple-600/40",
    admin: "bg-yellow-500/20 text-yellow-400 border-yellow-600/40",
    premium: "bg-blue-500/20 text-blue-400 border-blue-600/40",
    user: "bg-zinc-500/20 text-zinc-400 border-zinc-600/40",
  };

  return (
    <div className="space-y-4 w-full">
      <PageHeader icon={Users} title="USUARIOS" subtitle="Administra roles y balances de RLC" />
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por nombre o email..."
        className="w-full bg-zinc-800/60 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
      />
      <div className="space-y-2">
        {users?.map(u => (
          <div key={u.id} className="bg-zinc-900/60 border border-white/8 rounded-xl p-4 flex items-center gap-4 flex-wrap">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <UserAvatar avatar={u.avatar} name={u.name} size={40} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-rajdhani font-semibold truncate">{u.nickname ?? u.name ?? "Sin nombre"}</p>
              <p className="text-zinc-500 text-xs truncate">{u.email}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`font-orbitron text-xs border ${roleColors[u.role] ?? roleColors.user}`}>
                {u.role === "premium" ? "CDC" : u.role === "super_admin" ? "SUPER ADMIN" : u.role === "admin" ? "ADMIN" : "USUARIO"}
              </Badge>
              <span className="text-yellow-400 text-xs font-orbitron">{u.rlcBalance ?? 0} RLC</span>
              <Select value={u.role} onValueChange={role => updateRole.mutate({ userId: u.id, role: role as any })}>
                <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="premium">CDC</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => setRlcForm({ userId: u.id, amount: "", reason: "" })}
                className="h-7 text-xs border-yellow-700 text-yellow-400 hover:bg-yellow-950/40">
                <Coins className="w-3 h-3 mr-1" /> RLC
              </Button>
              <button
                onClick={() => updateBannerPermission.mutate({ userId: u.id, canUploadBanner: !(u as any).canUploadBanner })}
                title={(u as any).canUploadBanner ? "Revocar permiso de banner" : "Otorgar permiso de banner"}
                className={`h-7 px-2 rounded text-xs font-mono border transition-colors ${
                  (u as any).canUploadBanner
                    ? "bg-purple-900/40 border-purple-600/60 text-purple-300 hover:bg-purple-900/60"
                    : "bg-zinc-900 border-white/10 text-zinc-500 hover:border-purple-600/40 hover:text-purple-300"
                }`}
              >
                {(u as any).canUploadBanner ? "🖼️ BANNER" : "🔒 BANNER"}
              </button>
              <button
                onClick={() => updateVerified.mutate({ userId: u.id, isVerified: !(u as any).isVerified })}
                title={(u as any).isVerified ? "Quitar verificación" : "Verificar usuario"}
                className={`h-7 px-2 rounded text-xs font-mono border transition-colors ${
                  (u as any).isVerified
                    ? "bg-blue-900/40 border-blue-600/60 text-blue-300 hover:bg-blue-900/60"
                    : "bg-zinc-900 border-white/10 text-zinc-500 hover:border-blue-600/40 hover:text-blue-300"
                }`}
              >
                {(u as any).isVerified ? "✅ VERIF." : "○ VERIF."}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* RLC Modal */}
      {rlcForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-red-900/50 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-orbitron text-red-400 text-sm tracking-widest">AJUSTAR RLC COINS</h3>
            <p className="text-zinc-500 text-xs">Usa valores positivos para agregar y negativos para quitar.</p>
            <input type="number" value={rlcForm.amount} onChange={e => setRlcForm(f => f ? { ...f, amount: e.target.value } : null)}
              placeholder="Cantidad (ej: 500 o -100)"
              className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
            <input value={rlcForm.reason} onChange={e => setRlcForm(f => f ? { ...f, reason: e.target.value } : null)}
              placeholder="Motivo (ej: Premio torneo)"
              className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
            <div className="flex gap-3">
              <Button onClick={() => adjustRLC.mutate({ userId: rlcForm.userId, amount: parseInt(rlcForm.amount), reason: rlcForm.reason })}
                disabled={!rlcForm.amount || !rlcForm.reason || adjustRLC.isPending}
                className="bg-red-600 hover:bg-red-700 text-white font-orbitron text-xs flex-1">
                APLICAR
              </Button>
              <Button onClick={() => setRlcForm(null)} variant="outline" className="border-white/10 text-zinc-400 font-orbitron text-xs">
                CANCELAR
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
