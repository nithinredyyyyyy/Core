import React from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Rank movement indicator. Movement is only shown when the backend actually
 * reports a delta — a missing/zero delta renders a neutral dash rather than a
 * fabricated arrow. Never colour-only: the arrow icon and label both change.
 */
export default function RankingMovement({ value, className = "" }) {
  const delta = Number(value);
  const hasMovement = Number.isFinite(delta) && delta !== 0;

  if (!hasMovement) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs text-muted-foreground",
          className,
        )}
        title="No movement since the last update"
      >
        <Minus className="size-3.5" aria-hidden="true" />
        <span>—</span>
        <span className="sr-only">No movement</span>
      </span>
    );
  }

  const rising = delta > 0;
  const Icon = rising ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold",
        rising ? "text-emerald-500" : "text-rose-500",
        className,
      )}
      title={rising ? `Up ${delta} place${delta === 1 ? "" : "s"}` : `Down ${Math.abs(delta)} place${Math.abs(delta) === 1 ? "" : "s"}`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      <span>{rising ? `▲${delta}` : `▼${Math.abs(delta)}`}</span>
      <span className="sr-only">
        {rising ? `moved up ${delta}` : `moved down ${Math.abs(delta)}`} places
      </span>
    </span>
  );
}
