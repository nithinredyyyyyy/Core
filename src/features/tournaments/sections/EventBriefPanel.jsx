import React from "react";
import { Accordion } from "@/components/ui/accordion";
import { EventBriefBody } from "@/features/tournaments/sections/EventBriefBody";
import { FormatCalendarItem } from "@/features/tournaments/sections/FormatCalendarItem";
import { PrizePoolItem } from "@/features/tournaments/sections/PrizePoolItem";
import { ParticipantsItem } from "@/features/tournaments/sections/ParticipantsItem";
import { AwardsItem } from "@/features/tournaments/sections/AwardsItem";
import { RankingsItem } from "@/features/tournaments/sections/RankingsItem";

export function EventBriefPanel({
  tournament,
  spotlightStage,
  allocations,
  stageDetails,
  prizeColumns,
  participantEntries,
  participantSections,
  liveParticipantRosters,
  rankings,
  useIntegratedRankingsStage,
}) {
  return (
    <div className="lg:col-span-2 bg-card border border-border rounded-xl">
      <div className="p-5 border-b border-border">
        <h2 className="font-heading text-sm font-semibold tracking-wider uppercase">Event Brief</h2>
      </div>
      <div className="p-6">
        <EventBriefBody
          tournament={tournament}
          spotlightStage={spotlightStage}
          allocations={allocations}
        />
        <div className="pt-4">
          <Accordion
            type="single"
            collapsible
            defaultValue={
              tournament.name === "Battlegrounds Mobile India Pro Series 2026"
                ? "format-calendar"
                : undefined
            }
            className="w-full"
          >
            {(tournament.format_overview || tournament.calendar?.length) && (
              <FormatCalendarItem tournament={tournament} stageDetails={stageDetails} />
            )}

            {tournament.prize_breakdown?.length > 0 && (
              <PrizePoolItem tournament={tournament} prizeColumns={prizeColumns} />
            )}

            {participantEntries.length > 0 && (
              <ParticipantsItem
                participantSections={participantSections}
                liveParticipantRosters={liveParticipantRosters}
                tournamentStatus={tournament.status}
              />
            )}

            {tournament.awards?.length > 0 && (
              <AwardsItem tournament={tournament} />
            )}

            {rankings.length > 0 && !useIntegratedRankingsStage && (
              <RankingsItem rankings={rankings} />
            )}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
