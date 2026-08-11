import React from "react";
import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import SortableColumnHeader from "@/components/tournaments/SortableColumnHeader";
import TeamIdentity from "@/components/shared/TeamIdentity";
import { getOrganizationMeta, normalizeOrganizationName } from "@/lib/organizationIdentity";
import {
  BMPS_2026_IGL_STATS,
  BMPS_2026_PLAYER_ROW_TEAM_OVERRIDES,
  BMPS_2026_PLAYER_TEAM_OVERRIDES,
} from "@/lib/bmps2026PlayerStats";
import { buildTeamLink } from "@/features/tournaments/utils/participantHelpers";
import RankingTable from "@/features/tournaments/components/RankingTable";

function StatisticsHeader({ title, icon }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="bg-brand-navy px-5 py-4 text-center">
        <div className={icon ? "flex items-center justify-center gap-2" : undefined}>
          {icon}
          <p
            className={`uppercase tracking-[0.08em] text-white ${
              icon ? "text-lg font-black" : "text-lg font-semibold"
            }`}
          >
            {title}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatisticsTableShell({ minWidth, children }) {
  return (
    <div className="max-h-[70vh] overflow-auto rounded-xl border border-border bg-background/90 shadow-sm">
      <table className={`w-full ${minWidth} border-separate border-spacing-0 text-sm [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-20 [&_thead_th]:bg-secondary`}>
        {children}
      </table>
    </div>
  );
}

function PlayerLinkCell({ teamName, playerName }) {
  return (
    <td className="border-r border-border/50 p-4">
      <Link to={buildTeamLink(teamName)} className="inline-flex items-center gap-3 font-semibold text-foreground">
        <TeamIdentity
          name={teamName}
          contained
          compact
          hideText
          logoClassName="size-5 object-contain"
          logoBlockClassName="!border-slate-200/90 !bg-white !shadow-[0_4px_12px_rgba(15,23,42,0.06)] dark:!border-white/10 dark:!bg-white/[0.07]"
        />
        <span className="leading-none">{playerName}</span>
      </Link>
    </td>
  );
}

function EliminatorStatistics({
  categories,
  currentCategory,
  onSelectCategory,
  subStages,
  currentSubStage,
  onSelectSubStage,
  tableKey,
  tableSort,
  dispatch,
  rows,
  playerTeams,
}) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="bg-brand-navy px-5 py-4 text-center">
          <p className="text-lg font-semibold uppercase tracking-[0.08em] text-white">
            ELIMINATOR
          </p>
        </div>
        <div className="flex flex-wrap gap-2 border-b border-border px-5 py-3">
          {subStages.map((subStage) => (
            <button
              key={subStage.key}
              type="button"
              onClick={() => onSelectSubStage(subStage.key)}
              className={`rounded-t-xl border-b-2 px-2 py-2 text-sm font-semibold transition-colors md:px-3 ${
                currentSubStage === subStage.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {subStage.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length > 0 ? (
        <StatisticsTableShell minWidth="min-w-[1280px]">
          <thead>
            <tr className="border-b border-border bg-secondary/30 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {["rank", "player", "matches", "finishes", "fpm", "contribution", "best", "fivePlus", "erangel", "miramar", "rondo"].map(
                (field, index) => (
                  <th
                    key={field}
                    className={`sticky top-0 z-20 border-b bg-secondary p-4 ${
                      index < 10 ? "border-r border-border/60" : ""
                    } ${
                      field === "player" || field === "rank"
                        ? "text-left"
                        : "text-center"
                    }`}
                  >
                    <SortableColumnHeader
                      label={
                        field === "fivePlus"
                          ? "5+"
                          : field.charAt(0).toUpperCase() + field.slice(1)
                      }
                      field={field}
                      tableKey={tableKey}
                      tableSort={tableSort}
                      dispatch={dispatch}
                      align={field === "player" || field === "rank" ? undefined : "center"}
                    />
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((entry, index) => {
              const rawTeamName =
                entry.teamName ||
                BMPS_2026_PLAYER_ROW_TEAM_OVERRIDES[`${entry.rank}:${entry.player}`] ||
                BMPS_2026_PLAYER_TEAM_OVERRIDES[normalizeOrganizationName(entry.player)] ||
                playerTeams.get(normalizeOrganizationName(entry.player)) ||
                null;
              const teamName = rawTeamName ? getOrganizationMeta(rawTeamName).name : null;

              return (
                <tr
                  key={`bmps-2026-stat-${entry.rank}-${entry.player}`}
                  className={`${index % 2 === 0 ? "bg-background/70" : "bg-secondary/10"} transition-colors hover:bg-secondary/20`}
                >
                  <td className="border-r border-border/50 p-4 font-semibold text-foreground">#{entry.rank}</td>
                  {teamName ? (
                    <PlayerLinkCell teamName={teamName} playerName={entry.player} />
                  ) : (
                    <td className="border-r border-border/50 p-4">
                      <span className="font-semibold text-foreground">{entry.player}</span>
                    </td>
                  )}
                  <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.matches}</td>
                  <td className="border-r border-border/50 p-4 text-center font-semibold text-primary">{entry.finishes}</td>
                  <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.fpm}</td>
                  <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.contribution}</td>
                  <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.best ?? "-"}</td>
                  <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.fivePlusFinishes ?? "-"}</td>
                  <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.erangel ?? "-"}</td>
                  <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.miramar ?? "-"}</td>
                  <td className="p-4 text-center font-medium text-muted-foreground">{entry.rondo ?? "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </StatisticsTableShell>
      ) : null}
    </div>
  );
}

function IglStatistics({ title }) {
  return (
    <div className="space-y-4">
      <StatisticsHeader title={title} icon={<Trophy className="size-4 text-white" />} />

      <StatisticsTableShell minWidth="min-w-[980px]">
        <thead>
          <tr className="border-b border-border bg-secondary/30 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <th className="border-r border-border/60 p-4 text-left">Rank</th>
            <th className="border-r border-border/60 p-4 text-left">Player</th>
            <th className="border-r border-border/60 p-4 text-center">IGL Rating</th>
            <th className="border-r border-border/60 p-4 text-center">Team Avg. Pts.</th>
            <th className="border-r border-border/60 p-4 text-center">WWCD</th>
            <th className="border-r border-border/60 p-4 text-center">Top 5s</th>
            <th className="border-r border-border/60 p-4 text-center">Team Avg. Sur.</th>
            <th className="p-4 text-center">Matches</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {BMPS_2026_IGL_STATS.map((entry, index) => (
            <tr
              key={`bmps-2026-igl-${entry.rank}-${entry.player}`}
              className={`${index % 2 === 0 ? "bg-background/70" : "bg-secondary/10"} transition-colors hover:bg-secondary/20`}
            >
              <td className="border-r border-border/50 p-4 font-semibold text-foreground">#{entry.rank}</td>
              <PlayerLinkCell teamName={entry.teamName} playerName={entry.player} />
              <td className="border-r border-border/50 p-4 text-center font-semibold text-primary">{entry.iglRating}</td>
              <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.teamAvgPts}</td>
              <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.wwcd}</td>
              <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.top5s}</td>
              <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.teamAvgSurvival}</td>
              <td className="p-4 text-center font-medium text-muted-foreground">{entry.matches}</td>
            </tr>
          ))}
        </tbody>
      </StatisticsTableShell>
    </div>
  );
}

function MvpStatistics({ title, rows }) {
  return (
    <div className="space-y-4">
      <StatisticsHeader title={title} />

      <StatisticsTableShell minWidth="min-w-[1320px]">
        <thead>
          <tr className="border-b border-border bg-secondary/30 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <th className="border-r border-border/60 p-4 text-left">Rank</th>
            <th className="border-r border-border/60 p-4 text-left">Player</th>
            <th className="border-r border-border/60 p-4 text-center">M</th>
            <th className="border-r border-border/60 p-4 text-center">MVP Rating</th>
            <th className="border-r border-border/60 p-4 text-center">Finishes</th>
            <th className="border-r border-border/60 p-4 text-center">FPM</th>
            <th className="border-r border-border/60 p-4 text-center">Damage</th>
            <th className="border-r border-border/60 p-4 text-center">Avg. Survival</th>
            <th className="p-4 text-center">Knocks</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((entry, index) => (
            <tr
              key={`bmps-2026-mvp-${entry.rank}-${entry.player}`}
              className={`${index % 2 === 0 ? "bg-background/70" : "bg-secondary/10"} transition-colors hover:bg-secondary/20`}
            >
              <td className="border-r border-border/50 p-4 font-semibold text-foreground">#{entry.rank}</td>
              <PlayerLinkCell teamName={entry.teamName} playerName={entry.player} />
              <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.matches}</td>
              <td className="border-r border-border/50 p-4 text-center font-semibold text-primary">{entry.mvpRating}</td>
              <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.finishes}</td>
              <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.fpm}</td>
              <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.damage}</td>
              <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.avgSurvival}</td>
              <td className="p-4 text-center font-medium text-muted-foreground">{entry.knocks}</td>
            </tr>
          ))}
        </tbody>
      </StatisticsTableShell>
    </div>
  );
}

function RankingsStatistics({ activeStage, rankings }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-background/90 p-5 shadow-sm">
        <p className="text-lg font-semibold uppercase tracking-[0.08em] text-foreground">
          {activeStage?.name?.toUpperCase() || "STATISTICS"}
        </p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Tournament player and team leaderboards collected from the official stage rankings for this event.
        </p>
      </div>

      <div className="space-y-3">
        {rankings.map((ranking) => (
          <div key={ranking.title} className="rounded-xl border border-border bg-background/80 p-4 shadow-sm">
            <p className="mb-3 text-[10px] uppercase tracking-wider text-primary">{ranking.title}</p>
            <RankingTable ranking={ranking} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatisticsPanel({
  isStatisticsStage,
  isRankingsStatisticsStage,
  activeStage,
  rankings = [],
  categories = [],
  currentCategory,
  onSelectCategory,
  subStages = [],
  currentSubStage,
  onSelectSubStage,
  tableKey,
  tableSort,
  dispatch,
  rows = [],
  playerTeams,
  mvpRows,
}) {
  if (isStatisticsStage && !isRankingsStatisticsStage) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          {categories.map((category) => (
            <button
              key={category.key}
              type="button"
              onClick={() => onSelectCategory(category.key)}
              className={`rounded-t-xl border-b-2 px-2 py-2 text-sm font-semibold transition-colors md:px-3 ${
                currentCategory === category.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {currentCategory === "eliminator" ? (
          <EliminatorStatistics
            categories={categories}
            currentCategory={currentCategory}
            onSelectCategory={onSelectCategory}
            subStages={subStages}
            currentSubStage={currentSubStage}
            onSelectSubStage={onSelectSubStage}
            tableKey={tableKey}
            tableSort={tableSort}
            dispatch={dispatch}
            rows={rows}
            playerTeams={playerTeams}
          />
        ) : currentCategory === "igl" ? (
          <IglStatistics title="IGL" />
        ) : currentCategory === "mvp" || currentCategory === "fmvp" ? (
          <MvpStatistics title={currentCategory === "fmvp" ? "FMVP" : "MVP"} rows={mvpRows} />
        ) : null}
      </div>
    );
  }

  if (isRankingsStatisticsStage) {
    return <RankingsStatistics activeStage={activeStage} rankings={rankings} />;
  }

  return null;
}
