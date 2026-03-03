import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/_core/hooks/useAuth";
import { Shield } from "lucide-react";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || (user?.role !== "admin" && user?.role !== "super_admin")) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-800 mx-auto mb-4" />
          <p className="text-red-400 font-orbitron text-sm">ACCESO RESTRINGIDO</p>
          <p className="text-zinc-500 text-xs mt-2 font-rajdhani">Solo administradores pueden acceder a este panel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-900 text-white">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
