import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clipboard, Image as ImageIcon, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getTeamLogoByName } from "@/lib/teamLogos";
import { getTournamentLogo } from "@/lib/tournamentBranding";
import {
  buildParticipantEntries,
  resolveTournamentParticipantState,
} from "@/lib/bmps2026Progression";
import { decorateMatchesWithLiveStatus } from "@/lib/liveCalendar";
import { filterPublishedMatchResults } from "@/lib/matchResultPublication";

const BMPS_2026_NAME = "Battlegrounds Mobile India Pro Series 2026";
const POSTER_BACKGROUND = "/images/bmps-poster-story.png";
const POSTER_CSS = `
.bmps-admin-poster-stage {
  width: min(92vw, calc(88vh * 4 / 5));
  max-width: 760px;
  aspect-ratio: 4 / 5;
  padding: 6px;
  background: rgba(255, 255, 255, 0.18);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.36);
}
.bmps-admin-poster-stage.standings {
  width: min(92vw, calc(86vh * 9 / 16));
  max-width: 540px;
  aspect-ratio: 9 / 16;
  border-radius: 54px;
}
.bmps-admin-poster {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 146, 54, 0.2), rgba(34, 10, 2, 0.42)),
    var(--bmps-poster-bg) center center / cover no-repeat;
  padding: 18px;
}
.bmps-admin-poster.standings {
  border-radius: 48px;
  padding: 16px;
}
.bmps-admin-poster::before,
.bmps-admin-poster::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.bmps-admin-poster::before {
  border: 4px solid rgba(170, 34, 4, 0.48);
}
.bmps-admin-poster.standings::before {
  border-radius: 48px;
}
.bmps-admin-poster::after {
  background:
    radial-gradient(circle at 28% 18%, rgba(255, 227, 183, 0.38), transparent 18%),
    radial-gradient(circle at 74% 14%, rgba(255, 244, 230, 0.08), transparent 12%);
}
.bmps-admin-poster-inner {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.bmps-admin-brand-row {
  min-height: 42px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.bmps-admin-core-mark {
  width: 44px;
  height: 44px;
  object-fit: contain;
}
.bmps-admin-hero {
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  margin-top: -8px;
}
.bmps-admin-hero-logo {
  width: 74px;
  height: auto;
  object-fit: contain;
}
.bmps-admin-hero-kicker {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(70, 35, 16, 0.72);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.46em;
  text-transform: uppercase;
}
.bmps-admin-hero-kicker::before {
  content: "";
  width: 34px;
  height: 3px;
  border-radius: 999px;
  background: rgba(187, 68, 18, 0.75);
}
.bmps-admin-hero-main {
  display: flex;
  align-items: center;
  gap: 12px;
}
.bmps-admin-hero-title {
  color: #050505;
  font-size: 72px;
  line-height: 0.88;
  font-weight: 900;
  letter-spacing: -0.07em;
}
.bmps-admin-hero-subtitle {
  color: rgba(255, 245, 236, 0.96);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.42em;
  text-transform: uppercase;
}
.bmps-admin-team-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin-top: 28px;
}
.bmps-admin-team-card {
  aspect-ratio: 1 / 1;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(245, 235, 229, 0.96);
  box-shadow: 0 18px 40px rgba(28, 16, 11, 0.12);
  display: grid;
  place-items: center;
  padding: 22px;
}
.bmps-admin-team-card.promotion {
  background: linear-gradient(180deg, rgba(234, 255, 241, 0.98), rgba(197, 245, 213, 0.95));
  border-color: rgba(72, 169, 102, 0.38);
  box-shadow: 0 18px 40px rgba(51, 140, 82, 0.18);
}
.bmps-admin-team-card.relegation {
  background: linear-gradient(180deg, rgba(255, 239, 239, 0.98), rgba(255, 206, 206, 0.95));
  border-color: rgba(211, 88, 88, 0.34);
  box-shadow: 0 18px 40px rgba(186, 68, 68, 0.18);
}
.bmps-admin-team-card img {
  max-width: 86%;
  max-height: 86%;
  width: auto;
  height: auto;
  object-fit: contain;
}
.bmps-admin-poster-foot {
  margin-top: auto;
  padding-bottom: 0;
  text-align: center;
  color: #ffffff;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.58em;
}
.bmps-admin-krafton {
  color: #050505;
  font-weight: 900;
  line-height: 1;
  text-transform: uppercase;
}
.bmps-admin-krafton .big {
  display: block;
  font-size: 26px;
}
.bmps-admin-krafton .small {
  display: inline-block;
  margin-top: 5px;
  background: #050505;
  color: #ffffff;
  padding: 5px 9px;
  font-size: 12px;
  letter-spacing: 0.12em;
}
.bmps-admin-standings-hero {
  display: grid;
  grid-template-columns: 62px minmax(0, 1fr);
  align-items: center;
  gap: 9px;
  min-height: 70px;
}
.bmps-admin-standings-hero .bmps-admin-hero-logo {
  width: 54px;
}
.bmps-admin-standings-hero .bmps-admin-hero-kicker {
  margin-bottom: 3px;
  font-size: 5px;
  letter-spacing: 0.42em;
}
.bmps-admin-standings-hero .bmps-admin-hero-kicker::before {
  width: 16px;
  height: 2px;
}
.bmps-admin-standings-hero .bmps-admin-hero-title {
  font-size: 42px;
}
.bmps-admin-standing-group-pill {
  border-radius: 999px;
  background: rgba(98, 38, 10, 0.28);
  padding: 6px 30px;
  color: #ffffff;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 0.44em;
  text-transform: uppercase;
}
.bmps-admin-movement-legend {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 5px;
  color: #ffffff;
  font-size: 7px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.bmps-admin-table-card {
  margin-top: 18px;
  padding: 10px 14px 8px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.97);
  border: 1px solid rgba(255, 255, 255, 0.68);
  box-shadow: 0 20px 44px rgba(28, 16, 11, 0.16);
}
.bmps-admin-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  color: #2f3541;
  font-size: 8.8px;
  font-weight: 800;
}
.bmps-admin-table thead th {
  padding: 7px 5px 8px;
  border-bottom: 6px solid #d8e0eb;
  text-align: left;
  font-weight: 900;
}
.bmps-admin-table thead th.center,
.bmps-admin-table tbody td.num {
  text-align: center;
}
.bmps-admin-table tbody td {
  padding: 6.3px 5px;
  border-bottom: 3px solid #d8e0eb;
}
.bmps-admin-table tbody tr:last-child td {
  border-bottom: 0;
}
.bmps-admin-table-team {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 4px;
}
.bmps-admin-table-logo {
  width: 12px;
  height: 12px;
  flex: 0 0 auto;
  object-fit: contain;
}
.bmps-admin-table-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 900;
}
.bmps-admin-move {
  font-size: 10px;
  font-weight: 900;
}
.bmps-admin-move.up { color: #10b981; }
.bmps-admin-move.down { color: #fb7185; }
.bmps-admin-move.stay { color: #facc15; }
.bmps-admin-poster.standings .bmps-admin-poster-foot {
  padding-bottom: 0;
  font-size: 8px;
  letter-spacing: 0.62em;
}
`;

function getPhaseParts(phase) {
  const match = String(phase || "").match(/^(.+?)\s*-\s*Group\s+([A-Z0-9]+)$/i);
  if (!match) return null;
  return {
    stage: match[1].trim(),
    group: match[2].trim().toUpperCase(),
  };
}

function buildPosterOptions(participantEntries) {
  const map = new Map();
  for (const entry of participantEntries || []) {
    const parts = getPhaseParts(entry.phase);
    if (!parts) continue;
    const key = `${parts.stage}::${parts.group}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        stage: parts.stage,
        group: parts.group,
        label: `${parts.stage} - Group ${parts.group}`,
      });
    }
  }
  return [...map.values()].toSorted((left, right) => {
    const stageDelta = left.stage.localeCompare(right.stage, undefined, {
      numeric: true,
    });
    if (stageDelta !== 0) return stageDelta;
    return left.group.localeCompare(right.group, undefined, { numeric: true });
  });
}

function getEntrySortValue(entry) {
  const value = Number(entry?.placement ?? entry?.seed ?? 9999);
  return Number.isFinite(value) ? value : 9999;
}

function getLogoTone(option, index) {
  if (String(option?.stage || "").toLowerCase() !== "round 4") return "normal";
  if (option.group === "A") return index >= 12 ? "promotion" : "normal";
  if (option.group === "D") return index < 4 ? "relegation" : "normal";
  if (index < 4) return "relegation";
  if (index >= 12) return "promotion";
  return "normal";
}

function getMoveSymbol(option, rank, total) {
  if (String(option?.stage || "").toLowerCase() !== "round 4") return "•";
  if (option.group === "A") return rank <= 8 ? "▲" : "•";
  if (option.group === "B") return rank <= 8 ? "▲" : "▼";
  if (option.group === "C") return "▼";
  if (option.group === "D") return rank <= Math.max(total - 8, 8) ? "▲" : "▼";
  return "•";
}

function getMoveClass(symbol) {
  if (symbol === "▲") return "text-emerald-500";
  if (symbol === "▼") return "text-red-400";
  return "text-yellow-400";
}

function PosterLogo({ src, alt, className = "" }) {
  return src ? (
    <img src={src} alt={alt} className={`object-contain ${className}`} />
  ) : (
    <span className="text-xl font-black text-slate-400">{alt?.slice(0, 2)}</span>
  );
}

function getMoveSymbolClean(option, rank, total) {
  if (String(option?.stage || "").toLowerCase() !== "round 4") return "\u2022";
  if (option.group === "A") return rank <= 8 ? "\u25B2" : "\u2022";
  if (option.group === "B") return rank <= 8 ? "\u25B2" : "\u25BC";
  if (option.group === "C") return "\u25BC";
  if (option.group === "D") return rank <= Math.max(total - 8, 8) ? "\u25B2" : "\u25BC";
  return "\u2022";
}

function getMoveClassClean(symbol) {
  if (symbol === "\u25B2") return "up";
  if (symbol === "\u25BC") return "down";
  return "stay";
}

function PosterShell({ ratio, children }) {
  return (
    <div className={`bmps-admin-poster-stage mx-auto ${ratio === "9x16" ? "standings" : ""}`}>
      <section
        className={`bmps-admin-poster ${ratio === "9x16" ? "standings" : ""}`}
        style={{ "--bmps-poster-bg": `url(${POSTER_BACKGROUND})` }}
      >
        <div className="bmps-admin-poster-inner">{children}</div>
      </section>
    </div>
  );
}

function PosterHeader({ activeOption, tournamentLogo, ratio, standings = false }) {
  if (standings) {
    return (
      <header>
        <div className="bmps-admin-brand-row">
          <div className="bmps-admin-krafton">
            <span className="big">KRAFTON</span>
            <span className="small">INDIA ESPORTS</span>
          </div>
          <img className="bmps-admin-core-mark" src="/images/core-logo.png" alt="Core Esports" />
        </div>
        <div className="bmps-admin-standings-hero">
          <img className="bmps-admin-hero-logo" src={tournamentLogo} alt="BMPS 2026" />
          <div>
            <div className="bmps-admin-hero-kicker">Overall Standings</div>
            <div className="bmps-admin-hero-main">
              <h3 className="bmps-admin-hero-title">BMPS</h3>
              <div className="bmps-admin-standing-group-pill">Group {activeOption?.group || "-"}</div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header>
      <div className="bmps-admin-brand-row">
        <div />
        <img className="bmps-admin-core-mark" src="/images/core-logo.png" alt="Core Esports" />
      </div>
      <div className="bmps-admin-hero">
        <img className="bmps-admin-hero-logo" src={tournamentLogo} alt="BMPS 2026" />
        <div>
          <div className="bmps-admin-hero-kicker">{activeOption?.stage || "Round"} Groups</div>
          <div className="bmps-admin-hero-main">
            <h3 className="bmps-admin-hero-title">BMPS</h3>
            <div className="bmps-admin-hero-subtitle">Group {activeOption?.group || "-"}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function GroupGridPoster({ activeOption, posterTeams, tournamentLogo }) {
  return (
    <PosterShell ratio="4x5">
      <PosterHeader activeOption={activeOption} tournamentLogo={tournamentLogo} ratio="4x5" />
      <div className="bmps-admin-team-grid">
        {posterTeams.map((entry, index) => {
          const logo = getTeamLogoByName(entry.team);
          const tone = getLogoTone(activeOption, index);
          return (
            <div
              key={`${entry.phase}-${entry.team}`}
              className={`bmps-admin-team-card ${tone === "normal" ? "" : tone}`}
              title={entry.team}
            >
              <PosterLogo src={logo} alt={entry.team} />
            </div>
          );
        })}
      </div>
      <footer className="bmps-admin-poster-foot">CORE ESPORTS</footer>
    </PosterShell>
  );
}

function StandingsPoster({ activeOption, standingsRows, tournamentLogo }) {
  return (
    <PosterShell ratio="9x16">
      <PosterHeader
        activeOption={activeOption}
        tournamentLogo={tournamentLogo}
        ratio="9x16"
        standings
      />
      <div className="mt-3 flex items-center justify-center gap-4 text-[7px] font-black uppercase tracking-[0.14em]">
        <span className="inline-flex items-center gap-1"><span className="text-emerald-500">▲</span> Promotion</span>
        <span className="text-white">•</span>
        <span>Stay</span>
        <span className="inline-flex items-center gap-1"><span className="text-red-400">▼</span> Relegation</span>
      </div>
      <div className="mt-4 rounded-[28px] border border-white/70 bg-white/95 px-5 py-4 text-slate-700 shadow-[0_16px_38px_rgba(28,16,11,0.18)]">
        <table className="w-full table-fixed text-[8.8px] font-bold">
          <colgroup>
            <col className="w-[9%]" />
            <col className="w-[36%]" />
            <col className="w-[10%]" />
            <col className="w-[13%]" />
            <col className="w-[13%]" />
            <col className="w-[13%]" />
            <col className="w-[10%]" />
            <col className="w-[6%]" />
          </colgroup>
          <thead>
            <tr className="border-b-[6px] border-slate-200 text-left text-slate-700">
              <th className="pb-2">#</th>
              <th className="pb-2">Team</th>
              <th className="pb-2 text-center">M</th>
              <th className="pb-2 text-center">WWCD</th>
              <th className="pb-2 text-center">Place</th>
              <th className="pb-2 text-center">Elims</th>
              <th className="pb-2 text-center">Pts</th>
              <th className="pb-2 text-center">M</th>
            </tr>
          </thead>
          <tbody>
            {standingsRows.map((row, index) => {
              const symbol = getMoveSymbol(activeOption, index + 1, standingsRows.length);
              return (
                <tr key={row.teamId || row.teamName} className="border-b-[3px] border-slate-200 last:border-b-0">
                  <td className="py-[7px]">{index + 1}.</td>
                  <td className="py-[7px]">
                    <div className="flex min-w-0 items-center gap-2">
                      <PosterLogo
                        src={getTeamLogoByName(row.logoName || row.teamName)}
                        alt={row.teamName}
                        className="size-3.5 shrink-0"
                      />
                      <span className="truncate text-[8.8px] font-black">{row.teamName}</span>
                    </div>
                  </td>
                  <td className="py-[7px] text-center">{row.matches || 0}</td>
                  <td className="py-[7px] text-center">{row.wwcd || 0}</td>
                  <td className="py-[7px] text-center">{row.placementPoints || 0}</td>
                  <td className="py-[7px] text-center">{row.elims || 0}</td>
                  <td className="py-[7px] text-center font-black">{row.points || 0}</td>
                  <td className={`py-[7px] text-center text-[10px] ${getMoveClass(symbol)}`}>{symbol}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <footer className="mt-auto pb-1 text-center text-[9px] font-black uppercase tracking-[0.62em] text-white">
        CORE ESPORTS
      </footer>
    </PosterShell>
  );
}

function StandingsPosterExact({ activeOption, standingsRows, tournamentLogo }) {
  return (
    <PosterShell ratio="9x16">
      <PosterHeader
        activeOption={activeOption}
        tournamentLogo={tournamentLogo}
        ratio="9x16"
        standings
      />
      <div className="bmps-admin-movement-legend">
        <span className="inline-flex items-center gap-1"><span className="text-emerald-500">{"\u25B2"}</span> Promotion</span>
        <span className="text-white">{"\u2022"}</span>
        <span>Stay</span>
        <span className="inline-flex items-center gap-1"><span className="text-red-400">{"\u25BC"}</span> Relegation</span>
      </div>
      <div className="bmps-admin-table-card">
        <table className="bmps-admin-table">
          <colgroup>
            <col className="w-[9%]" />
            <col className="w-[36%]" />
            <col className="w-[10%]" />
            <col className="w-[13%]" />
            <col className="w-[13%]" />
            <col className="w-[13%]" />
            <col className="w-[10%]" />
            <col className="w-[6%]" />
          </colgroup>
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th className="center">M</th>
              <th className="center">WWCD</th>
              <th className="center">Place</th>
              <th className="center">Elims</th>
              <th className="center">Pts</th>
              <th className="center">M</th>
            </tr>
          </thead>
          <tbody>
            {standingsRows.map((row, index) => {
              const symbol = getMoveSymbolClean(activeOption, index + 1, standingsRows.length);
              return (
                <tr key={row.teamId || row.teamName}>
                  <td>{index + 1}.</td>
                  <td>
                    <div className="bmps-admin-table-team">
                      <PosterLogo
                        src={getTeamLogoByName(row.logoName || row.teamName)}
                        alt={row.teamName}
                        className="bmps-admin-table-logo"
                      />
                      <span className="bmps-admin-table-name">{row.teamName}</span>
                    </div>
                  </td>
                  <td className="num">{row.matches || 0}</td>
                  <td className="num">{row.wwcd || 0}</td>
                  <td className="num">{row.placementPoints || 0}</td>
                  <td className="num">{row.elims || 0}</td>
                  <td className="num">{row.points || 0}</td>
                  <td className={`num bmps-admin-move ${getMoveClassClean(symbol)}`}>{symbol}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <footer className="bmps-admin-poster-foot">CORE ESPORTS</footer>
    </PosterShell>
  );
}

export default function AdminStagePosters() {
  const [selectedOptionKey, setSelectedOptionKey] = useState("");
  const [posterMode, setPosterMode] = useState("grid");

  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery({
    queryKey: ["admin-stage-posters-tournaments"],
    queryFn: () => base44.entities.Tournament.list("-created_date", 100),
  });

  const bmpsTournament = useMemo(
    () => tournaments.find((tournament) => tournament.name === BMPS_2026_NAME) || null,
    [tournaments],
  );

  const { data: teams = [] } = useQuery({
    queryKey: ["admin-stage-posters-teams"],
    queryFn: () => base44.entities.Team.list("-total_points", 500),
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["admin-stage-posters-matches", bmpsTournament?.id],
    queryFn: () =>
      base44.entities.Match.filter(
        { tournament_id: bmpsTournament.id },
        "-scheduled_time",
        500,
      ),
    enabled: Boolean(bmpsTournament?.id),
  });

  const { data: rawMatchResults = [] } = useQuery({
    queryKey: ["admin-stage-posters-results", bmpsTournament?.id],
    queryFn: () =>
      base44.entities.MatchResult.filter(
        { tournament_id: bmpsTournament.id },
        "-created_date",
        5000,
      ),
    enabled: Boolean(bmpsTournament?.id),
  });

  const matchResults = useMemo(
    () => filterPublishedMatchResults(rawMatchResults),
    [rawMatchResults],
  );

  const participantState = useMemo(() => {
    if (!bmpsTournament) return { participantEntries: [], stageBoards: [] };
    const calendarMatches = decorateMatchesWithLiveStatus(matches, matchResults);
    return resolveTournamentParticipantState({
      tournament: bmpsTournament,
      teams,
      matches: calendarMatches,
      matchResults,
      participantEntries: buildParticipantEntries(bmpsTournament),
      stageNames: (bmpsTournament.stages || []).flatMap((stage) =>
        stage?.name ? [stage.name] : [],
      ),
    });
  }, [bmpsTournament, matchResults, matches, teams]);

  const posterOptions = useMemo(
    () => buildPosterOptions(participantState.participantEntries),
    [participantState.participantEntries],
  );

  const activeOption = useMemo(() => {
    if (selectedOptionKey) {
      const selected = posterOptions.find((option) => option.key === selectedOptionKey);
      if (selected) return selected;
    }
    if (posterMode === "standings") {
      const optionsWithRows = posterOptions.filter((option) => {
        const board = participantState.stageBoards.find(
          (stageBoard) => stageBoard.name === option.stage,
        );
        return (board?.standings || []).some(
          (row) => String(row.group || "").toUpperCase() === option.group,
        );
      });
      if (optionsWithRows.length > 0) {
        return optionsWithRows[optionsWithRows.length - 1];
      }
    }
    return (
      posterOptions.find((option) => option.stage === "Round 4" && option.group === "A") ||
      posterOptions[0] ||
      null
    );
  }, [participantState.stageBoards, posterMode, posterOptions, selectedOptionKey]);

  const posterTeams = useMemo(() => {
    if (!activeOption) return [];
    return participantState.participantEntries
      .filter((entry) => {
        const parts = getPhaseParts(entry.phase);
        return parts?.stage === activeOption.stage && parts?.group === activeOption.group;
      })
      .toSorted((left, right) => getEntrySortValue(left) - getEntrySortValue(right));
  }, [activeOption, participantState.participantEntries]);

  const standingsRows = useMemo(() => {
    if (!activeOption) return [];
    const board = participantState.stageBoards.find(
      (stageBoard) => stageBoard.name === activeOption.stage,
    );
    return (board?.standings || [])
      .filter((row) => String(row.group || "").toUpperCase() === activeOption.group)
      .toSorted((left, right) => (left.rank || 999) - (right.rank || 999));
  }, [activeOption, participantState.stageBoards]);

  const tournamentLogo = getTournamentLogo(bmpsTournament) || "/images/bmps-2026.png";

  const handleCopyTeams = async () => {
    if (!navigator.clipboard || posterTeams.length === 0) return;
    await navigator.clipboard.writeText(
      posterTeams.map((entry, index) => `${index + 1}. ${entry.team}`).join("\n"),
    );
  };

  if (tournamentsLoading) {
    return (
      <div className="rounded-[24px] border border-border bg-card p-6 text-sm text-muted-foreground">
        Loading poster data from tournament stages.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <style>{POSTER_CSS}</style>
      <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              Poster source
            </p>
            <h2 className="mt-2 text-2xl font-semibold uppercase tracking-[-0.04em] text-foreground">
              BMPS 2026 poster generator
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Uses live BMPS 2026 Stages & Results data. The group-grid poster
              follows your 4x5 output, and the standings poster follows your
              portrait table output.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopyTeams}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary/30 hover:text-primary"
            >
              <Clipboard className="size-3.5" />
              Copy teams
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground"
            >
              <ImageIcon className="size-3.5" />
              Print
            </button>
          </div>
        </div>

        {!bmpsTournament ? (
          <div className="mt-5 rounded-[20px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            BMPS 2026 tournament was not found in the backend.
          </div>
        ) : (
          <div className="mt-5 grid gap-5 xl:grid-cols-[18rem_1fr]">
            <div className="space-y-4">
              <div className="rounded-[20px] border border-border bg-secondary/35 p-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                  Stage group
                </label>
                <select
                  value={activeOption?.key || ""}
                  onChange={(event) => setSelectedOptionKey(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/40"
                >
                  {posterOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-[20px] border border-border bg-secondary/35 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                  Output
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    ["grid", "4x5 Grid"],
                    ["standings", "Standings"],
                  ].map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPosterMode(mode)}
                      className={`rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] ${
                        posterMode === mode
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-background text-muted-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[20px] border border-border bg-secondary/35 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Teams</p>
                  <p className="mt-2 text-2xl font-black text-foreground">{posterTeams.length}</p>
                </div>
                <div className="rounded-[20px] border border-border bg-secondary/35 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Rows</p>
                  <p className="mt-2 text-2xl font-black text-foreground">{standingsRows.length}</p>
                </div>
              </div>

              <div className="rounded-[20px] border border-border bg-background p-4 text-xs leading-6 text-muted-foreground">
                <div className="mb-2 flex items-center gap-2 font-bold uppercase tracking-[0.14em] text-foreground">
                  <RefreshCw className="size-3.5 text-primary" />
                  Live source
                </div>
                Group teams and table rows are derived from the live stage board,
                not from the old static default-project HTML.
              </div>
            </div>

            <div className="overflow-x-auto rounded-[28px] border border-[#eadfce] bg-[#f7efe6] p-5">
              {posterMode === "standings" ? (
                <StandingsPosterExact
                  activeOption={activeOption}
                  standingsRows={standingsRows}
                  tournamentLogo={tournamentLogo}
                />
              ) : (
                <GroupGridPoster
                  activeOption={activeOption}
                  posterTeams={posterTeams}
                  tournamentLogo={tournamentLogo}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
