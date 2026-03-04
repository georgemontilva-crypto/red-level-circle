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
   * Total outer diameter of the container (image + border).
   * When provided, the frame is scaled so its inner hole aligns with
   * this diameter instead of the image-only size.
   * Example: size=96, border=4px each side → containerSize=104
   */
  containerSize?: number;
  className?: string;
}

/**
 * UserAvatar — Single source of truth for all profile pictures.
 *
 * Frame overlay rules:
 * - Cosmetic frame PNGs have a transparent inner hole that occupies ~67.58%
 *   of the total image radius (measured from Mask_Pinkorb.png).
 * - We scale the PNG so that its inner hole diameter equals `containerSize`
 *   (the full outer diameter including the border ring).
 * - Scale factor = containerSize / (containerSize * 0.6758)
 *               = 1 / 0.6758 ≈ 1.48 applied to containerSize.
 * - The outer div keeps the avatar image size; the frame overflows via
 *   `overflow: visible` so the ring sits exactly on the container edge.
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

  // Base diameter for frame calculation: prefer containerSize (full outer circle)
  // so the ring sits on the border edge, not inside the image.
  const baseDiameter = containerSize ?? px;

  // The inner transparent hole of the frame PNG is 67.58% of the total PNG width.
  // To make the hole = baseDiameter, we need PNG rendered at baseDiameter / 0.6758.
  const framePx = Math.round(baseDiameter / 0.6758);

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

      {/* Cosmetic frame overlay — inner hole aligned to containerSize */}
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
