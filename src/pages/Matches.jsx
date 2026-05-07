import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Clock, MapPin, Swords } from "lucide-react";
import { motion } from "framer-motion";
import StatusBadge from "../components/shared/StatusBadge";
import EmptyState from "../components/shared/EmptyState";
import { format } from "date-fns";
import { decorateMatchesWithLiveStatus } from "@/lib/liveCalendar";

export default function Matches() {
  const [searchParams] = useSearchParams();
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list("-created_date", 100),
  });

  const { data: tournaments = [] } = useQuery({
    queryKey: ["tournaments"],
    queryFn: () => base44.entities.Tournament.list("-created_date", 50),
  });
  const { data: results = [] } = useQuery({
    queryKey: ["results"],
    queryFn: () => base44.entities.MatchResult.list("-created_date", 5000),
  });

  const calendarMatches = decorateMatchesWithLiveStatus(matches, results);
  const tournamentMap = {};
  tournaments.forEach((tournament) => {
    tournamentMap[tournament.id] = tournament;
  });

  const tournamentFilter = searchParams.get("tournament");
  const stageFilter = searchParams.get("stage");
  const scopedTournament = tournamentFilter ? tournamentMap[tournamentFilter] : null;

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
          Loading matches
        </p>
      </div>
    );
  }

  const visibleMatches = calendarMatches.filter((match) => {
    if (match.status !== "live" && match.status !== "scheduled") return false;
    if (tournamentFilter && match.tournament_id !== tournamentFilter) return false;
    if (stageFilter && match.stage !== stageFilter) return false;
    return true;
  });

  const filtered =
    filterStatus === "all"
      ? visibleMatches
      : visibleMatches.filter((match) => match.status === filterStatus);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-wide">MATCHES</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live and scheduled tournament matches
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

      <div className="flex gap-2">
        {["all", "scheduled", "live"].map((status) => (
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

      {filtered.length === 0 ? (
        <EmptyState
          icon={Swords}
          title="No matches"
          description="No live or scheduled matches found."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((match, index) => {
            const tournament = tournamentMap[match.tournament_id];

            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Swords className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          Match #{match.match_number || "-"}
                        </span>
                        <span className="text-xs text-muted-foreground">&bull;</span>
                        <span className="text-xs text-muted-foreground">{match.stage}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {tournament?.name || "Unknown Tournament"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {match.map && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {match.map}
                      </span>
                    )}
                    {match.scheduled_time && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(match.scheduled_time), "MMM d, h:mm a")}
                      </span>
                    )}
                    <StatusBadge status={match.status} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
