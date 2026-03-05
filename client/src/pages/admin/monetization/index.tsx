import { useLocation } from "wouter";
import { BetsPage } from "./BetsPage";
import { ShopPage } from "./ShopPage";
import { CosmeticsPage } from "./CosmeticsPage";
import { RLCPage } from "./RLCPage";
import { Coins } from "lucide-react";
import { PageHeader } from "../components/AdminUI";

function MonetizationOverview() {
  return <PageHeader icon={Coins} title="MONETIZACIÓN" subtitle="Gestiona apuestas, tienda, cosméticos y RLC Coins" />;
}

export function MonetizationModule() {
  const [location] = useLocation();
  if (location.startsWith("/admin/monetization/bets")) return <BetsPage />;
  if (location.startsWith("/admin/monetization/shop")) return <ShopPage />;
  if (location.startsWith("/admin/monetization/cosmetics")) return <CosmeticsPage />;
  if (location.startsWith("/admin/monetization/rlc")) return <RLCPage />;
  return <MonetizationOverview />;
}
