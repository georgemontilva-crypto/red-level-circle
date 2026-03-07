import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Link, useParams } from "wouter";
import {
  ChevronLeft, Shield, Trophy, Users, CheckCircle, Crown,
  TrendingUp, Target, Calendar, Globe, Award, Hash,
  Twitter, MessageSquare, Tv2, RefreshCw, ChevronDown, ChevronUp,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

// ─── Colores de tier ──────────────────────────────────────────────────────────
const TIER_COLORS: Record<string, { text: string; bg: string; border: string; emblem: string }> = {
  IRON:        { text: "#9E9E9E", bg: "rgba(158,158,158,0.12)", border: "rgba(158,158,158,0.30)", emblem: "🔩" },
  BRONZE:      { text: "#CD7F32", bg: "rgba(205,127,50,0.12)",  border: "rgba(205,127,50,0.30)",  emblem: "🥉" },
  SILVER:      { text: "#C0C0C0", bg: "rgba(192,192,192,0.12)", border: "rgba(192,192,192,0.30)", emblem: "🥈" },
  GOLD:        { text: "#FFD700", bg: "rgba(255,215,0,0.12)",   border: "rgba(255,215,0,0.30)",   emblem: "🏅" },
  PLATINUM:    { text: "#00B4D8", bg: "rgba(0,180,216,0.12)",   border: "rgba(0,180,216,0.30)",   emblem: "🔷" },
  EMERALD:     { text: "#50C878", bg: "rgba(80,200,120,0.12)",  border: "rgba(80,200,120,0.30)",  emblem: "💚" },
  DIAMOND:     { text: "#B9F2FF", bg: "rgba(185,242,255,0.12)", border: "rgba(185,242,255,0.30)", emblem: "💎" },
  MASTER:      { text: "#9B59B6", bg: "rgba(155,89,182,0.12)",  border: "rgba(155,89,182,0.30)",  emblem: "👑" },
  GRANDMASTER: { text: "#E74C3C", bg: "rgba(231,76,60,0.12)",   border: "rgba(231,76,60,0.30)",   emblem: "🔥" },
  CHALLENGER:  { text: "#F1C40F", bg: "rgba(241,196,15,0.12)",  border: "rgba(241,196,15,0.30)",  emblem: "⚡" },
  IMMORTAL:    { text: "#E74C3C", bg: "rgba(231,76,60,0.12)",   border: "rgba(231,76,60,0.30)",   emblem: "🔥" },
};

const REGION_LABELS: Record<string, string> = {
  la1: "LAN", la2: "LAS", na1: "NA", br1: "BR",
  euw1: "EUW", eun1: "EUNE", kr: "KR", jp1: "JP",
  tr1: "TR", ru: "RU", oc1: "OCE", sg2: "SEA",
};

const ROLE_ICONS: Record<string, string> = {
  top: "🛡️", toplane: "🛡️",
  jungle: "🌿", jungla: "🌿",
  mid: "⚡", midlane: "⚡",
  adc: "🏹", "bot lane": "🏹", bot: "🏹",
  support: "✨", soporte: "✨",
  duelist: "⚔️", duelista: "⚔️",
  controller: "🎯",
  sentinel: "🛡️",
  initiator: "💥",
};

function getRoleIcon(role?: string | null) {
  if (!role) return "👤";
  return ROLE_ICONS[role.toLowerCase()] ?? "👤";
}

// ─── Componente: PlayerCardExpanded ──────────────────────────────────────────
function PlayerCardExpanded({ member, onClose }: { member: any; onClose: () => void }) {
  const { data: riotProfile, isLoading } = trpc.riot.getLolProfileByUserId.useQuery(
    { userId: member.userId },
    { enabled: !!member.userId, staleTime: 5 * 60 * 1000 }
  );

  const hasRiot = !!riotProfile && !isLoading;
  const riotRegion = hasRiot ? (REGION_LABELS[riotProfile.region ?? ""] ?? riotProfile.region ?? "") : null;
  const riotId = hasRiot && riotProfile.account?.gameName
    ? `${riotProfile.account.gameName}#${riotProfile.account.tagLine ?? ""}`
    : null;
  const rankedSolo = hasRiot ? riotProfile.rankedSolo : null;
  const riotIconUrl = hasRiot && (riotProfile as any).iconId
    ? `https://ddragon.leagueoflegends.com/cdn/14.24.1/img/profileicon/${(riotProfile as any).iconId}.png`
    : null;
  const topChampions: any[] = hasRiot ? (riotProfile.topChampions ?? []) : [];
  const recentMatches: any[] = hasRiot ? (riotProfile.recentMatches ?? []) : [];

  const tier = rankedSolo ? (rankedSolo.tier ?? "").toUpperCase() : (member.elo ?? "").toUpperCase().split(" ")[0];
  const tierColor = TIER_COLORS[tier] ?? { text: "#aaa", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", emblem: "🎮" };
  const rankLabel = rankedSolo
    ? `${tier.charAt(0) + tier.slice(1).toLowerCase()} ${rankedSolo.rank ?? ""}`
    : (member.elo ?? "Sin clasificar");
  const lp = rankedSolo?.leaguePoints ?? 0;
  const wins = rankedSolo?.wins ?? 0;
  const losses = rankedSolo?.losses ?? 0;
  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : null;
  const winRateColor = winRate === null ? "#aaa" : winRate >= 55 ? "#2ecc71" : winRate >= 50 ? "#e67e22" : "#e74c3c";

  const photoUrl = member.rosterImageUrl ?? member.rosterPhoto ?? riotIconUrl ?? member.avatar ?? null;
  const region = riotRegion ?? member.competitiveRegion ?? null;
  const nickname = member.nickname ?? member.userName ?? member.username ?? "Jugador";

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#0f1218",
        border: "1px solid rgba(192,57,43,0.3)",
        boxShadow: "0 0 40px rgba(192,57,43,0.08)",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr" }}>
        {/* Columna izquierda: player card */}
        <div style={{ background: "linear-gradient(160deg, #160a0a 0%, #1a0d0d 100%)", borderRight: "1px solid rgba(255,255,255,0.05)", padding: "20px" }}>
          {/* Foto */}
          <div style={{ borderRadius: "14px", overflow: "hidden", background: "linear-gradient(135deg, #1a0808, #2d0f0f)", border: "1px solid rgba(192,57,43,0.2)", marginBottom: "16px" }}>
            <div style={{ position: "relative", height: "180px" }}>
              {photoUrl ? (
                <img src={photoUrl} alt={nickname} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "56px", color: "rgba(255,255,255,0.06)" }}>👤</div>
              )}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60%", background: "linear-gradient(to top, #1a0808 0%, transparent 100%)" }} />
            </div>
            <div style={{ padding: "14px" }}>
              {riotIconUrl && (
                <img src={riotIconUrl} alt="icon" style={{ width: "44px", height: "44px", borderRadius: "50%", border: "2px solid rgba(192,57,43,0.6)", boxShadow: "0 0 12px rgba(192,57,43,0.3)", marginBottom: "10px", background: "#1a0f0f" }} />
              )}
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "17px", fontWeight: 900, color: "#fff", marginBottom: "2px" }}>{nickname}</div>
              {riotId && <div style={{ fontFamily: "monospace", fontSize: "11px", color: "rgba(255,255,255,0.35)", marginBottom: "10px" }}>{riotId}</div>}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
                {member.gameRole && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 9px", borderRadius: "999px", fontFamily: "monospace", fontSize: "10px", background: "rgba(192,57,43,0.12)", border: "1px solid rgba(192,57,43,0.3)", color: "#e74c3c" }}>
                    {getRoleIcon(member.gameRole)} {member.gameRole}
                  </span>
                )}
                {region && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 9px", borderRadius: "999px", fontFamily: "monospace", fontSize: "10px", background: "rgba(52,152,219,0.1)", border: "1px solid rgba(52,152,219,0.25)", color: "#5dade2" }}>
                    🌎 {region}
                  </span>
                )}
              </div>
              {/* Rank bar */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "10px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0, background: tierColor.bg, border: `2px solid ${tierColor.border}` }}>{tierColor.emblem}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "12px", fontWeight: 700, color: tierColor.text }}>{rankLabel}</div>
                  {rankedSolo && <div style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(255,255,255,0.35)", marginTop: "1px" }}>{lp} LP · {wins}W {losses}L</div>}
                </div>
                {winRate !== null && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "13px", fontWeight: 700, color: winRateColor }}>{winRate}%</div>
                    <div style={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>WIN RATE</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha: stats */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "12px", letterSpacing: ".15em", color: "rgba(255,255,255,0.5)" }}>FICHA COMPETITIVA</div>
            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", padding: "5px 12px", borderRadius: "8px", fontFamily: "monospace", fontSize: "10px", cursor: "pointer" }}
            >
              ✕ CERRAR
            </button>
          </div>

          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[1,2,3].map(i => <div key={i} style={{ height: "60px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", animation: "pulse 1.5s ease-in-out infinite" }} />)}
            </div>
          ) : (
            <>
              {/* Stats grid */}
              <div style={{ background: "#13161b", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "7px", fontFamily: "'Orbitron', sans-serif", fontSize: "9px", letterSpacing: ".15em", color: "rgba(255,255,255,0.35)" }}>
                  <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#c0392b" }} />
                  ESTADÍSTICAS DE TEMPORADA
                </div>
                <div style={{ padding: "14px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                  {[
                    { value: rankLabel, label: "RANGO SOLO", color: tierColor.text },
                    { value: winRate !== null ? `${winRate}%` : "—", label: "WIN RATE", color: winRateColor },
                    { value: total > 0 ? total : "—", label: "PARTIDAS", color: "#e0e0e0" },
                    { value: "—", label: "KDA PROM.", color: "#5dade2" },
                  ].map((s, i) => (
                    <div key={i} style={{ borderRadius: "8px", padding: "10px 8px", textAlign: "center", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "16px", fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontFamily: "monospace", fontSize: "8px", color: "rgba(255,255,255,0.3)", marginTop: "4px", letterSpacing: ".08em" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top campeones */}
              {topChampions.length > 0 && (
                <div style={{ background: "#13161b", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "7px", fontFamily: "'Orbitron', sans-serif", fontSize: "9px", letterSpacing: ".15em", color: "rgba(255,255,255,0.35)" }}>
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#c0392b" }} />
                    TOP CAMPEONES
                  </div>
                  <div style={{ padding: "14px", display: "flex", gap: "10px" }}>
                    {topChampions.slice(0, 5).map((champ: any, i: number) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", flex: 1 }}>
                        <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "#1a1e25", border: "2px solid rgba(255,255,255,0.08)", overflow: "hidden", position: "relative" }}>
                          {champ.championName && (
                            <img src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${champ.championName}.png`} alt={champ.championName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          )}
                          {champ.championLevel && (
                            <div style={{ position: "absolute", bottom: "-1px", right: "-1px", background: "#c0392b", color: "#fff", fontFamily: "monospace", fontSize: "9px", padding: "1px 4px", borderRadius: "4px 0 0 0" }}>{champ.championLevel}</div>
                          )}
                        </div>
                        <div style={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(255,255,255,0.6)", textAlign: "center" }}>{champ.championName}</div>
                        {champ.championPoints && <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "8px", color: "rgba(255,255,255,0.3)" }}>{Math.round(champ.championPoints / 1000)}K</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Partidas recientes */}
              {recentMatches.length > 0 && (
                <div style={{ background: "#13161b", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "7px", fontFamily: "'Orbitron', sans-serif", fontSize: "9px", letterSpacing: ".15em", color: "rgba(255,255,255,0.35)" }}>
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#c0392b" }} />
                    PARTIDAS RECIENTES
                  </div>
                  <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {recentMatches.slice(0, 4).map((match: any, i: number) => {
                      const win = match.win;
                      const k = match.kills ?? 0; const d = match.deaths ?? 0; const a = match.assists ?? 0;
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 8px", borderRadius: "8px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                          <div style={{ width: "4px", height: "32px", borderRadius: "2px", flexShrink: 0, background: win ? "#2ecc71" : "#e74c3c" }} />
                          <div style={{ width: "32px", height: "32px", borderRadius: "7px", overflow: "hidden", flexShrink: 0, background: "#1a1e25", border: "1px solid rgba(255,255,255,0.08)" }}>
                            {match.championName && <img src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${match.championName}.png`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "12px", fontWeight: 700, color: win ? "#2ecc71" : "#e74c3c" }}>{k}/{d}/{a}</div>
                            <div style={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>KDA</div>
                          </div>
                          <div style={{ textAlign: "right", fontFamily: "monospace", fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>
                            {match.gameMode ?? "RANKED"}<br />
                            {match.gameDuration ? `${Math.round(match.gameDuration / 60)} min` : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!hasRiot && (
                <div style={{ textAlign: "center", padding: "24px", fontFamily: "monospace", fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>
                  Este jugador no tiene cuenta Riot vinculada
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Componente: PlayerCardCompact ────────────────────────────────────────────
function PlayerCardCompact({
  member,
  isCaptain,
  isExpanded,
  onToggle,
}: {
  member: any;
  isCaptain: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { data: riotProfile } = trpc.riot.getLolProfileByUserId.useQuery(
    { userId: member.userId },
    { enabled: !!member.userId, staleTime: 5 * 60 * 1000 }
  );

  const hasRiot = !!riotProfile;
  const riotRegion = hasRiot ? (REGION_LABELS[riotProfile.region ?? ""] ?? riotProfile.region ?? "") : null;
  const riotId = hasRiot && riotProfile.account?.gameName
    ? `${riotProfile.account.gameName}#${riotProfile.account.tagLine ?? ""}`
    : null;
  const rankedSolo = hasRiot ? riotProfile.rankedSolo : null;
  const riotIconUrl = hasRiot && (riotProfile as any).iconId
    ? `https://ddragon.leagueoflegends.com/cdn/14.24.1/img/profileicon/${(riotProfile as any).iconId}.png`
    : null;

  const tier = rankedSolo ? (rankedSolo.tier ?? "").toUpperCase() : (member.elo ?? "").toUpperCase().split(" ")[0];
  const tierColor = TIER_COLORS[tier] ?? { text: "#aaa", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", emblem: "🎮" };
  const rankLabel = rankedSolo
    ? `${tier.charAt(0) + tier.slice(1).toLowerCase()} ${rankedSolo.rank ?? ""}`
    : (member.elo ?? null);
  const wins = rankedSolo?.wins ?? 0;
  const losses = rankedSolo?.losses ?? 0;
  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : null;
  const winRateColor = winRate === null ? "#aaa" : winRate >= 55 ? "#2ecc71" : winRate >= 50 ? "#e67e22" : "#e74c3c";

  const photoUrl = member.rosterImageUrl ?? member.rosterPhoto ?? riotIconUrl ?? member.avatar ?? null;
  const region = riotRegion ?? member.competitiveRegion ?? null;
  const nickname = member.nickname ?? member.userName ?? member.username ?? "Jugador";
  const gameLabel = (member.mainGame ?? "").toLowerCase().includes("valorant") ? "VALORANT" : "LEAGUE OF LEGENDS";

  return (
    <div
      onClick={onToggle}
      style={{
        background: isExpanded ? "linear-gradient(160deg, #1a0808, #2a0d0d)" : "#13161b",
        border: `1px solid ${isExpanded ? "rgba(192,57,43,0.5)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: "16px",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all .25s",
        transform: isExpanded ? "none" : undefined,
        boxShadow: isExpanded ? "0 0 30px rgba(192,57,43,0.15)" : "none",
      }}
      onMouseEnter={e => { if (!isExpanded) { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(192,57,43,0.35)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; } }}
      onMouseLeave={e => { if (!isExpanded) { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLDivElement).style.transform = "none"; } }}
    >
      {/* Accent line */}
      <div style={{ height: "2px", background: "linear-gradient(90deg, transparent, #c0392b, transparent)" }} />

      {/* Photo */}
      <div style={{ width: "100%", height: "180px", background: "linear-gradient(135deg, #1a0808, #2a0d0d)", position: "relative", overflow: "hidden" }}>
        {photoUrl ? (
          <img src={photoUrl} alt={nickname} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "56px", color: "rgba(255,255,255,0.06)" }}>👤</div>
        )}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60%", background: "linear-gradient(to top, #13161b 0%, transparent 100%)" }} />
        <div style={{ position: "absolute", top: "10px", left: "10px", fontFamily: "'Orbitron', sans-serif", fontSize: "8px", letterSpacing: ".12em", color: "rgba(255,255,255,0.4)", background: "rgba(0,0,0,0.5)", padding: "3px 8px", borderRadius: "4px", backdropFilter: "blur(4px)" }}>{gameLabel}</div>
        {isCaptain && (
          <div style={{ position: "absolute", top: "10px", right: "10px", background: "#d4a017", color: "#000", fontFamily: "'Orbitron', sans-serif", fontSize: "8px", fontWeight: 900, padding: "3px 8px", borderRadius: "999px", letterSpacing: ".08em" }}>👑 CAP</div>
        )}
        {riotIconUrl && (
          <div style={{ position: "absolute", bottom: "-14px", left: "12px", width: "36px", height: "36px", borderRadius: "50%", border: "2px solid rgba(192,57,43,0.6)", boxShadow: "0 0 10px rgba(192,57,43,0.3)", background: "#1a0f0f", overflow: "hidden", zIndex: 2 }}>
            <img src={riotIconUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: riotIconUrl ? "22px 14px 12px" : "14px" }}>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "14px", fontWeight: 900, color: "#fff", marginBottom: "2px" }}>{nickname}</div>
        {riotId && <div style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(255,255,255,0.35)", marginBottom: "8px" }}>{riotId}</div>}
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "10px" }}>
          {member.gameRole && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", padding: "3px 8px", borderRadius: "999px", fontFamily: "monospace", fontSize: "10px", background: "rgba(192,57,43,0.12)", border: "1px solid rgba(192,57,43,0.3)", color: "#e74c3c" }}>
              {getRoleIcon(member.gameRole)} {member.gameRole}
            </span>
          )}
          {region && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", padding: "3px 8px", borderRadius: "999px", fontFamily: "monospace", fontSize: "10px", background: "rgba(52,152,219,0.1)", border: "1px solid rgba(52,152,219,0.25)", color: "#5dade2" }}>
              🌎 {region}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", borderRadius: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "11px", fontWeight: 700, color: rankLabel ? tierColor.text : "rgba(255,255,255,0.3)" }}>{rankLabel ?? "Sin clasificar"}</div>
          {winRate !== null && <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "11px", fontWeight: 700, color: winRateColor }}>{winRate}%</div>}
        </div>
      </div>

      {/* Expand hint */}
      <div style={{ textAlign: "center", padding: "8px", fontFamily: "monospace", fontSize: "9px", color: isExpanded ? "rgba(192,57,43,0.7)" : "rgba(255,255,255,0.2)", letterSpacing: ".1em", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
        {isExpanded ? <><ChevronUp size={10} /> CERRAR FICHA</> : <><ChevronDown size={10} /> VER FICHA COMPLETA</>}
      </div>
    </div>
  );
}

// ─── Hook helper: carga datos Riot de UN miembro ────────────────────────────
function useMemberRiot(userId: number) {
  const { data } = trpc.riot.getLolProfileByUserId.useQuery(
    { userId },
    { enabled: !!userId, staleTime: 5 * 60 * 1000 }
  );
  return data;
}

// ─── Componente: MemberRiotRow — carga Riot de un miembro y llama callback ──
function MemberRiotRow({ member, onData }: { member: any; onData: (userId: number, riot: any) => void }) {
  const riot = useMemberRiot(member.userId);
  // Notificar al padre cuando los datos lleguen
  if (riot) onData(member.userId, riot);
  return null; // solo carga datos, no renderiza
}

// ─── Componente: TeamOverview ─────────────────────────────────────────────────
function TeamOverview({ team, rankPos, tournamentHistory }: { team: any; rankPos: any; tournamentHistory: any[] }) {
  const [riotDataMap, setRiotDataMap] = useState<Record<number, any>>({});
  const members = Array.from(new Map((team.members ?? []).map((m: any) => [m.userId, m])).values()) as any[];

  const handleRiotData = (userId: number, riot: any) => {
    setRiotDataMap(prev => prev[userId] === riot ? prev : { ...prev, [userId]: riot });
  };

  // Construir memberRiotData desde el mapa de datos
  const memberRiotData = members.map((m: any) => ({ member: m, riot: riotDataMap[m.userId] ?? null }));

  // Calcular stats del equipo
  const rankedMembers = memberRiotData.filter(d => d.riot?.rankedSolo?.tier);
  const totalWins = rankedMembers.reduce((acc, d) => acc + (d.riot?.rankedSolo?.wins ?? 0), 0);
  const totalLosses = rankedMembers.reduce((acc, d) => acc + (d.riot?.rankedSolo?.losses ?? 0), 0);
  const totalGames = totalWins + totalLosses;
  const teamWinRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : null;

  // Distribución de rangos
  const rankDist: Record<string, number> = {};
  rankedMembers.forEach(d => {
    const tier = (d.riot?.rankedSolo?.tier ?? "").toUpperCase();
    if (tier) rankDist[tier] = (rankDist[tier] ?? 0) + 1;
  });

  // Pool de campeones del equipo
  const champPool: Record<string, number> = {};
  memberRiotData.forEach(d => {
    (d.riot?.topChampions ?? []).slice(0, 3).forEach((c: any) => {
      if (c.championName) champPool[c.championName] = (champPool[c.championName] ?? 0) + 1;
    });
  });
  const topTeamChamps = Object.entries(champPool).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const wonTournaments = tournamentHistory.filter((r: any) => r.isWinner);
  const winRateColor = teamWinRate === null ? "#aaa" : teamWinRate >= 55 ? "#2ecc71" : teamWinRate >= 50 ? "#e67e22" : "#e74c3c";

  const TIER_ORDER = ["CHALLENGER", "GRANDMASTER", "MASTER", "DIAMOND", "EMERALD", "PLATINUM", "GOLD", "SILVER", "BRONZE", "IRON"];

  return (
    <div>
      {/* Cargar datos de Riot de cada miembro en background */}
      {members.map((m: any) => (
        <MemberRiotRow key={m.userId} member={m} onData={handleRiotData} />
      ))}
      {/* Stats rápidas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "28px" }}>
        {[
          { icon: "🏆", value: tournamentHistory.length, label: "TORNEOS JUGADOS", color: "#FFD700" },
          { icon: "🥇", value: wonTournaments.length, label: "TÍTULOS RLC", color: "#c0392b" },
          { icon: "📈", value: teamWinRate !== null ? `${teamWinRate}%` : "—", label: "WIN RATE EQUIPO", color: winRateColor },
          { icon: "👥", value: members.length, label: "JUGADORES", color: "#5dade2" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#13161b", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "18px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(192,57,43,0.5), transparent)" }} />
            <div style={{ fontSize: "20px", marginBottom: "8px", opacity: 0.7 }}>{s.icon}</div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "26px", fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: "4px" }}>{s.value}</div>
            <div style={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(255,255,255,0.35)", letterSpacing: ".1em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Sección Riot */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c0392b", flexShrink: 0 }} />
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "10px", letterSpacing: ".2em", color: "rgba(255,255,255,0.35)" }}>ESTADÍSTICAS RIOT — TEMPORADA ACTUAL</div>
        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "28px" }}>
        {/* Distribución de rangos */}
        <div style={{ background: "#13161b", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "7px", fontFamily: "'Orbitron', sans-serif", fontSize: "9px", letterSpacing: ".15em", color: "rgba(255,255,255,0.4)" }}>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#c0392b" }} />
            DISTRIBUCIÓN DE RANGOS
          </div>
          <div style={{ padding: "16px" }}>
            {TIER_ORDER.filter(t => rankDist[t] > 0).map(tier => {
              const tc = TIER_COLORS[tier] ?? { text: "#aaa", border: "rgba(255,255,255,0.1)" };
              const pct = Math.round((rankDist[tier] / members.length) * 100);
              return (
                <div key={tier} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <div style={{ fontFamily: "monospace", fontSize: "11px", color: tc.text, width: "80px", flexShrink: 0 }}>{tier.charAt(0) + tier.slice(1).toLowerCase()}</div>
                  <div style={{ flex: 1, height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: tc.text, borderRadius: "4px", transition: "width .8s ease" }} />
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: "11px", color: "rgba(255,255,255,0.4)", width: "16px", textAlign: "right" }}>{rankDist[tier]}</div>
                </div>
              );
            })}
            {rankedMembers.length === 0 && (
              <div style={{ fontFamily: "monospace", fontSize: "11px", color: "rgba(255,255,255,0.25)", textAlign: "center", padding: "16px 0" }}>Sin datos de rango disponibles</div>
            )}
            {rankedMembers.length > 0 && (
              <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "10px", color: "rgba(255,255,255,0.35)", letterSpacing: ".1em", marginBottom: "4px" }}>WIN RATE PROM.</div>
                  <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "20px", fontWeight: 900, color: winRateColor }}>{teamWinRate !== null ? `${teamWinRate}%` : "—"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "10px", color: "rgba(255,255,255,0.35)", letterSpacing: ".1em", marginBottom: "4px" }}>PARTIDAS TOTAL</div>
                  <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "20px", fontWeight: 900, color: "#e0e0e0" }}>{totalGames}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Composición de roles */}
        <div style={{ background: "#13161b", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "7px", fontFamily: "'Orbitron', sans-serif", fontSize: "9px", letterSpacing: ".15em", color: "rgba(255,255,255,0.4)" }}>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#c0392b" }} />
            COMPOSICIÓN DE ROLES
          </div>
          <div style={{ padding: "16px" }}>
            <div style={{ display: "flex", gap: "8px", justifyContent: "space-between" }}>
              {[
                { key: ["top", "toplane"], label: "TOP", icon: "🛡️" },
                { key: ["jungle", "jungla"], label: "JUNGLE", icon: "🌿" },
                { key: ["mid", "midlane"], label: "MID", icon: "⚡" },
                { key: ["adc", "bot", "bot lane"], label: "ADC", icon: "🏹" },
                { key: ["support", "soporte"], label: "SUPP", icon: "✨" },
              ].map(role => {
                const player = members.find(m => role.key.includes((m.gameRole ?? "").toLowerCase()));
                const playerRiot = player ? memberRiotData.find(d => d.member.userId === player.userId) : null;
                const playerTier = playerRiot?.riot?.rankedSolo?.tier?.toUpperCase() ?? (player?.elo ?? "").toUpperCase().split(" ")[0];
                const ptc = TIER_COLORS[playerTier] ?? null;
                return (
                  <div key={role.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", padding: "10px 6px", borderRadius: "10px", background: player ? "rgba(192,57,43,0.05)" : "rgba(0,0,0,0.2)", border: `1px solid ${player ? "rgba(192,57,43,0.2)" : "rgba(255,255,255,0.04)"}`, opacity: player ? 1 : 0.45 }}>
                    <div style={{ fontSize: "18px" }}>{role.icon}</div>
                    <div style={{ fontFamily: "monospace", fontSize: "8px", color: "rgba(255,255,255,0.35)", letterSpacing: ".08em" }}>{role.label}</div>
                    <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "9px", fontWeight: 700, color: player ? "#fff" : "rgba(255,255,255,0.2)", textAlign: "center", lineHeight: 1.2 }}>
                      {player ? (player.nickname ?? player.userName ?? "—") : "—"}
                    </div>
                    {ptc && <div style={{ padding: "2px 7px", borderRadius: "999px", fontFamily: "monospace", fontSize: "8px", color: ptc.text, border: `1px solid ${ptc.border}`, background: ptc.bg }}>{playerTier.charAt(0) + playerTier.slice(1).toLowerCase()}</div>}
                    {!player && <div style={{ padding: "2px 7px", borderRadius: "999px", fontFamily: "monospace", fontSize: "8px", color: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.08)" }}>Vacante</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Pool de campeones del equipo */}
      {topTeamChamps.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c0392b", flexShrink: 0 }} />
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "10px", letterSpacing: ".2em", color: "rgba(255,255,255,0.35)" }}>POOL DE CAMPEONES DEL EQUIPO</div>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
          </div>
          <div style={{ background: "#13161b", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", overflow: "hidden", marginBottom: "28px" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "7px", fontFamily: "'Orbitron', sans-serif", fontSize: "9px", letterSpacing: ".15em", color: "rgba(255,255,255,0.4)" }}>
              <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#c0392b" }} />
              CAMPEONES MÁS JUGADOS · TODOS LOS MIEMBROS
            </div>
            <div style={{ padding: "16px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {topTeamChamps.map(([champName, count]) => (
                <div key={champName} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: "#1a1e25", border: "2px solid rgba(255,255,255,0.08)", overflow: "hidden", position: "relative" }}>
                    <img src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${champName}.png`} alt={champName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", bottom: "-1px", right: "-1px", background: "#c0392b", color: "#fff", fontFamily: "monospace", fontSize: "9px", padding: "1px 5px", borderRadius: "4px 0 0 0" }}>{count}</div>
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(255,255,255,0.6)", textAlign: "center" }}>{champName}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function TeamProfile() {
  const { id } = useParams<{ id: string }>();
  const teamId = parseInt(id ?? "0");
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "roster" | "history" | "achievements">("overview");
  const [expandedMemberId, setExpandedMemberId] = useState<number | null>(null);

  const { data: team, isLoading, refetch } = trpc.teams.publicProfile.useQuery(
    { id: teamId },
    { enabled: !!teamId }
  );
  const { data: rankPos } = trpc.teams.rankPosition.useQuery(
    { id: teamId },
    { enabled: !!teamId }
  );
  const { data: tournamentHistory } = trpc.ranking.teamHistory.useQuery(
    { teamId },
    { enabled: !!teamId }
  );

  const joinTeam = trpc.teams.addMember.useMutation({
    onSuccess: () => { toast.success("¡Solicitud enviada!"); refetch(); },
    onError: (err: { message: string }) => toast.error("Error", { description: err.message }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080a0d" }}>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "12px", letterSpacing: ".2em", color: "rgba(255,255,255,0.3)" }}>CARGANDO EQUIPO...</div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080a0d" }}>
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4" style={{ color: "rgba(192,57,43,0.3)" }} />
          <p style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.5)", marginBottom: "16px" }}>EQUIPO NO ENCONTRADO</p>
          <Link href="/ranking">
            <button style={{ background: "#c0392b", color: "#fff", padding: "8px 20px", borderRadius: "8px", fontFamily: "monospace", fontSize: "12px", border: "none", cursor: "pointer" }}>← Ver Ranking</button>
          </Link>
        </div>
      </div>
    );
  }

  const isCaptain = user?.id === team.captainId;
  const isMember = team.members?.some((m: any) => m.userId === user?.id);
  const wonTournaments = (tournamentHistory ?? []).filter((r: any) => r.isWinner);
  const activeTournaments = (tournamentHistory ?? []).filter((r: any) => r.tournamentStatus === "in_progress" || r.tournamentStatus === "registration_open");
  const members = Array.from(new Map((team.members ?? []).map((m: any) => [m.userId, m])).values()) as any[];

  return (
    <div style={{ minHeight: "100vh", background: "#080a0d", color: "#e0e0e0" }}>

      {/* ── HERO BANNER ── */}
      <div style={{ position: "relative", height: "300px", overflow: "hidden", background: "linear-gradient(135deg, #0d0608 0%, #1a0808 40%, #0d0608 100%)" }}>
        {/* Fondo patrón */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        {/* Banner image */}
        {team.banner && <img src={team.banner} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }} />}
        {/* Glow */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(192,57,43,0.2) 0%, transparent 70%)" }} />
        {/* Line */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent 0%, rgba(192,57,43,0.6) 30%, rgba(255,100,80,0.9) 50%, rgba(192,57,43,0.6) 70%, transparent 100%)" }} />

        {/* Back button */}
        <button
          onClick={() => window.history.back()}
          style={{ position: "absolute", top: "16px", left: "24px", zIndex: 10, display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontFamily: "monospace", fontSize: "12px", cursor: "pointer" }}
        >
          <ChevronLeft size={14} /> Volver
        </button>

        {/* Manage button */}
        {isCaptain && (
          <Link href="/dashboard/teams">
            <button style={{ position: "absolute", top: "16px", right: "24px", zIndex: 10, display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(192,57,43,0.4)", color: "#c0392b", fontFamily: "monospace", fontSize: "12px", cursor: "pointer" }}>
              <Shield size={14} /> Gestionar
            </button>
          </Link>
        )}

        {/* Hero content */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: "1200px", margin: "0 auto", padding: "0 32px", height: "100%", display: "flex", alignItems: "flex-end", paddingBottom: "28px", gap: "24px" }}>
          {/* Logo */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: "90px", height: "90px", borderRadius: "18px", background: "linear-gradient(135deg, #1a0808, #2d0f0f)", border: "2px solid rgba(192,57,43,0.5)", boxShadow: "0 0 30px rgba(192,57,43,0.3), 0 8px 32px rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {team.logo ? <img src={team.logo} alt={team.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Shield size={36} style={{ color: "rgba(192,57,43,0.5)" }} />}
            </div>
            <div style={{ position: "absolute", bottom: "-8px", right: "-8px", background: "#c0392b", borderRadius: "7px", padding: "3px 8px", fontFamily: "'Orbitron', sans-serif", fontSize: "8px", letterSpacing: ".1em", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}>
              {(team.game ?? team.gameSlug ?? "LOL").toUpperCase().slice(0, 3)}
            </div>
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            {team.tag && <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "10px", letterSpacing: ".2em", color: "rgba(192,57,43,0.8)", marginBottom: "4px" }}>[ {team.tag} ] · {team.name?.toUpperCase()}</div>}
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "32px", fontWeight: 900, color: "#fff", textShadow: "0 2px 20px rgba(0,0,0,0.8)", lineHeight: 1, marginBottom: "10px" }}>{team.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 12px", borderRadius: "999px", fontFamily: "monospace", fontSize: "11px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                👥 {members.length} jugadores
              </span>
              {team.country && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 12px", borderRadius: "999px", fontFamily: "monospace", fontSize: "11px", background: "rgba(52,152,219,0.1)", border: "1px solid rgba(52,152,219,0.25)", color: "#5dade2" }}>
                  🌎 {team.country}
                </span>
              )}
              {rankPos && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 12px", borderRadius: "999px", fontFamily: "monospace", fontSize: "11px", background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)", color: "#FFD700" }}>
                  # {rankPos.globalPosition} Global
                </span>
              )}
              {activeTournaments.length > 0 && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 12px", borderRadius: "999px", fontFamily: "monospace", fontSize: "11px", background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.2)", color: "#2ecc71" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2ecc71", display: "inline-block", animation: "pulse 2s infinite" }} /> EN COMPETICIÓN
                </span>
              )}
              {team.isVerified && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 12px", borderRadius: "999px", fontFamily: "monospace", fontSize: "11px", background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.2)", color: "#fbbf24" }}>
                  <CheckCircle size={10} /> OFICIAL
                </span>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "999px", background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.2)", color: "#2ecc71", fontFamily: "monospace", fontSize: "10px", letterSpacing: ".08em" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2ecc71", display: "inline-block" }} />
              RIOT SINCRONIZADO
            </div>
            {isAuthenticated && !isMember && !isCaptain && (
              <button
                onClick={() => joinTeam.mutate({ teamId, userId: user!.id, role: "player" })}
                disabled={joinTeam.isPending}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 18px", borderRadius: "10px", background: "linear-gradient(135deg, #c0392b, #e74c3c)", color: "#fff", fontFamily: "monospace", fontSize: "12px", fontWeight: 700, border: "none", cursor: "pointer" }}
              >
                <Users size={13} /> {joinTeam.isPending ? "Enviando..." : "Unirse"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── NAV TABS ── */}
      <div style={{ background: "#0d0f14", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 32px", display: "flex" }}>
          {([
            { key: "overview", label: "OVERVIEW", icon: "📊" },
            { key: "roster", label: "ALINEACIÓN", icon: "👥", count: members.length },
            { key: "history", label: "TORNEOS", icon: "🏆", count: tournamentHistory?.length },
            { key: "achievements", label: "LOGROS", icon: "🎖", count: team.achievements?.length },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "16px 20px",
                fontFamily: "monospace",
                fontSize: "11px",
                letterSpacing: ".12em",
                color: activeTab === tab.key ? "#fff" : "rgba(255,255,255,0.4)",
                cursor: "pointer",
                borderBottom: `2px solid ${activeTab === tab.key ? "#c0392b" : "transparent"}`,
                display: "flex",
                alignItems: "center",
                gap: "7px",
                border: "none",
                borderBottomWidth: "2px",
                borderBottomStyle: "solid",
                borderBottomColor: activeTab === tab.key ? "#c0392b" : "transparent",
                background: "transparent",
                transition: "all .2s",
              }}
            >
              {tab.icon} {tab.label}
              {((tab as any).count ?? 0) > 0 && (
                <span style={{ background: "rgba(192,57,43,0.2)", color: "#e74c3c", borderRadius: "999px", padding: "1px 7px", fontSize: "10px" }}>{(tab as any).count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px" }}>

        {/* ── TAB: OVERVIEW ── */}
        {activeTab === "overview" && (
          <TeamOverview team={team} rankPos={rankPos} tournamentHistory={tournamentHistory ?? []} />
        )}

        {/* ── TAB: ROSTER ── */}
        {activeTab === "roster" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.7)", marginBottom: "4px" }}>ALINEACIÓN ACTIVA</div>
                <div style={{ fontFamily: "monospace", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>Haz clic en un jugador para ver su ficha completa</div>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "999px", background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.2)", color: "#2ecc71", fontFamily: "monospace", fontSize: "10px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2ecc71", display: "inline-block" }} />
                DATOS EN TIEMPO REAL
              </div>
            </div>

            {members.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: "12px", textAlign: "center" }}>
                <Users size={40} style={{ color: "rgba(255,255,255,0.1)" }} />
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.3)" }}>SIN ROSTER REGISTRADO</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                {members.map((m: any) => (
                  <div key={m.userId}>
                    <PlayerCardCompact
                      member={m}
                      isCaptain={m.userId === team.captainId}
                      isExpanded={expandedMemberId === m.userId}
                      onToggle={() => setExpandedMemberId(expandedMemberId === m.userId ? null : m.userId)}
                    />
                    {expandedMemberId === m.userId && (
                      <div style={{ gridColumn: "1 / -1", marginTop: "12px" }}>
                        <PlayerCardExpanded member={m} onClose={() => setExpandedMemberId(null)} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: TORNEOS ── */}
        {activeTab === "history" && (
          <div>
            {(!tournamentHistory || tournamentHistory.length === 0) ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: "12px", textAlign: "center" }}>
                <Trophy size={40} style={{ color: "rgba(255,255,255,0.1)" }} />
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.3)" }}>SIN TORNEOS REGISTRADOS</div>
                <div style={{ fontFamily: "monospace", fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>El historial de torneos aparecerá aquí</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {tournamentHistory.map((t: any, i: number) => (
                  <div key={i} style={{ background: "#13161b", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ fontSize: "24px" }}>{t.isWinner ? "🥇" : "🏆"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "13px", color: "#fff", marginBottom: "4px" }}>{t.tournamentName ?? "Torneo"}</div>
                      <div style={{ fontFamily: "monospace", fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>{t.tournamentStatus ?? ""}</div>
                    </div>
                    {t.isWinner && <div style={{ padding: "4px 12px", borderRadius: "999px", background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.25)", color: "#FFD700", fontFamily: "monospace", fontSize: "10px" }}>CAMPEÓN</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: LOGROS ── */}
        {activeTab === "achievements" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: "12px", textAlign: "center" }}>
            <Award size={40} style={{ color: "rgba(255,255,255,0.1)" }} />
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.3)" }}>SIN LOGROS AÚN</div>
            <div style={{ fontFamily: "monospace", fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>Los logros del equipo aparecerán aquí</div>
          </div>
        )}

      </div>
    </div>
  );
}
