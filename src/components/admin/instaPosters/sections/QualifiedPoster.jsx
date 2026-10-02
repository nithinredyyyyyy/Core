import React from "react";
import { SF, CF, getTeamName } from "@/components/admin/instaPosters/utils/posterHelpers";
import { TeamLogo } from "@/components/admin/instaPosters/sections/TeamLogo";

/* â”€â”€â”€ QUALIFIED â€” q2 floating cards + q3 massive headline â”€â”€â”€ */
export function QualifiedPoster({ stageName, rows, manual, brandLogo, brandText }) {
  const shown = rows.slice(0, 16);
  return (
    <div className="insta-poster-export" style={{ width: 1080, height: 1350, borderRadius: 28, overflow: "hidden", position: "relative", background: "#f5f5f7", color: "#111", fontFamily: SF }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 28px, rgba(0,0,0,0.018) 28px, rgba(0,0,0,0.018) 29px)" }} />
      <div style={{ position: "relative", zIndex: 1, height: "100%", padding: "40px 48px 36px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={brandLogo || "/images/core-logo.svg"} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
            <span style={{ color: "#999", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", fontFamily: CF, textTransform: "uppercase" }}>{brandText || (brandLogo ? "" : "CORE")}</span>
          </div>
        </div>
        <h1 style={{ margin: "16px 0 0", fontFamily: CF, fontSize: 120, fontWeight: 700, lineHeight: 0.88, letterSpacing: "-0.02em", textTransform: "uppercase" }}>{manual.headline || "QUALIFIED"}</h1>
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "#16a34a" }} />
          <span style={{ color: "#999", fontSize: 13, fontWeight: 600, letterSpacing: "0.16em", fontFamily: CF, textTransform: "uppercase" }}>{manual.subhead || `${stageName || "NEXT STAGE"} CONTENDERS`}</span>
        </div>
        <div style={{ flex: 1, marginTop: 14, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, alignContent: "start" }}>
          {shown.map((row, i) => {
            const tn = getTeamName(row);
            const top = i < 4;
            return (
              <div key={`${tn}-${i}`} style={{ height: 140, borderRadius: 18, background: "#fff", boxShadow: top ? "0 12px 32px rgba(22,163,74,0.1), 0 0 0 2px rgba(22,163,74,0.12)" : "0 4px 16px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 10, position: "relative" }}>
                {top && <div style={{ position: "absolute", top: -5, right: -5, width: 22, height: 22, borderRadius: "50%", background: "#16a34a", display: "grid", placeItems: "center" }}><span style={{ color: "#fff", fontSize: 10, fontWeight: 700, fontFamily: CF }}>{i + 1}</span></div>}
                <TeamLogo teamName={tn} size={48} framed={false} />
                <div style={{ marginTop: 5, fontFamily: CF, fontSize: 13, fontWeight: 700, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tn}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
