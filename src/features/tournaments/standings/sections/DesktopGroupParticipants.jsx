import React from "react";
import { Link } from "react-router-dom";
import TeamIdentity from "@/components/shared/TeamIdentity";
import { buildTeamLink, getDisplayTeamName, getGroupMovementRule } from "@/features/tournaments/utils/participantHelpers";

export function DesktopGroupParticipants({ tournamentName, activeStage, isSurvivalStageLobbyView, groupParticipants, showGroupParticipantMovement, currentSelectedGroup }) {
  return (
    <div className="space-y-4">
      {!tournamentName?.startsWith("PUBG Mobile World Cup") ? (
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
