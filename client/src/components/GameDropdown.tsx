/**
 * GameDropdown — componente base unificado para todos los dropdowns del Perfil Competitivo.
 *
 * Características:
 * - Forma pill (border-radius completo)
 * - Fondo oscuro semitransparente
 * - Borde rojo activo / hover
 * - Panel flotante con animación suave (fade + slide)
 * - No usa <select> nativo
 * - Soporte para icono/prefijo personalizado por opción
 */

import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export interface DropdownOption {
  /** Valor interno (guardado en BD) */
  value: string;
  /** Texto mostrado en el pill y en el panel */
  label: string;
  /** Nodo React opcional que se muestra a la izquierda del label (icono SVG, punto de color, etc.) */
  prefix?: ReactNode;
  /** Texto secundario pequeño a la derecha dentro del panel */
  hint?: string;
}

interface GameDropdownProps {
  /** Lista de opciones */
  options: DropdownOption[];
  /** Valor actualmente seleccionado */
  value: string;
  /** Callback al seleccionar una opción */
  onChange: (value: string) => void;
  /** Texto cuando no hay selección */
  placeholder?: string;
  /** Deshabilitar el dropdown */
  disabled?: boolean;
  /** Etiqueta accesible para aria-label del listbox */
  ariaLabel?: string;
  /** Ancho mínimo del panel flotante (por defecto 200px) */
  minPanelWidth?: string;
  /** Máxima altura del panel antes de scroll (por defecto 280px) */
  maxPanelHeight?: string;
  /** Icono/prefijo del pill cuando hay selección (si no se pasa, usa option.prefix) */
  selectedPrefix?: ReactNode;
}

export function GameDropdown({
  options,
  value,
  onChange,
  placeholder = "Seleccionar",
  disabled = false,
  ariaLabel = "Seleccionar opción",
  minPanelWidth = "200px",
  maxPanelHeight = "280px",
}: GameDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  /* ── Cerrar al hacer clic fuera ── */
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  /* ── Cerrar con Escape ── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const toggle = () => {
    if (!disabled) setOpen((prev) => !prev);
  };

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      {/* ── Trigger pill ── */}
      <button
        type="button"
        disabled={disabled}
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          /* Base */
          "w-full flex items-center gap-2.5 px-4 py-2.5 rounded-full",
          "text-sm font-medium font-mono tracking-wide",
          "transition-all duration-200 ease-out",
          /* Colors */
          "text-white",
          /* Border */
          open
            ? "border border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]"
            : "border border-red-700/50 hover:border-red-500/80",
          /* Disabled */
          disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
          /* Focus */
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50",
        ].join(" ")}
      >
        {/* Left: prefix icon + label */}
        <span className="flex items-center gap-2 flex-1 min-w-0">
          {selected ? (
            <>
              {selected.prefix && (
                <span className="flex-shrink-0 flex items-center">{selected.prefix}</span>
              )}
              <span className="truncate">{selected.label}</span>
            </>
          ) : (
            <span className="text-white/40 truncate">{placeholder}</span>
          )}
        </span>

        {/* Right: chevron */}
        <ChevronDown
          className={[
            "w-4 h-4 flex-shrink-0 text-red-500/70 transition-transform duration-300",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {/* ── Floating panel ── */}
      <div
        role="listbox"
        aria-label={ariaLabel}
        style={{
          minWidth: minPanelWidth,
          maxHeight: open ? maxPanelHeight : "0px",
          transformOrigin: "top center",
          background: "#1a1d24",
        }}
        className={[
          "absolute left-0 top-full mt-2 z-50 w-full",
          "border border-red-900/40 rounded-2xl",
          "shadow-2xl shadow-black/70",
          "overflow-hidden overflow-y-auto",
          /* Smooth animation */
          "transition-all duration-200 ease-out",
          open
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 -translate-y-2 scale-95 pointer-events-none",
        ].join(" ")}
      >
        {/* Inner scroll container */}
        <div className="py-1.5">
          {options.length === 0 ? (
            <p className="px-4 py-3 text-xs text-white/30 font-mono text-center">
              Sin opciones disponibles
            </p>
          ) : (
            options.map((opt) => {
              const isActive = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={[
                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-mono",
                    "transition-colors duration-100",
                    isActive
                      ? "bg-red-950/50 text-red-400"
                      : "text-white/75 hover:bg-white/5 hover:text-white",
                  ].join(" ")}
                >
                  {/* Option prefix */}
                  {opt.prefix && (
                    <span
                      className={[
                        "flex-shrink-0 flex items-center transition-colors",
                        isActive ? "text-red-400" : "text-white/50",
                      ].join(" ")}
                    >
                      {opt.prefix}
                    </span>
                  )}

                  {/* Option label */}
                  <span className="flex-1 text-left">{opt.label}</span>

                  {/* Hint text */}
                  {opt.hint && (
                    <span className="text-xs text-white/25 ml-auto flex-shrink-0">{opt.hint}</span>
                  )}

                  {/* Active indicator dot */}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 ml-1" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
