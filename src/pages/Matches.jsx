import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Swords } from "lucide-react";
import { useMatches } from "@/hooks/useMatches";
import { usePageMeta } from "@/hooks/usePageMeta";
import PageHeader from "@/components/shared/PageHeader";
import PageSkeleton from "@/components/shared/PageSkeleton";
import QueryError from "@/components/shared/QueryError";
import EmptyState from "@/components/shared/EmptyState";
import FilterTabs from "@/components/shared/FilterTabs";
import MatchCard from "@/components/shared/MatchCard";
import SectionHeader from "@/components/shared/SectionHeader";
import { isCompletedStatus, isLiveStatus, isUpcomingStatus } from "@/lib/status";
import { isSameDay } from "date-fns";

const GROUP_TABS = [
  { value: "live", label: "Live" },
  { value: "upcoming", label: "Upcoming" },
  { value: "recent", label: "Recent" },
];

const PERIOD_TABS = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
];

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function matchesPeriod(match, period, now = new Date()) {
  if (period === "all") return true;
  const scheduled = toDate(match.scheduledTime);
  if (!scheduled) return false;
  if (period === "today") return isSameDay(scheduled, now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDay(scheduled, tomorrow);
}

function sortBySchedule(matches, direction) {
  return [...matches].sort((left, right) => {
    const leftTime = toDate(left.scheduledTime)?.getTime() ?? 0;
    const rightTime = toDate(right.scheduledTime)?.getTime() ?? 0;
    return direction === "desc" ? rightTime - leftTime : leftTime - rightTime;
  });
}

export default function Matches() {
  const { matchViewModels, tournaments, isLoading, isError, refetch } = useMatches();
  const [searchParams, setSearchParams] = useSearchParams();
  const [group, setGroup] = useState(searchParams.get("view") || "live");
  const [period, setPeriod] = useState(searchParams.get("period") || "all");
  const [tournamentId, setTournamentId] = useState(searchParams.get("tournament") || "all");

  usePageMeta({
    title: "Match Center",
    description:
      "Live, upcoming, and recent BGMI matches with schedules, maps, and official results.",
    path: "/matches",
  });

  function updateParam(key, value, defaultValue) {
    const next = new URLSearchParams(searchParams);
    if (!value || value === defaultValue) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  }

  const groups = useMemo(() => {
    const live = matchViewModels.filter((match) => isLiveStatus(match.status));
    const upcoming = sortBySchedule(
      matchViewModels.filter((match) => isUpcomingStatus(match.status)),
      "asc",
    );
    const recent = sortBySchedule(
      matchViewModels.filter((match) => isCompletedStatus(match.status)),
      "desc",
    );
    return { live, upcoming, recent };
  }, [matchViewModels]);

  const periodFiltered = useMemo(
    () => groups[group].filter((match) => matchesPeriod(match, period)),
    [groups, group, period],
  );

  const visible = useMemo(
    () =>
      periodFiltered.filter(
        (match) => tournamentId === "all" || match.tournamentId === tournamentId,
      ),
    [periodFiltered, tournamentId],
  );

  const tournamentOptions = useMemo(() => {
    const ids = new Set(groups[group].map((match) => match.tournamentId));
    return tournaments.filter((tournament) => ids.has(tournament.id));
  }, [groups, group, tournaments]);

  const groupTabs = GROUP_TABS.map((tab) => ({
    ...tab,
    count: groups[tab.value].length,
  }));

  const emptyCopy = {
    live: {
      title: "No live matches",
      description:
        "Nothing is being played right now. Check the upcoming schedule for the next drop.",
    },
    upcoming: {
      title: "No upcoming matches",
      description:
        "There are no matches scheduled for this period. Try a different filter.",
    },
    recent: {
      title: "No recent results",
      description:
        "Official results will appear here once match data is published.",
    },
  }[group];

  if (isLoading) {
    return <PageSkeleton label="Loading matches" rows={6} />;
  }

  if (isError) {
    return <QueryError onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Match center"
        title="Matches"
        description="Every live, upcoming, and completed BGMI match with maps, schedules, and official results."
      />

      <div className="space-y-3">
        <FilterTabs
          options={groupTabs}
          value={group}
          onChange={(value) => {
            setGroup(value);
            updateParam("view", value, "live");
          }}
          ariaLabel="Match status"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <FilterTabs
            options={PERIOD_TABS}
            value={period}
            onChange={(value) => {
              setPeriod(value);
              updateParam("period", value, "all");
            }}
            ariaLabel="Match period"
            size="sm"
          />

          {tournamentOptions.length > 1 ? (
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <span className="sr-only sm:not-sr-only">Tournament</span>
              <select
                value={tournamentId}
                onChange={(event) => {
                  setTournamentId(event.target.value);
                  updateParam("tournament", event.target.value, "all");
                }}
                className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-64"
              >
                <option value="all">All tournaments</option>
                {tournamentOptions.map((tournament) => (
                  <option key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Swords}
          title={emptyCopy.title}
          description={emptyCopy.description}
          actionLabel="View all matches"
          onAction={() => {
            setGroup("upcoming");
            setPeriod("all");
            setTournamentId("all");
            setSearchParams({}, { replace: true });
          }}
        />
      ) : (
        <section className="space-y-4">
          <SectionHeader
            title={
              group === "live"
                ? "Live now"
                : group === "upcoming"
                  ? "Upcoming"
                  : "Recent results"
            }
            description={`${visible.length} match${visible.length === 1 ? "" : "es"}`}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
