import React, { useMemo } from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import TeamIdentity from "@/components/shared/TeamIdentity";
import { buildTeamLink, getDisplayTeamName } from "@/features/tournaments/utils/participantHelpers";

export default function BmpsSemiFinalsPendingPanel({ stageParticipants, matches, tournamentId }) {
  const semiFinalMatches = useMemo(
    () =>
      (matches || [])
        .filter(
          (match) =>
            match.tournament_id === tournamentId &&
            String(match.stage || "").trim().toLowerCase() === "semi finals",
        )
        .toSorted(
          (left, right) =>
            (Number(left.day) || 999) - (Number(right.day) || 999) ||
            (Number(left.match_number) || 999) - (Number(right.match_number) || 999) ||
            new Date(left.scheduled_time || 0).getTime() -
              new Date(right.scheduled_time || 0).getTime(),
        ),
    [matches, tournamentId],
  );
  const dayOneMatches = semiFinalMatches.filter((match) => Number(match.day) === 1);
  const nextMatch = semiFinalMatches.find((match) => String(match.status || "").toLowerCase() === "scheduled") || semiFinalMatches[0] || null;
  const maps = [...new Set(dayOneMatches.map((match) => match.map).filter(Boolean))];
  const groups = [...new Set(dayOneMatches.map((match) => match.group_name).filter(Boolean))];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Semi Finals pre-match board
            </p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">
              Overall standings unlock after results are published.
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Until the first lobby is scored, this view keeps the projected 24-team field and opening matchday schedule visible beside the Groups draw.
            </p>
          </div>
          <div className="grid min-w-[260px] grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-border bg-background/80 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Teams</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{stageParticipants.length || 24}</p>
            </div>
            <div className="rounded-lg border border-border bg-background/80 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Matches</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{semiFinalMatches.length || 24}</p>
            </div>
            <div className="rounded-lg border border-border bg-background/80 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Move</p>
              <p className="mt-1 text-lg font-semibold text-foreground">6/16/2</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-xl border border-border bg-background/90 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                Opening slate
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {nextMatch?.scheduled_time
                  ? `Starts ${format(new Date(nextMatch.scheduled_time), "MMM d, h:mm a")}`
                  : "Schedule time will appear here once confirmed."}
              </p>
            </div>
            <div className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Day 1
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            {dayOneMatches.slice(0, 6).map((match) => (
              <div
                key={match.id}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-border bg-secondary/20 px-3 py-2.5"
              >
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-background text-xs font-bold text-foreground">
                  {match.match_number}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {match.map || "Map TBA"} · {match.group_name || "Group TBA"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {match.scheduled_time ? format(new Date(match.scheduled_time), "h:mm a") : "Time TBA"}
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                  Scheduled
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Maps: {maps.join(" / ") || "TBA"}{groups.length ? ` · Groups: ${groups.join(", ")}` : ""}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-background/90 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                Projected teams
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Top 6 to Grand Finals, ranks 7-22 to Last Chance, bottom 2 eliminated.
              </p>
            </div>
          </div>
          <div className="mt-4 grid max-h-[420px] gap-2 overflow-auto pr-1 sm:grid-cols-2">
            {stageParticipants.map((entry, index) => (
              <Link
                key={`semi-pending-${entry.team}`}
                to={buildTeamLink(entry.team)}
                className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-secondary/20 px-3 py-2.5 transition hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-background text-xs font-bold text-foreground">
                  {index + 1}
                </span>
                <TeamIdentity
                  name={getDisplayTeamName(entry.team)}
                  className="min-w-0 truncate text-sm font-semibold text-foreground"
                  contained
                  surfaceToneOverride="light"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
