import React from "react";
import { Link } from "react-router-dom";
import TeamIdentity from "@/components/shared/TeamIdentity";
import { buildTeamLink, getGrandFinalsPlacementTone, getGroupMovementAccent, getGroupMovementRule, getOutcomeTone } from "@/features/tournaments/utils/participantHelpers";

export function DesktopStandingsTable({ usesPromotionGroups, completeGroupStandings, filteredStandings, showMovementColumn, isPmwcMovementStage, activeStage, currentSelectedGroup, tournamentName, useContainedGroupLogos, showGroupColumn, getOverallStandingGroupLabel }) {
  const customCols = Object.keys((usesPromotionGroups ? completeGroupStandings : filteredStandings)[0] || {})
    .filter(k => /^m\d+$/i.test(k) || /^week\d+$/i.test(k))
    .sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

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
            {customCols.map(col => (
              <th key={col} className="border-r border-border/60 p-4 text-center">{col.toUpperCase()}</th>
            ))}
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
                {customCols.map(col => (
                  <td key={col} className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">
                    {entry[col] ?? "-"}
                  </td>
                ))}
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
