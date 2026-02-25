import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { GameRankData } from "../../../shared/gameRoles";

interface RankSelectorProps {
  ranks: GameRankData[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function RankSelector({
  ranks,
  value,
  onChange,
  disabled = false,
  placeholder = "Seleccionar rango",
}: RankSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = ranks.find((r) => r.value === value);

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
            {/* Colored dot for rank tier */}
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: selected.color }}
            />
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
        aria-label="Seleccionar rango"
        className={[
          "absolute left-0 top-full mt-2 z-50 min-w-[200px] max-h-64 overflow-y-auto",
          "bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl shadow-black/60",
          "transition-all duration-200 origin-top",
          open
            ? "opacity-100 scale-y-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-y-95 -translate-y-1 pointer-events-none",
        ].join(" ")}
        style={{ transformOrigin: "top center" }}
      >
        <div className="py-1.5">
          {ranks.map((rank) => {
            const isActive = rank.value === value;
            return (
              <button
                key={rank.value}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onChange(rank.value);
                  setOpen(false);
                }}
                className={[
                  "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150",
                  "hover:bg-white/8",
                  isActive
                    ? "bg-white/5"
                    : "text-white/80",
                ].join(" ")}
              >
                {/* Rank color dot */}
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-white/10"
                  style={{ backgroundColor: rank.color }}
                />
                <span
                  className="flex-1 text-left font-medium"
                  style={{ color: isActive ? rank.color : undefined }}
                >
                  {rank.label}
                </span>
                {isActive && (
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: rank.color }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
