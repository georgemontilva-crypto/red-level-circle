import React from "react";

/**
 * Semantic size tokens for avatars across the platform.
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
   * When provided, the frame is centered on this diameter.
   */
  containerSize?: number;
  className?: string;
}

/**
 * UserAvatar — Single source of truth for all profile pictures.
 *
 * The cosmetic frame is rendered directly inside the avatar container using
 * `position: absolute` + `overflow: visible`. No portals, no coordinate
 * calculations — the frame always sits exactly over its own avatar,
 * regardless of scroll position, z-index stacking context, or layout context.
 *
 * The parent element must allow overflow:visible (not clip it) for the frame
 * to be fully visible when it extends beyond the avatar bounds.
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
  const outerPx = containerSize ?? px;
  // Multiplier 1.5017x: inner hole of the PNG = avatar diameter
  const framePx = Math.round(outerPx * 1.5017);

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: outerPx, height: outerPx, overflow: "visible" }}
    >
      {/* Avatar image */}
      <div
        className="overflow-hidden bg-secondary flex items-center justify-center"
        style={{
          borderRadius: "50%",
          width: px,
          height: px,
          position: "absolute",
          top: Math.round((outerPx - px) / 2),
          left: Math.round((outerPx - px) / 2),
        }}
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

      {/* Cosmetic frame — positioned absolutely inside the avatar container.
          Centered using negative offset: left/top = (outerPx - framePx) / 2
          This always overlays exactly this avatar, no portals needed. */}
      {activeFrameImage && (
        <img
          src={activeFrameImage}
          alt="frame"
          style={{
            position: "absolute",
            width: framePx,
            height: framePx,
            top: Math.round((outerPx - framePx) / 2),
            left: Math.round((outerPx - framePx) / 2),
            objectFit: "contain",
            pointerEvents: "none",
            zIndex: 10,
          }}
          draggable={false}
        />
      )}
    </div>
  );
}
