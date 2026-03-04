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
  /**
   * When true, the frame is rendered via a React Portal into document.body
   * using position:fixed + viewport coords. Use this ONLY for prominent
   * single avatars (TopNav header, profile page hero) where the frame must
   * visually extend beyond clipping ancestors.
   *
   * When false (default), the frame is rendered inline with position:absolute
   * and overflow:visible. This is safe for lists and grids where many avatars
   * are visible at once — each frame stays exactly over its own avatar.
   */
  framePortal?: boolean;
}

/**
 * UserAvatar — Single source of truth for all profile pictures.
 *
 * Frame rendering modes:
 * - framePortal=false (default): frame is position:absolute inside the
 *   avatar container with overflow:visible. Always on top of its own avatar.
 *   Safe for lists/grids with many avatars.
 * - framePortal=true: frame is rendered via Portal into document.body with
 *   position:fixed + viewport coords. Use only for single prominent avatars
 *   (TopNav, profile hero) where the frame must escape clipping ancestors.
 */
export function UserAvatar({
  avatar,
  name,
  activeFrameImage,
  size = "md",
  containerSize,
  className = "",
  framePortal = false,
}: UserAvatarProps) {
  const px = typeof size === "number" ? size : AVATAR_SIZES[size];
  const initials = name ? name.trim().charAt(0).toUpperCase() : "?";
  const outerPx = containerSize ?? px;
  // Multiplier 1.5017x: inner hole of the PNG = avatar diameter
  const framePx = Math.round(outerPx * 1.5017);

  // Portal mode: track viewport-relative center of the avatar
  const avatarRef = useRef<HTMLDivElement>(null);
  const [framePos, setFramePos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!activeFrameImage || !framePortal) return;

    const updatePos = () => {
      if (!avatarRef.current) return;
      const rect = avatarRef.current.getBoundingClientRect();
      // Viewport-relative coords for position:fixed
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
  }, [activeFrameImage, framePortal]);

  const avatarImage = (
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
  );

  // Inline frame: position:absolute, extends outside via overflow:visible
  const inlineFrame = activeFrameImage && !framePortal && (
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
  );

  // Portal frame: position:fixed, viewport coords, escapes all clipping
  const portalFrame = activeFrameImage && framePortal && framePos &&
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
    );

  return (
    <>
      <div
        ref={framePortal ? avatarRef : undefined}
        className={`relative shrink-0 ${className}`}
        style={{ width: outerPx, height: outerPx, overflow: "visible" }}
      >
        {avatarImage}
        {inlineFrame}
      </div>
      {portalFrame}
    </>
  );
}
