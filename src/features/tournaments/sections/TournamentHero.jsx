import React, { useState } from "react";
import { Calendar, Users, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import LogoBlock from "@/components/shared/LogoBlock";
import StatusBadge from "@/components/shared/StatusBadge";

/** @param {{ tournament: import("@/types/tournaments").Tournament, tournamentLogo: string | null, participantCount: number }} props */
export function TournamentHero({ tournament, tournamentLogo, participantCount }) {
  const [showFullDescription, setShowFullDescription] = useState(false);

  return (
    <div className="rounded-[32px] p-8 md:p-12 border-none shadow-lg bg-gradient-to-br from-brand-sky-azure to-brand-navy-bright text-white relative overflow-hidden mb-6">
      <div className="absolute inset-0 bg-white/5 pointer-events-none" />
      <div className="flex flex-wrap items-start justify-between gap-4 relative z-10">
        <div className="flex items-start gap-5">
          {tournamentLogo && (
            <LogoBlock
              src={tournamentLogo}
              alt={`${tournament.name} logo`}
              sizeClass="h-24 w-24 md:h-28 md:w-28"
              roundedClass="rounded-2xl"
              paddingClass="p-4"
              className="!border-white/20 !bg-white/10 backdrop-blur-md shadow-lg"
            />
          )}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/80">Event profile</p>
            <h1 className="mt-3 text-4xl md:text-5xl font-heading font-bold tracking-tight text-white drop-shadow-sm leading-tight">{tournament.name}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-base text-white/90">
              {tournament.start_date && (
                <span className="flex items-center gap-1.5 font-medium bg-black/10 px-3 py-1.5 rounded-full">
                  <Calendar className="size-4" />
                  {format(new Date(tournament.start_date), "MMM d, yyyy")}
                </span>
              )}
              <span className="flex items-center gap-1.5 font-medium bg-black/10 px-3 py-1.5 rounded-full">
                <Users className="size-4" /> {participantCount} teams
              </span>
            </div>
          </div>
        </div>
        <StatusBadge status={tournament.status} />
      </div>
      {tournament.description && (
        <div className="mt-8 rounded-2xl bg-white/10 backdrop-blur-md p-5 md:p-6 border border-white/20 shadow-sm text-sm md:text-base text-white/90 transition-all duration-300 relative z-10">
          <p className={`transition-all duration-300 overflow-hidden leading-relaxed ${showFullDescription ? "" : "line-clamp-3"}`}>
            {tournament.description}
          </p>
          <button
            className="mt-3 flex items-center text-white font-bold tracking-wide hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded-sm"
            onClick={() => setShowFullDescription(!showFullDescription)}
            aria-expanded={showFullDescription}
          >
            {showFullDescription ? "Show less" : "Read more"}
            {showFullDescription ? <ChevronUp className="ml-1 size-4" /> : <ChevronDown className="ml-1 size-4" />}
          </button>
        </div>
      )}
    </div>
  );
}
