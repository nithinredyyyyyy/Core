import React from "react";
import { BarChart3 } from "lucide-react";
import FansPanel from "./FansPanel";

export default function FanPolls({
  sections = [],
  pollResults = [],
  pollPick,
  onVote,
  userVoteCount,
}) {
  return (
    <FansPanel className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[#d9e1ef] px-5 py-3.5">
        <BarChart3 className="h-3.5 w-3.5 text-violet-500" />
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7b8dab]">Live polls</p>
      </div>

      <div className="divide-y divide-[#d9e1ef]">
        {sections.map((section) => (
          <div key={section.title} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[14px] font-black text-slate-900">{section.title}</p>
              {section.interactive ? (
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-violet-600">
                  Fan vote
                </span>
              ) : null}
            </div>

            <div className="mt-3.5 space-y-2">
              {section.options.map((option, optionIndex) => {
                const active = section.interactive && pollPick === option;
                const livePercent = section.interactive
                  ? pollResults.find((entry) => entry.option === option)?.percent || 0
                  : section.percentages?.[optionIndex] || 0;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      if (section.interactive) onVote(option);
                    }}
                    className={`relative w-full overflow-hidden rounded-[14px] border px-3.5 py-2.5 text-left text-[12px] font-bold uppercase transition-all ${
                      active
                        ? "border-violet-300 bg-violet-50 text-violet-600"
                        : "border-slate-200 bg-white text-slate-900"
                    } ${section.interactive ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <span
                      className={`absolute inset-y-0 left-0 rounded-[12px] ${active ? "bg-violet-100" : "bg-slate-100/90"}`}
                      style={{ width: `${livePercent}%` }}
                    />
                    <span className="relative z-10 flex items-center justify-between gap-3">
                      <span>{option}</span>
                      <span className="text-[10px]">{livePercent}%</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {section.interactive ? (
              <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-[#8b9ab6]">
                {userVoteCount > 0 ? "Your vote is locked for this pulse." : "Tap one option to lock your take."}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </FansPanel>
  );
}
