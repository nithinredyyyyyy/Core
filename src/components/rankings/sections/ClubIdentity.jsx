import React from "react";
import TeamIdentity from "@/components/shared/TeamIdentity";
import { getTeamLogoByName } from "@/lib/teamLogos";
import { getClubShortCode } from "@/components/rankings/utils/rankingHelpers";

export function ClubIdentity({ name }) {
  if (getTeamLogoByName(name)) {
    return <TeamIdentity name={name} className="font-bold text-foreground" />;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary/70 px-1 text-xs font-black text-muted-foreground">
        {getClubShortCode(name)}
      </span>
      <span className="font-bold text-foreground">{name}</span>
    </div>
  );
}
