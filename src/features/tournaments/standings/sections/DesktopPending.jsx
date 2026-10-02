import React from "react";
import BmpsSemiFinalsPendingPanel from "@/features/tournaments/components/BmpsSemiFinalsPendingPanel";

export function DesktopPending({ shouldHideProjectedStageTeams, stageParticipants, matches, tournamentId, activeStage, bmpsWaitingStageName }) {
  return (
    shouldHideProjectedStageTeams ? (
      <BmpsSemiFinalsPendingPanel
        stageParticipants={stageParticipants}
        matches={matches}
        tournamentId={tournamentId}
      />
    ) : (
      <div className="rounded-xl border border-border bg-background/90 px-5 py-6 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Standings pending</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {bmpsWaitingStageName
            ? `${activeStage.name} groups will appear automatically after ${bmpsWaitingStageName} results are added.`
            : activeStage.summary || "This stage is part of the tournament flow, but standings data has not been attached yet."}
        </p>
      </div>
    )
  );
}
