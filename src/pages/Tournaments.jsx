import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import EmptyState from "../components/shared/EmptyState";
import LogoBlock from "../components/shared/LogoBlock";
import { format } from "date-fns";
import TournamentDetail from "../components/tournaments/TournamentDetail";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { decorateTournamentsWithLiveStatus } from "@/lib/liveCalendar";

const STATUS_BADGE_CLASSES = {
  upcoming: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  ongoing: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  completed: "border-zinc-500/20 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
};

function getTournamentLogo(tournament) {
  if (tournament.name === "Battlegrounds Mobile India Series 2026") return "/images/bgis-logo.png";
  if (tournament.name === "Battlegrounds Mobile India Series 2023") return "/images/bgis-2023.png";
  if (tournament.name === "Battlegrounds Mobile India Series 2024") return "/images/bgis-2024.png";
  if (tournament.name === "Battlegrounds Mobile India Series 2025") return "/images/bgis-2025.png";
  if (tournament.name === "India - Korea Invitational") return "/images/in-kr.png";
  if (tournament.name === "Battlegrounds Mobile India Showdown 2025") return "/images/bmsd-2025.png";
  if (tournament.name === "Battlegrounds Mobile India International Cup 2025") return "/images/bmic-2025.png";
  if (tournament.name === "Battlegrounds Mobile India Pro Series 2023") return "/images/bmps-2023.png";
  if (tournament.name === "Battlegrounds Mobile India Pro Series 2024") return "/images/bmps-2024.png";
  if (tournament.name === "Battlegrounds Mobile India Pro Series 2025") return "/images/bmps-2025.png";
  if (tournament.name === "Battlegrounds Mobile India Pro Series 2026") return "/images/bmps-2026.png";
  return null;
}

function getTournamentSortValue(tournament) {
  if (tournament.status === "completed") {
    return new Date(tournament.end_date || tournament.start_date || tournament.updated_date || tournament.created_date || 0).getTime();
  }

  if (tournament.status === "ongoing") {
    return new Date(tournament.start_date || tournament.updated_date || tournament.created_date || 0).getTime();
  }

  return new Date(tournament.start_date || tournament.updated_date || tournament.created_date || 0).getTime();
}

function compareTournaments(a, b) {
  const statusPriority = {
    completed: 0,
    ongoing: 1,
    upcoming: 2,
  };

  const priorityDelta = (statusPriority[a.status] ?? 3) - (statusPriority[b.status] ?? 3);
  if (priorityDelta !== 0) return priorityDelta;

  return getTournamentSortValue(b) - getTournamentSortValue(a);
}

export default function Tournaments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentYear = String(new Date().getFullYear());
  const [selectedId, setSelectedId] = useState(searchParams.get("id") || null);
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
  const { data: results = [] } = useQuery({
    queryKey: ["results"],
    queryFn: () => base44.entities.MatchResult.list("-created_date", 5000),
  });

  useEffect(() => {
    setSelectedId(searchParams.get("id") || null);
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
          Loading tournaments
        </p>
      </div>
    );
  }

  const calendarTournaments = decorateTournamentsWithLiveStatus(tournaments, matches, results);

  const years = Array.from(
    new Set(
      calendarTournaments
        .map((tournament) => {
          if (!tournament.start_date) return null;
          const year = new Date(tournament.start_date).getFullYear();
          return Number.isNaN(year) ? null : String(year);
        })
        .filter(Boolean)
    )
  ).sort((a, b) => Number(b) - Number(a));

  const activeFilterYear = years.includes(filterYear) ? filterYear : "all";

  const filtered = calendarTournaments
    .filter((tournament) => {
      const matchesStatus = filterStatus === "all" || tournament.status === filterStatus;
      const tournamentYear = tournament.start_date
        ? String(new Date(tournament.start_date).getFullYear())
        : null;
      const matchesYear = activeFilterYear === "all" || tournamentYear === activeFilterYear;

      return matchesStatus && matchesYear;
    })
    .sort(compareTournaments);
  const featuredTournament = filtered[0] || null;

  const selected = calendarTournaments.find((tournament) => tournament.id === selectedId);

  if (selected) {
    return (
      <TournamentDetail
        tournament={selected}
        onBack={() => {
          const nextParams = new URLSearchParams(searchParams);
          nextParams.delete("id");
          setSearchParams(nextParams);
          setSelectedId(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
            Event control
          </p>
          <h1 className="mt-2 text-2xl font-heading font-bold tracking-wide">TOURNAMENTS</h1>
          <p className="mt-1 text-sm text-muted-foreground">Current events, completed runs, and the full tournament archive.</p>
        </div>
      </div>

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

      {featuredTournament ? (
        <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-7">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
                  Featured event
                </p>
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                    STATUS_BADGE_CLASSES[featuredTournament.status] ||
                    "border-zinc-500/20 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {featuredTournament.status}
                </span>
              </div>

              <div>
                <h2 className="max-w-4xl text-3xl font-black uppercase leading-[0.94] tracking-[-0.05em] text-foreground md:text-[3.1rem]">
                  {featuredTournament.name}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                  {featuredTournament.description || "Open the event hub for stages, participants, rankings, and champion details."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                <span className="rounded-full border border-border bg-background/80 px-3 py-1.5">
                  {featuredTournament.game || "BGMI"}
                </span>
                <span className="rounded-full border border-border bg-background/80 px-3 py-1.5">
                  {featuredTournament.max_teams || 16} teams
                </span>
                <span className="rounded-full border border-border bg-background/80 px-3 py-1.5">
                  {featuredTournament.prize_pool || "Prize TBA"}
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-5 rounded-[24px] border border-border bg-secondary/20 p-5">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-primary">Event window</p>
                  <p className="mt-2 text-lg font-black uppercase tracking-[-0.03em] text-foreground">
                    {featuredTournament.start_date
                      ? `${format(new Date(featuredTournament.start_date), "MMM d, yyyy")}${
                          featuredTournament.end_date ? ` - ${format(new Date(featuredTournament.end_date), "MMM d, yyyy")}` : ""
                        }`
                      : "Dates pending"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-primary">Archive state</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {featuredTournament.status === "completed"
                      ? "This tournament is complete and ready for standings, champion, and award review."
                      : featuredTournament.status === "ongoing"
                        ? "This tournament is currently active and should lead the competitive feed."
                        : "This tournament is scheduled and ready for stage, match, and participant updates."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextParams = new URLSearchParams(searchParams);
                  nextParams.set("id", featuredTournament.id);
                  setSearchParams(nextParams);
                  setSelectedId(featuredTournament.id);
                }}
                className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground"
              >
                Open tournament
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No tournaments"
          description="No tournaments found for this filter."
        />
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              Archive list
            </p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-foreground">
              All tournaments
            </h2>
          </div>

          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tournament, index) => (
            <motion.div
              key={tournament.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                const nextParams = new URLSearchParams(searchParams);
                nextParams.set("id", tournament.id);
                setSearchParams(nextParams);
                setSelectedId(tournament.id);
              }}
              className="group self-start cursor-pointer overflow-hidden rounded-[22px] border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
            >
              {getTournamentLogo(tournament) ? (
                <div className="p-4 pb-3">
                  <LogoBlock
                    src={getTournamentLogo(tournament)}
                    alt={`${tournament.name} logo`}
                    sizeClass="mx-auto h-28 w-28"
                    roundedClass="rounded-2xl"
                    paddingClass="p-4"
                    className="bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.14),_rgba(255,255,255,0.95)_60%,_rgba(248,243,235,0.98)_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.2),_rgba(30,24,20,0.95)_60%,_rgba(15,23,42,0.98)_100%)]"
                    imgClassName="transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="p-4 pb-3">
                  <LogoBlock
                    sizeClass="mx-auto h-28 w-28"
                    roundedClass="rounded-2xl"
                    paddingClass="p-4"
                    className="bg-gradient-to-br from-primary/10 to-secondary"
                  >
                    <Trophy className="h-8 w-8 text-primary/30" />
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
                    <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {format(new Date(tournament.start_date), "d'th' MMM yyyy")}
                      {tournament.end_date &&
                        ` to ${format(new Date(tournament.end_date), "d'th' MMM yyyy")}`}
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-foreground">TBA</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}
