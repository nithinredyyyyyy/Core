import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Bookmark,
  Crown,
  MessageSquare,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Swords,
  UserPlus2,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import DailyPrediction from "@/components/fans/DailyPrediction";
import FanLeaderboard from "@/components/fans/FanLeaderboard";
import FanPolls from "@/components/fans/FanPolls";
import TeamIdentity from "@/components/shared/TeamIdentity";
import {
  aggregateCommentReactions,
  buildFanClubRows,
  buildFantasyLeaderboard,
  buildFantasyPlayerPool,
  FAN_POLL_TEMPLATES,
  FAN_REACTION_OPTIONS,
  nextProfileProgress,
  scoreFantasySquad,
} from "@/lib/fanZone";
import { resolveTournamentParticipantState } from "@/lib/bmps2026Progression";
import { normalizeOrganizationName } from "@/lib/organizationIdentity";
import { getFeaturedTournamentStage } from "@/lib/stageBoard";

function SectionFrame({ eyebrow, title, body, children, aside }) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-[#e8ddd0] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,241,234,0.92))] shadow-[0_26px_70px_rgba(15,23,42,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eadfce] px-5 py-5 sm:px-6">
        <div className="max-w-3xl">
          <p className="type-kicker text-[#8c7763]">{eyebrow}</p>
          <h2 className="type-title-lg mt-2 text-[#11131a]">{title}</h2>
          {body ? <p className="type-body-sm mt-3 text-[#5c6472]">{body}</p> : null}
        </div>
        {aside ? <div>{aside}</div> : null}
      </div>
      <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
    </section>
  );
}

function formatPercentage(value) {
  return `${Math.round(Number(value || 0))}%`;
}

function buildPredictionContext(match) {
  if (!match) return null;
  return {
    stage: match.stage || "Featured stage",
    group: match.group_name || "Main lobby",
    matchNumber: match.match_number || null,
    day: match.day || null,
    map: match.map || null,
    status: match.status || "scheduled",
    scheduled: match.scheduled_time ? new Date(match.scheduled_time) : null,
  };
}

function normalizeFanValue(value) {
  return normalizeOrganizationName(value);
}

function getMatchTimeValue(match) {
  const time = new Date(match?.scheduled_time || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function isTodayMatch(match, now = Date.now()) {
  if (!match?.scheduled_time) return false;
  return new Date(match.scheduled_time).toDateString() === new Date(now).toDateString();
}

function extractMatchGroups(match) {
  const raw = String(match?.group_name || "");
  const compact = raw
    .replace(/group/gi, " ")
    .replace(/vs\.?/gi, " ")
    .replace(/[,+/&-]/g, " ");
  return [
    ...new Set(
      compact
        .split(/\s+/)
        .map((part) => part.trim().toUpperCase())
        .filter((part) => /^[A-Z]$/.test(part)),
    ),
  ];
}

function pickCurrentMatch(matches) {
  const now = Date.now();
  const liveMatch = matches.find((match) =>
    ["live", "ongoing"].includes(String(match.status || "").toLowerCase()) &&
    isTodayMatch(match, now),
  );
  if (liveMatch) return liveMatch;

  const upcomingMatch = matches
    .filter((match) => {
      const status = String(match.status || "").toLowerCase();
      return status === "scheduled" && getMatchTimeValue(match) >= now;
    })
    .toSorted((left, right) => getMatchTimeValue(left) - getMatchTimeValue(right))[0];
  if (upcomingMatch) return upcomingMatch;

  const latestScheduledMatch = matches
    .filter((match) => String(match.status || "").toLowerCase() === "scheduled")
    .toSorted((left, right) => getMatchTimeValue(right) - getMatchTimeValue(left))[0];
  return latestScheduledMatch || matches[0] || null;
}

function buildNormalizedFanParticipants(normalizedParticipants = []) {
  return normalizedParticipants.map((participant) => {
    const stageEntries = Array.isArray(participant.stage_entries)
      ? participant.stage_entries
      : [];
    const primaryStageEntry =
      stageEntries
        .filter((entry) => entry?.stage_name)
        .toSorted((left, right) => {
          const leftPlacement = Number(left?.placement ?? 9999);
          const rightPlacement = Number(right?.placement ?? 9999);
          return leftPlacement - rightPlacement;
        })[0] || null;
    const phase = primaryStageEntry
      ? primaryStageEntry.group_name
        ? `${primaryStageEntry.stage_name} - ${primaryStageEntry.group_name}`
        : primaryStageEntry.stage_name
      : "Participants";

    return {
      team: participant.team_name || participant.team || "Unknown Team",
      team_id: participant.team_id || "",
      phase,
      players: (participant.players || []).flatMap((player) =>
        player.player_name ? [player.player_name] : [],
      ),
    };
  });
}

function buildPollSections({ votes, predictionOptions, teamClubs }) {
  const voteGroups = new Map();
  for (const vote of votes) {
    const row = voteGroups.get(vote.poll_key) || [];
    row.push(vote.option);
    voteGroups.set(vote.poll_key, row);
  }

  const winnerOptions = predictionOptions.slice(0, 4).map((team) => team.name);
  const clubOptions = teamClubs.slice(0, 4).map((team) => team.name);

  return FAN_POLL_TEMPLATES.map((poll) => {
    let options = winnerOptions;
    if (poll.pollKey === "best-clutch-week") options = clubOptions.length > 0 ? clubOptions : winnerOptions;
    if (poll.pollKey === "rate-roster-move") {
      options = ["Huge W", "Wait and see", "Risky move"];
    }

    const pollVotes = voteGroups.get(poll.pollKey) || [];
    const totalVotes = pollVotes.length || 1;
    const results = options.map((option) => {
      const count = pollVotes.filter((value) => value === option).length;
      return {
        option,
        percent: Math.round((count / totalVotes) * 100),
      };
    });

    return {
      ...poll,
      options,
      interactive: true,
      results,
      userVoteCount: pollVotes.length,
    };
  });
}

function FantasyBuilder({
  playerPool,
  selectedPlayers,
  captainId,
  onTogglePlayer,
  onSetCaptain,
  onSaveSquad,
  isSaving,
}) {
  const selectedCount = selectedPlayers.length;
  return (
    <SectionFrame
      eyebrow="Fantasy esports"
      title="Build your 4-player fantasy squad"
      body="Pick four players, lock one captain for the multiplier, and climb the weekly leaderboard with finishes, damage, survival, WWCD, and revive value."
      aside={
        <div className="rounded-full border border-[#eadfce] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a7866]">
          {selectedCount}/4 picks
        </div>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-3 md:grid-cols-2">
          {playerPool.slice(0, 16).map((player) => {
            const active = selectedPlayers.includes(player.id);
            const isCaptain = captainId === player.id;
            return (
              <button
                key={player.id}
                type="button"
                onClick={() => onTogglePlayer(player.id)}
                className={`rounded-[22px] border p-4 text-left transition ${
                  active
                    ? "border-primary/30 bg-primary/10 shadow-[0_16px_34px_rgba(251,146,60,0.1)]"
                    : "border-[#eadfce] bg-white hover:border-[#d9c7b3]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a7866]">
                      {player.teamName}
                    </p>
                    <p className="mt-2 text-base font-semibold text-[#11131a]">
                      {player.ign}
                    </p>
                    <p className="mt-1 text-[12px] text-[#5c6472]">{player.role}</p>
                  </div>
                  <div className="rounded-full bg-[#f8f2ec] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a7866]">
                    {player.fantasyPoints} pts
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-[#5c6472]">
                  <div>Finishes {player.finishes}</div>
                  <div>Damage {player.damage}</div>
                  <div>Revives {player.revives}</div>
                </div>

                {active ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSetCaptain(player.id);
                    }}
                    className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] ${
                      isCaptain
                        ? "bg-[#11131a] text-white"
                        : "border border-[#d9c7b3] bg-white text-[#11131a]"
                    }`}
                  >
                    <Crown className="size-3.5" />
                    {isCaptain ? "Captain x1.5" : "Make captain"}
                  </button>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-[#eadfce] bg-white p-5">
            <p className="type-kicker text-[#8a7866]">Fantasy score map</p>
            <div className="mt-4 space-y-2 text-sm text-[#5c6472]">
              <p>Finishes: 4 pts each</p>
              <p>Damage: 1 pt per 250 damage</p>
              <p>Survival: 1 pt per 2 minutes</p>
              <p>WWCD: 10 pts</p>
              <p>Revives: 2 pts each</p>
            </div>
          </div>
          <div className="rounded-[24px] border border-[#eadfce] bg-white p-5">
            <p className="type-kicker text-[#8a7866]">Current squad</p>
            <div className="mt-4 space-y-3">
              {selectedPlayers.length > 0 ? (
                selectedPlayers.map((playerId) => {
                  const player = playerPool.find((entry) => entry.id === playerId);
                  if (!player) return null;
                  return (
                    <div key={playerId} className="rounded-[18px] bg-[#f8f2ec] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#11131a]">{player.ign}</p>
                          <p className="text-[11px] text-[#5c6472]">{player.teamName}</p>
                        </div>
                        {captainId === playerId ? (
                          <span className="rounded-full bg-[#11131a] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                            Captain
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-[#5c6472]">Choose four players to build your first weekly lineup.</p>
              )}
            </div>

            <button
              type="button"
              onClick={onSaveSquad}
              disabled={selectedPlayers.length !== 4 || !captainId || isSaving}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#11131a] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sparkles className="size-4" />
              {isSaving ? "Saving squad…" : "Save fantasy squad"}
            </button>
          </div>
        </div>
      </div>
    </SectionFrame>
  );
}

function FanClubSection({ clubs, follows, session, onToggleFollow, isMutating }) {
  const followed = new Set(
    follows.filter((entry) => entry.user_id === session.userId && entry.target_type === "team").map((entry) => entry.target_label),
  );

  return (
    <SectionFrame
      eyebrow="Team fan clubs"
      title="Join the loudest clubs in the circuit"
      body="Follow teams, push support totals higher, and shape the visible club momentum around the active season."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {clubs.map((club) => {
          const active = followed.has(club.name);
          return (
            <div key={club.id} className="rounded-[24px] border border-[#eadfce] bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a7866]">
                Fan club
              </p>
              <h3 className="mt-3 text-xl font-semibold text-[#11131a]">{club.name}</h3>
              <p className="mt-1 text-sm text-[#5c6472]">{club.totalFans} supporters tracked</p>
              <p className="mt-1 text-[12px] text-[#8a7866]">{club.totalPoints} season points</p>

              <button
                type="button"
                onClick={() => onToggleFollow(club)}
                disabled={!session.userId || isMutating}
                className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] ${
                  active ? "bg-[#11131a] text-white" : "border border-[#d9c7b3] bg-white text-[#11131a]"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <UserPlus2 className="size-3.5" />
                {active ? "Following" : "Join club"}
              </button>
            </div>
          );
        })}
      </div>
    </SectionFrame>
  );
}

function CommentWall({
  comments,
  draft,
  setDraft,
  topic,
  setTopic,
  onSubmit,
  onReact,
  isSending,
  session,
}) {
  return (
    <SectionFrame
      eyebrow="Community features"
      title="Fan comments, upvotes, downvotes, and reaction emojis"
      body="Keep the conversation active with quick takes, roster-move reactions, and a visible matchday comment floor."
    >
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[24px] border border-[#eadfce] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="type-kicker text-[#8a7866]">Post a comment</p>
              <p className="mt-2 text-sm text-[#5c6472]">
                Topics include “Who will win today?”, “Best clutch this week?”, and “Rate this roster move”.
              </p>
            </div>
            <select
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              className="h-10 rounded-full border border-[#d9c7b3] bg-[#fffdfa] px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#5c6472]"
            >
              <option>Who will win today?</option>
              <option>Best clutch this week?</option>
              <option>Rate this roster move</option>
            </select>
          </div>

          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={220}
            placeholder="Drop your take here…"
            className="mt-4 min-h-[140px] w-full rounded-[20px] border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#11131a] outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-[12px] text-[#8a7866]">
              {session.userId ? "Your profile name will sign this post." : "Join the profile first to comment."}
            </p>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!session.userId || !draft.trim() || isSending}
              className="inline-flex items-center gap-2 rounded-full bg-[#11131a] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <MessageSquare className="size-4" />
              {isSending ? "Posting…" : "Post comment"}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="rounded-[24px] border border-[#eadfce] bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.04)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#11131a]">{comment.display_name}</p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                      {comment.topic || "General floor"}
                    </p>
                  </div>
                  <p className="text-[11px] text-[#8a7866]">
                    {comment.created_date ? new Date(comment.created_date).toLocaleDateString() : "Now"}
                  </p>
                </div>
                <p className="mt-4 text-sm leading-7 text-[#5c6472]">{comment.body}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onReact(comment.id, "", 1)}
                    disabled={!session.userId}
                    className="inline-flex items-center gap-1 rounded-full border border-[#d9c7b3] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#11131a]"
                  >
                    <Plus className="size-3.5" /> {comment.reactionSummary.upvotes}
                  </button>
                  <button
                    type="button"
                    onClick={() => onReact(comment.id, "", -1)}
                    disabled={!session.userId}
                    className="inline-flex items-center gap-1 rounded-full border border-[#d9c7b3] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#11131a]"
                  >
                    <Minus className="size-3.5" /> {comment.reactionSummary.downvotes}
                  </button>
                  {FAN_REACTION_OPTIONS.map((reaction) => (
                    <button
                      key={reaction.key}
                      type="button"
                      onClick={() => onReact(comment.id, reaction.key, 0)}
                      disabled={!session.userId}
                      className="inline-flex items-center gap-1 rounded-full border border-[#d9c7b3] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#11131a]"
                    >
                      <span>{reaction.emoji}</span>
                      <span>{comment.reactionSummary.emojis?.[reaction.key] || 0}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-[#eadfce] bg-white p-5 text-sm text-[#5c6472]">
              No fan comments yet. Open the floor with the first take.
            </div>
          )}
        </div>
      </div>
    </SectionFrame>
  );
}

export default function Fans() {
  const qc = useQueryClient();
  const session = base44.fan.getStoredSession();
  const [predictionWinner, setPredictionWinner] = useState("");
  const [predictionTopFragger, setPredictionTopFragger] = useState("");
  const [predictionTopThree, setPredictionTopThree] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [captainId, setCaptainId] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [commentTopic, setCommentTopic] = useState("Who will win today?");

  const { data: tournaments = [] } = useQuery({
    queryKey: ["fans-tournaments"],
    queryFn: () => base44.entities.Tournament.list("-created_date", 30),
  });
  const featuredTournament = useMemo(() => {
    const ongoing = tournaments.find((entry) => entry.status === "ongoing");
    return ongoing || tournaments[0] || null;
  }, [tournaments]);
  const { data: matches = [] } = useQuery({
    queryKey: ["fans-matches", featuredTournament?.id],
    queryFn: () =>
      base44.entities.Match.filter(
        { tournament_id: featuredTournament.id },
        "-scheduled_time",
        200,
      ),
    enabled: Boolean(featuredTournament?.id),
  });
  const { data: teams = [] } = useQuery({
    queryKey: ["fans-teams"],
    queryFn: () => base44.entities.Team.list("-total_points", 120),
  });
  const { data: players = [] } = useQuery({
    queryKey: ["fans-players"],
    queryFn: () => base44.entities.Player.list("-total_kills", 500),
  });
  const { data: profiles = [] } = useQuery({
    queryKey: ["fans-profiles"],
    queryFn: () => base44.entities.FanProfile.list("-total_points", 120),
  });
  const { data: predictions = [] } = useQuery({
    queryKey: ["fans-predictions"],
    queryFn: () => base44.entities.FanPrediction.list("-prediction_date", 80),
  });
  const { data: votes = [] } = useQuery({
    queryKey: ["fans-votes"],
    queryFn: () => base44.entities.FanPollVote.list("-created_date", 200),
  });
  const { data: comments = [] } = useQuery({
    queryKey: ["fans-comments"],
    queryFn: () => base44.entities.FanChatMessage.list("-created_date", 200),
  });
  const { data: reactions = [] } = useQuery({
    queryKey: ["fans-reactions"],
    queryFn: () => base44.entities.FanCommentReaction.list("-created_date", 500),
  });
  const { data: follows = [] } = useQuery({
    queryKey: ["fans-follows"],
    queryFn: () => base44.entities.FanFollowItem.list("-created_date", 300),
  });
  const { data: savedMatches = [] } = useQuery({
    queryKey: ["fans-saved-matches"],
    queryFn: () => base44.entities.SavedMatch.list("-created_date", 150),
  });
  const { data: fantasySquads = [] } = useQuery({
    queryKey: ["fans-fantasy-squads"],
    queryFn: () => base44.entities.FantasySquad.list("-total_points", 200),
  });

  const currentProfile = useMemo(
    () => profiles.find((entry) => entry.user_id === session.userId) || null,
    [profiles, session.userId],
  );

  const { data: normalizedTournamentData = null } = useQuery({
    queryKey: ["fans-normalized-tournament", featuredTournament?.id],
    queryFn: () => base44.tournaments.normalized(featuredTournament.id),
    enabled: Boolean(featuredTournament?.id),
  });

  const { data: matchResults = [] } = useQuery({
    queryKey: ["fans-match-results", featuredTournament?.id],
    queryFn: () =>
      base44.entities.MatchResult.filter(
        { tournament_id: featuredTournament.id },
        "-updated_date",
        1200,
      ),
    enabled: Boolean(featuredTournament?.id),
  });

  const tournamentMatches = useMemo(
    () =>
      matches.filter(
        (match) => !featuredTournament || match.tournament_id === featuredTournament.id,
      ),
    [featuredTournament, matches],
  );
  const focusedStageName = useMemo(
    () =>
      getFeaturedTournamentStage(
        featuredTournament,
        tournamentMatches,
        matchResults.filter(
          (result) => !featuredTournament || result.tournament_id === featuredTournament.id,
        ),
      ) || "",
    [featuredTournament, matchResults, tournamentMatches],
  );
  const currentMatch = useMemo(() => {
    const focusedMatches = focusedStageName
      ? tournamentMatches.filter((match) => match.stage === focusedStageName)
      : tournamentMatches;
    return pickCurrentMatch(focusedMatches.length > 0 ? focusedMatches : tournamentMatches);
  }, [focusedStageName, tournamentMatches]);
  const currentStageName = focusedStageName || currentMatch?.stage || featuredTournament?.status || "";
  const currentStageMatches = useMemo(
    () =>
      tournamentMatches.filter((match) => {
        if (!currentStageName || match.stage !== currentStageName) return false;
        if (currentMatch?.day) return Number(match.day) === Number(currentMatch.day);
        const currentDate = currentMatch?.scheduled_time
          ? new Date(currentMatch.scheduled_time).toDateString()
          : "";
        const matchDate = match.scheduled_time
          ? new Date(match.scheduled_time).toDateString()
          : "";
        return currentDate ? matchDate === currentDate : true;
      }),
    [currentMatch, currentStageName, tournamentMatches],
  );
  const currentStageGroups = useMemo(
    () => [
      ...new Set(
        currentStageMatches.flatMap((match) => extractMatchGroups(match)),
      ),
    ],
    [currentStageMatches],
  );
  const activeMatchGroups = useMemo(() => {
    const groups = extractMatchGroups(currentMatch);
    return groups.length > 0 ? groups : currentStageGroups;
  }, [currentMatch, currentStageGroups]);
  const activeGroupMatches = useMemo(() => {
    if (activeMatchGroups.length === 0) return currentStageMatches;
    const activeGroupSet = new Set(activeMatchGroups);
    return currentStageMatches.filter((match) =>
      extractMatchGroups(match).some((group) => activeGroupSet.has(group)),
    );
  }, [activeMatchGroups, currentStageMatches]);
  const featuredMatches = useMemo(
    () =>
      (
        activeGroupMatches.length > 0
          ? activeGroupMatches
          : currentStageMatches.length > 0
          ? currentStageMatches
          : tournamentMatches
      )
        .toSorted((left, right) => getMatchTimeValue(left) - getMatchTimeValue(right))
        .slice(0, 5),
    [activeGroupMatches, currentStageMatches, tournamentMatches],
  );
  const basePredictionContext = buildPredictionContext(currentMatch || featuredMatches[0] || null);
  const fanParticipantEntries = useMemo(() => {
    const normalizedEntries = buildNormalizedFanParticipants(
      normalizedTournamentData?.participants || [],
    );
    return normalizedEntries.length > 0
      ? normalizedEntries
      : featuredTournament?.participants || [];
  }, [featuredTournament, normalizedTournamentData]);
  const resolvedFanParticipantState = useMemo(
    () =>
      resolveTournamentParticipantState({
        tournament: featuredTournament,
        teams,
        matches,
        matchResults,
        participantEntries: fanParticipantEntries,
        stageNames: (featuredTournament?.stages || []).flatMap((stage) =>
          stage?.name ? [stage.name] : [],
        ),
      }),
    [fanParticipantEntries, featuredTournament, matchResults, matches, teams],
  );
  const currentStageTeamNames = useMemo(() => {
    const stageKey = normalizeFanValue(currentStageName);
    const groupKeys = new Set(activeMatchGroups.map((group) => normalizeFanValue(`group ${group}`)));
    const entries = (resolvedFanParticipantState.participantEntries || []).filter((entry) => {
      const phase = String(entry.phase || "");
      const phaseKey = normalizeFanValue(phase);
      if (!stageKey || !phaseKey.includes(stageKey)) return false;
      if (groupKeys.size === 0) return true;
      return [...groupKeys].some((groupKey) => phaseKey.includes(groupKey));
    });
    const sourceEntries = entries.length > 0
      ? entries
      : (resolvedFanParticipantState.participantEntries || []).filter((entry) =>
          normalizeFanValue(entry.phase || "").includes(stageKey),
        );
    return [
      ...new Set(
        sourceEntries
          .map((entry) => entry.team || entry.name)
          .filter(Boolean),
      ),
    ];
  }, [activeMatchGroups, currentStageName, resolvedFanParticipantState.participantEntries]);
  const currentStageTeamSet = useMemo(
    () => new Set(currentStageTeamNames.map((name) => normalizeFanValue(name))),
    [currentStageTeamNames],
  );
  const predictionOptions = useMemo(() => {
    const stageTeams = currentStageTeamNames.map((name, index) => ({
      id: name || `${index}`,
      name,
    }));
    const participantTeams = Array.isArray(featuredTournament?.participants)
      ? featuredTournament.participants.map((participant, index) => ({
          id: participant.team_id || participant.team || `${index}`,
          name: participant.team || participant.name,
        }))
      : [];
    return stageTeams.length > 0
      ? stageTeams
      : participantTeams.length > 0
      ? participantTeams
      : teams.slice(0, 8).map((team) => ({ id: team.id, name: team.name }));
  }, [currentStageTeamNames, featuredTournament, teams]);
  const predictionContext = useMemo(
    () =>
      basePredictionContext
        ? {
            ...basePredictionContext,
            slateMatches: featuredMatches.length,
            activeTeamCount: predictionOptions.length,
          }
        : null,
    [basePredictionContext, featuredMatches.length, predictionOptions.length],
  );

  const leaderboardRows = useMemo(
    () =>
      profiles
        .toSorted((left, right) => Number(right.total_points || 0) - Number(left.total_points || 0))
        .slice(0, 10)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
          isYou: entry.user_id === session.userId,
        })),
    [profiles, session.userId],
  );

  const currentStageTeams = useMemo(
    () =>
      currentStageTeamSet.size > 0
        ? teams.filter((team) => currentStageTeamSet.has(normalizeFanValue(team.name)))
        : teams,
    [currentStageTeamSet, teams],
  );
  const teamClubs = useMemo(
    () => buildFanClubRows(currentStageTeams, follows, profiles),
    [currentStageTeams, follows, profiles],
  );
  const pollSections = useMemo(
    () => buildPollSections({ votes, predictionOptions, teamClubs }),
    [votes, predictionOptions, teamClubs],
  );
  const currentStagePlayers = useMemo(() => {
    if (currentStageTeamSet.size === 0) return players;
    const teamIds = new Set(
      teams
        .filter((team) => currentStageTeamSet.has(normalizeFanValue(team.name)))
        .map((team) => team.id),
    );
    const stageRosterNames = new Set(
      (resolvedFanParticipantState.participantEntries || [])
        .filter((entry) => currentStageTeamSet.has(normalizeFanValue(entry.team)))
        .flatMap((entry) => entry.players || [])
        .map((name) => normalizeFanValue(name)),
    );
    const filtered = players.filter(
      (player) =>
        teamIds.has(player.team_id) ||
        stageRosterNames.has(normalizeFanValue(player.ign)),
    );
    return filtered.length > 0 ? filtered : players;
  }, [currentStageTeamSet, players, resolvedFanParticipantState.participantEntries, teams]);
  const playerPool = useMemo(
    () => buildFantasyPlayerPool(currentStagePlayers, currentStageTeams),
    [currentStagePlayers, currentStageTeams],
  );
  const fantasyLeaderboard = useMemo(
    () => buildFantasyLeaderboard(fantasySquads),
    [fantasySquads],
  );
  const enrichedComments = useMemo(
    () => aggregateCommentReactions(comments.slice(0, 14), reactions),
    [comments, reactions],
  );
  const mySavedMatches = useMemo(
    () => savedMatches.filter((entry) => entry.user_id === session.userId),
    [savedMatches, session.userId],
  );

  const profileMutation = useMutation({
    mutationFn: async (deltas) => {
      if (!session.userId) return null;
      const payload = {
        user_id: session.userId,
        display_name: session.displayName,
        favorite_team: currentProfile?.favorite_team || "",
        accuracy_percent: Number(currentProfile?.accuracy_percent || 0),
        predictions_count: Number(currentProfile?.predictions_count || 0),
        correct_predictions: Number(currentProfile?.correct_predictions || 0),
        ...nextProfileProgress(currentProfile, deltas),
      };

      if (currentProfile?.id) {
        return base44.entities.FanProfile.update(currentProfile.id, payload);
      }
      return base44.entities.FanProfile.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fans-profiles"] });
      qc.invalidateQueries({ queryKey: ["profile-fan-profile"] });
      qc.invalidateQueries({ queryKey: ["profile-leaderboard"] });
    },
  });

  const predictionMutation = useMutation({
    mutationFn: async () => {
      const topThree = predictionTopThree.slice(0, 3);
      return base44.entities.FanPrediction.create({
        user_id: session.userId,
        display_name: session.displayName,
        tournament_id: featuredTournament?.id || "",
        tournament_name: featuredTournament?.name || "Featured event",
        prediction_date: new Date().toISOString(),
        lock_time: featuredMatches[0]?.scheduled_time || "",
        winner_team: predictionWinner,
        top_fragger: predictionTopFragger,
        top_three: topThree,
        status: "pending",
        awarded_points: 0,
      });
    },
    onSuccess: async () => {
      setPredictionWinner("");
      setPredictionTopFragger("");
      setPredictionTopThree([]);
      qc.invalidateQueries({ queryKey: ["fans-predictions"] });
      await profileMutation.mutateAsync({ xp: 16, points: 6 });
    },
  });

  const voteMutation = useMutation({
    mutationFn: ({ pollKey, option }) =>
      base44.entities.FanPollVote.create({
        user_id: session.userId,
        display_name: session.displayName,
        poll_key: pollKey,
        option,
      }),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ["fans-votes"] });
      await profileMutation.mutateAsync({ xp: 8, points: 2 });
    },
  });

  const commentMutation = useMutation({
    mutationFn: () =>
      base44.entities.FanChatMessage.create({
        user_id: session.userId,
        display_name: session.displayName,
        tournament_id: featuredTournament?.id || "",
        tournament_name: featuredTournament?.name || "",
        topic: commentTopic,
        body: commentDraft.trim(),
      }),
    onSuccess: async () => {
      setCommentDraft("");
      qc.invalidateQueries({ queryKey: ["fans-comments"] });
      await profileMutation.mutateAsync({ xp: 10, points: 3 });
    },
  });

  const reactionMutation = useMutation({
    mutationFn: ({ commentId, reaction, voteValue }) =>
      base44.entities.FanCommentReaction.create({
        user_id: session.userId,
        display_name: session.displayName,
        comment_id: commentId,
        reaction,
        vote_value: voteValue,
      }),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ["fans-reactions"] });
      await profileMutation.mutateAsync({ xp: 2 });
    },
  });

  const followMutation = useMutation({
    mutationFn: async (club) => {
      const existing = follows.find(
        (entry) =>
          entry.user_id === session.userId &&
          entry.target_type === "team" &&
          entry.target_label === club.name,
      );
      if (existing?.id) {
        return base44.entities.FanFollowItem.delete(existing.id);
      }
      return base44.entities.FanFollowItem.create({
        user_id: session.userId,
        display_name: session.displayName,
        target_type: "team",
        target_id: club.id,
        target_label: club.name,
      });
    },
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ["fans-follows"] });
      await profileMutation.mutateAsync({ xp: 6 });
    },
  });

  const savedMatchMutation = useMutation({
    mutationFn: (match) =>
      base44.entities.SavedMatch.create({
        user_id: session.userId,
        display_name: session.displayName,
        match_id: match.id,
        note: `${match.stage || "Featured"} ${match.map || ""}`.trim(),
      }),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ["fans-saved-matches"] });
      await profileMutation.mutateAsync({ xp: 5 });
    },
  });

  const fantasyMutation = useMutation({
    mutationFn: async () => {
      const picks = selectedPlayers.map((playerId) => ({
        playerId,
        isCaptain: captainId === playerId,
      }));
      const total_points = scoreFantasySquad(picks, playerPool);
      const captain = playerPool.find((entry) => entry.id === captainId);
      return base44.entities.FantasySquad.create({
        user_id: session.userId,
        display_name: session.displayName,
        tournament_id: featuredTournament?.id || "",
        tournament_name: featuredTournament?.name || "Featured event",
        week_label: predictionContext?.stage || "Current slate",
        picks,
        captain_player_id: captainId,
        captain_name: captain?.ign || "",
        total_points,
        status: "active",
      });
    },
    onSuccess: async () => {
      setSelectedPlayers([]);
      setCaptainId("");
      qc.invalidateQueries({ queryKey: ["fans-fantasy-squads"] });
      await profileMutation.mutateAsync({ xp: 22, points: 12 });
    },
  });

  const toggleTopThree = (teamName) => {
    setPredictionTopThree((current) => {
      if (current.includes(teamName)) {
        return current.filter((entry) => entry !== teamName);
      }
      if (current.length >= 3) return current;
      return [...current, teamName];
    });
  };

  const toggleFantasyPlayer = (playerId) => {
    setSelectedPlayers((current) => {
      if (current.includes(playerId)) {
        if (captainId === playerId) setCaptainId("");
        return current.filter((entry) => entry !== playerId);
      }
      if (current.length >= 4) return current;
      return [...current, playerId];
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-6">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <DailyPrediction
          isPredictionLocked={false}
          featuredTournament={featuredTournament}
          predictionContext={predictionContext}
          predictionOptions={predictionOptions}
          predictionWinner={predictionWinner}
          setPredictionWinner={setPredictionWinner}
          predictionTopFragger={predictionTopFragger}
          setPredictionTopFragger={setPredictionTopFragger}
          predictionTopThree={predictionTopThree}
          toggleTopThree={toggleTopThree}
          onSubmit={() => predictionMutation.mutate()}
          isSubmitting={predictionMutation.isPending}
        />

        <SectionFrame
          eyebrow="Saved matches"
          title="Keep match windows ready to revisit"
          body="Save upcoming matches to your profile, then return to them without digging through the tournament schedule."
          aside={
            <div className="rounded-full border border-[#eadfce] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a7866]">
              {mySavedMatches.length} saved
            </div>
          }
        >
          <div className="space-y-3">
            {featuredMatches.slice(0, 4).map((match) => (
              <div key={match.id} className="flex items-center justify-between gap-4 rounded-[22px] border border-[#eadfce] bg-white p-4">
                <div>
                  <p className="text-sm font-semibold text-[#11131a]">
                    {match.stage} {match.group_name ? `| ${match.group_name}` : ""}
                  </p>
                  <p className="mt-1 text-[12px] text-[#5c6472]">
                    {match.map || "Map pending"} | {match.scheduled_time ? new Date(match.scheduled_time).toLocaleString() : "Schedule TBA"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => savedMatchMutation.mutate(match)}
                  disabled={!session.userId || savedMatchMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-full border border-[#d9c7b3] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#11131a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Bookmark className="size-3.5" />
                  Save
                </button>
              </div>
            ))}
          </div>
        </SectionFrame>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <FanLeaderboard profiles={leaderboardRows} />
        <FanPolls
          sections={pollSections}
          onVote={(pollKey, option) => voteMutation.mutate({ pollKey, option })}
        />
      </section>

      <FantasyBuilder
        playerPool={playerPool}
        selectedPlayers={selectedPlayers}
        captainId={captainId}
        onTogglePlayer={toggleFantasyPlayer}
        onSetCaptain={setCaptainId}
        onSaveSquad={() => fantasyMutation.mutate()}
        isSaving={fantasyMutation.isPending}
      />

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <FanClubSection
          clubs={teamClubs}
          follows={follows}
          session={session}
          onToggleFollow={(club) => followMutation.mutate(club)}
          isMutating={followMutation.isPending}
        />

        <SectionFrame
          eyebrow="Fantasy ladder"
          title="Weekly fantasy leaderboard"
          body="Every saved squad enters the live board. Captain multipliers and player efficiency decide the weekly crown."
        >
          <div className="space-y-3">
            {fantasyLeaderboard.slice(0, 8).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 rounded-[22px] border border-[#eadfce] bg-white p-4">
                <div>
                  <p className="text-sm font-semibold text-[#11131a]">{entry.display_name}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[#8a7866]">
                    {entry.week_label || "Current slate"} | {entry.captain_name || "Captain pending"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-primary">{entry.total_points}</p>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a7866]">rank {entry.rank}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionFrame>
      </section>

      <CommentWall
        comments={enrichedComments}
        draft={commentDraft}
        setDraft={setCommentDraft}
        topic={commentTopic}
        setTopic={setCommentTopic}
        onSubmit={() => commentMutation.mutate()}
        onReact={(commentId, reaction, voteValue) =>
          reactionMutation.mutate({ commentId, reaction, voteValue })
        }
        isSending={commentMutation.isPending}
        session={session}
      />
    </div>
  );
}
