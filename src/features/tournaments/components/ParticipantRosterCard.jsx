import React from "react";
import { Link } from "react-router-dom";
import TeamIdentity from "@/components/shared/TeamIdentity";
import { normalizeOrganizationName } from "@/lib/organizationIdentity";
import { buildTeamLink, getDisplayTeamName } from "@/features/tournaments/utils/participantHelpers";

export default function ParticipantRosterCard({ entry, liveParticipantRosters, tournamentStatus }) {
  const liveRoster = liveParticipantRosters[normalizeOrganizationName(entry.team)] || [];
  const displayRoster =
    tournamentStatus === "completed"
      ? entry.players || []
      : liveRoster.length > 0
        ? liveRoster
        : entry.players || [];
  const qualificationParts = [entry.qualification, entry.seed]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return (
    <div key={`${entry.placement}-${entry.team}`} className="rounded-xl border border-border bg-background/80 p-4">
      <div className="mb-1 flex items-center gap-2">
        <p className="text-sm font-semibold text-foreground">{entry.placement}.</p>
        <Link to={buildTeamLink(entry.team)} className="inline-flex">
          <TeamIdentity
            name={getDisplayTeamName(entry.team)}
            className="font-semibold text-foreground"
          />
        </Link>
      </div>
      {qualificationParts.length > 0 && (
        <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-primary">
          {qualificationParts.join(" - ")}
        </p>
      )}
      {displayRoster?.length ? (
        <p className="mt-3 text-sm text-muted-foreground">{displayRoster.join(", ")}</p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Roster to be announced.</p>
      )}
    </div>
  );
}
