import { useLocation } from "wouter";
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
  const [location] = useLocation();
  if (location.startsWith("/admin/community/users")) return <UsersPage />;
  if (location.startsWith("/admin/community/creators")) return <CreatorsPage />;
  if (location.startsWith("/admin/community/streams")) return <StreamsPage />;
  if (location.startsWith("/admin/community/reports")) return <ReportsPage />;
  return <CommunityOverview />;
}
