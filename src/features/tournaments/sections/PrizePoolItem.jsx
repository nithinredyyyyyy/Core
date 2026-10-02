import { Table } from "@/components/ui/table";
import React from "react";
import { Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import TeamIdentity from "@/components/shared/TeamIdentity";
import { buildTeamLink, getDisplayTeamName } from "@/features/tournaments/utils/participantHelpers";
import { PrizePoolSection } from "@/features/tournaments/sections/PrizePoolSection";

export function PrizePoolItem({ tournament, prizeColumns }) {
  const breakdown = Array.isArray(tournament.prize_breakdown)
    ? tournament.prize_breakdown
    : [];
  const hasStageSections = breakdown.some((entry) =>
    String(entry?.stage || "").trim()
  );

  if (hasStageSections) {
    const stageOrder = [];
    for (const entry of breakdown) {
      const stage = String(entry?.stage || "").trim() || "Prize Pool";
      if (!stageOrder.includes(stage)) stageOrder.push(stage);
    }

    return (
      <AccordionItem value="prize-pool" className="mb-2 rounded-xl border border-border bg-secondary/20 px-5">
        <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]>svg:first-child]:text-primary" aria-expanded="false">
          <div className="flex items-center gap-2">
            <Gift className="size-4 text-muted-foreground transition-colors" />
            <h3 className="font-semibold text-foreground">Prize Pool Distribution</h3>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stageOrder.map((stage) => (
              <PrizePoolSection
                key={stage}
                stage={stage}
                rows={breakdown.filter(
                  (entry) => (String(entry?.stage || "").trim() || "Prize Pool") === stage,
                )}
              />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <AccordionItem value="prize-pool" className="mb-2 rounded-xl border border-border bg-secondary/20 px-5">
      <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]>svg:first-child]:text-primary" aria-expanded="false">
        <div className="flex items-center gap-2">
          <Gift className="size-4 text-muted-foreground transition-colors" />
          <h3 className="font-semibold text-foreground">Prize Pool Distribution</h3>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="overflow-x-auto rounded-lg border border-border bg-background/80">
          <Table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 text-left">Place</th>
                <th className="px-4 py-3 text-left">Team</th>
                {prizeColumns.hasInr && <th className="px-4 py-3 text-right">INR</th>}
                {prizeColumns.hasCny && <th className="px-4 py-3 text-right">CNY</th>}
                {prizeColumns.hasUsd && <th className="px-4 py-3 text-right">USD</th>}
                {prizeColumns.hasQualifiesTo && <th className="px-4 py-3 text-right">Qualifies To</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {breakdown.map((entry) => {
                const teamName = String(entry.team || "").trim();
                const isKnownTeam = teamName && !/^TBD$/i.test(teamName);

                return (
                  <tr key={`${entry.placement}-${entry.team}`} className="hover:bg-secondary/20">
                    <td className="px-4 py-3 font-semibold">{entry.placement}</td>
                    <td className="px-4 py-3">
                      {isKnownTeam ? (
                        <Link to={buildTeamLink(entry.team)} className="inline-flex items-center">
                          <TeamIdentity name={entry.team} className="text-sm text-foreground" hideText />
                          <span className="ml-2 text-sm text-foreground">{getDisplayTeamName(entry.team)}</span>
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">To be decided</span>
                      )}
                    </td>
                    {prizeColumns.hasInr && (
                      <td className="px-4 py-3 text-right text-primary font-semibold">
                        {entry.inr ? `INR ${entry.inr}` : "-"}
                      </td>
                    )}
                    {prizeColumns.hasCny && (
                      <td className="px-4 py-3 text-right text-primary font-semibold">
                        {entry.cny ? `${entry.cny}` : "-"}
                      </td>
                    )}
                    {prizeColumns.hasUsd && (
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {entry.usd ? `$${entry.usd}` : "-"}
                      </td>
                    )}
                    {prizeColumns.hasQualifiesTo && (
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {entry.qualifiesTo && entry.qualifiesTo !== "-" ? entry.qualifiesTo : "-"}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
