import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Calendar } from "lucide-react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import EmptyState from "../components/shared/EmptyState";
import LogoBlock from "../components/shared/LogoBlock";
import { format } from "date-fns";
import TournamentDetail from "../components/tournaments/TournamentDetail";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { decorateTournamentsWithLiveStatus } from "@/lib/liveCalendar";
import { filterPublishedMatchResults } from "@/lib/matchResultPublication";
import { getTournamentLogo } from "@/lib/tournamentBranding";

const STATUS_BADGE_CLASSES = {
  upcoming:
    "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  ongoing:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  completed:
    "border-zinc-500/20 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
};

function getTournamentSortValue(tournament) {
  if (tournament.status === "completed") {
    return new Date(
      tournament.end_date ||
        tournament.start_date ||
        tournament.updated_date ||
        tournament.created_date ||
        0,
    ).getTime();
  }

  if (tournament.status === "ongoing") {
    return new Date(
      tournament.start_date ||
        tournament.updated_date ||
        tournament.created_date ||
        0,
    ).getTime();
  }

  return new Date(
    tournament.start_date ||
      tournament.updated_date ||
      tournament.created_date ||
      0,
  ).getTime();
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

function formatTournamentWindow(startDate, endDate) {
  if (!startDate) return "Dates pending";
  const startLabel = format(new Date(startDate), "MMM d, yyyy");
  if (!endDate) return startLabel;
  return `${startLabel} - ${format(new Date(endDate), "MMM d, yyyy")}`;
}

function formatTournamentCardDates(startDate, endDate) {
  if (!startDate) return "TBA";
  const startLabel = format(new Date(startDate), "d'th' MMM yyyy");
  if (!endDate) return startLabel;
  return `${startLabel} to ${format(new Date(endDate), "d'th' MMM yyyy")}`;
}

function TournamentsHeader() {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
          Event control
        </p>
        <h1 className="mt-2 text-2xl font-heading font-semibold tracking-wide">
          TOURNAMENTS
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Current events, completed runs, and the full tournament archive.
        </p>
      </div>
    </div>
  );
}

function TournamentFilters({
  filterStatus,
  setFilterStatus,
  activeFilterYear,
  setFilterYear,
  years,
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap gap-2">
        {["all", "upcoming", "ongoing", "completed"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
              filterStatus === status
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="w-full md:w-[180px]">
        <Select value={activeFilterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="h-10 rounded-lg border-border bg-card text-sm text-foreground">
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

function FeaturedTournamentCard({ tournament, onOpen, searchParams, setSearchParams }) {
  if (!tournament) return null;

  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
      <div className="grid gap-6 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-7">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              Featured event
            </p>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                STATUS_BADGE_CLASSES[tournament.status] ||
                "border-zinc-500/20 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {tournament.status}
            </span>
          </div>

          <div>
            <h2 className="max-w-4xl text-3xl font-semibold uppercase leading-[0.94] tracking-[-0.05em] text-foreground md:text-[3.1rem]">
              {tournament.name}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
              {tournament.description ||
                "Open the event hub for stages, participants, rankings, and champion details."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            <span className="rounded-full border border-border bg-background/80 px-3 py-1.5">
              {tournament.game || "BGMI"}
            </span>
            <span className="rounded-full border border-border bg-background/80 px-3 py-1.5">
              {tournament.max_teams || 16} teams
            </span>
            <span className="rounded-full border border-border bg-background/80 px-3 py-1.5">
              {tournament.prize_pool || "Prize TBA"}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-5 rounded-[24px] border border-border bg-secondary/20 p-5">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-primary">
                Event window
              </p>
              <p
                className="mt-2 text-lg font-semibold uppercase tracking-[-0.03em] text-foreground"
                suppressHydrationWarning
              >
                {formatTournamentWindow(
                  tournament.start_date,
                  tournament.end_date,
                )}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-primary">
                Archive state
              </p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {tournament.status === "completed"
                  ? "This tournament is complete and ready for standings, champion, and award review."
                  : tournament.status === "ongoing"
                    ? "This tournament is currently active and should lead the competitive feed."
                    : "This tournament is scheduled and ready for stage, match, and participant updates."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onOpen) return onOpen(tournament.id);
              const nextParams = new URLSearchParams(searchParams);
              nextParams.set("id", tournament.id);
              setSearchParams(nextParams);
            }}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground"
          >
            Open tournament
          </button>
        </div>
      </div>
    </div>
  );
}

function TournamentArchiveGrid({ tournaments, onOpenTournament }) {
  if (tournaments.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="No tournaments"
        description="No tournaments found for this filter."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
          Archive list
        </p>
        <h2 className="mt-2 text-2xl font-semibold uppercase tracking-[-0.04em] text-foreground">
          All tournaments
        </h2>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tournaments.map((tournament, index) => (
          <m.div
            key={tournament.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onOpenTournament(tournament.id)}
            className="group self-start cursor-pointer overflow-hidden rounded-[22px] border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
          >
            {getTournamentLogo(tournament) ? (
              <div className="p-4 pb-3">
                <LogoBlock
                  src={getTournamentLogo(tournament)}
                  alt={`${tournament.name} logo`}
                  sizeClass="mx-auto size-28"
                  roundedClass="rounded-2xl"
                  paddingClass="p-4"
                  className="bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.14),_rgba(255,255,255,0.95)_60%,_rgba(248,243,235,0.98)_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.2),_rgba(30,24,20,0.95)_60%,_rgba(15,23,42,0.98)_100%)]"
                  imgClassName="transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="p-4 pb-3">
                <LogoBlock
                  sizeClass="mx-auto size-28"
                  roundedClass="rounded-2xl"
                  paddingClass="p-4"
                  className="bg-gradient-to-br from-primary/10 to-secondary"
                >
                  <Trophy className="size-8 text-primary/30" />
                </LogoBlock>
              </div>
            )}

            <div className="space-y-4 px-4 pb-4">
              <div className="space-y-2">
                <h3 className="line-clamp-2 text-base font-semibold text-foreground">
                  {tournament.name}
                </h3>
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                    STATUS_BADGE_CLASSES[tournament.status] ||
                    "border-zinc-500/20 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {tournament.status}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Dates</p>
                {tournament.start_date ? (
                  <p
                    className="flex items-center gap-1.5 text-sm font-medium text-foreground"
                    suppressHydrationWarning
                  >
                    <Calendar className="size-3.5 text-muted-foreground" />
                    {formatTournamentCardDates(
                      tournament.start_date,
                      tournament.end_date,
                    )}
                  </p>
                ) : (
                  <p className="text-sm font-medium text-foreground">TBA</p>
                )}
              </div>
            </div>
          </m.div>
        ))}
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

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ["tournaments"],
    queryFn: () => base44.entities.Tournament.list("-created_date", 50),
  });
  const { data: matches = [] } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list("scheduled_time", 500),
  });
  const { data: rawResults = [] } = useQuery({
    queryKey: ["results"],
    queryFn: () => base44.entities.MatchResult.list("-created_date", 5000),
  });
  const results = React.useMemo(
    () => filterPublishedMatchResults(rawResults),
    [rawResults],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
          Loading tournaments
        </p>
      </div>
    );
  }

  const calendarTournaments = decorateTournamentsWithLiveStatus(
    tournaments,
    matches,
    results,
  );

  const years = Array.from(
    new Set(
      calendarTournaments.flatMap((tournament) => {
        if (!tournament.start_date) return [];
        const year = new Date(tournament.start_date).getFullYear();
        return Number.isNaN(year) ? [] : [String(year)];
      }),
    ),
  ).sort((a, b) => Number(b) - Number(a));

  const activeFilterYear = years.includes(filterYear) ? filterYear : "all";

  const filtered = calendarTournaments
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
    .sort(compareTournaments);
  const featuredTournament = filtered[0] || null;

  const selected = calendarTournaments.find(
    (tournament) => tournament.id === selectedId,
  );
  const openTournament = (id) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("id", id);
    setSearchParams(nextParams);
  };

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
    <LazyMotion features={domAnimation}>
      <div className="space-y-6">
        <TournamentsHeader />
        <TournamentFilters
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          activeFilterYear={activeFilterYear}
          setFilterYear={setFilterYear}
          years={years}
        />
        <FeaturedTournamentCard
          tournament={featuredTournament}
          searchParams={searchParams}
          setSearchParams={setSearchParams}
        />
        <TournamentArchiveGrid
          tournaments={filtered}
          onOpenTournament={openTournament}
        />
      </div>
    </LazyMotion>
  );
}
