import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { trpc } from "./lib/trpc";
import SidebarLayout from "./components/SidebarLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Tournaments from "./pages/Tournaments";
import TournamentDetail from "./pages/TournamentDetail";
import Dashboard from "./pages/Dashboard";
import CreateTournament from "./pages/CreateTournament";
import MyTournaments from "./pages/MyTournaments";
import TournamentManage from "./pages/TournamentManage";
import ManageRegistrations from "./pages/ManageRegistrations";
import MyTeams from "./pages/MyTeams";
import Ranking from "./pages/Ranking";
import { NewsList, NewsArticle } from "./pages/News";
import Streams from "./pages/Streams";
import Betting from "./pages/Betting";
import TeamProfile from "./pages/TeamProfile";
import CosmeticsShop from "./pages/CosmeticsShop";
import Shop from "./pages/Shop";
import Rewards from "./pages/Rewards";
import BrandAds from "./pages/BrandAds";
import AdminPanel from "./pages/AdminPanel";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import Community from "./pages/Community";
import Creators from "./pages/Creators";
import OnboardingModal from "./components/OnboardingModal";

function OnboardingWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const { data: me } = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();
  const [dismissed, setDismissed] = useState(false);

  const showOnboarding =
    !loading &&
    isAuthenticated &&
    !dismissed &&
    me &&
    !(me as { nickname?: string }).nickname;

  const handleComplete = () => {
    setDismissed(true);
    utils.auth.me.invalidate();
  };

  return (
    <>
      {children}
      {showOnboarding && <OnboardingModal onComplete={handleComplete} />}
    </>
  );
}

function Router() {
  return (
    <SidebarLayout>
      <Switch>
        {/* Public routes */}
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/tournaments" component={Tournaments} />
        <Route path="/tournaments/:id" component={TournamentDetail} />
        <Route path="/ranking" component={Ranking} />
        <Route path="/news" component={NewsList} />
        <Route path="/news/:slug" component={NewsArticle} />
        <Route path="/streams" component={Streams} />
        <Route path="/betting" component={Betting} />
        <Route path="/teams/:id" component={TeamProfile} />
        <Route path="/shop/cosmetics" component={CosmeticsShop} />
        <Route path="/shop" component={Shop} />
        <Route path="/rewards" component={Rewards} />
        <Route path="/ads" component={BrandAds} />

        {/* Premium dashboard routes */}
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/dashboard/create-tournament" component={CreateTournament} />
        <Route path="/dashboard/tournaments" component={MyTournaments} />
        <Route path="/dashboard/tournament/:id" component={TournamentManage} />
        <Route path="/dashboard/registrations" component={ManageRegistrations} />
        <Route path="/dashboard/teams" component={MyTeams} />

        {/* Admin */}
        <Route path="/admin" component={AdminPanel} />
        <Route path="/admin/:tab" component={AdminPanel} />

        {/* Community */}
        <Route path="/community" component={Community} />
        <Route path="/creators" component={Creators} />

        {/* User profiles */}
        <Route path="/profile/:id" component={UserProfile} />
        <Route path="/settings" component={Settings} />

        {/* 404 */}
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </SidebarLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "oklch(0.12 0.005 0)",
                border: "1px solid oklch(0.55 0.22 25 / 0.4)",
                color: "oklch(0.90 0.005 0)",
              },
            }}
          />
          <OnboardingWrapper>
            <Router />
          </OnboardingWrapper>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
