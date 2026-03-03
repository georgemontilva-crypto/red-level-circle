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
    <div className="flex h-screen overflow-hidden bg-zinc-900 text-white">
      {/* Sidebar: fixed height, no scroll */}
      <div className="flex-shrink-0 h-screen overflow-y-auto">
        <Sidebar />
      </div>
      {/* Main content: scrollable, takes all remaining width */}
      <main className="flex-1 overflow-y-auto h-screen">
        <div className="p-6 md:p-8 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
