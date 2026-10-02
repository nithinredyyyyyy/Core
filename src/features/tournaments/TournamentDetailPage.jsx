import QueryError from "@/components/shared/QueryError";
import PageSkeleton from "@/components/shared/PageSkeleton";
import PageShell from "@/components/shared/PageShell";
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
    isCoreLoading, isFullLoading, coreError, fullError, refetchCore, refetchFull,
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
    <PageShell>
      <BackButton onBack={onBack} tournamentName={tournament.name} />

      <TournamentHero
        tournament={tournament}
        tournamentLogo={tournamentLogo}
        participantCount={participantCount}
      />

      {coreError && <QueryError title="Tournament data unavailable" onRetry={refetchCore} />}
      {fullError && <QueryError title="Tournament details unavailable" onRetry={refetchFull} />}
      {(isCoreLoading || isFullLoading) && <PageSkeleton label="Loading tournament details" rows={3} showHeader={false} />}

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
          <PageSkeleton label="Loading standings" rows={3} showHeader={false} />
        )}
      </div>
    </PageShell>
  );
}
