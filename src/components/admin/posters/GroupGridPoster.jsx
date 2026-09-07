import React from "react";
import { getTeamLogoByName } from "@/lib/teamLogos";
import { getCellClass } from "./posterStageUtils";
import PosterLogo from "./PosterLogo";

export default function GroupGridPoster({ activeOption, posterTeams, tournament, tournamentLogo }) {
  return (
    <div className="poster-root">
      <div className="poster-grid">
        <div className="poster-grid-inner">
          <div className="poster-grid-header">
            <div className="poster-grid-brand">
              <img src="/images/core-logo.svg" alt="Core" />
              <span className="poster-grid-brand-text">Core Esports</span>
            </div>
            <div className="poster-grid-tournament">
              <div className="poster-grid-tournament-name">
                {tournament?.name || "Tournament"}
              </div>
              {tournamentLogo && <img src={tournamentLogo} alt={tournament?.name} />}
            </div>
          </div>

          <div className="poster-grid-title">
            <div className="poster-grid-title-stage">{activeOption?.stage || "Round"}</div>
            {activeOption?.group !== "ALL" && (
              <div className="poster-grid-title-group">Group {activeOption?.group || "-"}</div>
            )}
            <div className="poster-grid-title-sub">Team Draw</div>
          </div>

          <div className="poster-grid-teams">
            {posterTeams.map((entry, index) => {
              const logo = getTeamLogoByName(entry.team);
              const cellClass = getCellClass(activeOption, index);
              return (
                <div key={`${entry.phase}-${entry.team}`} className={`poster-grid-cell ${cellClass}`}>
                  <span className="poster-grid-cell-rank">{index + 1}</span>
                  <PosterLogo src={logo} alt={entry.team} size={44} />
                  <span className="poster-grid-cell-name">{entry.team}</span>
                </div>
              );
            })}
          </div>

          <div className="poster-grid-footer">
            <div className="poster-grid-footer-line" />
            <span className="poster-grid-footer-text">Core Esports</span>
            <div className="poster-grid-footer-line" />
          </div>
        </div>
      </div>
    </div>
  );
}
