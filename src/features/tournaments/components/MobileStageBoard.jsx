import React from "react";
import { Link } from "react-router-dom";
import TeamIdentity from "@/components/shared/TeamIdentity";
import { normalizeOrganizationName } from "@/lib/organizationIdentity";
import { buildTeamLink, getDisplayTeamName, getGroupMovementRule, getGrandFinalsPlacementTone, getOutcomeTone, getGroupMovementAccent, shouldOpenBmps2026GroupsByDefault } from "@/features/tournaments/utils/participantHelpers";
import { compareStageBoardStandings } from "@/lib/stageBoard";

export function MobileStageSelector({ stageOptions, activeStage, dispatchStageBoardUi, tournamentName, groups, showsGroupedDrawTab, hideOverallGroupOption, currentSelectedGroup, visibleGroupOptions }) {
  return (
    <div className="space-y-3">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
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
                        : tournamentName === "PUBG Mobile World Cup 2026" && groups.length > 0
                        ? groups[0]
                        : "overall",
                  },
                });
              }}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-all ${
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "border-border bg-card text-muted-foreground active:bg-secondary"
              }`}
            >
              {stage.name === "Wildcard" ? "Wildcards" : stage.name}
            </button>
          );
        })}
      </div>

      {groups.length > 0 ? (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
          {showsGroupedDrawTab ? (
            <button
              type="button"
              onClick={() =>
                dispatchStageBoardUi({ type: "selectGroup", payload: "groups" })
              }
              className={`shrink-0 rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-all ${
                currentSelectedGroup === "groups"
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                  : "border-border bg-card text-muted-foreground active:bg-secondary"
              }`}
            >
              Groups Draw
            </button>
          ) : null}
          {visibleGroupOptions.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() =>
                dispatchStageBoardUi({ type: "selectGroup", payload: group })
              }
              className={`shrink-0 rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-all ${
                currentSelectedGroup === group
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground active:bg-secondary"
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

export function MobileStandingsCard({ entry, index, activeStage, currentSelectedGroup, tournamentName, showMovementColumn, isPmwcMovementStage, usesPromotionGroups }) {
  const position = showMovementColumn ? index + 1 : entry.placement;
  const podiumTone = getGrandFinalsPlacementTone(activeStage.name, entry.placement);
  const movementRows = usesPromotionGroups ? undefined : undefined;
  const movement = showMovementColumn
    ? getGroupMovementRule(tournamentName, activeStage?.name, currentSelectedGroup, index + 1, (showMovementColumn ? index + 1 : 0))
    : null;
  const movementAccent = showMovementColumn
    ? getGroupMovementAccent(tournamentName, activeStage?.name, currentSelectedGroup, index + 1, index + 1)
    : null;

  const hasStats = entry.matches != null || entry.wwcd != null || entry.pos != null || entry.elimins != null;
  const hasStatsData = hasStats && (entry.matches > 0 || entry.points > 0);

  return (
    <div className={`relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all active:scale-[0.98] ${
      podiumTone?.border
        ? `${podiumTone.border} border-l-[3px]`
        : movementAccent?.cell
          ? `${movementAccent.cell} border-l-[3px]`
          : "border-border"
    }`}>
      <div className="flex items-center gap-3 p-3.5">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg font-black ${
          movementAccent?.rank
            ? `${movementAccent.rank} text-white`
            : podiumTone?.rank
              ? podiumTone.rank
              : index < 3
                ? "bg-primary/10 text-primary"
                : "bg-secondary text-muted-foreground"
        }`}>
          {position}
        </div>

        <div className="min-w-0 flex-1">
          <Link to={buildTeamLink(entry.fullTeam || entry.team)} className="block min-w-0">
            <TeamIdentity
              name={entry.fullTeam || entry.team}
              className="font-semibold text-foreground"
              contained
              surfaceToneOverride="light"
              containerClassName="gap-2.5"
              logoBlockClassName="!size-8"
            />
          </Link>
        </div>

        <div className="shrink-0 text-right">
          <p className={`text-lg font-black leading-none ${podiumTone?.points || "text-foreground"}`}>
            {entry.points ?? 0}
          </p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Pts
          </p>
        </div>
      </div>

      {hasStatsData ? (
        <div className="flex items-center justify-around border-t border-border/60 bg-secondary/20 px-3 py-2.5">
          {entry.matches != null ? (
            <div className="text-center">
              <p className="text-xs font-bold text-foreground">{entry.matches}</p>
              <p className="text-[10px] text-muted-foreground">Mat</p>
            </div>
          ) : null}
          {entry.wwcd != null ? (
            <div className="text-center">
              <p className="text-xs font-bold text-foreground">{entry.wwcd}</p>
              <p className="text-[10px] text-muted-foreground">WWCD</p>
            </div>
          ) : null}
          {entry.pos != null ? (
            <div className="text-center">
              <p className="text-xs font-bold text-foreground">{entry.pos}</p>
              <p className="text-[10px] text-muted-foreground">Place</p>
            </div>
          ) : null}
          {entry.elimins != null ? (
            <div className="text-center">
              <p className="text-xs font-bold text-foreground">{entry.elimins}</p>
              <p className="text-[10px] text-muted-foreground">Elims</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {showMovementColumn && movement ? (
        <div className="border-t border-border/60 px-3.5 py-2">
          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${movement.tone}`}>
            {movement.label}
          </span>
        </div>
      ) : showMovementColumn && isPmwcMovementStage ? (
        (() => {
          const tone = getOutcomeTone(entry.outcome);
          if (tone.label === "Stage result") return null;
          return (
            <div className="border-t border-border/60 px-3.5 py-2">
              <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${tone.border.replace('border-l-', 'border-')}/30 ${tone.dot}/10 ${tone.dot.replace('bg-', 'text-')}`}>
                {tone.label}
              </span>
            </div>
          );
        })()
      ) : null}
    </div>
  );
}

export function MobileGroupedDraw({ activeStage, groupedParticipants }) {
  return (
    <div className="space-y-4">
      {groupedParticipants.map((section) => (
        <div key={`${activeStage.name}-${section.group}`} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="bg-brand-navy px-4 py-3 text-center">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white">
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
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                  {entry?.team ? (
                    <Link
                      to={buildTeamLink(entry.team)}
                      className="min-w-0 flex-1"
                    >
                      <TeamIdentity
                        name={getDisplayTeamName(entry.team)}
                        className="min-w-0 flex-1 text-left text-sm font-semibold text-foreground"
                        containerClassName="w-full justify-start"
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
  );
}

export function MobileGroupParticipants({ tournamentName, activeStage, groupParticipants, showGroupParticipantMovement, currentSelectedGroup }) {
  return (
    <div className="space-y-3">
      {groupParticipants.map((entry, index) => {
        const position = index + 1;
        const movement = showGroupParticipantMovement
          ? getGroupMovementRule(tournamentName, activeStage?.name, currentSelectedGroup, position, groupParticipants.length)
          : null;
        return (
          <div
            key={`${activeStage.name}-${currentSelectedGroup}-${entry.team}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm transition-all active:scale-[0.98]"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-foreground">
              {position}
            </span>
            <Link to={buildTeamLink(entry.team)} className="min-w-0 flex-1">
              <TeamIdentity
                name={getDisplayTeamName(entry.team)}
                className="font-semibold text-foreground"
                contained
                surfaceToneOverride="light"
                containerClassName="gap-2.5"
                logoBlockClassName="!size-8"
              />
            </Link>
            {movement ? (
              <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${movement.tone}`}>
                {movement.label}
              </span>
            ) : showGroupParticipantMovement ? (
              <span className="shrink-0 text-xs text-muted-foreground">Hold</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function MobilePending({ activeStage, bmpsWaitingStageName }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          Standings pending
        </p>
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
        {bmpsWaitingStageName
          ? `${activeStage.name} groups will appear after ${bmpsWaitingStageName} results are added.`
          : activeStage.summary || "Standings data will appear here once match results are published."}
      </p>
    </div>
  );
}

export function MobileProjectedTeams({ activeStage, stageParticipants }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground">
          {activeStage.name.toUpperCase()} TEAMS
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Teams projected into this stage from upstream results.
        </p>
      </div>
      {stageParticipants.map((entry, index) => (
        <Link
          key={`${activeStage.name}-${entry.team}`}
          to={buildTeamLink(entry.team)}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm transition-all active:scale-[0.98]"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-foreground">
            {index + 1}
          </span>
          <TeamIdentity
            name={getDisplayTeamName(entry.team)}
            className="font-semibold text-foreground"
            contained
            surfaceToneOverride="light"
            containerClassName="gap-2.5"
            logoBlockClassName="!size-8"
          />
        </Link>
      ))}
    </div>
  );
}
