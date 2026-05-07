import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import { ArrowUpRight, Download, Share2, Trophy } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TeamIdentity from "../components/shared/TeamIdentity";
import StatusBadge from "../components/shared/StatusBadge";
import { normalizeOrganizationName } from "@/lib/organizationIdentity";
import {
  getFeaturedTournamentStage,
  getStageBoardData,
  sortStageBoardMatches,
} from "@/lib/stageBoard";
import {
  decorateMatchesWithLiveStatus,
  decorateTournamentsWithLiveStatus,
} from "@/lib/liveCalendar";

const LOCAL_ADMIN_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function getFeaturedTournament(tournaments, matches, matchResults) {
  const now = new Date();
  const liveTournamentIds = new Set(matches.filter((match) => match.status === "live").map((match) => match.tournament_id));
  const scheduledTournamentIds = new Set(matches.filter((match) => match.status === "scheduled" || match.status === "live").map((match) => match.tournament_id));
  const resultTournamentIds = new Set(matchResults.map((result) => result.tournament_id).filter(Boolean));

  const upcomingTournaments = tournaments
    .filter((tournament) => tournament.status === "upcoming" && tournament.start_date && new Date(tournament.start_date) >= now)
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  const completedTournaments = tournaments
    .filter((tournament) => tournament.status === "completed" && resultTournamentIds.has(tournament.id))
    .sort((a, b) => new Date(b.end_date || b.start_date || 0) - new Date(a.end_date || a.start_date || 0));

  return (
    tournaments.find((tournament) => liveTournamentIds.has(tournament.id)) ||
    tournaments.find((tournament) => tournament.status === "ongoing" && scheduledTournamentIds.has(tournament.id)) ||
    tournaments.find((tournament) => tournament.status === "ongoing") ||
    upcomingTournaments[0] ||
    completedTournaments[0] ||
    tournaments.find((tournament) => scheduledTournamentIds.has(tournament.id)) ||
    tournaments.find((tournament) => resultTournamentIds.has(tournament.id)) ||
    tournaments[0] ||
    null
  );
}

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

function MatchCell({ cell }) {
  if (!cell) {
    return <span className="text-muted-foreground/70">-</span>;
  }

  return (
    <div className="flex flex-col items-center justify-center leading-none">
      <div className="flex items-center gap-1">
        {cell.won ? <span className="text-xs leading-none">??</span> : null}
        <span className="text-base font-black text-foreground">{cell.points}</span>
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
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">{label}</p>
          <p className="mt-3 text-lg font-black uppercase tracking-[-0.02em] text-foreground">{value}</p>
          <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{detail}</p>
        </div>
        {status ? <StatusBadge status={status} /> : null}
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const [searchParams] = useSearchParams();
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [snapshotBusy, setSnapshotBusy] = useState(false);
  const [snapshotFormat, setSnapshotFormat] = useState("match");
  const [snapshotGroup, setSnapshotGroup] = useState("all");
  const snapshotRef = useRef(null);

  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery({
    queryKey: ["tournaments"],
    queryFn: () => base44.entities.Tournament.list("-created_date", 100),
  });
  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list("scheduled_time", 300),
  });
  const { data: matchResults = [], isLoading: resultsLoading } = useQuery({
    queryKey: ["match-results"],
    queryFn: () => base44.entities.MatchResult.list("-created_date", 5000),
  });
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: () => base44.entities.Team.list("-created_date", 300),
  });

  const requestedTournamentId = searchParams.get("tournament");
  const requestedStage = searchParams.get("stage");
  const isLocalAdmin = typeof window !== "undefined" && LOCAL_ADMIN_HOSTS.has(window.location.hostname);

  const calendarMatches = useMemo(
    () => decorateMatchesWithLiveStatus(matches, matchResults),
    [matches, matchResults]
  );
  const calendarTournaments = useMemo(
    () => decorateTournamentsWithLiveStatus(tournaments, calendarMatches, matchResults),
    [tournaments, calendarMatches, matchResults]
  );

  const featuredTournament = useMemo(
    () =>
      calendarTournaments.find((tournament) => tournament.id === requestedTournamentId) ||
      getFeaturedTournament(calendarTournaments, calendarMatches, matchResults),
    [calendarTournaments, calendarMatches, matchResults, requestedTournamentId]
  );

  const stageBoard = useMemo(
    () => getStageBoardData({ featuredTournament, teams, matches: calendarMatches, matchResults, requestedStage }),
    [featuredTournament, teams, calendarMatches, matchResults, requestedStage]
  );

  const isLoading = tournamentsLoading || matchesLoading || resultsLoading || teamsLoading;
  const tournamentQuery = featuredTournament ? `?id=${encodeURIComponent(featuredTournament.id)}` : "";
  const stageOptions = useMemo(() => {
    if (!featuredTournament) return [];
    const labels = new Map();
    const declaredStages = (featuredTournament.stages || []).map((stage) => stage?.name).filter(Boolean);
    for (const stage of featuredTournament.stages || []) {
      if (stage?.name) labels.set(stage.name, stage.name);
    }
    for (const match of matches) {
      if (match.tournament_id === featuredTournament.id && match.stage && declaredStages.includes(match.stage)) labels.set(match.stage, match.stage);
    }
    for (const result of matchResults) {
      if (result.tournament_id === featuredTournament.id && result.stage && declaredStages.includes(result.stage)) labels.set(result.stage, result.stage);
    }
    return [...labels.values()];
  }, [featuredTournament, matches, matchResults]);

  const nextUpcomingTournament = useMemo(() => {
    const now = new Date();
    return tournaments
      .filter((tournament) => tournament.status === "upcoming" && tournament.start_date && new Date(tournament.start_date) >= now)
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))[0] || null;
  }, [calendarTournaments]);

  const boardState =
    featuredTournament?.status === "upcoming" ? "upcoming" :
    stageBoard.liveMatch ? "live" :
    stageBoard.standings.length > 0 ? "active" : "waiting";

  const boardIntro =
    boardState === "live"
      ? "Live scoreboard, up-next signal, and match-by-match scoring in one connected standings view."
      : boardState === "upcoming"
        ? "The next tournament board is armed with scheduled lobbies and will populate the moment BMPS 2026 results land."
        : stageBoard.standings.length > 0
          ? "Current stage standings, mapped match columns, and leaderboard movement in one connected surface."
          : "Standings will appear here as soon as verified match scores are attached to the selected stage.";

  const hasBoardData = stageBoard.standings.length > 0;
  const shouldShowSnapshotGroup = useMemo(() => {
    if (String(stageBoard.featuredStage || "").trim().toLowerCase() === "grand finals") {
      return false;
    }
    return stageBoard.standings.some((team) => team.group && team.group !== "-");
  }, [stageBoard.featuredStage, stageBoard.standings]);
  const snapshotGroupOptions = useMemo(() => {
    if (!shouldShowSnapshotGroup) return [];
    return [...new Set(stageBoard.standings.map((team) => team.group).filter((group) => group && group !== "-"))].sort();
  }, [shouldShowSnapshotGroup, stageBoard.standings]);
  useEffect(() => {
    if (!snapshotGroupOptions.length) {
      setSnapshotGroup("all");
      return;
    }
    if (snapshotGroup !== "all" && !snapshotGroupOptions.includes(snapshotGroup)) {
      setSnapshotGroup(snapshotGroupOptions[0]);
    }
  }, [snapshotGroup, snapshotGroupOptions]);
  const latestCompletedMatch = useMemo(() => {
    const completed = stageBoard.stageMatches.filter((match) => match.status === "completed");
    const source = completed.length > 0 ? completed : stageBoard.stageMatches;
    return source[source.length - 1] || null;
  }, [stageBoard.stageMatches]);
  const latestMatchLabel = latestCompletedMatch ? `M${latestCompletedMatch.board_match_number || latestCompletedMatch.match_number || "-"}` : "Mx";
  const snapshotStageLabel = snapshotGroup !== "all" ? `${stageBoard.featuredStage || "Standings"} - Group ${snapshotGroup}` : stageBoard.featuredStage || "Standings";
  const snapshotStandings = useMemo(
    () => {
      const source = snapshotGroup === "all" ? stageBoard.standings : stageBoard.standings.filter((team) => team.group === snapshotGroup);
      const scoped = snapshotFormat === "match" ? source.slice(0, 16) : source;
      return snapshotGroup === "all"
        ? scoped
        : scoped.map((team, index) => ({ ...team, rank: index + 1 }));
    },
    [stageBoard.standings, snapshotFormat, snapshotGroup]
  );
  const shouldShowSnapshotGroupColumn = shouldShowSnapshotGroup && snapshotGroup === "all";
  const isDenseMatchSnapshot = snapshotStandings.length > 12;
  const isDenseDaySnapshot = snapshotStandings.length > 12;
  const matchSnapshotScale = useMemo(() => {
    if (snapshotFormat !== "match") return 1;
    return Math.min(1, 13.5 / Math.max(snapshotStandings.length, 1));
  }, [snapshotFormat, snapshotStandings.length]);
  const daySnapshotScale = useMemo(() => {
    if (snapshotFormat !== "day") return 1;
    return Math.min(1, 11 / Math.max(snapshotStandings.length, 1));
  }, [snapshotFormat, snapshotStandings.length]);
  const snapshotFilename = useMemo(() => {
    const base = `${featuredTournament?.name || "standings"}-${stageBoard.featuredStage || "board"}${snapshotGroup !== "all" ? `-group-${snapshotGroup}` : ""}-${snapshotFormat}`;
    return base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }, [featuredTournament, stageBoard.featuredStage, snapshotFormat, snapshotGroup]);
  const matchSnapshotGridClass = shouldShowSnapshotGroupColumn
    ? "grid-cols-[22px_16px_minmax(0,2.05fr)_26px_22px_22px_28px_28px_38px_36px]"
    : "grid-cols-[22px_16px_minmax(0,2.2fr)_22px_22px_28px_28px_38px_36px]";
  const daySnapshotGridClass = shouldShowSnapshotGroupColumn
    ? "grid-cols-[28px_18px_minmax(0,2.34fr)_42px_34px_34px_42px_44px_62px]"
    : "grid-cols-[28px_18px_minmax(0,2.54fr)_34px_34px_42px_44px_62px]";

  const createSnapshotCanvas = async () => {
    if (!snapshotRef.current) return null;
    return html2canvas(snapshotRef.current, {
      scale: 2,
      backgroundColor: snapshotFormat === "match" ? "#0b1018" : "#0a4280",
      useCORS: true,
    });
  };

  const handleDownloadSnapshot = async () => {
    try {
      setSnapshotBusy(true);
      const canvas = await createSnapshotCanvas();
      if (!canvas) return;
      const link = document.createElement("a");
      link.download = `${snapshotFilename}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setSnapshotBusy(false);
    }
  };

  const handleShareSnapshot = async () => {
    try {
      setSnapshotBusy(true);
      const canvas = await createSnapshotCanvas();
      if (!canvas) return;
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return;
      const file = new File([blob], `${snapshotFilename}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({
          title: "Standings Snapshot",
          text: `${featuredTournament?.name || "Tournament"} standings snapshot`,
          files: [file],
        });
        return;
      }
      const link = document.createElement("a");
      link.download = `${snapshotFilename}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    } finally {
      setSnapshotBusy(false);
    }
  };

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Loading standings</p></div>;
  }

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">Tournament center</p>
          <h1 className="mt-2 text-[2rem] font-heading font-black tracking-[-0.04em] text-foreground md:text-4xl">STANDINGS</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{boardIntro}</p>
        </div>
        <div className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-sm sm:w-auto sm:text-right">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Featured board</p>
          <p className="mt-1 text-sm font-black uppercase tracking-[0.14em] text-primary">{featuredTournament?.status === "upcoming" ? "Armed" : "Active"}</p>
        </div>
      </div>

      {isLocalAdmin && hasBoardData ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => { setSnapshotFormat("match"); setSnapshotOpen(true); }}>
            <Share2 className="mr-2 h-4 w-4" /> Match 9:16
          </Button>
          <Button variant="outline" onClick={() => { setSnapshotFormat("day"); setSnapshotOpen(true); }}>
            <Share2 className="mr-2 h-4 w-4" /> Day 4:5
          </Button>
        </div>
      ) : null}

      {featuredTournament ? (
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[32px] border border-border bg-card shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <div className="border-b border-border bg-[linear-gradient(180deg,rgba(251,146,60,0.08),rgba(255,255,255,0))] px-4 py-4 dark:bg-[linear-gradient(180deg,rgba(251,146,60,0.12),rgba(15,23,42,0))] sm:px-5 sm:py-5 md:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">Featured tournament standings</p>
                  <StatusBadge status={featuredTournament.status === "ongoing" ? "live" : featuredTournament.status} />
                </div>
                <h2 className="mt-3 max-w-4xl text-[1.75rem] font-heading font-black uppercase tracking-[-0.04em] text-foreground sm:text-2xl md:text-4xl">{featuredTournament.name}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <span>{stageBoard.standings.length} teams ranked</span>
                  <span>&bull;</span>
                  <span>{stageBoard.stageMatches.length} mapped matches</span>
                </div>
              </div>

              <Link to={`/tournaments${tournamentQuery}`} className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary/40 hover:text-primary sm:w-auto">
                Tournament hub
                <ArrowUpRight className="h-3.5 w-3.5" />
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
                        active ? "bg-primary text-primary-foreground" : "border border-border bg-background/80 text-muted-foreground hover:border-primary/35 hover:text-foreground"
                      }`}
                    >
                      {stageName}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 border-b border-border px-4 py-4 sm:px-5 sm:py-5 md:grid-cols-4 md:px-6">
            <SignalCard
              label="Live match"
              value={stageBoard.liveMatch ? `Match ${stageBoard.liveMatch.match_number || "-"}` : featuredTournament.status === "completed" ? "Tournament completed" : featuredTournament.status === "upcoming" ? "Season not live yet" : "No live lobby"}
              detail={stageBoard.liveMatch ? `${stageBoard.liveMatch.stage}${stageBoard.liveMatch.map ? ` ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${stageBoard.liveMatch.map}` : ""}` : featuredTournament.start_date ? `Starts ${format(new Date(featuredTournament.start_date), "MMM d, yyyy")}` : "Standings remain available while the next lobby is prepared."}
              accent={featuredTournament.status === "completed" ? "default" : "live"}
              status={stageBoard.liveMatch ? "live" : featuredTournament.status}
            />
            <SignalCard
              label="Up next"
              value={stageBoard.nextMatch ? `Match ${stageBoard.nextMatch.match_number || "-"}` : nextUpcomingTournament ? nextUpcomingTournament.name : "Awaiting update"}
              detail={stageBoard.nextMatch?.scheduled_time ? format(new Date(stageBoard.nextMatch.scheduled_time), "MMM d, h:mm a") : nextUpcomingTournament?.start_date ? `Starts ${format(new Date(nextUpcomingTournament.start_date), "MMM d, yyyy")}` : "No scheduled start time yet."}
              status={stageBoard.nextMatch?.status || nextUpcomingTournament?.status || featuredTournament.status}
            />
            <SignalCard
              label="Stage leader"
              value={stageBoard.leader?.teamName || "Standings pending"}
              detail={stageBoard.leader ? `${stageBoard.leader.points} pts ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${stageBoard.leader.wwcd} WWCD ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${stageBoard.leader.elims} elims` : "Results will populate once the stage board receives match scores."}
              accent="primary"
            />
            <SignalCard
              label="Stage focus"
              value={stageBoard.featuredStage || "Standings"}
              detail={stageBoard.stageMatches.length > 0 ? `${stageBoard.stageMatches.length} match columns connected` : "Waiting for mapped match data."}
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
                      <th className="border-r border-border bg-secondary/35 px-3 py-3 text-center">M</th>
                      <th className="border-r border-border bg-secondary/35 px-3 py-3 text-center">WWCD</th>
                      <th className="border-r border-border bg-secondary/35 px-3 py-3 text-center">Place</th>
                      <th className="border-r border-border bg-secondary/35 px-3 py-3 text-center">Elims</th>
                      <th className="bg-background px-3 py-3 text-center font-black text-foreground">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stageBoard.standings.map((team, index) => (
                      <motion.tr
                        key={`summary-${team.teamId || team.teamName}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.015 }}
                        className="h-[72px] bg-card/90 transition-colors hover:bg-secondary/20"
                      >
                        <td className="h-[72px] border-r border-border px-4 py-3 align-middle">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-sm font-black text-emerald-600 dark:text-emerald-300">{team.rank}</span>
                        </td>
                        <td className="h-[72px] border-r border-border px-4 py-3 align-middle">
                          <Link to={buildTeamLink(team.logoName || team.teamName)} className="block">
                            <TeamIdentity name={team.logoName} className="font-semibold text-foreground" contained logoClassName="h-7 w-auto object-contain" />
                          </Link>
                        </td>
                        <td className="h-[72px] border-r border-border px-3 py-3 text-center align-middle text-foreground">{team.matches}</td>
                        <td className="h-[72px] border-r border-border px-3 py-3 text-center align-middle text-foreground">{team.wwcd}</td>
                        <td className="h-[72px] border-r border-border px-3 py-3 text-center align-middle text-foreground">{team.placementPoints}</td>
                        <td className="h-[72px] border-r border-border px-3 py-3 text-center align-middle text-foreground">{team.elims}</td>
                        <td className="h-[72px] bg-background px-3 py-3 text-center align-middle text-lg font-black text-primary">{team.points}</td>
                      </motion.tr>
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
                        <th key={match.id} className="px-3 py-3 text-center">M{match.board_match_number || match.match_number || "-"}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stageBoard.standings.map((team, index) => (
                      <motion.tr
                        key={`matches-${team.teamId || team.teamName}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.015 }}
                        className="h-[72px] bg-card/90 transition-colors hover:bg-secondary/20"
                      >
                        {stageBoard.stageMatches.map((match) => (
                          <td key={`${team.teamId || team.teamName}-${match.id}`} className="h-[72px] px-3 py-3 text-center align-middle">
                            <MatchCell cell={team.matchCells[match.id]} />
                          </td>
                        ))}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.section>
      ) : null}

      <Dialog open={snapshotOpen} onOpenChange={setSnapshotOpen}>
        <DialogContent className="max-w-[1280px] rounded-[28px] border-border/70 bg-background p-0 overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[380px_1fr]">
            <div className="border-b border-border/70 p-5 lg:border-b-0 lg:border-r">
              <DialogHeader className="text-left">
                <DialogTitle>{snapshotFormat === "match" ? "Match Snapshot" : "Day Snapshot"}</DialogTitle>
                <DialogDescription>
                  {snapshotFormat === "match"
                    ? "9:16 export with #, Team, WWCD, Elims, Total, and only the latest completed match column."
                    : "4:5 export with #, Team, M, WWCD, Place, Elims, and Total."}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-5 flex gap-2">
                <Button variant={snapshotFormat === "match" ? "default" : "outline"} onClick={() => setSnapshotFormat("match")} className="flex-1">Match 9:16</Button>
                <Button variant={snapshotFormat === "day" ? "default" : "outline"} onClick={() => setSnapshotFormat("day")} className="flex-1">Day 4:5</Button>
              </div>

              {snapshotGroupOptions.length ? (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Button variant={snapshotGroup === "all" ? "default" : "outline"} onClick={() => setSnapshotGroup("all")} className="col-span-3">All Groups</Button>
                  {snapshotGroupOptions.map((group) => (
                    <Button key={group} variant={snapshotGroup === group ? "default" : "outline"} onClick={() => setSnapshotGroup(group)}>Group {group}</Button>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 rounded-2xl border border-border/70 bg-secondary/20 p-4 text-sm">
                <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Scope</p>
                <p className="mt-2 font-medium text-foreground">{featuredTournament?.name || "Tournament"}</p>
                <p className="mt-1 text-muted-foreground">{snapshotStageLabel} - {snapshotStandings.length} teams</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={handleDownloadSnapshot} disabled={snapshotBusy}><Download className="mr-2 h-4 w-4" /> Download PNG</Button>
                <Button variant="outline" onClick={handleShareSnapshot} disabled={snapshotBusy}><Share2 className="mr-2 h-4 w-4" /> Share</Button>
              </div>
            </div>

            <div className="flex items-center justify-center bg-[linear-gradient(135deg,_#0e4b93_0%,_#0a3b77_30%,_#072b58_100%)] p-5">
              {snapshotFormat === "match" ? (
                <div key={`match-${featuredTournament?.id || "board"}-${stageBoard.featuredStage || "stage"}-${latestMatchLabel}`} ref={snapshotRef} className="relative aspect-[9/16] w-[430px] overflow-hidden rounded-[34px] bg-[linear-gradient(180deg,_#0b4f9d_0%,_#0a3f80_16%,_#0a3872_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
                  <div className="absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.18)_0,rgba(255,255,255,0.18)_2px,transparent_2px,transparent_10px)]" />
                  <div className="absolute inset-0 overflow-hidden">
                    <div
                      className={`relative z-10 flex h-full flex-col ${isDenseMatchSnapshot ? "p-3" : "p-4"}`}
                      style={{
                        transform: `scale(${matchSnapshotScale})`,
                        transformOrigin: "top left",
                        width: `${100 / matchSnapshotScale}%`,
                        height: `${100 / matchSnapshotScale}%`,
                      }}
                    >
                      <div className="overflow-hidden rounded-[30px] bg-white shadow-[0_18px_44px_rgba(7,23,52,0.28)]">
                        <div className={`bg-[linear-gradient(180deg,_#0d3e7f_0%,_#0a3265_100%)] text-white ${isDenseMatchSnapshot ? "px-4 py-4" : "px-5 py-5"}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-[9px] uppercase tracking-[0.28em] text-white/72">{featuredTournament?.name || "Tournament"}</p>
                              <h3 className={`mt-1.5 font-black uppercase leading-none tracking-[-0.06em] ${isDenseMatchSnapshot ? "text-[25px]" : "text-[29px]"}`}>Standings</h3>
                            </div>
                            <div className={`rounded-2xl bg-white/12 text-right ${isDenseMatchSnapshot ? "min-w-[72px] px-2.5 py-1.5" : "min-w-[78px] px-3 py-2"}`}>
                              <p className="text-[9px] uppercase tracking-[0.2em] text-white/72">Match</p>
                              <p className="mt-1 text-sm font-black leading-none text-white">{latestMatchLabel}</p>
                            </div>
                          </div>
                        </div>
                        <div className={`${isDenseMatchSnapshot ? "px-3 py-3" : "px-4 py-4"}`}>
                          <div className="flex items-center justify-between gap-3 border-b border-[#d6e0ee] pb-3">
                            <div className="min-w-0 flex-1">
                              <p className={`font-black uppercase tracking-[0.04em] text-[#103b73] ${isDenseMatchSnapshot ? "text-[14px]" : "text-[16px]"}`}>{snapshotStageLabel}</p>
                              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{snapshotStandings.length} teams ranked</p>
                            </div>
                            <div className={`rounded-2xl bg-[linear-gradient(90deg,_#0d4ea0_0%,_#1c71c8_100%)] text-center text-white shadow-[0_10px_24px_rgba(13,78,160,0.22)] ${isDenseMatchSnapshot ? "min-w-[110px] px-3 py-2" : "min-w-[128px] px-4 py-2.5"}`}>
                              <p className="text-[10px] uppercase tracking-[0.24em] text-white/72">Map</p>
                              <p className={`mt-1 font-black uppercase tracking-[0.08em] ${isDenseMatchSnapshot ? "text-[13px]" : "text-[15px]"}`}>{latestCompletedMatch?.map || "Standings"}</p>
                            </div>
                          </div>
                          <div className={`mt-3 grid items-center gap-x-0.5 gap-y-1 rounded-[18px] bg-slate-50 px-2 py-2 text-[7px] font-bold uppercase tracking-[0.14em] text-slate-600 ${matchSnapshotGridClass}`}>
                            <span className="-ml-[1px] text-center">#</span>
                            <span />
                            <span className="pl-0.5 text-left">Team</span>
                            {shouldShowSnapshotGroupColumn ? <span className="text-center">Grp</span> : null}
                            <span className="text-center">M</span>
                            <span className="text-center">W</span>
                            <span className="text-center">P</span>
                            <span className="text-center">F</span>
                            <span className="pr-1 text-right">Total</span>
                            <span className="pr-1 text-right">{latestMatchLabel}</span>
                          </div>
                          <div className="mt-1 space-y-1">
                            {snapshotStandings.map((team, index) => (
                              <div key={`story-${team.teamId || team.teamName}`} className={`rounded-[14px] border border-slate-200 bg-white ${isDenseMatchSnapshot ? "min-h-[34px] px-2 py-1.5" : "min-h-[40px] px-2.5 py-2"}`}>
                                <div className={`grid items-center gap-x-0.5 gap-y-1 ${matchSnapshotGridClass}`}>
                                  <div className={`relative inline-flex self-center rounded-full ${isDenseMatchSnapshot ? "h-5 w-5" : "h-6 w-6"} ${index < 4 ? "bg-[#1bb14a] text-white" : index >= Math.max(snapshotStandings.length - 4, 12) ? "bg-[#d93045] text-white" : "bg-[#175aa8] text-white"}`}>
                                    <span
                                      className={`absolute inset-0 flex items-center justify-center font-black leading-none tabular-nums ${isDenseMatchSnapshot ? "text-[9px]" : "text-[10px]"}`}
                                      style={{ transform: "translateY(-5.5px)" }}
                                    >
                                      {team.rank}
                                    </span>
                                  </div>
                                  <div className={isDenseMatchSnapshot ? "relative top-px flex h-3.5 w-3.5 self-center items-center justify-center" : "relative top-px flex h-4 w-4 self-center items-center justify-center"}>
                                    <TeamIdentity
                                      name={team.logoName || team.teamName}
                                      compact
                                      plain
                                      hideText
                                      containerClassName="justify-center"
                                      logoClassName={isDenseMatchSnapshot ? "h-3.5 w-3.5 shrink-0 object-contain" : "h-4 w-4 shrink-0 object-contain"}
                                    />
                                  </div>
                                  <div className="relative -top-[5px] flex min-w-0 self-center items-center gap-1 pl-0.5 pr-1">
                                    <span className={`${isDenseMatchSnapshot ? "text-[9.5px]" : "text-[10.5px]"} block min-w-0 whitespace-nowrap text-left font-bold leading-[1.15] text-slate-900`}>
                                      {team.teamName}
                                    </span>
                                      {latestCompletedMatch && team.matchCells[latestCompletedMatch.id]?.won ? (
                                        <span className="relative top-[2px] inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-50 px-1 py-[1px] text-[7px] font-black uppercase leading-none text-amber-700">
                                          <Trophy className="h-2.5 w-2.5" strokeWidth={2.4} />
                                        </span>
                                      ) : null}
                                  </div>
                                  {shouldShowSnapshotGroupColumn ? <div className="text-center text-[8px] font-semibold text-slate-600">{team.group || "-"}</div> : null}
                                  <div className="text-center text-[8px] font-semibold text-slate-700">{team.matches}</div>
                                  <div className="text-center text-[8px] font-semibold text-slate-700">{team.wwcd}</div>
                                  <div className="text-center text-[8px] font-semibold text-slate-700">{team.placementPoints}</div>
                                  <div className="text-center text-[8px] font-semibold text-slate-700">{team.elims}</div>
                                  <div className="pr-1 text-right text-[10px] font-black text-slate-900">{team.points}</div>
                                  <div className="pr-1 text-right text-[9px] font-black text-[#0d4ea0]">
                                    {latestCompletedMatch ? (team.matchCells[latestCompletedMatch.id]?.points ?? "-") : "-"}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="relative -top-[2px] mt-2 flex flex-wrap items-center justify-center gap-2 text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          <div className="flex items-center gap-1.5 leading-none">
                            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#1bb14a]" />
                            <span>Promotion</span>
                          </div>
                          <div className="flex items-center gap-1.5 leading-none">
                            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#175aa8]" />
                            <span>Safe Zone</span>
                          </div>
                          <div className="flex items-center gap-1.5 leading-none">
                            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#d93045]" />
                            <span>Relegation</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={`day-${featuredTournament?.id || "board"}-${stageBoard.featuredStage || "stage"}`} ref={snapshotRef} className="relative aspect-[4/5] w-[620px] overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,_#0b58aa_0%,_#0a4280_36%,_#0a3669_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,_#0b58aa_0%,_#0a4280_36%,_#0a3669_100%)]" />
                  <div className="absolute inset-0 opacity-25 [background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.18)_0,rgba(255,255,255,0.18)_2px,transparent_2px,transparent_12px)]" />
                  <div className="absolute inset-0 overflow-hidden">
                    <div
                      className={`relative z-10 h-full ${isDenseDaySnapshot ? "p-3.5" : "p-4"}`}
                      style={{
                        transform: `scale(${daySnapshotScale})`,
                        transformOrigin: "top left",
                        width: `${100 / daySnapshotScale}%`,
                        height: `${100 / daySnapshotScale}%`,
                      }}
                    >
                      <div className={`flex h-full flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_20px_40px_rgba(5,24,55,0.22)] ${isDenseDaySnapshot ? "px-4 py-4" : "px-5 py-5"}`}>
                        <div className="flex items-start justify-between gap-3 rounded-[22px] bg-[linear-gradient(180deg,_#0e4a95_0%,_#0b3971_100%)] px-4 py-4 text-white">
                          <div>
                            <p className="text-[9px] uppercase tracking-[0.28em] text-white/70">{featuredTournament?.name || "Tournament"}</p>
                            <p className={`mt-1.5 font-black uppercase tracking-[-0.06em] text-white ${isDenseDaySnapshot ? "text-[32px]" : "text-[38px]"}`}>Standings</p>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">{snapshotStageLabel} • {snapshotStandings.length} teams</p>
                          </div>
                          <div className="min-w-[76px] rounded-2xl bg-white/12 px-3 py-2 text-right text-white">
                            <p className="text-[9px] uppercase tracking-[0.18em] text-white/60">Board</p>
                            <p className="mt-1 text-sm font-black leading-none">{featuredTournament?.status === "completed" ? "Final" : featuredTournament?.status === "ongoing" ? "Live" : "Ready"}</p>
                          </div>
                        </div>
                        <div className={`mt-4 rounded-[18px] border border-slate-200 bg-slate-50/95 ${isDenseDaySnapshot ? "px-3 py-2.5" : "px-4 py-3"}`}>
                          <div className={`grid items-center gap-x-1 gap-y-2 font-bold uppercase text-slate-600 ${isDenseDaySnapshot ? "text-[9px] tracking-[0.12em]" : "text-[11px] tracking-[0.16em]"} ${daySnapshotGridClass}`}>
                            <span className="-ml-[1px] text-center">#</span>
                            <span />
                            <span className="pl-0.5 text-left">Team</span>
                            {shouldShowSnapshotGroupColumn ? <span className="text-center">Grp</span> : null}
                            <span className="text-center">M</span>
                            <span className="text-center">W</span>
                            <span className="text-center">P</span>
                            <span className="text-center">F</span>
                            <span className="pr-1 text-right">Total</span>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-1 flex-col justify-between">
                          {snapshotStandings.map((team, index) => (
                            <div key={`feed-${team.teamId || team.teamName}`} className={`grid items-center gap-x-1 gap-y-2 rounded-[16px] border-b border-slate-200/90 last:border-b-0 ${isDenseDaySnapshot ? "min-h-[38px] px-1.5 py-1.5 text-[12px]" : "min-h-[46px] px-2 py-2 text-sm"} ${daySnapshotGridClass}`}>
                              <div className={`relative inline-flex self-center rounded-full ${isDenseDaySnapshot ? "h-6 w-6" : "h-8 w-8"} ${index < 4 ? "bg-[#17b348] text-white" : index >= Math.max(snapshotStandings.length - 4, 12) ? "bg-[#d93045] text-white" : "bg-[#185eb1] text-white"}`}>
                                <span
                                  className={`absolute inset-0 flex items-center justify-center font-black leading-none tabular-nums ${isDenseDaySnapshot ? "text-[11px]" : "text-sm"}`}
                                  style={{ transform: "translateY(-5.5px)" }}
                                >
                                  {team.rank}
                                </span>
                              </div>
                              <div className={isDenseDaySnapshot ? "relative top-px flex h-4 w-4 self-center items-center justify-center" : "relative top-px flex h-[18px] w-[18px] self-center items-center justify-center"}>
                                <TeamIdentity
                                  name={team.logoName || team.teamName}
                                  compact
                                  plain
                                  hideText
                                  containerClassName="justify-center"
                                  logoClassName={isDenseDaySnapshot ? "h-4 w-4 shrink-0 object-contain" : "h-[18px] w-[18px] shrink-0 object-contain"}
                                />
                              </div>
                              <div className="relative -top-[5px] flex min-w-0 self-center items-center pl-0.5 pr-1">
                                <span className={`${isDenseDaySnapshot ? "text-[12px]" : "text-sm"} block min-w-0 whitespace-nowrap text-left font-semibold leading-[1.18] text-slate-900`}>
                                  {team.teamName}
                                </span>
                              </div>
                              {shouldShowSnapshotGroupColumn ? <div className="relative -top-[5px] self-center text-center font-medium text-slate-700">{team.group || "-"}</div> : null}
                              <div className="relative -top-[5px] self-center text-center font-medium text-slate-700">{team.matches}</div>
                              <div className="relative -top-[5px] self-center text-center font-medium text-slate-700">{team.wwcd}</div>
                              <div className="relative -top-[5px] self-center text-center font-medium text-slate-700">{team.placementPoints}</div>
                              <div className="relative -top-[5px] self-center text-center font-medium text-slate-700">{team.elims}</div>
                              <div className={`relative -top-[5px] self-center pr-1 text-right font-black text-slate-900 ${isDenseDaySnapshot ? "text-[18px]" : "text-2xl"}`}>{team.points}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 border-t border-[#d6e0ee] pt-2">
                          <div className="relative -top-[2px] flex flex-wrap items-center justify-center gap-3 text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            <div className="flex items-center gap-1.5 leading-none">
                              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#17b348]" />
                              <span>Promotion</span>
                            </div>
                            <div className="flex items-center gap-1.5 leading-none">
                              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#185eb1]" />
                              <span>Safe Zone</span>
                            </div>
                            <div className="flex items-center gap-1.5 leading-none">
                              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#d93045]" />
                              <span>Relegation</span>
                            </div>
                          </div>
                          <div className="mt-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                            Official standings snapshot
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}














