import React, { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { format } from "date-fns";
import { ArrowUpRight, Trophy } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TeamIdentity from "../components/shared/TeamIdentity";
import StatusBadge from "../components/shared/StatusBadge";
import { normalizeOrganizationName } from "@/lib/organizationIdentity";
import { filterPublishedMatchResults } from "@/lib/matchResultPublication";
import { resolveTournamentLiveState } from "@/lib/tournamentLiveState";

function buildBoardLink(tournamentId, stage) {
  const params = new URLSearchParams();
  if (tournamentId) params.set("tournament", tournamentId);
  if (stage) params.set("stage", stage);
  const query = params.toString();
  return query ? `/leaderboard?${query}` : "/leaderboard";
}

function buildTeamLink(teamName) {
  return `/teams?team=${encodeURIComponent(normalizeOrganizationName(teamName))}`;
}

function formatLeaderboardDate(value, pattern, prefix = "") {
  if (!value) return "";
  const label = format(new Date(value), pattern);
  return prefix ? `${prefix}${label}` : label;
}

function MatchCell({ cell }) {
  if (!cell) {
    return <span className="text-muted-foreground/70">-</span>;
  }

  return (
    <div className="flex flex-col items-center justify-center leading-none">
      <div className="flex items-center gap-1">
        {cell.won ? <Trophy className="size-3.5 text-amber-500" /> : null}
        <span className="text-base font-black text-foreground">
          {cell.points}
        </span>
      </div>
      <span className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {cell.placement ? `P${cell.placement}` : "-"}
      </span>
    </div>
  );
}

function SignalCard({ label, value, detail, accent = "default", status }) {
  const accentClass =
    accent === "primary"
      ? "border-primary/25 bg-primary/10"
      : accent === "live"
        ? "border-red-500/25 bg-red-500/10"
        : "border-border bg-card";

  return (
    <div className={`rounded-[26px] border p-5 shadow-sm ${accentClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
            {label}
          </p>
          <p className="mt-3 text-lg font-black uppercase tracking-[-0.02em] text-foreground">
            {value}
          </p>
          <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
            {detail}
          </p>
        </div>
        {status ? <StatusBadge status={status} /> : null}
      </div>
    </div>
  );
}

function LeaderboardPageHeader({ boardIntro, featuredTournament }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
          Tournament center
        </p>
        <h1 className="mt-2 text-[2rem] font-heading font-semibold tracking-[-0.04em] text-foreground md:text-4xl">
          STANDINGS
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          {boardIntro}
        </p>
      </div>
      <div className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-sm sm:w-auto sm:text-right">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Featured board
        </p>
        <p className="mt-1 text-sm font-black uppercase tracking-[0.14em] text-primary">
          {featuredTournament?.status === "upcoming" ? "Armed" : "Active"}
        </p>
      </div>
    </div>
  );
}

function FeaturedStandingsSection({
  featuredTournament,
  stageBoard,
  tournamentQuery,
  stageOptions,
  nextUpcomingTournament,
}) {
  if (!featuredTournament) return null;

  return (
    <m.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[32px] border border-border bg-card shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
    >
      <div className="border-b border-border bg-[linear-gradient(180deg,rgba(251,146,60,0.08),rgba(255,255,255,0))] p-4 dark:bg-[linear-gradient(180deg,rgba(251,146,60,0.12),rgba(15,23,42,0))] sm:px-5 sm:py-5 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
                Featured tournament standings
              </p>
              <StatusBadge
                status={featuredTournament.status === "ongoing" ? "live" : featuredTournament.status}
              />
            </div>
            <h2 className="mt-3 max-w-4xl text-[1.75rem] font-heading font-semibold uppercase tracking-[-0.04em] text-foreground sm:text-2xl md:text-4xl">
              {featuredTournament.name}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <span>{stageBoard.standings.length} teams ranked</span>
              <span>&bull;</span>
              <span>{stageBoard.stageMatches.length} mapped matches</span>
            </div>
          </div>

          <Link
            to={`/tournaments${tournamentQuery}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary/40 hover:text-primary sm:w-auto"
          >
            Tournament hub
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        {stageOptions.length > 1 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {stageOptions.map((stageName) => {
              const active = stageName === stageBoard.featuredStage;
              return (
                <Link
                  key={stageName}
                  to={buildBoardLink(featuredTournament.id, stageName)}
                  className={`rounded-full px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background/80 text-muted-foreground hover:border-primary/35 hover:text-foreground"
                  }`}
                >
                  {stageName}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 border-b border-border p-4 sm:px-5 sm:py-5 md:grid-cols-4 md:px-6">
        <SignalCard
          label="Live match"
          value={
            stageBoard.liveMatch
              ? `Match ${stageBoard.liveMatch.match_number || "-"}`
              : featuredTournament.status === "completed"
                ? "Tournament completed"
                : featuredTournament.status === "upcoming"
                  ? "Season not live yet"
                  : "No live lobby"
          }
          detail={
            stageBoard.liveMatch
              ? `${stageBoard.liveMatch.stage || "Stage"}${stageBoard.liveMatch.map ? ` - ${stageBoard.liveMatch.map}` : ""}`
              : featuredTournament.start_date
                ? formatLeaderboardDate(featuredTournament.start_date, "MMM d, yyyy", "Starts ")
                : "Standings remain available while the next lobby is prepared."
          }
          accent={featuredTournament.status === "completed" ? "default" : "live"}
          status={stageBoard.liveMatch ? "live" : featuredTournament.status}
        />
        <SignalCard
          label="Up next"
          value={
            stageBoard.nextMatch
              ? `Match ${stageBoard.nextMatch.match_number || "-"}`
              : nextUpcomingTournament
                ? nextUpcomingTournament.name
                : "Awaiting update"
          }
          detail={
            stageBoard.nextMatch?.scheduled_time
              ? formatLeaderboardDate(stageBoard.nextMatch.scheduled_time, "MMM d, h:mm a")
              : nextUpcomingTournament?.start_date
                ? formatLeaderboardDate(nextUpcomingTournament.start_date, "MMM d, yyyy", "Starts ")
                : "No scheduled start time yet."
          }
          status={stageBoard.nextMatch?.status || nextUpcomingTournament?.status || featuredTournament.status}
        />
        <SignalCard
          label="Stage leader"
          value={stageBoard.leader?.teamName || "Standings pending"}
          detail={
            stageBoard.leader
              ? `${stageBoard.leader.points} pts - ${stageBoard.leader.wwcd} WWCD - ${stageBoard.leader.elims} elims`
              : "Results will populate once the stage board receives match scores."
          }
          accent="primary"
        />
        <SignalCard
          label="Stage focus"
          value={stageBoard.featuredStage || "Standings"}
          detail={
            stageBoard.stageMatches.length > 0
              ? `${stageBoard.stageMatches.length} match columns connected`
              : "Waiting for mapped match data."
          }
        />
      </div>

      <div className="-mx-4 overflow-x-auto sm:-mx-5 md:mx-0">
        <div className="flex min-w-[1120px] overflow-hidden md:min-w-0">
          <div className="shrink-0 border-r border-border bg-card shadow-[10px_0_24px_rgba(15,23,42,0.08)]">
            <table className="w-[756px] table-fixed text-sm">
              <colgroup>
                <col style={{ width: "72px" }} />
                <col style={{ width: "260px" }} />
                <col style={{ width: "70px" }} />
                <col style={{ width: "84px" }} />
                <col style={{ width: "94px" }} />
                <col style={{ width: "84px" }} />
                <col style={{ width: "92px" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-border bg-secondary/25 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  <th className="border-r border-border bg-secondary/35 px-4 py-3 text-left">#</th>
                  <th className="border-r border-border bg-secondary/35 px-4 py-3 text-left">Team</th>
                  <th className="border-r border-border bg-secondary/35 p-3 text-center">M</th>
                  <th className="border-r border-border bg-secondary/35 p-3 text-center">WWCD</th>
                  <th className="border-r border-border bg-secondary/35 p-3 text-center">Place</th>
                  <th className="border-r border-border bg-secondary/35 p-3 text-center">Elims</th>
                  <th className="bg-background p-3 text-center font-black text-foreground">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stageBoard.standings.map((team, index) => (
                  <m.tr
                    key={`summary-${team.teamId || team.teamName}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.015 }}
                    className="h-[72px] bg-card/90 transition-colors hover:bg-secondary/20"
                  >
                    <td className="h-[72px] border-r border-border px-4 py-3 align-middle">
                      <span className="inline-flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-sm font-black text-emerald-600 dark:text-emerald-300">
                        {team.rank}
                      </span>
                    </td>
                    <td className="h-[72px] border-r border-border px-4 py-3 align-middle">
                      <Link to={buildTeamLink(team.logoName || team.teamName)} className="block">
                        <TeamIdentity name={team.logoName} className="font-semibold text-foreground" contained logoClassName="h-7 w-auto object-contain" />
                      </Link>
                    </td>
                    <td className="h-[72px] border-r border-border p-3 text-center align-middle text-foreground">{team.matches}</td>
                    <td className="h-[72px] border-r border-border p-3 text-center align-middle text-foreground">{team.wwcd}</td>
                    <td className="h-[72px] border-r border-border p-3 text-center align-middle text-foreground">{team.placementPoints}</td>
                    <td className="h-[72px] border-r border-border p-3 text-center align-middle text-foreground">{team.elims}</td>
                    <td className="h-[72px] bg-background p-3 text-center align-middle text-lg font-black text-primary">{team.points}</td>
                  </m.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="min-w-0 flex-1 overflow-x-auto">
            <table className="w-max table-fixed text-sm">
              <colgroup>
                {stageBoard.stageMatches.map((match) => (
                  <col key={`match-col-${match.id}`} style={{ width: "94px" }} />
                ))}
              </colgroup>
              <thead>
                <tr className="border-b border-border bg-secondary/25 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {stageBoard.stageMatches.map((match) => (
                    <th key={match.id} className="p-3 text-center">
                      M{match.board_match_number || match.match_number || "-"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stageBoard.standings.map((team, index) => (
                  <m.tr
                    key={`matches-${team.teamId || team.teamName}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.015 }}
                    className="h-[72px] bg-card/90 transition-colors hover:bg-secondary/20"
                  >
                    {stageBoard.stageMatches.map((match) => (
                      <td key={`${team.teamId || team.teamName}-${match.id}`} className="h-[72px] p-3 text-center align-middle">
                        <MatchCell cell={team.matchCells[match.id]} />
                      </td>
                    ))}
                  </m.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </m.section>
  );
}

function OverallStatsSection({ featuredTournament, teamMapStats, calendarMatches }) {
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
        <table className="min-w-[1500px] table-fixed text-sm">
          <colgroup>
            <col style={{ width: "64px" }} />
            <col style={{ width: "264px" }} />
            <col style={{ width: "92px" }} />
            <col style={{ width: "108px" }} />
            <col style={{ width: "88px" }} />
            <col style={{ width: "88px" }} />
            <col style={{ width: "96px" }} />
            <col style={{ width: "96px" }} />
            <col style={{ width: "88px" }} />
            <col style={{ width: "96px" }} />
            <col style={{ width: "88px" }} />
            <col style={{ width: "88px" }} />
            <col style={{ width: "88px" }} />
            <col style={{ width: "84px" }} />
            <col style={{ width: "84px" }} />
            <col style={{ width: "84px" }} />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-secondary/25 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <th rowSpan={2} className="border-r border-border p-3 text-center">#</th>
              <th rowSpan={2} className="border-r border-border px-4 py-3 text-left">Participant</th>
              <th rowSpan={2} className="border-r border-border p-3 text-center">Total Points</th>
              <th rowSpan={2} className="border-r border-border p-3 text-center">Matches Played</th>
              <th colSpan={2} className="border-r border-border p-3 text-center">Points</th>
              <th colSpan={4} className="border-r border-border p-3 text-center">Averages</th>
              <th colSpan={3} className="border-r border-border p-3 text-center">Placement Summary</th>
              <th colSpan={3} className="bg-secondary/10 p-3 text-center">Map Avg Pts</th>
            </tr>
            <tr className="border-b border-border bg-secondary/15 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <th className="border-r border-border p-3 text-center">Place</th>
              <th className="border-r border-border p-3 text-center">Elims</th>
              <th className="border-r border-border p-3 text-center">Placement</th>
              <th className="border-r border-border p-3 text-center">Place Pts.</th>
              <th className="border-r border-border p-3 text-center">Elims</th>
              <th className="border-r border-border p-3 text-center">Total Pts.</th>
              <th className="border-r border-border p-3 text-center">Top 5</th>
              <th className="border-r border-border p-3 text-center">Top 8</th>
              <th className="border-r border-border p-3 text-center">&gt; 8th</th>
              <th className="bg-secondary/10 px-2 py-3 text-center">Rondo</th>
              <th className="bg-secondary/10 px-2 py-3 text-center">Erangel</th>
              <th className="bg-secondary/10 px-2 py-3 text-center">Miramar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {teamMapStats.map((team, index) => (
              <m.tr
                key={`overall-stats-${team.teamId || team.teamName}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.012 }}
                className="bg-card/90 transition-colors hover:bg-secondary/20"
              >
                <td className="border-r border-border px-3 py-4 text-center align-middle">
                  <span className="inline-flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-sm font-black text-emerald-600 dark:text-emerald-300">{team.rank}</span>
                </td>
                <td className="border-r border-border p-4 align-middle">
                  <Link to={buildTeamLink(team.logoName || team.teamName)} className="block">
                    <TeamIdentity name={team.logoName} className="font-semibold text-foreground" contained logoClassName="h-7 w-auto object-contain" />
                  </Link>
                </td>
                <td className="border-r border-border px-3 py-4 text-center align-middle text-lg font-black text-primary">{team.totalPoints}</td>
                <td className="border-r border-border px-3 py-4 text-center align-middle text-foreground">{team.matchesPlayed}</td>
                <td className="border-r border-border px-3 py-4 text-center align-middle text-foreground">{team.totalPlacePoints}</td>
                <td className="border-r border-border px-3 py-4 text-center align-middle text-foreground">{team.totalElims}</td>
                <td className="border-r border-border px-3 py-4 text-center align-middle text-foreground">{Number.isFinite(team.avgPlacement) ? team.avgPlacement.toFixed(2) : "-"}</td>
                <td className="border-r border-border px-3 py-4 text-center align-middle text-foreground">{Number.isFinite(team.avgPlacePoints) ? team.avgPlacePoints.toFixed(2) : "-"}</td>
                <td className="border-r border-border px-3 py-4 text-center align-middle text-foreground">{Number.isFinite(team.avgElims) ? team.avgElims.toFixed(2) : "-"}</td>
                <td className="border-r border-border px-3 py-4 text-center align-middle text-foreground">{Number.isFinite(team.avgTotalPoints) ? team.avgTotalPoints.toFixed(2) : "-"}</td>
                <td className="border-r border-border px-3 py-4 text-center align-middle text-foreground">{team.topFiveCount}</td>
                <td className="border-r border-border px-3 py-4 text-center align-middle text-foreground">{team.topEightCount}</td>
                <td className="border-r border-border px-3 py-4 text-center align-middle text-foreground">{team.overEightCount}</td>
                <td className="bg-secondary/5 px-2 py-4 text-center align-middle font-semibold text-foreground">{Number.isFinite(team.avgPointsByMap.rondo) ? team.avgPointsByMap.rondo.toFixed(2) : "-"}</td>
                <td className="bg-secondary/5 px-2 py-4 text-center align-middle font-semibold text-foreground">{Number.isFinite(team.avgPointsByMap.erangel) ? team.avgPointsByMap.erangel.toFixed(2) : "-"}</td>
                <td className="bg-secondary/5 px-2 py-4 text-center align-middle font-semibold text-foreground">{Number.isFinite(team.avgPointsByMap.miramar) ? team.avgPointsByMap.miramar.toFixed(2) : "-"}</td>
              </m.tr>
            ))}
          </tbody>
        </table>
      </div>
    </m.section>
  );
}

function buildTeamMapStats({
  featuredTournament,
  stageBoard,
  matches,
  matchResults,
}) {
  const tournamentMatches = matches.filter(
    (match) => match.tournament_id === featuredTournament?.id,
  );
  const tournamentMatchIds = new Set(
    tournamentMatches.map((match) => match.id),
  );
  const matchMap = new Map(tournamentMatches.map((match) => [match.id, match]));
  const teamStats = new Map();

  for (const row of stageBoard.standings) {
    teamStats.set(row.teamId || normalizeOrganizationName(row.teamName), {
      teamId: row.teamId,
      teamName: row.teamName,
      logoName: row.logoName || row.teamName,
      maps: new Map(),
    });
  }

  for (const result of matchResults) {
    if (!tournamentMatchIds.has(result.match_id)) continue;

    const match = matchMap.get(result.match_id);
    const mapName = String(match?.map || "Map pending").trim();
    const teamKey =
      result.team_id || normalizeOrganizationName(result.team_name);
    const displayName =
      result.team_name || teamStats.get(teamKey)?.teamName || "Unknown Team";
    const teamEntry = teamStats.get(teamKey) || {
      teamId: result.team_id,
      teamName: displayName,
      logoName: displayName,
      maps: new Map(),
    };

    const mapEntry = teamEntry.maps.get(mapName) || {
      map: mapName,
      matches: 0,
      wwcd: 0,
      placementPoints: 0,
      elims: 0,
      points: 0,
      placementSum: 0,
      topFiveCount: 0,
      topEightCount: 0,
      overEightCount: 0,
      pointsBuckets: {
        zero: 0,
        oneToFive: 0,
        sixToTen: 0,
        elevenToFifteen: 0,
        sixteenToTwenty: 0,
        overTwenty: 0,
      },
    };

    const wins =
      result.wins_count && result.wins_count > 0
        ? result.wins_count
        : result.placement === 1
          ? 1
          : 0;

    mapEntry.matches += result.matches_count || 1;
    mapEntry.wwcd += wins;
    mapEntry.placementPoints += result.placement_points || 0;
    mapEntry.elims += result.kill_points || 0;
    mapEntry.points += result.total_points || 0;
    mapEntry.placementSum += Number(result.placement) || 0;
    const placement = Number(result.placement) || 0;
    const totalPoints = Number(result.total_points) || 0;

    if (placement > 0 && placement <= 5) {
      mapEntry.topFiveCount += 1;
    }
    if (placement > 0 && placement <= 8) {
      mapEntry.topEightCount += 1;
    }
    if (placement > 8) {
      mapEntry.overEightCount += 1;
    }

    if (totalPoints === 0) {
      mapEntry.pointsBuckets.zero += 1;
    } else if (totalPoints <= 5) {
      mapEntry.pointsBuckets.oneToFive += 1;
    } else if (totalPoints <= 10) {
      mapEntry.pointsBuckets.sixToTen += 1;
    } else if (totalPoints <= 15) {
      mapEntry.pointsBuckets.elevenToFifteen += 1;
    } else if (totalPoints <= 20) {
      mapEntry.pointsBuckets.sixteenToTwenty += 1;
    } else {
      mapEntry.pointsBuckets.overTwenty += 1;
    }

    teamEntry.maps.set(mapName, mapEntry);
    teamStats.set(teamKey, teamEntry);
  }

  return stageBoard.standings
    .map((row) => {
      const entry = teamStats.get(
        row.teamId || normalizeOrganizationName(row.teamName),
      ) || {
        teamId: row.teamId,
        teamName: row.teamName,
        logoName: row.logoName || row.teamName,
        maps: new Map(),
      };

      const maps = [...entry.maps.values()]
        .map((mapRow) => ({
          ...mapRow,
          avgPlacement:
            mapRow.matches > 0 ? mapRow.placementSum / mapRow.matches : null,
          avgPlacePoints:
            mapRow.matches > 0 ? mapRow.placementPoints / mapRow.matches : 0,
          avgElims: mapRow.matches > 0 ? mapRow.elims / mapRow.matches : 0,
        }))
        .sort((left, right) => {
          if (right.points !== left.points) return right.points - left.points;
          if (right.wwcd !== left.wwcd) return right.wwcd - left.wwcd;
          return left.map.localeCompare(right.map);
        });

      const bestMap = maps[0] || null;
      const weakestMap =
        maps.toSorted((left, right) => {
          if (left.points !== right.points) return left.points - right.points;
          if (left.wwcd !== right.wwcd) return left.wwcd - right.wwcd;
          return left.map.localeCompare(right.map);
        })[0] || null;

      const totals = maps.reduce(
        (accumulator, mapRow) => {
          accumulator.points += mapRow.points;
          accumulator.matches += mapRow.matches;
          accumulator.placementPoints += mapRow.placementPoints;
          accumulator.elims += mapRow.elims;
          accumulator.placementSum += mapRow.placementSum;
          accumulator.topFiveCount += mapRow.topFiveCount;
          accumulator.topEightCount += mapRow.topEightCount;
          accumulator.overEightCount += mapRow.overEightCount;
          accumulator.pointsBuckets.zero += mapRow.pointsBuckets.zero;
          accumulator.pointsBuckets.oneToFive += mapRow.pointsBuckets.oneToFive;
          accumulator.pointsBuckets.sixToTen += mapRow.pointsBuckets.sixToTen;
          accumulator.pointsBuckets.elevenToFifteen +=
            mapRow.pointsBuckets.elevenToFifteen;
          accumulator.pointsBuckets.sixteenToTwenty +=
            mapRow.pointsBuckets.sixteenToTwenty;
          accumulator.pointsBuckets.overTwenty +=
            mapRow.pointsBuckets.overTwenty;
          return accumulator;
        },
        {
          points: 0,
          matches: 0,
          placementPoints: 0,
          elims: 0,
          placementSum: 0,
          topFiveCount: 0,
          topEightCount: 0,
          overEightCount: 0,
          pointsBuckets: {
            zero: 0,
            oneToFive: 0,
            sixToTen: 0,
            elevenToFifteen: 0,
            sixteenToTwenty: 0,
            overTwenty: 0,
          },
        },
      );

      return {
        teamId: row.teamId,
        teamName: row.teamName,
        logoName: row.logoName || row.teamName,
        rank: row.rank,
        totalPoints: totals.points,
        matchesPlayed: totals.matches,
        totalPlacePoints: totals.placementPoints,
        totalElims: totals.elims,
        avgPlacePoints:
          totals.matches > 0 ? totals.placementPoints / totals.matches : 0,
        avgPlacement:
          totals.matches > 0 ? totals.placementSum / totals.matches : null,
        avgElims: totals.matches > 0 ? totals.elims / totals.matches : 0,
        avgTotalPoints: totals.matches > 0 ? totals.points / totals.matches : 0,
        topFiveCount: totals.topFiveCount,
        topEightCount: totals.topEightCount,
        overEightCount: totals.overEightCount,
        pointsBuckets: totals.pointsBuckets,
        avgPointsByMap: {
          rondo: maps.find((mapRow) => mapRow.map.toLowerCase() === "rondo")
            ?.matches
            ? maps.find((mapRow) => mapRow.map.toLowerCase() === "rondo")
                .points /
              maps.find((mapRow) => mapRow.map.toLowerCase() === "rondo")
                .matches
            : null,
          erangel: maps.find((mapRow) => mapRow.map.toLowerCase() === "erangel")
            ?.matches
            ? maps.find((mapRow) => mapRow.map.toLowerCase() === "erangel")
                .points /
              maps.find((mapRow) => mapRow.map.toLowerCase() === "erangel")
                .matches
            : null,
          miramar: maps.find((mapRow) => mapRow.map.toLowerCase() === "miramar")
            ?.matches
            ? maps.find((mapRow) => mapRow.map.toLowerCase() === "miramar")
                .points /
              maps.find((mapRow) => mapRow.map.toLowerCase() === "miramar")
                .matches
            : null,
        },
        maps,
      };
    })
    .sort((left, right) => {
      if (right.totalPoints !== left.totalPoints)
        return right.totalPoints - left.totalPoints;
      if (right.totalElims !== left.totalElims)
        return right.totalElims - left.totalElims;
      return left.teamName.localeCompare(right.teamName);
    })
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
}

function useLeaderboardData() {
  const [searchParams] = useSearchParams();

  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery({
    queryKey: ["tournaments"],
    queryFn: () => base44.entities.Tournament.list("-created_date", 100),
  });
  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list("scheduled_time", 300),
  });
  const { data: rawMatchResults = [], isLoading: resultsLoading } = useQuery({
    queryKey: ["match-results"],
    queryFn: () => base44.entities.MatchResult.list("-created_date", 5000),
  });
  const matchResults = useMemo(
    () => filterPublishedMatchResults(rawMatchResults),
    [rawMatchResults],
  );
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: () => base44.entities.Team.list("-created_date", 300),
  });

  const requestedTournamentId = searchParams.get("tournament");
  const requestedStage = searchParams.get("stage");

  const liveState = useMemo(
    () =>
      resolveTournamentLiveState({
        tournaments,
        teams,
        matches,
        matchResults,
        requestedTournamentId,
        requestedStage,
      }),
    [
      matches,
      matchResults,
      requestedStage,
      requestedTournamentId,
      teams,
      tournaments,
    ],
  );
  const {
    calendarMatches,
    calendarTournaments,
    featuredTournament,
    stageBoard,
  } = liveState;

  const isLoading =
    tournamentsLoading || matchesLoading || resultsLoading || teamsLoading;
  const tournamentQuery = useMemo(() => {
    if (!featuredTournament) return "";
    const params = new URLSearchParams();
    params.set("id", featuredTournament.id);
    if (stageBoard.featuredStage) {
      params.set("stage", stageBoard.featuredStage);
    }
    return `?${params.toString()}`;
  }, [featuredTournament, stageBoard.featuredStage]);

  const stageOptions = useMemo(() => {
    if (!featuredTournament) return [];

    const labels = new Map();
    const declaredStages = (featuredTournament.stages || []).flatMap((stage) =>
      stage?.name ? [stage.name] : [],
    );
    const declaredStageSet = new Set(declaredStages);

    for (const stage of featuredTournament.stages || []) {
      if (stage?.name) labels.set(stage.name, stage.name);
    }
    for (const match of matches) {
      if (
        match.tournament_id === featuredTournament.id &&
        match.stage &&
        declaredStageSet.has(match.stage)
      ) {
        labels.set(match.stage, match.stage);
      }
    }
    for (const result of matchResults) {
      if (
        result.tournament_id === featuredTournament.id &&
        result.stage &&
        declaredStageSet.has(result.stage)
      ) {
        labels.set(result.stage, result.stage);
      }
    }

    return Array.from(labels.values());
  }, [featuredTournament, matches, matchResults]);

  const nextUpcomingTournament = useMemo(() => {
    const now = new Date();
    return (
      calendarTournaments
        .filter(
          (tournament) =>
            tournament.status === "upcoming" &&
            tournament.start_date &&
            new Date(tournament.start_date) >= now,
        )
        .toSorted((a, b) => new Date(a.start_date) - new Date(b.start_date))[0] ||
      null
    );
  }, [calendarTournaments]);

  const teamMapStats = useMemo(
    () =>
      buildTeamMapStats({
        featuredTournament,
        stageBoard,
        matches: calendarMatches,
        matchResults,
      }),
    [featuredTournament, stageBoard, calendarMatches, matchResults],
  );
  const stageMaps = useMemo(
    () => [
      ...new Set(
        teamMapStats.flatMap((team) =>
          Array.isArray(team.maps)
            ? team.maps.flatMap((entry) => (entry.map ? [entry.map] : []))
            : [],
        ),
      ),
    ],
    [teamMapStats],
  );

  const boardState =
    featuredTournament?.status === "upcoming"
      ? "upcoming"
      : stageBoard.liveMatch
        ? "live"
        : stageBoard.standings.length > 0
          ? "active"
          : "waiting";

  const boardIntro =
    boardState === "live"
      ? "Live scoreboard, up-next signal, and match-by-match scoring in one connected standings view."
      : boardState === "upcoming"
        ? "The next tournament board is armed with scheduled lobbies and will populate the moment results land."
        : stageBoard.standings.length > 0
          ? "Current stage standings, mapped match columns, and leaderboard movement in one connected surface."
          : "Standings will appear here as soon as verified match scores are attached to the selected stage.";


  return {
    isLoading,
    boardIntro,
    featuredTournament,
    stageBoard,
    tournamentQuery,
    stageOptions,
    nextUpcomingTournament,
    teamMapStats,
    calendarMatches,
    stageMaps,
  };
}

export default function Leaderboard() {
  const {
    isLoading,
    boardIntro,
    featuredTournament,
    stageBoard,
    tournamentQuery,
    stageOptions,
    nextUpcomingTournament,
    teamMapStats,
    calendarMatches,
    stageMaps,
  } = useLeaderboardData();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
          Loading standings
        </p>
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="space-y-5 md:space-y-6">
        <LeaderboardPageHeader boardIntro={boardIntro} featuredTournament={featuredTournament} />
        <FeaturedStandingsSection
          featuredTournament={featuredTournament}
          stageBoard={stageBoard}
          tournamentQuery={tournamentQuery}
          stageOptions={stageOptions}
          nextUpcomingTournament={nextUpcomingTournament}
        />
        <OverallStatsSection
          featuredTournament={featuredTournament}
          teamMapStats={teamMapStats}
          calendarMatches={calendarMatches}
        />

      </div>
    </LazyMotion>
  );
}
