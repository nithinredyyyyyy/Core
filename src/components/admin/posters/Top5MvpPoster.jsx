import React from "react";
import { getTeamLogoByName } from "@/lib/teamLogos";
import { getPlayerPhotoByIgn } from "@/lib/playerPhotos";
import { getTop5MvpData } from "./posterMvpHelpers";

const RANK_STYLES = [
  { bg: "#0f172a", ring: "#D4AF37", text: "#D4AF37", label: "#D4AF37" },
  { bg: "linear-gradient(135deg, #8A8D9112, #8A8D9106)", ring: "#8A8D91", text: "#8A8D91", label: "#8A8D91" },
  { bg: "linear-gradient(135deg, #CD7F3212, #CD7F3206)", ring: "#CD7F32", text: "#CD7F32", label: "#CD7F32" },
  { bg: "rgba(255,255,255,0.55)", ring: "#94a3b8", text: "#475569", label: "#64748b" },
  { bg: "rgba(255,255,255,0.55)", ring: "#94a3b8", text: "#475569", label: "#64748b" },
];

export default function Top5MvpPoster({ tournament, tournamentLogo, playerTeamMap = {} }) {
  const players = getTop5MvpData(tournament, playerTeamMap).slice(0, 5);
  const isPmgc = /pmgc|global\s*championship/i.test(tournament?.name);
  const isBgms = /bgms|masters\s*series/i.test(tournament?.name);

  return (
    <div className="poster-root">
      <div style={{ width: "540px", borderRadius: "20px", overflow: "hidden", position: "relative", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.08)", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, #e8600a 0%, #f28c5e 18%, #f9b89a 30%, #fde4d4 42%, #f0ece8 60%, #f2eeeb 80%, #f5f2ef 100%)",
          }} />
          <div style={{
            position: "absolute", top: "-120px", left: "50%", transform: "translateX(-50%)",
            width: "400px", height: "400px",
            background: "radial-gradient(ellipse, rgba(255,160,100,0.35), transparent 65%)",
          }} />
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)",
            WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)",
          }} />
        </div>

        <div style={{ position: "relative", zIndex: 1, padding: "24px 24px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#ffffff", marginBottom: "4px" }}>
                Top 5 Players
              </div>
              <div style={{ fontSize: "22px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em", lineHeight: 1 }}>
                MVP Rankings
              </div>
              <div style={{ fontSize: "9px", fontWeight: 600, color: "rgba(15,23,42,0.5)", letterSpacing: "0.16em", textTransform: "uppercase", marginTop: "4px" }}>
                {tournament?.name || "Tournament"}
              </div>
            </div>
            {tournamentLogo && (
              <img src={tournamentLogo} alt={tournament?.name} style={{ height: "44px", width: "auto", objectFit: "contain", opacity: 0.9 }} />
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {players.map((p, i) => {
              const photo = getPlayerPhotoByIgn(p.player);
              const teamLogo = getTeamLogoByName(p.teamName);
              const rs = RANK_STYLES[i] || RANK_STYLES[4];
              const isFirst = i === 0;

              return (
                <div key={p.rank} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  background: rs.bg,
                  border: `1px solid ${isFirst ? "#D4AF3740" : "rgba(15,23,42,0.06)"}`,
                  borderRadius: "14px", padding: isFirst ? "14px 14px" : "10px 14px",
                  boxShadow: isFirst ? "0 4px 20px rgba(0,0,0,0.2)" : "none",
                }}>
                  {/* Rank badge */}
                  <div style={{
                    width: isFirst ? "32px" : "28px", height: isFirst ? "32px" : "28px",
                    borderRadius: "50%",
                    background: isFirst ? rs.ring : `linear-gradient(135deg, ${rs.ring}, ${rs.ring}99)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: isFirst ? "14px" : "12px", fontWeight: 900,
                    color: isFirst ? "#0f172a" : "#fff", flexShrink: 0,
                  }}>
                    {p.rank}
                  </div>

                  {/* Photo — consistent container */}
                  <div style={{
                    width: "44px", height: "56px", borderRadius: "10px", overflow: "hidden",
                    flexShrink: 0, background: "#e2e8f0",
                    border: isFirst ? `2px solid ${rs.ring}40` : "1px solid rgba(15,23,42,0.06)",
                  }}>
                    {photo ? (
                      <img src={photo} alt={p.player} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 900, color: rs.ring }}>
                        {p.player?.slice(0, 2)?.toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Name + Team */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: isFirst ? "15px" : "14px", fontWeight: 800,
                      color: isFirst ? "#ffffff" : "#0f172a",
                      letterSpacing: "-0.01em", lineHeight: 1.2,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {p.player}
                    </div>
                    <div style={{
                      fontSize: "10px", fontWeight: 600, marginTop: "2px",
                      color: isFirst ? "rgba(255,255,255,0.5)" : "#64748b",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {p.teamName}
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: "flex", gap: "14px", flexShrink: 0 }}>
                    {(isPmgc ? [
                      { val: p.elimins, label: "Elims" },
                      { val: p.avg_dmg?.toLocaleString(), label: "Avg Dmg" },
                      { val: p.knocks, label: "Knocks" },
                      { val: p.kd || "—", label: "K/D" },
                    ] : isBgms ? [
                      { val: p.finishes, label: "Kills" },
                      { val: p.best ?? "—", label: "Best" },
                      { val: p.mvpRating || "—", label: "Rating" },
                      { val: p.fpm || "—", label: "F/M" },
                    ] : [
                      { val: p.finishes, label: "Kills" },
                      { val: p.damage?.toLocaleString(), label: "Dmg" },
                      { val: p.mvpRating || "—", label: "Rating" },
                      { val: p.fpm || "—", label: "F/M" },
                    ]).map(({ val, label }) => (
                      <div key={label} style={{ textAlign: "center" }}>
                        <div style={{
                          fontSize: isFirst ? "15px" : "14px", fontWeight: 900, lineHeight: 1,
                          color: isFirst ? rs.ring : rs.text,
                        }}>{val}</div>
                        <div style={{
                          fontSize: "7.5px", fontWeight: 600, letterSpacing: "0.08em",
                          textTransform: "uppercase", marginTop: "3px",
                          color: isFirst ? "rgba(255,255,255,0.4)" : "#94a3b8",
                        }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Team logo — normalized container */}
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: isFirst ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.04)",
                    border: `1px solid ${isFirst ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.06)"}`,
                  }}>
                    {teamLogo && (
                      <img src={teamLogo} alt={p.teamName} style={{ height: "20px", width: "20px", objectFit: "contain" }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginTop: "18px" }}>
            <div style={{ height: "1px", flex: 1, background: "linear-gradient(90deg, transparent, rgba(15,23,42,0.12))" }} />
            <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(15,23,42,0.35)" }}>
              CORE ESPORTS
            </span>
            <div style={{ height: "1px", flex: 1, background: "linear-gradient(90deg, rgba(15,23,42,0.12), transparent)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
