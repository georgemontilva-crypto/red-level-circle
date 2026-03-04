import React from "react";

/**
 * Semantic size tokens for avatars across the platform.
 * All avatars are stored at 288x288 px; CSS controls the display size.
 */
export const AVATAR_SIZES = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
  "2xl": 96,
  "3xl": 128,
} as const;

export type AvatarSizeToken = keyof typeof AVATAR_SIZES;

interface UserAvatarProps {
  avatar?: string | null;
  name?: string | null;
  activeFrameImage?: string | null;
  /** Numeric pixel size OR a semantic token — the avatar image diameter */
  size?: number | AvatarSizeToken;
  /**
   * Total outer diameter of the container (image + border px on each side × 2).
   * When provided, the frame outer ring edge aligns with this diameter.
   * Example: size=96, border=4px each side → containerSize=104
   */
  containerSize?: number;
  className?: string;
}

/**
 * UserAvatar — Single source of truth for all profile pictures.
 *
 * Frame overlay rules (measured from Mask_Pinkorb.png 384×384):
 * - The outer edge of the ring (including flame tips) sits at avg radius 153.9px
 *   out of 192px total → ratio = 0.8014
 * - To make the outer ring edge align with containerSize:
 *   framePx = containerSize / 0.8014 ≈ containerSize × 1.248
 * - The inner transparent hole sits at avg radius 111.1px → ratio 0.5788
 *   so the hole diameter = framePx × 0.5788 × 2 / framePx ... handled by scale
 * - The outer div keeps the avatar image size; the frame overflows via
 *   `overflow: visible` so the ring sits on the container circumference.
 */
export function UserAvatar({
  avatar,
  name,
  activeFrameImage,
  size = "md",
  containerSize,
  className = "",
}: UserAvatarProps) {
  const px = typeof size === "number" ? size : AVATAR_SIZES[size];
  const initials = name ? name.trim().charAt(0).toUpperCase() : "?";

  // Base diameter: use containerSize if provided (full outer circle incl. border)
  const baseDiameter = containerSize ?? px;

  // The outer ring edge of the frame PNG sits at 80.14% of the total PNG radius.
  // To make the outer ring edge = baseDiameter, scale = baseDiameter / 0.8014
  const framePx = Math.round(baseDiameter / 0.8014);

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: px, height: px, overflow: "visible" }}
    >
      {/* Base avatar — always circular */}
      <div
        className="w-full h-full overflow-hidden bg-secondary flex items-center justify-center"
        style={{ borderRadius: "50%", width: px, height: px }}
      >
        {avatar ? (
          <img
            src={avatar || undefined}
            alt={name ?? "avatar"}
            className="w-full h-full object-cover"
            style={{ borderRadius: "50%" }}
            draggable={false}
          />
        ) : (
          <span
            className="font-bold text-muted-foreground select-none"
            style={{ fontSize: Math.max(10, Math.round(px * 0.38)) }}
          >
            {initials}
          </span>
        )}
      </div>

      {/* Cosmetic frame overlay — outer ring edge aligned to containerSize */}
      {activeFrameImage && (
        <img
          src={activeFrameImage}
          alt="frame"
          className="absolute pointer-events-none"
          style={{
            width: framePx,
            height: framePx,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            objectFit: "contain",
            zIndex: 10,
          }}
          draggable={false}
        />
      )}
    </div>
  );
}
