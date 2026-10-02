import React from "react";
import { Shell } from "@/components/landing/sections/Shell";
import { LANDING_FEATURE_CARDS } from "@/components/landing/utils/landingConstants";
import { SoftCard } from "@/components/landing/sections/SoftCard";

export function WhyCoreSection() {
  return (
    <Shell
      id="why"
      eyebrow="Why Core"
      title="Three product surfaces. One system behind them."
      body="The landing page tells the story, the desktop app handles depth, and the mobile app carries the fast matchday layer."
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {LANDING_FEATURE_CARDS.map((card) => (
          <SoftCard key={card.title} className="p-5 sm:p-6">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-mint-mist text-brand-mint-deep">
              <card.icon className="size-5" />
            </div>
            <h3 className="mt-5 text-[1.35rem] font-semibold leading-tight tracking-[-0.04em] text-brand-ink-pure">
              {card.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-brand-slate-stone">
              {card.body}
            </p>
          </SoftCard>
        ))}
      </div>
    </Shell>
  );
}
