const VERIFIED_BADGE_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663082553838/qanGNgBlfypcvvUa.png";

interface VerifiedBadgeProps {
  size?: number;
  className?: string;
}

export function VerifiedBadge({ size = 16, className = "" }: VerifiedBadgeProps) {
  return (
    <img
      src={VERIFIED_BADGE_URL}
      alt="Verificado"
      title="Usuario verificado"
      width={size}
      height={size}
      className={`inline-block flex-shrink-0 ${className}`}
      style={{ objectFit: "contain" }}
    />
  );
}
