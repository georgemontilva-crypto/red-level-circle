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
 *
 * The frame img is positioned absolutely relative to the OUTER wrapper,
 * which is sized to containerSize (not just the image). This ensures the
 * frame is centered on the full container including its border.
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

  // If containerSize provided, use it as the reference for frame positioning
  const outerPx = containerSize ?? px;

  // Cosmetic PNG size = (outerPx * 3.5) + 30px extra as requested.
  const framePx = Math.round(outerPx * 3.5) + 30;

  // Offset to center the avatar image within the outer container
  const offset = Math.round((outerPx - px) / 2);

  return (
    // Outer wrapper sized to containerSize — frame is positioned relative to this
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: outerPx, height: outerPx, overflow: "visible" }}
    >
      {/* Avatar image — centered inside the outer wrapper */}
      <div
        className="overflow-hidden bg-secondary flex items-center justify-center"
        style={{
          borderRadius: "50%",
          width: px,
          height: px,
          position: "absolute",
          top: offset,
          left: offset,
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

      {/* Cosmetic frame overlay — centered on the full outer container */}
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
            zIndex: 20,
          }}
          draggable={false}
        />
      )}
    </div>
  );
}
