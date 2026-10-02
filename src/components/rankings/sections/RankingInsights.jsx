import React from "react";
import { Activity } from "lucide-react";
import { INSIGHT_ICONS } from "@/components/rankings/utils/rankingHelpers";

export function RankingInsights({ insights = [] }) {
  return (
    <div className="mb-12 mt-16">
      <h2 className="mb-6 text-2xl font-black">Ranking Insights</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {insights.map((insight) => {
          const Icon = INSIGHT_ICONS[insight.tone] || Activity;
          const colorClass =
            insight.tone === "green"
              ? "text-green-500"
              : insight.tone === "amber"
                ? "text-amber-500"
                : "text-blue-500";
          return (
            <div
              key={insight.title}
              className="flex items-start gap-4 rounded-[24px] border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className={`rounded-2xl bg-secondary p-3 ${colorClass}`}>
                <Icon className="size-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {insight.title}
                </p>
                <p className="mt-1 text-xl font-black text-foreground">{insight.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{insight.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
