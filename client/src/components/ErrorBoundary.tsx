import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  reloading: boolean;
}

/**
 * Detecta si el error es por un chunk de JS obsoleto tras un nuevo deploy.
 * Ocurre cuando el navegador tiene cacheado el HTML viejo y los hashes de los
 * bundles ya no existen en el servidor.
 */
function isChunkLoadError(error: Error | null): boolean {
  if (!error) return false;
  const msg = error.message ?? "";
  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("Unable to preload CSS") ||
    msg.includes("ChunkLoadError") ||
    msg.includes("Loading chunk") ||
    msg.includes("Loading CSS chunk")
  );
}

const RELOAD_KEY = "rlc_chunk_reload_at";
const RELOAD_COOLDOWN_MS = 10_000; // no recargar más de 1 vez cada 10s

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, reloading: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidUpdate(_: Props, prevState: State) {
    const { hasError, error, reloading } = this.state;
    if (hasError && !reloading && isChunkLoadError(error)) {
      const lastReload = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
      const now = Date.now();
      if (now - lastReload > RELOAD_COOLDOWN_MS) {
        sessionStorage.setItem(RELOAD_KEY, String(now));
        this.setState({ reloading: true });
        window.location.reload();
      }
    }
  }

  render() {
    const { hasError, error, reloading } = this.state;

    if (hasError) {
      // Si es un chunk obsoleto y aún no recargamos, mostrar spinner de espera
      if (isChunkLoadError(error) || reloading) {
        return (
          <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Actualizando la aplicación…</p>
            </div>
          </div>
        );
      }

      // Error genérico — mostrar pantalla de error normal
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4">An unexpected error occurred.</h2>

            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
              <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                {error?.message}
              </pre>
            </div>

            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
