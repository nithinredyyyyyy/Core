import React from "react";
import {
  ArrowRightLeft,
  BarChart3,
  CheckCircle2,
  Database,
  FileText,
  Image,
  Newspaper,
  Swords,
  Trophy,
  Users,
} from "lucide-react";

const CONTROL_AREAS = [
  {
    tab: "Tournaments",
    icon: Trophy,
    controls: "Tournament shell, game, prize pool, stages, participants, rankings, format, calendar, awards.",
    when: "Use before an event starts or when changing tournament structure.",
  },
  {
    tab: "Teams",
    icon: Users,
    controls: "Organizations, tags, logos, game, region, public team identity.",
    when: "Use when a team name/logo is wrong or a new organization appears.",
  },
  {
    tab: "Matches",
    icon: Swords,
    controls: "Schedule, stage, map, group/lobby, match number, time, stream URL, match status.",
    when: "Use before each matchday or when map/group rotation changes.",
  },
  {
    tab: "Results",
    icon: FileText,
    controls: "Placement, eliminations, placement points, total points, published/unpublished result state.",
    when: "Use after every match. Public standings update from published results.",
  },
  {
    tab: "Stats",
    icon: BarChart3,
    controls: "BMPS 2026 player stats for Qualifier, Survival, Semi Finals, and auto-combined Overall.",
    when: "Use when official player-stat sheets are released. Paste pipe rows and save.",
  },
  {
    tab: "Transfers",
    icon: ArrowRightLeft,
    controls: "Roster moves, IN/OUT updates, transfer-window feed.",
    when: "Use when a team signs, releases, or renames a lineup.",
  },
  {
    tab: "News",
    icon: Newspaper,
    controls: "Articles, announcements, source metadata, featured/publication state.",
    when: "Use for public stories and event updates.",
  },
  {
    tab: "Posters",
    icon: Image,
    controls: "Stage/group poster previews from live tournament data.",
    when: "Use after groups or standings are updated.",
  },
  {
    tab: "Inspector",
    icon: Database,
    controls: "Live payload checks, missing logos, duplicate orgs, participant mapping, result coverage.",
    when: "Use before publishing important changes.",
  },
];

const DAILY_FLOW = [
  "Check Inspector for missing teams/logos and result wiring.",
  "Update Matches if map, time, group, or status changed.",
  "Publish Results after every match.",
  "Update Stats when official player stats are available.",
  "Refresh public Tournament and Standings pages.",
  "Publish News or Transfers if needed.",
];

export default function AdminOperations({ onSelectTab }) {
  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
          No-code control room
        </p>
        <h2 className="mt-2 text-2xl font-semibold uppercase tracking-[-0.04em]">
          Site Operations
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          Use this as the control map. Every public page should be operated from Admin:
          tournament structure, schedules, results, player stats, teams, news, transfers,
          and data checks.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="size-5 text-primary" />
            <h3 className="font-semibold">Daily Matchday Flow</h3>
          </div>
          <div className="space-y-3">
            {DAILY_FLOW.map((item, index) => (
              <div
                key={item}
                className="flex gap-3 rounded-xl border border-border bg-secondary/30 p-3"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {CONTROL_AREAS.map((area) => (
            <button
              key={area.tab}
              type="button"
              onClick={() => onSelectTab?.(area.tab.toLowerCase())}
              className="rounded-[20px] border border-border bg-card p-4 text-left shadow-sm transition hover:border-primary/40 hover:bg-secondary/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                    {area.tab}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    {area.controls}
                  </p>
                </div>
                <area.icon className="size-5 shrink-0 text-muted-foreground" />
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                {area.when}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
