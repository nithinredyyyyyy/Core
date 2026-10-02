import React from "react";
import TeamIdentity from "@/components/shared/TeamIdentity";
import { getTeamLogoByName } from "@/lib/teamLogos";
import { getClubShortCode } from "@/components/rankings/utils/rankingHelpers";

export function LogoOrInitials({ name, className = "" }) {
  if (getTeamLogoByName(name)) {
    return <TeamIdentity name={name} hideText contained={true} />;
  }

  return (
    <div
      className={`flex size-20 items-center justify-center rounded-2xl bg-secondary/50 px-2 text-2xl font-black text-muted-foreground ${className}`}
    >
      {getClubShortCode(name)}
    </div>
  );
}
