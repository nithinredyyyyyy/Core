import React from "react";
import { SF, CF } from "@/components/admin/instaPosters/utils/posterHelpers";
import { TeamLogo } from "@/components/admin/instaPosters/sections/TeamLogo";

/* â”€â”€â”€ PLACEMENT (Champion/RunnerUp/2ndRunnerUp) â€” q3-style MASSIVE type filling width + centered logo â”€â”€â”€ */
export function PlacementPoster({ tournament, teamName, placeLabel, headline, accent, manual, brandLogo, brandText }) {
  const isChamp = placeLabel === "Champions";
  return (
    <div className="insta-poster-export" style={{ width: 1080, height: 1350, borderRadius: 28, overflow: "hidden", position: "relative", background: "var(--brand-white)", fontFamily: SF }}>
      {/* Accent bar top */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: accent }} />
      {/* Subtle texture */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 28px, rgba(var(--rgb-0-0-0),0.012) 28px, rgba(var(--rgb-0-0-0),0.012) 29px)" }} />
      {/* Giant faded rank number */}
      <div style={{ position: "absolute", top: 80, right: 40, fontFamily: CF, fontSize: 400, fontWeight: 700, color: `${accent}08`, lineHeight: 0.8, letterSpacing: "-0.04em" }}>
        {isChamp ? "1" : placeLabel === "2nd Place" ? "2" : "3"}
      </div>
      <div style={{ position: "relative", zIndex: 1, height: "100%", padding: "40px 48px 36px", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={brandLogo || "/images/core-logo.svg"} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
            <span style={{ color: "var(--art-999999)", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", fontFamily: CF, textTransform: "uppercase" }}>{brandText || (brandLogo ? "" : "CORE")}</span>
          </div>
          <span style={{ display: "inline-block", padding: "8px 20px", borderRadius: 10, background: accent, fontFamily: CF, fontSize: 14, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--brand-white)", boxShadow: `0 8px 24px ${accent}30` }}>{manual.kicker || placeLabel}</span>
        </div>
        {/* Center content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          {/* Team logo in diamond frame */}
          <div style={{ position: "relative", marginBottom: 32 }}>
            <div style={{ width: 280, height: 280, borderRadius: 40, background: `${accent}06`, border: `3px solid ${accent}15`, display: "grid", placeItems: "center", boxShadow: `0 32px 64px ${accent}10`, transform: "rotate(45deg)" }}>
              <div style={{ transform: "rotate(-45deg)" }}>
                <TeamLogo teamName={teamName} size={180} framed={false} />
              </div>
            </div>
            {/* Crown icon for champion */}
            {isChamp && (
              <div style={{ position: "absolute", top: -28, left: "50%", transform: "translateX(-50%)", width: 56, height: 56, borderRadius: "50%", background: accent, display: "grid", placeItems: "center", boxShadow: `0 8px 24px ${accent}40` }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-white)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/></svg>
              </div>
            )}
          </div>
          {/* Headline */}
          <h1 style={{ margin: 0, fontFamily: CF, fontSize: isChamp ? 140 : 110, fontWeight: 700, lineHeight: 0.85, letterSpacing: "-0.03em", textTransform: "uppercase", color: accent }}>{manual.headline || headline}</h1>
          {/* Team name */}
          <div style={{ marginTop: 16, padding: "10px 32px", borderRadius: 12, background: "var(--brand-sky-snow)", border: "1px solid var(--art-e2e8f0)" }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "var(--art-1e293b)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{manual.teamName || teamName || "SELECT A TEAM"}</span>
          </div>
        </div>
        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <span style={{ color: "var(--art-cbd5e1)", fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", fontFamily: CF, textTransform: "uppercase" }}>Grand Finals · {tournament?.name || "PEL 2026"}</span>
        </div>
      </div>
    </div>
  );
}
