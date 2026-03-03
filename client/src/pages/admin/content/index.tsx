import { Switch, Route, useLocation } from "wouter";
import { BannersPage } from "./BannersPage";
import { NewsPage } from "./NewsPage";
import { AlliesPage } from "./AlliesPage";
import { GamesPage } from "./GamesPage";
import { Layout } from "lucide-react";
import { PageHeader } from "../components/AdminUI";

function ContentOverview() {
  return (
    <PageHeader icon={Layout} title="CONTENIDO" subtitle="Gestiona los contenidos visibles en el frontend" />
  );
}

export function ContentModule() {
  const [location] = useLocation();
  return (
    <Switch>
      <Route path="/admin/content/banners" component={BannersPage} />
      <Route path="/admin/content/news" component={NewsPage} />
      <Route path="/admin/content/allies" component={AlliesPage} />
      <Route path="/admin/content/games" component={GamesPage} />
      <Route component={ContentOverview} />
    </Switch>
  );
}
