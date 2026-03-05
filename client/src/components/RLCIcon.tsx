import React from "react";

interface RLCIconProps {
  size?: number;
  className?: string;
}

/**
 * Icono de la moneda RLC (Red Level Circle Coin).
 * Usa el asset público /rlccoin.webp.
 */
export const RLCIcon: React.FC<RLCIconProps> = ({ size = 16, className = "" }) => (
  <img
    src="/rlccoin.webp"
    alt="RLC"
    width={size}
    height={size}
    className={`inline-block object-contain flex-shrink-0 ${className}`}
    style={{ width: size, height: size }}
  />
);

export default RLCIcon;
