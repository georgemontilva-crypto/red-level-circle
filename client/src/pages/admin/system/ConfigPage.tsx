import { Settings } from "lucide-react";
import { PageHeader, EmptyState } from "../components/AdminUI";

export function ConfigPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader icon={Settings} title="CONFIGURACIÓN" subtitle="Ajustes globales de la plataforma" />
      <EmptyState icon={Settings} title="Configuración próximamente" subtitle="Esta sección estará disponible en una próxima actualización" />
    </div>
  );
}
