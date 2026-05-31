import React from "react";
import { Crown } from "lucide-react";
import FansPanel from "./FansPanel";
import { normalizeBadgeName } from "@/lib/fanBadges";

const EMPTY_PROFILES = [];

export default function FanLeaderboard({ profiles = EMPTY_PROFILES }) {
  return (
    <FansPanel className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(255,255,255,0.08))] p-4">
        <Crown className="size-3.5 text-amber-500" />
        <p className="type-kicker text-primary">
          Fan leaderboard
        </p>
      </div>
      <div className="space-y-3 p-4">
        {profiles.slice(0, 3).map((entry, index) => (
          <div
            key={`${entry.display_name}-${entry.rank}`}
            className={`rounded-[18px] border p-4 ${
              entry.isYou
                ? "border-primary/25 bg-primary/10 shadow-[0_16px_30px_rgba(251,146,60,0.1)]"
                : "border-border/70 bg-white/90 dark:bg-white/[0.04]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`flex size-10 items-center justify-center rounded-2xl text-base font-black ${
                  index === 0
                    ? "bg-amber-100 text-amber-600"
                    : index === 1
                      ? "bg-slate-200 text-slate-700"
                      : "bg-orange-100 text-orange-600"
                }`}>
                  {entry.rank}
                </div>
                <div>
                  <p className="type-title-md text-slate-900 dark:text-white">
                    {entry.display_name}
                    {entry.isYou ? (
                      <span className="ml-1.5 text-[11px] uppercase tracking-[0.12em] text-primary">
                        You
                      </span>
                    ) : null}
                  </p>
                  <p className="type-caption mt-1 text-slate-500 dark:text-slate-400">
                    {normalizeBadgeName(entry.badge)} | {entry.accuracy_percent}% acc
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="type-title-lg text-primary">
                  {entry.total_points}
                </p>
                <p className="type-kicker text-slate-500 dark:text-slate-400">
                  pts
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </FansPanel>
  );
}
