import React from "react";
import { LayoutList } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getCleanStageLabel } from "@/features/tournaments/utils/stageHelpers";

export function FormatCalendarItem({ tournament, stageDetails }) {
  return (
    <AccordionItem value="format-calendar" className="mb-2 rounded-xl border border-border bg-secondary/20 px-5">
      <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]>svg:first-child]:text-primary">
        <div className="flex items-center gap-2">
          <LayoutList className="size-4 text-muted-foreground transition-colors" />
          <h3 className="font-semibold text-foreground">Format and Calendar</h3>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 rounded-lg border border-border bg-background/80 p-5">
          {tournament.rules && (
            <div className="rounded-xl border border-border bg-secondary/20 px-5 py-4">
              <p className="text-[10px] uppercase tracking-wider text-primary">Rules</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tournament.rules}</p>
            </div>
          )}
          {tournament.calendar?.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {tournament.calendar.map((item) => (
                <div key={`${item.week}-${item.label}`} className="rounded-xl border border-border bg-secondary/20 px-5 py-4">
                  <p className="text-xs uppercase tracking-wider text-primary">{item.week}</p>
                  <p className="mt-1 font-semibold text-foreground">{getCleanStageLabel(item.label)}</p>
                </div>
              ))}
            </div>
          )}
          {stageDetails.length > 0 && (
            <div className="space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-primary">Stage Breakdown</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Complete stage notes for this tournament, including team counts and standings coverage.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {stageDetails.map((stage) => (
                  <div key={stage.name} className="rounded-xl border border-border bg-secondary/20 px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{stage.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-wider text-primary">
                          {stage.calendarWeek || "Schedule not listed"}
                        </p>
                      </div>
                      <span className="inline-flex rounded-full bg-background px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {stage.teamCount ?? stage.standings?.length ?? 0} teams
                      </span>
                    </div>
                    {stage.summary ? (
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{stage.summary}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
