import React from "react";
import { getTeamLogoByName } from "@/lib/teamLogos";
import { getPlayerPhotoByIgn } from "@/lib/playerPhotos";
import { getTop5MvpData } from "./posterMvpHelpers";

const RANK_STYLES = [
  { bg: "var(--brand-ink-slate)", ring: "var(--art-d4af37)", text: "var(--art-d4af37)", label: "var(--art-d4af37)" },
  { bg: "linear-gradient(135deg, var(--art-8a8d9112), var(--art-8a8d9106))", ring: "var(--art-8a8d91)", text: "var(--art-8a8d91)", label: "var(--art-8a8d91)" },
  { bg: "linear-gradient(135deg, var(--art-cd7f3212), var(--art-cd7f3206))", ring: "var(--art-cd7f32)", text: "var(--art-cd7f32)", label: "var(--art-cd7f32)" },
  { bg: "rgba(var(--rgb-255-255-255),0.55)", ring: "var(--brand-slate-400)", text: "var(--art-475569)", label: "var(--art-64748b)" },
  { bg: "rgba(var(--rgb-255-255-255),0.55)", ring: "var(--brand-slate-400)", text: "var(--art-475569)", label: "var(--art-64748b)" },
];

export default function Top5MvpPoster({ tournament, tournamentLogo, playerTeamMap = {} }) {
  const players = getTop5MvpData(tournament, playerTeamMap).slice(0, 5);
  const isPmgc = /pmgc|global\s*championship/i.test(tournament?.name);
  const isBgms = /bgms|masters\s*series/i.test(tournament?.name);

  return (
    <div className="poster-root">
      <div style={{ width: "540px", borderRadius: "20px", overflow: "hidden", position: "relative", boxShadow: "0 1px 3px rgba(var(--rgb-0-0-0),0.04), 0 12px 40px rgba(var(--rgb-0-0-0),0.08)", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, var(--art-e8600a) 0%, var(--art-f28c5e) 18%, var(--art-f9b89a) 30%, var(--art-fde4d4) 42%, var(--art-f0ece8) 60%, var(--art-f2eeeb) 80%, var(--art-f5f2ef) 100%)",
          }} />
          <div style={{
            position: "absolute", top: "-120px", left: "50%", transform: "translateX(-50%)",
            width: "400px", height: "400px",
            background: "radial-gradient(ellipse, rgba(var(--rgb-255-160-100),0.35), transparent 65%)",
          }} />
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "linear-gradient(rgba(var(--rgb-255-255-255),0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--rgb-255-255-255),0.3) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage: "linear-gradient(180deg, rgba(var(--rgb-0-0-0),0.5) 0%, rgba(var(--rgb-0-0-0),0.2) 40%, transparent 70%)",
            WebkitMaskImage: "linear-gradient(180deg, rgba(var(--rgb-0-0-0),0.5) 0%, rgba(var(--rgb-0-0-0),0.2) 40%, transparent 70%)",
          }} />
        </div>

        <div style={{ position: "relative", zIndex: 1, padding: "24px 24px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--brand-white)", marginBottom: "4px" }}>
                Top 5 Players
              </div>
              <div style={{ fontSize: "22px", fontWeight: 900, color: "var(--brand-ink-slate)", letterSpacing: "-0.03em", lineHeight: 1 }}>
                MVP Rankings
              </div>
              <div style={{ fontSize: "9px", fontWeight: 600, color: "rgba(var(--rgb-15-23-42),0.5)", letterSpacing: "0.16em", textTransform: "uppercase", marginTop: "4px" }}>
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
                  border: `1px solid ${isFirst ? "var(--art-d4af3740)" : "rgba(var(--rgb-15-23-42),0.06)"}`,
                  borderRadius: "14px", padding: isFirst ? "14px 14px" : "10px 14px",
                  boxShadow: isFirst ? "0 4px 20px rgba(var(--rgb-0-0-0),0.2)" : "none",
                }}>
                  {/* Rank badge */}
                  <div style={{
                    width: isFirst ? "32px" : "28px", height: isFirst ? "32px" : "28px",
                    borderRadius: "50%",
                    background: isFirst ? rs.ring : `linear-gradient(135deg, ${rs.ring}, ${rs.ring}99)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: isFirst ? "14px" : "12px", fontWeight: 900,
                    color: isFirst ? "var(--brand-ink-slate)" : "var(--brand-white)", flexShrink: 0,
                  }}>
                    {p.rank}
                  </div>

                  {/* Photo — consistent container */}
                  <div style={{
                    width: "44px", height: "56px", borderRadius: "10px", overflow: "hidden",
                    flexShrink: 0, background: "var(--art-e2e8f0)",
                    border: isFirst ? `2px solid ${rs.ring}40` : "1px solid rgba(var(--rgb-15-23-42),0.06)",
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
                      color: isFirst ? "var(--brand-white)" : "var(--brand-ink-slate)",
                      letterSpacing: "-0.01em", lineHeight: 1.2,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {p.player}
                    </div>
                    <div style={{
                      fontSize: "10px", fontWeight: 600, marginTop: "2px",
                      color: isFirst ? "rgba(var(--rgb-255-255-255),0.5)" : "var(--art-64748b)",
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
                          color: isFirst ? "rgba(var(--rgb-255-255-255),0.4)" : "var(--brand-slate-400)",
                        }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Team logo — normalized container */}
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: isFirst ? "rgba(var(--rgb-255-255-255),0.1)" : "rgba(var(--rgb-15-23-42),0.04)",
                    border: `1px solid ${isFirst ? "rgba(var(--rgb-255-255-255),0.1)" : "rgba(var(--rgb-15-23-42),0.06)"}`,
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
            <div style={{ height: "1px", flex: 1, background: "linear-gradient(90deg, transparent, rgba(var(--rgb-15-23-42),0.12))" }} />
            <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(var(--rgb-15-23-42),0.35)" }}>
              CORE ESPORTS
            </span>
            <div style={{ height: "1px", flex: 1, background: "linear-gradient(90deg, rgba(var(--rgb-15-23-42),0.12), transparent)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
