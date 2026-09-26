import React from "react";
import { Link } from "react-router-dom";
import { CalendarClock, MapPin } from "lucide-react";
import SectionHeader from "@/components/shared/SectionHeader";
import TeamLogo from "@/components/shared/TeamLogo";
import EmptyState from "@/components/shared/EmptyState";
import { formatDateTime } from "@/lib/formatting";

/** Next scheduled matches after the hero, when a live match owns the hero. */
export default function NextMatch({ matches = [] }) {
  return (
    <section>
      <SectionHeader
        title="Up next"
        description="Scheduled BGMI matches on the calendar."
        actionLabel="Match center"
        actionTo="/matches?view=upcoming"
      />

      {matches.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          className="mt-4"
          title="No upcoming matches"
          description="There are no matches scheduled for this period."
          actionLabel="View all matches"
          actionTo="/matches"
        />
      ) : (
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {matches.slice(0, 4).map((match) => (
            <li key={match.id}>
              <Link
                to={`/matches/${match.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="w-full min-w-0 sm:w-auto sm:flex-1">
                  <span className="block truncate text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {match.tournamentName}
                  </span>
                  <span className="mt-0.5 block truncate font-heading text-sm font-semibold text-foreground">
                    {match.matchNumberLabel}
                    {match.stageLabel ? ` · ${match.stageLabel}` : ""}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarClock className="size-3.5" aria-hidden="true" />
                  {formatDateTime(match.scheduledTime)}
                </span>
                {match.map ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    {match.map}
                  </span>
                ) : null}
                {match.rows?.length ? (
                  <span className="inline-flex items-center gap-1.5">
                    {match.rows.slice(0, 2).map((row) => (
                      <TeamLogo key={row.id} name={row.teamName} src={row.logo} size="xs" />
                    ))}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
