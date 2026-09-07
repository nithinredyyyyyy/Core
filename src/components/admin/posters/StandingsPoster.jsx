import React from "react";
import { getTeamLogoByName } from "@/lib/teamLogos";
import { getMedalIcon } from "./posterStandingsHelpers";

const STARS = [
  { top: "250px", left: "26px", size: "24px" },
  { top: "305px", left: "56px", size: "18px" },
  { top: "355px", left: "16px", size: "30px" },
  { top: "610px", right: "36px", size: "20px" },
  { top: "665px", right: "12px", size: "16px" },
  { top: "715px", right: "50px", size: "24px" },
];

const IG_SOCIAL = [
  { label: "Instagram", handle: "/coreesports", color: "#E1306C", iconChar: "◎" },
  { label: "X", handle: "/coreesports", color: "#000000", iconChar: "𝕏" },
  { label: "Facebook", handle: "/coreesports", color: "#1877F2", iconChar: "f" },
  { label: "Thread", handle: "/coreesports", color: "#000000", iconChar: "↻" },
  { label: "Website", handle: "www.coreesports.com", color: "#6B7280", iconChar: "🌐" },
];

function TeamRow({ row, index, isIg }) {
  const logo = getTeamLogoByName(row.logoName || row.teamName);
  const isTop = index < 6;

  if (isIg) {
    return (
      <tr className={`ig-row ${index < 3 ? `ig-row-podium ig-p${index + 1}` : index % 2 === 1 ? "ig-alt" : ""}`}>
        <td className="ig-rank">{index + 1}</td>
        <td>
          <div className="ig-team-cell">
            <div className="ig-badge">
              {logo ? <img src={logo} alt={row.teamName} /> : <span>{row.teamName?.slice(0, 2)?.toUpperCase()}</span>}
            </div>
            <span className="ig-team-name">{row.teamName}</span>
          </div>
        </td>
        <td className="ig-pts">
          <span className="poster-standings-v2-total-val">{row.points || 0}</span>
        </td>
      </tr>
    );
  }

  return (
    <div className={`poster-standings-v2-row ${isTop ? "poster-standings-v2-row-top" : "poster-standings-v2-row-rest"}`}>
      <span className="poster-standings-v2-rank">{index + 1}</span>
      <span className="poster-standings-v2-team-cell">
        <span className="poster-standings-v2-badge">
          {logo ? <img src={logo} alt={row.teamName} /> : <span>{row.teamName?.slice(0, 2)?.toUpperCase()}</span>}
        </span>
        <span className="poster-standings-v2-team-name">{row.teamName}</span>
      </span>
      <span className="poster-standings-v2-stat"><span className="poster-standings-v2-stat-circle">{row.matches || 0}</span></span>
      <span className="poster-standings-v2-stat"><span className="poster-standings-v2-stat-circle">{row.wwcd || 0}</span></span>
      <span className="poster-standings-v2-stat"><span className="poster-standings-v2-stat-circle">{row.placementPoints || 0}</span></span>
      <span className="poster-standings-v2-pts">{row.points || 0}</span>
    </div>
  );
}

export default function StandingsPoster({ activeOption, standingsRows, tournament, tournamentLogo, posterFormat, slide = 0 }) {
  const isGrandFinals = String(activeOption?.stage || "").toLowerCase() === "grand finals";
  const isBgms = /bgms|masters\s*series/i.test(tournament?.name);
  const seriesLabel = isBgms ? "BGMI MASTERS SERIES" : tournament?.name || "TOURNAMENT";
  const isIg = posterFormat === "instagram";

  if (isIg) {
    const CALLS = [
      "Finals Recap",
      "Grand Finals Results",
      "Tournament Results",
      "Championship Day",
      "Playoffs Recap",
    ];
    const callout = CALLS[slide % CALLS.length];
    const totalSlides = Math.ceil(standingsRows.length / 8);
    const paginatedRows = slide === 0
      ? standingsRows.slice(0, 3)
      : standingsRows.slice(3 + (slide - 1) * 8, 3 + slide * 8);
    const startRank = slide === 0 ? 1 : 4 + (slide - 1) * 8;

    return (
      <div className="poster-root">
        <div className="ig-standings">
          <div className="ig-head">
            <div className="ig-top-row">
              <div className="ig-brand">
                <img src="/images/core-logo.png" alt="Core Esports" className="ig-brand-logo" />
                <span className="ig-brand-text">CORE ESPORTS</span>
              </div>
              <img src={isBgms ? "/images/NODWIN.png" : tournament?.logo || "/images/core-logo.png"} alt={seriesLabel} className="ig-series-logo" />
            </div>
            <h1 className="ig-title">{activeOption?.stage || "Standings"}</h1>
            <div className="ig-sub-row">
              <span className="ig-callout">{callout}</span>
              <span className="ig-team-count">{standingsRows.length} TEAMS</span>
            </div>
          </div>

          <div className="ig-table-area">
            <table className="ig-table">
              <thead>
                <tr>
                  <th className="ig-th-rank">#</th>
                  <th className="ig-th-team">TEAM</th>
                  <th className="ig-th-pts">PTS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row, i) => {
                  const actualIndex = startRank - 1 + i;
                  return (
                    <TeamRow
                      key={row.teamId || row.teamName}
                      row={row}
                      index={actualIndex}
                      isIg={true}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="ig-foot">
            <span className="ig-venue">{activeOption?.stage || "STANDINGS"} — Core Arena</span>
            {totalSlides > 1 && (
              <span className="ig-dots">
                {Array.from({ length: totalSlides }, (_, i) => (
                  <span key={i} className={`ig-dot ${i === slide ? "ig-dot-active" : ""}`} />
                ))}
              </span>
            )}
            <span className="ig-copyright">CORE ESPORTS © 2026</span>
          </div>
        </div>
      </div>
    );
  }

  const eventPill = isBgms ? "BGMS 2026" : (activeOption?.stage || "STANDINGS");
  const eventDate = isGrandFinals
    ? "Grand Finals \u00b7 Day 3 of 3 \u00b7 Sep 6, 2026"
    : activeOption?.stage || "Season 5";

  return (
    <div className="poster-root">
      <div className="poster-standings-v2">
        {/* Fold corners */}
        <div className="poster-standings-v2-fold poster-standings-v2-fold-tl" />
        <div className="poster-standings-v2-fold poster-standings-v2-fold-br" />

        {/* Stars */}
        <div className="poster-standings-v2-stars">
          {STARS.map((s, i) => (
            <span
              key={i}
              className="poster-standings-v2-star"
              style={{ top: s.top, left: s.left, right: s.right, fontSize: s.size }}
            >&#9733;</span>
          ))}
        </div>

        {/* Watermarks */}
        <div className="poster-standings-v2-watermark-top">
          <span>CORE ESPORTS</span><span>BGMS 2026</span><span>CORE ESPORTS</span><span>BGMS 2026</span>
        </div>
        <div className="poster-standings-v2-watermark-bottom">
          <span>CORE ESPORTS</span><span>BGMS 2026</span><span>CORE ESPORTS</span><span>BGMS 2026</span>
        </div>
        <div className="poster-standings-v2-watermark-left">
          <span>CORE ESPORTS</span><span>CORE ESPORTS</span><span>CORE ESPORTS</span>
        </div>
        <div className="poster-standings-v2-watermark-right">
          <span>CORE ESPORTS</span><span>CORE ESPORTS</span><span>CORE ESPORTS</span>
        </div>

        {/* Inner card */}
        <div className="poster-standings-v2-card">
          {/* Brand row */}
          <div className="poster-standings-v2-brand-row">
            <div className="poster-standings-v2-brand-mark">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#f2efe6"/>
                <path d="M2 17L12 22L22 17" stroke="#f2efe6" strokeWidth="2"/>
                <path d="M2 12L12 17L22 12" stroke="#f2efe6" strokeWidth="2"/>
              </svg>
            </div>
            <span className="poster-standings-v2-brand-name">CORE ESPORTS</span>
            <span className="poster-standings-v2-brand-divider" />
            <span className="poster-standings-v2-brand-secondary">
              {isBgms ? "Nodwin Gaming" : "BGMI Esports"}
            </span>
          </div>

          {/* Title */}
          <div className="poster-standings-v2-title">{activeOption?.stage || "STANDINGS"}</div>

          {/* Event line */}
          <div className="poster-standings-v2-event-line">
            <span className="poster-standings-v2-event-pill">{eventPill}</span>
            <span className="poster-standings-v2-event-date">{eventDate}</span>
          </div>

          {/* Table */}
          <div className="poster-standings-v2-table">
            <div className="poster-standings-v2-col-head">
              <span>#</span>
              <span>TEAM</span>
              <span>M</span>
              <span>WWCD</span>
              <span>PLACE</span>
              <span>PTS</span>
            </div>

            {standingsRows.map((row, index) => (
              <TeamRow
                key={row.teamId || row.teamName}
                row={row}
                index={index}
                isIg={false}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
