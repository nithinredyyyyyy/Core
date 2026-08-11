import React from "react";
import { Link } from "react-router-dom";
import TeamIdentity from "@/components/shared/TeamIdentity";
import { buildTeamLink } from "@/features/tournaments/utils/participantHelpers";

export default function RankingTable({ ranking }) {
  const customColumns = ranking.columns ?? null;
  const isIglTable = ranking.entries?.some((entry) => entry.avgPoints !== undefined || entry.teamSurvival);
  const isSimpleFinishesTable = ranking.entries?.every(
    (entry) =>
      entry.finishes !== undefined &&
      entry.rating === undefined &&
      entry.damage === undefined &&
      entry.avgSurvival === undefined &&
      entry.knocks === undefined &&
      entry.avgPoints === undefined &&
      entry.teamSurvival === undefined
  );

  return (
    <div className="max-h-[70vh] overflow-auto rounded-lg border border-border bg-background/90 shadow-sm">
      <table className={`w-full border-separate border-spacing-0 text-sm [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-20 [&_thead_th]:bg-secondary ${isSimpleFinishesTable ? "min-w-[420px]" : "min-w-[720px]"}`}>
        <thead>
          <tr className="border-b border-border bg-secondary/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="border-r border-border/60 p-3 text-left">#</th>
            <th className="border-r border-border/60 p-3 text-left">Player</th>
            {customColumns ? (
              customColumns.map((column, index) => (
                <th
                  key={column.key}
                  className={`${index < customColumns.length - 1 ? "border-r border-border/60" : ""} p-3 text-center`}
                >
                  {column.label}
                </th>
              ))
            ) : isSimpleFinishesTable ? (
              <th className="p-3 text-center">Finishes</th>
            ) : (
              <th className="border-r border-border/60 p-3 text-center">Ratings</th>
            )}
            {!customColumns && !isSimpleFinishesTable && (isIglTable ? (
              <>
                <th className="border-r border-border/60 p-3 text-center">Avg. Points</th>
                <th className="border-r border-border/60 p-3 text-center">WWCD</th>
                <th className="border-r border-border/60 p-3 text-center">Top 5s</th>
                <th className="p-3 text-center">Team Surv.</th>
              </>
            ) : (
              <>
                <th className="border-r border-border/60 p-3 text-center">Finishes</th>
                <th className="border-r border-border/60 p-3 text-center">Damage</th>
                <th className="border-r border-border/60 p-3 text-center">Avg. Surv.</th>
                <th className="p-3 text-center">Knocks</th>
              </>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {ranking.entries.map((entry, index) => (
            <tr
              key={`${ranking.title}-${entry.placement}-${entry.player}`}
              className={`${index % 2 === 0 ? "bg-background/70" : "bg-secondary/10"} transition-colors hover:bg-secondary/20`}
            >
              <td className="border-r border-border/50 p-3 font-semibold text-foreground">{entry.placement}.</td>
              <td className="border-r border-border/50 p-3">
                <Link to={buildTeamLink(entry.team)} className="inline-flex items-center gap-3 font-medium text-foreground">
                  <TeamIdentity
                    name={entry.team}
                    framed
                    hideText
                    surfaceToneOverride="light"
                    logoBlockClassName="!border-slate-200/90 !bg-white !shadow-[0_4px_12px_rgba(15,23,42,0.06)] dark:!border-white/10 dark:!bg-white/[0.07]"
                  />
                  <span>{entry.player}</span>
                </Link>
              </td>
              {customColumns ? (
                customColumns.map((column, index) => (
                  <td
                    key={column.key}
                    className={`${index < customColumns.length - 1 ? "border-r border-border/50" : ""} p-3 text-center font-medium text-muted-foreground`}
                  >
                    {entry[column.key] ?? "-"}
                  </td>
                ))
              ) : isSimpleFinishesTable ? (
                <td className="p-3 text-center font-semibold text-primary">{entry.finishes}</td>
              ) : (
                <td className="border-r border-border/50 p-3 text-center font-semibold text-primary">{entry.rating}</td>
              )}
              {!customColumns && !isSimpleFinishesTable && (isIglTable ? (
                <>
                  <td className="border-r border-border/50 p-3 text-center font-medium text-muted-foreground">{entry.avgPoints ?? "-"}</td>
                  <td className="border-r border-border/50 p-3 text-center font-medium text-muted-foreground">{entry.wwcd ?? "-"}</td>
                  <td className="border-r border-border/50 p-3 text-center font-medium text-muted-foreground">{entry.top5s ?? "-"}</td>
                  <td className="p-3 text-center font-medium text-muted-foreground">{entry.teamSurvival ?? "-"}</td>
                </>
              ) : (
                <>
                  <td className="border-r border-border/50 p-3 text-center font-medium text-muted-foreground">{entry.finishes ?? "-"}</td>
                  <td className="border-r border-border/50 p-3 text-center font-medium text-muted-foreground">{entry.damage ?? "-"}</td>
                  <td className="border-r border-border/50 p-3 text-center font-medium text-muted-foreground">{entry.avgSurvival ?? "-"}</td>
                  <td className="p-3 text-center font-medium text-muted-foreground">{entry.knocks ?? "-"}</td>
                </>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
