import { useLocation } from "wouter";
import { TournamentsPage } from "./TournamentsPage";
import { TeamsPage } from "./TeamsPage";
import { RankingsPage } from "./RankingsPage";
import { Trophy } from "lucide-react";
import { PageHeader } from "../components/AdminUI";

function CompetitiveOverview() {
  return <PageHeader icon={Trophy} title="COMPETITIVO" subtitle="Gestiona torneos, equipos y rankings" />;
}

export function CompetitiveModule() {
  const [location] = useLocation();
  if (location.startsWith("/admin/competitive/tournaments")) return <TournamentsPage />;
  if (location.startsWith("/admin/competitive/teams")) return <TeamsPage />;
  if (location.startsWith("/admin/competitive/rankings")) return <RankingsPage />;
  return <CompetitiveOverview />;
}
