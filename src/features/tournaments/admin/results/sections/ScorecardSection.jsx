import React from "react";

export function ScorecardSection({ scorecardTotals, entryScorecard }) {
  return (
    <div className="mx-4 mb-4 rounded-xl border border-border bg-secondary/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold">Live standings</h4>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Published match points stay in this table, and the next match entry adds on top instantly.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-border bg-background px-3 py-1">
            {scorecardTotals.placedTeams}/16 teams placed
          </span>
          <span className="rounded-full border border-border bg-background px-3 py-1">
            {scorecardTotals.kills} kills
          </span>
          <span className="rounded-full border border-border bg-background px-3 py-1">
            {scorecardTotals.totalPoints} standings pts
          </span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        {entryScorecard.map((entry) => (
          <div
            key={`scorecard-${entry.team_id}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  {entry.scorecardRank}
                </span>
                <p className="truncate font-medium">{entry.team_name}</p>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Published {entry.baseline_total_points || 0} pts • Current #{entry.placement || "-"} • {entry.kill_points || 0} kills
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{entry.total_points_combined || 0}</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Standings total</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
