import React from "react";
import { Link } from "react-router-dom";
import LogoBlock from "@/components/shared/LogoBlock";
import ProfilePanel from "@/components/shared/ProfilePanel";

export function CurrentTeamPanel({ teamName, teamTag, teamLogo, teamLogoSurfaceTone }) {
  return (
    <ProfilePanel title="Current team">
      <Link
        to={`/teams?team=${encodeURIComponent(teamName)}`}
        className="mt-4 flex items-center gap-3 rounded-[18px] border border-border bg-background/75 p-4 transition-colors hover:border-primary/30"
      >
        <LogoBlock
          src={teamLogo}
          alt={teamName}
          sizeClass="size-14"
          roundedClass="rounded-2xl"
          paddingClass="p-2.5"
          surfaceTone={teamLogoSurfaceTone}
          className="bg-[radial-gradient(circle_at_top,rgba(var(--rgb-251-146-60),0.14),rgba(var(--rgb-255-255-255),0.98)_72%,rgba(var(--rgb-248-243-235),0.98)_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(var(--rgb-251-146-60),0.18),rgba(var(--rgb-27-27-31),0.98)_72%,rgba(var(--rgb-17-24-39),1)_100%)]"
        />
        <div>
          <p className="font-semibold text-foreground">{teamName}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {teamTag}
          </p>
        </div>
      </Link>
    </ProfilePanel>
  );
}
