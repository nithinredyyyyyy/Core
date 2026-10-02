import React from "react";
import { getPlayerPhotoByIgn } from "@/lib/playerPhotos";
import { SF, CF } from "@/components/admin/instaPosters/utils/posterHelpers";
import { TeamLogo } from "@/components/admin/instaPosters/sections/TeamLogo";

/* â”€â”€â”€ PLAYER AWARD (IGL/FMVP/MVP) â€” q1-style full-bleed player photo + massive name â”€â”€â”€ */
export function PlayerAwardPoster({ awardLabel, player, manual, brandLogo, brandText }) {
  const pn = manual.playerName || player?.player || "";
  const tn = manual.teamName || player?.teamName || "";
  const s1l = manual.statOneLabel || (awardLabel === "Best IGL" ? "IGL RATING" : "FINISHES");
  const s1v = manual.statOneValue || player?.iglRating || player?.finishes || "0";
  const s2l = manual.statTwoLabel || (awardLabel === "Best IGL" ? "TOP 5s" : "DAMAGE");
  const s2v = manual.statTwoValue || player?.top5s || player?.damage || "0";
  const isIGL = awardLabel === "Best IGL";
  const accent = isIGL ? "var(--art-06b6d4)" : "var(--art-ff6b00)";
  const photo = getPlayerPhotoByIgn(pn);
  return (
    <div className="insta-poster-export" style={{ width: 1080, height: 1350, borderRadius: 28, overflow: "hidden", position: "relative", background: "var(--brand-ink-pure)", color: "var(--brand-white)", fontFamily: SF }}>
      {photo ? (
        <div style={{ position: "absolute", inset: 0 }}>
          <img src={photo} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
        </div>
      ) : (
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg, ${accent}30, var(--brand-ink-pure))` }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg, ${accent}20, transparent 35%)` }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(var(--rgb-0-0-0),0.25) 0%, rgba(var(--rgb-0-0-0),0) 18%, rgba(var(--rgb-0-0-0),0.08) 50%, rgba(var(--rgb-0-0-0),0.92) 100%)" }} />
      <div style={{ position: "relative", zIndex: 1, height: "100%", padding: "40px 48px 36px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={brandLogo || "/images/core-logo.svg"} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain", background: "rgba(var(--rgb-0-0-0),0.3)", padding: 4 }} />
          <span style={{ color: "rgba(var(--rgb-255-255-255),0.5)", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", fontFamily: CF, textTransform: "uppercase" }}>{brandText || (brandLogo ? "" : "CORE")}</span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <span style={{ display: "inline-block", alignSelf: "flex-start", padding: "6px 16px", borderRadius: 8, background: accent, boxShadow: `0 6px 20px ${accent}50`, marginBottom: 10, fontFamily: CF, fontSize: 13, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>{manual.kicker || awardLabel}</span>
          <h1 style={{ margin: 0, fontFamily: CF, fontSize: 100, fontWeight: 700, lineHeight: 0.88, letterSpacing: "-0.01em", textTransform: "uppercase", textShadow: "0 4px 30px rgba(var(--rgb-0-0-0),0.5)" }}>{manual.headline || pn || "PLAYER"}</h1>
          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
            <TeamLogo teamName={tn} size={24} />
            <span style={{ color: "rgba(var(--rgb-255-255-255),0.5)", fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{tn}</span>
          </div>
          <p style={{ margin: "4px 0 0", fontFamily: CF, color: accent, fontSize: 14, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>{manual.subhead || `${awardLabel} OF THE TOURNAMENT`}</p>
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[[s1l, s1v], [s2l, s2v]].map(([l, v]) => (
              <div key={l} style={{ padding: "12px 16px", borderRadius: 14, background: "rgba(var(--rgb-0-0-0),0.45)", backdropFilter: "blur(16px)", border: "1px solid rgba(var(--rgb-255-255-255),0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "rgba(var(--rgb-255-255-255),0.4)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", fontFamily: CF, textTransform: "uppercase" }}>{l}</span>
                <span style={{ fontFamily: CF, fontSize: 32, fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
