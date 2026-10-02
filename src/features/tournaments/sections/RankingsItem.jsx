import React from "react";
import { TrendingUp } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import RankingTable from "@/features/tournaments/components/RankingTable";

export function RankingsItem({ rankings }) {
  return (
    <AccordionItem value="rankings" className="mt-2 rounded-xl border border-border bg-secondary/20 px-5">
      <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]>svg:first-child]:text-primary" aria-expanded="false">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-muted-foreground transition-colors" />
          <h3 className="font-semibold text-foreground">Power Rankings</h3>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3">
          {rankings.map((ranking) => (
            <div key={ranking.title} className="rounded-xl border border-border bg-background/80 p-4">
              <p className="mb-3 text-[10px] uppercase tracking-wider text-primary">{ranking.title}</p>
              <RankingTable ranking={ranking} />
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
