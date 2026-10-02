import React from "react";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";

export function RecentUpdates({ updates = [] }) {
  return (
    <div className="rounded-[24px] border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-black">
        <Activity className="size-5 text-primary" /> Live Updates
      </h3>
      <div className="space-y-4">
        {updates.map((update) => (
          <div
            key={update.id}
            className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-secondary">
                {update.type === "up" && <TrendingUp className="size-4 text-green-500" />}
                {update.type === "down" && <TrendingDown className="size-4 text-red-500" />}
                {update.type === "neutral" && <Minus className="size-4 text-muted-foreground" />}
              </div>
              <p className="text-sm font-medium">{update.text}</p>
            </div>
            <span className="text-xs text-muted-foreground">{update.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
