import React from "react";
import { Trophy } from "lucide-react";
import SectionHeader from "@/components/shared/SectionHeader";
import TeamLogo from "@/components/shared/TeamLogo";
import EmptyState from "@/components/shared/EmptyState";

/**
 * Standings preview for the headline tournament. Renders the server-computed
 * board when it exists; otherwise a meaningful empty state.
 */
export default function StandingsPreview({ standings }) {
  const rows = standings?.rows || [];
  const boardLink = standings?.tournamentId
    ? `/leaderboard?tournament=${encodeURIComponent(standings.tournamentId)}`
    : "/leaderboard";

  return (
    <section>
      <SectionHeader
        title="Standings"
        description={standings?.title || "Current tournament board"}
        actionLabel="Full board"
        actionTo={boardLink}
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Trophy}
          className="mt-4"
          title="No standings yet"
          description="Standings appear once official match results are published for the current event."
          actionLabel="View rankings"
          actionTo="/rankings"
        />
      ) : (
        <ol className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {rows.map((row) => (
            <li
              key={`${row.rank}-${row.teamName}`}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-black tabular-nums text-foreground">
                {row.rank}
              </span>
              <TeamLogo name={row.logoName || row.teamName} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                {row.teamName}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {row.wwcd ?? 0} WWCD
              </span>
              <span className="w-14 shrink-0 text-right font-heading text-sm font-black tabular-nums text-primary">
                {row.points ?? 0}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
