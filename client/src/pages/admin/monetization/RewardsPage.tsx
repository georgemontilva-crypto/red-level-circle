import { Gift } from "lucide-react";
import { PageHeader, EmptyState } from "../components/AdminUI";

export function RewardsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader icon={Gift} title="RECOMPENSAS" subtitle="Gestiona el sistema de recompensas y misiones" />
      <EmptyState icon={Gift} title="Sistema de recompensas próximamente" subtitle="Esta sección estará disponible en una próxima actualización" />
    </div>
  );
}
