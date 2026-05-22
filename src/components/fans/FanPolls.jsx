import React from "react";
import { BarChart3 } from "lucide-react";
import FansPanel from "./FansPanel";

const EMPTY_SECTIONS = [];

export default function FanPolls({ sections = EMPTY_SECTIONS, onVote }) {
  return (
    <FansPanel className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border/70 px-5 py-3.5">
        <BarChart3 className="size-3.5 text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
          Live pulse
        </p>
      </div>

      <div className="divide-y divide-border/70">
        {sections.map((section) => (
          <div key={section.title} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[14px] font-black text-slate-900">
                  {section.title}
                </p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  {section.description ||
                    (section.interactive
                      ? "Lock one call before the match tone shifts."
                      : "Live signal shaped by the current tournament data.")}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] ${section.interactive ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500"}`}
              >
                {section.badgeLabel ||
                  (section.interactive ? "Fan vote" : "Stats")}
              </span>
            </div>

            <div className="mt-3.5 space-y-2">
              {section.options.map((option, optionIndex) => {
                const active =
                  section.interactive && section.userPick === option;
                const livePercent = section.interactive
                  ? section.results?.find((entry) => entry.option === option)
                      ?.percent || 0
                  : section.percentages?.[optionIndex] || 0;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      if (section.interactive) onVote(section.pollKey, option);
                    }}
                    className={`relative w-full overflow-hidden rounded-[14px] border px-3.5 py-3 text-left text-[12px] font-bold uppercase transition-all ${
                      active
                        ? "border-primary/25 bg-primary/10 text-primary shadow-[0_8px_18px_rgba(251,146,60,0.12)]"
                        : "border-slate-200 bg-white text-slate-900"
                    } ${section.interactive ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <span
                      className={`absolute inset-y-0 left-0 rounded-[12px] ${active ? "bg-primary/15" : "bg-slate-100/90"}`}
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
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#8b9ab6]">
                  {section.userVoteCount > 0
                    ? "Your call is locked for this match pulse."
                    : "Tap one option to lock your read."}
                </p>
                {section.userPick ? (
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
                    Your pick: {section.userPick}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </FansPanel>
  );
}
