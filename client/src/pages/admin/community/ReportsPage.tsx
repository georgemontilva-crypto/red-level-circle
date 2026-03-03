import { MessageSquareWarning } from "lucide-react";
import { PageHeader, EmptyState } from "../components/AdminUI";

export function ReportsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader icon={MessageSquareWarning} title="REPORTES" subtitle="Gestiona los reportes de la comunidad" />
      <EmptyState icon={MessageSquareWarning} title="Sistema de reportes próximamente" subtitle="Esta funcionalidad estará disponible en una próxima actualización" />
    </div>
  );
}
