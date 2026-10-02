import { useStageStandingsModel } from "@/features/tournaments/hooks/useStageStandingsModel";
import React from "react";
import { EMPTY_STAGE_MATCH_RESULTS, EMPTY_STAGE_MATCHES, EMPTY_STAGE_PARTICIPANT_ENTRIES, EMPTY_STAGE_PLAYERS, EMPTY_STAGE_RANKINGS, EMPTY_STAGE_TEAMS } from "@/features/tournaments/constants";
import StatisticsPanel from "@/features/tournaments/components/StatisticsPanel";
import { MobileStageSelector, MobileStandingsCard, MobileGroupedDraw, MobileGroupParticipants, MobilePending, MobileProjectedTeams } from "@/features/tournaments/components/MobileStageBoard";
import { DesktopStageSelector } from "@/features/tournaments/standings/sections/DesktopStageSelector";
import { StandingsLegend } from "@/features/tournaments/standings/sections/StandingsLegend";
import { DesktopGroupedDraw } from "@/features/tournaments/standings/sections/DesktopGroupedDraw";
import { DesktopStandingsTable } from "@/features/tournaments/standings/sections/DesktopStandingsTable";
import { DesktopGroupParticipants } from "@/features/tournaments/standings/sections/DesktopGroupParticipants";
import { DesktopProjectedTeams } from "@/features/tournaments/standings/sections/DesktopProjectedTeams";
import { DesktopPending } from "@/features/tournaments/standings/sections/DesktopPending";

export default React.memo(function StageStandingsBoard({
  stages,
  participantEntries = EMPTY_STAGE_PARTICIPANT_ENTRIES,
  tournamentName,
  tournamentId,
  teams = EMPTY_STAGE_TEAMS,
  players = EMPTY_STAGE_PLAYERS,
  matches = EMPTY_STAGE_MATCHES,
  matchResults = EMPTY_STAGE_MATCH_RESULTS,
  requestedStage = "",
  rankings = EMPTY_STAGE_RANKINGS,
}) {
  const {
    activeStage,
    stageOptions,
    dispatchStageBoardUi,
    groups,
    showsGroupedDrawTab,
    hideOverallGroupOption,
    currentSelectedGroup,
    visibleGroupOptions,
    legendItems,
    isStatisticsStage,
    isRankingsStatisticsStage,
    statisticsCategories,
    currentStatisticsCategory,
    eliminatorSubStages,
    currentStatisticsSubStage,
    statisticsTableKey,
    tableSort,
    sortedStatisticsTableRows,
    bmps2026PlayerTeams,
    selectedMvpStats,
    groupedParticipants,
    maxGroupRows,
    usesPromotionGroups,
    completeGroupStandings,
    filteredStandings,
    showMovementColumn,
    isPmwcMovementStage,
    useContainedGroupLogos,
    showGroupColumn,
    getOverallStandingGroupLabel,
    groupParticipants,
    isSurvivalStageLobbyView,
    showGroupParticipantMovement,
    stageParticipants,
    shouldHideProjectedStageTeams,
    bmpsWaitingStageName,
  } = useStageStandingsModel({ stages, participantEntries, tournamentName, tournamentId, teams, players, matches, matchResults, requestedStage, rankings });


  if (!activeStage) return null;

  return (
    <div className="space-y-4">
      <div className="hidden md:block">
        <DesktopStageSelector stageOptions={stageOptions} activeStage={activeStage} dispatchStageBoardUi={dispatchStageBoardUi} tournamentName={tournamentName} groups={groups} showsGroupedDrawTab={showsGroupedDrawTab} hideOverallGroupOption={hideOverallGroupOption} currentSelectedGroup={currentSelectedGroup} visibleGroupOptions={visibleGroupOptions} />
      </div>
      <div className="md:hidden">
        <MobileStageSelector stageOptions={stageOptions} activeStage={activeStage} dispatchStageBoardUi={dispatchStageBoardUi} tournamentName={tournamentName} groups={groups} showsGroupedDrawTab={showsGroupedDrawTab} hideOverallGroupOption={hideOverallGroupOption} currentSelectedGroup={currentSelectedGroup} visibleGroupOptions={visibleGroupOptions} />
      </div>

      {activeStage.standings?.length && legendItems.length > 0 ? (
        <StandingsLegend legendItems={legendItems} />
      ) : null}

      <StatisticsPanel
        isStatisticsStage={isStatisticsStage}
        isRankingsStatisticsStage={isRankingsStatisticsStage}
        activeStage={activeStage}
        rankings={rankings}
        categories={statisticsCategories}
        currentCategory={currentStatisticsCategory}
        onSelectCategory={(categoryKey) =>
          dispatchStageBoardUi({
            type: "selectStatisticsCategory",
            payload: categoryKey,
          })
        }
        subStages={eliminatorSubStages}
        currentSubStage={currentStatisticsSubStage}
        onSelectSubStage={(subStageKey) =>
          dispatchStageBoardUi({
            type: "selectStatisticsSubStage",
            payload: subStageKey,
          })
        }
        tableKey={statisticsTableKey}
        tableSort={tableSort}
        dispatch={dispatchStageBoardUi}
        rows={sortedStatisticsTableRows}
        playerTeams={bmps2026PlayerTeams}
        mvpRows={selectedMvpStats}
      />

      {!isStatisticsStage &&
      currentSelectedGroup === "groups" &&
      showsGroupedDrawTab ? (
        <>
          <div className="hidden md:block">
            <DesktopGroupedDraw activeStage={activeStage} groupedParticipants={groupedParticipants} maxGroupRows={maxGroupRows} />
          </div>
          <div className="md:hidden">
            <MobileGroupedDraw activeStage={activeStage} groupedParticipants={groupedParticipants} />
          </div>
        </>
      ) : !isStatisticsStage && activeStage.standings?.length ? (
        <>
          <div className="hidden md:block">
            <DesktopStandingsTable usesPromotionGroups={usesPromotionGroups} completeGroupStandings={completeGroupStandings} filteredStandings={filteredStandings} showMovementColumn={showMovementColumn} isPmwcMovementStage={isPmwcMovementStage} activeStage={activeStage} currentSelectedGroup={currentSelectedGroup} tournamentName={tournamentName} useContainedGroupLogos={useContainedGroupLogos} showGroupColumn={showGroupColumn} getOverallStandingGroupLabel={getOverallStandingGroupLabel} />
          </div>
          <div className="space-y-2.5 md:hidden">
            {(usesPromotionGroups ? completeGroupStandings : filteredStandings).map((entry, index) => (
              <MobileStandingsCard
                key={`${activeStage.name}-${currentSelectedGroup}-${entry.placement}-${entry.team}`}
                entry={entry}
                index={index}
                activeStage={activeStage}
                currentSelectedGroup={currentSelectedGroup}
                tournamentName={tournamentName}
                showMovementColumn={showMovementColumn}
                isPmwcMovementStage={isPmwcMovementStage}
                usesPromotionGroups={usesPromotionGroups}
              />
            ))}
          </div>
        </>
      ) : !isStatisticsStage && currentSelectedGroup !== "overall" && groupParticipants.length > 0 ? (
        <>
          <div className="hidden md:block">
            <DesktopGroupParticipants tournamentName={tournamentName} activeStage={activeStage} isSurvivalStageLobbyView={isSurvivalStageLobbyView} groupParticipants={groupParticipants} showGroupParticipantMovement={showGroupParticipantMovement} currentSelectedGroup={currentSelectedGroup} />
          </div>
          <div className="md:hidden">
            <MobileGroupParticipants tournamentName={tournamentName} activeStage={activeStage} groupParticipants={groupParticipants} showGroupParticipantMovement={showGroupParticipantMovement} currentSelectedGroup={currentSelectedGroup} />
          </div>
        </>
      ) : !isStatisticsStage && stageParticipants.length > 0 && !shouldHideProjectedStageTeams ? (
        <>
          <div className="hidden md:block">
            <DesktopProjectedTeams activeStage={activeStage} stageParticipants={stageParticipants} />
          </div>
          <div className="md:hidden">
            <MobileProjectedTeams activeStage={activeStage} stageParticipants={stageParticipants} />
          </div>
        </>
      ) : !isStatisticsStage ? (
        <>
          <div className="hidden md:block">
            <DesktopPending shouldHideProjectedStageTeams={shouldHideProjectedStageTeams} stageParticipants={stageParticipants} matches={matches} tournamentId={tournamentId} activeStage={activeStage} bmpsWaitingStageName={bmpsWaitingStageName} />
          </div>
          <div className="md:hidden">
            <MobilePending activeStage={activeStage} bmpsWaitingStageName={bmpsWaitingStageName} />
          </div>
        </>
      ) : null}
    </div>
  );
})
