import React from "react";

export function RankingRules() {
  return (
    <div className="mb-12 mt-12 rounded-[24px] border border-border bg-brand-ink-char p-6 shadow-sm md:p-8">
      <h3 className="mb-2 text-xl font-bold text-amber-500">How the Rankings Work</h3>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground md:text-base">
        The KIE Global Leaderboard highlights the most consistent teams and players based on
        their performance in Grand Finals, with points earned through placement, finishes, and
        special awards.
      </p>
      <h3 className="mb-2 text-xl font-bold text-amber-500">Decay System</h3>
      <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
        Points remain at full value for six months, then decay gradually so current form matters
        more than legacy results.
      </p>
    </div>
  );
}
