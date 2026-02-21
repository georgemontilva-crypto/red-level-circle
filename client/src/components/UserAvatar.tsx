import React from "react";

interface UserAvatarProps {
  avatar?: string | null;
  name?: string | null;
  activeFrameImage?: string | null;
  size?: number; // px
  className?: string;
}

/**
 * UserAvatar — Shows a user's avatar with an optional cosmetic frame overlay.
 * The frame PNG is rendered as an absolute overlay on top of the avatar image.
 */
export function UserAvatar({ avatar, name, activeFrameImage, size = 40, className = "" }: UserAvatarProps) {
  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Base avatar */}
      <div
        className="w-full h-full rounded-full overflow-hidden bg-zinc-800"
        style={{ width: size, height: size }}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={name ?? "avatar"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400 font-bold text-sm">
            {name ? name.charAt(0).toUpperCase() : "?"}
          </div>
        )}
      </div>

      {/* Cosmetic frame overlay */}
      {activeFrameImage && (
        <img
          src={activeFrameImage}
          alt="frame"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ objectFit: "fill" }}
        />
      )}
    </div>
  );
}
