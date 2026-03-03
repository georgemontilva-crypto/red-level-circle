import { Shield } from "lucide-react";
import { PageHeader } from "../components/AdminUI";

const ROLES = [
  { name: "super_admin", label: "Super Admin", color: "text-purple-400 border-purple-500/30 bg-purple-500/10", description: "Acceso total al sistema, incluyendo configuración y gestión de otros admins." },
  { name: "admin", label: "Administrador", color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10", description: "Puede gestionar contenido, usuarios, torneos y pedidos." },
  { name: "premium", label: "Premium", color: "text-red-400 border-red-500/30 bg-red-500/10", description: "Usuario con acceso a funciones premium de la plataforma." },
  { name: "user", label: "Usuario", color: "text-zinc-400 border-zinc-500/30 bg-zinc-500/10", description: "Usuario estándar con acceso básico a la plataforma." },
];

const PERMISSIONS = [
  { action: "Ver panel de admin", super_admin: true, admin: true, premium: false, user: false },
  { action: "Gestionar usuarios", super_admin: true, admin: true, premium: false, user: false },
  { action: "Gestionar contenido", super_admin: true, admin: true, premium: false, user: false },
  { action: "Aprobar torneos", super_admin: true, admin: true, premium: false, user: false },
  { action: "Gestionar tienda", super_admin: true, admin: true, premium: false, user: false },
  { action: "Gestionar apuestas", super_admin: true, admin: true, premium: false, user: false },
  { action: "Subir banner de perfil", super_admin: true, admin: true, premium: false, user: false },
  { action: "Crear torneos", super_admin: true, admin: true, premium: true, user: false },
  { action: "Crear equipos", super_admin: true, admin: true, premium: true, user: true },
  { action: "Apostar en torneos", super_admin: true, admin: true, premium: true, user: true },
  { action: "Comprar en tienda", super_admin: true, admin: true, premium: true, user: true },
];

export function RolesPage() {
  return (
    <div className="space-y-8 w-full">
      <PageHeader icon={Shield} title="ROLES Y PERMISOS" subtitle="Referencia de los roles disponibles y sus permisos en la plataforma" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ROLES.map(role => (
          <div key={role.name} className="bg-zinc-900/60 border border-white/8 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-orbitron border ${role.color}`}>{role.label}</span>
            </div>
            <p className="text-zinc-400 text-sm">{role.description}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-orbitron text-sm text-zinc-400 mb-4 flex items-center gap-2"><Shield className="w-4 h-4" /> MATRIZ DE PERMISOS</h3>
        <div className="overflow-x-auto rounded-xl border border-white/8">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900/80">
                <th className="text-left p-3 text-zinc-500 font-orbitron text-xs">ACCIÓN</th>
                <th className="text-center p-3 text-purple-400 font-orbitron text-xs">SUPER ADMIN</th>
                <th className="text-center p-3 text-yellow-400 font-orbitron text-xs">ADMIN</th>
                <th className="text-center p-3 text-red-400 font-orbitron text-xs">PREMIUM</th>
                <th className="text-center p-3 text-zinc-400 font-orbitron text-xs">USUARIO</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((perm, i) => (
                <tr key={i} className="border-t border-white/5 hover:bg-white/2">
                  <td className="p-3 text-zinc-300">{perm.action}</td>
                  {(["super_admin", "admin", "premium", "user"] as const).map(role => (
                    <td key={role} className="p-3 text-center">
                      {perm[role] ? <span className="text-green-400 text-base">✓</span> : <span className="text-zinc-700 text-base">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
