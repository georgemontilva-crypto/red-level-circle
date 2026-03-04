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
  /** Numeric pixel size OR a semantic token */
  size?: number | AvatarSizeToken;
  className?: string;
}

/**
 * UserAvatar — Single source of truth for all profile pictures.
 *
 * Frame overlay rules:
 * - The PNG cosmetic is designed as a ring/frame that fits exactly over a circle.
 * - We render it at 100% of the avatar diameter so the frame sits precisely
 *   on the circumference of the circle (no overhang).
 * - The outer container keeps the original avatar size so layout is
 *   unaffected; the frame overflows via `overflow: visible`.
 */
export function UserAvatar({
  avatar,
  name,
  activeFrameImage,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const px = typeof size === "number" ? size : AVATAR_SIZES[size];
  const initials = name ? name.trim().charAt(0).toUpperCase() : "?";
  // Frame at 100% so it matches exactly the circumference of the circle
  const framePx = px;

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

      {/* Cosmetic frame overlay — 100% of avatar diameter, centered on circle */}
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
