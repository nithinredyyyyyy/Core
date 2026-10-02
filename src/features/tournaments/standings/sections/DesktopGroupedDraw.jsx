import React from "react";
import { Link } from "react-router-dom";
import TeamIdentity from "@/components/shared/TeamIdentity";
import { buildTeamLink, getDisplayTeamName, isBmps2026SurvivalStage } from "@/features/tournaments/utils/participantHelpers";

export function DesktopGroupedDraw({ activeStage, groupedParticipants, maxGroupRows }) {
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
