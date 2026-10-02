import React from "react";
import { Users } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ParticipantRosterCard from "@/features/tournaments/components/ParticipantRosterCard";

export function ParticipantsItem({ participantSections, liveParticipantRosters, tournamentStatus }) {
  return (
    <AccordionItem value="participants" className="rounded-xl border border-border bg-secondary/20 px-5">
      <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]>svg:first-child]:text-primary" aria-expanded="false">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground transition-colors" />
          <h3 className="font-semibold text-foreground">Participating Teams</h3>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-6">
          {participantSections.map((section) => (
            <div key={section.phase} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-primary">{section.phase}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{section.entries.length} teams</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {section.entries.map((entry) => (
                  <ParticipantRosterCard
                    key={`${entry.placement}-${entry.team}`}
                    entry={entry}
                    liveParticipantRosters={liveParticipantRosters}
                    tournamentStatus={tournamentStatus}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
