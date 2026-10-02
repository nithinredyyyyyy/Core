import React from "react";
import { AwardIcon } from "./AwardIcon";

const SF = "'Inter', system-ui, sans-serif";
const WHITE_LOGO_TEAMS = ["ULF Esports", "Kara Esports", "R8 Esports", "eArena", "Gladiators Esports", "Dplus", "Horaa Esports", "Reject"];

export default function NftCardPoster({ award, player, teamName, teamLogo, photo, tournament, tournamentLogo, statValues = {} }) {
  const isPmgc = /pmgc|global\s*championship/i.test(tournament?.name);
  const isPmwc = /pmwc|world\s*cup|bmsd|bmic|showdown|international\s*cup|in.*kr|india.*korea|invitational|bgms|masters\s*series/i.test(tournament?.name);
  const isBgms = /bgms|masters\s*series/i.test(tournament?.name);
  const stats = isPmgc && award.pmgcStats ? award.pmgcStats : isBgms && award.bgmsStats ? award.bgmsStats : award.stats;
  const filledStats = stats.filter((s) => {
    const val = statValues[s.key];
    return val != null && val !== "" && val !== "—" && val !== 0;
  });
  const forceWhiteLogo = WHITE_LOGO_TEAMS.includes(teamName);

  return (
    <div className="poster-root">
      <div style={{
        width: "min(90vw, 540px)", aspectRatio: "4 / 5", position: "relative",
        overflow: "hidden", borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(var(--rgb-0-0-0),0.08), 0 16px 48px rgba(var(--rgb-0-0-0),0.14)",
      }}>

        {/* ===== BG: Gradient + Grid ===== */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, var(--art-e8600a) 0%, var(--art-f28c5e) 18%, var(--art-f9b89a) 30%, var(--art-fde4d4) 42%, var(--art-fdf0ea) 52%, var(--art-f5f0ec) 62%, var(--art-f2eeeb) 75%, var(--art-f0ece8) 100%)",
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

        {/* ===== Top logos: Krafton left, Core right ===== */}
        <div style={{ position: "absolute", top: "14px", left: "18px", right: "18px", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <img src={isBgms ? "/images/NODWIN.png" : "/images/Krafton.png"} alt="Publisher" style={{ height: "32px", width: "auto", objectFit: "contain", opacity: 0.9 }} />
          <img src="/images/core-logo.png" alt="Core" style={{ height: "32px", width: "auto", objectFit: "contain", opacity: 0.75 }} />
        </div>

        {/* ===== NFT CARD ===== */}
        <div style={{
          position: "absolute", top: "72px", left: "50%",
          transform: "translateX(-50%)", zIndex: 5,
          width: "290px",
        }}>
          <div style={{
            background: "var(--art-0a0a0a)",
            borderRadius: "22px",
            padding: "10px",
            boxShadow: "0 20px 60px rgba(var(--rgb-0-0-0),0.35)",
          }}>
            <div style={{
              background: "var(--art-111318)",
              borderRadius: "14px",
              overflow: "hidden",
            }}>

              {/* === Rarity badge === */}
              <div style={{ display: "flex", justifyContent: "center", marginTop: "-2px", position: "relative", zIndex: 6 }}>
                <div style={{ background: "var(--art-0a0a0a)", borderRadius: "0 0 12px 12px", padding: "2px 2px 0" }}>
                  <div style={{ background: award.gradient, borderRadius: "0 0 10px 10px", padding: "5px 20px 7px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <AwardIcon type={award.icon} size={12} color="var(--brand-white)" />
                    <span style={{ fontFamily: SF, fontSize: "11px", fontWeight: 800, color: "var(--brand-white)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{award.label}</span>
                  </div>
                </div>
              </div>

              {/* ===== Image panel ===== */}
              <div style={{ padding: "0 8px" }}>
                <div style={{ position: "relative", height: "280px", borderRadius: "10px", overflow: "hidden", background: "var(--art-0f1219)" }}>
                  {photo ? (
                    <img src={photo} alt={player} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg, var(--art-1e293b), var(--brand-ink-slate))", fontFamily: SF, fontSize: "48px", fontWeight: 900, color: award.color }}>{player?.slice(0, 2)?.toUpperCase()}</div>
                  )}
                  {/* Tournament logo badge — top right of photo */}
                  {tournamentLogo && (
                    <div style={{
                      position: "absolute", top: "10px", right: "10px", zIndex: 6,
                      width: "36px", height: "36px", background: "rgba(var(--rgb-10-10-10),0.8)", borderRadius: "10px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid rgba(var(--rgb-255-255-255),0.2)",
                      boxShadow: "0 0 12px rgba(var(--rgb-0-0-0),0.4)",
                    }}>
                      <img src={tournamentLogo} alt="" style={{ width: "22px", height: "22px", objectFit: "contain", ...(isPmwc ? { filter: "brightness(0) invert(1)" } : {}) }} />
                    </div>
                  )}
                </div>
              </div>

              {/* ===== Information section ===== */}
              <div style={{ padding: "16px 16px 0" }}>
                <div style={{ fontFamily: SF, fontSize: "26px", fontWeight: 800, color: "var(--brand-white)", letterSpacing: "0.01em", marginBottom: "8px" }}>
                  {player}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                  {teamLogo && (
                    <div style={{
                      width: "32px", height: "32px", background: "var(--art-1a1d22)", borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid var(--art-252830)", flexShrink: 0,
                    }}>
                      <div style={{ width: "18px", height: "18px", ...(forceWhiteLogo ? { filter: "brightness(0) invert(1)" } : {}) }}>
                        <img src={teamLogo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      </div>
                    </div>
                  )}
                  <span style={{ fontFamily: SF, fontSize: "13px", fontWeight: 700, color: "rgba(var(--rgb-255-255-255),0.5)", letterSpacing: "0.03em" }}>{teamName}</span>
                </div>
              </div>

              {/* ===== Statistics panel ===== */}
              {filledStats.length > 0 && (
                <div style={{
                  margin: "0 8px 8px", background: "var(--art-191c22)", borderRadius: "12px",
                  padding: "14px 16px", display: "flex", justifyContent: "space-around", gap: "8px",
                }}>
                  {filledStats.map((stat, i) => (
                    <div key={i} style={{ textAlign: "center", flex: 1 }}>
                      <div style={{ fontFamily: SF, fontSize: "10px", fontWeight: 600, color: "rgba(var(--rgb-255-255-255),0.4)", letterSpacing: "0.06em", marginBottom: "4px" }}>{stat.label}</div>
                      <div style={{ fontFamily: SF, fontSize: "15px", fontWeight: 800, color: "var(--brand-white)", whiteSpace: "nowrap" }}>
                        {statValues[stat.key]}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ===== Footer in background ===== */}
        <div style={{ position: "absolute", bottom: "12px", left: "0", right: "0", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <div style={{ width: "20px", height: "1px", background: "rgba(var(--rgb-15-23-42),0.15)" }} />
          <span style={{ fontFamily: SF, fontSize: "7px", fontWeight: 700, color: "rgba(var(--rgb-15-23-42),0.3)", letterSpacing: "0.25em", textTransform: "uppercase" }}>CORE ESPORTS</span>
          <div style={{ width: "20px", height: "1px", background: "rgba(var(--rgb-15-23-42),0.15)" }} />
        </div>

      </div>
    </div>
  );
}
