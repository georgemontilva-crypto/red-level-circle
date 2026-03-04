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
  /** Cosmetic frame image (PNG/GIF/WebP with transparent background, square canvas) */
  activeFrameImage?: string | null;
  /** Numeric pixel size OR a semantic token — sets the outer container size */
  size?: number | AvatarSizeToken;
  /**
   * @deprecated Use `size` instead. Kept for backwards compatibility.
   * When provided, used as the outer container size.
   */
  containerSize?: number;
  className?: string;
  /**
   * @deprecated No longer needed. The new architecture renders all layers
   * inline with percentage-based positioning — no portals required.
   * Kept for backwards compatibility but has no effect.
   */
  framePortal?: boolean;
  /**
   * Color for the ring border drawn directly on the avatar circle.
   * Pass a CSS color value (e.g. "#FFD700", "var(--accent-red)").
   * The ring is applied as a box-shadow on the avatar image layer so it
   * always aligns perfectly with the visible circle regardless of frame size.
   */
  ringColor?: string;
  /** Ring width in pixels. Defaults to 2. */
  ringWidth?: number;
}

/**
 * UserAvatar — Discord-style layered avatar component.
 *
 * Architecture:
 * ┌─────────────────────────────────────────────────────┐
 * │  Outer container  (position: relative, square)      │
 * │  ┌─────────────────────────────────────────────┐    │
 * │  │  Avatar image  (inset: 16.7%, z-index: 1)   │    │
 * │  │  Frame layer   (inset: 0,     z-index: 2)   │    │
 * │  └─────────────────────────────────────────────┘    │
 * └─────────────────────────────────────────────────────┘
 *
 * All layers use position:absolute with percentage-based insets so they
 * scale perfectly at any size without pixel calculations or portals.
 *
 * The frame PNG must follow the cosmetic asset guidelines:
 *   • Square canvas (e.g. 512×512)
 *   • Transparent background
 *   • Circular cutout centered — the cutout diameter ≈ canvas × 0.666
 *     (so the frame ring extends ~16.7% beyond the avatar on each side)
 */
export function UserAvatar({
  avatar,
  name,
  activeFrameImage,
  size = "md",
  containerSize,
  className = "",
  // Deprecated props — kept for API compatibility, no effect
  framePortal: _framePortal,
  ringColor,
  ringWidth = 2,
}: UserAvatarProps) {
  const outerPx = containerSize ?? (typeof size === "number" ? size : AVATAR_SIZES[size]);
  const initials = name ? name.trim().charAt(0).toUpperCase() : "?";

  // The avatar image sits inset from the container edges.
  // The frame PNG is designed so its inner hole = 66.6% of the canvas.
  // Therefore the avatar must occupy 66.6% of the container,
  // centered → inset = (100% - 66.6%) / 2 ≈ 16.7% on each side.
  const avatarInset = "16.7%";

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{
        width: outerPx,
        height: outerPx,
        overflow: "visible",
        flexShrink: 0,
      }}
    >
      {/* ── Layer 1: Avatar image ── */}
      <div
        style={{
          position: "absolute",
          inset: avatarInset,
          borderRadius: "50%",
          overflow: "hidden",
          zIndex: 1,
          background: "var(--bg-card, #1a1d23)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // Ring border applied directly on the avatar circle
          boxShadow: ringColor
            ? `0 0 0 ${ringWidth}px ${ringColor}`
            : undefined,
        }}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={name ?? "avatar"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "50%",
              display: "block",
            }}
            draggable={false}
          />
        ) : (
          <span
            style={{
              fontSize: `${Math.max(10, Math.round(outerPx * 0.25))}px`,
              fontWeight: 700,
              color: "var(--text-muted, #888)",
              userSelect: "none",
              lineHeight: 1,
            }}
          >
            {initials}
          </span>
        )}
      </div>

      {/* ── Layer 2: Cosmetic frame ── */}
      {activeFrameImage && (
        <img
          src={activeFrameImage}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
            zIndex: 2,
          }}
          draggable={false}
        />
      )}
    </div>
  );
}
