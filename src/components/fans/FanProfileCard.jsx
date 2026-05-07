import React from "react";
import { Award, Crosshair, Star, Target } from "lucide-react";
import FansPanel from "./FansPanel";
import { BADGE_RULES, getBadgeForPoints, getNextBadge } from "./BadgeDisplay";

export default function FanProfileCard({
  profile,
  user,
  leaderboardRank,
  favoriteTeam,
}) {
  const points = Number(profile?.total_points || 0);
  const nextBadge = getNextBadge(points);
  const currentBadge = profile?.badge || getBadgeForPoints(0);
  const currentBadgeMin =
    BADGE_RULES.find((rule) => rule.label === currentBadge)?.min || 0;
  const nextBadgeMin = nextBadge?.min || currentBadgeMin;
  const progressSpan = Math.max(1, nextBadgeMin - currentBadgeMin);
  const progressValue = nextBadge
    ? Math.max(0, Math.min(100, ((points - currentBadgeMin) / progressSpan) * 100))
    : 100;

  return (
    <FansPanel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-violet-100 text-2xl font-black text-violet-600">
            {user?.displayName?.slice(0, 1) || "F"}
          </div>
          <div>
            <h2 className="text-[1.1rem] font-black tracking-[-0.03em] text-slate-900">
              {user?.displayName}
            </h2>
            <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-orange-300 bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-500">
              <Award className="h-3 w-3" />
              {currentBadge}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[1.9rem] font-black leading-none text-violet-600">{points}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">Pts</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <div className="rounded-[16px] bg-slate-50 px-3 py-3.5 text-center">
          <Target className="mx-auto h-3.5 w-3.5 text-slate-500" />
          <p className="mt-2.5 text-[1.7rem] font-black leading-none text-slate-900">
            {Math.round(profile?.accuracy_percent || 0)}%
          </p>
          <p className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-500">Accuracy</p>
        </div>
        <div className="rounded-[16px] bg-slate-50 px-3 py-3.5 text-center">
          <Star className="mx-auto h-3.5 w-3.5 text-slate-500" />
          <p className="mt-2.5 text-[1.7rem] font-black leading-none text-slate-900">
            {profile?.correct_predictions || 0}
          </p>
          <p className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-500">Correct</p>
        </div>
        <div className="rounded-[16px] bg-slate-50 px-3 py-3.5 text-center">
          <Crosshair className="mx-auto h-3.5 w-3.5 text-slate-500" />
          <p className="mt-2.5 text-[1.7rem] font-black leading-none text-slate-900">
            {profile?.predictions_count || 0}
          </p>
          <p className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-500">Total</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] text-slate-500">
            Progress to {nextBadge?.label || "Max"}
          </p>
          <p className="text-[12px] font-bold text-violet-600">
            {points - currentBadgeMin} / {nextBadge ? nextBadge.min - currentBadgeMin : points} pts
          </p>
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-violet-500" style={{ width: `${progressValue}%` }} />
        </div>
        <p className="mt-2.5 text-[11px] text-slate-500">
          Favorite team: <span className="font-semibold text-slate-700">{favoriteTeam || "Not selected yet"}</span>
          {leaderboardRank ? <span> • Rank #{leaderboardRank}</span> : null}
        </p>
      </div>
    </FansPanel>
  );
}
