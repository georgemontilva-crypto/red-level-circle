/**
 * RankSelector — wrapper de GameDropdown para rangos/ELO.
 * Muestra un punto de color del tier como prefix en cada opción.
 */

import { GameDropdown, DropdownOption } from "./GameDropdown";
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
  const options: DropdownOption[] = ranks.map((r) => ({
    value: r.value,
    label: r.label,
    prefix: (
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-white/10"
        style={{ backgroundColor: r.color }}
      />
    ),
  }));

  return (
    <GameDropdown
      options={options}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      ariaLabel="Seleccionar rango"
      minPanelWidth="200px"
      maxPanelHeight="260px"
    />
  );
}
