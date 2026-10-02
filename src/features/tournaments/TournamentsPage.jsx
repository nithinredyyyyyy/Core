import { Carousel } from "@/components/bencho/Carousel";
import PageShell from "@/components/shared/PageShell";
import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { listTournaments, listTournamentMatches, listTournamentResults, tournamentQueryOptions } from "@/services/tournaments";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import PageHeader from "@/components/shared/PageHeader";
import PageSkeleton from "@/components/shared/PageSkeleton";
import QueryError from "@/components/shared/QueryError";
import FilterTabs from "@/components/shared/FilterTabs";
import SectionHeader from "@/components/shared/SectionHeader";
import TournamentCard from "@/features/tournaments/components/TournamentCard";
import TournamentDetail from "@/features/tournaments/TournamentDetailPage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  decorateMatchesWithLiveStatus,
  decorateTournamentsWithLiveStatus,
} from "@/lib/liveCalendar";
import { filterPublishedMatchResults } from "@/lib/matchResultPublication";
import { getOfficialParticipantCount } from "@/lib/tournamentParticipants";
import { getTournamentLogo } from "@/lib/tournamentBranding";
import { getFeaturedTournamentStage } from "@/lib/stageBoard";
import { isSameDay } from "date-fns";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
];

function safeDateMs(value) {
  if (!value || value === "0" || value === "null" || value === "undefined") return 0;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

function getTournamentSortValue(tournament) {
  if (tournament.status === "completed") {
    return safeDateMs(
      tournament.end_date ||
        tournament.start_date ||
        tournament.updated_date ||
        tournament.created_date,
    );
  }

  if (tournament.status === "ongoing") {
    return safeDateMs(
      tournament.start_date ||
        tournament.updated_date ||
        tournament.created_date,
    );
  }

  return safeDateMs(
    tournament.start_date ||
      tournament.updated_date ||
      tournament.created_date,
  );
}

function compareTournaments(a, b) {
  const statusPriority = {
    ongoing: 0,
    upcoming: 1,
    completed: 2,
  };

  const priorityDelta =
    (statusPriority[a.status] ?? 3) - (statusPriority[b.status] ?? 3);
  if (priorityDelta !== 0) return priorityDelta;

  return getTournamentSortValue(b) - getTournamentSortValue(a);
}

function TournamentFilters({
  filterStatus,
  setFilterStatus,
  activeFilterYear,
  setFilterYear,
  years,
  statusTabs,
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <FilterTabs
        options={statusTabs}
        value={filterStatus}
        onChange={setFilterStatus}
        ariaLabel="Tournament status"
      />

      <div className="w-full md:w-[180px]">
        <Select value={activeFilterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="h-11 rounded-lg border-border bg-card text-sm text-foreground">
            <SelectValue placeholder="Filter by year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {years.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default function Tournaments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentYear = String(new Date().getFullYear());
  const selectedId = searchParams.get("id") || null;
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterYear, setFilterYear] = useState(currentYear);

  const { data: tournaments = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["tournaments"],
    queryFn: () => listTournaments(50),
    ...tournamentQueryOptions,
    refetchOnWindowFocus: false,
  });
  const { data: matches = [] } = useQuery({
    queryKey: ["tournaments-matches"],
    queryFn: () => listTournamentMatches(500),
    ...tournamentQueryOptions,
    refetchOnWindowFocus: false,
  });
  const { data: rawResults = [] } = useQuery({
    queryKey: ["tournaments-results"],
    queryFn: () => listTournamentResults(1500),
    ...tournamentQueryOptions,
    refetchOnWindowFocus: false,
  });
  const results = React.useMemo(
    () => filterPublishedMatchResults(rawResults),
    [rawResults],
  );

  const calendarTournaments = useMemo(() => decorateTournamentsWithLiveStatus(
    tournaments,
    matches,
    results,
  ), [tournaments, matches, results]);

  const years = useMemo(() => Array.from(
    new Set(
      calendarTournaments.flatMap((tournament) => {
        if (!tournament.start_date) return [];
        const year = new Date(tournament.start_date).getFullYear();
        return Number.isNaN(year) ? [] : [String(year)];
      }),
    ),
  ).sort((a, b) => Number(b) - Number(a)), [calendarTournaments]);

  const activeFilterYear = years.includes(filterYear) ? filterYear : "all";

  const filtered = useMemo(() => calendarTournaments
    .filter((tournament) => {
      const matchesStatus =
        filterStatus === "all" || tournament.status === filterStatus;
      const tournamentYear = tournament.start_date
        ? String(new Date(tournament.start_date).getFullYear())
        : null;
      const matchesYear =
        activeFilterYear === "all" || tournamentYear === activeFilterYear;

      return matchesStatus && matchesYear;
    })
    .sort(compareTournaments), [calendarTournaments, filterStatus, activeFilterYear]);

  const decoratedMatches = useMemo(
    () => decorateMatchesWithLiveStatus(matches, results),
    [matches, results],
  );

  // Per-card facts (current stage, field size, today's schedule) derived from
  // the same matches/results the detail hub uses, so list and detail agree.
  const cardMeta = useMemo(() => {
    const now = new Date();
    const byTournament = new Map();
    for (const match of decoratedMatches) {
      const key = match.tournament_id;
      if (!key) continue;
      const entry = byTournament.get(key) || { matches: [], results: [] };
      entry.matches.push(match);
      byTournament.set(key, entry);
    }
    for (const result of results) {
      const key = result.tournament_id;
      if (!key || !byTournament.has(key)) continue;
      byTournament.get(key).results.push(result);
    }

    const meta = new Map();
    for (const tournament of calendarTournaments) {
      const entry = byTournament.get(tournament.id);
      const tournamentMatches = entry?.matches ?? [];
      const tournamentResults = entry?.results ?? [];
      meta.set(tournament.id, {
        currentStage:
          getFeaturedTournamentStage(tournament, tournamentMatches, tournamentResults) ||
          null,
        teamCount: getOfficialParticipantCount(tournament) || null,
        matchesToday: tournamentMatches.filter(
          (match) => match.scheduled_time && isSameDay(new Date(match.scheduled_time), now),
        ).length,
      });
    }
    return meta;
  }, [calendarTournaments, decoratedMatches, results]);

  const statusCounts = useMemo(() => {
    const counts = { all: calendarTournaments.length, upcoming: 0, ongoing: 0, completed: 0 };
    for (const tournament of calendarTournaments) {
      if (tournament.status in counts) counts[tournament.status] += 1;
    }
    return counts;
  }, [calendarTournaments]);

  const statusTabs = STATUS_TABS.map((tab) => ({
    ...tab,
    count: statusCounts[tab.value] ?? 0,
  }));

  if (isLoading) {
    return <PageSkeleton label="Loading tournaments" rows={6} />;
  }

  if (isError) {
    return <QueryError onRetry={refetch} />;
  }

  const selected = calendarTournaments.find(
    (tournament) => tournament.id === selectedId,
  );

  if (selected) {
    return (
      <TournamentDetail
        tournament={selected}
        requestedStage={searchParams.get("stage") || ""}
        onBack={() => {
          const nextParams = new URLSearchParams(searchParams);
          nextParams.delete("id");
          nextParams.delete("stage");
          setSearchParams(nextParams);
        }}
      />
    );
  }

  return (
    <PageShell>
      <PageHeader
        kicker="Events"
        title="Tournaments"
        description="Every BGMI event on the circuit — live now, upcoming, and the full archive."
      />

      {calendarTournaments.length > 0 && <section aria-label="Featured tournaments">
        <Carousel shots={[...calendarTournaments].sort(compareTournaments).slice(0, 5).map((event) => ({ id: event.id, name: event.name, src: getTournamentLogo(event) || "/images/core-logo.svg", href: `/tournaments?id=${encodeURIComponent(event.id)}` }))} />
      </section>}

      <TournamentFilters
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        activeFilterYear={activeFilterYear}
        setFilterYear={setFilterYear}
        years={years}
        statusTabs={statusTabs}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No tournaments"
          description="No tournaments match this filter. Try another status or year."
          actionLabel="Reset filters"
          onAction={() => {
            setFilterStatus("all");
            setFilterYear("all");
          }}
        />
      ) : (
        <section className="space-y-4">
          <SectionHeader
            title="All tournaments"
            description={`${filtered.length} event${filtered.length === 1 ? "" : "s"}`}
          />
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((tournament) => {
              const meta = cardMeta.get(tournament.id) || {};
              return (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  logo={getTournamentLogo(tournament)}
                  currentStage={meta.currentStage}
                  teamCount={meta.teamCount}
                  matchesToday={meta.matchesToday || null}
                />
              );
            })}
          </div>
        </section>
      )}
    </PageShell>
  );
}
