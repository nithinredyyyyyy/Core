import React from "react";
import { Crown } from "lucide-react";
import FansPanel from "./FansPanel";

export default function FanLeaderboard({ profiles = [] }) {
  return (
    <FansPanel className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[#d9e1ef] px-4 py-3.5">
        <Crown className="h-3.5 w-3.5 text-amber-500" />
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7b8dab]">Fan leaderboard</p>
      </div>
      <div className="space-y-2 px-3 py-3">
        {profiles.slice(0, 2).map((entry) => (
          <div
            key={`${entry.display_name}-${entry.rank}`}
            className={`rounded-[16px] border px-3 py-3 ${
              entry.isYou ? "border-violet-200 bg-violet-50" : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-lg font-black text-amber-500">
                  {entry.rank}
                </div>
                <div>
                  <p className="text-[15px] font-black tracking-[-0.03em] text-slate-900">
                    {entry.display_name}
                    {entry.isYou ? <span className="ml-1.5 text-[11px] uppercase text-violet-600">You</span> : null}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {entry.badge} • {entry.accuracy_percent}% acc
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-violet-600">{entry.total_points}</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">pts</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </FansPanel>
  );
}
