import QueryError from "@/components/shared/QueryError";
import PageShell from "@/components/shared/PageShell";
import React from "react";
import ShareMenu from "@/components/shared/ShareMenu";
import { usePlayerProfileModel } from "@/components/players/hooks/usePlayerProfileModel";
import { LoadingPlayerState } from "@/components/players/sections/LoadingPlayerState";
import { PlayerNotFound } from "@/components/players/sections/PlayerNotFound";
import { BackToTeamsLink } from "@/components/players/sections/BackToTeamsLink";
import { PlayerProfileHero } from "@/components/players/sections/PlayerProfileHero";
import { TournamentAppearancesPanel } from "@/components/players/sections/TournamentAppearancesPanel";
import { CurrentTeamPanel } from "@/components/players/sections/CurrentTeamPanel";
import { CareerPathPanel } from "@/components/players/sections/CareerPathPanel";
import { RelatedStoriesPanel } from "@/components/players/sections/RelatedStoriesPanel";
import { IndividualResultsPanel } from "@/components/players/sections/IndividualResultsPanel";

export default function PlayerProfile() {
  const {
    careerTeams,
    currentTournament,
    displayIgn,
    isLoading,
    error,
    playerPhoto,
    primaryStats,
    resolved,
    resultYears,
    secondaryStats,
    teamLogo,
    teamLogoSurfaceTone,
    teamName,
    teamTag,
  } = usePlayerProfileModel();

  if (error) return <PageShell><QueryError title="Could not load player" /></PageShell>;

  if (isLoading) {
    return <LoadingPlayerState />;
  }

  if (!resolved.playerRow && !resolved.snapshotTeam) {
    return <PlayerNotFound />;
  }

  return (
    <PageShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackToTeamsLink teamName={teamName} />
        <ShareMenu title={`${displayIgn} — Player profile`} />
      </div>

      <PlayerProfileHero
        displayIgn={displayIgn}
        teamName={teamName}
        currentTournament={currentTournament}
        primaryStats={primaryStats}
        secondaryStats={secondaryStats}
        playerPhoto={playerPhoto}
        teamLogo={teamLogo}
        teamLogoSurfaceTone={teamLogoSurfaceTone}
        teamTag={teamTag}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <TournamentAppearancesPanel
          tournaments={resolved.relatedTournaments}
        />

        <div className="space-y-4">
          <CurrentTeamPanel
            teamName={teamName}
            teamTag={teamTag}
            teamLogo={teamLogo}
            teamLogoSurfaceTone={teamLogoSurfaceTone}
          />
          <CareerPathPanel teams={careerTeams} />
          <RelatedStoriesPanel articles={resolved.relatedArticles} />
        </div>
      </div>

      <IndividualResultsPanel
        resultYears={resultYears}
        playerResults={resolved.playerResults}
      />
    </PageShell>
  );
}
