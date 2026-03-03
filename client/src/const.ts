export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Returns the local login page path (custom auth system)
export const getLoginUrl = () => "/login";

// ─── Platform default banner ──────────────────────────────────────────────────
// Used whenever a user/ally/creator does not have a custom banner set.
// This renders the signature RLC diagonal-lines pattern.
export function DefaultBannerBg({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-red-950/70 via-zinc-950 to-black" />
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: "repeating-linear-gradient(45deg, #dc2626 0, #dc2626 1px, transparent 0, transparent 50%)",
          backgroundSize: "20px 20px",
        }}
      />
    </div>
  );
}
