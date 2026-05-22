import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  Bell,
  Flame,
  MessageSquareText,
  RotateCcw,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  getOrganizationMeta,
  normalizeOrganizationName,
} from "@/lib/organizationIdentity";
import FanProfileCard from "@/components/fans/FanProfileCard";
import FanLeaderboard from "@/components/fans/FanLeaderboard";
import DailyPrediction from "@/components/fans/DailyPrediction";
import FanPolls from "@/components/fans/FanPolls";
import TeamSupportMeter from "@/components/fans/TeamSupportMeter";
import FanChatComponent from "@/components/fans/FanChat";
import {
  getBadgeForPoints,
  SEEDED_LEADERBOARD,
} from "@/components/fans/BadgeDisplay";
import { useToast } from "@/components/ui/use-toast";
import { getRequestedTournamentId } from "@/lib/fanNavigation";
import { filterPublishedMatchResults } from "@/lib/matchResultPublication";
import { resolveTournamentLiveState } from "@/lib/tournamentLiveState";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
});

function buildSeededPercentages(options, seedLabel) {
  const base = options.map((option, index) => {
    const seed = `${seedLabel}-${option}-${index}`;
    const score = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return 18 + (score % 17);
  });
  const total = base.reduce((sum, value) => sum + value, 0) || 1;
  let remaining = 100;
  return base.map((value, index) => {
    if (index === base.length - 1) return remaining;
    const percent = Math.round((value / total) * 100);
    remaining -= percent;
    return percent;
  });
}

function getFanUser() {
  const existing = base44.fan.getStoredSession();
  return {
    userId: existing.userId || "",
    displayName: existing.displayName || "",
  };
}

const getLockTime = (tournament, matches = []) => {
  const upcomingMatch = matches.reduce((earliest, match) => {
    if (
      match.tournament_id !== tournament?.id ||
      match.status === "completed" ||
      !match.scheduled_time
    ) {
      return earliest;
    }
    if (!earliest) return match;
    return new Date(match.scheduled_time || 0) <
      new Date(earliest.scheduled_time || 0)
      ? match
      : earliest;
  }, null);

  if (upcomingMatch?.scheduled_time) {
    return new Date(upcomingMatch.scheduled_time);
  }

  return tournament?.start_date
    ? new Date(`${tournament.start_date}T18:00:00+05:30`)
    : null;
};

function getResolvedWinner(tournament) {
  if (Array.isArray(tournament?.rankings) && tournament.rankings[0]?.team)
    return tournament.rankings[0].team;
  if (Array.isArray(tournament?.participants))
    return (
      tournament.participants.toSorted(
        (a, b) => (a.placement || 999) - (b.placement || 999),
      )[0]?.team || null
    );
  return null;
}

function getResolvedTopThree(tournament) {
  if (!Array.isArray(tournament?.participants)) return [];
  return tournament.participants
    .toSorted((a, b) => (a.placement || 999) - (b.placement || 999))
    .slice(0, 3)
    .flatMap((entry) => (entry.team ? [entry.team] : []));
}

function getResolvedTopFragger(tournament) {
  if (!Array.isArray(tournament?.awards)) return null;
  const award = tournament.awards.find((item) =>
    /fragger|mvp/i.test(`${item?.title || ""} ${item?.label || ""}`),
  );
  return award?.winner || award?.player || null;
}

function getTournamentMaps(tournament, matches) {
  const fromRotation = Array.isArray(tournament?.stages)
    ? tournament.stages.reduce((items, stage) => {
        if (!Array.isArray(stage?.mapRotation)) return items;
        for (const entry of stage.mapRotation) {
          if (entry?.map) {
            items.push(entry.map);
          }
        }
        return items;
      }, [])
    : [];
  const fromMatches = matches.reduce((items, match) => {
    if (match.tournament_id === tournament?.id && match.map) {
      items.push(match.map);
    }
    return items;
  }, []);
  return [...new Set([...fromRotation, ...fromMatches])];
}

function mergeTournamentTeams(teams, tournament) {
  if (
    !Array.isArray(tournament?.participants) ||
    tournament.participants.length === 0
  )
    return teams;
  const teamMap = new Map(
    teams.map((team) => [normalizeOrganizationName(team.name), team]),
  );
  const seenNames = new Set();
  const merged = tournament.participants.reduce((items, participant, index) => {
      const normalized = normalizeOrganizationName(participant.team);
      const linkedTeam = teamMap.get(normalized);
      const meta = getOrganizationMeta(linkedTeam || participant.team);
      const nextTeam = {
        id: linkedTeam?.id || `participant-${normalized}-${index}`,
        name: meta.name,
        tag: linkedTeam?.tag || meta.tag,
        players: Array.isArray(participant.players) ? participant.players : [],
        total_points: linkedTeam?.total_points || 0,
        total_kills: linkedTeam?.total_kills || 0,
        matches_played: linkedTeam?.matches_played || 0,
      };
      if (!seenNames.has(nextTeam.name)) {
        seenNames.add(nextTeam.name);
        items.push(nextTeam);
      }
      return items;
    }, []);
  return merged.length > 0 ? merged : teams;
}

function buildPercentagesFromScores(rows = []) {
  const total =
    rows.reduce((sum, row) => sum + Math.max(0, Number(row.score || 0)), 0) ||
    1;
  let remaining = 100;
  return rows.map((row, index) => {
    if (index === rows.length - 1) {
      return { ...row, percent: remaining };
    }
    const percent = Math.max(
      0,
      Math.round((Math.max(0, Number(row.score || 0)) / total) * 100),
    );
    remaining -= percent;
    return { ...row, percent };
  });
}

function normalizeGroupName(value) {
  if (!value) return "";
  const raw = String(value).trim();
  if (/^group\s+/i.test(raw)) {
    return raw
      .replace(/^group\s+/i, "Group ")
      .replace(/\s+/g, " ")
      .trim();
  }
  if (/^[a-z]$/i.test(raw)) {
    return `Group ${raw.toUpperCase()}`;
  }
  return raw;
}

function getParticipantGroup(participant) {
  const phase = String(
    participant?.phase || participant?.stage || participant?.group_name || "",
  ).trim();
  if (!phase) return "";
  const direct = normalizeGroupName(participant?.group_name);
  if (direct) return direct;
  const match = phase.match(/group\s+([a-z])/i);
  if (match) return `Group ${match[1].toUpperCase()}`;
  return "";
}

function getParticipantStageName(participant) {
  const raw = String(participant?.phase || participant?.stage || "").trim();
  if (!raw) return "";
  return raw.replace(/\s*-\s*group\s+[a-z0-9]+$/i, "").trim();
}

function scorePrediction(prediction, tournament) {
  let points = 0;
  let checks = 0;
  let correct = 0;
  const winner = getResolvedWinner(tournament);
  if (winner && prediction.winner_team) {
    checks += 1;
    if (prediction.winner_team === winner) {
      points += 25;
      correct += 1;
    }
  }
  const topThree = getResolvedTopThree(tournament);
  if (topThree.length === 3 && Array.isArray(prediction.top_three)) {
    checks += 3;
    prediction.top_three.forEach((team) => {
      if (topThree.includes(team)) {
        points += 12;
        correct += 1;
      }
    });
  }
  const topFragger = getResolvedTopFragger(tournament);
  if (topFragger && prediction.top_fragger) {
    checks += 1;
    if (prediction.top_fragger === topFragger) {
      points += 20;
      correct += 1;
    }
  }
  return {
    status: checks > 0 ? "settled" : "pending",
    awarded_points: points,
    checks,
    correct,
  };
}

function FanPageLoadingState() {
  return (
    <div className="mx-auto flex min-h-[55vh] max-w-[1400px] items-center justify-center px-4 pb-4">
      <div className="w-full max-w-xl rounded-[24px] border border-border bg-card/95 p-10 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-primary/20 bg-primary/8">
          <div className="size-7 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
        </div>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
          Fan zone
        </p>
        <h2 className="mt-3 text-2xl font-heading font-semibold tracking-wide text-foreground">
          Loading community hub
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Pulling predictions, support meters, polls, and live fan activity.
        </p>
      </div>
    </div>
  );
}

const FAN_HUB_INITIAL_STATE = {
  fanUser: getFanUser(),
  isFanSessionReady: (() => {
    const stored = base44.fan.getStoredSession();
    return Boolean(stored.userId && stored.displayName && stored.token);
  })(),
  favoriteTeamDraft: "",
  predictionDraft: {
    winner: "",
    topFragger: "",
    topThree: [],
  },
  chatTopic: "General",
  chatDraft: "",
};

function fanHubReducer(state, action) {
  switch (action.type) {
    case "patch":
      return { ...state, ...action.payload };
    case "patchPredictionDraft":
      return {
        ...state,
        predictionDraft:
          typeof action.payload === "function"
            ? action.payload(state.predictionDraft)
            : { ...state.predictionDraft, ...action.payload },
      };
    default:
      return state;
  }
}

function useFanHubData() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [uiState, dispatch] = useReducer(fanHubReducer, FAN_HUB_INITIAL_STATE);
  const profileBootstrapRef = useRef(false);
  const profileSyncSignatureRef = useRef("");
  const {
    fanUser,
    isFanSessionReady,
    favoriteTeamDraft,
    predictionDraft,
    chatTopic,
    chatDraft,
  } = uiState;

  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery({
    queryKey: ["fan-tournaments"],
    queryFn: () => base44.entities.Tournament.list("-created_date", 100),
  });
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ["fan-teams"],
    queryFn: () => base44.entities.Team.list("-total_points", 400),
  });
  const { data: players = [], isLoading: playersLoading } = useQuery({
    queryKey: ["fan-players"],
    queryFn: () => base44.entities.Player.list("-total_kills", 1200),
  });
  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ["fan-matches"],
    queryFn: () => base44.entities.Match.list("-scheduled_time", 500),
  });
  const { data: rawMatchResults = [], isLoading: matchResultsLoading } =
    useQuery({
      queryKey: ["fan-match-results"],
      queryFn: () => base44.entities.MatchResult.list("-created_date", 5000),
    });
  const matchResults = useMemo(
    () => filterPublishedMatchResults(rawMatchResults),
    [rawMatchResults],
  );
  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["fan-profiles"],
    queryFn: () => base44.entities.FanProfile.list("-total_points", 200),
  });
  const { data: predictions = [], isLoading: predictionsLoading } = useQuery({
    queryKey: ["fan-predictions"],
    queryFn: () => base44.entities.FanPrediction.list("-updated_date", 400),
  });
  const { data: pollVotes = [], isLoading: pollVotesLoading } = useQuery({
    queryKey: ["fan-poll-votes"],
    queryFn: () => base44.entities.FanPollVote.list("-updated_date", 400),
  });
  const { data: chatMessages = [], isLoading: chatLoading } = useQuery({
    queryKey: ["fan-chat-messages"],
    queryFn: () => base44.entities.FanChatMessage.list("-created_date", 300),
  });

  const isLoading =
    !isFanSessionReady ||
    tournamentsLoading ||
    teamsLoading ||
    playersLoading ||
    matchesLoading ||
    matchResultsLoading ||
    profilesLoading ||
    predictionsLoading ||
    pollVotesLoading ||
    chatLoading;

  const requestedTournamentId = getRequestedTournamentId(searchParams);
  const requestedStage = searchParams.get("stage") || "";
  const liveState = useMemo(
    () =>
      resolveTournamentLiveState({
        tournaments,
        teams,
        matches,
        matchResults,
        requestedTournamentId,
        requestedStage: requestedStage || null,
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
    calendarMatches: liveMatches,
    featuredTournament,
    featuredParticipantEntries,
    featuredMatches,
    stageBoard,
    stageScopedMatches,
  } = liveState;
  const featuredTournamentTeams = useMemo(
    () => mergeTournamentTeams(teams, featuredTournament),
    [featuredTournament, teams],
  );
  const localProfile = useMemo(
    () =>
      profiles.find((profile) => profile.user_id === fanUser.userId) || null,
    [fanUser.userId, profiles],
  );
  const featuredPrediction = useMemo(
    () =>
      !featuredTournament
        ? null
        : predictions.find(
            (prediction) =>
              prediction.user_id === fanUser.userId &&
              prediction.tournament_id === featuredTournament.id,
          ) || null,
    [fanUser.userId, featuredTournament, predictions],
  );
  const predictionContextMatch = useMemo(() => {
    const now = Date.now();
    const scheduledTimeline = stageScopedMatches
      .reduce((items, match) => {
        if (match.status !== "completed" && match.scheduled_time) {
          items.push(match);
        }
        return items;
      }, [])
      .sort(
        (a, b) =>
          new Date(a.scheduled_time).getTime() -
          new Date(b.scheduled_time).getTime(),
      );

    const futureScheduled = scheduledTimeline.find(
      (match) => new Date(match.scheduled_time).getTime() > now,
    );
    if (futureScheduled) return futureScheduled;

    const latestScheduled = scheduledTimeline.at(-1);
    if (latestScheduled) return latestScheduled;

    const liveMatch = stageScopedMatches.reduce((best, match) => {
      if (match.status !== "live") return best;
      if (!best) return match;
      const timeDelta =
        new Date(match.scheduled_time || 0).getTime() -
        new Date(best.scheduled_time || 0).getTime();
      if (timeDelta !== 0) return timeDelta > 0 ? match : best;
      if ((match.day || 0) !== (best.day || 0)) {
        return (match.day || 0) > (best.day || 0) ? match : best;
      }
      return (match.match_number || 0) > (best.match_number || 0)
        ? match
        : best;
    }, null);
    if (liveMatch) return liveMatch;

    return (
      stageScopedMatches.find((match) => match.status !== "completed") ||
      stageScopedMatches[0] ||
      null
    );
  }, [stageScopedMatches]);
  const predictionSlateMatches = useMemo(() => {
    if (!predictionContextMatch) return [];
    return [predictionContextMatch];
  }, [predictionContextMatch]);
  const predictionGroups = useMemo(() => {
    const groups = new Set();
    for (const match of predictionSlateMatches) {
      const group = normalizeGroupName(match.group_name);
      if (group) {
        groups.add(group);
      }
    }
    return [...groups];
  }, [predictionSlateMatches]);
  const predictionGroupName = useMemo(
    () =>
      predictionGroups[0] ||
      normalizeGroupName(predictionContextMatch?.group_name),
    [predictionContextMatch?.group_name, predictionGroups],
  );
  const predictionStageName = useMemo(
    () => String(predictionContextMatch?.stage || "").trim(),
    [predictionContextMatch?.stage],
  );
  const predictionOptions = useMemo(() => {
    if (predictionGroups.length === 0) return featuredTournamentTeams;
    const exactStageParticipants = featuredParticipantEntries.filter(
      (participant) => {
        const participantGroup = getParticipantGroup(participant);
        const participantStage = getParticipantStageName(participant);
        return (
          predictionGroups.includes(participantGroup) &&
          normalizeOrganizationName(participantStage) ===
            normalizeOrganizationName(predictionStageName)
        );
      },
    );

    const fallbackGroupParticipants = featuredParticipantEntries.filter(
      (participant) =>
        predictionGroups.includes(getParticipantGroup(participant)),
    );

    const scopedParticipantNames = new Set(
      (exactStageParticipants.length > 0
        ? exactStageParticipants
        : fallbackGroupParticipants
      ).map((participant) => normalizeOrganizationName(participant.team)),
    );

    const scopedTeams = featuredTournamentTeams.filter((team) =>
      scopedParticipantNames.has(normalizeOrganizationName(team.name)),
    );
    return scopedTeams.length > 0 ? scopedTeams : featuredTournamentTeams;
  }, [
    featuredParticipantEntries,
    featuredTournamentTeams,
    predictionGroups,
    predictionStageName,
  ]);
  const allowedPredictionTeams = useMemo(
    () => new Set(predictionOptions.map((team) => team.name)),
    [predictionOptions],
  );
  const predictionWinner = useMemo(
    () =>
      predictionDraft.winner && allowedPredictionTeams.has(predictionDraft.winner)
        ? predictionDraft.winner
        : "",
    [allowedPredictionTeams, predictionDraft.winner],
  );
  const predictionTopThree = useMemo(
    () =>
      predictionDraft.topThree.filter((teamName) =>
        allowedPredictionTeams.has(teamName),
      ),
    [allowedPredictionTeams, predictionDraft.topThree],
  );
  const predictionTopFragger = predictionDraft.topFragger;
  const predictionLockTime = useMemo(() => {
    if (predictionContextMatch?.scheduled_time) {
      return new Date(predictionContextMatch.scheduled_time);
    }
    return getLockTime(featuredTournament, matches);
  }, [featuredTournament, matches, predictionContextMatch]);
  const isPredictionLocked =
    predictionContextMatch?.status === "live"
      ? true
      : predictionLockTime
        ? predictionLockTime.getTime() <= Date.now()
        : false;
  const supportOptions = useMemo(
    () => featuredTournamentTeams.slice(0, 8),
    [featuredTournamentTeams],
  );
  const predictionContext = useMemo(() => {
    if (!predictionContextMatch) return null;
    const scheduled = predictionContextMatch.scheduled_time
      ? new Date(predictionContextMatch.scheduled_time)
      : null;
    const activeTeamCount = predictionOptions.length;
    return {
      stage: predictionContextMatch.stage || "Stage",
      group:
        predictionGroups.length > 1
          ? predictionGroups.join(" • ")
          : predictionGroupName || "Open field",
      map: predictionContextMatch.map || "Map pending",
      matchNumber: predictionContextMatch.match_number || null,
      day: predictionContextMatch.day || null,
      slateMatches: predictionSlateMatches.length,
      activeTeamCount,
      scheduled,
      status: predictionContextMatch.status || "scheduled",
    };
  }, [
    predictionContextMatch,
    predictionGroupName,
    predictionGroups,
    predictionOptions.length,
    predictionSlateMatches.length,
  ]);
  const chatTopicOptions = useMemo(() => {
    const topics = ["General"];
    const featuredMatches = stageScopedMatches
      .reduce((items, match) => {
        if (match.tournament_id === featuredTournament?.id) {
          items.push(match);
        }
        return items;
      }, [])
      .sort(
        (a, b) =>
          (a.day || 0) - (b.day || 0) ||
          (a.match_number || 0) - (b.match_number || 0),
      )
      .slice(0, 8);

    featuredMatches.forEach((match) => {
      const label = `${match.stage || "Stage"}${match.group_name ? ` · ${match.group_name}` : ""}${match.match_number ? ` · M${match.match_number}` : ""}`;
      if (label && !topics.includes(label)) topics.push(label);
    });

    return topics;
  }, [featuredTournament?.id, stageScopedMatches]);

  const supportBoard = useMemo(() => {
    const counts = new Map();
    profiles.forEach((profile) => {
      if (profile.favorite_team)
        counts.set(
          profile.favorite_team,
          (counts.get(profile.favorite_team) || 0) + 1,
        );
    });
    return supportOptions
      .map((team, index) => ({
        team,
        supporters: counts.get(team.name) || 0,
        seeded: Math.max(1, 24 - index * 2),
        total: (counts.get(team.name) || 0) + Math.max(1, 24 - index * 2),
      }))
      .sort((a, b) => b.total - a.total)
      .map((entry, index, all) => ({
        ...entry,
        rank: index + 1,
        percent: Math.round((entry.total / (all[0]?.total || 1)) * 100),
      }));
  }, [profiles, supportOptions]);

  const leaderboard = useMemo(() => {
    const liveProfiles = profiles.map((profile) => ({
      display_name: profile.display_name,
      total_points: Number(profile.total_points || 0),
      accuracy_percent: Math.round(Number(profile.accuracy_percent || 0)),
      badge:
        profile.badge || getBadgeForPoints(Number(profile.total_points || 0)),
      isYou: profile.user_id === fanUser.userId,
    }));
    const merged = [...SEEDED_LEADERBOARD, ...liveProfiles].reduce(
      (acc, entry) => {
        const key = entry.display_name.toLowerCase();
        if (
          !acc[key] ||
          entry.isYou ||
          entry.total_points > acc[key].total_points
        )
          acc[key] = entry;
        return acc;
      },
      {},
    );
    return Object.values(merged)
      .sort(
        (a, b) =>
          b.total_points - a.total_points ||
          b.accuracy_percent - a.accuracy_percent,
      )
      .slice(0, 50)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [fanUser.userId, profiles]);
  const liveProfileStats = useMemo(() => {
    const userPredictions = predictions.filter(
      (prediction) => prediction.user_id === fanUser.userId,
    );
    const settledPredictions = userPredictions.filter(
      (prediction) => prediction.status === "settled",
    );
    const totalPoints = settledPredictions.reduce(
      (sum, prediction) => sum + Number(prediction.awarded_points || 0),
      0,
    );
    const correctPredictions = settledPredictions.filter(
      (prediction) => Number(prediction.awarded_points || 0) > 0,
    ).length;
    const accuracyPercent =
      settledPredictions.length > 0
        ? (correctPredictions / settledPredictions.length) * 100
        : 0;

    return {
      total_points: totalPoints,
      accuracy_percent: Number(accuracyPercent.toFixed(2)),
      correct_predictions: correctPredictions,
      predictions_count: userPredictions.length,
      badge: getBadgeForPoints(totalPoints),
      favorite_team: localProfile?.favorite_team || "",
    };
  }, [fanUser.userId, localProfile?.favorite_team, predictions]);

  const localLeaderboardRow = useMemo(
    () => leaderboard.find((entry) => entry.isYou) || null,
    [leaderboard],
  );
  const supportLeader = useMemo(() => supportBoard[0] || null, [supportBoard]);
  const featuredMaps = useMemo(() => {
    if (!stageBoard.featuredStage)
      return getTournamentMaps(featuredTournament, matches);
    const maps = new Set();
    for (const match of stageScopedMatches) {
      if (match.map) {
        maps.add(match.map);
      }
    }
    return [...maps];
  }, [
    featuredTournament,
    matches,
    stageBoard.featuredStage,
    stageScopedMatches,
  ]);
  const currentStageLabel = useMemo(() => {
    if (stageBoard.featuredStage) return stageBoard.featuredStage;
    if (!stageScopedMatches.length) {
      return featuredTournament?.status === "ongoing"
        ? "Live tournament"
        : "Upcoming event";
    }
    const liveMatch = stageScopedMatches.find(
      (match) => match.status === "live",
    );
    const anchorMatch = liveMatch || stageScopedMatches[0];
    return anchorMatch.stage || "Stage";
  }, [
    featuredTournament?.status,
    stageBoard.featuredStage,
    stageScopedMatches,
  ]);
  const activeDayLabel = useMemo(() => {
    const liveMatch = stageScopedMatches.find(
      (match) => match.status === "live",
    );
    const anchorMatch = liveMatch || stageScopedMatches[0];
    return anchorMatch?.day
      ? `Day ${anchorMatch.day}`
      : featuredTournament?.start_date
        ? "Matchday active"
        : "Calendar pending";
  }, [featuredTournament?.start_date, stageScopedMatches]);
  const nextMatchCard = useMemo(() => {
    const scheduled =
      stageBoard.liveMatch ||
      stageBoard.nextMatch ||
      stageScopedMatches.find((match) => match.status !== "completed");
    if (!scheduled) return null;
    return {
      label: `${scheduled.stage || "Stage"}${scheduled.group_name ? ` • ${scheduled.group_name}` : ""}`,
      sub: `${scheduled.map || "Map pending"}${scheduled.match_number ? ` • M${scheduled.match_number}` : ""}`,
      time: scheduled.scheduled_time
        ? new Date(scheduled.scheduled_time).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit",
          })
        : activeDayLabel,
    };
  }, [
    activeDayLabel,
    stageBoard.liveMatch,
    stageBoard.nextMatch,
    stageScopedMatches,
  ]);
  const myPredictionHistory = useMemo(
    () =>
      predictions
        .filter((prediction) => prediction.user_id === fanUser.userId)
        .sort(
          (a, b) =>
            new Date(b.updated_date || b.prediction_date || 0) -
            new Date(a.updated_date || a.prediction_date || 0),
        )
        .slice(0, 5),
    [fanUser.userId, predictions],
  );
  const pollKey = useMemo(() => {
    if (!featuredTournament?.id) return "fan-live-poll";
    const scope = [
      featuredTournament.id,
      predictionContext?.stage || currentStageLabel || "stage",
      predictionContext?.group || "open-field",
      predictionContext?.matchNumber || "match",
    ].reduce((items, value) => {
      const normalized = String(value || "").trim();
      if (normalized) items.push(normalized);
      return items;
    }, []).join(":");
    return `fan-live-poll:${scope}`;
  }, [
    currentStageLabel,
    featuredTournament?.id,
    predictionContext?.group,
    predictionContext?.matchNumber,
    predictionContext?.stage,
  ]);
  const pollInteractiveOptions = useMemo(() => {
    const matchTeams = predictionOptions.slice(0, 4).map((team) => team.name);
    if (matchTeams.length > 0) return matchTeams;
    return ["Team Soul", "Gods Reign", "Orangutan", "Genesis Esports"];
  }, [predictionOptions]);
  const mapImpactRows = useMemo(() => {
    const scopedMatchesWithResults = stageScopedMatches.filter((match) =>
      matchResults.some((result) => result.match_id === match.id),
    );
    const tournamentMatchesWithResults = featuredMatches.filter((match) =>
      matchResults.some((result) => result.match_id === match.id),
    );
    const sourceMatches =
      scopedMatchesWithResults.length > 0
        ? scopedMatchesWithResults
        : tournamentMatchesWithResults;
    const impactMap = new Map();

    for (const match of sourceMatches) {
      const rows = matchResults.filter(
        (result) => result.match_id === match.id,
      );
      if (rows.length === 0 || !match.map) continue;
      const killTotal = rows.reduce(
        (sum, row) => sum + Number(row.kill_points || 0),
        0,
      );
      const placementTotal = rows.reduce(
        (sum, row) => sum + Number(row.placement_points || 0),
        0,
      );
      const current = impactMap.get(match.map) || {
        option: match.map,
        score: 0,
        matches: 0,
      };
      current.score += killTotal + placementTotal * 0.35;
      current.matches += 1;
      impactMap.set(match.map, current);
    }

    if (impactMap.size === 0) {
      const rotationMap = new Map();
      for (const match of stageScopedMatches) {
        if (!match.map) continue;
        const current = rotationMap.get(match.map) || {
          option: match.map,
          score: 0,
          matches: 0,
        };
        current.score += 1;
        current.matches += 1;
        rotationMap.set(match.map, current);
      }
      return buildPercentagesFromScores(
        Array.from(rotationMap.values())
          .toSorted((a, b) => b.score - a.score)
          .slice(0, 4),
      );
    }

    return buildPercentagesFromScores(
      Array.from(impactMap.values())
        .toSorted((a, b) => b.score - a.score)
        .slice(0, 4),
    );
  }, [featuredMatches, matchResults, stageScopedMatches]);
  const fraggerSignalRows = useMemo(() => {
    const eligibleTeamIds = new Set(
      predictionOptions.reduce((items, team) => {
        if (team.id) {
          items.push(team.id);
        }
        return items;
      }, []),
    );
    const candidatePlayers = players
      .reduce((items, player) => {
        if (eligibleTeamIds.size > 0 && !eligibleTeamIds.has(player.team_id)) {
          return items;
        }
        const option = player.ign || player.real_name || "Player";
        if (!option) return items;
        items.push({
          option,
          score:
            Number(player.total_kills || 0) +
            Number(player.avg_damage || 0) / 100 +
            Number(player.matches_played || 0) * 0.15,
        });
        return items;
      }, [])
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    if (candidatePlayers.length === 0) {
      return buildPercentagesFromScores(
        predictionOptions.slice(0, 4).reduce((items, team) => {
          for (const player of team.players || []) {
            if (items.length >= 4) break;
            items.push({
              option:
                typeof player === "string"
                  ? player
                  : player?.name ||
                    player?.ign ||
                    player?.player_name ||
                    "Player",
              score: 1,
            });
          }
          return items;
        }, []),
      );
    }

    return buildPercentagesFromScores(candidatePlayers);
  }, [players, predictionOptions]);
  const pollSections = useMemo(() => {
    const winnerOptions = pollInteractiveOptions;
    const buildPollMetrics = (sectionKey, options) => {
      const relevantVotes = pollVotes.filter(
        (vote) => vote.poll_key === sectionKey,
      );
      const voteMap = new Map();
      relevantVotes.forEach((vote) =>
        voteMap.set(vote.option, (voteMap.get(vote.option) || 0) + 1),
      );
      const seededResults = options.map((option, index) => ({
        option,
        votes: (voteMap.get(option) || 0) + [34, 26, 18, 21][index],
      }));
      const totalVotes = seededResults.reduce((sum, item) => sum + item.votes, 0);
      const results = seededResults.map((entry) => ({
        ...entry,
        percent: Math.round((entry.votes / totalVotes) * 100),
      }));

      return {
        results,
        userPick:
          pollVotes.find(
            (vote) =>
              vote.user_id === fanUser.userId && vote.poll_key === sectionKey,
          )?.option || "",
        userVoteCount: pollVotes.filter(
          (vote) =>
            vote.user_id === fanUser.userId && vote.poll_key === sectionKey,
        ).length,
      };
    };

    const winnerKey = `${pollKey}:winner`;
    const winnerBaseOptions =
      winnerOptions.length > 0
        ? winnerOptions
        : ["Team Soul", "Gods Reign", "Orangutan", "Genesis Esports"];
    const winnerMetrics = buildPollMetrics(winnerKey, winnerBaseOptions);

    return [
      {
        pollKey: winnerKey,
        title: predictionContext
          ? `Who wins ${predictionContext.stage}${predictionContext.group ? ` • ${predictionContext.group}` : ""}${predictionContext.matchNumber ? ` • M${predictionContext.matchNumber}` : ""}?`
          : `Who takes ${featuredTournament?.short_name || featuredTournament?.name || "the featured event"}?`,
        options: winnerBaseOptions,
        interactive: true,
        results: winnerMetrics.results,
        userPick: winnerMetrics.userPick,
        userVoteCount: winnerMetrics.userVoteCount,
        description: "One clean winner call for the active match window.",
        badgeLabel: "Community call",
      },
      {
        title: "Map pressure",
        options: mapImpactRows.map((row) => row.option),
        interactive: false,
        percentages: mapImpactRows.map((row) => row.percent),
        description: mapImpactRows.some((row) => row.matches > 0)
          ? "Weighted from completed result totals across the current tournament flow."
          : "Using the mapped stage rotation until completed result totals land.",
        badgeLabel: "Map read",
      },
      {
        title: "Fragger heat",
        options: fraggerSignalRows.map((row) => row.option),
        interactive: false,
        percentages: fraggerSignalRows.map((row) => row.percent),
        description:
          "Weighted from recorded kills, damage, and match volume for players in the current pool.",
        badgeLabel: "Player form",
      },
    ];
  }, [
    fanUser.userId,
    featuredTournament,
    mapImpactRows,
    pollInteractiveOptions,
    pollKey,
    pollVotes,
    predictionContext,
    fraggerSignalRows,
  ]);
  const latestPollSelection = useMemo(() => {
    const selectedSection = pollSections.find((section) => section.userPick);
    if (!selectedSection) return null;
    return {
      option: selectedSection.userPick,
      title: selectedSection.title,
      votes: selectedSection.userVoteCount,
    };
  }, [pollSections]);
  const pollPick = latestPollSelection?.option || "";
  const userVoteCount = latestPollSelection?.votes || 0;

  const visibleCommunityMessages = useMemo(() => {
    const relevant = featuredTournament
      ? chatMessages.filter(
          (entry) =>
            !entry.tournament_id ||
            entry.tournament_id === featuredTournament.id,
        )
      : chatMessages;
    const topicFiltered =
      chatTopic === "General"
        ? relevant
        : relevant.filter((entry) => (entry.topic || "General") === chatTopic);
    return topicFiltered.slice(0, 12).map((entry) => ({
      id: entry.id,
      author: entry.display_name,
      topic: entry.topic || "General",
      body: entry.body,
      createdAt: entry.created_date,
    }));
  }, [chatMessages, chatTopic, featuredTournament]);

  useEffect(() => {
    if (!chatTopicOptions.includes(chatTopic)) {
      dispatch({
        type: "patch",
        payload: { chatTopic: chatTopicOptions[0] || "General" },
      });
    }
  }, [chatTopic, chatTopicOptions]);

  const fanNotifications = useMemo(() => {
    const items = [];

    if (featuredPrediction) {
      items.push({
        id: `prediction-${featuredPrediction.id}`,
        type: "prediction",
        title: "Prediction saved",
        body: `Your call for ${featuredTournament?.name || "the featured event"} is in. ${featuredPrediction.status === "settled" ? `It earned ${featuredPrediction.awarded_points || 0} points.` : "Results will be settled after the event closes."}`,
        meta:
          featuredPrediction.status === "settled"
            ? "Prediction settled"
            : "Prediction pending",
        time: new Date(
          featuredPrediction.updated_date ||
            featuredPrediction.prediction_date ||
            0,
        ).getTime(),
      });
    }

    if (pollPick) {
      items.push({
        id: `poll-${pollPick}`,
        type: "poll",
        title: "Hot take locked",
        body: `You backed “${pollPick}” in the live poll rotation.`,
        meta: `${userVoteCount} vote${userVoteCount === 1 ? "" : "s"} submitted`,
        time: Date.now() - 1000,
      });
    }

    if (favoriteTeamDraft) {
      items.push({
        id: `team-${favoriteTeamDraft}`,
        type: "team",
        title: "Favorite team selected",
        body: `${favoriteTeamDraft} is now pinned as your support pick across the fan zone.`,
        meta: "Support meter updated",
        time: Date.now() - 2000,
      });
    }

    if (localLeaderboardRow) {
      items.push({
        id: `rank-${localLeaderboardRow.rank}`,
        type: "rank",
        title: "Leaderboard standing",
        body: `You are currently ranked #${localLeaderboardRow.rank} with ${localLeaderboardRow.total_points} points.`,
        meta: `${localLeaderboardRow.accuracy_percent}% accuracy`,
        time: Date.now() - 3000,
      });
    }

    const myLatestMessage = chatMessages.reduce((latest, entry) => {
      if (entry.user_id !== fanUser.userId) return latest;
      if (!latest) return entry;
      return new Date(entry.created_date || 0) > new Date(latest.created_date || 0)
        ? entry
        : latest;
    }, null);

    if (myLatestMessage) {
      items.push({
        id: `chat-${myLatestMessage.id}`,
        type: "chat",
        title: "Community update posted",
        body: `Your latest message is live in the ${myLatestMessage.topic || "General"} thread.`,
        meta: "Chat synced",
        time: new Date(myLatestMessage.created_date || 0).getTime(),
      });
    }

    if (items.length === 0) {
      items.push({
        id: "welcome",
        type: "general",
        title: "Fan activity hub",
        body: "Submit a prediction, vote in a poll, or pick a favorite team to start building your fan profile.",
        meta: "Awaiting activity",
        time: 0,
      });
    }

    return items.sort((a, b) => b.time - a.time).slice(0, 5);
  }, [
    chatMessages,
    fanUser.userId,
    favoriteTeamDraft,
    featuredPrediction,
    featuredTournament?.name,
    localLeaderboardRow,
    pollPick,
    userVoteCount,
  ]);

  const upsertProfile = useMutation({
    mutationFn: async (payload) => {
      const session = await base44.fan.ensureSession(fanUser.displayName);
      const sessionProfile = profiles.find(
        (profile) => profile.user_id === session.userId,
      );
      return sessionProfile?.id
        ? base44.entities.FanProfile.update(sessionProfile.id, payload)
        : base44.entities.FanProfile.create({
            user_id: session.userId,
            display_name: session.displayName,
            ...payload,
          });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fan-profiles"] }),
    onError: (error) => {
      toast({
        title: "Profile update failed",
        description:
          error?.message || "Could not save your fan profile right now.",
        variant: "destructive",
      });
    },
  });

  const upsertPrediction = useMutation({
    mutationFn: async (payload) => {
      if (!featuredTournament) return null;
      const session = await base44.fan.ensureSession(fanUser.displayName);
      const score = scorePrediction(payload, featuredTournament);
      const data = {
        user_id: session.userId,
        display_name: session.displayName,
        tournament_id: featuredTournament.id,
        tournament_name: featuredTournament.name,
        prediction_date: new Date().toISOString(),
        lock_time: predictionLockTime?.toISOString() || null,
        winner_team: payload.winner_team,
        top_fragger: payload.top_fragger,
        top_three: payload.top_three,
        status: score.status,
        awarded_points: score.awarded_points,
      };
      return featuredPrediction?.id
        ? base44.entities.FanPrediction.update(featuredPrediction.id, data)
        : base44.entities.FanPrediction.create(data);
    },
    onSuccess: (savedPrediction) => {
      qc.setQueryData(["fan-predictions"], (current = []) => {
        const list = Array.isArray(current) ? current : [];
        const next = list.filter((entry) => entry.id !== savedPrediction?.id);
        return savedPrediction ? [savedPrediction, ...next] : next;
      });
      qc.invalidateQueries({ queryKey: ["fan-predictions"] });
      toast({
        title: "Prediction saved",
        description:
          "Your winner, fragger, and top-three call are locked for this match window.",
      });
    },
    onError: (error) => {
      toast({
        title: "Prediction submit failed",
        description:
          error?.message || "Could not lock your prediction right now.",
        variant: "destructive",
      });
    },
  });

  const upsertPollVote = useMutation({
    mutationFn: async ({ option, pollKey: activePollKey }) => {
      const session = await base44.fan.ensureSession(fanUser.displayName);
      const existing = pollVotes.find(
        (vote) =>
          vote.user_id === session.userId && vote.poll_key === activePollKey,
      );
      const data = {
        user_id: session.userId,
        display_name: session.displayName,
        poll_key: activePollKey,
        option,
      };
      return existing?.id
        ? base44.entities.FanPollVote.update(existing.id, data)
        : base44.entities.FanPollVote.create(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fan-poll-votes"] }),
    onError: (error) => {
      toast({
        title: "Vote failed",
        description:
          error?.message || "Could not record your poll vote right now.",
        variant: "destructive",
      });
    },
  });

  const submitChatMessage = useMutation({
    mutationFn: async (payload) => {
      const session = await base44.fan.ensureSession(fanUser.displayName);
      return base44.entities.FanChatMessage.create({
        ...payload,
        user_id: session.userId,
        display_name: session.displayName,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fan-chat-messages"] }),
    onError: (error) => {
      toast({
        title: "Message failed",
        description: error?.message || "Could not send your message right now.",
        variant: "destructive",
      });
    },
  });

  const buildProfilePayload = (overrides = {}) => ({
    favorite_team: "",
    total_points: 0,
    accuracy_percent: 0,
    badge: "Bronze",
    predictions_count: 0,
    correct_predictions: 0,
    ...overrides,
  });

  useEffect(() => {
    let ignore = false;

    if (isFanSessionReady) {
      return undefined;
    }

    base44.fan
      .ensureSession(fanUser.displayName)
      .then((session) => {
        if (!ignore) {
          dispatch({
            type: "patch",
            payload: {
              fanUser: {
                userId: session.userId,
                displayName: session.displayName,
              },
              isFanSessionReady: true,
            },
          });
        }
      })
      .catch((error) => {
        if (!ignore) {
          toast({
            title: "Fan session unavailable",
            description:
              error?.message || "Could not start your fan session right now.",
            variant: "destructive",
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, [fanUser.displayName, isFanSessionReady, toast]);

  useEffect(() => {
    if (!isFanSessionReady) return;
    if (
      !localProfile &&
      !profilesLoading &&
      !profileBootstrapRef.current &&
      !upsertProfile.isPending
    ) {
      profileBootstrapRef.current = true;
      upsertProfile.mutate(buildProfilePayload(), {
        onSettled: () => {
          profileBootstrapRef.current = false;
        },
      });
    }
  }, [
    isFanSessionReady,
    localProfile,
    profilesLoading,
    upsertProfile.isPending,
  ]);

  useEffect(() => {
    if (localProfile?.favorite_team)
      dispatch({
        type: "patch",
        payload: { favoriteTeamDraft: localProfile.favorite_team },
      });
  }, [localProfile?.favorite_team]);

  useEffect(() => {
    if (featuredPrediction) {
      dispatch({
        type: "patch",
        payload: {
          predictionDraft: {
            winner: featuredPrediction.winner_team || "",
            topFragger: featuredPrediction.top_fragger || "",
            topThree: Array.isArray(featuredPrediction.top_three)
              ? featuredPrediction.top_three
              : [],
          },
        },
      });
    }
  }, [featuredPrediction]);

  useEffect(() => {
    if (!localProfile) return;
    const nextPayload = buildProfilePayload({
      favorite_team: localProfile.favorite_team || "",
      total_points: liveProfileStats.total_points,
      accuracy_percent: liveProfileStats.accuracy_percent,
      badge: liveProfileStats.badge,
      predictions_count: liveProfileStats.predictions_count,
      correct_predictions: liveProfileStats.correct_predictions,
    });
    const nextSignature = JSON.stringify(nextPayload);
    if (
      nextSignature !== profileSyncSignatureRef.current &&
      (Number(localProfile.total_points || 0) !==
        liveProfileStats.total_points ||
        Math.round(Number(localProfile.accuracy_percent || 0)) !==
          Math.round(liveProfileStats.accuracy_percent) ||
        Number(localProfile.predictions_count || 0) !==
          liveProfileStats.predictions_count ||
        Number(localProfile.correct_predictions || 0) !==
          liveProfileStats.correct_predictions ||
        localProfile.badge !== liveProfileStats.badge)
    ) {
      profileSyncSignatureRef.current = nextSignature;
      upsertProfile.mutate(nextPayload, {
        onSettled: () => {
          profileSyncSignatureRef.current = "";
        },
      });
    }
  }, [liveProfileStats, localProfile]);

  const handleFavoriteTeam = (teamName) => {
    dispatch({ type: "patch", payload: { favoriteTeamDraft: teamName } });
    upsertProfile.mutate(
      buildProfilePayload({
        favorite_team: teamName,
        total_points: Number(localProfile?.total_points || 0),
        accuracy_percent: Number(localProfile?.accuracy_percent || 0),
        badge: localProfile?.badge || "Bronze",
        predictions_count: Number(localProfile?.predictions_count || 0),
        correct_predictions: Number(localProfile?.correct_predictions || 0),
      }),
    );
  };

  const toggleTopThree = (teamName) => {
    dispatch({
      type: "patchPredictionDraft",
      payload: (current) => ({
        ...current,
        topThree: current.topThree.includes(teamName)
          ? current.topThree.filter((team) => team !== teamName)
          : current.topThree.length >= 3
            ? [...current.topThree.slice(1), teamName]
            : [...current.topThree, teamName],
      }),
    });
  };

  const submitPrediction = () => {
    if (!featuredTournament) {
      toast({
        title: "Featured event pending",
        description:
          "Predictions will open once a featured tournament is available.",
        variant: "destructive",
      });
      return;
    }
    if (isPredictionLocked) {
      toast({
        title: "Prediction locked",
        description:
          "This prediction window is already locked for the active match cycle.",
        variant: "destructive",
      });
      return;
    }
    if (!predictionWinner || predictionTopThree.length !== 3) {
      toast({
        title: "Complete your prediction",
        description:
          "Pick one winner and exactly three teams for the top-three call.",
        variant: "destructive",
      });
      return;
    }
    upsertPrediction.mutate({
      winner_team: predictionWinner,
      top_fragger: predictionTopFragger,
      top_three: predictionTopThree,
    });
  };

  const submitCommunityMessage = () => {
    const text = chatDraft.trim();
    if (!text) {
      toast({
        title: "Message is empty",
        description: "Write something before posting to the community feed.",
        variant: "destructive",
      });
      return;
    }
    if (submitChatMessage.isPending) return;
    submitChatMessage.mutate({
      user_id: fanUser.userId,
      display_name: fanUser.displayName,
      tournament_id: featuredTournament?.id || null,
      tournament_name: featuredTournament?.name || null,
      topic: chatTopic,
      body: text,
    });
    dispatch({ type: "patch", payload: { chatDraft: "" } });
  };

  const resetFanSession = () => {
    const previousName = fanUser.displayName || "Fan";
    base44.fan.clearSession();
    dispatch({
      type: "patch",
      payload: {
        isFanSessionReady: false,
        fanUser: {
          userId: "",
          displayName: previousName,
        },
        predictionDraft: {
          winner: "",
          topFragger: "",
          topThree: [],
        },
        favoriteTeamDraft: "",
      },
    });
    qc.invalidateQueries({ queryKey: ["fan-profiles"] });
    qc.invalidateQueries({ queryKey: ["fan-predictions"] });
    qc.invalidateQueries({ queryKey: ["fan-poll-votes"] });
    qc.invalidateQueries({ queryKey: ["fan-chat-messages"] });
    toast({
      title: "Fan session reset",
      description: "A fresh fan session is being created for this browser now.",
    });
  };


  return {
    dispatch,
    fanUser,
    favoriteTeamDraft,
    chatDraft,
    chatTopic,
    isLoading,
    featuredTournament,
    currentStageLabel,
    activeDayLabel,
    resetFanSession,
    isPredictionLocked,
    predictionLockTime,
    localLeaderboardRow,
    nextMatchCard,
    fanNotifications,
    predictionContext,
    predictionOptions,
    predictionWinner,
    predictionTopFragger,
    predictionTopThree,
    toggleTopThree,
    submitPrediction,
    upsertPrediction,
    leaderboard,
    featuredMaps,
    submitCommunityMessage,
    submitChatMessage,
    visibleCommunityMessages,
    chatTopicOptions,
    localProfile,
    liveProfileStats,
    supportOptions,
    handleFavoriteTeam,
    supportBoard,
    pollSections,
    upsertPollVote,
  };
}

export default function FanHub() {
  const {
    dispatch,
    fanUser,
    favoriteTeamDraft,
    chatDraft,
    chatTopic,
    isLoading,
    featuredTournament,
    currentStageLabel,
    activeDayLabel,
    resetFanSession,
    isPredictionLocked,
    predictionLockTime,
    localLeaderboardRow,
    nextMatchCard,
    fanNotifications,
    predictionContext,
    predictionOptions,
    predictionWinner,
    predictionTopFragger,
    predictionTopThree,
    toggleTopThree,
    submitPrediction,
    upsertPrediction,
    leaderboard,
    featuredMaps,
    submitCommunityMessage,
    submitChatMessage,
    visibleCommunityMessages,
    chatTopicOptions,
    localProfile,
    liveProfileStats,
    supportOptions,
    handleFavoriteTeam,
    supportBoard,
    pollSections,
    upsertPollVote,
  } = useFanHubData();

  if (isLoading) return <FanPageLoadingState />;

  const commandCards = [
    {
      label: "Prediction window",
      value: isPredictionLocked ? "Locked" : "Open",
      note: predictionLockTime
        ? `${isPredictionLocked ? "Locked around" : "Closes"} ${predictionLockTime.toLocaleString(
            "en-IN",
            {
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
            },
          )}`
        : "Waiting for match schedule",
      icon: ShieldCheck,
      tone: "border border-primary/20 bg-[linear-gradient(135deg,rgba(251,146,60,0.95),rgba(249,115,22,0.88))] text-white",
    },
    {
      label: "Your rank",
      value: localLeaderboardRow ? `#${localLeaderboardRow.rank}` : "Unranked",
      note: localLeaderboardRow
        ? `${localLeaderboardRow.total_points} fan points`
        : "Join the board with one prediction",
      icon: Trophy,
      tone: "border border-border/70 bg-card text-foreground",
    },
    {
      label: "Stage pulse",
      value: currentStageLabel,
      note: nextMatchCard
        ? `${nextMatchCard.sub} • ${nextMatchCard.time}`
        : `${fanNotifications.length} recent alerts`,
      icon: Bell,
      tone: "border border-border/70 bg-card text-foreground",
    },
  ];

  return (
    <LazyMotion features={domAnimation}>
    <div className="mx-auto max-w-[1400px] space-y-4 pb-4">
      <m.section {...fadeUp(0)}>
        <div className="relative overflow-hidden rounded-[24px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,243,235,0.98))] shadow-[0_26px_70px_rgba(15,23,42,0.08)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(251,146,60,0.14),transparent_24%),radial-gradient(circle_at_12%_88%,rgba(245,158,11,0.1),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.35),transparent_35%)]" />
          <div className="relative z-10 grid gap-8 p-6 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
                <Flame className="size-3.5" />
                <span>
                  {featuredTournament?.short_name || "BMPS 2026"} • Fan zone
                </span>
              </div>
              <h1 className="mt-4 text-[3.2rem] font-semibold uppercase leading-[0.88] tracking-[-0.08em] text-foreground sm:text-[4.2rem]">
                FAN <span className="text-primary">HQ</span>
              </h1>
              <p className="mt-3 max-w-[520px] text-[13px] leading-6 text-muted-foreground">
                Follow the active tournament, lock your call before the slate
                starts, and stay in step with the live fan pulse around every
                BGMI matchday.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3.5 py-2 text-[11px] font-semibold text-foreground">
                  <ShieldCheck className="size-3.5 text-primary" />
                  {featuredTournament?.name || "Featured event pending"}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3.5 py-2 text-[11px] font-semibold text-foreground">
                  <Trophy className="size-3.5 text-amber-300" />
                  {currentStageLabel}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3.5 py-2 text-[11px] font-semibold text-foreground">
                  <MessageSquareText className="size-3.5 text-primary" />
                  {activeDayLabel}
                </div>
                <button
                  type="button"
                  onClick={resetFanSession}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3.5 py-2 text-[11px] font-semibold text-foreground transition-colors hover:border-primary/30 hover:text-primary"
                >
                  <RotateCcw className="size-3.5 text-primary" />
                  Reset fan session
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {commandCards.map((card) => (
                <div
                  key={card.label}
                  className={`rounded-[18px] p-4 shadow-[0_12px_26px_rgba(15,23,42,0.14)] ${card.tone}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-75">
                      {card.label}
                    </p>
                    <card.icon className="size-4 opacity-80" />
                  </div>
                  <p className="mt-3 text-[1.35rem] font-black leading-tight">
                    {card.value}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 opacity-75">
                    {card.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </m.section>

      <m.section {...fadeUp(0.04)}>
        <div className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
          <DailyPrediction
            isPredictionLocked={isPredictionLocked}
            featuredTournament={featuredTournament}
            predictionContext={predictionContext}
            predictionOptions={predictionOptions}
            predictionWinner={predictionWinner}
            setPredictionWinner={(value) =>
              dispatch({
                type: "patchPredictionDraft",
                payload: { winner: value },
              })
            }
            predictionTopFragger={predictionTopFragger}
            setPredictionTopFragger={(value) =>
              dispatch({
                type: "patchPredictionDraft",
                payload: { topFragger: value },
              })
            }
            predictionTopThree={predictionTopThree}
            toggleTopThree={toggleTopThree}
            onSubmit={submitPrediction}
            isSubmitting={upsertPrediction.isPending}
          />

          <div className="space-y-4">
            <FanLeaderboard profiles={leaderboard} />
            <div className="rounded-[22px] border border-border/70 bg-card p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
                Matchday pulse
              </p>
              <h2 className="mt-2 text-[1.55rem] font-semibold uppercase tracking-[-0.05em] text-foreground">
                What matters right now
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-[18px] border border-border/70 bg-secondary/35 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Current stage
                  </p>
                  <p className="mt-2 text-[1.05rem] font-black tracking-[-0.03em] text-foreground">
                    {currentStageLabel}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                    {featuredTournament?.status === "ongoing"
                      ? "Live tournament flow"
                      : "Next featured phase"}
                  </p>
                </div>
                <div className="rounded-[18px] border border-border/70 bg-secondary/35 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Next match
                  </p>
                  <p className="mt-2 text-[1.05rem] font-black tracking-[-0.03em] text-foreground">
                    {nextMatchCard?.sub || "Schedule pending"}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                    {nextMatchCard?.time || activeDayLabel}
                  </p>
                </div>
                <div className="rounded-[18px] border border-border/70 bg-secondary/35 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Map rotation
                  </p>
                  <p className="mt-2 text-[1.05rem] font-black tracking-[-0.03em] text-foreground">
                    {featuredMaps.slice(0, 3).join(" • ") || "Rotation pending"}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                    {featuredMaps.length
                      ? `${featuredMaps.length} maps tracked from the event feed`
                      : "Waiting for match feed"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </m.section>

      <m.section {...fadeUp(0.06)}>
        <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <FanChatComponent
            draft={chatDraft}
            onDraftChange={(value) =>
              dispatch({ type: "patch", payload: { chatDraft: value } })
            }
            onSubmit={submitCommunityMessage}
            isSubmitting={submitChatMessage.isPending}
            messages={visibleCommunityMessages}
            selectedTopic={chatTopic}
            onTopicChange={(value) =>
              dispatch({ type: "patch", payload: { chatTopic: value } })
            }
            topicOptions={chatTopicOptions}
          />

          <div className="space-y-4">
            <FanProfileCard
              profile={{ ...localProfile, ...liveProfileStats }}
              user={fanUser}
              leaderboardRank={localLeaderboardRow?.rank}
              favoriteTeam={favoriteTeamDraft}
            />
            <TeamSupportMeter
              supportOptions={supportOptions}
              favoriteTeam={favoriteTeamDraft}
              onSelectFavorite={handleFavoriteTeam}
              supportBoard={supportBoard}
            />
          </div>
        </div>
      </m.section>

      <m.section {...fadeUp(0.07)}>
        <FanPolls
          sections={pollSections}
          onVote={(activePollKey, option) => {
            upsertPollVote.mutate({ option, pollKey: activePollKey });
          }}
        />
      </m.section>
    </div>
    </LazyMotion>
  );
}
