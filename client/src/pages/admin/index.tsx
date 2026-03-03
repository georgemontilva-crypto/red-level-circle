import { AdminLayout } from "./components/AdminLayout";
import { useLocation } from "wouter";
import { DashboardPage } from "./dashboard/DashboardPage";
import { ContentModule } from "./content/index";
import { CompetitiveModule } from "./competitive/index";
import { CommunityModule } from "./community/index";
import { MonetizationModule } from "./monetization/index";
import { SystemModule } from "./system/index";

export default function AdminRouter() {
  const [location] = useLocation();

  const renderContent = () => {
    if (location.startsWith("/admin/content")) return <ContentModule />;
    if (location.startsWith("/admin/competitive")) return <CompetitiveModule />;
    if (location.startsWith("/admin/community")) return <CommunityModule />;
    if (location.startsWith("/admin/monetization")) return <MonetizationModule />;
    if (location.startsWith("/admin/system")) return <SystemModule />;
    return <DashboardPage />;
  };

  return (
    <AdminLayout>
      {renderContent()}
    </AdminLayout>
  );
}
