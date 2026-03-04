import { useLocation } from "wouter";
import { BannersPage } from "./BannersPage";
import { NewsPage } from "./NewsPage";
import { AlliesPage } from "./AlliesPage";
import { GamesPage } from "./GamesPage";
import { AdsPage } from "./AdsPage";
import { Layout } from "lucide-react";
import { PageHeader } from "../components/AdminUI";

function ContentOverview() {
  return (
    <PageHeader icon={Layout} title="CONTENIDO" subtitle="Gestiona los contenidos visibles en el frontend" />
  );
}

export function ContentModule() {
  const [location] = useLocation();
  if (location.startsWith("/admin/content/banners")) return <BannersPage />;
  if (location.startsWith("/admin/content/news")) return <NewsPage />;
  if (location.startsWith("/admin/content/allies")) return <AlliesPage />;
  if (location.startsWith("/admin/content/games")) return <GamesPage />;
  if (location.startsWith("/admin/content/ads")) return <AdsPage />;
  return <ContentOverview />;
}
