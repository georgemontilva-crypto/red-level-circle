/**
 * DateTimePicker — RLC custom component
 *
 * Replaces the native datetime-local input with a styled calendar
 * that matches the RLC dark aesthetic (bg #16191f, red accents).
 *
 * Value format: "YYYY-MM-DDTHH:mm" (same as datetime-local)
 */

import { useState, useRef, useEffect } from "react";
import { Calendar, Clock, ChevronLeft, ChevronRight, X } from "lucide-react";

const DAYS = ["DO", "LU", "MA", "MI", "JU", "VI", "SA"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDatetimeLocal(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocal(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

interface DateTimePickerProps {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

export function DateTimePicker({ label, value, onChange, placeholder }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const ref = useRef<HTMLDivElement>(null);

  const selected = fromDatetimeLocal(value);

  // Sync time pickers when value changes externally
  useEffect(() => {
    if (selected) {
      setHour(pad(selected.getHours()));
      setMinute(pad(selected.getMinutes()));
      setViewYear(selected.getFullYear());
      setViewMonth(selected.getMonth());
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function emitChange(date: Date) {
    const syntheticEvent = {
      target: { value: toDatetimeLocal(date) },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(syntheticEvent);
  }

  function selectDay(day: number) {
    const h = parseInt(hour, 10) || 0;
    const m = parseInt(minute, 10) || 0;
    const d = new Date(viewYear, viewMonth, day, h, m);
    emitChange(d);
    setOpen(false);
  }

  function applyTime() {
    const base = selected ?? new Date(viewYear, viewMonth, 1);
    const h = parseInt(hour, 10) || 0;
    const m = parseInt(minute, 10) || 0;
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m);
    emitChange(d);
  }

  function clear() {
    const syntheticEvent = {
      target: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(syntheticEvent);
  }

  // Build calendar days
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null);

  const displayValue = selected
    ? `${pad(selected.getDate())}/${pad(selected.getMonth() + 1)}/${selected.getFullYear()}  ${pad(selected.getHours())}:${pad(selected.getMinutes())}`
    : "";

  const isToday = (day: number) => {
    const now = new Date();
    return day === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();
  };

  const isSelected = (day: number) =>
    selected &&
    day === selected.getDate() &&
    viewMonth === selected.getMonth() &&
    viewYear === selected.getFullYear();

  return (
    <div className="relative w-full" ref={ref}>
      {label && (
        <label className="block font-mono text-xs tracking-widest text-zinc-400 mb-1 uppercase">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-left transition-all"
        style={{
          background: "var(--bg-main, #16191f)",
          border: open ? "1.5px solid #dc2626" : "1.5px solid #22262e",
          color: displayValue ? "#fff" : "#52525b",
          fontFamily: "inherit",
          fontSize: "0.875rem",
        }}
      >
        <Calendar className="w-4 h-4 text-zinc-500 flex-shrink-0" />
        <span className="flex-1 font-mono">
          {displayValue || (placeholder ?? "dd/mm/aaaa  --:--")}
        </span>
        {value && (
          <X
            className="w-4 h-4 text-zinc-500 hover:text-red-400 transition-colors"
            onClick={(e) => { e.stopPropagation(); clear(); }}
          />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 mt-2 rounded-xl shadow-2xl overflow-hidden"
          style={{
            background: "#0e1014",
            border: "1.5px solid #22262e",
            minWidth: "300px",
          }}
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #22262e" }}>
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
                else setViewMonth((m) => m - 1);
              }}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-orbitron font-bold text-sm text-white tracking-wider">
              {MONTHS[viewMonth].toUpperCase()} {viewYear}
            </span>
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
                else setViewMonth((m) => m + 1);
              }}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 px-3 pt-3 pb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-mono text-zinc-500 pb-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 px-3 pb-3 gap-y-1">
            {cells.map((day, idx) => (
              <div key={idx} className="flex items-center justify-center">
                {day ? (
                  <button
                    type="button"
                    onClick={() => selectDay(day)}
                    className="w-8 h-8 rounded-lg text-sm font-mono transition-all"
                    style={{
                      background: isSelected(day)
                        ? "#dc2626"
                        : isToday(day)
                        ? "rgba(220,38,38,0.15)"
                        : "transparent",
                      color: isSelected(day)
                        ? "#fff"
                        : isToday(day)
                        ? "#dc2626"
                        : "#d4d4d8",
                      fontWeight: isSelected(day) || isToday(day) ? "700" : "400",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected(day))
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected(day))
                        (e.currentTarget as HTMLButtonElement).style.background = isToday(day)
                          ? "rgba(220,38,38,0.15)"
                          : "transparent";
                    }}
                  >
                    {day}
                  </button>
                ) : (
                  <div className="w-8 h-8" />
                )}
              </div>
            ))}
          </div>

          {/* Time picker */}
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderTop: "1px solid #22262e" }}
          >
            <Clock className="w-4 h-4 text-zinc-500 flex-shrink-0" />
            <span className="text-xs font-mono text-zinc-400">HORA</span>
            <div className="flex items-center gap-1 ml-auto">
              <input
                type="number"
                min={0}
                max={23}
                value={hour}
                onChange={(e) => setHour(pad(Math.min(23, Math.max(0, parseInt(e.target.value) || 0))))}
                onBlur={applyTime}
                className="w-12 text-center font-mono text-sm rounded-lg px-2 py-1 outline-none"
                style={{
                  background: "#16191f",
                  border: "1px solid #22262e",
                  color: "#fff",
                }}
              />
              <span className="text-zinc-400 font-bold">:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={minute}
                onChange={(e) => setMinute(pad(Math.min(59, Math.max(0, parseInt(e.target.value) || 0))))}
                onBlur={applyTime}
                className="w-12 text-center font-mono text-sm rounded-lg px-2 py-1 outline-none"
                style={{
                  background: "#16191f",
                  border: "1px solid #22262e",
                  color: "#fff",
                }}
              />
            </div>
            <button
              type="button"
              onClick={applyTime}
              className="text-xs font-mono text-red-400 hover:text-red-300 transition-colors ml-2"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
