import React from "react";
import { getStatusLabel, getStatusMeta } from "@/lib/status";
import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  live: "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  neutral: "border-border bg-muted text-muted-foreground",
  danger:
    "border-destructive/40 bg-destructive/10 text-destructive dark:text-red-400",
  warning:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

/**
 * Status pill for matches, tournaments, stages, and articles.
 * LIVE states always carry a pulsing marker plus the literal word "LIVE", so
 * status is never communicated through colour alone.
 */
export default function StatusBadge({
  status,
  className = "",
  showMarker = true,
  size = "md",
}) {
  const meta = getStatusMeta(status);
  const label = getStatusLabel(status);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border font-bold uppercase tracking-[0.14em]",
        size === "sm" ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]",
        TONE_CLASSES[meta.tone] || TONE_CLASSES.neutral,
        className,
      )}
    >
      {showMarker && meta.marker === "pulse" ? (
        <span className="relative flex size-1.5" aria-hidden="true">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-70 motion-reduce:animate-none" />
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      ) : null}
      {showMarker && meta.marker === "dot" ? (
        <span
          className="size-1.5 rounded-full bg-current opacity-70"
          aria-hidden="true"
        />
      ) : null}
      {label}
    </span>
  );
}
