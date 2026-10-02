import PageShell from "@/components/shared/PageShell";
import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, MapPin, Swords, Trophy } from "lucide-react";
import { useMatches } from "@/hooks/useMatches";
import { usePageMeta } from "@/hooks/usePageMeta";
import ShareMenu from "@/components/shared/ShareMenu";
import PageSkeleton from "@/components/shared/PageSkeleton";
import QueryError from "@/components/shared/QueryError";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import TeamLogo from "@/components/shared/TeamLogo";
import DataTable from "@/components/shared/DataTable";
import { formatDateTime } from "@/lib/formatting";
import { isLiveStatus } from "@/lib/status";

const SCOREBOARD_COLUMNS = [
  {
    key: "placement",
    label: "Placement",
    align: "center",
    width: "110px",
    render: (row) => (
      <span className="font-heading text-sm font-bold tabular-nums text-foreground">
        {row.placement ?? "—"}
      </span>
    ),
  },
  {
    key: "team",
    label: "Team",
    render: (row) => (
      <Link
        to={`/teams?team=${encodeURIComponent(row.teamName)}`}
        className="flex items-center gap-2 font-medium text-foreground hover:text-primary"
      >
        <TeamLogo name={row.teamName} src={row.logo} size="xs" />
        <span className="truncate">{row.teamName}</span>
      </Link>
    ),
  },
  {
    key: "kills",
    label: "Elims",
    align: "right",
    width: "90px",
    render: (row) => (
      <span className="tabular-nums text-muted-foreground">
        {row.kills ?? "—"}
      </span>
    ),
  },
  {
    key: "placementPoints",
    label: "Place pts",
    align: "right",
    width: "110px",
    render: (row) => (
      <span className="tabular-nums text-muted-foreground">
        {row.placementPoints ?? "—"}
      </span>
    ),
  },
  {
    key: "totalPoints",
    label: "Total",
    align: "right",
    width: "100px",
    render: (row) => (
      <span className="font-heading font-bold tabular-nums text-foreground">
        {row.totalPoints ?? "—"}
      </span>
    ),
  },
];

export default function MatchDetail() {
  const { id } = useParams();
  const { matchViewModels, isLoading, isError, refetch } = useMatches();

  const match = useMemo(
    () => matchViewModels.find((entry) => entry.id === id) || null,
    [matchViewModels, id],
  );

  usePageMeta({
    title: match
      ? `${match.tournamentName} ${match.matchNumberLabel}`
      : "Match",
    description: match
      ? `${match.matchNumberLabel} at ${match.tournamentName}${
          match.map ? ` on ${match.map}` : ""
        }. Placements, eliminations, and total points.`
      : "Match details, placements, and official results.",
    path: `/matches/${id || ""}`,
  });

  if (isLoading) {
    return <PageSkeleton label="Loading match" rows={4} />;
  }

  if (isError) {
    return <QueryError onRetry={refetch} />;
  }

  if (!match) {
    return (
      <EmptyState
        icon={Swords}
        title="Match not found"
        description="This match is not available. It may have been removed or the link is incorrect."
        actionLabel="View all matches"
        actionTo="/matches"
      />
    );
  }

  const live = isLiveStatus(match.status);

  return (
    <PageShell>
      <Link
        to="/matches"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to match center
      </Link>

      <header
        className={`rounded-xl border bg-card p-5 ${
          live ? "border-red-500/40" : "border-border"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={match.status} />
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {match.tournamentName}
            </span>
          </div>
          <ShareMenu title={`${match.tournamentName} — ${match.matchNumberLabel}`} />
        </div>

        <h1 className="mt-3 font-heading text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
          {match.matchNumberLabel}
          {match.stageLabel ? ` · ${match.stageLabel}` : ""}
        </h1>

        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {match.map ? (
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Map</dt>
              <MapPin className="size-4" aria-hidden="true" />
              <dd>{match.map}</dd>
            </div>
          ) : null}
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Scheduled</dt>
            <CalendarClock className="size-4" aria-hidden="true" />
            <dd>{formatDateTime(match.scheduledTime)}</dd>
          </div>
          {match.groupName ? (
            <div>
              <dt className="sr-only">Group</dt>
              <dd>Group {match.groupName}</dd>
            </div>
          ) : null}
        </dl>

        {match.tournamentId ? (
          <Link
            to={`/tournaments?id=${encodeURIComponent(match.tournamentId)}`}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Trophy className="size-3.5" aria-hidden="true" />
            View tournament
          </Link>
        ) : null}
      </header>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Scoreboard
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {match.hasScoreboard
                ? match.isAggregated
                  ? `Official standings across ${match.aggregateMatchCount} matches in ${match.stage || "this stage"}.`
                  : "Official result for this match."
                : "Results have not been published for this match yet."}
            </p>
          </div>
          {match.hasScoreboard ? (
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {match.teams} teams
            </span>
          ) : null}
        </div>

        {match.hasScoreboard ? (
          <DataTable
            columns={SCOREBOARD_COLUMNS}
            rows={match.rows}
            caption={`Scoreboard for ${match.matchNumberLabel} at ${match.tournamentName}`}
          />
        ) : (
          <EmptyState
            icon={Swords}
            title="No results yet"
            description="Placements and eliminations will appear here once this match is played and published."
            actionLabel="View upcoming matches"
            actionTo="/matches?view=upcoming"
          />
        )}
      </section>
    </PageShell>
  );
}
