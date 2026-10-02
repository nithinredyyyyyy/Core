import React from "react";
import { Link } from "react-router-dom";
import TeamIdentity from "@/components/shared/TeamIdentity";
import { buildTeamLink, getDisplayTeamName } from "@/features/tournaments/utils/participantHelpers";

export function DesktopProjectedTeams({ activeStage, stageParticipants }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-background/90 p-5 shadow-sm">
        <p className="text-lg font-semibold uppercase tracking-[0.08em] text-foreground">
          {activeStage.name.toUpperCase()} TEAMS
        </p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Teams currently projected into this stage from completed upstream results.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {stageParticipants.map((entry, index) => (
          <Link
            key={`${activeStage.name}-${entry.team}`}
            to={buildTeamLink(entry.team)}
            className="flex items-center gap-3 rounded-xl border border-border bg-background/90 p-4 shadow-sm transition hover:border-primary/40 hover:bg-secondary/20"
          >
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-foreground">
              {index + 1}
            </span>
            <TeamIdentity
              name={getDisplayTeamName(entry.team)}
              className="font-semibold text-foreground"
              contained
              surfaceToneOverride="light"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
