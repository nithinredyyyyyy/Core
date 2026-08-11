import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Users,
  Award,
  ChevronDown,
  ChevronUp,
  Trophy,
  LayoutList,
  Gift,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import TeamIdentity from "@/components/shared/TeamIdentity";
import LogoBlock from "@/components/shared/LogoBlock";
import StatusBadge from "@/components/shared/StatusBadge";
import FactCard from "@/components/tournaments/FactCard";
import { normalizeOrganizationName } from "@/lib/organizationIdentity";
import { applyCurrentRosterOverride } from "@/lib/currentRosterOverrides";
import { buildLiveRoster } from "@/lib/rosterUtils";
import { getStageBoardData } from "@/lib/stageBoard";
import { resolveTournamentParticipantState } from "@/lib/tournamentProgression";
import { decorateMatchesWithLiveStatus } from "@/lib/liveCalendar";
import { filterPublishedMatchResults } from "@/lib/matchResultPublication";
import {
  getOfficialParticipantEntries,
  getOfficialParticipantCount,
  isBmps2026Tournament,
} from "@/lib/tournamentParticipants";
import { getTournamentLogo } from "@/features/tournaments/utils/tournamentBranding";
import { getTournamentAllocations } from "@/features/tournaments/utils/tournamentAllocations";
import {
  BMPS_2026_STYLE_STAGE_TOURNAMENTS,
  EMPTY_NORMALIZED_STAGES,
  EMPTY_STAGE_MATCH_RESULTS,
  EMPTY_STAGE_MATCHES,
  EMPTY_STAGE_PARTICIPANT_ENTRIES,
  EMPTY_STAGE_PLAYERS,
  EMPTY_STAGE_TEAMS,
} from "@/features/tournaments/constants";
import {
  buildNormalizedParticipantEntries,
  buildNormalizedStageBoardStages,
  getCleanStageLabel,
  getParticipantSectionLabel,
  mergeDisplayStages,
} from "@/features/tournaments/utils/stageHelpers";
import {
  buildTeamLink,
  getChampionDisplayName,
  getChampionLogoOverride,
  getDisplayTeamName,
  isBmps2026SurvivalStage,
  normalizeTeamName,
} from "@/features/tournaments/utils/participantHelpers";
import StageStandingsBoard from "@/features/tournaments/components/StageStandingsBoard";
import ParticipantRosterCard from "@/features/tournaments/components/ParticipantRosterCard";
import RankingTable from "@/features/tournaments/components/RankingTable";

function BackButton({ onBack }) {
  return (
    <Button
      variant="ghost"
      onClick={onBack}
      className="text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="mr-2 size-4" /> Back to Tournaments
    </Button>
  );
}

function TournamentHero({ tournament, tournamentLogo, participantCount }) {
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

function FeaturedFactsGrid({ facts }) {
  return (
    <div className="grid gap-4 md:gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">
      {facts.map((fact) => {
        const Icon = fact.icon;
        return (
          <FactCard
            key={fact.label}
            label={fact.label}
            value={fact.value}
            icon={<Icon />}
            variant={fact.variant}
          />
        );
      })}
    </div>
  );
}

function EventBriefBody({ tournament, spotlightStage, allocations }) {
  return (
    <div className="space-y-4">
      {tournament.format_overview && (
        <p className="text-sm leading-relaxed text-muted-foreground">{tournament.format_overview}</p>
      )}
      {tournament.status !== "completed" && spotlightStage?.summary && (
        <div className="rounded-xl border border-border bg-background/80 px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-primary">Current Stage</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {spotlightStage.summary}
          </p>
        </div>
      )}
      {allocations.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-[10px] uppercase tracking-wider text-amber-300">International Slots</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {allocations.map((allocation) => (
              <div
                key={`${allocation.title}-${allocation.event}`}
                className="rounded-xl border border-amber-500/20 bg-background/70 px-4 py-3 flex items-center gap-4 relative overflow-hidden"
              >
                <div className="flex-1 relative z-10">
                  <p className="text-[10px] uppercase tracking-wider text-amber-300">{allocation.title}</p>
                  <p className="mt-1 font-semibold text-foreground">{allocation.event}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{allocation.detail}</p>
                </div>
                {allocation.qualifiedTeam && (
                  <div className="flex shrink-0 items-center justify-end relative z-10 pr-2">
                    <TeamIdentity
                      name={allocation.qualifiedTeam}
                      plain
                      hideText
                      containerClassName="!size-20"
                      logoClassName="!w-20 !h-20 object-contain drop-shadow-xl"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FormatCalendarItem({ tournament, stageDetails }) {
  return (
    <AccordionItem value="format-calendar" className="mb-2 rounded-xl border border-border bg-secondary/20 px-5">
      <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]>svg:first-child]:text-primary" aria-expanded="false">
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
            <div className="grid gap-4 md:grid-cols-3">
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
              <div className="grid gap-3">
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

function formatUsdAmount(value) {
  const number = Number(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) ? `$${Math.round(number).toLocaleString("en-US")}` : "";
}

function PrizePoolSection({ stage, rows }) {
  const [expanded, setExpanded] = useState(false);
  const total = rows.reduce((sum, entry) => {
    const value = Number(String(entry?.usd || "").replace(/[^0-9.]/g, ""));
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
  const visibleRows = expanded ? rows : rows.slice(0, 8);
  const hasMore = rows.length > 8;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background/80">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-secondary/30 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-foreground">{stage}</p>
        <p className="text-xs font-semibold text-muted-foreground">
          Total: {formatUsdAmount(total)}
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2 text-left">Place</th>
            <th className="px-4 py-2 text-right">$ USD</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {visibleRows.map((entry) => (
            <tr key={`${stage}-${entry.placement}`} className="hover:bg-secondary/20">
              <td className="px-4 py-2 font-semibold">{entry.placement}</td>
              <td className="px-4 py-2 text-right text-muted-foreground">{formatUsdAmount(entry.usd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasMore ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="w-full border-t border-border px-4 py-2 text-center text-xs font-bold uppercase tracking-[0.12em] text-primary transition hover:bg-secondary/20"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}

function PrizePoolItem({ tournament, prizeColumns }) {
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 text-left">Place</th>
                <th className="px-4 py-3 text-left">Team</th>
                {prizeColumns.hasInr && <th className="px-4 py-3 text-right">INR</th>}
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
          </table>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function ParticipantsItem({ participantSections, liveParticipantRosters, tournamentStatus }) {
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

function AwardsItem({ tournament }) {
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

function RankingsItem({ rankings }) {
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

function ChampionCard({
  championEntry,
  championImageSrc,
  championRoster,
  championTeamName,
  championDisplayName,
  championLogoOverride,
}) {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-border bg-card p-6 shadow-xl sm:p-8">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative z-10 mb-8 flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
          <Trophy className="size-6" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Tournament</p>
          <h2 className="text-sm font-black text-foreground">Champion</h2>
        </div>
      </div>

      <div className="relative z-10 space-y-6">
        {championEntry && (
          <div className="flex flex-col">
            {championImageSrc && (
              <img
                src={championImageSrc}
                alt={`${championEntry.fullTeam || championEntry.team} champion celebration`}
                className="mb-8 aspect-[4/3] w-full rounded-[24px] object-cover object-top shadow-2xl"
                loading="lazy"
              />
            )}

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative flex-shrink-0">
                <div className="absolute left-1/2 top-1/2 size-32 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-amber-500/20 blur-2xl" />
                <div className="relative z-10 transition-transform duration-500 hover:scale-105">
                  {championLogoOverride ? (
                    <img
                      src={championLogoOverride}
                      alt={`${championTeamName} champion logo`}
                      className="h-32 w-32 object-contain drop-shadow-[0_0_20px_rgba(244,196,0,0.6)]"
                      loading="lazy"
                    />
                  ) : (
                    <TeamIdentity
                      name={championTeamName}
                      className="font-heading text-4xl font-bold tracking-wide text-amber-400"
                      compact
                      plain
                      hideText
                      containerClassName="size-32"
                      logoClassName="h-32 w-32 object-contain drop-shadow-[0_0_20px_rgba(244,196,0,0.6)]"
                    />
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-center sm:pt-2 text-center sm:text-left">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500/80">Winning Team</p>
                <p className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">{championDisplayName}</p>

                {championRoster?.length ? (
                  <div className="mt-4 text-sm font-semibold text-muted-foreground">
                    <span className="mr-2 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500/60">Roster</span>
                    {championRoster.join(" • ")}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EventBriefPanel({
  tournament,
  spotlightStage,
  allocations,
  stageDetails,
  prizeColumns,
  participantEntries,
  participantSections,
  liveParticipantRosters,
  rankings,
  useIntegratedRankingsStage,
}) {
  return (
    <div className="lg:col-span-2 bg-card border border-border rounded-xl">
      <div className="p-5 border-b border-border">
        <h2 className="font-heading text-sm font-semibold tracking-wider uppercase">Event Brief</h2>
      </div>
      <div className="p-6">
        <EventBriefBody
          tournament={tournament}
          spotlightStage={spotlightStage}
          allocations={allocations}
        />
        <div className="pt-4">
          <Accordion type="single" collapsible className="w-full">
            {(tournament.format_overview || tournament.calendar?.length) && (
              <FormatCalendarItem tournament={tournament} stageDetails={stageDetails} />
            )}

            {tournament.prize_breakdown?.length > 0 && (
              <PrizePoolItem tournament={tournament} prizeColumns={prizeColumns} />
            )}

            {participantEntries.length > 0 && (
              <ParticipantsItem
                participantSections={participantSections}
                liveParticipantRosters={liveParticipantRosters}
                tournamentStatus={tournament.status}
              />
            )}

            {tournament.awards?.length > 0 && (
              <AwardsItem tournament={tournament} />
            )}

            {rankings.length > 0 && !useIntegratedRankingsStage && (
              <RankingsItem rankings={rankings} />
            )}
          </Accordion>
        </div>
      </div>
    </div>
  );
}

export default function TournamentDetail({ tournament, onBack, requestedStage = "" }) {
  const { data: coreData = {}, isLoading: isCoreLoading } = useQuery({
    queryKey: ["tournament-core", tournament.id],
    queryFn: () => base44.pages.tournamentCore(tournament.id),
    enabled: Boolean(tournament?.id),
    staleTime: 120_000,
    refetchOnWindowFocus: false,
  });
  const { data: fullData = {}, isLoading: isFullLoading } = useQuery({
    queryKey: ["tournament-full", tournament.id],
    queryFn: () => base44.pages.tournamentFull(tournament.id),
    enabled: Boolean(tournament?.id),
    staleTime: 120_000,
    refetchOnWindowFocus: false,
  });
  const stageBoardRef = useRef(null);
  const [stageBoardVisible, setStageBoardVisible] = useState(false);
  useEffect(() => {
    if (!stageBoardRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStageBoardVisible(true); },
      { rootMargin: "200px" }
    );
    observer.observe(stageBoardRef.current);
    return () => observer.disconnect();
  }, []);

  const teams = fullData.teams || EMPTY_STAGE_TEAMS;
  const matches = coreData.matches || EMPTY_STAGE_MATCHES;
  const rawMatchResults = coreData.matchResults || EMPTY_STAGE_MATCH_RESULTS;
  const matchResults = useMemo(() => filterPublishedMatchResults(rawMatchResults), [rawMatchResults]);
  const players = fullData.players || EMPTY_STAGE_PLAYERS;
  const dbTransfers = fullData.transfers || EMPTY_STAGE_PLAYERS;
  const normalizedTournamentData = coreData.normalizedTournamentData || null;

  const normalizedParticipants =
    normalizedTournamentData?.participants ?? EMPTY_STAGE_PARTICIPANT_ENTRIES;
  const normalizedStages =
    normalizedTournamentData?.stages ?? EMPTY_NORMALIZED_STAGES;
  const rawParticipantEntries = isBmps2026Tournament(tournament)
    ? getOfficialParticipantEntries(tournament)
    : tournament.participants ?? EMPTY_STAGE_PARTICIPANT_ENTRIES;
  const rawTournamentStages = tournament.stages ?? EMPTY_NORMALIZED_STAGES;
  const calendarMatches = useMemo(
    () => decorateMatchesWithLiveStatus(matches, matchResults),
    [matches, matchResults]
  );

  const participantEntries = useMemo(() => {
    const cleanEntries = (entries) =>
      (entries || []).map((entry) => ({
        ...entry,
        phase: getCleanStageLabel(entry.phase || "Participants"),
      }));

    if (normalizedParticipants.length > 0) {
      const normalizedEntries = buildNormalizedParticipantEntries(normalizedParticipants);
      if (normalizedEntries.length >= rawParticipantEntries.length) {
        return cleanEntries(normalizedEntries);
      }

      return cleanEntries(rawParticipantEntries);
    }

    return cleanEntries(rawParticipantEntries);
  }, [normalizedParticipants, rawParticipantEntries]);

  const rankings = tournament.rankings ?? [];
  const useIntegratedRankingsStage =
    BMPS_2026_STYLE_STAGE_TOURNAMENTS.has(tournament.name) && rankings.length > 0;
  const tournamentLogo = getTournamentLogo(tournament);
  const allocations = getTournamentAllocations(tournament);
  const resolvedParticipantState = useMemo(() => {
    const sourceStages =
      normalizedStages.length > 0 ? normalizedStages : rawTournamentStages;
    return resolveTournamentParticipantState({
      tournament,
      teams,
      matches: calendarMatches,
      matchResults,
      participantEntries,
      stageNames: sourceStages.flatMap((stage) => (stage?.name ? [getCleanStageLabel(stage.name)] : [])),
    });
  }, [
    calendarMatches,
    matchResults,
    normalizedStages,
    participantEntries,
    rawTournamentStages,
    teams,
    tournament,
  ]);
  const derivedStageBoards = useMemo(() => {
    const map = new Map();
    const sourceStages =
      normalizedStages.length > 0 ? normalizedStages : rawTournamentStages;
    for (const stage of sourceStages) {
      if (!stage?.name) continue;
      map.set(
        stage.name,
        getStageBoardData({
          featuredTournament: tournament,
          teams,
          matches: calendarMatches,
          matchResults,
          requestedStage: stage.name,
          participantEntries: resolvedParticipantState.participantEntries,
        })
      );
    }
    return map;
  }, [
    calendarMatches,
    matchResults,
    normalizedStages,
    rawTournamentStages,
    resolvedParticipantState.participantEntries,
    teams,
    tournament,
  ]);
  const tournamentStageFocus = useMemo(
    () =>
      getStageBoardData({
        featuredTournament: tournament,
        teams,
        matches: calendarMatches,
        matchResults,
        requestedStage: requestedStage || null,
        participantEntries: resolvedParticipantState.participantEntries,
      }),
    [calendarMatches, matchResults, requestedStage, resolvedParticipantState.participantEntries, teams, tournament]
  );
  const stageBoardStages = useMemo(
    () => {
      if (normalizedStages.length > 0) {
        const normalizedBoardStages = buildNormalizedStageBoardStages(normalizedStages, normalizedParticipants);
        const rawStageMap = new Map(
          rawTournamentStages.map((stage) => [getCleanStageLabel(stage.name), stage]),
        );
        const mergedStages = normalizedBoardStages.map((stage) => {
          const stageName = getCleanStageLabel(stage.name);
          const rawStage = rawStageMap.get(stageName);
          const derived = derivedStageBoards.get(stage.name) || derivedStageBoards.get(stageName);
          const rawStandings = Array.isArray(rawStage?.standings) ? rawStage.standings : [];
          const normalizedStandings = Array.isArray(stage.standings) ? stage.standings : [];
          const derivedStandings = derived?.standings?.map((entry) => ({
            placement: entry.rank,
            team: entry.teamName,
            fullTeam: entry.teamName,
            grp: entry.group && entry.group !== "-" ? entry.group : undefined,
            matches: entry.matches,
            wwcd: entry.wwcd,
            pos: entry.placementPoints,
            elimins: entry.elims,
            points: entry.points,
          })) || [];
          const preferredStandings =
            rawStandings.length > normalizedStandings.length
              ? rawStandings
              : normalizedStandings;
          const shouldPreferDerivedStandings =
            tournament.name === "Battlegrounds Mobile India Pro Series 2026" &&
            isBmps2026SurvivalStage(stageName) &&
            derivedStandings.length > 0;
          const finalStandings =
            shouldPreferDerivedStandings || derivedStandings.length > preferredStandings.length
              ? derivedStandings
              : preferredStandings;

          return {
            ...stage,
            name: stageName,
            summary: stage.summary || rawStage?.summary || "",
            teamCount: Math.max(stage.teamCount || 0, rawStage?.teamCount || 0, finalStandings.length || 0),
            standings: finalStandings,
          };
        });

        const normalizedNames = new Set(mergedStages.map((stage) => getCleanStageLabel(stage.name)));
        const rawOnlyStages = rawTournamentStages.reduce((stagesAcc, stage) => {
          const stageName = getCleanStageLabel(stage?.name);
          if (!stageName || normalizedNames.has(stageName)) {
            return stagesAcc;
          }

          stagesAcc.push({
            ...stage,
            name: stageName,
            standings: Array.isArray(stage.standings) ? stage.standings : [],
          });
          return stagesAcc;
        }, []);

        return mergeDisplayStages([...mergedStages, ...rawOnlyStages]);
      }

      return mergeDisplayStages(rawTournamentStages.map((stage) => {
        const stageName = getCleanStageLabel(stage.name);
        const derived = derivedStageBoards.get(stage.name) || derivedStageBoards.get(stageName);
        const derivedStandings = derived?.standings?.map((entry) => ({
          placement: entry.rank,
          team: entry.teamName,
          fullTeam: entry.teamName,
          grp: entry.group && entry.group !== "-" ? entry.group : undefined,
          matches: entry.matches,
          wwcd: entry.wwcd,
          pos: entry.placementPoints,
          elimins: entry.elims,
          points: entry.points,
        })) || [];

        return {
          ...stage,
          name: stageName,
          standings: derivedStandings.length > 0 ? derivedStandings : stage.standings || [],
        };
      }));
    },
    [derivedStageBoards, normalizedParticipants, normalizedStages, rawTournamentStages, tournament.name]
  );
  const hasStageProgression = stageBoardStages.some(
    (stage) => stage?.name && (stage.summary || stage.standings?.length || stage.teamCount),
  );
  const spotlightStage =
    stageBoardStages.find((stage) => stage.name === tournamentStageFocus.featuredStage) ||
    stageBoardStages.find((stage) => stage.summary || stage.standings?.length) ||
    null;
  const championEntry = stageBoardStages
    ?.find((stage) => stage.name === "Grand Finals" && stage.standings?.length)
    ?.standings?.find((entry) => entry.placement === 1);
  const championImageSrc =
    tournament.name === "Battlegrounds Mobile India Series 2026"
      ? "/images/bgis2026-champion.webp"
      : tournament.name === "Battlegrounds Mobile India Series 2023"
        ? "/images/bgis2023-champion.webp"
      : tournament.name === "Battlegrounds Mobile India Series 2024"
        ? "/images/bgis2024-champion.webp"
      : tournament.name === "Battlegrounds Mobile India Series 2025"
        ? "/images/bgis2025-champion.webp"
      : tournament.name === "India - Korea Invitational"
        ? "/images/in-kr-champion.webp"
      : tournament.name === "Battlegrounds Mobile India Showdown 2025"
        ? "/images/bmsd2025-champion.webp"
      : tournament.name === "Battlegrounds Mobile India International Cup 2025"
        ? "/images/bmic2025-champion.webp"
      : tournament.name === "Battlegrounds Mobile India Pro Series 2023"
        ? "/images/bmps2023-champion.webp"
      : tournament.name === "Battlegrounds Mobile India Pro Series 2024"
        ? "/images/bmps2024-champion.webp"
      : tournament.name === "Battlegrounds Mobile India Pro Series 2025"
        ? "/images/bmps2025-champion.webp"
      : tournament.name === "Battlegrounds Mobile India Pro Series 2026"
        ? "/images/bmps2026-champion.webp"
      : null;
  const championRoster =
    participantEntries.find(
      (entry) => normalizeTeamName(entry.team) === normalizeTeamName(championEntry?.fullTeam || championEntry?.team)
    )?.players ?? null;
  const championTeamName =
    participantEntries.find(
      (entry) => normalizeTeamName(entry.team) === normalizeTeamName(championEntry?.fullTeam || championEntry?.team)
    )?.team ??
    championEntry?.fullTeam ??
    championEntry?.team;
  const championDisplayName = getChampionDisplayName(championTeamName);
  const championLogoOverride = getChampionLogoOverride(championEntry?.fullTeam || championTeamName);
  const displayParticipantEntries = useMemo(() => {
    if (!isBmps2026Tournament(tournament)) {
      return participantEntries;
    }

    return getOfficialParticipantEntries({
      ...tournament,
      participants: participantEntries,
    });
  }, [participantEntries, tournament]);
  const participantCount = Math.max(
    getOfficialParticipantCount({
      ...tournament,
      participants: displayParticipantEntries,
    }),
    16,
  );
  const participantSections = useMemo(() => {
    if (tournament.name === "Battlegrounds Mobile India Pro Series 2026" || tournament.name === "PUBG Mobile World Cup 2026") {
      return [
        {
          phase: "Teams",
          entries: displayParticipantEntries,
          order: -1,
        },
      ];
    }

    const sections = new Map();
    const getOrder = (phase) => {
      if (/round 1 - group a/i.test(phase)) return 0;
      if (/round 1 - group b/i.test(phase)) return 1;
      if (/round 1 - group c/i.test(phase)) return 2;
      if (/round 1 - group d/i.test(phase)) return 3;
      if (/round 2/i.test(phase)) return 4;
      if (/round 3/i.test(phase)) return 5;
      if (/round 4/i.test(phase)) return 6;
      if (/semi/i.test(phase)) return 7;
      if (/survival/i.test(phase)) return 8;
      if (/grand finals/i.test(phase)) return 9;
      return 50;
    };

    for (const entry of participantEntries) {
      const phase = getParticipantSectionLabel(entry.phase || "Participants");
      if (!sections.has(phase)) {
        sections.set(phase, []);
      }
      sections.get(phase).push(entry);
    }

    return Array.from(sections.entries())
      .toSorted((a, b) => {
        const orderDiff = getOrder(a[0]) - getOrder(b[0]);
        if (orderDiff !== 0) return orderDiff;
        return a[0].localeCompare(b[0]);
      })
      .map(([phase, entries]) => ({
        phase,
        entries: entries.toSorted((left, right) => {
          const leftPlacement = Number(left?.placement);
          const rightPlacement = Number(right?.placement);
          const leftHasPlacement = Number.isFinite(leftPlacement);
          const rightHasPlacement = Number.isFinite(rightPlacement);
          if (leftHasPlacement && rightHasPlacement && leftPlacement !== rightPlacement) {
            return leftPlacement - rightPlacement;
          }
          if (leftHasPlacement !== rightHasPlacement) {
            return leftHasPlacement ? -1 : 1;
          }
          return String(left?.team || "").localeCompare(String(right?.team || ""));
        }),
      }));
  }, [displayParticipantEntries, participantEntries, tournament.name]);
  const liveParticipantRosters = useMemo(() => {
    const rosterMap = {};
    const teamIdsByNormalizedName = new Map();

    for (const team of teams) {
      const normalizedTeam = normalizeOrganizationName(team.name);
      const currentIds = teamIdsByNormalizedName.get(normalizedTeam) || [];
      currentIds.push(team.id);
      teamIdsByNormalizedName.set(normalizedTeam, currentIds);
    }

    for (const participant of participantEntries) {
      const normalizedKey = normalizeOrganizationName(participant.team);
      const participantTeamIds = teamIdsByNormalizedName.get(normalizedKey) || [];

      rosterMap[normalizedKey] = buildLiveRoster({
        teamName: participant.team,
        normalizedTeam: normalizeOrganizationName,
        teamIds: participantTeamIds,
        players,
        transferEntries: dbTransfers,
        applyOverride: applyCurrentRosterOverride,
      });
    }

    return rosterMap;
  }, [dbTransfers, participantEntries, players, teams]);
  const featuredFacts = [
    {
      label: "Format",
      value: tournament.game || "BGMI",
      icon: Award,
      variant: "blue",
    },
    {
      label: "Prize Pool",
      value: tournament.prize_pool || "TBA",
      icon: Award,
      variant: "lime",
    },
    {
      label: "Teams",
      value: String(participantCount),
      icon: Users,
      variant: "default",
    },
    {
      label: "Stage Focus",
      value: spotlightStage?.name || tournament.status,
      icon: Calendar,
      variant: "dark",
    },
  ];
  const stageDetails = useMemo(() => {
    const calendarByLabel = new Map(
      (tournament.calendar || []).map((item) => [getCleanStageLabel(item.label), item.week])
    );

    return mergeDisplayStages(stageBoardStages).flatMap((stage) =>
      stage.summary || stage.standings?.length || stage.teamCount
        ? [
            {
              ...stage,
              name: getCleanStageLabel(stage.name),
              calendarWeek: calendarByLabel.get(getCleanStageLabel(stage.name)) || null,
            },
          ]
        : [],
    );
  }, [tournament.calendar, stageBoardStages]);
  const prizeColumns = useMemo(() => {
    const rows = Array.isArray(tournament.prize_breakdown)
      ? tournament.prize_breakdown
      : [];
    return {
      hasInr: rows.some((entry) => entry?.inr),
      hasUsd: rows.some((entry) => entry?.usd),
      hasQualifiesTo: rows.some((entry) => entry?.qualifiesTo),
    };
  }, [tournament.prize_breakdown]);

  return (
    <div className="space-y-6">
      <BackButton onBack={onBack} />

      <TournamentHero
        tournament={tournament}
        tournamentLogo={tournamentLogo}
        participantCount={participantCount}
      />

      <FeaturedFactsGrid facts={featuredFacts} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <EventBriefPanel
          tournament={tournament}
          spotlightStage={spotlightStage}
          allocations={allocations}
          stageDetails={stageDetails}
          prizeColumns={prizeColumns}
          participantEntries={participantEntries}
          participantSections={participantSections}
          liveParticipantRosters={liveParticipantRosters}
          rankings={rankings}
          useIntegratedRankingsStage={useIntegratedRankingsStage}
        />

        <ChampionCard
          championEntry={championEntry}
          championImageSrc={championImageSrc}
          championRoster={championRoster}
          championTeamName={championTeamName}
          championDisplayName={championDisplayName}
          championLogoOverride={championLogoOverride}
        />
      </div>

      <div ref={stageBoardRef}>
        {hasStageProgression && stageBoardVisible && (
          <StageStandingsBoard
            stages={stageBoardStages}
            participantEntries={participantEntries}
            tournamentName={tournament.name}
            tournamentId={tournament.id}
            teams={teams}
            players={players}
            matches={calendarMatches}
            matchResults={matchResults}
            requestedStage={requestedStage}
            rankings={useIntegratedRankingsStage ? rankings : []}
          />
        )}
        {hasStageProgression && !stageBoardVisible && (
          <div className="rounded-xl border bg-card p-8 animate-pulse">
            <div className="h-6 w-48 bg-muted rounded mb-4" />
            <div className="h-4 w-32 bg-muted rounded mb-6" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
