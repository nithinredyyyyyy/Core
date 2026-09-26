import React from "react";
import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  primary: "border-primary/20 bg-primary/10 text-primary",
  neutral: "border-border bg-muted text-muted-foreground",
  live: "border-red-500/30 bg-red-500/10 text-red-500",
  positive: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

/** Compact metric tile used by dashboards, profiles, and tournament overviews. */
export default function StatCard({
  icon: Icon,
  label,
  value,
  hint = null,
  tone = "primary",
  className = "",
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-heading text-2xl font-bold tabular-nums tracking-[-0.02em] text-foreground">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        {Icon ? (
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg border",
              TONE_CLASSES[tone] || TONE_CLASSES.primary,
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
    </div>
  );
}
