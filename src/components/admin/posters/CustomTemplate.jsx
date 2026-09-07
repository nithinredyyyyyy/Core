import React, { useMemo } from "react";
import { getTeamLogoByName } from "@/lib/teamLogos";
import { getPlayerPhotoByIgn } from "@/lib/playerPhotos";
import { getTournamentMvpData } from "./posterMvpHelpers";

export default function CustomTemplate({ tournament, tournamentLogo, playerTeamMap = {}, config, standingsRows = [] }) {
  const c = {
    title: "Match Results", tag: "LIVE", subtitle: "Grand Finals",
    playerName: "", teamName: "", bodyText: "",
    stats: [], standingsRows: [],
    accent: "#f97316", bgColor: "#ffffff", cardBg: "#f8fafc", cardBorder: "#e2e8f0",
    titleColor: "#0f172a", titleSize: "38px", titleWeight: "900", muted: "#94a3b8",
    bodyColor: "#334155", bodySize: "13px", bodyWeight: "600",
    statsCols: 4, colHeaders: "Matches,Placements,Finishes,Total",
    colFields: "matches,placement,finishes,points",
    topN: 0,
    leftLabel: "", leftBg: "#16a34a", leftColor: "#ffffff",
    rightLabel: "", rightBg: "#7c3aed", rightColor: "#ffffff",
    socialLinks: [],
    showHeader: true, showTag: true, showTitle: true, showPlayer: true,
    showStats: true, showTable: true, showBody: true, showFooter: true,
    showSocial: true, showBgArt: false, bgArtText: "",
    padding: "28px", accentBarHeight: "4px",
    ...config,
  };

  const photo = c.playerPhoto || getPlayerPhotoByIgn(c.playerName);
  const teamLogoSrc = c.teamLogo || getTeamLogoByName(c.teamName);

  const displayStats = useMemo(() => {
    if (c.stats.length > 0) return c.stats;
    const mvpData = getTournamentMvpData(tournament, playerTeamMap);
    if (mvpData?.length > 0) {
      const p = mvpData[0];
      return [
        { label: "Finishes", value: p.finishes ?? "—" },
        { label: "Damage", value: (p.damage ?? 0).toLocaleString() },
        { label: "Rating", value: p.mvpRating ?? "—" },
        { label: "F/M", value: p.fpm ?? "—" },
      ];
    }
    return [];
  }, [c.stats, tournament, playerTeamMap]);

  const tableRows = useMemo(() => {
    const raw = c.standingsRows.length > 0 ? c.standingsRows : standingsRows;
    if (!raw || raw.length === 0) return [];
    const fields = c.colFields.split(",").map((f) => f.trim());
    return raw.map((row, i) => ({
      rank: row.rank ?? i + 1,
      team: row.team || row.teamName || "",
      teamLogo: getTeamLogoByName(row.team || row.teamName || ""),
      cols: fields.map((f) => {
        const v = row[f];
        if (v === undefined || v === null) return "—";
        return typeof v === "number" ? v.toLocaleString() : v;
      }),
      isTop: c.topN > 0 && (i + 1) <= c.topN,
    }));
  }, [c.standingsRows, standingsRows, c.colFields, c.topN]);

  const colHeaders = c.colHeaders.split(",").map((h) => h.trim());
  const colCount = colHeaders.length;
  const socials = c.socialLinks.length > 0 ? c.socialLinks : [];

  const vars = {
    "--c-bg": c.bgColor, "--c-accent": c.accent, "--c-accent-h": c.accentBarHeight,
    "--c-card": c.cardBg, "--c-border": c.cardBorder,
    "--c-title-color": c.titleColor, "--c-title-size": c.titleSize,
    "--c-title-weight": c.titleWeight, "--c-muted": c.muted,
    "--c-body-color": c.bodyColor, "--c-body-size": c.bodySize,
    "--c-body-weight": c.bodyWeight, "--c-stats-cols": c.statsCols,
    "--c-pad": c.padding, "--c-tag-bg": `${c.accent}14`, "--c-tag-border": `${c.accent}30`,
    "--c-col-count": colCount,
    "--c-left-bg": c.leftBg, "--c-left-color": c.leftColor,
    "--c-right-bg": c.rightBg, "--c-right-color": c.rightColor,
  };

  return (
    <div className="poster-root">
      <div className="poster-custom" style={vars}>
        {c.showBgArt && (
          <div className="poster-custom-bg-art">
            <div className="poster-custom-bg-art-text">
              {Array.from({ length: 40 }).map((_, i) => (
                <span key={i}>{Array.from({ length: 8 }).map(() => c.bgArtText || c.title?.toUpperCase() || "POSTER").join(" ★ ")}</span>
              ))}
            </div>
            <div className="poster-custom-bg-glow" style={{ top: "-100px", left: "-100px", width: "350px", height: "350px" }} />
            <div className="poster-custom-bg-glow" style={{ bottom: "-80px", right: "-80px", width: "300px", height: "300px" }} />
            <div className="poster-custom-bg-dots" />
          </div>
        )}
        <div className="poster-custom-accent" />
        {c.leftLabel && <div className="poster-custom-left-label">{c.leftLabel}</div>}
        {c.rightLabel && <div className="poster-custom-right-label">{c.rightLabel}</div>}
        <div className="poster-custom-inner">

          {c.showHeader && (
            <div className="poster-custom-header">
              <div className="poster-custom-brand">
                {c.brandLogo ? (
                  <img src={c.brandLogo} alt="Brand" />
                ) : (
                  <img src="/images/core-logo.svg" alt="Core" />
                )}
                <span className="poster-custom-brand-text">{c.brandText || (c.brandLogo ? "" : "Core Esports")}</span>
              </div>
              {(c.tournamentLogoUrl || tournamentLogo) && (
                <div className="poster-custom-tournament">
                  {c.tournamentName && <div className="poster-custom-tournament-name">{c.tournamentName}</div>}
                  <img src={c.tournamentLogoUrl || tournamentLogo} alt={c.tournamentName || tournament?.name} />
                </div>
              )}
            </div>
          )}

          <div className="poster-custom-title-zone">
            {c.showTag && c.tag && (
              <div className="poster-custom-tag">
                <div className="poster-custom-tag-dot" />
                <span className="poster-custom-tag-text">{c.tag}</span>
              </div>
            )}
            {c.showTitle && (
              <>
                <div className="poster-custom-headline">{c.title}</div>
                {c.subtitle && <div className="poster-custom-subline">{c.subtitle}</div>}
              </>
            )}
          </div>

          {c.showPlayer && (c.playerName || c.teamName) && (
            <>
              <div className="poster-custom-divider" />
              <div className="poster-custom-player">
                <div className="poster-custom-avatar">
                  {photo ? <img src={photo} alt={c.playerName} /> : <span className="poster-custom-avatar-fb">{c.playerName?.slice(0, 2)?.toUpperCase() || "?"}</span>}
                </div>
                <div className="poster-custom-player-info">
                  <div className="poster-custom-player-team">
                    {teamLogoSrc && <img src={teamLogoSrc} alt={c.teamName} />}
                    {c.teamName}
                  </div>
                  <div className="poster-custom-player-name">{c.playerName || "Player"}</div>
                </div>
              </div>
            </>
          )}

          {c.showStats && displayStats.length > 0 && !c.showTable && (
            <div className="poster-custom-stats" style={{ "--c-stats-cols": c.statsCols }}>
              {displayStats.map((s, i) => (
                <div key={i} className="poster-custom-stat-card">
                  <div className="poster-custom-stat-val">{s.value}</div>
                  <div className="poster-custom-stat-lbl">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {c.showTable && tableRows.length > 0 && (
            <>
              <div className="poster-custom-divider" />
              <div className="poster-custom-standings">
                <div className="poster-custom-table-header">
                  <span className="poster-custom-th">#</span>
                  <span className="poster-custom-th">Team</span>
                  {colHeaders.map((h, i) => <span key={i} className="poster-custom-th">{h}</span>)}
                </div>
                <div className="poster-custom-rows">
                  {tableRows.map((row, i) => (
                    <div key={i} className={`poster-custom-row ${row.isTop ? "top6" : ""}`}>
                      <span className="poster-custom-rank">{row.rank}.</span>
                      <div className="poster-custom-team-cell">
                        <div className="poster-custom-team-logo">
                          {row.teamLogo ? <img src={row.teamLogo} alt={row.team} /> : <span className="poster-custom-team-logo-fb">{row.team?.slice(0, 2)?.toUpperCase()}</span>}
                        </div>
                        <span className="poster-custom-team-name">{row.team}</span>
                      </div>
                      {row.cols.map((val, j) => (
                        <span key={j} className={`poster-custom-td ${j === row.cols.length - 1 ? "total" : ""}`}>{val}</span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {c.showStats && displayStats.length > 0 && c.showTable && (
            <div className="poster-custom-stats" style={{ "--c-stats-cols": c.statsCols }}>
              {displayStats.map((s, i) => (
                <div key={i} className="poster-custom-stat-card">
                  <div className="poster-custom-stat-val">{s.value}</div>
                  <div className="poster-custom-stat-lbl">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {c.showBody && c.bodyText && (
            <div className="poster-custom-textblock">
              <div className="poster-custom-textblock-content">{c.bodyText}</div>
            </div>
          )}

          {c.showFooter && (
            <>
              {c.showSocial && socials.length > 0 && (
                <div className="poster-custom-social">
                  {socials.map((s, i) => (
                    <div key={i} className="poster-custom-social-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>
                      {s}
                    </div>
                  ))}
                </div>
              )}
              <div className="poster-custom-footer">
                <div className="poster-custom-footer-line" />
                <span className="poster-custom-footer-text">{c.brandText || "Core Esports"}</span>
                <div className="poster-custom-footer-line" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
