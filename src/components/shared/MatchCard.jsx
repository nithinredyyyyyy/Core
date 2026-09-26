import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Swords } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import TeamLogo from "@/components/shared/TeamLogo";
import { formatDateTime } from "@/lib/formatting";
import { isLiveStatus, normalizeStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

/**
 * Canonical match card. Renders tournament, match number, map, schedule, teams,
 * status, and score when results exist — never fabricated values.
 */
export default function MatchCard({ match, className = "" }) {
  if (!match) return null;

  const live = isLiveStatus(match.status);
  const status = normalizeStatus(match.status);
  const rows = match.rows || [];
  const topRows = rows.slice(0, 4);

  return (
    <article
      className={cn(
        "flex flex-col rounded-xl border bg-card transition-colors hover:border-primary/40",
        live ? "border-red-500/40" : "border-border",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {match.tournamentName}
          </p>
          <h3 className="mt-1 truncate font-heading text-base font-semibold text-foreground">
            {match.matchNumberLabel}
          </h3>
        </div>
        <StatusBadge status={match.status} size="sm" />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 pt-3 text-xs text-muted-foreground">
        {match.map ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" aria-hidden="true" />
            {match.map}
          </span>
        ) : null}
        <span>{formatDateTime(match.scheduledTime)}</span>
        {match.groupName ? <span>Group {match.groupName}</span> : null}
      </div>

      <div className="flex-1 px-4 py-3">
        {topRows.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            Teams will be listed once the match lineup is published.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {topRows.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <TeamLogo name={row.teamName} src={row.logo} size="xs" />
                  <span className="truncate font-medium text-foreground">
                    {row.teamName}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {status === "completed" && row.totalPoints !== null
                    ? `${row.totalPoints} pts`
                    : row.kills !== null
                      ? `${row.kills} kills`
                      : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border p-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          <Swords className="size-3.5" aria-hidden="true" />
          {match.teams ? `${match.teams} teams` : "Lineup TBA"}
        </span>
        <Link
          to={`/matches/${match.id}`}
          className="inline-flex min-h-9 items-center rounded-full border border-border px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          View match
        </Link>
      </div>
    </article>
  );
}
