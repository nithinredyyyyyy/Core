import React from "react";
import { shouldOpenBmps2026GroupsByDefault } from "@/features/tournaments/utils/participantHelpers";

export function DesktopStageSelector({ stageOptions, activeStage, dispatchStageBoardUi, tournamentName, groups, showsGroupedDrawTab, hideOverallGroupOption, currentSelectedGroup, visibleGroupOptions }) {
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
