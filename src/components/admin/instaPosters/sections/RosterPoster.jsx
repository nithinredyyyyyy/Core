import React from "react";
import { getPlayerPhotoByIgn } from "@/lib/playerPhotos";
import { SF, CF, makeInitials } from "@/components/admin/instaPosters/utils/posterHelpers";
import { TeamLogo } from "@/components/admin/instaPosters/sections/TeamLogo";

/* â”€â”€â”€ ROSTER â€” q1-style: team logo hero + player strip on dark bg â”€â”€â”€ */
export function RosterPoster({ teamName, roster, manual, brandLogo, brandText }) {
  return (
    <div className="insta-poster-export" style={{ width: 1080, height: 1350, borderRadius: 28, overflow: "hidden", position: "relative", background: "linear-gradient(170deg, #0d1117 0%, #161b22 100%)", color: "#fff", fontFamily: SF }}>
      <div style={{ position: "absolute", top: -80, right: -80, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,0,0.08), transparent 70%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "linear-gradient(90deg, #ff6b00, #ff6b00 50%, transparent)" }} />
      <div style={{ position: "relative", zIndex: 1, height: "100%", padding: "40px 48px 36px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={brandLogo || "/images/core-logo.svg"} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", fontFamily: CF, textTransform: "uppercase" }}>{brandText || (brandLogo ? "" : "CORE")}</span>
          </div>
        </div>
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 90, height: 90, borderRadius: 22, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "grid", placeItems: "center", overflow: "hidden", boxShadow: "0 16px 40px rgba(0,0,0,0.3)" }}>
            <TeamLogo teamName={teamName} size={72} framed={false} />
          </div>
          <div>
            <p style={{ margin: 0, fontFamily: CF, color: "#ff6b00", fontSize: 14, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" }}>{manual.subhead || "ROSTER"}</p>
            <h1 style={{ margin: "2px 0 0", fontFamily: CF, fontSize: 72, fontWeight: 700, lineHeight: 0.9, letterSpacing: "-0.01em" }}>{manual.headline || teamName || "TEAM"}</h1>
          </div>
        </div>
        <div style={{ flex: 1, marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignContent: "start" }}>
          {roster.slice(0, 6).map((player, i) => {
            const photo = getPlayerPhotoByIgn(player);
            return (
              <div key={`${player}-${i}`} style={{ height: 140, borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 12, position: "relative" }}>
                <div style={{ position: "absolute", top: 8, left: 8, width: 26, height: 26, borderRadius: "50%", background: i === 0 ? "#ff6b00" : "rgba(255,255,255,0.06)", display: "grid", placeItems: "center" }}>
                  <span style={{ color: i === 0 ? "#fff" : "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 700, fontFamily: CF }}>{String(i + 1).padStart(2, "0")}</span>
                </div>
                {photo ? (
                  <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(255,255,255,0.08)" }}>
                    <img src={photo} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, rgba(255,107,0,0.15), rgba(255,107,0,0.03))", border: "1px solid rgba(255,107,0,0.1)", display: "grid", placeItems: "center" }}>
                    <span style={{ color: "#ff6b00", fontSize: 20, fontWeight: 700, fontFamily: CF }}>{makeInitials(player)}</span>
                  </div>
                )}
                <span style={{ marginTop: 6, fontSize: 14, fontWeight: 800, textTransform: "uppercase", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%", letterSpacing: "0.02em" }}>{player}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
