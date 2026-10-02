import React from "react";
import StatusBadge from "@/components/shared/StatusBadge";
import { Shell } from "@/components/landing/sections/Shell";
import { SoftCard } from "@/components/landing/sections/SoftCard";

export function CircuitPulseSection({ featuredTournament, featuredStages, upcomingMatches, latestNews }) {
  return (
    <Shell
      id="circuit"
      eyebrow="Circuit pulse"
      title="Still alive with the current season."
      body="The landing page previews the live circuit, but it stays curated and readable instead of becoming a desktop dashboard clone."
    >
      <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <SoftCard className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-brand-slate-gray">
                Featured stage
              </p>
              <h3 className="mt-3 text-[1.8rem] font-semibold leading-[0.96] tracking-[-0.05em] text-brand-ink-pure">
                {featuredStages[0]?.name || "Stage preview pending"}
              </h3>
            </div>
            {featuredTournament?.status ? (
              <StatusBadge status={featuredTournament.status} />
            ) : null}
          </div>
          <p className="mt-4 text-sm leading-7 text-brand-slate-stone">
            {featuredStages[0]?.week
              ? `${featuredStages[0].week} is the active schedule window in the current circuit focus.`
              : "As soon as the circuit schedule locks, this preview will show the active window."}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-brand-cream-fog bg-brand-cream-paper px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-brand-slate-gray">
                Upcoming matches
              </p>
              <p className="mt-2 text-[1.9rem] font-bold tracking-[-0.05em] text-brand-ink-pure">
                {upcomingMatches.length}
              </p>
            </div>
            <div className="rounded-[22px] border border-brand-cream-fog bg-brand-cream-paper px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-brand-slate-gray">
                Live updates
              </p>
              <p className="mt-2 text-[1.9rem] font-bold tracking-[-0.05em] text-brand-ink-pure">
                {latestNews.length}
              </p>
            </div>
          </div>
        </SoftCard>

        <SoftCard className="p-5 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.18em] text-brand-slate-gray">
            Stage map
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {featuredStages.length > 0 ? (
              featuredStages.slice(0, 6).map((stage) => (
                <div
                  key={stage.key}
                  className="rounded-[22px] border border-brand-cream-fog bg-brand-cream-paper px-4 py-3.5"
                >
                  <p className="text-sm font-semibold text-brand-ink-pure">
                    {stage.name}
                  </p>
                  {stage.status ? (
                    <div className="mt-2">
                      <StatusBadge status={stage.status} />
                    </div>
                  ) : null}
                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-slate-gray">
                    {stage.week || "Window pending"}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-brand-cream-fog bg-brand-cream-paper p-4 text-sm text-brand-slate-stone">
                Stage cards will appear here once the tournament data syncs.
              </div>
            )}
          </div>
        </SoftCard>
      </div>
    </Shell>
  );
}
