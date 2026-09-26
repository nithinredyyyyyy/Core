import React from "react";
import { Link } from "react-router-dom";
import { CalendarClock, MapPin, Radio } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import TeamLogo from "@/components/shared/TeamLogo";
import { formatDateTime, formatTime } from "@/lib/formatting";

function TeamSide({ row, align = "left" }) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-3 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <TeamLogo name={row.teamName} src={row.logo} size="md" />
      <div className="min-w-0">
        <p className="truncate font-heading text-sm font-bold text-foreground sm:text-base">
          {row.teamName}
        </p>
        {row.kills !== null ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{row.kills} kills</p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Home hero. Shows the live match when one exists, otherwise the next
 * scheduled match, otherwise an honest empty state. Values come straight from
 * the match view model — nothing is invented.
 */
export default function HomeHero({ liveMatch, nextMatch, isLoading }) {
  const match = liveMatch || nextMatch;
  const live = Boolean(liveMatch);

  if (isLoading && !match) {
    return (
      <section
        aria-busy="true"
        className="rounded-2xl border border-border bg-card p-6 sm:p-8"
      >
        <h1 className="sr-only">CORE — BGMI Esports Hub</h1>
        <div className="h-3 w-24 animate-pulse rounded-full bg-secondary" />
        <div className="mt-4 h-8 w-2/3 animate-pulse rounded-full bg-secondary" />
        <div className="mt-6 h-20 w-full animate-pulse rounded-xl bg-secondary/60" />
      </section>
    );
  }

  if (!match) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center sm:p-10">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
          <CalendarClock className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <h2 className="mt-4 font-heading text-xl font-semibold text-foreground">
          No matches scheduled
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          There is no live or upcoming BGMI match on the calendar right now.
          Check the match center for completed results.
        </p>
        <Link
          to="/matches"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          View all matches
        </Link>
      </section>
    );
  }

  const rows = match.rows || [];

  return (
    <section
      className={`overflow-hidden rounded-2xl border bg-card ${
        live ? "border-red-500/40" : "border-border"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-7">
        <div className="flex items-center gap-3">
          <StatusBadge status={live ? "live" : match.status} />
          {!live ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              <Radio className="size-3.5" aria-hidden="true" />
              Up next
            </span>
          ) : null}
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          {match.matchNumberLabel}
          {match.map ? ` • ${match.map}` : ""}
        </p>
      </div>

      <div className="px-5 py-6 sm:px-7 sm:py-8">
        <h1 className="font-heading text-2xl font-black leading-tight tracking-[-0.02em] text-foreground sm:text-3xl">
          {match.tournamentName}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
          {match.stageLabel ? (
            <span className="font-heading text-sm font-semibold text-foreground">
              {match.stageLabel}
            </span>
          ) : null}
          {match.map ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" aria-hidden="true" />
              {match.map}
            </span>
          ) : null}
        </div>

        {rows.length >= 2 ? (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-4 sm:gap-5 sm:p-5">
            <TeamSide row={rows[0]} />
            <span className="shrink-0 font-heading text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
              vs
            </span>
            <TeamSide row={rows[1]} align="right" />
          </div>
        ) : (
          <p className="mt-6 rounded-xl border border-dashed border-border bg-secondary/20 p-4 text-sm text-muted-foreground">
            {live
              ? "Team lineups for this match have not been published yet."
              : "Team lineups will appear once the match lineup is published."}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="size-4" aria-hidden="true" />
            {live
              ? formatDateTime(match.scheduledTime)
              : `Starts ${formatTime(match.scheduledTime)}`}
          </p>
          <Link
            to={`/matches/${match.id}`}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View match
          </Link>
        </div>
      </div>
    </section>
  );
}
