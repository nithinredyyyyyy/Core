import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ShareMenu from "@/components/shared/ShareMenu";
import { useTeamDetailModel } from "@/components/teams/detail/hooks/useTeamDetailModel";
import { TeamDetailHero } from "@/components/teams/detail/sections/TeamDetailHero";
import { TeamDetailMainColumn } from "@/components/teams/detail/sections/TeamDetailMainColumn";
import { TeamDetailSideColumn } from "@/components/teams/detail/sections/TeamDetailSideColumn";

export default function TeamDetail({ team, participant, onBack }) {
  const {
    achievementHistory,
    achievementYears,
    activeYearsLabel,
    displayLogo,
    displayLogoSurfaceTone,
    organizationAliases,
    primaryStats,
    recentMatches,
    relatedArticles,
    secondaryStats,
    status,
  } = useTeamDetailModel({ team, participant });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 size-4" /> Back to Teams
        </Button>
        <ShareMenu title={team?.name || "Team"} />
      </div>

      <TeamDetailHero
        team={team}
        participant={participant}
        status={status}
        displayLogo={displayLogo}
        displayLogoSurfaceTone={displayLogoSurfaceTone}
        primaryStats={primaryStats}
        secondaryStats={secondaryStats}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <TeamDetailMainColumn
          participant={participant}
          team={team}
          achievementHistory={achievementHistory}
          achievementYears={achievementYears}
        />
        <TeamDetailSideColumn
          team={team}
          activeYearsLabel={activeYearsLabel}
          organizationAliases={organizationAliases}
          recentMatches={recentMatches}
          relatedArticles={relatedArticles}
        />
      </div>
    </div>
  );
}
