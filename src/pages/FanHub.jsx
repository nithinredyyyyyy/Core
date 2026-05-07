import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getOrganizationMeta, normalizeOrganizationName } from "@/lib/organizationIdentity";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import FanProfileCard from "@/components/fans/FanProfileCard";
import FanLeaderboard from "@/components/fans/FanLeaderboard";
import DailyPrediction from "@/components/fans/DailyPrediction";
import FanPolls from "@/components/fans/FanPolls";
import TeamSupportMeter from "@/components/fans/TeamSupportMeter";
import FanChatComponent from "@/components/fans/FanChat";
import FanPredictionHistory from "@/components/fans/FanPredictionHistory";
import FanNotificationCenter from "@/components/fans/FanNotificationCenter";
import { getBadgeForPoints, SEEDED_LEADERBOARD } from "@/components/fans/BadgeDisplay";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
});

const POLL_OPTIONS = [
  "Team Soul close the week on top",
  "Gods Reign own the best recovery arc",
  "Orangutan swing the big surprise",
  "Round 1 movement creates the real chaos",
];
const POLL_KEY = "bmps-2026-hot-take";

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
  const existingId = window.localStorage.getItem("stagecore_fan_user_id");
  const existingName = window.localStorage.getItem("stagecore_fan_user_name");
  if (existingId && existingName) return { userId: existingId, displayName: existingName };
  const userId = `fan-${Math.random().toString(36).slice(2, 10)}`;
  const displayName = `Fan${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  window.localStorage.setItem("stagecore_fan_user_id", userId);
  window.localStorage.setItem("stagecore_fan_user_name", displayName);
  return { userId, displayName };
}

const getTournamentSortDate = (tournament) => new Date(tournament?.start_date || tournament?.end_date || tournament?.created_date || 0).getTime();
const getLockTime = (tournament) => (tournament?.start_date ? new Date(`${tournament.start_date}T18:00:00+05:30`) : null);

function getResolvedWinner(tournament) {
  if (Array.isArray(tournament?.rankings) && tournament.rankings[0]?.team) return tournament.rankings[0].team;
  if (Array.isArray(tournament?.participants)) return [...tournament.participants].sort((a, b) => (a.placement || 999) - (b.placement || 999))[0]?.team || null;
  return null;
}

function getResolvedTopThree(tournament) {
  if (!Array.isArray(tournament?.participants)) return [];
  return [...tournament.participants].sort((a, b) => (a.placement || 999) - (b.placement || 999)).slice(0, 3).map((entry) => entry.team).filter(Boolean);
}

function getResolvedTopFragger(tournament) {
  if (!Array.isArray(tournament?.awards)) return null;
  const award = tournament.awards.find((item) => /fragger|mvp/i.test(`${item?.title || ""} ${item?.label || ""}`));
  return award?.winner || award?.player || null;
}

function getTournamentMaps(tournament, matches) {
  const fromRotation = Array.isArray(tournament?.stages)
    ? tournament.stages.flatMap((stage) => Array.isArray(stage?.mapRotation) ? stage.mapRotation.map((entry) => entry.map).filter(Boolean) : [])
    : [];
  const fromMatches = matches
    .filter((match) => match.tournament_id === tournament?.id)
    .map((match) => match.map)
    .filter(Boolean);
  return [...new Set([...fromRotation, ...fromMatches])];
}

function mergeTournamentTeams(teams, tournament) {
  if (!Array.isArray(tournament?.participants) || tournament.participants.length === 0) return teams;
  const teamMap = new Map(teams.map((team) => [normalizeOrganizationName(team.name), team]));
  const merged = tournament.participants.map((participant, index) => {
    const normalized = normalizeOrganizationName(participant.team);
    const linkedTeam = teamMap.get(normalized);
    const meta = getOrganizationMeta(linkedTeam || participant.team);
    return {
      id: linkedTeam?.id || `participant-${normalized}-${index}`,
      name: meta.name,
      tag: linkedTeam?.tag || meta.tag,
      players: Array.isArray(participant.players) ? participant.players : [],
      total_points: linkedTeam?.total_points || 0,
      total_kills: linkedTeam?.total_kills || 0,
      matches_played: linkedTeam?.matches_played || 0,
    };
  }).filter((team, index, all) => all.findIndex((entry) => entry.name === team.name) === index);
  return merged.length > 0 ? merged : teams;
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
  return { status: checks > 0 ? "settled" : "pending", awarded_points: points, checks, correct };
}

export default function FanHub() {
  const qc = useQueryClient();
  const [fanUser] = useState(() => getFanUser());
  const [favoriteTeamDraft, setFavoriteTeamDraft] = useState("");
  const [predictionWinner, setPredictionWinner] = useState("");
  const [predictionTopFragger, setPredictionTopFragger] = useState("");
  const [predictionTopThree, setPredictionTopThree] = useState([]);
  const [pollPick, setPollPick] = useState("");
  const [chatTopic, setChatTopic] = useState("Open Floor");
  const [chatDraft, setChatDraft] = useState("");

  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery({ queryKey: ["fan-tournaments"], queryFn: () => base44.entities.Tournament.list("-created_date", 100) });
  const { data: teams = [], isLoading: teamsLoading } = useQuery({ queryKey: ["fan-teams"], queryFn: () => base44.entities.Team.list("-total_points", 400) });
  const { data: matches = [], isLoading: matchesLoading } = useQuery({ queryKey: ["fan-matches"], queryFn: () => base44.entities.Match.list("-scheduled_time", 500) });
  const { data: profiles = [], isLoading: profilesLoading } = useQuery({ queryKey: ["fan-profiles"], queryFn: () => base44.entities.FanProfile.list("-total_points", 200) });
  const { data: predictions = [], isLoading: predictionsLoading } = useQuery({ queryKey: ["fan-predictions"], queryFn: () => base44.entities.FanPrediction.list("-updated_date", 400) });
  const { data: pollVotes = [], isLoading: pollVotesLoading } = useQuery({ queryKey: ["fan-poll-votes"], queryFn: () => base44.entities.FanPollVote.list("-updated_date", 400) });
  const { data: chatMessages = [], isLoading: chatLoading } = useQuery({ queryKey: ["fan-chat-messages"], queryFn: () => base44.entities.FanChatMessage.list("-created_date", 300) });

  const isLoading = tournamentsLoading || teamsLoading || matchesLoading || profilesLoading || predictionsLoading || pollVotesLoading || chatLoading;

  const featuredTournament = useMemo(() => {
    const ongoing = tournaments.find((tournament) => tournament.status === "ongoing");
    const upcoming = [...tournaments].filter((tournament) => tournament.status === "upcoming").sort((a, b) => getTournamentSortDate(a) - getTournamentSortDate(b))[0];
    const completed = [...tournaments].filter((tournament) => tournament.status === "completed").sort((a, b) => getTournamentSortDate(b) - getTournamentSortDate(a))[0];
    return ongoing || upcoming || completed || tournaments[0] || null;
  }, [tournaments]);

  const featuredTournamentTeams = useMemo(() => mergeTournamentTeams(teams, featuredTournament), [featuredTournament, teams]);
  const localProfile = useMemo(() => profiles.find((profile) => profile.user_id === fanUser.userId) || null, [fanUser.userId, profiles]);
  const featuredPrediction = useMemo(() => !featuredTournament ? null : predictions.find((prediction) => prediction.user_id === fanUser.userId && prediction.tournament_id === featuredTournament.id) || null, [fanUser.userId, featuredTournament, predictions]);
  const predictionLockTime = useMemo(() => getLockTime(featuredTournament), [featuredTournament]);
  const isPredictionLocked = predictionLockTime ? predictionLockTime.getTime() <= Date.now() : false;
  const supportOptions = useMemo(() => featuredTournamentTeams.slice(0, 8), [featuredTournamentTeams]);
  const predictionOptions = useMemo(() => featuredTournamentTeams, [featuredTournamentTeams]);
  const chatTopicOptions = useMemo(() => {
    const topics = ["Open Floor"];
    const featuredMatches = matches
      .filter((match) => match.tournament_id === featuredTournament?.id)
      .sort((a, b) => (a.day || 0) - (b.day || 0) || (a.match_number || 0) - (b.match_number || 0))
      .slice(0, 8);

    featuredMatches.forEach((match) => {
      const label = `${match.stage || "Stage"}${match.group_name ? ` · ${match.group_name}` : ""}${match.match_number ? ` · M${match.match_number}` : ""}`;
      if (label && !topics.includes(label)) topics.push(label);
    });

    return topics;
  }, [featuredTournament?.id, matches]);

  const supportBoard = useMemo(() => {
    const counts = new Map();
    profiles.forEach((profile) => {
      if (profile.favorite_team) counts.set(profile.favorite_team, (counts.get(profile.favorite_team) || 0) + 1);
    });
    return supportOptions.map((team, index) => ({ team, supporters: counts.get(team.name) || 0, seeded: Math.max(1, 24 - index * 2) }))
      .map((entry) => ({ ...entry, total: entry.supporters + entry.seeded }))
      .sort((a, b) => b.total - a.total)
      .map((entry, index, all) => ({ ...entry, rank: index + 1, percent: Math.round((entry.total / (all[0]?.total || 1)) * 100) }));
  }, [profiles, supportOptions]);

  const leaderboard = useMemo(() => {
    const liveProfiles = profiles.map((profile) => ({
      display_name: profile.display_name,
      total_points: Number(profile.total_points || 0),
      accuracy_percent: Math.round(Number(profile.accuracy_percent || 0)),
      badge: profile.badge || getBadgeForPoints(Number(profile.total_points || 0)),
      isYou: profile.user_id === fanUser.userId,
    }));
    const merged = [...SEEDED_LEADERBOARD, ...liveProfiles].reduce((acc, entry) => {
      const key = entry.display_name.toLowerCase();
      if (!acc[key] || entry.isYou || entry.total_points > acc[key].total_points) acc[key] = entry;
      return acc;
    }, {});
    return Object.values(merged).sort((a, b) => b.total_points - a.total_points || b.accuracy_percent - a.accuracy_percent).slice(0, 50).map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [fanUser.userId, profiles]);

  const localLeaderboardRow = useMemo(() => leaderboard.find((entry) => entry.isYou) || null, [leaderboard]);
  const myPredictionHistory = useMemo(
    () =>
      predictions
        .filter((prediction) => prediction.user_id === fanUser.userId)
        .sort((a, b) => new Date(b.updated_date || b.prediction_date || 0) - new Date(a.updated_date || a.prediction_date || 0))
        .slice(0, 5),
    [fanUser.userId, predictions]
  );
  const pollResults = useMemo(() => {
    const relevantVotes = pollVotes.filter((vote) => vote.poll_key === POLL_KEY);
    const voteMap = new Map();
    relevantVotes.forEach((vote) => voteMap.set(vote.option, (voteMap.get(vote.option) || 0) + 1));
    return POLL_OPTIONS.map((option, index) => ({ option, votes: (voteMap.get(option) || 0) + [34, 26, 18, 21][index] })).map((entry, _index, all) => {
      const totalVotes = all.reduce((sum, item) => sum + item.votes, 0);
      return { ...entry, percent: Math.round((entry.votes / totalVotes) * 100) };
    });
  }, [pollVotes]);
  const userVoteCount = useMemo(
    () => pollVotes.filter((vote) => vote.user_id === fanUser.userId && vote.poll_key === POLL_KEY).length,
    [fanUser.userId, pollVotes]
  );
  const pollSections = useMemo(() => {
    const winnerOptions = featuredTournamentTeams.slice(0, 4).map((team) => team.name);
    const mapOptions = getTournamentMaps(featuredTournament, matches).slice(0, 4);
    const topFraggerOptions = Array.from(
      new Set(
        featuredTournamentTeams
          .flatMap((team) => (Array.isArray(team.players) ? team.players : []))
          .map((player) => (typeof player === "string" ? player : player?.name || player?.ign || player?.player_name))
          .filter(Boolean)
      )
    ).slice(0, 4);

    return [
      {
        title: `Who takes ${featuredTournament?.short_name || featuredTournament?.name || "the featured event"}?`,
        options: winnerOptions.length > 0 ? winnerOptions : ["Team Soul", "Gods Reign", "Orangutan", "Genesis Esports"],
        interactive: true,
      },
      {
        title: "Which map shapes the week the hardest?",
        options: mapOptions.length > 0 ? mapOptions : ["Erangel", "Miramar", "Sanhok", "Rondo"],
        percentages: buildSeededPercentages(mapOptions.length > 0 ? mapOptions : ["Erangel", "Miramar", "Sanhok", "Rondo"], `${featuredTournament?.id || "featured"}-maps`),
      },
      {
        title: "Who explodes as the top fragger pick?",
        options: topFraggerOptions.length > 0 ? topFraggerOptions : ["Goblin", "Neyo", "AquaNox", "Manya"],
        percentages: buildSeededPercentages(topFraggerOptions.length > 0 ? topFraggerOptions : ["Goblin", "Neyo", "AquaNox", "Manya"], `${featuredTournament?.id || "featured"}-fraggers`),
      },
    ];
  }, [featuredTournament, featuredTournamentTeams, matches]);

  const visibleCommunityMessages = useMemo(() => {
    const relevant = featuredTournament
      ? chatMessages.filter((entry) => !entry.tournament_id || entry.tournament_id === featuredTournament.id)
      : chatMessages;
    const topicFiltered =
      chatTopic === "Open Floor"
        ? relevant
        : relevant.filter((entry) => (entry.topic || "Open Floor") === chatTopic);
    return topicFiltered.slice(0, 12).map((entry) => ({
      id: entry.id,
      author: entry.display_name,
      topic: entry.topic || "Open Floor",
      body: entry.body,
      createdAt: entry.created_date,
    }));
  }, [chatMessages, chatTopic, featuredTournament]);

  useEffect(() => {
    if (!chatTopicOptions.includes(chatTopic)) {
      setChatTopic(chatTopicOptions[0] || "Open Floor");
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
        meta: featuredPrediction.status === "settled" ? "Prediction settled" : "Prediction pending",
        time: new Date(featuredPrediction.updated_date || featuredPrediction.prediction_date || 0).getTime(),
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

    const myLatestMessage = [...chatMessages]
      .filter((entry) => entry.user_id === fanUser.userId)
      .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))[0];

    if (myLatestMessage) {
      items.push({
        id: `chat-${myLatestMessage.id}`,
        type: "chat",
        title: "Community update posted",
        body: `Your latest message is live in the ${myLatestMessage.topic || "Open Floor"} thread.`,
        meta: "Chat synced",
        time: new Date(myLatestMessage.created_date || 0).getTime(),
      });
    }

    if (items.length === 0) {
      items.push({
        id: "welcome",
        type: "general",
        title: "Welcome to Fan Zone",
        body: "Submit a prediction, vote in a poll, or pick a favorite team to start building your fan profile.",
        meta: "No activity yet",
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
    mutationFn: async (payload) => localProfile?.id ? base44.entities.FanProfile.update(localProfile.id, payload) : base44.entities.FanProfile.create({ user_id: fanUser.userId, display_name: fanUser.displayName, created_by: "fan@stagecore.local", ...payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fan-profiles"] }),
  });

  const upsertPrediction = useMutation({
    mutationFn: async (payload) => {
      if (!featuredTournament) throw new Error("No featured tournament available.");
      const score = scorePrediction(payload, featuredTournament);
      const data = { user_id: fanUser.userId, display_name: fanUser.displayName, tournament_id: featuredTournament.id, tournament_name: featuredTournament.name, prediction_date: new Date().toISOString(), lock_time: predictionLockTime?.toISOString() || null, winner_team: payload.winner_team, top_fragger: payload.top_fragger, top_three: payload.top_three, status: score.status, awarded_points: score.awarded_points, created_by: "fan@stagecore.local" };
      return featuredPrediction?.id ? base44.entities.FanPrediction.update(featuredPrediction.id, data) : base44.entities.FanPrediction.create(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fan-predictions"] }),
  });

  const upsertPollVote = useMutation({
    mutationFn: async (option) => {
      const existing = pollVotes.find((vote) => vote.user_id === fanUser.userId && vote.poll_key === POLL_KEY);
      const data = { user_id: fanUser.userId, display_name: fanUser.displayName, poll_key: POLL_KEY, option, created_by: "fan@stagecore.local" };
      return existing?.id ? base44.entities.FanPollVote.update(existing.id, data) : base44.entities.FanPollVote.create(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fan-poll-votes"] }),
  });

  useEffect(() => {
    if (!localProfile && !profilesLoading) {
      upsertProfile.mutate({ favorite_team: "", total_points: 0, accuracy_percent: 0, badge: "Bronze", predictions_count: 0, correct_predictions: 0 });
    }
  }, [localProfile, profilesLoading]);

  useEffect(() => {
    if (localProfile?.favorite_team) setFavoriteTeamDraft(localProfile.favorite_team);
  }, [localProfile?.favorite_team]);

  useEffect(() => {
    if (featuredPrediction) {
      setPredictionWinner(featuredPrediction.winner_team || "");
      setPredictionTopFragger(featuredPrediction.top_fragger || "");
      setPredictionTopThree(Array.isArray(featuredPrediction.top_three) ? featuredPrediction.top_three : []);
    }
  }, [featuredPrediction]);

  useEffect(() => {
    const userVote = pollVotes.find((vote) => vote.user_id === fanUser.userId && vote.poll_key === POLL_KEY);
    if (userVote?.option) setPollPick(userVote.option);
  }, [fanUser.userId, pollVotes]);

  useEffect(() => {
    if (!localProfile) return;
    const userPredictions = predictions.filter((prediction) => prediction.user_id === fanUser.userId);
    const settledPredictions = userPredictions.filter((prediction) => prediction.status === "settled");
    const totalPoints = settledPredictions.reduce((sum, prediction) => sum + Number(prediction.awarded_points || 0), 0);
    const correctPredictions = settledPredictions.filter((prediction) => Number(prediction.awarded_points || 0) > 0).length;
    const accuracyPercent = settledPredictions.length > 0 ? (correctPredictions / settledPredictions.length) * 100 : 0;
    const badge = getBadgeForPoints(totalPoints);
    if (Number(localProfile.total_points || 0) !== totalPoints || Math.round(Number(localProfile.accuracy_percent || 0)) !== Math.round(accuracyPercent) || Number(localProfile.predictions_count || 0) !== userPredictions.length || Number(localProfile.correct_predictions || 0) !== correctPredictions || localProfile.badge !== badge) {
      upsertProfile.mutate({ favorite_team: localProfile.favorite_team || "", total_points: totalPoints, accuracy_percent: Number(accuracyPercent.toFixed(2)), badge, predictions_count: userPredictions.length, correct_predictions: correctPredictions });
    }
  }, [fanUser.userId, localProfile, predictions]);

  const handleFavoriteTeam = (teamName) => {
    setFavoriteTeamDraft(teamName);
    upsertProfile.mutate({ favorite_team: teamName, total_points: Number(localProfile?.total_points || 0), accuracy_percent: Number(localProfile?.accuracy_percent || 0), badge: localProfile?.badge || "Bronze", predictions_count: Number(localProfile?.predictions_count || 0), correct_predictions: Number(localProfile?.correct_predictions || 0) });
  };

  const toggleTopThree = (teamName) => {
    setPredictionTopThree((current) => current.includes(teamName) ? current.filter((team) => team !== teamName) : current.length >= 3 ? [...current.slice(1), teamName] : [...current, teamName]);
  };

  const submitPrediction = () => {
    if (!featuredTournament || isPredictionLocked || !predictionWinner || predictionTopThree.length !== 3) return;
    upsertPrediction.mutate({ winner_team: predictionWinner, top_fragger: predictionTopFragger, top_three: predictionTopThree });
  };

  const submitCommunityMessage = () => {
    const text = chatDraft.trim();
    if (!text) return;
    base44.entities.FanChatMessage.create({
      user_id: fanUser.userId,
      display_name: fanUser.displayName,
      tournament_id: featuredTournament?.id || null,
      tournament_name: featuredTournament?.name || null,
      topic: chatTopic,
      body: text,
      created_by: "fan@stagecore.local",
    }).then(() => qc.invalidateQueries({ queryKey: ["fan-chat-messages"] }));
    setChatDraft("");
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-[1400px] space-y-3.5 pb-4">
      <motion.section {...fadeUp(0)}>
        <div className="relative overflow-hidden rounded-[22px] border border-[#241c37] bg-[linear-gradient(135deg,#0e0e1c_0%,#121224_58%,#2b1f47_100%)] shadow-[0_24px_60px_rgba(15,23,42,0.15)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(124,58,237,0.22),transparent_24%),radial-gradient(circle_at_10%_88%,rgba(239,68,68,0.08),transparent_20%)]" />
          <div className="relative z-10 px-10 py-6">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-violet-500">
              <Flame className="h-3.5 w-3.5" />
              <span>BMPS 2026 • Fan zone</span>
            </div>
            <h1 className="mt-4 text-[3.8rem] font-black uppercase leading-[0.86] tracking-[-0.08em] text-white">FAN <span className="text-violet-500">ZONE</span></h1>
            <p className="mt-3 max-w-[430px] text-[13px] leading-6 text-slate-400">Predict match outcomes, support your team, vote on polls, and compete on the fan leaderboard.</p>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <div className="border-r border-white/10 pr-5">
                <p className="text-[1.8rem] font-black leading-none text-white">{profiles.length}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">Active fans</p>
              </div>
              <div className="border-r border-white/10 pr-5">
                <p className="text-[1.8rem] font-black leading-none text-white">{featuredTournament?.name || "Battlegrounds Mobile India Series 2026"}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">Tournament</p>
              </div>
              <div>
                <p className="text-[1.8rem] font-black leading-none text-white">6:00 PM IST</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">Today's deadline</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.08fr_0.82fr_0.52fr]">
        <div className="space-y-4">
          <motion.div {...fadeUp(0.05)}>
            <DailyPrediction
              isPredictionLocked={isPredictionLocked}
              featuredTournament={featuredTournament}
              predictionOptions={predictionOptions}
              predictionWinner={predictionWinner}
              setPredictionWinner={setPredictionWinner}
              predictionTopFragger={predictionTopFragger}
              setPredictionTopFragger={setPredictionTopFragger}
              predictionTopThree={predictionTopThree}
              toggleTopThree={toggleTopThree}
              onSubmit={submitPrediction}
              isSubmitting={upsertPrediction.isPending}
            />
          </motion.div>
          <motion.div {...fadeUp(0.1)}>
            <FanPolls
              sections={pollSections}
              pollPick={pollPick}
              userVoteCount={userVoteCount}
              pollResults={pollResults}
              onVote={(option) => {
                setPollPick(option);
                upsertPollVote.mutate(option);
              }}
            />
          </motion.div>
        </div>

        <div className="space-y-4">
          <motion.div {...fadeUp(0.08)}>
            <FanProfileCard profile={localProfile} user={fanUser} leaderboardRank={localLeaderboardRow?.rank} favoriteTeam={favoriteTeamDraft} />
          </motion.div>
          <motion.div {...fadeUp(0.1)}>
            <FanPredictionHistory predictions={myPredictionHistory} />
          </motion.div>
          <motion.div {...fadeUp(0.12)}>
            <FanChatComponent
              draft={chatDraft}
              onDraftChange={setChatDraft}
              onSubmit={submitCommunityMessage}
              messages={visibleCommunityMessages}
              selectedTopic={chatTopic}
              onTopicChange={setChatTopic}
              topicOptions={chatTopicOptions}
            />
          </motion.div>
        </div>

        <div className="space-y-4">
          <motion.div {...fadeUp(0.1)}>
            <FanLeaderboard profiles={leaderboard} />
          </motion.div>
          <motion.div {...fadeUp(0.12)}>
            <FanNotificationCenter notifications={fanNotifications} />
          </motion.div>
          <motion.div {...fadeUp(0.15)}>
            <TeamSupportMeter supportOptions={supportOptions} favoriteTeam={favoriteTeamDraft} onSelectFavorite={handleFavoriteTeam} supportBoard={supportBoard} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
