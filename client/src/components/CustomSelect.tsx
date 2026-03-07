import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface CustomSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  label?: string;
  className?: string;
  /** Tamaño: "sm" para inputs pequeños (inline), "md" para formularios (default) */
  size?: "sm" | "md";
}

/**
 * Dropdown custom con estética RLC.
 * Reemplaza <select> nativo para evitar el estilo blanco del sistema operativo.
 */
export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  label,
  className = "",
  size = "md",
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);
  const isMd = size === "md";

  return (
    <div className={`relative ${className}`} ref={ref}>
      {label && (
        <label className="block text-xs font-display tracking-wider text-muted-foreground mb-2">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between transition-all duration-200"
        style={{
          padding: isMd ? "0.75rem 1rem" : "0.5rem 0.75rem",
          borderRadius: "0.75rem",
          background: "var(--bg-main, #0d0f14)",
          border: `1px solid ${open ? "oklch(0.55 0.22 25)" : "oklch(0.22 0.01 0)"}`,
          boxShadow: open ? "0 0 8px oklch(0.55 0.22 25 / 0.25)" : "none",
          color: selected ? "var(--text-primary, #e5e7eb)" : "oklch(0.45 0.005 0)",
          fontSize: isMd ? "0.875rem" : "0.75rem",
          outline: "none",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <span className={selected ? "" : "opacity-50"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={isMd ? 14 : 12}
          style={{
            color: "oklch(0.50 0.005 0)",
            flexShrink: 0,
            marginLeft: "0.5rem",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute z-[9999] w-full mt-1 rounded-xl overflow-hidden"
          style={{
            background: "#13161d",
            border: "1px solid oklch(0.25 0.01 0)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px oklch(0.55 0.22 25 / 0.15)",
            maxHeight: "260px",
            overflowY: "auto",
          }}
        >
          {placeholder && (
            <div
              className="px-4 py-2.5 text-xs cursor-pointer transition-colors duration-100"
              style={{ color: "oklch(0.40 0.005 0)", borderBottom: "1px solid oklch(0.18 0.01 0)" }}
              onClick={() => { onChange(""); setOpen(false); }}
            >
              {placeholder}
            </div>
          )}
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <div
                key={opt.value}
                className="px-4 py-2.5 cursor-pointer transition-colors duration-100"
                style={{
                  fontSize: isMd ? "0.875rem" : "0.75rem",
                  color: isActive ? "oklch(0.85 0.22 25)" : "oklch(0.75 0.005 0)",
                  background: isActive ? "oklch(0.55 0.22 25 / 0.12)" : "transparent",
                  borderLeft: isActive ? "2px solid oklch(0.55 0.22 25)" : "2px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "oklch(0.55 0.22 25 / 0.06)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "transparent";
                }}
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
