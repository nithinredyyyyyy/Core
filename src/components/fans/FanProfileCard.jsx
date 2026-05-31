import React from "react";
import { Crosshair, Star, Target } from "lucide-react";
import FanBadgeEmblem from "./FanBadgeEmblem";
import FansPanel from "./FansPanel";
import { BADGE_RULES, getBadgeForPoints, getNextBadge } from "./BadgeDisplay";
import { normalizeBadgeName } from "@/lib/fanBadges";

export default function FanProfileCard({
  profile,
  user,
  leaderboardRank,
  favoriteTeam,
}) {
  const points = Number(profile?.total_points || 0);
  const nextBadge = getNextBadge(points);
  const currentBadge = normalizeBadgeName(profile?.badge || getBadgeForPoints(0));
  const currentBadgeMin =
    BADGE_RULES.find((rule) => rule.label === currentBadge)?.min || 0;
  const nextBadgeMin = nextBadge?.min || currentBadgeMin;
  const progressSpan = Math.max(1, nextBadgeMin - currentBadgeMin);
  const progressValue = nextBadge
    ? Math.max(
        0,
        Math.min(100, ((points - currentBadgeMin) / progressSpan) * 100),
      )
    : 100;

  return (
    <FansPanel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-11 items-center justify-center rounded-[12px] bg-[linear-gradient(135deg,rgba(251,146,60,0.16),rgba(255,255,255,0.98))] text-2xl font-black text-primary">
            {user?.displayName?.slice(0, 1) || "F"}
          </div>
          <div>
            <h2 className="text-[1.1rem] font-semibold tracking-[-0.03em] text-slate-900">
              {user?.displayName}
            </h2>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              Your profile updates automatically as predictions settle and
              community actions stack up.
            </p>
            <div className="mt-3">
              <FanBadgeEmblem badge={currentBadge} compact />
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[1.9rem] font-black leading-none text-primary">
            {points}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Pts
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <div className="rounded-[16px] bg-slate-50 p-3.5 text-center">
          <Target className="mx-auto size-3.5 text-slate-500" />
          <p className="mt-2.5 text-[1.7rem] font-black leading-none text-slate-900">
            {Math.round(profile?.accuracy_percent || 0)}%
          </p>
          <p className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Accuracy
          </p>
        </div>
        <div className="rounded-[16px] bg-slate-50 p-3.5 text-center">
          <Star className="mx-auto size-3.5 text-slate-500" />
          <p className="mt-2.5 text-[1.7rem] font-black leading-none text-slate-900">
            {profile?.correct_predictions || 0}
          </p>
          <p className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Correct
          </p>
        </div>
        <div className="rounded-[16px] bg-slate-50 p-3.5 text-center">
          <Crosshair className="mx-auto size-3.5 text-slate-500" />
          <p className="mt-2.5 text-[1.7rem] font-black leading-none text-slate-900">
            {profile?.predictions_count || 0}
          </p>
          <p className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Total
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] text-slate-500">
            Progress to {nextBadge?.label || "Max"}
          </p>
          <p className="text-[12px] font-bold text-primary">
            {points - currentBadgeMin} /{" "}
            {nextBadge ? nextBadge.min - currentBadgeMin : points} pts
          </p>
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${progressValue}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Favorite team: {favoriteTeam || "Not selected yet"}
          </span>
          {leaderboardRank ? (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              Rank #{leaderboardRank}
            </span>
          ) : null}
        </div>
      </div>
    </FansPanel>
  );
}
