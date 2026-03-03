import { Switch, Route } from "wouter";
import { VerificationsPage } from "./VerificationsPage";
import { AuditPage } from "./AuditPage";
import { RolesPage } from "./RolesPage";
import { ConfigPage } from "./ConfigPage";
import { Settings } from "lucide-react";
import { PageHeader } from "../components/AdminUI";

function SystemOverview() {
  return <PageHeader icon={Settings} title="SISTEMA" subtitle="Verificaciones, auditoría, roles y configuración" />;
}

export function SystemModule() {
  return (
    <Switch>
      <Route path="/admin/system/verifications" component={VerificationsPage} />
      <Route path="/admin/system/audit" component={AuditPage} />
      <Route path="/admin/system/roles" component={RolesPage} />
      <Route path="/admin/system/config" component={ConfigPage} />
      <Route component={SystemOverview} />
    </Switch>
  );
}
