import { useState, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { trpc } from "./lib/trpc";
import SidebarLayout from "./components/SidebarLayout";
import { useSSE } from "./hooks/useSSE";

// ── Critical routes (loaded eagerly — needed on first paint) ──────────────────
import Home from "./pages/Home";
import NotFound from "@/pages/NotFound";

// ── Lazy routes (loaded only when navigated to) ───────────────────────────────
const Login              = lazy(() => import("./pages/Login"));
const Tournaments        = lazy(() => import("./pages/Tournaments"));
const TournamentDetail   = lazy(() => import("./pages/TournamentDetail"));
const Dashboard          = lazy(() => import("./pages/Dashboard"));
const CreateTournament   = lazy(() => import("./pages/CreateTournament"));
const EditTournament     = lazy(() => import("./pages/EditTournament"));
const MyTournaments      = lazy(() => import("./pages/MyTournaments"));
const TournamentManage   = lazy(() => import("./pages/TournamentManage"));
const ManageRegistrations = lazy(() => import("./pages/ManageRegistrations"));
const MyTeams            = lazy(() => import("./pages/MyTeams"));
const Ranking            = lazy(() => import("./pages/Ranking"));
const Streams            = lazy(() => import("./pages/Streams"));
const StreamDetail       = lazy(() => import("./pages/StreamDetail"));
const Betting            = lazy(() => import("./pages/Betting"));
const TeamProfile        = lazy(() => import("./pages/TeamProfile"));
const Teams              = lazy(() => import("./pages/Teams"));
const Shop               = lazy(() => import("./pages/Shop"));
const BrandAds           = lazy(() => import("./pages/BrandAds"));
const AdminRouter        = lazy(() => import("./pages/admin"));
const UserProfile        = lazy(() => import("./pages/UserProfile"));
const Settings           = lazy(() => import("./pages/Settings"));
const Community          = lazy(() => import("./pages/Community"));
const Creators           = lazy(() => import("./pages/Creators"));
const OnboardingModal    = lazy(() => import("./components/OnboardingModal"));

// News exports named — wrap in lazy
const NewsListLazy    = lazy(() => import("./pages/News").then(m => ({ default: m.NewsList })));
const NewsArticleLazy = lazy(() => import("./pages/News").then(m => ({ default: m.NewsArticle })));
const AlliesPageLazy  = lazy(() => import("./pages/Allies").then(m => ({ default: m.AlliesPage })));
const Inventory       = lazy(() => import("./pages/Inventory"));
const Missions        = lazy(() => import("./pages/Missions"));
const CreatorMissions = lazy(() => import("./pages/CreatorMissions"));
const Store           = lazy(() => import("./pages/Store"));
const MyGallery       = lazy(() => import("./pages/MyGallery"));
const MatchPageLazy      = lazy(() => import("./pages/MatchPage"));
const OrganizerProfile   = lazy(() => import("./pages/OrganizerProfile"));
const Wallet             = lazy(() => import("./pages/Wallet"));

// ── Hidden apply pages (only reachable via direct button, not in nav) ─────────
const TOApply      = lazy(() => import("./pages/apply/TOApply"));
const PartnerApply = lazy(() => import("./pages/apply/RoleApply"));
const CreatorApply = lazy(() => import("./pages/apply/CreatorApply"));
const AllyApply    = lazy(() => import("./pages/apply/AllyApply"));

// Legal pages (very rarely visited)
const Terminos     = lazy(() => import("./pages/legal/terminos"));
const Privacidad   = lazy(() => import("./pages/legal/privacidad"));
const Cookies      = lazy(() => import("./pages/legal/cookies"));
const Tienda       = lazy(() => import("./pages/legal/tienda"));
const Aliados      = lazy(() => import("./pages/legal/aliados"));
const Devoluciones = lazy(() => import("./pages/legal/devoluciones"));

// ── Page loader fallback ──────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── Onboarding wrapper ────────────────────────────────────────────────────────
function OnboardingWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const { data: me } = trpc.auth.me.useQuery();
  // Connect to SSE stream for real-time updates (follows, banners, news, tournaments, allies)
  useSSE({ userId: me?.id ?? null });
  const utils = trpc.useUtils();
  const [dismissed, setDismissed] = useState(false);

  const meUser = me as { nickname?: string; loginMethod?: string } | undefined;
  const showOnboarding =
    !loading &&
    isAuthenticated &&
    !dismissed &&
    meUser &&
    !meUser.nickname;

  const handleComplete = () => {
    setDismissed(true);
    utils.auth.me.invalidate();
  };

  return (
    <>
      {children}
      {showOnboarding && (
        <Suspense fallback={null}>
          <OnboardingModal
            onComplete={handleComplete}
            loginMethod={(meUser as any)?.loginMethod}
          />
        </Suspense>
      )}
    </>
  );
}

// ── Router ────────────────────────────────────────────────────────────────────
function Router() {
  const [location] = useLocation();

  if (location === "/admin" || location.startsWith("/admin/")) {
    return (
      <Suspense fallback={<PageLoader />}>
        <AdminRouter />
      </Suspense>
    );
  }

  return (
    <Switch>
      {/* Hidden apply pages — no sidebar, no nav, only reachable via direct button */}
      <Route path="/apply/to">{() => <Suspense fallback={<PageLoader />}><TOApply /></Suspense>}</Route>
      <Route path="/apply/partner">{() => <Suspense fallback={<PageLoader />}><PartnerApply /></Suspense>}</Route>
      <Route path="/apply/creator">{() => <Suspense fallback={<PageLoader />}><CreatorApply /></Suspense>}</Route>
      <Route path="/apply/ally">{() => <Suspense fallback={<PageLoader />}><AllyApply /></Suspense>}</Route>

      {/* Blank page routes */}
      <Route path="/login">{() => <Suspense fallback={<PageLoader />}><Login /></Suspense>}</Route>
      <Route path="/legal/terminos">{() => <Suspense fallback={<PageLoader />}><Terminos /></Suspense>}</Route>
      <Route path="/legal/privacidad">{() => <Suspense fallback={<PageLoader />}><Privacidad /></Suspense>}</Route>
      <Route path="/legal/cookies">{() => <Suspense fallback={<PageLoader />}><Cookies /></Suspense>}</Route>
      <Route path="/legal/tienda">{() => <Suspense fallback={<PageLoader />}><Tienda /></Suspense>}</Route>
      <Route path="/legal/aliados">{() => <Suspense fallback={<PageLoader />}><Aliados /></Suspense>}</Route>
      <Route path="/legal/devoluciones">{() => <Suspense fallback={<PageLoader />}><Devoluciones /></Suspense>}</Route>

      {/* App routes with sidebar layout */}
      <Route>
        <SidebarLayout>
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/tournaments" component={Tournaments} />
              <Route path="/tournaments/:id" component={TournamentDetail} />
              <Route path="/match/:matchId" component={MatchPageLazy} />
              <Route path="/ranking" component={Ranking} />
              <Route path="/news" component={NewsListLazy} />
              <Route path="/news/:slug" component={NewsArticleLazy} />
              <Route path="/streams" component={Streams} />
              <Route path="/streams/:id" component={StreamDetail} />
              <Route path="/betting" component={Betting} />
              <Route path="/teams" component={Teams} />
              <Route path="/teams/:id" component={TeamProfile} />
              <Route path="/shop/cosmetics">{() => { window.location.replace("/shop?tab=cosmetics"); return null; }}</Route>
              <Route path="/shop" component={Shop} />
              <Route path="/ads" component={BrandAds} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/dashboard/create-tournament" component={CreateTournament} />
              <Route path="/dashboard/edit-tournament/:id" component={EditTournament} />
              <Route path="/dashboard/tournaments" component={MyTournaments} />
              <Route path="/dashboard/tournament/:id" component={TournamentManage} />
              <Route path="/dashboard/registrations" component={ManageRegistrations} />
              <Route path="/dashboard/teams" component={MyTeams} />
              <Route path="/community" component={Community} />
              <Route path="/creators" component={Creators} />
              <Route path="/allies" component={AlliesPageLazy} />
              <Route path="/missions" component={Missions} />
              <Route path="/creator-missions" component={CreatorMissions} />
              <Route path="/profile/:id" component={UserProfile} />
              <Route path="/organizer/:id" component={OrganizerProfile} />
              <Route path="/store/collections/:slug" component={Store} />
              <Route path="/store/collections" component={Store} />
              <Route path="/store/physical" component={Store} />
              <Route path="/store/cosmetics" component={Store} />
              <Route path="/store" component={Store} />
              <Route path="/wallet" component={Wallet} />
              <Route path="/inventory" component={Inventory} />
              <Route path="/gallery">{() => <Suspense fallback={<PageLoader />}><MyGallery /></Suspense>}</Route>
              <Route path="/settings" component={Settings} />
              <Route path="/404" component={NotFound} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </SidebarLayout>
      </Route>
    </Switch>
  );
}

// ── App root ──────────────────────────────────────────────────────────────────
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "#1a1d24",
                border: "1px solid rgba(220,38,38,0.4)",
                color: "#ffffff",
                boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
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
