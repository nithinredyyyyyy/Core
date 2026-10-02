import React from "react";
import LogoBlock from "@/components/shared/LogoBlock";
import ProfileStatGrid from "@/components/shared/ProfileStatGrid";

export function PlayerProfileHero({
  displayIgn,
  teamName,
  currentTournament,
  primaryStats,
  secondaryStats,
  playerPhoto,
  teamLogo,
  teamLogoSurfaceTone,
  teamTag,
}) {
  return (
    <div className="overflow-hidden rounded-[30px] border border-border/70 bg-card shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
      <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
        <div className="space-y-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
              Player profile
            </p>
            <h1 className="mt-2 text-4xl font-semibold uppercase tracking-[-0.05em] text-foreground">
              {displayIgn}
            </h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Current team:{" "}
              <span className="font-semibold text-foreground">
                {teamName}
              </span>
              {currentTournament
                ? ` • Active in ${currentTournament.name}`
                : ""}
            </p>
          </div>

          <ProfileStatGrid
            primary={primaryStats}
            secondary={secondaryStats}
            variant="light"
          />
        </div>

        <div className="flex items-center justify-center">
          {playerPhoto ? (
            <div className="relative flex h-[26rem] w-full max-w-[24rem] items-end justify-center overflow-hidden rounded-[30px] border border-border bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.14),rgba(255,255,255,0.98)_52%,rgba(248,243,235,0.98)_100%)] shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.18),rgba(27,27,31,0.98)_58%,rgba(17,24,39,1)_100%)]">
              <img
                src={playerPhoto}
                alt={displayIgn}
                className="size-full object-contain object-bottom"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            </div>
          ) : (
            <LogoBlock
              src={teamLogo}
              alt={teamName}
              sizeClass="size-56"
              roundedClass="rounded-[30px]"
              paddingClass="p-7"
              surfaceTone={teamLogoSurfaceTone}
              className="border-border bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.12),rgba(255,255,255,0.98)_72%,rgba(248,243,235,0.98)_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.18),rgba(27,27,31,0.98)_72%,rgba(17,24,39,1)_100%)]"
            >
              {!teamLogo ? (
                <span className="text-5xl font-black uppercase text-primary">
                  {teamTag.slice(0, 2)}
                </span>
              ) : null}
            </LogoBlock>
          )}
        </div>
      </div>
    </div>
  );
}
