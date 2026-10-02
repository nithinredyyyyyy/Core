import React from "react";

export function EmptyResultsNotice() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
      This match does not have a resolved team scope yet. Fix the tournament participants or BMPS stage mapping before entering results.
    </div>
  );
}
