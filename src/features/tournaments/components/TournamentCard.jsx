import React from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Swords, Users } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import TeamLogo from "@/components/shared/TeamLogo";
import { formatDateRange } from "@/lib/formatting";
import { cn } from "@/lib/utils";

/**
 * Tournament card. Compact by design: logo, name, status, current stage, and
 * field size. Every value is optional — a missing stat is simply omitted rather
 * than filled with a placeholder number.
 */
export default function TournamentCard({
  tournament,
  logo = null,
  className = "",
  currentStage = null,
  teamCount = null,
  matchesToday = null,
}) {
  if (!tournament) return null;

  return (
    <Link
      to={`/tournaments?id=${encodeURIComponent(tournament.id)}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <TeamLogo
          name={tournament.name}
          src={logo || tournament.logo_url || null}
          size="lg"
          rounded="rounded-lg"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={tournament.status} size="sm" />
            {tournament.game ? (
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {tournament.game}
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 line-clamp-2 font-heading text-base font-bold leading-snug text-foreground group-hover:text-primary">
            {tournament.name}
          </h3>
          {currentStage ? (
            <p className="mt-1 truncate text-xs font-semibold text-primary">
              {currentStage}
            </p>
          ) : null}
        </div>
      </div>

      <dl className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-4 py-3 text-xs text-muted-foreground">
        <div className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          <dt className="sr-only">Dates</dt>
          <dd>{formatDateRange(tournament.start_date, tournament.end_date)}</dd>
        </div>
        {teamCount ? (
          <div className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" aria-hidden="true" />
            <dt className="sr-only">Teams</dt>
            <dd>{teamCount} teams</dd>
          </div>
        ) : null}
        {matchesToday ? (
          <div className="inline-flex items-center gap-1.5 text-primary">
            <Swords className="size-3.5" aria-hidden="true" />
            <dt className="sr-only">Matches today</dt>
            <dd>
              {matchesToday} match{matchesToday === 1 ? "" : "es"} today
            </dd>
          </div>
        ) : null}
      </dl>
    </Link>
  );
}
