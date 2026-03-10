import { useLocation } from "wouter";
import { VerificationsPage } from "./VerificationsPage";
import { AuditPage } from "./AuditPage";
import { RolesPage } from "./RolesPage";
import { RoleRequestsPage } from "./RoleRequestsPage";
import { ConfigPage } from "./ConfigPage";
import { Settings } from "lucide-react";
import { PageHeader } from "../components/AdminUI";

function SystemOverview() {
  return <PageHeader icon={Settings} title="SISTEMA" subtitle="Verificaciones, auditoría, roles y configuración" />;
}

export function SystemModule() {
  const [location] = useLocation();
  if (location.startsWith("/admin/system/role-requests")) return <RoleRequestsPage />;
  if (location.startsWith("/admin/system/verifications")) return <VerificationsPage />;
  if (location.startsWith("/admin/system/audit")) return <AuditPage />;
  if (location.startsWith("/admin/system/roles")) return <RolesPage />;
  if (location.startsWith("/admin/system/config")) return <ConfigPage />;
  return <SystemOverview />;
}
