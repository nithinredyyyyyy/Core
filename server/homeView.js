import { format } from "date-fns";
import {
  getTeamLogoByName,
  getTeamLogoSurfaceTone,
} from "../src/lib/teamLogos.js";
import { filterPublishedMatchResults } from "../src/lib/matchResultPublication.js";
import { resolveTournamentLiveState } from "../src/lib/tournamentLiveState.js";
import { isCurrentCircuitArticle } from "../src/lib/currentCircuit.js";
import {
  aggregateTournamentStandings,
  getTournamentChampionFromStages,
} from "../src/lib/homeContent.js";
import { getTournamentLogo } from "../src/lib/tournamentBranding.js";

function formatDateLabel(value, pattern) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : format(date, pattern);
}

function buildSharedHomeView({
  featuredTournament,
  featuredTournamentBoard,
  liveMatches,
  featuredNewsWithDate,
  featuredSpotlightStage,
  featuredTournamentVisual,
  boardTournamentId,
}) {
  return {
    featuredTournament,
    featuredTournamentBoard,
    liveMatches,
    featuredNews: featuredNewsWithDate,
    featuredSpotlightStage,
    featuredTournamentVisual,
    boardTournamentId,
  };
}

function buildMobileHomeView({
  shared,
  mobilePulseCards,
  mobileQuickActions,
  mobileBoardLeaders,
  nextMatch,
}) {
  return {
    ...shared,
    mobilePulseCards,
    mobileQuickActions,
    mobileBoardLeaders,
    nextMatch,
  };
}

function buildDesktopHomeView({
  shared,
  championTeam,
  championLogo,
  championLogoSurfaceTone,
  latestNews,
  lastTournament,
  heroMeta,
  featuredStages,
  featuredTournamentFacts,
  tickerItems,
  homeBoard,
  boardEyebrow,
  boardHeadline,
  upcomingMatches,
}) {
  return {
    ...shared,
    championTeam,
    championLogo,
    championLogoSurfaceTone,
    latestNews,
    lastTournament,
    heroMeta,
    featuredStages,
    featuredTournamentFacts,
    tickerItems,
    homeBoard,
    boardEyebrow,
    boardHeadline,
    upcomingMatches,
  };
}

export function buildHomeViewModel(summary, options = {}) {
  const mode = options.mode === "mobile" ? "mobile" : "desktop";
  const tournaments = summary?.tournaments || [];
  const teams = summary?.teams || [];
  const matches = summary?.matches || [];
  const rawResults = summary?.results || [];
  const news = summary?.news || [];
  const results = filterPublishedMatchResults(rawResults);

  const liveState = resolveTournamentLiveState({
    tournaments,
    teams,
    matches,
    matchResults: results,
  });

  const {
    calendarMatches,
    calendarTournaments,
    featuredTournament,
    featuredParticipantEntries,
    stageBoard: featuredTournamentBoard,
  } = liveState;

  const liveMatches = calendarMatches.filter(
    (match) => match.status === "live",
  );
  const completedTournaments = calendarTournaments
    .filter((tournament) => tournament.status === "completed")
    .sort(
      (left, right) =>
        new Date(
          right.end_date || right.updated_date || right.created_date,
        ).getTime() -
        new Date(
          left.end_date || left.updated_date || left.created_date,
        ).getTime(),
    );
  const upcomingMatches = calendarMatches
    .filter((match) => match.status === "scheduled")
    .slice(0, 4)
    .map((match) => ({
      ...match,
      formattedTime: formatDateLabel(match.scheduled_time, "MMM d, h:mm a"),
    }));

  const currentCircuitNews = news.filter(isCurrentCircuitArticle);
  const featuredNews = currentCircuitNews[0] || news[0] || null;
  const latestNews = (currentCircuitNews.length > 0 ? currentCircuitNews : news)
    .slice(0, 3)
    .map((article) => ({
      ...article,
      formattedDate: formatDateLabel(article.created_date, "MMM d, yyyy"),
    }));
  const featuredNewsWithDate = featuredNews
    ? {
        ...featuredNews,
        formattedDate: formatDateLabel(
          featuredNews.created_date,
          "MMM d, yyyy",
        ),
      }
    : null;

  const lastTournament = completedTournaments[0] || null;
  const teamsMap = Object.fromEntries(teams.map((team) => [team.id, team]));
  const lastTournamentResults = lastTournament
    ? results.filter((result) => result.tournament_id === lastTournament.id)
    : [];
  const lastTournamentStandings = aggregateTournamentStandings(
    lastTournamentResults,
    teamsMap,
    {
      includeHidden: true,
    },
  );
  const championTeam =
    getTournamentChampionFromStages(lastTournament) ||
    lastTournamentStandings[0] ||
    null;
  const championLogo = championTeam?.rawTeamName
    ? getTeamLogoByName(championTeam.rawTeamName)
    : null;
  const championLogoSurfaceTone = championTeam?.rawTeamName
    ? getTeamLogoSurfaceTone(championTeam.rawTeamName)
    : "light";

  const featuredTournamentStandings = (
    featuredTournamentBoard?.standings || []
  ).map((entry) => ({
    teamKey: entry.teamId || entry.teamName,
    rawTeamName: entry.logoName || entry.teamName,
    teamName: entry.teamName,
    totalPoints: entry.points || 0,
    wins: entry.wwcd || 0,
    group: entry.group || "-",
    stage: featuredTournamentBoard?.featuredStage || null,
  }));
  const prioritizeCurrentTournamentBoard = Boolean(
    featuredTournament && featuredTournament.status !== "completed",
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
  const boardTournamentId = boardTournament?.id || "";

  const heroMeta = [
    featuredTournament?.name ? `${featuredTournament.name} in focus` : null,
    featuredTournament?.start_date
      ? `Starts ${formatDateLabel(featuredTournament.start_date, "MMM d, yyyy")}`
      : null,
    featuredNews?.title ? "Fresh circuit story live" : null,
  ].filter(Boolean);

  const featuredTournamentCalendar = new Map(
    (featuredTournament?.calendar || []).map((item) => [item.label, item.week]),
  );
  const featuredStageOrder = new Map(
    (featuredTournament?.stages || [])
      .filter((stage) => stage?.name)
      .map((stage, index) => [stage.name, index]),
  );
  const focusedStageIndex = featuredStageOrder.has(
    featuredTournamentBoard?.featuredStage,
  )
    ? featuredStageOrder.get(featuredTournamentBoard.featuredStage)
    : -1;
  const featuredStages = (featuredTournament?.stages || [])
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
              ? featuredTournamentBoard?.liveMatch
                ? "live"
                : featuredTournament?.status === "ongoing"
                  ? "current"
                  : "upcoming"
              : "upcoming"
          : stage.status || null,
    }));
  const featuredSpotlightStage =
    featuredStages.find(
      (stage) => stage.status === "live" || stage.status === "current",
    ) ||
    featuredStages[0] ||
    null;

  const featuredTournamentFacts = [
    { label: "Game", value: featuredTournament?.game || "Multiple titles" },
    {
      label: "Window",
      value:
        featuredTournament?.start_date && featuredTournament?.end_date
          ? `${formatDateLabel(featuredTournament.start_date, "MMM d")} - ${formatDateLabel(featuredTournament.end_date, "MMM d, yyyy")}`
          : "Calendar pending",
    },
    { label: "Prize pool", value: featuredTournament?.prize_pool || "TBA" },
    {
      label: "Field",
      value: featuredTournament?.max_teams
        ? `${featuredTournament.max_teams} teams`
        : featuredParticipantEntries.length > 0
          ? `${featuredParticipantEntries.length} teams`
          : "Field locking",
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
      icon: "TrendingUp",
      tournamentId: boardTournamentId,
    },
    { title: "Fan hub", detail: "Polls, predictions, chat", icon: "Swords" },
    {
      title: "Events",
      detail: `${calendarTournaments.length} tournaments tracked`,
      icon: "Trophy",
      link: "/tournaments",
    },
    {
      title: "News",
      detail: "Roster and result drops",
      icon: "Newspaper",
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
  const nextMatch = upcomingMatches[0] || null;
  const shared = buildSharedHomeView({
    featuredTournament,
    featuredTournamentBoard,
    liveMatches,
    featuredNewsWithDate,
    featuredSpotlightStage,
    featuredTournamentVisual,
    boardTournamentId,
  });

  if (mode === "mobile") {
    return buildMobileHomeView({
      shared,
      mobilePulseCards,
      mobileQuickActions,
      mobileBoardLeaders,
      nextMatch,
    });
  }

  return buildDesktopHomeView({
    shared,
    championTeam,
    championLogo,
    championLogoSurfaceTone,
    latestNews,
    lastTournament,
    heroMeta,
    featuredStages,
    featuredTournamentFacts,
    tickerItems,
    homeBoard,
    boardEyebrow,
    boardHeadline,
    upcomingMatches,
  });
}
