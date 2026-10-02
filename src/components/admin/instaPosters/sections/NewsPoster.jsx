import React from "react";
import { SF, CF, formatDate } from "@/components/admin/instaPosters/utils/posterHelpers";

/* â”€â”€â”€ NEWS â€” q1-style full-bleed image + gradient + overlaid headline â”€â”€â”€ */
export function NewsPoster({ tournament, article, manual, brandLogo, brandText }) {
  const hasImg = !!article?.thumbnail_url;
  return (
    <div className="insta-poster-export" style={{ width: 1080, height: 1350, borderRadius: 28, overflow: "hidden", position: "relative", background: "#111", color: "#fff", fontFamily: SF }}>
      {hasImg ? (
        <div style={{ position: "absolute", inset: 0 }}>
          <img src={article.thumbnail_url} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #111, #1a2744)" }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.88) 100%)" }} />
      <div style={{ position: "relative", zIndex: 1, height: "100%", padding: "40px 48px 36px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={brandLogo || "/images/core-logo.svg"} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain", background: "rgba(0,0,0,0.3)", padding: 4 }} />
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", fontFamily: CF, textTransform: "uppercase" }}>{brandText || (brandLogo ? "" : "CORE")}</span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <span style={{ display: "inline-block", alignSelf: "flex-start", padding: "5px 14px", borderRadius: 6, background: "#ff6b00", color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", fontFamily: CF, textTransform: "uppercase", marginBottom: 10 }}>{manual.kicker || article?.category || "BREAKING"}</span>
          <h1 style={{ margin: 0, fontFamily: CF, fontSize: 76, fontWeight: 700, lineHeight: 0.9, letterSpacing: "-0.01em", textTransform: "uppercase", textShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>{manual.headline || article?.title || "BREAKING STORY"}</h1>
          <p style={{ margin: "10px 0 0", color: "rgba(255,255,255,0.6)", fontSize: 20, lineHeight: 1.3, fontWeight: 500, maxWidth: 680 }}>{manual.subhead || article?.summary || article?.ai_summary || ""}</p>
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 3, borderRadius: 2, background: "#ff6b00" }} />
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>{article?.source_name || "StageCore"}{article?.created_date ? ` \u00B7 ${formatDate(article.created_date)}` : ""}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
