import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Calendar, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import StatusBadge from "../components/shared/StatusBadge";
import EmptyState from "../components/shared/EmptyState";
import { format, isToday, isTomorrow, parseISO, startOfDay } from "date-fns";
import { decorateMatchesWithLiveStatus } from "@/lib/liveCalendar";

export default function Schedule() {
  const [searchParams] = useSearchParams();
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list("scheduled_time", 100),
  });

  const { data: tournaments = [] } = useQuery({
    queryKey: ["tournaments"],
    queryFn: () => base44.entities.Tournament.list("-created_date", 50),
  });
  const { data: results = [] } = useQuery({
    queryKey: ["results"],
    queryFn: () => base44.entities.MatchResult.list("-created_date", 5000),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
          Loading schedule
        </p>
      </div>
    );
  }

  const calendarMatches = decorateMatchesWithLiveStatus(matches, results);
  const tournamentMap = {};
  tournaments.forEach((tournament) => {
    tournamentMap[tournament.id] = tournament;
  });

  const tournamentFilter = searchParams.get("tournament");
  const stageFilter = searchParams.get("stage");
  const filteredBaseMatches = calendarMatches.filter((match) => {
    if (tournamentFilter && match.tournament_id !== tournamentFilter) return false;
    if (stageFilter && match.stage !== stageFilter) return false;
    return true;
  });

  const today = startOfDay(new Date());
  const upcomingMatches = filteredBaseMatches.filter((match) => {
    if (!match.scheduled_time) return true;
    return startOfDay(new Date(match.scheduled_time)) >= today;
  });
  const scopedTournament = tournamentFilter ? tournamentMap[tournamentFilter] : null;

  const grouped = {};
  upcomingMatches.forEach((match) => {
    const dateKey = match.scheduled_time
      ? format(new Date(match.scheduled_time), "yyyy-MM-dd")
      : "unscheduled";

    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(match);
  });

  const getDateLabel = (dateKey) => {
    if (dateKey === "unscheduled") return "Unscheduled";
    const date = parseISO(dateKey);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE, MMM d, yyyy");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-wide">SCHEDULE</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Today and upcoming match schedule
        </p>
      </div>

      {(scopedTournament || stageFilter) && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Connected view
          </p>
          {scopedTournament ? (
            <span className="text-sm font-semibold text-foreground">{scopedTournament.name}</span>
          ) : null}
          {stageFilter ? <span className="text-sm text-muted-foreground">{stageFilter}</span> : null}
          <Link
            to={`/leaderboard?tournament=${encodeURIComponent(tournamentFilter || "")}${stageFilter ? `&stage=${encodeURIComponent(stageFilter)}` : ""}`}
            className="ml-auto inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.16em] text-primary"
          >
            Back to standings
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {upcomingMatches.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No matches scheduled"
          description="Matches will appear here once the admin schedules them."
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([dateKey, dayMatches]) => (
            <div key={dateKey}>
              <div className="mb-4 flex items-center gap-3">
                <Calendar className="h-4 w-4 text-primary" />
                <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-primary">
                  {getDateLabel(dateKey)}
                </h2>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-2">
                {dayMatches.map((match, index) => {
                  const tournament = tournamentMap[match.tournament_id];

                  return (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/20"
                    >
                      <div className="flex items-center gap-4">
                        {match.scheduled_time && (
                          <div className="min-w-[60px] text-center">
                            <p className="font-heading text-lg font-bold text-foreground">
                              {format(new Date(match.scheduled_time), "HH:mm")}
                            </p>
                          </div>
                        )}
                        <div className="h-8 w-px bg-border" />
                        <div>
                          <p className="text-sm font-semibold">
                            Match #{match.match_number || "-"} - {match.stage}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tournament?.name || "Unknown"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {match.map && (
                          <span className="flex items-center gap-1 rounded bg-secondary px-2 py-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" /> {match.map}
                          </span>
                        )}
                        <StatusBadge status={match.status} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
