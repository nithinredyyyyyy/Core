import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ChevronRight, Flame, Trophy } from "lucide-react";
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
import { useIsMobile } from "@/hooks/use-mobile";

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
        <p className="type-kicker text-primary">
          Event control
        </p>
        <h1 className="type-title-xl mt-2">
          TOURNAMENTS
        </h1>
        <p className="type-body-sm mt-1 text-muted-foreground">
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
            type="button"
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
            <p className="type-kicker text-primary">
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
            <h2 className="type-display-section max-w-4xl uppercase text-foreground">
              {tournament.name}
            </h2>
            <p className="type-body mt-3 max-w-3xl text-muted-foreground">
              {tournament.description ||
                "Open the event hub for stages, participants, rankings, and champion details."}
            </p>
          </div>

          <div className="type-kicker flex flex-wrap gap-3 text-muted-foreground">
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
              <p className="type-body mt-2 text-muted-foreground">
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

function MobileTournamentFilterBar({ filterStatus, setFilterStatus }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {["all", "upcoming", "ongoing", "completed"].map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => setFilterStatus(status)}
          className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors ${
            filterStatus === status
              ? "bg-[rgba(27,10,21,0.92)] text-white"
              : "bg-white/18 text-[#5c212c]"
          }`}
        >
          {status}
        </button>
      ))}
    </div>
  );
}

function MobileTournamentHero({ tournament, onOpen }) {
  if (!tournament) return null;

  return (
    <button
      type="button"
      onClick={() => onOpen(tournament.id)}
      className="block w-full overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,rgba(175,20,48,0.96),rgba(224,79,92,0.92)_58%,rgba(244,144,123,0.92))] p-5 text-left text-white shadow-[0_24px_44px_rgba(121,30,48,0.2)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/72">
            Top Event
          </p>
          <h1 className="mt-3 max-w-[8.5ch] text-[2.2rem] font-medium leading-[0.94] tracking-[-0.05em]">
            {tournament.name}
          </h1>
          <p className="mt-2 text-[12px] text-white/78">
            {tournament.status}
          </p>
        </div>
        <div className="rounded-full bg-white/18 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
          {tournament.game || "BGMI"}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/14 bg-[rgba(19,10,16,0.58)]">
        <div className="aspect-[16/9] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_45%),linear-gradient(180deg,rgba(20,9,16,0.08),rgba(20,9,16,0.55))] p-4">
          <img
            src={getTournamentLogo(tournament)}
            alt={tournament.name}
            className="h-full w-full object-contain"
          />
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/48">
              Match focus
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {formatTournamentCardDates(
                tournament.start_date,
                tournament.end_date,
              )}
            </p>
          </div>
          <div className="rounded-full bg-emerald-400/85 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#11311f]">
            {tournament.status}
          </div>
        </div>
      </div>
    </button>
  );
}

function MobileTournamentCard({ tournament, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(tournament.id)}
      className="flex w-full items-center gap-3 rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(28,10,20,0.96),rgba(17,8,14,0.98))] p-3.5 text-left text-white shadow-[0_16px_26px_rgba(44,13,22,0.16)]"
    >
      <div className="flex size-16 shrink-0 items-center justify-center rounded-[1.1rem] bg-white/[0.06] p-2">
        <img
          src={getTournamentLogo(tournament)}
          alt={tournament.name}
          className="h-full w-full object-contain"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
            {tournament.status}
          </p>
          <ChevronRight className="size-4 text-white/35" />
        </div>
        <p className="mt-1 line-clamp-2 text-base font-semibold leading-tight text-white">
          {tournament.name}
        </p>
        <p className="mt-2 text-[11px] leading-5 text-white/58">
          {formatTournamentWindow(tournament.start_date, tournament.end_date)}
        </p>
      </div>
    </button>
  );
}

export default function Tournaments() {
  const isMobile = useIsMobile();
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
    queryKey: ["tournaments-matches"],
    queryFn: () => base44.entities.Match.list("-scheduled_time", 500),
  });
  const { data: rawResults = [] } = useQuery({
    queryKey: ["tournaments-results"],
    queryFn: () => base44.entities.MatchResult.list("-created_date", 1500),
  });
  const results = React.useMemo(
    () => filterPublishedMatchResults(rawResults),
    [rawResults],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="type-kicker text-muted-foreground">
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

  if (isMobile) {
    return (
      <LazyMotion features={domAnimation}>
        <div className="mx-auto max-w-[420px] space-y-4 pb-4 text-[#2d1419]">
          <m.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-[2rem] bg-[linear-gradient(180deg,#ffb39f_0%,#ff9b89_100%)] p-5 shadow-[0_22px_40px_rgba(121,30,48,0.16)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-white/50 text-[#2d1419]">
                    <Flame className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2d1419]">Event</p>
                    <p className="text-[11px] text-[#6b3741]">Tournament circuit</p>
                  </div>
                </div>
                <div className="rounded-full bg-[rgba(27,10,21,0.92)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                  {filtered.length} live
                </div>
              </div>
              <h1 className="mt-4 max-w-[8ch] text-[2.3rem] font-medium leading-[0.95] text-[#2d1419]">
                Catch every tournament
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#6b3741]">
                Featured event, active stages, and the full schedule in one mobile flow.
              </p>
              <div className="mt-4">
                <MobileTournamentFilterBar
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                />
              </div>
            </div>
          </m.section>

          <m.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
            <MobileTournamentHero tournament={featuredTournament} onOpen={openTournament} />
          </m.section>

          <m.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <div className="space-y-3">
              {filtered.slice(1).map((tournament) => (
                <MobileTournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  onOpen={openTournament}
                />
              ))}
              {filtered.length <= 1 ? (
                <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(28,10,20,0.96),rgba(17,8,14,0.98))] p-4 text-sm text-white/58">
                  More tournament drops will appear here once the archive expands.
                </div>
              ) : null}
            </div>
          </m.section>
        </div>
      </LazyMotion>
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
