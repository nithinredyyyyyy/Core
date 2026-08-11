import { useMemo, useState } from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  LeaderboardTeamLink,
  MapAverageCell,
  RankBadge,
  SortableOverallHeader,
} from "@/features/leaderboard/components/leaderboardBits";
import { compareOverallValues } from "@/features/leaderboard/utils/leaderboardHelpers";

export default function OverallStatsSection({ featuredTournament, teamMapStats, calendarMatches }) {
  const [sortConfig, setSortConfig] = useState({ field: "rank", direction: "asc" });
  const handleSort = (field) => {
    setSortConfig((current) => ({
      field,
      direction: current.field === field && current.direction === "desc" ? "asc" : "desc",
    }));
  };
  const sortedTeamMapStats = useMemo(() => {
    const getValue = (team, field) => {
      switch (field) {
        case "rank": return team.rank;
        case "team": return team.teamName;
        case "matchesPlayed": return team.matchesPlayed;
        case "avgPlacePoints": return team.avgPlacePoints;
        case "avgElims": return team.avgElims;
        case "avgTotalPoints": return team.avgTotalPoints;
        case "erangel": return team.avgMapStats.erangel ? team.avgMapStats.erangel.elims * 1000 + team.avgMapStats.erangel.placePoints : null;
        case "miramar": return team.avgMapStats.miramar ? team.avgMapStats.miramar.elims * 1000 + team.avgMapStats.miramar.placePoints : null;
        case "rondo": return team.avgMapStats.rondo ? team.avgMapStats.rondo.elims * 1000 + team.avgMapStats.rondo.placePoints : null;
        case "winPercent": return team.winPercent;
        case "secondToFivePercent": return team.secondToFivePercent;
        case "sixToTenPercent": return team.sixToTenPercent;
        case "elevenPlusPercent": return team.elevenPlusPercent;
        case "zero": return team.pointsBuckets.zero;
        case "underFive": return team.pointsBuckets.underFive;
        case "fivePlus": return team.pointsBuckets.fivePlus;
        case "tenPlus": return team.pointsBuckets.tenPlus;
        case "seventeenPlus": return team.pointsBuckets.seventeenPlus;
        case "twentyFourPlus": return team.pointsBuckets.twentyFourPlus;
        default: return "";
      }
    };
    return teamMapStats
      .map((team, index) => ({ team, index }))
      .toSorted((left, right) => {
        const result = compareOverallValues(
          getValue(left.team, sortConfig.field),
          getValue(right.team, sortConfig.field),
          sortConfig.direction,
        );
        return result || left.index - right.index;
      })
      .map(({ team }) => team);
  }, [sortConfig, teamMapStats]);
  if (!featuredTournament || teamMapStats.length === 0) return null;

  return (
    <m.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 }}
      className="overflow-hidden rounded-[32px] border border-border bg-card shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
    >
      <div className="border-b border-border p-4 sm:px-5 sm:py-5 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              Overall statistics
            </p>
            <h3 className="mt-2 text-[1.4rem] font-heading font-semibold uppercase tracking-[-0.04em] text-foreground sm:text-2xl">
              BMPS Overall Statistics: All Maps
            </h3>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Full-tournament participant totals, point averages, placement summary, and points-earned ranges for the teams currently shown in the board.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/20 px-4 py-3 text-sm text-muted-foreground">
            {calendarMatches.filter((match) => match.tournament_id === featuredTournament?.id).length} tournament matches
          </div>
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5 md:mx-0 md:px-6">
        <table className="min-w-[1720px] table-fixed text-sm">
          <colgroup>
            <col style={{ width: "64px" }} />
            <col style={{ width: "264px" }} />
            {Array.from({ length: 17 }).map((_, index) => (
              <col key={`overall-stat-col-${index}`} style={{ width: index < 7 ? "92px" : "88px" }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-secondary/25 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <SortableOverallHeader label="#" field="rank" sortConfig={sortConfig} onSort={handleSort} className="border-r border-border p-3 text-center" />
              <SortableOverallHeader label="Team" field="team" sortConfig={sortConfig} onSort={handleSort} className="border-r border-border px-4 py-3 text-left" />
              <SortableOverallHeader label="M" field="matchesPlayed" sortConfig={sortConfig} onSort={handleSort} className="border-r border-border p-3 text-center" />
              <SortableOverallHeader label="Avg Place Pts" field="avgPlacePoints" sortConfig={sortConfig} onSort={handleSort} className="border-r border-border p-3 text-center" />
              <SortableOverallHeader label="Avg Elims" field="avgElims" sortConfig={sortConfig} onSort={handleSort} className="border-r border-border p-3 text-center" />
              <SortableOverallHeader label="Avg Total" field="avgTotalPoints" sortConfig={sortConfig} onSort={handleSort} className="border-r border-border p-3 text-center" />
              <SortableOverallHeader label="Erangel E/PP" field="erangel" sortConfig={sortConfig} onSort={handleSort} className="border-r border-border p-3 text-center" />
              <SortableOverallHeader label="Miramar E/PP" field="miramar" sortConfig={sortConfig} onSort={handleSort} className="border-r border-border p-3 text-center" />
              <SortableOverallHeader label="Rondo E/PP" field="rondo" sortConfig={sortConfig} onSort={handleSort} className="border-r border-border p-3 text-center" />
              <SortableOverallHeader label="Win %" field="winPercent" sortConfig={sortConfig} onSort={handleSort} className="border-r border-border p-3 text-center" />
              <SortableOverallHeader label="2nd-5th %" field="secondToFivePercent" sortConfig={sortConfig} onSort={handleSort} className="border-r border-border p-3 text-center" />
              <SortableOverallHeader label="6th-10th %" field="sixToTenPercent" sortConfig={sortConfig} onSort={handleSort} className="border-r border-border p-3 text-center" />
              <SortableOverallHeader label="11th-16th+ %" field="elevenPlusPercent" sortConfig={sortConfig} onSort={handleSort} className="border-r border-border p-3 text-center" />
              <SortableOverallHeader label="0 Pts" field="zero" sortConfig={sortConfig} onSort={handleSort} className="border-r border-border p-3 text-center" />
              <SortableOverallHeader label="< 5 Pts" field="underFive" sortConfig={sortConfig} onSort={handleSort} className="border-r border-border p-3 text-center" />
              <SortableOverallHeader label="5+ Pts" field="fivePlus" sortConfig={sortConfig} onSort={handleSort} className="border-r border-border p-3 text-center" />
              <SortableOverallHeader label="10+ Pts" field="tenPlus" sortConfig={sortConfig} onSort={handleSort} className="border-r border-border p-3 text-center" />
              <SortableOverallHeader label="17+ Pts" field="seventeenPlus" sortConfig={sortConfig} onSort={handleSort} className="border-r border-border p-3 text-center" />
              <SortableOverallHeader label="24+ Pts" field="twentyFourPlus" sortConfig={sortConfig} onSort={handleSort} className="bg-secondary/10 p-3 text-center" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedTeamMapStats.map((team, index) => (
              <m.tr
                key={`overall-stats-${team.teamId || team.teamName}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.012 }}
                className="bg-card/90 transition-colors hover:bg-secondary/20"
              >
                <td className="border-r border-border px-3 py-4 text-center align-middle">
                  <RankBadge rank={team.rank} />
                </td>
                <td className="border-r border-border p-4 align-middle">
                  <LeaderboardTeamLink teamName={team.teamName} logoName={team.logoName} />
                </td>
                <td className="border-r border-border px-3 py-4 text-center align-middle text-foreground">{team.matchesPlayed}</td>
                <td className="border-r border-border px-3 py-4 text-center align-middle text-foreground">{Number.isFinite(team.avgPlacePoints) ? team.avgPlacePoints.toFixed(2) : "-"}</td>
                <td className="border-r border-border px-3 py-4 text-center align-middle text-foreground">{Number.isFinite(team.avgElims) ? team.avgElims.toFixed(2) : "-"}</td>
                <td className="border-r border-border px-3 py-4 text-center align-middle text-foreground">{Number.isFinite(team.avgTotalPoints) ? team.avgTotalPoints.toFixed(2) : "-"}</td>
                <td className="border-r border-border px-2 py-4 text-center align-middle font-semibold text-foreground"><MapAverageCell stats={team.avgMapStats.erangel} /></td>
                <td className="border-r border-border px-2 py-4 text-center align-middle font-semibold text-foreground"><MapAverageCell stats={team.avgMapStats.miramar} /></td>
                <td className="border-r border-border px-2 py-4 text-center align-middle font-semibold text-foreground"><MapAverageCell stats={team.avgMapStats.rondo} /></td>
                <td className="border-r border-border px-3 py-4 text-center align-middle text-foreground">{team.winPercent}</td>
                <td className="border-r border-border px-3 py-4 text-center align-middle text-foreground">{team.secondToFivePercent}</td>
                <td className="border-r border-border px-3 py-4 text-center align-middle text-foreground">{team.sixToTenPercent}</td>
                <td className="border-r border-border px-3 py-4 text-center align-middle text-foreground">{team.elevenPlusPercent}</td>
                <td className="border-r border-border px-3 py-4 text-center align-middle text-foreground">{team.pointsBuckets.zero}</td>
                <td className="border-r border-border px-3 py-4 text-center align-middle text-foreground">{team.pointsBuckets.underFive}</td>
                <td className="border-r border-border px-3 py-4 text-center align-middle text-foreground">{team.pointsBuckets.fivePlus}</td>
                <td className="border-r border-border px-3 py-4 text-center align-middle text-foreground">{team.pointsBuckets.tenPlus}</td>
                <td className="border-r border-border px-3 py-4 text-center align-middle text-foreground">{team.pointsBuckets.seventeenPlus}</td>
                <td className="bg-secondary/5 px-3 py-4 text-center align-middle text-foreground">{team.pointsBuckets.twentyFourPlus}</td>
              </m.tr>
            ))}
          </tbody>
        </table>
      </div>
    </m.section>
  );
}
