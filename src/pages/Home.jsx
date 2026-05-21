import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Asterisk,
  CalendarDays,
  ChevronRight,
  Clock3,
  Newspaper,
  Play,
  Radio,
  Swords,
  Target,
  Trophy,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import StatusBadge from "../components/shared/StatusBadge";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import TeamIdentity from "../components/shared/TeamIdentity";
import LogoBlock from "../components/shared/LogoBlock";
import { getTeamLogoByName, getTeamLogoSurfaceTone } from "@/lib/teamLogos";
import {
  getOrganizationMeta,
  isOrganizationHidden,
} from "@/lib/organizationIdentity";
import { useMinimumLoader } from "@/lib/useMinimumLoader";
import { filterPublishedMatchResults } from "@/lib/matchResultPublication";
import { resolveTournamentLiveState } from "@/lib/tournamentLiveState";
import { buildFanHubLink } from "@/lib/fanNavigation";
import { useIsMobile } from "@/hooks/use-mobile";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: "easeOut" },
});

const staggerGroup = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const riseItem = {
  initial: { opacity: 0, y: 22, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] },
};

const CURRENT_CIRCUIT_PATTERNS = [/2026/i, /bmps/i, /bgis/i];

const HOME_STAGE_STATUS_STYLES = {
  completed:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  current:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  live: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
  upcoming:
    "border-slate-300/80 bg-background/90 text-muted-foreground dark:border-slate-700 dark:bg-slate-900/50",
};

function isCurrentCircuitArticle(article) {
  const text = `${article?.title || ""} ${article?.content || ""}`.toLowerCase();
  return CURRENT_CIRCUIT_PATTERNS.some((pattern) => pattern.test(text));
}

function aggregateTournamentStandings(results, teamsMap, { includeHidden = false } = {}) {
  const standings = {};

  results.forEach((result) => {
    const team = teamsMap[result.team_id];
    if (!team) return;

    const meta = getOrganizationMeta(team);
    if (!includeHidden && isOrganizationHidden(meta.name)) return;

    if (!standings[meta.key]) {
      standings[meta.key] = {
        teamKey: meta.key,
        rawTeamName: team.name,
        teamName: meta.name,
        totalPoints: 0,
        wins: 0,
      };
    }

    standings[meta.key].totalPoints += result.total_points || 0;
    standings[meta.key].wins +=
      result.wins_count || (result.placement === 1 ? 1 : 0);
  });

  return Object.values(standings).sort(
    (a, b) => b.totalPoints - a.totalPoints || b.wins - a.wins
  );
}

function getTournamentLogo(tournament) {
  if (!tournament?.name) return null;
  if (tournament.name === "Battlegrounds Mobile India Series 2026") return "/images/bgis-logo.png";
  if (tournament.name === "Battlegrounds Mobile India Series 2023") return "/images/bgis-2023.png";
  if (tournament.name === "Battlegrounds Mobile India Series 2024") return "/images/bgis-2024.png";
  if (tournament.name === "Battlegrounds Mobile India Series 2025") return "/images/bgis-2025.png";
  if (tournament.name === "India - Korea Invitational") return "/images/in-kr.png";
  if (tournament.name === "Battlegrounds Mobile India Showdown 2025") return "/images/bmsd-2025.png";
  if (tournament.name === "Battlegrounds Mobile India International Cup 2025") return "/images/bmic-2025.png";
  if (tournament.name === "Battlegrounds Mobile India Pro Series 2023") return "/images/bmps-2023.png";
  if (tournament.name === "Battlegrounds Mobile India Pro Series 2024") return "/images/bmps-2024.png";
  if (tournament.name === "Battlegrounds Mobile India Pro Series 2025") return "/images/bmps-2025.png";
  if (tournament.name === "Battlegrounds Mobile India Pro Series 2026") return "/images/bmps-2026.png";
  return null;
}

function getTournamentChampionFromStages(tournament) {
  const stages = Array.isArray(tournament?.stages) ? tournament.stages : [];
  const finalsStage =
    stages.find((stage) => stage?.name === "Grand Finals" && Array.isArray(stage?.standings) && stage.standings.length > 0) ||
    [...stages]
      .reverse()
      .find((stage) => Array.isArray(stage?.standings) && stage.standings.length > 0);

  if (!finalsStage) return null;

  const championEntry =
    [...finalsStage.standings]
      .sort((a, b) => (a?.placement ?? 999) - (b?.placement ?? 999))[0] || null;

  if (!championEntry) return null;

  const rawName = championEntry.fullTeam || championEntry.team || "";
  const meta = getOrganizationMeta(rawName);

  return {
    teamKey: meta.key,
    rawTeamName: rawName,
    teamName: meta.name,
    totalPoints: championEntry.points || 0,
    wins: championEntry.wwcd || 0,
  };
}

function buildTournamentStageLink(tournamentId, stageName) {
  if (!tournamentId) return "/tournaments";
  const base = `/tournaments?id=${encodeURIComponent(tournamentId)}`;
  return stageName ? `${base}&stage=${encodeURIComponent(stageName)}` : base;
}

function LightPanel({ className = "", children }) {
  return (
    <div
      className={`rounded-[28px] border border-border/70 bg-card shadow-[0_20px_60px_rgba(15,23,42,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const isMobile = useIsMobile();
  const { data: tournaments = [], isLoading: loadT } = useQuery({
    queryKey: ["tournaments"],
    queryFn: () => base44.entities.Tournament.list("-created_date", 100),
  });
  const { data: teams = [], isLoading: loadTeams } = useQuery({
    queryKey: ["teams"],
    queryFn: () => base44.entities.Team.list("-total_points", 400),
  });
  const { data: matches = [], isLoading: loadM } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list("-scheduled_time", 120),
  });
  const { data: rawResults = [], isLoading: loadResults } = useQuery({
    queryKey: ["results"],
    queryFn: () => base44.entities.MatchResult.list("-created_date", 5000),
  });
  const results = React.useMemo(() => filterPublishedMatchResults(rawResults), [rawResults]);
  const { data: news = [] } = useQuery({
    queryKey: ["news"],
    queryFn: () => base44.entities.NewsArticle.list("-created_date", 100),
  });

  const loaderState = useMinimumLoader(
    loadT || loadTeams || loadM || loadResults,
    3200
  );

  const liveState = React.useMemo(
    () =>
      resolveTournamentLiveState({
        tournaments,
        teams,
        matches,
        matchResults: results,
      }),
    [matches, results, teams, tournaments]
  );
  const {
    calendarMatches,
    calendarTournaments,
    featuredTournament,
    featuredParticipantEntries,
    stageBoard: featuredTournamentBoard,
  } = liveState;

  const liveMatches = calendarMatches.filter((m) => m.status === "live");
  const ongoingTournaments = calendarTournaments.filter((t) => t.status === "ongoing");
  const upcomingTournaments = calendarTournaments.filter((t) => t.status === "upcoming");
  const completedTournaments = calendarTournaments
    .filter((t) => t.status === "completed")
    .sort(
      (a, b) =>
        new Date(b.end_date || b.updated_date || b.created_date).getTime() -
        new Date(a.end_date || a.updated_date || a.created_date).getTime()
    );
  const upcomingMatches = calendarMatches.filter((m) => m.status === "scheduled").slice(0, 4);
  const currentCircuitNews = news.filter(isCurrentCircuitArticle);
  const featuredNews = currentCircuitNews[0] || news[0];
  const latestNews = (currentCircuitNews.length > 0 ? currentCircuitNews : news).slice(
    0,
    3
  );
  const lastTournament = completedTournaments[0];
  const teamsMap = Object.fromEntries(teams.map((team) => [team.id, team]));
  const lastTournamentResults = lastTournament
    ? results.filter((result) => result.tournament_id === lastTournament.id)
    : [];
  const lastTournamentStandings = aggregateTournamentStandings(
    lastTournamentResults,
    teamsMap,
    {
      includeHidden: true,
    }
  );
  const championTeam =
    getTournamentChampionFromStages(lastTournament) || lastTournamentStandings[0];
  const championLogo = championTeam?.rawTeamName
    ? getTeamLogoByName(championTeam.rawTeamName)
    : null;
  const championLogoSurfaceTone = championTeam?.rawTeamName
    ? getTeamLogoSurfaceTone(championTeam.rawTeamName)
    : "light";
  if (loaderState.showLoader) {
    return <LoadingSpinner isExiting={loaderState.isExiting} />;
  }

  const featuredTournamentStandings = featuredTournamentBoard.standings.map((entry) => ({
    teamKey: entry.teamId || entry.teamName,
    rawTeamName: entry.logoName || entry.teamName,
    teamName: entry.teamName,
    totalPoints: entry.points || 0,
    wins: entry.wwcd || 0,
    group: entry.group || "-",
    stage: featuredTournamentBoard.featuredStage || null,
  }));
  const prioritizeCurrentTournamentBoard = Boolean(
    featuredTournament && featuredTournament.status !== "completed"
  );
  const homeBoardSource =
    featuredTournamentStandings.length > 0
      ? featuredTournamentStandings
      : prioritizeCurrentTournamentBoard
        ? []
        : lastTournamentStandings;
  const homeBoard = homeBoardSource.slice(0, 5).map((team, index) => ({
    rank: index + 1,
    teamName: team.teamName,
    logoName: team.rawTeamName || team.teamName,
    status:
      featuredTournamentStandings.length > 0
        ? featuredTournament?.status === "ongoing"
          ? "Live"
          : "Current"
        : "Completed",
    wwcd: team.wins,
    points: team.totalPoints || 0,
    group: team.group || "-",
  }));
  const boardHeadline = prioritizeCurrentTournamentBoard
    ? featuredTournament?.status === "ongoing"
      ? "Live tournament board."
      : "Current tournament board."
    : lastTournament
      ? "Latest completed board."
      : "Tournament board pending.";
  const boardEyebrow = prioritizeCurrentTournamentBoard
    ? "Tournament board"
    : "Recent event";
  const boardTournament = prioritizeCurrentTournamentBoard
    ? featuredTournament
    : lastTournament;
  const boardLink = boardTournament
    ? `/tournaments?id=${encodeURIComponent(boardTournament.id)}`
    : "/tournaments";
  const heroMeta = [
    featuredTournament?.name ? `${featuredTournament.name} in focus` : null,
    featuredTournament?.start_date
      ? `Starts ${format(new Date(featuredTournament.start_date), "MMM d, yyyy")}`
      : null,
    featuredNews?.title ? "Fresh circuit story live" : null,
  ].filter(Boolean);
  const featuredTournamentCalendar = new Map(
    (featuredTournament?.calendar || []).map((item) => [item.label, item.week])
  );
  const featuredStageOrder = new Map(
    (featuredTournament?.stages || [])
      .filter((stage) => stage?.name)
      .map((stage, index) => [stage.name, index])
  );
  const focusedStageIndex = featuredStageOrder.has(featuredTournamentBoard.featuredStage)
    ? featuredStageOrder.get(featuredTournamentBoard.featuredStage)
    : -1;
  const featuredStages = (() => {
    return (featuredTournament?.stages || [])
      .filter((stage) => stage?.name)
      .map((stage, index) => ({
        key: `${stage.name}-${index}`,
        name: stage.name,
        week: featuredTournamentCalendar.get(stage.name) || null,
        teamCount: stage.teamCount ?? stage.standings?.length ?? null,
        status:
          focusedStageIndex >= 0
            ? index < focusedStageIndex
              ? "completed"
              : index === focusedStageIndex
                ? featuredTournamentBoard.liveMatch
                  ? "live"
                  : featuredTournament?.status === "ongoing"
                    ? "current"
                    : "upcoming"
                : "upcoming"
            : stage.status || null,
      }));
  })();
  const featuredSpotlightStage =
    featuredStages.find((stage) => stage.status === "live" || stage.status === "current") ||
    featuredStages[0] ||
    null;
  const featuredTournamentFacts = [
    {
      label: "Game",
      value: featuredTournament?.game || "Multiple titles",
    },
    {
      label: "Window",
      value:
        featuredTournament?.start_date && featuredTournament?.end_date
          ? `${format(new Date(featuredTournament.start_date), "MMM d")} - ${format(new Date(featuredTournament.end_date), "MMM d, yyyy")}`
          : "Calendar pending",
    },
    {
      label: "Prize pool",
      value: featuredTournament?.prize_pool || "TBA",
    },
    {
      label: "Field",
      value: featuredTournament?.max_teams
        ? `${featuredTournament.max_teams} teams`
        : featuredParticipantEntries.length > 0
          ? `${featuredParticipantEntries.length} teams`
          : "Field locking",
    },
  ];
  const featuredTournamentLink = buildTournamentStageLink(featuredTournament?.id);
  const featuredCurrentStageLink = buildTournamentStageLink(
    featuredTournament?.id,
    featuredSpotlightStage?.name || null
  );

  const stackedLinks = [
    {
      title: "Tournaments",
      desc: "Every major event, stage path, and prize chase in one bracket view.",
      icon: Trophy,
      link: "/tournaments",
      desktopPose: "xl:right-[19.5rem] xl:bottom-0 xl:-rotate-[14deg]",
    },
    {
      title: "Teams",
      desc: "Roster moves, title history, and organization profiles in one place.",
      icon: Users,
      link: "/teams",
      desktopPose: "xl:right-[13rem] xl:bottom-2 xl:-rotate-[9deg]",
    },
    {
      title: "Fans",
      desc: "Predictions, polls, chat, and community energy around every matchday.",
      icon: Swords,
      link: buildFanHubLink({
        tournamentId: featuredTournament?.id,
        stage: featuredTournamentBoard.featuredStage || "",
      }),
      desktopPose: "xl:right-[6.5rem] xl:bottom-4 xl:-rotate-[2deg]",
    },
    {
      title: "News Desk",
      desc: "Roster moves, result drops, and quick editorial updates.",
      icon: Newspaper,
      link: "/news",
      desktopPose: "xl:right-0 xl:bottom-6 xl:rotate-[6deg]",
    },
  ];

  const tickerItems = [
    featuredTournament?.name || "Main event locked",
    `${liveMatches.length} live match${liveMatches.length === 1 ? "" : "es"} on radar`,
    championTeam?.teamName
      ? `${championTeam.teamName} champions of BGIS 2026`
      : "BGIS 2026 champion locked",
    featuredNews?.title || "News desk ready for drops",
  ];
  const nextMatch = upcomingMatches[0] || null;
  const fanHubLink = buildFanHubLink({
    tournamentId: featuredTournament?.id,
    stage: featuredTournamentBoard.featuredStage || "",
  });
  const featuredTournamentVisual =
    featuredTournament?.banner_url ||
    getTournamentLogo(featuredTournament) ||
    championLogo ||
    "/images/core-logo.png";
  const mobileBoardLeaders = homeBoard.slice(0, 3);
  const mobileQuickActions = [
    {
      title: "Live board",
      detail: boardTournament?.name || "Tournament standings",
      icon: TrendingUp,
      link: boardLink,
    },
    {
      title: "Fan hub",
      detail: "Polls, predictions, chat",
      icon: Swords,
      link: fanHubLink,
    },
    {
      title: "Events",
      detail: `${calendarTournaments.length} tournaments tracked`,
      icon: Trophy,
      link: "/tournaments",
    },
    {
      title: "News",
      detail: "Roster and result drops",
      icon: Newspaper,
      link: "/news",
    },
  ];
  const mobilePulseCards = [
    {
      label: "Live matches",
      value: String(liveMatches.length),
      tone: "border-white/10 bg-white/8 text-white",
    },
    {
      label: "Upcoming",
      value: String(upcomingMatches.length),
      tone: "border-white/10 bg-white/8 text-white",
    },
    {
      label: "News drops",
      value: String(latestNews.length),
      tone: "border-white/10 bg-white/8 text-white",
    },
  ];

  if (isMobile) {
    return (
      <div className="mx-auto max-w-[420px] space-y-4 pb-4">
        <motion.section {...fadeUp(0)}>
          <div className="relative overflow-hidden rounded-[2.15rem] border border-white/10 bg-[linear-gradient(180deg,rgba(4,10,26,0.98),rgba(10,18,42,0.97)_58%,rgba(18,55,126,0.9))] p-4 text-white shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(96,165,250,0.2),transparent_24%),radial-gradient(circle_at_80%_16%,rgba(255,255,255,0.08),transparent_12%),linear-gradient(180deg,transparent_40%,rgba(255,255,255,0.06)_100%)]" />
            <div className="relative mx-auto mb-4 h-1.5 w-20 rounded-full bg-white/40" />

            <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur">
              <div
                className="absolute inset-y-0 right-0 w-[52%] bg-cover bg-center opacity-75"
                style={{ backgroundImage: `linear-gradient(270deg, rgba(4,10,26,0.12), rgba(4,10,26,0.92) 78%), url('${featuredTournamentVisual}')` }}
              />
              <div className="relative flex min-h-[230px] flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-sky-200/90">
                      Matchday Central
                    </p>
                    <h1 className="mt-2 max-w-[10ch] text-[2.05rem] font-black leading-[0.88] tracking-[-0.06em] text-white">
                      Own the next drop.
                    </h1>
                  </div>
                  <div className="rounded-full border border-red-400/20 bg-red-500/16 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-red-100 backdrop-blur">
                    {liveMatches.length > 0 ? "Live" : featuredTournament?.status || "Ready"}
                  </div>
                </div>

                <div className="relative max-w-[58%]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/54">
                    Featured Event
                  </p>
                  <p className="mt-2 text-[1.2rem] font-black leading-tight tracking-[-0.04em] text-white">
                    {featuredTournament?.name || "Tournament spotlight"}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-white/64">
                    {featuredSpotlightStage?.name || "Stage pending"}
                    {featuredSpotlightStage?.week ? ` • ${featuredSpotlightStage.week}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={featuredTournamentLink}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-slate-950 shadow-[0_12px_24px_rgba(255,255,255,0.16)]"
                  >
                    Open Event <Play className="h-3.5 w-3.5 fill-current" />
                  </Link>
                  <Link
                    to={boardLink}
                    className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white/92"
                  >
                    Board <TrendingUp className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {mobilePulseCards.map((card) => (
                <div
                  key={card.label}
                  className={`rounded-[1.35rem] border px-3 py-3 backdrop-blur ${card.tone}`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
                    {card.label}
                  </p>
                  <p className="mt-2 text-2xl font-black leading-none tracking-[-0.05em] text-white">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {mobileQuickActions.map((action) => (
                <Link
                  key={action.title}
                  to={action.link}
                  className="flex min-h-[104px] flex-col items-start justify-between rounded-[1.45rem] border border-white/10 bg-white/8 px-3.5 py-3.5 shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur"
                >
                  <div className="flex w-full items-start justify-between gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/14 text-white">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/44" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black uppercase tracking-[0.01em] text-white">
                      {action.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-white/58">
                      {action.detail}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {mobileBoardLeaders.length > 0 ? (
              <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.05))] p-3.5 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/52">
                      Top Board
                    </p>
                    <p className="mt-1 text-sm font-black uppercase tracking-[0.01em] text-white">
                      Season Leaders
                    </p>
                  </div>
                  <Link to={boardLink} className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-200">
                    View all
                  </Link>
                </div>
                <div className="mt-3 grid gap-2.5">
                  {mobileBoardLeaders.map((team) => (
                    <div
                      key={`${team.rank}-${team.teamName}`}
                      className="flex items-center gap-3 rounded-[1.2rem] border border-white/8 bg-black/12 px-3 py-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-white/10 text-sm font-black text-white">
                        {team.rank}
                      </div>
                      <div className="min-w-0 flex-1">
                        <TeamIdentity
                          name={team.logoName || team.teamName}
                          className="truncate text-sm font-black uppercase tracking-[0.01em] text-white"
                        />
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/48">
                          {team.wwcd} WWCD
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black leading-none tracking-[-0.04em] text-white">
                          {team.points}
                        </p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
                          pts
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </motion.section>

        <motion.section {...fadeUp(0.08)}>
          <div className="grid gap-3">
            <div className="rounded-[1.7rem] border border-border/70 bg-card p-4 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                    Next Match
                  </p>
                  <p className="mt-2 text-lg font-black uppercase leading-tight tracking-[-0.04em] text-foreground">
                    {nextMatch
                      ? `${nextMatch.stage || "Stage"} - Match ${nextMatch.match_number || "-"}`
                      : "Schedule locking in"}
                  </p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Clock3 className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {nextMatch?.scheduled_time
                  ? format(new Date(nextMatch.scheduled_time), "MMM d, h:mm a")
                  : "The next lobby time will appear here."}
                {nextMatch?.map ? ` • ${nextMatch.map}` : ""}
              </p>
            </div>

            <div className="rounded-[1.7rem] border border-border/70 bg-card p-4 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                    Fan Pulse
                  </p>
                  <p className="mt-2 text-lg font-black uppercase leading-tight tracking-[-0.04em] text-foreground">
                    Predictions, polls, and live chat.
                  </p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Swords className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Jump into community picks and matchday energy without leaving the app flow.
              </p>
              <Link
                to={fanHubLink}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-primary-foreground"
              >
                Open fan hub <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="rounded-[1.7rem] border border-border/70 bg-card p-4 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                    Headline Drop
                  </p>
                  <p className="mt-2 text-lg font-black uppercase leading-tight tracking-[-0.04em] text-foreground">
                    {featuredNews?.title || "News desk standing by"}
                  </p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CalendarDays className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {featuredNews?.created_date
                  ? format(new Date(featuredNews.created_date), "MMM d, yyyy")
                  : "Open the news desk for the latest circuit update."}
              </p>
              <Link
                to={featuredNews ? `/news/${featuredNews.id}` : "/news"}
                className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-primary"
              >
                Read story <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    );
  }

  return (
      <div className="mx-auto max-w-[1380px] space-y-6 pb-4 md:space-y-8 md:pb-6">
        <motion.section {...fadeUp(0)}>
          <div className="relative overflow-hidden rounded-[28px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,243,235,0.96))] shadow-[0_28px_70px_rgba(15,23,42,0.08)] md:rounded-[36px] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(17,24,39,0.96))]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.14),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(251,191,36,0.12),transparent_18%)]" />

            <div className="relative grid gap-5 px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:grid-cols-[1.02fr_0.98fr] lg:px-10 lg:py-10">
              <div className="space-y-6 md:space-y-7">
                <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-foreground/62">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-3 py-1 shadow-sm">
                    <Radio className="h-3.5 w-3.5 text-primary" />
                    Matchday command
                  </span>
                  <span className="inline-flex items-center gap-2 text-primary">
                    <Asterisk className="h-3.5 w-3.5" />
                    Built for season control
                  </span>
                </div>

                <div className="space-y-4 md:space-y-5">
                  <p className="max-w-28 text-[10px] font-semibold uppercase tracking-[0.38em] text-foreground/42">
                    Daily esports index
                  </p>
                  <h1 className="max-w-5xl text-[2.3rem] font-black uppercase leading-[0.9] tracking-[-0.06em] text-foreground sm:text-[2.85rem] md:text-[4.5rem] lg:text-[5.6rem]">
                    Control the season before the lobby drops.
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-[15px]">
                    A cleaner esports front page for tracking the main event,
                    tournament boards, team movement, and fresh stories without
                    repeating the same tournament block over and over.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    to="/tournaments"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-primary-foreground transition-transform hover:-translate-y-0.5 sm:w-auto"
                  >
                    Explore events <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to={boardLink}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border/80 bg-card px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-secondary sm:w-auto"
                  >
                    Open tournament board <TrendingUp className="h-4 w-4" />
                  </Link>
                </div>

                {heroMeta.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    {heroMeta.map((item, index) => (
                      <React.Fragment key={item}>
                        {index > 0 ? (
                          <span className="text-muted-foreground/50">&bull;</span>
                        ) : null}
                        <span>{item}</span>
                      </React.Fragment>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="relative min-h-[320px] md:min-h-[360px]">
                <div className="grid h-full gap-4 lg:grid-rows-[1fr_auto]">
                  <div className="relative min-h-[260px] rounded-[24px] border border-[#3b3022] bg-[linear-gradient(135deg,rgba(14,14,16,1),rgba(24,24,27,0.98)_54%,rgba(47,31,17,0.95)_100%)] p-4 text-white shadow-[0_26px_70px_rgba(0,0,0,0.24)] md:min-h-[280px] md:rounded-[30px] md:p-5">
                    <div className="absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.22),transparent_28%),radial-gradient(circle_at_84%_22%,rgba(255,255,255,0.08),transparent_18%)] md:rounded-[30px]" />
                    {championTeam?.teamName ? (
                      <div className="pointer-events-none absolute inset-y-6 right-6 hidden items-center justify-end lg:flex">
                        <div className="opacity-[0.12] saturate-0">
                          {championLogo ? (
                            <LogoBlock
                              src={championLogo}
                              alt={`${championTeam.teamName} logo`}
                              sizeClass="h-48 w-48"
                              roundedClass="rounded-[2rem]"
                              paddingClass="p-5"
                              surfaceTone={championLogoSurfaceTone}
                              className="border-white/10 bg-white/5"
                            />
                          ) : (
                            <TeamIdentity
                              name={championTeam.rawTeamName || championTeam.teamName}
                              hideText
                              contained
                              logoClassName="h-40 w-auto object-contain"
                            />
                          )}
                        </div>
                      </div>
                    ) : null}
                    <div className="relative flex h-full flex-col justify-between">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.22em] text-white/50">
                            Last tournament highlight
                          </p>
                          <Link
                            to={lastTournament ? `/tournaments?id=${lastTournament.id}` : "/tournaments"}
                            className="mt-3 block max-w-[13ch] text-[1.75rem] font-black uppercase leading-[0.92] tracking-[-0.05em] transition-opacity hover:opacity-80 md:text-[2rem]"
                          >
                            {lastTournament?.name || "Latest completed tournament"}
                          </Link>
                          <p className="mt-3 max-w-[34ch] text-sm leading-7 text-white/66">
                            {championTeam?.teamName
                              ? `${championTeam.teamName} closed the event as champions in the latest finished tournament.`
                              : "The most recent completed tournament highlight will appear here."}
                          </p>
                        </div>
                        {lastTournament?.status ? (
                          <StatusBadge status={lastTournament.status} />
                        ) : null}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <Link
                          to={lastTournament ? `/tournaments?id=${lastTournament.id}` : "/tournaments"}
                          className="rounded-[22px] border border-white/10 bg-white/6 p-4 transition-colors hover:bg-white/10"
                        >
                          <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                            Champion
                          </p>
                          <p className="mt-2 text-sm font-bold text-white">
                            {championTeam?.teamName || "TBD"}
                          </p>
                        </Link>
                        <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                            Total points
                          </p>
                          <p className="mt-2 text-sm font-bold text-white">
                            {championTeam?.totalPoints || 0}
                          </p>
                        </div>
                        <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                            WWCD
                          </p>
                          <p className="mt-2 text-sm font-bold text-white">
                            {championTeam?.wins || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <motion.div
                    variants={staggerGroup}
                    initial="initial"
                    animate="animate"
                    className="flex flex-col gap-4 xl:min-h-[340px] xl:block"
                  >
                    {stackedLinks.map((card, idx) => (
                      <motion.div
                        key={card.title}
                        variants={riseItem}
                        style={{ zIndex: 10 + idx }}
                      >
                        <Link
                          to={card.link}
                          className={`relative block w-full rounded-[24px] border border-border/80 bg-card p-4 text-foreground shadow-[0_18px_44px_rgba(15,23,42,0.1)] transition-transform duration-300 hover:z-30 hover:-translate-y-1 hover:scale-[1.02] sm:rounded-[28px] sm:p-5 xl:absolute xl:w-[17.5rem] xl:origin-bottom-right ${card.desktopPose}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                              <card.icon className="h-5 w-5 text-primary" />
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p className="mt-8 text-xl font-black uppercase tracking-[-0.04em] sm:mt-12 sm:text-2xl">
                            {card.title}
                          </p>
                          <p className="mt-3 max-w-[24ch] text-sm leading-7 text-muted-foreground xl:text-[13px] xl:leading-6">
                            {card.desc}
                          </p>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section {...fadeUp(0.06)} className={isMobile ? "hidden md:block" : ""}>
          <div className="ticker-shell rounded-[24px] border border-border/70 bg-card px-0 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:rounded-full">
            <div className="ticker-track">
              {[...tickerItems, ...tickerItems].map((item, idx) => (
                <div
                  key={`${item}-${idx}`}
                  className="inline-flex items-center gap-4 px-6 text-[11px] font-bold uppercase tracking-[0.28em] text-foreground/76"
                >
                  <Asterisk className="h-3.5 w-3.5 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div {...fadeUp(0.1)}>
              <LightPanel className="h-full p-4 transition-transform duration-300 hover:-translate-y-1 sm:p-5 md:p-7">
                <div className="space-y-5">
                  <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
                            Main event
                          </span>
                          {featuredTournament?.status ? (
                            <StatusBadge status={featuredTournament.status} />
                          ) : null}
                        </div>
                        <Link to={featuredTournamentLink} className="inline-block">
                          <h2 className="mt-4 max-w-3xl text-[1.9rem] font-black uppercase leading-[0.94] tracking-[-0.05em] text-foreground transition-colors hover:text-primary sm:text-[2.3rem] lg:text-[2.8rem]">
                            {featuredTournament?.name || "Tournament spotlight"}
                          </h2>
                        </Link>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-[15px]">
                          {featuredTournament?.description ||
                            "Create tournaments and the dashboard will promote the current headline event automatically."}
                        </p>
                      </div>
                      <Asterisk className="mt-1 hidden h-6 w-6 text-primary md:block" />
                    </div>

                    <Link
                      to={featuredCurrentStageLink}
                      className="block rounded-[22px] border border-border/70 bg-[linear-gradient(135deg,rgba(251,146,60,0.08),rgba(255,255,255,0.98))] px-4 py-4 transition-transform hover:-translate-y-0.5 dark:bg-[linear-gradient(135deg,rgba(251,146,60,0.12),rgba(15,23,42,0.9))] sm:px-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                            Current stage
                          </p>
                          <h3 className="mt-1.5 text-xl font-black uppercase tracking-[-0.04em] text-foreground sm:text-2xl">
                            {featuredSpotlightStage?.name || "Stage pending"}
                          </h3>
                        </div>
                        {featuredSpotlightStage?.status ? (
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
                              HOME_STAGE_STATUS_STYLES[featuredSpotlightStage.status] ||
                              HOME_STAGE_STATUS_STYLES.upcoming
                            }`}
                          >
                            {featuredSpotlightStage.status}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-4 rounded-[18px] border border-primary/10 bg-background/75 px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                          {featuredSpotlightStage?.week || "Schedule window pending"}
                        </p>
                        <p className="mt-2 text-sm font-black uppercase tracking-[0.01em] text-foreground">
                          {featuredSpotlightStage?.teamCount ? `${featuredSpotlightStage.teamCount} teams in play` : "Field pending"}
                        </p>
                      </div>
                    </Link>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {featuredTournamentFacts.map((fact) => (
                      <div
                        key={fact.label}
                        className="rounded-[18px] border border-border/70 bg-secondary/30 px-4 py-3"
                      >
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          {fact.label}
                        </p>
                        <p className="mt-1.5 text-sm font-black uppercase tracking-[0.01em] text-foreground">
                          {fact.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.05)] sm:rounded-[28px] sm:p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          Tournament stages
                        </p>
                        <h3 className="mt-2 text-xl font-black uppercase leading-tight tracking-[-0.04em] text-foreground">
                          {featuredStages.length > 0
                            ? `${featuredStages.length} stages mapped`
                            : "Stage map pending"}
                        </h3>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Target className="h-5 w-5" />
                      </div>
                    </div>

                    {featuredStages.length > 0 ? (
                      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {featuredStages.map((stage, index) => {
                          const isSpotlight =
                            stage.name === featuredSpotlightStage?.name &&
                            stage.status === featuredSpotlightStage?.status;

                          return (
                            <Link
                              key={stage.key}
                              to={buildTournamentStageLink(
                                featuredTournament?.id,
                                stage.name
                              )}
                              className={`rounded-[18px] border px-4 py-3.5 transition-colors ${
                                isSpotlight
                                  ? "border-primary/25 bg-primary/10 shadow-[0_14px_32px_rgba(251,146,60,0.1)]"
                                  : "border-border/70 bg-secondary/20 hover:border-primary/20 hover:bg-secondary/35"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] text-sm font-black ${
                                    isSpotlight
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-primary/10 text-primary"
                                  }`}
                                >
                                  {index + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-black uppercase leading-tight tracking-[0.01em] text-foreground">
                                    {stage.name}
                                  </p>
                                  {stage.status ? (
                                    <span
                                      className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] ${
                                        HOME_STAGE_STATUS_STYLES[stage.status] ||
                                        HOME_STAGE_STATUS_STYLES.upcoming
                                      }`}
                                    >
                                      {stage.status}
                                    </span>
                                  ) : null}
                                  <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                                    <div>{stage.week || "Schedule window pending"}</div>
                                    {stage.teamCount ? <div className="mt-1">{stage.teamCount} teams</div> : null}
                                  </div>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">
                        Add tournament stages and the home page will show the full
                        stage path here.
                      </p>
                    )}
                  </div>
                </div>
              </LightPanel>
          </motion.div>

          <motion.div {...fadeUp(0.14)}>
            <LightPanel className="h-full p-4 sm:p-5 md:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                    {boardEyebrow}
                  </p>
                  <h2 className="mt-3 text-[1.85rem] font-black uppercase leading-none tracking-[-0.06em] text-foreground sm:text-3xl md:text-[3.15rem]">
                    {boardHeadline}
                  </h2>
                </div>
                <Link
                  to={boardLink}
                  className="hidden text-xs font-bold uppercase tracking-[0.18em] text-primary md:inline-flex"
                >
                  Open board
                </Link>
              </div>

              <div className="mt-6 space-y-3">
                {homeBoard.length > 0 ? (
                  homeBoard.map((team) => (
                    <motion.div
                      key={`${team.rank}-${team.teamName}`}
                      initial={{ opacity: 0, x: 18 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.45 }}
                      transition={{ duration: 0.42, ease: "easeOut" }}
                      whileHover={{ y: -3, transition: { duration: 0.18 } }}
                      className="flex items-center gap-3 rounded-[20px] border border-border/70 bg-background/70 px-3 py-3 sm:gap-4 sm:rounded-[24px] sm:px-4 sm:py-4"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-secondary text-sm font-black text-foreground sm:h-10 sm:w-10">
                        {team.rank}
                      </div>
                      <div className="min-w-0 flex-1">
                        <TeamIdentity
                          name={team.logoName || team.teamName}
                          className="truncate text-sm font-black uppercase tracking-[0.02em] text-foreground"
                        />
                        <div className="mt-1 flex items-center gap-2">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            {team.status}
                          </p>
                          <span className="text-[10px] text-muted-foreground">&bull;</span>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            {team.wwcd} WWCD
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black tracking-[-0.04em] text-primary sm:text-2xl">
                          {team.points || 0}
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          points
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-border/70 bg-background/70 px-4 py-5">
                    <p className="text-sm font-semibold text-foreground">
                      {featuredTournament?.status === "ongoing"
                        ? "Live tournament detected. Results are still syncing into the home board."
                        : "Current tournament selected. Standings will appear here once results land."}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {featuredTournamentBoard.featuredStage
                        ? `Stage focus: ${featuredTournamentBoard.featuredStage}. Open the tournament board for the full stage view.`
                        : "Open the tournament page to track the active stage and upcoming schedule."}
                    </p>
                  </div>
                )}
              </div>
            </LightPanel>
          </motion.div>
        </section>

        <section>
          <motion.div {...fadeUp(0.22)}>
            <div className="grid gap-4 md:grid-cols-2">
              <LightPanel className="p-4 sm:p-5 md:p-7">
                <div className="flex items-center justify-between">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                    Upcoming matches
                  </h2>
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    Up next
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  {upcomingMatches.length > 0 ? (
                    upcomingMatches.map((match) => (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.35 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        whileHover={{ y: -2, transition: { duration: 0.18 } }}
                        className="rounded-[22px] border border-border/70 bg-background/70 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                            <Swords className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black uppercase leading-tight tracking-[0.02em] text-foreground">
                              {match.stage} - Match {match.match_number || "-"}
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground">
                              {match.scheduled_time
                                ? format(new Date(match.scheduled_time), "MMM d, h:mm a")
                                : "TBD"}
                              {match.map ? (<><span className="px-1 text-muted-foreground/60">&bull;</span>{match.map}</>) : null}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="rounded-[22px] border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                      No upcoming matches right now.
                    </p>
                  )}
                </div>
              </LightPanel>

              <LightPanel className="p-4 sm:p-5 md:p-7">
                <div className="flex items-center justify-between">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                    Latest news
                  </h2>
                  <Link
                    to="/news"
                    className="text-xs font-bold uppercase tracking-[0.18em] text-primary"
                  >
                    All news
                  </Link>
                </div>
                <div className="mt-5 space-y-3">
                  {latestNews.length > 0 ? (
                    latestNews.map((article) => (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.35 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        whileHover={{ y: -2, transition: { duration: 0.18 } }}
                        className="rounded-[22px] border border-border/70 bg-background/70 p-4"
                      >
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                          {article.category?.replace("_", " ") || "Update"}
                        </p>
                        <p className="mt-2 text-sm font-black uppercase leading-6 tracking-[0.01em] text-foreground">
                          {article.title}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {article.created_date
                            ? format(new Date(article.created_date), "MMM d, yyyy")
                            : ""}
                        </p>
                      </motion.div>
                    ))
                  ) : (
                    <p className="rounded-[22px] border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                      No news yet.
                    </p>
                  )}
                </div>
              </LightPanel>
            </div>
          </motion.div>
        </section>
      </div>
  );
}

