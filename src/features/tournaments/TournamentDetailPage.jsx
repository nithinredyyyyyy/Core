import { useTournamentDetailModel } from "@/features/tournaments/hooks/useTournamentDetailModel";
import React from "react";
import StageStandingsBoard from "@/features/tournaments/components/StageStandingsBoard";
import { BackButton } from "@/features/tournaments/sections/BackButton";
import { TournamentHero } from "@/features/tournaments/sections/TournamentHero";
import { FeaturedFactsGrid } from "@/features/tournaments/sections/FeaturedFactsGrid";
import { EventBriefPanel } from "@/features/tournaments/sections/EventBriefPanel";
import { ChampionCard } from "@/features/tournaments/sections/ChampionCard";

/** @param {import("@/types/tournaments").TournamentDetailProps} props */
export default function TournamentDetail({ tournament, onBack, requestedStage = "" }) {
  const {
    tournamentLogo,
    participantCount,
    featuredFacts,
    spotlightStage,
    allocations,
    stageDetails,
    prizeColumns,
    participantEntries,
    participantSections,
    liveParticipantRosters,
    rankings,
    useIntegratedRankingsStage,
    championEntry,
    championImageSrc,
    championRoster,
    championTeamName,
    championDisplayName,
    championLogoOverride,
    stageBoardRef,
    hasStageProgression,
    stageBoardVisible,
    stageBoardStages,
    resolvedParticipantState,
    teams,
    players,
    calendarMatches,
    matchResults,
  } = useTournamentDetailModel({ tournament, requestedStage });


  return (
    <div className="space-y-6">
      <BackButton onBack={onBack} tournamentName={tournament.name} />

      <TournamentHero
        tournament={tournament}
        tournamentLogo={tournamentLogo}
        participantCount={participantCount}
      />

      <FeaturedFactsGrid facts={featuredFacts} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <EventBriefPanel
          tournament={tournament}
          spotlightStage={spotlightStage}
          allocations={allocations}
          stageDetails={stageDetails}
          prizeColumns={prizeColumns}
          participantEntries={participantEntries}
          participantSections={participantSections}
          liveParticipantRosters={liveParticipantRosters}
          rankings={rankings}
          useIntegratedRankingsStage={useIntegratedRankingsStage}
        />

        {championEntry && tournament.status !== "upcoming" && (championImageSrc || championRoster?.length > 0) && (
        <ChampionCard
          championEntry={championEntry}
          championImageSrc={championImageSrc}
          championRoster={championRoster}
          championTeamName={championTeamName}
          championDisplayName={championDisplayName}
          championLogoOverride={championLogoOverride}
          tournament={tournament}
          tournamentLogo={tournamentLogo}
        />
        )}
      </div>

      <div ref={stageBoardRef}>
        {hasStageProgression && stageBoardVisible && (
          <StageStandingsBoard
            stages={stageBoardStages}
            participantEntries={resolvedParticipantState.participantEntries}
            tournamentName={tournament.name}
            tournamentId={tournament.id}
            teams={teams}
            players={players}
            matches={calendarMatches}
            matchResults={matchResults}
            requestedStage={requestedStage}
            rankings={useIntegratedRankingsStage ? rankings : []}
          />
        )}
        {hasStageProgression && !stageBoardVisible && (
          <div className="rounded-xl border bg-card p-8 animate-pulse">
            <div className="h-6 w-48 bg-muted rounded mb-4" />
            <div className="h-4 w-32 bg-muted rounded mb-6" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
