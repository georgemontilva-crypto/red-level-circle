import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";

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
 * The cosmetic frame is rendered via a React Portal directly into document.body
 * with `position: fixed` using viewport-relative coordinates from
 * getBoundingClientRect(). Using `fixed` (not `absolute`) ensures the frame
 * stays correctly positioned over the avatar regardless of page scroll,
 * which is critical for avatars inside `position: fixed` headers.
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

  const avatarRef = useRef<HTMLDivElement>(null);
  // Viewport-relative center coordinates (for position: fixed)
  const [framePos, setFramePos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!activeFrameImage) return;

    const updatePos = () => {
      if (!avatarRef.current) return;
      const rect = avatarRef.current.getBoundingClientRect();
      // Use viewport-relative coords (no scrollX/scrollY) — works correctly
      // with both position:fixed headers and normal scrollable content.
      setFramePos({
        top: rect.top + rect.height / 2,
        left: rect.left + rect.width / 2,
      });
    };

    updatePos();

    window.addEventListener("resize", updatePos, { passive: true });
    window.addEventListener("scroll", updatePos, { passive: true });

    const ro = new ResizeObserver(updatePos);
    if (avatarRef.current) ro.observe(avatarRef.current);

    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos);
      ro.disconnect();
    };
  }, [activeFrameImage]);

  return (
    <>
      {/* Avatar wrapper — reference point for frame positioning */}
      <div
        ref={avatarRef}
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
      </div>

      {/* Cosmetic frame — rendered via Portal into document.body.
          Uses position:fixed + viewport-relative coords so it always overlays
          the avatar correctly, even when inside a position:fixed header. */}
      {activeFrameImage && framePos &&
        createPortal(
          <img
            src={activeFrameImage}
            alt="frame"
            style={{
              position: "fixed",
              width: framePx,
              height: framePx,
              top: framePos.top,
              left: framePos.left,
              transform: "translate(-50%, -50%)",
              objectFit: "contain",
              pointerEvents: "none",
              zIndex: 99999,
            }}
            draggable={false}
          />,
          document.body
        )
      }
    </>
  );
}
