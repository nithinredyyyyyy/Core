import React from "react";
import { Link } from "react-router-dom";
import TeamIdentity from "@/components/shared/TeamIdentity";
import { Shell } from "@/components/landing/sections/Shell";
import { SoftCard } from "@/components/landing/sections/SoftCard";

export function PlatformPreviewSection({ boardLeaders }) {
  return (
    <Shell
      id="platform"
      eyebrow="Platform preview"
      title="Designed to feel like a product, not one overloaded homepage."
      body="This side previews the desktop and mobile experiences without forcing the landing page to behave like a dashboard."
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.04fr_0.96fr]">
        <SoftCard className="overflow-hidden bg-[linear-gradient(180deg,var(--brand-ink-soft)_0%,var(--brand-ink-soft-3)_100%)] p-5 text-white sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/68">
                Desktop app
              </p>
              <h3 className="mt-3 text-[2rem] font-semibold leading-[0.96] tracking-[-0.05em] text-white">
                Deep standings, teams, matches, and tournament control.
              </h3>
            </div>
            <Link
              to="/app"
              className="hidden rounded-full bg-white px-4 py-2 text-xs font-semibold text-brand-ink-pure sm:inline-flex"
            >
              Open app
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {boardLeaders.length > 0 ? (
              boardLeaders.map((team) => (
                <div
                  key={`${team.rank}-${team.teamName}`}
                  className="flex items-center gap-4 rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3.5"
                >
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-white/[0.08] text-sm font-bold text-white">
                    {team.rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <TeamIdentity
                      name={team.logoName || team.teamName}
                      className="truncate text-sm font-semibold text-white"
                    />
                    <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/68">
                      {team.status} • {team.wwcd} WWCD
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-brand-mint">
                      {team.points}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/62">
                      points
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-white/10 bg-white/[0.05] p-4 text-sm text-white/76">
                Tournament board data is syncing into the desktop preview.
              </div>
            )}
          </div>
        </SoftCard>

        <div className="grid grid-cols-1 gap-4">
          <SoftCard className="p-5 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-slate-gray">
              Mobile app
            </p>
            <div className="mt-4 rounded-[26px] bg-[linear-gradient(180deg,var(--brand-mint-fog-2)_0%,var(--brand-mint-mist)_100%)] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-mint-deep">
                Matchday mobile
              </p>
              <p className="mt-3 text-[1.6rem] font-semibold leading-[0.96] tracking-[-0.05em] text-brand-ink-pure">
                Faster matchday flow for the live season.
              </p>
              <p className="mt-3 text-sm leading-7 text-brand-mint-dune">
                Countdown hero, live board strip, live-match pulse, and
                alerts without the density of the desktop experience.
              </p>
            </div>
          </SoftCard>

          <SoftCard className="p-5 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-slate-gray">
              Landing logic
            </p>
            <p className="mt-3 text-[1.35rem] font-semibold leading-tight tracking-[-0.04em] text-brand-ink-pure">
              Brand first. Product second. Depth where it belongs.
            </p>
            <p className="mt-3 text-sm leading-7 text-brand-slate-stone">
              This page is now for discovery and trust, not for dropping
              every operational module above the fold.
            </p>
          </SoftCard>
        </div>
      </div>
    </Shell>
  );
}
