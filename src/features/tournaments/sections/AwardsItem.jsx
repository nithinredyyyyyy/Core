import React from "react";
import { Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import TeamIdentity from "@/components/shared/TeamIdentity";
import { buildTeamLink, getDisplayTeamName } from "@/features/tournaments/utils/participantHelpers";

export function AwardsItem({ tournament }) {
  return (
    <AccordionItem value="awards" className="mt-2 rounded-xl border border-border bg-secondary/20 px-5">
      <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]>svg:first-child]:text-primary" aria-expanded="false">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-muted-foreground transition-colors" />
          <h3 className="font-semibold text-foreground">Tournament Awards</h3>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="grid gap-3 md:grid-cols-2">
          {tournament.awards.map((award) => {
            const teamName = String(award.team || "").trim();
            const isKnownTeam = teamName && !/^TBD$/i.test(teamName);

            return (
              <div key={`${award.title}-${award.team}`} className="rounded-xl border border-border bg-background/80 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-primary">{award.title}</p>
                <p className="mt-1 font-semibold text-foreground">
                  {/^TBD$/i.test(String(award.player || "").trim()) ? "To be decided" : award.player}
                </p>
                {isKnownTeam ? (
                  <Link to={buildTeamLink(award.team)} className="inline-flex">
                    <TeamIdentity name={getDisplayTeamName(award.team)} className="text-sm text-muted-foreground" />
                  </Link>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">Team to be decided</p>
                )}
              </div>
            );
          })}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
