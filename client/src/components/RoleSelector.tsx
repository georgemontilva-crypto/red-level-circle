/**
 * RoleSelector — wrapper de GameDropdown para roles de juego.
 * Muestra el icono SVG del rol como prefix en cada opción.
 */

import { GameDropdown, DropdownOption } from "./GameDropdown";
import { GameRoleData } from "../../../shared/gameRoles";

interface RoleSelectorProps {
  roles: GameRoleData[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

function RolePrefix({ svgPath, label }: { svgPath: string | null; label: string }) {
  if (!svgPath) {
    return (
      <span className="w-4 h-4 flex items-center justify-center text-[10px] font-bold opacity-60">
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
  const options: DropdownOption[] = roles.map((r) => ({
    value: r.value,
    label: r.label,
    prefix: <RolePrefix svgPath={r.svgPath} label={r.label} />,
    hint: r.description,
  }));

  return (
    <GameDropdown
      options={options}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      ariaLabel="Seleccionar rol"
      minPanelWidth="180px"
    />
  );
}
