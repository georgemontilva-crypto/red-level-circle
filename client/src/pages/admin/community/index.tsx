import { Switch, Route } from "wouter";
import { UsersPage } from "./UsersPage";
import { CreatorsPage } from "./CreatorsPage";
import { StreamsPage } from "./StreamsPage";
import { ReportsPage } from "./ReportsPage";
import { Users } from "lucide-react";
import { PageHeader } from "../components/AdminUI";

function CommunityOverview() {
  return <PageHeader icon={Users} title="COMUNIDAD" subtitle="Gestiona usuarios, creadores, streams y reportes" />;
}

export function CommunityModule() {
  return (
    <Switch>
      <Route path="/admin/community/users" component={UsersPage} />
      <Route path="/admin/community/creators" component={CreatorsPage} />
      <Route path="/admin/community/streams" component={StreamsPage} />
      <Route path="/admin/community/reports" component={ReportsPage} />
      <Route component={CommunityOverview} />
    </Switch>
  );
}
