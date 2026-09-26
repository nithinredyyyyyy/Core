import React from "react";
import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import SectionHeader from "@/components/shared/SectionHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { formatDateRange } from "@/lib/formatting";

/** Upcoming tournaments with real dates and prize pools from the API. */
export default function UpcomingEvents({ tournaments = [] }) {
  return (
    <section>
      <SectionHeader
        title="Upcoming tournaments"
        description="Events on the BGMI calendar."
        actionLabel="All tournaments"
        actionTo="/tournaments"
      />

      {tournaments.length === 0 ? (
        <EmptyState
          icon={Trophy}
          className="mt-4"
          title="No upcoming tournaments"
          description="New events will appear here as soon as they are announced."
          actionLabel="Browse tournaments"
          actionTo="/tournaments"
        />
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {tournaments.map((tournament) => (
            <li key={tournament.id}>
              <Link
                to={`/tournaments?id=${encodeURIComponent(tournament.id)}`}
                className="flex h-full flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 font-heading text-base font-bold leading-tight text-foreground">
                    {tournament.name}
                  </p>
                  <StatusBadge status={tournament.status} size="sm" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatDateRange(tournament.start_date, tournament.end_date)}
                </p>
                {tournament.prize_pool ? (
                  <p className="mt-2 text-xs font-semibold text-primary">
                    {tournament.prize_pool}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
