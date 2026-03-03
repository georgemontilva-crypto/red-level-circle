import { Switch, Route } from "wouter";
import { BetsPage } from "./BetsPage";
import { ShopPage } from "./ShopPage";
import { CosmeticsPage } from "./CosmeticsPage";
import { RLCPage } from "./RLCPage";
import { RewardsPage } from "./RewardsPage";
import { Coins } from "lucide-react";
import { PageHeader } from "../components/AdminUI";

function MonetizationOverview() {
  return <PageHeader icon={Coins} title="MONETIZACIÓN" subtitle="Gestiona apuestas, tienda, cosméticos y RLC Coins" />;
}

export function MonetizationModule() {
  return (
    <Switch>
      <Route path="/admin/monetization/bets" component={BetsPage} />
      <Route path="/admin/monetization/shop" component={ShopPage} />
      <Route path="/admin/monetization/cosmetics" component={CosmeticsPage} />
      <Route path="/admin/monetization/rlc" component={RLCPage} />
      <Route path="/admin/monetization/rewards" component={RewardsPage} />
      <Route component={MonetizationOverview} />
    </Switch>
  );
}
