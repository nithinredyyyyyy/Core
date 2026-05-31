import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  CheckCircle2,
  Megaphone,
  Sparkles,
  Trophy,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const EMPTY_ITEMS = [];
const SEEN_ALERTS_STORAGE_PREFIX = "stagecore_seen_alerts";

const ICONS = {
  prediction: Trophy,
  poll: Sparkles,
  team: CheckCircle2,
  rank: Trophy,
  chat: Megaphone,
  general: Bell,
};

function formatRankLabel(rank) {
  if (!rank) return "Unranked";
  return `#${rank}`;
}

function buildNotifications({
  leaderboardRank,
  favoriteTeam,
  pendingPredictions,
  votesCount,
  savedMatchesCount,
  fantasySquadsCount,
}) {
  const items = [];

  if (leaderboardRank) {
    items.push({
      id: "rank",
      type: "rank",
      title: `You are ${formatRankLabel(leaderboardRank)} on the fan ladder`,
      body: "Your prediction accuracy and community activity are contributing to your live rank.",
      meta: "Leaderboard pulse",
    });
  }

  if (favoriteTeam) {
    items.push({
      id: "team",
      type: "team",
      title: `${favoriteTeam} is locked as your featured team`,
      body: "This preference shapes your identity card and keeps your support visible.",
      meta: "Profile tuning",
    });
  }

  if (pendingPredictions > 0) {
    items.push({
      id: "prediction-pending",
      type: "prediction",
      title: `${pendingPredictions} live prediction window${
        pendingPredictions > 1 ? "s" : ""
      } still open`,
      body: "Slide into the fan hub before the next lock and finish your calls.",
      meta: "Prediction board",
    });
  }

  if (votesCount > 0) {
    items.push({
      id: "votes",
      type: "poll",
      title: `${votesCount} community vote${votesCount > 1 ? "s" : ""} recorded`,
      body: "Your poll decisions are now shaping the live fan sentiment panel.",
      meta: "Community pulse",
    });
  }

  if (savedMatchesCount > 0) {
    items.push({
      id: "saved-matches",
      type: "match",
      title: `${savedMatchesCount} saved match${
        savedMatchesCount > 1 ? "es" : ""
      } ready to revisit`,
      body: "Your bookmarked match windows are waiting inside the fan layer.",
      meta: "Saved schedule",
    });
  }

  if (fantasySquadsCount > 0) {
    items.push({
      id: "fantasy",
      type: "fantasy",
      title: `${fantasySquadsCount} fantasy squad${
        fantasySquadsCount > 1 ? "s" : ""
      } active`,
      body: "Captain multipliers and weekly ladders now stay linked to your profile.",
      meta: "Fantasy board",
    });
  }

  return items;
}

function getAlertSeenKey(item) {
  return `${item.id}:${item.title}`;
}

function readSeenAlerts(userId) {
  if (!userId || typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(`${SEEN_ALERTS_STORAGE_PREFIX}:${userId}`);
    const values = JSON.parse(raw || "[]");
    return new Set(Array.isArray(values) ? values : []);
  } catch {
    return new Set();
  }
}

function writeSeenAlerts(userId, values) {
  if (!userId || typeof window === "undefined") return;
  window.localStorage.setItem(
    `${SEEN_ALERTS_STORAGE_PREFIX}:${userId}`,
    JSON.stringify([...values]),
  );
}

export default function NotificationBellDropdown({
  align = "end",
  buttonClassName,
  iconClassName,
}) {
  const [session, setSession] = useState(() => base44.fan.getStoredSession());
  const [seenAlerts, setSeenAlerts] = useState(() =>
    readSeenAlerts(base44.fan.getStoredSession().userId),
  );
  const isJoined = Boolean(session.userId && session.token);

  useEffect(() => {
    const syncSession = () => {
      setSession(base44.fan.getStoredSession());
    };

    syncSession();
    window.addEventListener("focus", syncSession);
    window.addEventListener("storage", syncSession);
    return () => {
      window.removeEventListener("focus", syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  useEffect(() => {
    setSeenAlerts(readSeenAlerts(session.userId));
  }, [session.userId]);

  const { data: profiles = [] } = useQuery({
    queryKey: ["topbar-fan-profile", session.userId],
    queryFn: () =>
      base44.entities.FanProfile.filter(
        { user_id: session.userId },
        "-updated_date",
        5,
      ),
    enabled: isJoined,
  });

  const { data: predictions = [] } = useQuery({
    queryKey: ["topbar-fan-predictions", session.userId],
    queryFn: () =>
      base44.entities.FanPrediction.filter(
        { user_id: session.userId },
        "-prediction_date",
        25,
      ),
    enabled: isJoined,
  });

  const { data: votes = [] } = useQuery({
    queryKey: ["topbar-fan-votes", session.userId],
    queryFn: () =>
      base44.entities.FanPollVote.filter(
        { user_id: session.userId },
        "-created_date",
        50,
      ),
    enabled: isJoined,
  });

  const { data: savedMatches = [] } = useQuery({
    queryKey: ["topbar-saved-matches", session.userId],
    queryFn: () =>
      base44.entities.SavedMatch.filter(
        { user_id: session.userId },
        "-created_date",
        60,
      ),
    enabled: isJoined,
  });

  const { data: fantasySquads = [] } = useQuery({
    queryKey: ["topbar-fantasy-squads", session.userId],
    queryFn: () =>
      base44.entities.FantasySquad.filter(
        { user_id: session.userId },
        "-created_date",
        30,
      ),
    enabled: isJoined,
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ["topbar-leaderboard"],
    queryFn: () => base44.entities.FanProfile.list("-total_points", 100),
    enabled: isJoined,
  });

  const leaderboardRank = useMemo(() => {
    if (!session.userId) return null;
    const index = leaderboard.findIndex(
      (entry) => entry.user_id === session.userId,
    );
    return index >= 0 ? index + 1 : null;
  }, [leaderboard, session.userId]);

  const allNotifications = useMemo(
    () =>
      buildNotifications({
        leaderboardRank,
        favoriteTeam: profiles[0]?.favorite_team,
        pendingPredictions: predictions.filter(
          (entry) => entry.status !== "settled",
        ).length,
        votesCount: votes.length,
        savedMatchesCount: savedMatches.length,
        fantasySquadsCount: fantasySquads.length,
      }),
    [
      fantasySquads.length,
      leaderboardRank,
      predictions,
      profiles,
      savedMatches.length,
      votes.length,
    ],
  );
  const notifications = useMemo(
    () =>
      allNotifications.filter(
        (item) => !seenAlerts.has(getAlertSeenKey(item)),
      ),
    [allNotifications, seenAlerts],
  );

  const badgeCount = notifications.length;
  const clearSeenAlerts = () => {
    const nextSeenAlerts = new Set([
      ...seenAlerts,
      ...allNotifications.map(getAlertSeenKey),
    ]);
    setSeenAlerts(nextSeenAlerts);
    writeSeenAlerts(session.userId, nextSeenAlerts);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={buttonClassName}
          aria-label="Open alerts"
        >
          <span className="relative inline-flex">
            <Bell className={iconClassName} strokeWidth={2.2} />
            {badgeCount > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-4 text-white">
                {badgeCount}
              </span>
            ) : null}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        sideOffset={10}
        className="w-[22rem] rounded-[24px] border-[#eadfce] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(247,241,234,0.96))] p-0 shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
      >
        <div className="border-b border-[#eadfce] px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bell className="size-3.5 text-primary" />
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8a7866]">
                Notification center
              </p>
            </div>
            {isJoined && allNotifications.length > 0 ? (
              <button
                type="button"
                onClick={clearSeenAlerts}
                className="rounded-full border border-[#eadfce] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a7866] transition-colors hover:border-primary/30 hover:text-primary"
              >
                Clear seen
              </button>
            ) : null}
          </div>
        </div>

        {!isJoined ? (
          <div className="px-4 py-8 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bell className="size-5" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">
              Join the fan profile to unlock alerts.
            </p>
            <p className="mt-2 text-[12px] leading-5 text-slate-400">
              Your saved picks, votes, and profile activity will start showing here.
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bell className="size-5" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">
              Fan activity alerts will appear here.
            </p>
            <p className="mt-2 text-[12px] leading-5 text-slate-400">
              Once you vote, save matches, or settle predictions, this stream turns live.
            </p>
          </div>
        ) : (
          <div className="max-h-[24rem] divide-y divide-[#eadfce] overflow-y-auto">
            {notifications.map((item) => {
              const Icon = ICONS[item.type] || ICONS.general;
              return (
                <div key={item.id} className="flex gap-3 px-4 py-3.5">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[12px] leading-5 text-slate-500">
                      {item.body}
                    </p>
                    {item.meta ? (
                      <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                        {item.meta}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
