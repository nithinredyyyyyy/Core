import React, { useMemo, useReducer } from "react";
import { Link } from "react-router-dom";
import TeamIdentity from "@/components/shared/TeamIdentity";
import { normalizeOrganizationName } from "@/lib/organizationIdentity";
import { compareStageBoardStandings, getFeaturedTournamentStage } from "@/lib/stageBoard";
import {
  isBmps2026PromotionStage,
} from "@/lib/bmps2026Progression";
import { resolveTournamentParticipantState } from "@/lib/tournamentProgression";
import {
  createStageBoardUiState,
  stageBoardUiReducer,
} from "@/features/tournaments/hooks/stageBoardUiReducer";
import {
  EMPTY_STAGE_MATCH_RESULTS,
  EMPTY_STAGE_MATCHES,
  EMPTY_STAGE_PARTICIPANT_ENTRIES,
  EMPTY_STAGE_PLAYERS,
  EMPTY_STAGE_RANKINGS,
  EMPTY_STAGE_TEAMS,
} from "@/features/tournaments/constants";
import { getBmps2026PreviousStageName } from "@/features/tournaments/utils/stageHelpers";
import {
  buildTeamLink,
  dedupeParticipantEntriesByOrganization,
  getBmps2026FallbackGroupForTeam,
  getBmps2026GroupDrawEntries,
  getDisplayTeamName,
  getGrandFinalsPlacementTone,
  getGroupMovementAccent,
  getGroupMovementRule,
  getOutcomeTone,
  getParticipantEntryPhases,
  getParticipantStageGroup,
  getStrictParticipantStageGroup,
  isBmps2026KnockoutStage,
  isBmps2026SemiFinalsStage,
  isBmps2026SurvivalStage,
  shouldOpenBmps2026GroupsByDefault,
} from "@/features/tournaments/utils/participantHelpers";
import BmpsSemiFinalsPendingPanel from "@/features/tournaments/components/BmpsSemiFinalsPendingPanel";
import StatisticsPanel from "@/features/tournaments/components/StatisticsPanel";
import {
  MobileStageSelector,
  MobileStandingsCard,
  MobileGroupedDraw,
  MobileGroupParticipants,
  MobilePending,
  MobileProjectedTeams,
} from "@/features/tournaments/components/MobileStageBoard";
import {
  useBmps2026Statistics,
  useStatisticsRows,
} from "@/features/tournaments/hooks/useBmps2026Statistics";

function DesktopStageSelector({ stageOptions, activeStage, dispatchStageBoardUi, tournamentName, groups, showsGroupedDrawTab, hideOverallGroupOption, currentSelectedGroup, visibleGroupOptions }) {
  return (
    <div className="rounded-xl border border-border bg-background/90 p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {stageOptions.map((stage) => {
          const active = stage.name === activeStage.name;
          return (
            <button
              key={stage.name}
              type="button"
              onClick={() => {
                dispatchStageBoardUi({
                  type: "selectStage",
                  payload: {
                    stageName: stage.name,
                    selectedGroup:
                      tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
                      shouldOpenBmps2026GroupsByDefault(stage.name)
                        ? "groups"
                        : "overall",
                  },
                });
              }}
              className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {stage.name === "Wildcard" ? "Wildcards" : stage.name}
            </button>
          );
        })}
      </div>

      {groups.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
          {showsGroupedDrawTab ? (
            <button
              type="button"
              onClick={() =>
                dispatchStageBoardUi({
                  type: "selectGroup",
                  payload: "groups",
                })
              }
              className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                currentSelectedGroup === "groups"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              Groups
            </button>
          ) : null}
          {!hideOverallGroupOption ? (
            <button
              type="button"
              onClick={() =>
                dispatchStageBoardUi({
                  type: "selectGroup",
                  payload: "overall",
                })
              }
              className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                currentSelectedGroup === "overall"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              Overall
            </button>
          ) : null}
          {visibleGroupOptions.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() =>
                dispatchStageBoardUi({
                  type: "selectGroup",
                  payload: group,
                })
              }
              className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                currentSelectedGroup === group
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              Group {String(group).replace(/^Group\s+/i, "").trim()}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function StandingsLegend({ legendItems }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
      {legendItems.map(([label, dotClass]) => (
        <div key={label} className="flex items-center gap-2">
          <span className={`h-3.5 w-3.5 rounded ${dotClass}`} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function DesktopGroupedDraw({ activeStage, groupedParticipants, maxGroupRows }) {
  return (
    <>
    {isBmps2026SurvivalStage(activeStage?.name) ? (
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-5 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-200">
          Survival Stage Logic
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          These four groups are match lobbies. After the stage is played, the overall 32-team standings decide movement: top 8 advance to Semi Finals, ranks 9-32 are eliminated from BMPS 2026.
        </p>
      </div>
    ) : null}
    {isBmps2026SurvivalStage(activeStage?.name) ? (
      <div className="grid overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:grid-cols-2 xl:grid-cols-4">
        {groupedParticipants.map((section, index) => (
          <div
            key={`${activeStage.name}-${section.group}`}
            className={`min-w-0 ${
              index < groupedParticipants.length - 1 ? "border-b" : ""
            } ${index % 2 === 0 ? "md:border-r" : ""} ${
              index < 2 ? "md:border-b" : "md:border-b-0"
            } ${
              index < groupedParticipants.length - 1 ? "xl:border-r" : "xl:border-r-0"
            } xl:border-b-0 border-border`}
          >
            <div className="bg-brand-navy px-5 py-4 text-center">
              <p className="text-sm font-black uppercase tracking-[0.12em] text-white">
                Group {String(section.group).replace(/^Group\s+/i, "").trim()}
              </p>
            </div>
            <div className="divide-y divide-border">
              {section.entries.length > 0 ? (
                section.entries.map((entry, index) => (
                  <div
                    key={`${activeStage.name}-${section.group}-${entry.team || index}`}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    {entry?.team ? (
                      <Link
                        to={buildTeamLink(entry.team)}
                        className="flex min-w-0 flex-1 items-center text-left"
                      >
                        <TeamIdentity
                          name={getDisplayTeamName(entry.team)}
                          className="min-w-0 flex-1 text-left font-semibold text-foreground"
                          containerClassName="w-full justify-start text-left"
                          contained
                          compact
                          surfaceToneOverride="light"
                        />
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">Team pending</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-4 py-5 text-sm text-muted-foreground">
                  Teams pending
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="bg-brand-navy px-5 py-4 text-center">
          <p className="text-lg font-black uppercase tracking-[0.08em] text-white">
            {activeStage.name.toUpperCase()} GROUPS
          </p>
        </div>
        <div className="max-h-[70vh] overflow-auto">
        <table className="w-full min-w-[920px] border-separate border-spacing-0 text-sm [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-20 [&_thead_th]:bg-brand-sky-mist dark:[&_thead_th]:bg-slate-800">
          <thead>
            <tr className="border-b border-border bg-brand-sky-mist text-sm font-black uppercase tracking-[0.06em] text-slate-800 dark:bg-slate-800 dark:text-slate-100">
              {groupedParticipants.map((section) => (
                <th
                  key={`${activeStage.name}-${section.group}`}
                  className="border-r border-border/60 px-6 py-4 text-center last:border-r-0"
                >
                  Group {String(section.group).replace(/^Group\s+/i, "").trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxGroupRows }).map((_, rowIndex) => (
              <tr
                key={`${activeStage.name}-group-row-${rowIndex}`}
                className="border-b border-border bg-background last:border-b-0 dark:bg-slate-950"
              >
                {groupedParticipants.map((section) => {
                  const entry = section.entries[rowIndex];
                  return (
                    <td
                      key={`${activeStage.name}-${section.group}-${rowIndex}`}
                      className="border-r border-border/60 px-5 py-4 align-middle last:border-r-0"
                    >
                      {entry ? (
                        <div className="flex min-w-0 items-center gap-3">
                          <Link to={buildTeamLink(entry.team)} className="inline-flex min-w-0 items-center gap-3">
                            <TeamIdentity
                              name={getDisplayTeamName(entry.team)}
                              className="font-semibold text-foreground"
                              contained
                              surfaceToneOverride="light"
                            />
                          </Link>
                          {entry.sourcePlaceholder ? (
                            <span className="shrink-0 rounded-full border border-violet-300 bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-violet-700 dark:border-violet-400/40 dark:text-violet-200">
                              {entry.sourcePlaceholder}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    )}
    </>
  );
}

function DesktopStandingsTable({ usesPromotionGroups, completeGroupStandings, filteredStandings, showMovementColumn, isPmwcMovementStage, activeStage, currentSelectedGroup, tournamentName, useContainedGroupLogos, showGroupColumn, getOverallStandingGroupLabel }) {
  return (
    <div className="max-h-[70vh] overflow-auto rounded-xl border border-border bg-background/90 shadow-sm">
      <table className="w-full min-w-[820px] border-separate border-spacing-0 text-sm [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-20 [&_thead_th]:bg-secondary">
        <thead>
          <tr className="border-b border-border bg-secondary/30 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <th className="border-r border-border/60 p-4 text-left">#</th>
            <th className="border-r border-border/60 p-4 text-left">Team</th>
            {showGroupColumn ? <th className="border-r border-border/60 p-4 text-center">Grp</th> : null}
            <th className="border-r border-border/60 p-4 text-center">M</th>
            <th className="border-r border-border/60 p-4 text-center">WWCD</th>
            <th className="border-r border-border/60 p-4 text-center">Place</th>
            <th className="border-r border-border/60 p-4 text-center">Elims</th>
            <th className="border-r border-border/60 p-4 text-center font-black text-foreground">Pts</th>
            {showMovementColumn ? <th className="p-4 text-left">Movement</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {(usesPromotionGroups ? completeGroupStandings : filteredStandings).map((entry, index) => {
            const tone = getOutcomeTone(entry.outcome);
            const podiumTone = getGrandFinalsPlacementTone(activeStage.name, entry.placement);
            const movementRows = usesPromotionGroups ? completeGroupStandings : filteredStandings;
            const movement = showMovementColumn
              ? getGroupMovementRule(tournamentName, activeStage?.name, currentSelectedGroup, index + 1, movementRows.length)
              : null;
            const movementAccent = showMovementColumn
              ? getGroupMovementAccent(tournamentName, activeStage?.name, currentSelectedGroup, index + 1, movementRows.length)
              : null;
            return (
              <tr
                key={`${activeStage.name}-${currentSelectedGroup}-${entry.placement}-${entry.team}`}
                className={`${
                  podiumTone?.row || (index % 2 === 0 ? "bg-background/70" : "bg-secondary/10")
                } transition-colors`}
              >
                <td className={`border-r border-border/50 border-l-4 p-4 font-semibold ${(showMovementColumn && movementAccent?.cell) ? movementAccent.cell : (podiumTone?.border || tone.border)}`}>
                  <span className={`inline-flex size-10 items-center justify-center rounded-full font-black ${(showMovementColumn && movementAccent?.rank) ? movementAccent.rank : (podiumTone?.rank || "text-foreground")}`}>
                    {showMovementColumn ? `${index + 1}` : `${entry.placement}`}
                  </span>
                </td>
                <td className="border-r border-border/50 p-4">
                  <Link
                    to={buildTeamLink(entry.fullTeam || entry.team)}
                    className="inline-flex items-center"
                  >
                    <TeamIdentity
                      name={entry.fullTeam || entry.team}
                      className="font-medium text-foreground"
                      contained={useContainedGroupLogos}
                      framed={!useContainedGroupLogos}
                      containerClassName="items-center gap-3"
                      logoBlockClassName="!border-slate-200/90 !bg-white !shadow-[0_4px_12px_rgba(15,23,42,0.06)] dark:!border-white/10 dark:!bg-white/[0.07]"
                      surfaceToneOverride="light"
                    />
                  </Link>
                </td>
                {showGroupColumn ? <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{getOverallStandingGroupLabel(entry)}</td> : null}
                <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.matches ?? "-"}</td>
                <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.wwcd ?? "-"}</td>
                <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.pos ?? "-"}</td>
                <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.elimins ?? "-"}</td>
                <td className={`border-r border-border/50 p-4 text-center text-lg font-black ${podiumTone?.points || "text-foreground"}`}>{entry.points}</td>
                {showMovementColumn ? (
                  <td className="p-4">
                    {movement ? (
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${movement.tone}`}>
                        {movement.label}
                      </span>
                    ) : isPmwcMovementStage && tone && tone.label !== "Stage result" ? (
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${tone.border.replace('border-l-', 'border-')}/30 ${tone.dot}/10 ${tone.dot.replace('bg-', 'text-')} dark:${tone.dot.replace('bg-', 'text-')}`}>
                        {tone.label}
                      </span>
                    ) : usesPromotionGroups ? (
                      <span className="text-sm text-muted-foreground">Hold current group</span>
                    ) : null}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DesktopGroupParticipants({ tournamentName, activeStage, isSurvivalStageLobbyView, groupParticipants, showGroupParticipantMovement, currentSelectedGroup }) {
  return (
    <div className="space-y-4">
      {tournamentName !== "PUBG Mobile World Cup 2026" ? (
      <div className="rounded-xl border border-border bg-background/90 p-5 shadow-sm">
        <p className="text-lg font-semibold uppercase tracking-[0.08em] text-foreground">
          {activeStage.name.toUpperCase()} GROUPS
        </p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {isSurvivalStageLobbyView
            ? "Survival groups are match lobbies only. Qualification is decided by the overall Survival Stage standings: top 8 move to Semi Finals, ranks 9-32 are eliminated from BMPS 2026."
            : activeStage?.name === "Round 4"
            ? "Round 4 locks the group outcomes. Each group now advances independently into Grand Finals, Semi Finals, Survival Stage, or elimination."
            : "Based on weekly group standings, promotions and relegations decide movement for the next week."}
        </p>
        {isSurvivalStageLobbyView ? (
          <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/10 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-200">
              Overall Survival Standings
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Show advancement only after match results create an overall 32-team ranking.
            </p>
          </div>
        ) : activeStage?.name === "Round 4" ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-border bg-secondary/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">Group A</p>
              <p className="mt-2 text-sm text-muted-foreground">Top 8 teams advance to Grand Finals.</p>
              <p className="mt-1 text-sm text-muted-foreground">Bottom 8 teams advance to Semi Finals.</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">Group B</p>
              <p className="mt-2 text-sm text-muted-foreground">Top 8 teams advance to Semi Finals.</p>
              <p className="mt-1 text-sm text-muted-foreground">Bottom 8 teams move to Survival Stage.</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">Group C</p>
              <p className="mt-2 text-sm text-muted-foreground">All 16 teams move to Survival Stage.</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">Group D</p>
              <p className="mt-2 text-sm text-muted-foreground">Top 8 teams move to Survival Stage.</p>
              <p className="mt-1 text-sm text-muted-foreground">Bottom 8 teams are eliminated.</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-secondary/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">Group A ? B</p>
              <p className="mt-2 text-sm text-muted-foreground">Bottom 4 from Group A move to Group B.</p>
              <p className="mt-1 text-sm text-muted-foreground">Top 4 from Group B move to Group A.</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">Group B ? C</p>
              <p className="mt-2 text-sm text-muted-foreground">Bottom 4 from Group B move to Group C.</p>
              <p className="mt-1 text-sm text-muted-foreground">Top 4 from Group C move to Group B.</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">Group C ? D</p>
              <p className="mt-2 text-sm text-muted-foreground">Bottom 4 from Group C move to Group D.</p>
              <p className="mt-1 text-sm text-muted-foreground">Top 4 from Group D move to Group C.</p>
            </div>
          </div>
        )}
      </div>
      ) : null}

      <div className="max-h-[70vh] overflow-auto rounded-xl border border-border bg-background/90 shadow-sm">
        <table className="w-full min-w-[820px] border-separate border-spacing-0 text-sm [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-20 [&_thead_th]:bg-secondary">
          <thead>
            <tr className="border-b border-border bg-secondary/30 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <th className="border-r border-border/60 p-4 text-left">#</th>
              <th className={showGroupParticipantMovement ? "border-r border-border/60 p-4 text-left" : "p-4 text-left"}>Team</th>
              {showGroupParticipantMovement ? <th className="p-4 text-left">Movement</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {groupParticipants.map((entry, index) => {
              const position = index + 1;
              const movement = showGroupParticipantMovement
                ? getGroupMovementRule(tournamentName, activeStage?.name, currentSelectedGroup, position, groupParticipants.length)
                : null;
              return (
                <tr
                  key={`${activeStage.name}-${currentSelectedGroup}-${entry.team}`}
                  className={`${index % 2 === 0 ? "bg-background/70" : "bg-secondary/10"} transition-colors hover:bg-secondary/20`}
                >
                  <td className="border-r border-border/50 p-4 font-semibold text-foreground">{position}.</td>
                  <td className="border-r border-border/50 p-4">
                    <Link to={buildTeamLink(entry.team)} className="inline-flex">
                      <TeamIdentity
                        name={getDisplayTeamName(entry.team)}
                        className="font-semibold text-foreground"
                        contained
                        surfaceToneOverride="light"
                      />
                    </Link>
                  </td>
                  {showGroupParticipantMovement ? (
                    <td className="p-4">
                      {movement ? (
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${movement.tone}`}>
                          {movement.label}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Hold current group</span>
                      )}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DesktopProjectedTeams({ activeStage, stageParticipants }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-background/90 p-5 shadow-sm">
        <p className="text-lg font-semibold uppercase tracking-[0.08em] text-foreground">
          {activeStage.name.toUpperCase()} TEAMS
        </p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Teams currently projected into this stage from completed upstream results.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {stageParticipants.map((entry, index) => (
          <Link
            key={`${activeStage.name}-${entry.team}`}
            to={buildTeamLink(entry.team)}
            className="flex items-center gap-3 rounded-xl border border-border bg-background/90 p-4 shadow-sm transition hover:border-primary/40 hover:bg-secondary/20"
          >
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-foreground">
              {index + 1}
            </span>
            <TeamIdentity
              name={getDisplayTeamName(entry.team)}
              className="font-semibold text-foreground"
              contained
              surfaceToneOverride="light"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

function DesktopPending({ shouldHideProjectedStageTeams, stageParticipants, matches, tournamentId, activeStage, bmpsWaitingStageName }) {
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

export default function StageStandingsBoard({
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
  const isBmps2026Detail =
    tournamentName === "Battlegrounds Mobile India Pro Series 2026";
  const resolvedParticipantEntries = useMemo(() => {
    return participantEntries;
  }, [participantEntries]);

  const {
    bmps2026PlayerStats,
    statisticsCategories,
    eliminatorSubStages,
    hasBmps2026Statistics,
    bmps2026StatisticsRowCount,
    bmps2026PlayerTeams,
  } = useBmps2026Statistics({
    isBmps2026Detail,
    teams,
    players,
    resolvedParticipantEntries,
  });

  const stageOptions = useMemo(
    () => {
      const options = stages.reduce((acc, stage) => {
        const stageHasParticipants = resolvedParticipantEntries.some((entry) =>
          getParticipantEntryPhases(entry).some(
            (phase) =>
              phase.toLowerCase() === String(stage.name || "").trim().toLowerCase() ||
              phase.toLowerCase().startsWith(`${String(stage.name || "").trim().toLowerCase()} - group `)
          )
        );
        const stageHasMatches = (tournamentName === "PUBG Mobile World Cup 2026" || tournamentName === "Battlegrounds Mobile India Pro Series 2026") && matches.some(
          (m) => m.tournament_id === tournamentId && m.stage === stage.name,
        );
        if (!stage.name || !(stage.standings?.length || stage.summary || stage.teamCount || stageHasParticipants || stageHasMatches)) {
          return acc;
        }

        acc.push({
          ...stage,
          standings: (stage.standings || []).toSorted(
            (a, b) => (a.placement ?? 999) - (b.placement ?? 999),
          ),
        });
        return acc;
      }, []);

      if (hasBmps2026Statistics) {
        options.push({
          name: "Statistics",
          summary: "Player statistics for BMPS 2026.",
          teamCount: bmps2026StatisticsRowCount,
          standings: [],
          isStatistics: true,
          statisticsType: "bmps-players",
        });
      } else if (rankings.length > 0) {
        options.push({
          name: "Statistics",
          summary: "Player and team rankings for this tournament.",
          teamCount: rankings.length,
          standings: [],
          isStatistics: true,
          statisticsType: "rankings",
        });
      }

      return options;
    },
    [bmps2026StatisticsRowCount, hasBmps2026Statistics, rankings.length, resolvedParticipantEntries, stages, matches, tournamentId, tournamentName]
  );
  const stageOptionsKey = useMemo(
    () => stageOptions.map((stage) => `${stage.name}:${stage.standings?.length || 0}`).join("|"),
    [stageOptions]
  );
  const defaultStageName = useMemo(() => {
    if (requestedStage && stageOptions.some((stage) => stage.name === requestedStage)) {
      return requestedStage;
    }
    const tournamentMatches = matches.filter((match) => match.tournament_id === tournamentId);
    const tournamentResults = matchResults.filter((result) => result.tournament_id === tournamentId);
    const featuredStageName = getFeaturedTournamentStage(
      { id: tournamentId, stages: stageOptions },
      tournamentMatches,
      tournamentResults
    );

    if (featuredStageName && stageOptions.some((stage) => stage.name === featuredStageName)) {
      return featuredStageName;
    }

    return stageOptions[0]?.name || "";
  }, [matchResults, matches, requestedStage, stageOptions, tournamentId]);
  const [stageBoardUi, dispatchStageBoardUi] = useReducer(
    stageBoardUiReducer,
    defaultStageName,
    createStageBoardUiState,
  );
  const {
    selectedStage,
    selectedGroup,
    selectedStatisticsCategory,
    selectedStatisticsSubStage,
    tableSort,
  } = stageBoardUi;
  const currentSelectedStage = stageOptions.some((stage) => stage.name === selectedStage)
    ? selectedStage
    : defaultStageName;
  const activeStage = stageOptions.find((stage) => stage.name === currentSelectedStage) || stageOptions[0] || null;
  const isStatisticsStage = Boolean(activeStage?.isStatistics);
  const isRankingsStatisticsStage = activeStage?.statisticsType === "rankings";
  const isGrandFinalsStage = String(activeStage?.name || "").trim().toLowerCase() === "grand finals";
  const groups = useMemo(() => {
    if (!activeStage) return [];
    const activeStageKey = String(activeStage.name || "").trim().toLowerCase();
    if (activeStageKey === "grand finals") return [];
    if (
      tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
      activeStageKey === "last chance stage"
    ) {
      return [];
    }
    if (
      tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
      (isBmps2026SurvivalStage(activeStage.name) ||
        isBmps2026SemiFinalsStage(activeStage.name))
    ) {
      const participantGroups = participantEntries.flatMap((entry) => {
        const group = getStrictParticipantStageGroup(entry, activeStage.name);
        return group ? [group] : [];
      });
      if (participantGroups.length > 0) {
        return [...new Set(participantGroups)].toSorted();
      }
      if (isBmps2026SurvivalStage(activeStage.name)) {
        return ["A", "B", "C", "D"];
      }
      if (isBmps2026SemiFinalsStage(activeStage.name)) {
        return ["A", "B", "C"];
      }
      return [];
    }

    if (tournamentName === "PUBG Mobile World Cup 2026") {
      const participantGroups = resolvedParticipantEntries.flatMap((entry) => {
        const group = getParticipantStageGroup(entry, activeStage.name);
        return group ? [group] : [];
      });
      const standingsGroups = (activeStage.standings || []).flatMap((entry) =>
        entry.grp ? [String(entry.grp).replace(/^Group\s+/i, "").trim()] : []
      );
      const combined = [...new Set([...standingsGroups, ...participantGroups])].toSorted();
      if (combined.length > 0) return combined;
      const matchGroups = matches
        .filter(
          (m) =>
            m.tournament_id === tournamentId &&
            m.stage === activeStage?.name &&
            m.group_name,
        )
        .flatMap((m) => {
          const raw = String(m.group_name).replace(/^group\s+/i, "").trim().toUpperCase();
          return raw && /^[A-Z0-9]$/.test(raw) ? [raw] : [];
        });
      return [...new Set(matchGroups)].toSorted();
    }

    const participantGroups = resolvedParticipantEntries.flatMap((entry) => {
      const group = getParticipantStageGroup(entry, activeStage.name);
      return group ? [group] : [];
    });
    const standingsGroups = (activeStage.standings || []).flatMap((entry) =>
      entry.grp ? [String(entry.grp).replace(/^Group\s+/i, "").trim()] : []
    );
    if (
      tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
      standingsGroups.length === 0 &&
      participantGroups.length === 0
    ) {
      if (isBmps2026SurvivalStage(activeStage.name)) {
        return ["A", "B", "C", "D"];
      }
      if (isBmps2026SemiFinalsStage(activeStage.name)) {
        return ["A", "B", "C"];
      }
    }

    return [...new Set([...standingsGroups, ...participantGroups])].toSorted();
  }, [activeStage, participantEntries, resolvedParticipantEntries, tournamentName, matches, tournamentId]);

  const survivalStageHasGroupedLobby =
    tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
    isBmps2026SurvivalStage(activeStage?.name) &&
    groups.length > 0;
  const isBmps2026SemiFinalsGroupDraw =
    tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
    String(activeStage?.name || "").trim().toLowerCase() === "semi finals" &&
    groups.length > 0;
  const visibleGroupOptions =
    survivalStageHasGroupedLobby || isBmps2026SemiFinalsGroupDraw ? [] : groups;
  const hideOverallGroupOption =
    (tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
      (isBmps2026PromotionStage(activeStage?.name) ||
        activeStage?.name === "Round 4") &&
      groups.length > 0) ||
    (tournamentName === "PUBG Mobile World Cup 2026" && groups.length > 0);
  const fallbackSelectedGroup = hideOverallGroupOption ? "groups" : "overall";
  const currentSelectedGroup =
    selectedGroup === "overall" && hideOverallGroupOption
      ? fallbackSelectedGroup
      : selectedGroup !== "overall" && selectedGroup !== "groups" && !visibleGroupOptions.includes(selectedGroup)
      ? fallbackSelectedGroup
      : selectedGroup;

  const filteredStandings = useMemo(() => {
    if (!activeStage) return [];
    if (currentSelectedGroup === "overall") return activeStage.standings || [];
    if (currentSelectedGroup === "groups") return [];
    return (activeStage.standings || []).filter((entry) => String(entry.grp || "").replace(/^Group\s+/i, "").trim() === currentSelectedGroup);
  }, [activeStage, currentSelectedGroup]);
  const groupParticipants = useMemo(() => {
    if (!activeStage || currentSelectedGroup === "overall" || currentSelectedGroup === "groups") return [];
    const seen = new Set();
    return resolvedParticipantEntries.filter((entry) => {
      if (getParticipantStageGroup(entry, activeStage.name) !== currentSelectedGroup) return false;
      const key = normalizeOrganizationName(entry.team || "");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [activeStage, currentSelectedGroup, resolvedParticipantEntries]);
  const stageParticipants = useMemo(() => {
    if (!activeStage || currentSelectedGroup !== "overall") return [];
    const stageKey = String(activeStage.name || "").trim().toLowerCase();
    const seen = new Set();
    return resolvedParticipantEntries
      .filter((entry) => {
        const matches =
          getParticipantStageGroup(entry, activeStage.name) ||
          getParticipantEntryPhases(entry).some(
            (phase) => String(phase || "").trim().toLowerCase() === stageKey
          );
        if (!matches) return false;
        const key = normalizeOrganizationName(entry.team || "");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .toSorted((left, right) =>
        String(left.team || "").localeCompare(String(right.team || ""))
      );
  }, [activeStage, currentSelectedGroup, resolvedParticipantEntries]);
  const bmps2026SurvivalQualifiedTeamsByRank = useMemo(() => {
    const teamsByRank = new Map();
    if (tournamentName !== "Battlegrounds Mobile India Pro Series 2026") {
      return teamsByRank;
    }

    const survivalStage = stageOptions.find((stage) =>
      isBmps2026SurvivalStage(stage?.name)
    );
    const survivalStandings = (survivalStage?.standings || [])
      .toSorted(compareStageBoardStandings)
      .slice(0, 8);

    survivalStandings.forEach((row, index) => {
      const teamName = row?.teamName || row?.fullTeam || row?.team;
      if (teamName) teamsByRank.set(String(index + 1), teamName);
    });

    return teamsByRank;
  }, [stageOptions, tournamentName]);
  const bmps2026SurvivalRankByTeam = useMemo(() => {
    const rankByTeam = new Map();
    for (const [rank, teamName] of bmps2026SurvivalQualifiedTeamsByRank.entries()) {
      rankByTeam.set(normalizeOrganizationName(teamName), Number(rank));
    }
    return rankByTeam;
  }, [bmps2026SurvivalQualifiedTeamsByRank]);
  const groupedParticipants = useMemo(() => {
    if (!activeStage || groups.length === 0) return [];
    const useOfficialDrawOnly =
      tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
      (isBmps2026SurvivalStage(activeStage.name) ||
        isBmps2026SemiFinalsStage(activeStage.name));
    const fixtureEntries =
      tournamentName === "Battlegrounds Mobile India Pro Series 2026"
        ? getBmps2026GroupDrawEntries(activeStage.name)
        : [];
    const groupSourceEntries = fixtureEntries.length > 0
      ? fixtureEntries
      : useOfficialDrawOnly
        ? participantEntries
        : resolvedParticipantEntries;
    const resolveSemiFinalPlaceholder = (entry) => {
      if (
        tournamentName !== "Battlegrounds Mobile India Pro Series 2026" ||
        !isBmps2026SemiFinalsStage(activeStage.name)
      ) {
        return entry;
      }

      const placeholderRank = String(entry?.team || "")
        .trim()
        .match(/^survival\s*#\s*(\d+)$/i)?.[1];
      const qualifiedTeam = placeholderRank
        ? bmps2026SurvivalQualifiedTeamsByRank.get(placeholderRank)
        : null;

      return qualifiedTeam
        ? { ...entry, team: qualifiedTeam, sourcePlaceholder: entry.team }
        : entry;
    };

    return groups.map((group) => {
      let entries = groupSourceEntries
        .filter((entry) => {
          const entryGroup =
            useOfficialDrawOnly
              ? getStrictParticipantStageGroup(entry, activeStage.name)
              : getParticipantStageGroup(entry, activeStage.name);
          return entryGroup === group;
        })
        .map(resolveSemiFinalPlaceholder)
        .toSorted((left, right) => {
          const leftPlacement = Number(left?.placement) || Number.MAX_SAFE_INTEGER;
          const rightPlacement = Number(right?.placement) || Number.MAX_SAFE_INTEGER;
          return leftPlacement - rightPlacement || String(left?.team || "").localeCompare(String(right?.team || ""));
        });

      if (
        entries.length === 0 &&
        tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
        (isBmps2026SurvivalStage(activeStage.name) ||
          isBmps2026SemiFinalsStage(activeStage.name))
      ) {
        const fallbackSourceEntries =
          isBmps2026SemiFinalsStage(activeStage.name) && stageParticipants.length > 0
            ? stageParticipants
            : groupSourceEntries;
        entries = fallbackSourceEntries.filter(
          (entry) =>
            getBmps2026FallbackGroupForTeam(
              entry.team,
              activeStage.name,
              bmps2026SurvivalRankByTeam,
            ) === group,
        );
      }

      return {
        group,
        entries: dedupeParticipantEntriesByOrganization(entries),
      };
    });
  }, [
    activeStage,
    bmps2026SurvivalQualifiedTeamsByRank,
    bmps2026SurvivalRankByTeam,
    groups,
    participantEntries,
    resolvedParticipantEntries,
    stageParticipants,
    tournamentName,
  ]);
  const maxGroupRows = useMemo(
    () => Math.max(0, ...groupedParticipants.map((section) => section.entries.length)),
    [groupedParticipants]
  );
  const usesPromotionGroups =
    hideOverallGroupOption;
  const usesBmpsKnockoutMovement =
    tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
    isBmps2026KnockoutStage(activeStage?.name) &&
    !isStatisticsStage &&
    currentSelectedGroup === "overall" &&
    Boolean(filteredStandings.length || activeStage?.standings?.length);
  const showGroupParticipantMovement = usesPromotionGroups || (tournamentName === "PUBG Mobile World Cup 2026" && !isStatisticsStage);
  const isSurvivalStageLobbyView =
    tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
    isBmps2026SurvivalStage(activeStage?.name) &&
    currentSelectedGroup !== "overall";
  const isPmwcMovementStage = tournamentName === "PUBG Mobile World Cup 2026" && !isStatisticsStage && !isGrandFinalsStage;
  const showMovementColumn = usesPromotionGroups || usesBmpsKnockoutMovement || isPmwcMovementStage;
  const isGroupDrawStage = groupedParticipants.length > 0 && !activeStage?.standings?.length;
  const showsGroupedDrawTab =
    isGroupDrawStage ||
    usesPromotionGroups ||
    survivalStageHasGroupedLobby ||
    isBmps2026SemiFinalsGroupDraw ||
    (tournamentName === "PUBG Mobile World Cup 2026" && groups.length > 0);
  const completeGroupStandings = useMemo(() => {
    if (!usesPromotionGroups || currentSelectedGroup === "overall") return filteredStandings;
    const selectedGroupMatchIds = new Set();
    for (const match of matches) {
      if (
        match.tournament_id === tournamentId &&
        match.stage === activeStage?.name
      ) {
        const matchGroupLetter = String(match.group_name || "").replace(/^group\s+/i, "").trim().toUpperCase();
        if (matchGroupLetter === String(currentSelectedGroup).toUpperCase()) {
          selectedGroupMatchIds.add(match.id);
        }
      }
    }
    const teamMap = new Map(teams.map((team) => [team.id, team]));
    const liveGroupStandings = new Map();

    for (const result of matchResults) {
      if (!selectedGroupMatchIds.has(result.match_id)) continue;
      const team = teamMap.get(result.team_id);
      const displayName = team?.name || result.team_name || "Unknown Team";
      const key = normalizeOrganizationName(displayName);
      const existing = liveGroupStandings.get(key) || {
        placement: null,
        team: displayName,
        fullTeam: displayName,
        grp: currentSelectedGroup,
        matches: 0,
        wwcd: 0,
        pos: 0,
        elimins: 0,
        points: 0,
        placementSum: 0,
      };

      const wins = result.wins_count && result.wins_count > 0 ? result.wins_count : result.placement === 1 ? 1 : 0;
      existing.matches += result.matches_count || 1;
      existing.wwcd += wins;
      existing.pos += result.placement_points || 0;
      existing.elimins += result.kill_points || 0;
      existing.points += result.total_points || 0;
      existing.placementSum += Number(result.placement) || 0;

      liveGroupStandings.set(key, existing);
    }

    const standingsByTeam = new Map(
      [...liveGroupStandings.values(), ...filteredStandings].map((entry) => [
        normalizeOrganizationName(entry.fullTeam || entry.team),
        entry,
      ])
    );

    const completeRows = groupParticipants.length > 0
      ? groupParticipants.map((entry) => {
        const key = normalizeOrganizationName(entry.team);
        const existing = standingsByTeam.get(key);
        if (existing) {
          return {
            ...existing,
            team: existing.fullTeam || existing.team,
            fullTeam: existing.fullTeam || existing.team,
            teamName: existing.fullTeam || existing.team,
            grp: currentSelectedGroup,
          };
        }

        return {
          placement: null,
          team: entry.team,
          fullTeam: entry.team,
          teamName: entry.team,
          grp: currentSelectedGroup,
          matches: 0,
          wwcd: 0,
          pos: 0,
          elimins: 0,
          points: 0,
          placementSum: 0,
        };
      })
      : [...standingsByTeam.values()].map((entry) => ({
        ...entry,
        team: entry.fullTeam || entry.team,
        fullTeam: entry.fullTeam || entry.team,
        teamName: entry.fullTeam || entry.team,
        grp: currentSelectedGroup,
      }));

    const sorted = completeRows
      .map((row) => ({
        ...row,
        placementPoints: row.pos || 0,
        elims: row.elimins || 0,
        averageEliminationPosition: row.matches > 0 ? row.placementSum / row.matches : null,
      }))
      .sort(compareStageBoardStandings);

    return sorted;
  }, [usesPromotionGroups, currentSelectedGroup, filteredStandings, groupParticipants, matches, matchResults, teams, tournamentId, activeStage]);

  const showGroupColumn =
    !isGrandFinalsStage &&
    !usesPromotionGroups &&
    !isGroupDrawStage &&
    currentSelectedGroup === "overall" &&
    groups.length > 1;
  const getOverallStandingGroupLabel = (entry) => {
    if (
      tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
      (isBmps2026SurvivalStage(activeStage?.name) ||
        isBmps2026SemiFinalsStage(activeStage?.name))
    ) {
      const fallbackGroup = getBmps2026FallbackGroupForTeam(
        entry?.fullTeam || entry?.team || entry?.teamName,
        activeStage?.name,
        bmps2026SurvivalRankByTeam,
      );
      if (fallbackGroup) return fallbackGroup;
    }

    const rawGroup = String(entry?.grp ?? "-").replace(/^Group\s+/i, "").trim();
    return rawGroup || "-";
  };
  const shouldHideProjectedStageTeams =
    tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
    isBmps2026SemiFinalsStage(activeStage?.name) &&
    currentSelectedGroup === "overall";
  const useContainedGroupLogos = groups.length > 0;
  const bmpsWaitingStageName =
    tournamentName === "Battlegrounds Mobile India Pro Series 2026" && /^round\s+[234]$/i.test(activeStage?.name || "")
      ? getBmps2026PreviousStageName(activeStage?.name)
      : null;
  const legendItems = useMemo(() => {
    if (isStatisticsStage) return [];
    if (usesPromotionGroups) return [];
    if (usesBmpsKnockoutMovement) {
      const rows = filteredStandings.length || groupParticipants.length || activeStage?.standings?.length || 0;
      const seen = new Map();
      for (let index = 0; index < rows; index += 1) {
        const movement = getGroupMovementRule(tournamentName, activeStage?.name, currentSelectedGroup, index + 1, rows);
        const dotClass = getGroupMovementAccent(tournamentName, activeStage?.name, currentSelectedGroup, index + 1, rows)?.dot;
        if (movement && dotClass && !seen.has(movement.label)) {
          seen.set(movement.label, dotClass);
        }
      }
      return [...seen.entries()];
    }
    const seen = new Map();
    for (const entry of activeStage?.standings || []) {
      const tone = getOutcomeTone(entry.outcome);
      if (tone.label === "Stage result") {
        continue;
      }
      if (!seen.has(tone.label)) seen.set(tone.label, tone.dot);
    }
    return [...seen.entries()];
  }, [activeStage, currentSelectedGroup, filteredStandings.length, groupParticipants.length, isStatisticsStage, usesBmpsKnockoutMovement, usesPromotionGroups]);
  const {
    currentStatisticsCategory,
    currentStatisticsSubStage,
    statisticsTableRows,
    statisticsTableKey,
    sortedStatisticsTableRows,
    statisticsPanelTitle,
    selectedMvpStats,
  } = useStatisticsRows({
    statisticsCategories,
    eliminatorSubStages,
    selectedStatisticsCategory,
    selectedStatisticsSubStage,
    tableSort,
    bmps2026PlayerStats,
    bmps2026PlayerTeams,
  });

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
}
