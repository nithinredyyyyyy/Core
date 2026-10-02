import React from "react";
import TeamIdentity from "@/components/shared/TeamIdentity";

export function EventBriefBody({ tournament, spotlightStage, allocations }) {
  return (
    <div className="space-y-4">
      {tournament.format_overview && (
        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{tournament.format_overview}</p>
      )}
      {tournament.status !== "completed" && spotlightStage?.summary && (
        <div className="rounded-xl border border-border bg-background/80 px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-primary">Current Stage</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {spotlightStage.summary}
          </p>
        </div>
      )}
      {allocations.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-[10px] uppercase tracking-wider text-amber-300">International Slots</p>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {allocations.map((allocation) => (
              <div
                key={`${allocation.title}-${allocation.event}`}
                className="rounded-xl border border-amber-500/20 bg-background/70 px-4 py-3 flex items-center gap-4 relative overflow-hidden"
              >
                <div className="flex-1 relative z-10">
                  <p className="text-[10px] uppercase tracking-wider text-amber-300">{allocation.title}</p>
                  <p className="mt-1 font-semibold text-foreground">{allocation.event}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{allocation.detail}</p>
                </div>
                {allocation.qualifiedTeam && (
                  <div className="flex shrink-0 items-center justify-end relative z-10 pr-2">
                    <TeamIdentity
                      name={allocation.qualifiedTeam}
                      plain
                      hideText
                      containerClassName="!size-20"
                      logoClassName="!w-20 !h-20 object-contain drop-shadow-xl"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
