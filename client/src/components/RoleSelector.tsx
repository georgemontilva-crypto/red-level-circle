import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { GameRoleData } from "../../../shared/gameRoles";

interface RoleSelectorProps {
  roles: GameRoleData[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

function RoleIcon({ svgPath, label }: { svgPath: string | null; label: string }) {
  if (!svgPath) {
    return (
      <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-current opacity-70">
        {label.charAt(0)}
      </span>
    );
  }
  return (
    <img
      src={svgPath}
      alt={label}
      className="w-4 h-4 object-contain"
      style={{ filter: "invert(1)" }}
      aria-hidden="true"
    />
  );
}

export function RoleSelector({
  roles,
  value,
  onChange,
  disabled = false,
  placeholder = "Seleccionar rol",
}: RoleSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = roles.find((r) => r.value === value);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger pill */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={[
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
          "border border-red-600/70 bg-black/60 text-white",
          "hover:border-red-500 hover:bg-black/80",
          "focus:outline-none focus:ring-2 focus:ring-red-500/50",
          disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
          open ? "border-red-500 bg-black/80 ring-2 ring-red-500/30" : "",
        ].join(" ")}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <>
            <RoleIcon svgPath={selected.svgPath} label={selected.label} />
            <span>{selected.label}</span>
          </>
        ) : (
          <span className="text-white/50">{placeholder}</span>
        )}
        <ChevronDown
          className={[
            "w-3.5 h-3.5 text-white/60 transition-transform duration-300 ml-0.5",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {/* Floating panel */}
      <div
        role="listbox"
        aria-label="Seleccionar rol"
        className={[
          "absolute left-0 top-full mt-2 z-50 min-w-[180px]",
          "bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl shadow-black/60",
          "overflow-hidden",
          "transition-all duration-200 origin-top",
          open
            ? "opacity-100 scale-y-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-y-95 -translate-y-1 pointer-events-none",
        ].join(" ")}
        style={{ transformOrigin: "top center" }}
      >
        <div className="py-1.5">
          {roles.map((role) => {
            const isActive = role.value === value;
            return (
              <button
                key={role.value}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onChange(role.value);
                  setOpen(false);
                }}
                className={[
                  "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150",
                  "hover:bg-white/8",
                  isActive
                    ? "text-red-400 bg-red-950/40"
                    : "text-white/80",
                ].join(" ")}
              >
                {/* Icon wrapper with red tint when active */}
                <span
                  className={[
                    "flex-shrink-0 transition-colors",
                    isActive ? "text-red-400" : "text-white/60",
                  ].join(" ")}
                >
                  <RoleIcon svgPath={role.svgPath} label={role.label} />
                </span>
                <span className="flex-1 text-left font-medium">{role.label}</span>
                {role.description && (
                  <span className="text-xs text-white/30 ml-auto">{role.description}</span>
                )}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 ml-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
