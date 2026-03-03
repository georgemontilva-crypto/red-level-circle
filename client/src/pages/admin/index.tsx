import { AdminLayout } from "./components/AdminLayout";
import { Switch, Route } from "wouter";
import { DashboardPage } from "./dashboard/DashboardPage";
import { ContentModule } from "./content/index";
import { CompetitiveModule } from "./competitive/index";
import { CommunityModule } from "./community/index";
import { MonetizationModule } from "./monetization/index";
import { SystemModule } from "./system/index";

export default function AdminRouter() {
  return (
    <AdminLayout>
      <Switch>
        {/* Dashboard */}
        <Route path="/admin" component={DashboardPage} />

        {/* Content module */}
        <Route path="/admin/content/:rest*" component={ContentModule} />
        <Route path="/admin/content" component={ContentModule} />

        {/* Competitive module */}
        <Route path="/admin/competitive/:rest*" component={CompetitiveModule} />
        <Route path="/admin/competitive" component={CompetitiveModule} />

        {/* Community module */}
        <Route path="/admin/community/:rest*" component={CommunityModule} />
        <Route path="/admin/community" component={CommunityModule} />

        {/* Monetization module */}
        <Route path="/admin/monetization/:rest*" component={MonetizationModule} />
        <Route path="/admin/monetization" component={MonetizationModule} />

        {/* System module */}
        <Route path="/admin/system/:rest*" component={SystemModule} />
        <Route path="/admin/system" component={SystemModule} />
      </Switch>
    </AdminLayout>
  );
}
