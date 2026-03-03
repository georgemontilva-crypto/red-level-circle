import { Switch, Route } from "wouter";
import { TournamentsPage } from "./TournamentsPage";
import { TeamsPage } from "./TeamsPage";
import { RankingsPage } from "./RankingsPage";
import { Trophy } from "lucide-react";
import { PageHeader } from "../components/AdminUI";

function CompetitiveOverview() {
  return <PageHeader icon={Trophy} title="COMPETITIVO" subtitle="Gestiona torneos, equipos y rankings" />;
}

export function CompetitiveModule() {
  return (
    <Switch>
      <Route path="/admin/competitive/tournaments" component={TournamentsPage} />
      <Route path="/admin/competitive/teams" component={TeamsPage} />
      <Route path="/admin/competitive/rankings" component={RankingsPage} />
      <Route component={CompetitiveOverview} />
    </Switch>
  );
}
