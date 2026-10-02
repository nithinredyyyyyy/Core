import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Download, Sparkles, Waves } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import { SoftCard } from "@/components/landing/sections/SoftCard";
import { MiniPreview } from "@/components/landing/sections/MiniPreview";

export function LandingHero({ featuredTournament, featuredStages, featuredFacts, isInstallable, promptInstall }) {
  return (
    <section className="marquee-hero">
      <div className="marquee-inner">
        <div className="marquee-content">
          <div className="marquee-copy">
            <div className="type-kicker inline-flex items-center gap-2 rounded-full border border-brand-cream-edge bg-white px-3 py-1.5 text-brand-slate-bone">
              <Sparkles className="size-3.5 text-brand-mint" />
              Premium esports platform
            </div>

            <h1 className="type-display-hero mt-6 text-[var(--marquee-text)]">
              A smarter esports system for fans,
              <span className="ml-2 inline">
                organizers
              </span>
            </h1>

            <p className="type-body mt-5 max-w-2xl text-[var(--marquee-text)]">
              Core helps you follow the live Indian esports season with
              one cleaner layer for tournaments, standings, team tracking,
              and editorial updates.
            </p>

            <div className="mt-7 flex justify-center flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            to="/app"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-ink-pure px-6 py-3 text-sm font-semibold text-white"
          >
                Open desktop app <ArrowRight className="size-4" />
              </Link>
                {isInstallable && (
                <button
                  type="button"
                  onClick={promptInstall}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-cream-line bg-white px-6 py-3 text-sm font-semibold text-brand-ink-pure"
                >
                  Install mobile app <Download className="size-4" />
                </button>
                )}
              <Link
                  to="/signin"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-cream-line bg-white px-6 py-3 text-sm font-semibold text-brand-ink-pure"
                >
                  Admin sign in <Waves className="size-4" />
                </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MiniPreview
                step="Step 1"
                title="Track every major event"
                body="Tournament flows, stage windows, and bracket pressure in one place."
                accent="mint"
              />
              <MiniPreview
                step="Step 2"
                title="See the live board move"
                body="Standings, match count, points swings, and team momentum without clutter."
                accent="peach"
              />
              <MiniPreview
                step="Step 3"
                title="Stay matchday-ready"
                body="Fast routes to live boards, team pages, and editorial coverage when matchday speeds up."
                accent="ink"
              />
            </div>
          </div>

          <div className="marquee-preview grid grid-cols-1 gap-4">
            <SoftCard className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-slate-gray">
                    Featured circuit
                  </p>
                  <h2 className="mt-3 text-[1.8rem] font-semibold leading-[0.96] tracking-[-0.05em] text-brand-ink-pure">
                    {featuredTournament?.name || "Current event loading"}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-brand-slate-stone">
                    {featuredStages[0]?.name
                      ? `${featuredStages[0].name} is currently in focus across the platform.`
                      : "The current circuit headline will appear here once the event feed syncs."}
                  </p>
                </div>
                {featuredTournament?.status ? (
                  <StatusBadge status={featuredTournament.status} />
                ) : null}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {(featuredFacts || []).slice(0, 3).map((fact) => (
                  <div
                    key={fact.label}
                    className="rounded-[22px] border border-brand-cream-fog bg-brand-cream-paper px-4 py-3"
                  >
                    <p className="text-[10px] uppercase tracking-[0.18em] text-brand-slate-gray">
                      {fact.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold tracking-[-0.02em] text-brand-ink-pure">
                      {fact.value}
                    </p>
                  </div>
                ))}
              </div>
            </SoftCard>

            <SoftCard className="p-5 sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-slate-gray">
                Platform split
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3">
                <div className="rounded-[22px] border border-brand-cream-fog bg-brand-cream-paper p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-mint">
                    Landing page
                  </p>
                  <p className="mt-2 text-lg font-semibold text-brand-ink-pure">
                    Brand-first and easier to scan
                  </p>
                </div>
                <div className="rounded-[22px] border border-brand-cream-fog bg-brand-cream-paper p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-mint">
                    Desktop app
                  </p>
                  <p className="mt-2 text-lg font-semibold text-brand-ink-pure">
                    Operational control for deep use
                  </p>
                </div>
                <div className="rounded-[22px] border border-brand-cream-fog bg-brand-cream-paper p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-mint">
                    Mobile app
                  </p>
                  <p className="mt-2 text-lg font-semibold text-brand-ink-pure">
                    Faster matchday actions and alerts
                  </p>
                </div>
              </div>
            </SoftCard>
          </div>
        </div>
      </div>
    </section>
  );
}
