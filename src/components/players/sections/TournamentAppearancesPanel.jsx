import React from "react";
import { Link } from "react-router-dom";
import ProfilePanel from "@/components/shared/ProfilePanel";
import { formatProfileDate } from "@/components/players/utils/playerProfileHelpers";

export function TournamentAppearancesPanel({ tournaments }) {
  return (
    <ProfilePanel title="Tournament appearances">
      {tournaments.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No tournament appearances have been mapped for this player yet.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {tournaments.map((entry) => (
            <Link
              key={`${entry.id}-${entry.phase}`}
              to={`/tournaments?id=${entry.id}`}
              className="block rounded-[18px] border border-border bg-background/75 p-4 transition-colors hover:border-primary/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">
                    {entry.name}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {entry.phase}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">
                    {entry.placement ? `#${entry.placement}` : "—"}
                  </p>
                  <p
                    className="mt-1 text-xs text-muted-foreground"
                    suppressHydrationWarning
                  >
                    {formatProfileDate(
                      entry.date,
                      "MMM d, yyyy",
                      "Date pending",
                    )}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </ProfilePanel>
  );
}
