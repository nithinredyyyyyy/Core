import React from "react";
import { getPlayerPhotoByIgn } from "@/lib/playerPhotos";
import { SF, CF } from "@/components/admin/instaPosters/utils/posterHelpers";
import { TeamLogo } from "@/components/admin/instaPosters/sections/TeamLogo";

/* â”€â”€â”€ TRANSFER â€” q1-style player photo bg + fromâ†’to with team logos â”€â”€â”€ */
export function TransferPoster({ manual, brandLogo, brandText }) {
  const pn = manual.playerName || "PLAYER NAME";
  const from = manual.teamName || "FORMER TEAM";
  const to = manual.subhead || "NEW TEAM";
  const photo = getPlayerPhotoByIgn(pn);
  return (
    <div className="insta-poster-export" style={{ width: 1080, height: 1350, borderRadius: 28, overflow: "hidden", position: "relative", background: "var(--art-0d1117)", color: "var(--brand-white)", fontFamily: SF }}>
      {photo ? (
        <div style={{ position: "absolute", inset: 0 }}>
          <img src={photo} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
        </div>
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, var(--art-1a2744), var(--art-0d1117), var(--art-2a1a0d))" }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(var(--rgb-0-0-0),0.2) 0%, rgba(var(--rgb-0-0-0),0) 18%, rgba(var(--rgb-0-0-0),0.08) 50%, rgba(var(--rgb-0-0-0),0.92) 100%)" }} />
      <div style={{ position: "relative", zIndex: 1, height: "100%", padding: "40px 48px 36px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={brandLogo || "/images/core-logo.svg"} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain", background: "rgba(var(--rgb-0-0-0),0.3)", padding: 4 }} />
          <span style={{ color: "rgba(var(--rgb-255-255-255),0.5)", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", fontFamily: CF, textTransform: "uppercase" }}>{brandText || (brandLogo ? "" : "CORE")}</span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <span style={{ display: "inline-block", alignSelf: "flex-start", padding: "6px 16px", borderRadius: 8, background: "var(--art-ff6b00)", boxShadow: "0 6px 20px rgba(var(--rgb-255-107-0),0.35)", marginBottom: 10, fontFamily: CF, fontSize: 13, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>{manual.kicker || "TRANSFER"}</span>
          <h1 style={{ margin: 0, fontFamily: CF, fontSize: 80, fontWeight: 700, lineHeight: 0.9, letterSpacing: "-0.01em", textTransform: "uppercase", textShadow: "0 4px 30px rgba(var(--rgb-0-0-0),0.5)" }}>{manual.headline || "PLAYER TRANSFER"}</h1>
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 44px 1fr", alignItems: "center", gap: 8 }}>
            <div style={{ padding: "16px 12px", borderRadius: 18, background: "rgba(var(--rgb-0-0-0),0.4)", backdropFilter: "blur(16px)", border: "1px solid rgba(var(--rgb-255-255-255),0.06)", textAlign: "center" }}>
              <p style={{ margin: 0, color: "rgba(var(--rgb-255-255-255),0.35)", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", fontFamily: CF, textTransform: "uppercase" }}>FROM</p>
              <div style={{ margin: "8px auto", width: 64, height: 64, borderRadius: 16, background: "rgba(var(--rgb-255-255-255),0.04)", display: "grid", placeItems: "center", overflow: "hidden" }}>
                <TeamLogo teamName={from} size={50} framed={false} />
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em" }}>{from}</p>
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, var(--art-2563eb), var(--art-ff6b00))", display: "grid", placeItems: "center", boxShadow: "0 6px 20px rgba(var(--rgb-255-107-0),0.25)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-white)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </div>
            <div style={{ padding: "16px 12px", borderRadius: 18, background: "rgba(var(--rgb-255-107-0),0.1)", backdropFilter: "blur(16px)", border: "1px solid rgba(var(--rgb-255-107-0),0.12)", textAlign: "center" }}>
              <p style={{ margin: 0, color: "var(--art-ff6b00)", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", fontFamily: CF, textTransform: "uppercase" }}>TO</p>
              <div style={{ margin: "8px auto", width: 64, height: 64, borderRadius: 16, background: "rgba(var(--rgb-255-255-255),0.06)", display: "grid", placeItems: "center", overflow: "hidden" }}>
                <TeamLogo teamName={to} size={50} framed={false} />
              </div>
              <p style={{ margin: "4px 0 0", color: "var(--art-ff6b00)", fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em" }}>{to}</p>
            </div>
          </div>
          <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
            <div style={{ padding: "10px 32px", borderRadius: 14, background: "rgba(var(--rgb-0-0-0),0.45)", backdropFilter: "blur(16px)", border: "1px solid rgba(var(--rgb-255-255-255),0.08)" }}>
              <span style={{ fontFamily: CF, fontSize: 44, fontWeight: 700, letterSpacing: "-0.01em", textTransform: "uppercase" }}>{pn}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
