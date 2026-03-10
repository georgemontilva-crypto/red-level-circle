import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  Users, Shield, Trophy, Eye, BarChart3, Star, Package, ShoppingBag,
  Crown, Clock, AlertTriangle, CheckCircle2, Plus, Newspaper, MapPin,
  Zap, ChevronRight, Gamepad2, Coins, Layout, Flag
} from "lucide-react";
import { PageHeader, StatCard } from "../components/AdminUI";
import { UserAvatar } from "@/components/UserAvatar";

function QuickActionButton({ icon: Icon, label, href, color = "bg-zinc-800 hover:bg-zinc-700" }: {
  icon: any; label: string; href: string; color?: string;
}) {
  const [, navigate] = useLocation();
  return (
    <button
      onClick={() => navigate(href)}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-white/8 transition-all ${color} text-white text-xs font-semibold font-orbitron tracking-wider`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
}

function PendingCard({ icon: Icon, label, count, href, color }: {
  icon: any; label: string; count: number; href: string; color: string;
}) {
  const [, navigate] = useLocation();
  if (count === 0) return null;
  return (
    <button
      onClick={() => navigate(href)}
      className="w-full flex items-center gap-4 p-4 rounded-xl bg-zinc-900/60 border border-white/8 hover:border-white/20 transition-all text-left"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="text-white text-sm font-semibold">{label}</p>
        <p className="text-zinc-400 text-xs">{count} elemento{count !== 1 ? "s" : ""} pendiente{count !== 1 ? "s" : ""}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="bg-red-600 text-white text-xs font-orbitron font-bold px-2 py-0.5 rounded-full">{count}</span>
        <ChevronRight className="w-4 h-4 text-zinc-500" />
      </div>
    </button>
  );
}

export function DashboardPage() {
  const { data: stats } = trpc.admin.stats.useQuery();
  const { data: pendingTournaments } = trpc.admin.pendingTournaments.useQuery();
  const { data: pendingCreators } = trpc.creators.listPending.useQuery();
  const { data: pendingAllies } = trpc.allies.adminList.useQuery();
  const { data: pendingRoleRequests } = trpc.roleRequests.adminList.useQuery({ status: "pending" });

  const pendingCreatorsCount = pendingCreators?.filter(c => c.status === "pending").length ?? 0;
  const pendingTournamentsCount = pendingTournaments?.length ?? 0;
  const pendingAlliesCount = pendingAllies?.filter((a: any) => a.status === "pending").length ?? 0;
  const pendingRoleRequestsCount = pendingRoleRequests?.length ?? 0;
  const totalPending = pendingCreatorsCount + pendingTournamentsCount + pendingAlliesCount + pendingRoleRequestsCount;

  return (
    <div className="space-y-8 w-full">
      <PageHeader
        title="DASHBOARD"
        subtitle="Centro de control de Red Level Circle"
        icon={BarChart3}
      />

      {/* Stats Grid */}
      <div>
        <h2 className="text-xs font-orbitron text-zinc-500 tracking-widest mb-4">ESTADÍSTICAS GENERALES</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Usuarios totales" value={stats?.totalUsers ?? "—"} icon={Users} color="text-blue-400" />
          <StatCard label="Equipos registrados" value={stats?.totalTeams ?? "—"} icon={Shield} color="text-purple-400" />
          <StatCard label="Torneos activos" value={stats?.activeTournaments ?? "—"} icon={Trophy} color="text-red-400" />
          <StatCard label="Apuestas activas" value={stats?.totalBets ?? "—"} icon={Coins} color="text-yellow-400" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <StatCard label="Torneos totales" value={stats?.totalTournaments ?? "—"} icon={Trophy} color="text-zinc-400" />
          <StatCard label="Pedidos totales" value={stats?.totalOrders ?? "—"} icon={Package} color="text-cyan-400" />
          <StatCard label="Pedidos pendientes" value={stats?.pendingOrders ?? "—"} icon={ShoppingBag} color="text-pink-400" />
          <StatCard label="Pendientes revisión" value={totalPending} icon={Eye} color="text-orange-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Actions */}
        <div>
          <h2 className="text-xs font-orbitron text-zinc-500 tracking-widest mb-4 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
            ACCIONES PENDIENTES
          </h2>
          {totalPending === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 bg-zinc-900/40 border border-white/5 rounded-xl">
              <CheckCircle2 className="w-10 h-10 text-green-500/50 mb-3" />
              <p className="text-zinc-400 font-orbitron text-xs">Todo al día</p>
              <p className="text-zinc-600 text-xs mt-1">No hay elementos pendientes de revisión</p>
            </div>
          ) : (
            <div className="space-y-3">
              <PendingCard
                icon={Crown}
                label="Solicitudes de Creadores"
                count={pendingCreatorsCount}
                href="/admin/community/creators"
                color="bg-yellow-500/20 text-yellow-400"
              />
              <PendingCard
                icon={Trophy}
                label="Torneos por aprobar"
                count={pendingTournamentsCount}
                href="/admin/competitive/tournaments"
                color="bg-red-500/20 text-red-400"
              />
              <PendingCard
                icon={MapPin}
                label="Solicitudes de Aliados"
                count={pendingAlliesCount}
                href="/admin/content/allies"
                color="bg-blue-500/20 text-blue-400"
              />
              <PendingCard
                icon={Flag}
                label="Solicitudes de Rol"
                count={pendingRoleRequestsCount}
                href="/admin/system/role-requests"
                color="bg-purple-500/20 text-purple-400"
              />
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xs font-orbitron text-zinc-500 tracking-widest mb-4 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-red-500" />
            ACCIONES RÁPIDAS
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <QuickActionButton icon={Trophy} label="TORNEOS" href="/admin/competitive/tournaments" color="bg-red-600/20 hover:bg-red-600/40 border-red-600/30" />
            <QuickActionButton icon={Layout} label="BANNERS" href="/admin/content/banners" color="bg-purple-600/20 hover:bg-purple-600/40 border-purple-600/30" />
            <QuickActionButton icon={MapPin} label="ALIADOS" href="/admin/content/allies" color="bg-blue-600/20 hover:bg-blue-600/40 border-blue-600/30" />
            <QuickActionButton icon={Newspaper} label="NOTICIAS" href="/admin/content/news" color="bg-green-600/20 hover:bg-green-600/40 border-green-600/30" />
            <QuickActionButton icon={Crown} label="CREADORES" href="/admin/community/creators" color="bg-yellow-600/20 hover:bg-yellow-600/40 border-yellow-600/30" />
            <QuickActionButton icon={Users} label="USUARIOS" href="/admin/community/users" color="bg-cyan-600/20 hover:bg-cyan-600/40 border-cyan-600/30" />
          </div>
        </div>
      </div>

      {/* Recent Users */}
      {stats?.recentUsers && stats.recentUsers.length > 0 && (
        <div>
          <h2 className="text-xs font-orbitron text-zinc-500 tracking-widest mb-4">USUARIOS RECIENTES</h2>
          <div className="space-y-2">
            {stats.recentUsers.map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 p-3 bg-zinc-900/60 border border-white/5 rounded-xl">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <UserAvatar avatar={u.avatar} name={u.name} size={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{u.nickname ?? u.name ?? "Sin nombre"}</p>
                  <p className="text-zinc-500 text-xs">{new Date(u.createdAt).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono border ${
                  u.role === "super_admin" ? "bg-purple-500/20 text-purple-300 border-purple-600/40" :
                  u.role === "admin" ? "bg-yellow-500/20 text-yellow-400 border-yellow-600/40" :
                  u.role === "premium" ? "bg-blue-500/20 text-blue-400 border-blue-600/40" :
                  "bg-zinc-500/20 text-zinc-400 border-zinc-600/40"
                }`}>
                  {u.role === "premium" ? "CDC" : u.role === "super_admin" ? "SUPER ADMIN" : u.role === "admin" ? "ADMIN" : "USUARIO"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
