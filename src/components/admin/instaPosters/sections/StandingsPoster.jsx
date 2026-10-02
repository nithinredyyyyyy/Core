import React from "react";
import { SF, CF, getTeamName, getStandingPoints } from "@/components/admin/instaPosters/utils/posterHelpers";
import { TeamLogo } from "@/components/admin/instaPosters/sections/TeamLogo";

/* â”€â”€â”€ STANDINGS â€” q2 clean white card + q3 massive headline â”€â”€â”€ */
export function StandingsPoster({ tournament, stageName, rows, manual }) {
  const shown = rows.slice(0, 16);
  const title = manual.headline || stageName || "STANDINGS";
  const isBgms = /bgms|masters\s*series/i.test(tournament?.name);
  const seriesLabel = isBgms ? "MASTERS SERIES" : tournament?.name?.includes("Pro Series") ? "PRO SERIES" : tournament?.name || "TOURNAMENT";
  const callout = manual.subhead || "Finals Recap";
  const ink = "var(--art-1a1207)";
  const inkDim = "var(--art-6b6358)";
  const line = "var(--art-e8e2da)";
  const orange = "var(--art-e85d1f)";
  const gold = "var(--art-c98a1f)";
  const silver = "var(--art-8a90a0)";
  const bronze = "var(--art-b06a34)";

  return (
    <div className="insta-poster-export" style={{ width: 1080, height: 1350, borderRadius: 22, overflow: "hidden", position: "relative", background: "var(--art-fdf8f2)", fontFamily: SF, boxShadow: "0 40px 80px -30px rgba(var(--rgb-40-20-0),.25)", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "linear-gradient(150deg, var(--art-e85d1f) 0%, var(--art-f59e42) 100%)", padding: "40px 48px 34px", color: "var(--brand-white)", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(var(--rgb-255-255-255),0.12), transparent)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/images/core-logo.png" alt="Core Esports" style={{ height: 36, width: "auto", objectFit: "contain" }} />
            <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>CORE ESPORTS</span>
          </div>
          <img src={isBgms ? "/images/NODWIN.png" : tournament?.logo || "/images/BGMS.png"} alt={seriesLabel} style={{ height: 40, width: "auto", objectFit: "contain", mixBlendMode: "multiply" }} />
        </div>
        <h1 style={{ margin: "0 0 14px", fontFamily: CF, fontSize: 72, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.015em", textTransform: "uppercase", position: "relative", zIndex: 1, textShadow: "0 2px 12px rgba(var(--rgb-0-0-0),.12)" }}>{title}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 1 }}>
          <span style={{ display: "inline-flex", alignItems: "center", padding: "8px 16px", borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: orange, background: "var(--brand-white)" }}>{callout}</span>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "rgba(var(--rgb-255-255-255),.88)", background: "rgba(var(--rgb-255-255-255),.22)", padding: "8px 14px", borderRadius: 999 }}>{shown.length} TEAMS</span>
        </div>
      </div>
      <div style={{ padding: "0 48px", flex: 1, display: "flex", flexDirection: "column" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ width: 52, padding: "18px 0 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: inkDim, textAlign: "center", borderBottom: `1px solid ${line}`, background: "var(--art-fdf8f2)" }}>#</th>
              <th style={{ textAlign: "left", padding: "18px 0 14px 4px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: inkDim, borderBottom: `1px solid ${line}`, background: "var(--art-fdf8f2)" }}>TEAM</th>
              <th style={{ width: 90, padding: "18px 4px 14px 0", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: inkDim, textAlign: "right", borderBottom: `1px solid ${line}`, background: "var(--art-fdf8f2)" }}>PTS</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((row, i) => {
              const tn = getTeamName(row);
              const rank = row.rank || i + 1;
              const pts = getStandingPoints(row);
              const isTop3 = i < 3;
              const isAlt = i % 2 === 1;
              const podiumColors = [gold, silver, bronze];
              const podiumBgs = [
                "linear-gradient(90deg, var(--art-fff3d9), var(--art-fff3d9) 20%, transparent 80%)",
                "linear-gradient(90deg, var(--art-f0f1f5), var(--art-f0f1f5) 20%, transparent 80%)",
                "linear-gradient(90deg, var(--art-fbe9dc), var(--art-fbe9dc) 20%, transparent 80%)",
              ];
              const chipBgs = [
                "linear-gradient(135deg, var(--art-fef3c7), var(--art-fde68a))",
                "linear-gradient(135deg, var(--art-f1f5f9), var(--art-e2e8f0))",
                "linear-gradient(135deg, var(--art-fed7aa), var(--brand-orange-soft-2))",
              ];
              const chipColors = ["var(--art-92400e)", "var(--art-475569)", "var(--art-9a3412)"];
              return (
                <tr key={`${tn}-${i}`} style={{ borderBottom: `1px solid ${line}`, background: isTop3 ? podiumBgs[i] : isAlt ? "var(--art-f8f2e9)" : "transparent", borderLeft: isTop3 ? `4px solid ${podiumColors[i]}` : "4px solid transparent" }}>
                  <td style={{ padding: "14px 0", textAlign: "center", fontSize: isTop3 ? 26 : 20, fontWeight: 700, color: isTop3 ? ink : inkDim, fontVariantNumeric: "tabular-nums", width: 52 }}>{rank}</td>
                  <td style={{ padding: "14px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ width: isTop3 ? 56 : 52, height: isTop3 ? 56 : 52, borderRadius: 12, background: "var(--brand-white)", border: isTop3 ? `2px solid ${podiumColors[i]}` : `1px solid ${line}`, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(var(--rgb-0-0-0),.06)", padding: 6 }}>
                        <TeamLogo teamName={tn} size={isTop3 ? 44 : 40} framed={false} />
                      </div>
                      <span style={{ fontSize: isTop3 ? 22 : 20, fontWeight: isTop3 ? 800 : 700, color: ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: isTop3 ? "0.01em" : "-0.01em" }}>{tn}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 4px 14px 0", textAlign: "right" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 56, padding: "8px 16px", borderRadius: 8, fontSize: 20, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em", background: isTop3 ? chipBgs[i] : "var(--art-fdece0)", color: isTop3 ? chipColors[i] : orange, boxShadow: isTop3 ? `0 2px 6px ${i === 0 ? "rgba(var(--rgb-212-175-55),0.25)" : i === 1 ? "rgba(var(--rgb-0-0-0),0.06)" : "rgba(var(--rgb-205-127-50),0.15)"}` : "none" }}>{pts}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ padding: "20px 48px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: inkDim, letterSpacing: "0.06em" }}>{title} — Core Arena</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: inkDim, letterSpacing: "0.06em" }}>CORE ESPORTS © 2026</span>
      </div>
    </div>
  );
}
