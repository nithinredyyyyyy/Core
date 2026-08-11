import { Link } from "react-router-dom";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  buildBoardLink,
  formatLeaderboardDate,
} from "@/features/leaderboard/utils/leaderboardHelpers";
import { LeaderboardTeamLink, MatchCell, RankBadge } from "@/features/leaderboard/components/leaderboardBits";

function SignalCard({ label, value, detail, accent = "default", status }) {
  const accentClass =
    accent === "primary"
      ? "border-primary/25 bg-primary/10"
      : accent === "live"
        ? "border-red-500/25 bg-red-500/10"
        : "border-border bg-card";

  return (
    <div className={`rounded-[26px] border p-5 shadow-sm ${accentClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
            {label}
          </p>
          <p className="mt-3 text-lg font-black uppercase tracking-[-0.02em] text-foreground">
            {value}
          </p>
          <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
            {detail}
          </p>
        </div>
        {status ? <StatusBadge status={status} /> : null}
      </div>
    </div>
  );
}

export default function FeaturedStandingsSection({
  featuredTournament,
  stageBoard,
  tournamentQuery,
  stageOptions,
  nextUpcomingTournament,
}) {
  if (!featuredTournament) return null;

  return (
    <m.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[32px] border border-border bg-card shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
    >
      <div className="border-b border-border bg-card p-4 sm:px-5 sm:py-5 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
                Featured tournament standings
              </p>
              <StatusBadge
                status={featuredTournament.status === "ongoing" ? "live" : featuredTournament.status}
              />
            </div>
            <h2 className="mt-3 max-w-4xl text-[1.75rem] font-heading font-semibold uppercase tracking-[-0.04em] text-foreground sm:text-2xl md:text-4xl">
              {featuredTournament.name}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <span>{stageBoard.standings.length} teams ranked</span>
              <span>&bull;</span>
              <span>{stageBoard.stageMatches.length} mapped matches</span>
            </div>
          </div>

          <Link
            to={`/tournaments${tournamentQuery}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary/40 hover:text-primary sm:w-auto"
          >
            Tournament hub
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        {stageOptions.length > 1 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {stageOptions.map((stageName) => {
              const active = stageName === stageBoard.featuredStage;
              return (
                <Link
                  key={stageName}
                  to={buildBoardLink(featuredTournament.id, stageName)}
                  className={`rounded-full px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background/80 text-muted-foreground hover:border-primary/35 hover:text-foreground"
                  }`}
                >
                  {stageName}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 border-b border-border p-4 sm:px-5 sm:py-5 md:grid-cols-4 md:px-6">
        <SignalCard
          label="Live match"
          value={
            stageBoard.liveMatch
              ? `Match ${stageBoard.liveMatch.match_number || "-"}`
              : featuredTournament.status === "completed"
                ? "Tournament completed"
                : featuredTournament.status === "upcoming"
                  ? "Season not live yet"
                  : "No live lobby"
          }
          detail={
            stageBoard.liveMatch
              ? `${stageBoard.liveMatch.stage || "Stage"}${stageBoard.liveMatch.map ? ` - ${stageBoard.liveMatch.map}` : ""}`
              : featuredTournament.start_date
                ? formatLeaderboardDate(featuredTournament.start_date, "MMM d, yyyy", "Starts ")
                : "Standings remain available while the next lobby is prepared."
          }
          accent={featuredTournament.status === "completed" ? "default" : "live"}
          status={stageBoard.liveMatch ? "live" : featuredTournament.status}
        />
        <SignalCard
          label="Up next"
          value={
            stageBoard.nextMatch
              ? `Match ${stageBoard.nextMatch.match_number || "-"}`
              : nextUpcomingTournament
                ? nextUpcomingTournament.name
                : "Awaiting update"
          }
          detail={
            stageBoard.nextMatch?.scheduled_time
              ? formatLeaderboardDate(stageBoard.nextMatch.scheduled_time, "MMM d, h:mm a")
              : nextUpcomingTournament?.start_date
                ? formatLeaderboardDate(nextUpcomingTournament.start_date, "MMM d, yyyy", "Starts ")
                : "No scheduled start time yet."
          }
          status={stageBoard.nextMatch?.status || nextUpcomingTournament?.status || featuredTournament.status}
        />
        <SignalCard
          label="Stage leader"
          value={stageBoard.leader?.teamName || "Standings pending"}
          detail={
            stageBoard.leader
              ? `${stageBoard.leader.points} pts - ${stageBoard.leader.wwcd} WWCD - ${stageBoard.leader.elims} elims`
              : "Results will populate once the stage board receives match scores."
          }
          accent="primary"
        />
        <SignalCard
          label="Stage focus"
          value={stageBoard.featuredStage || "Standings"}
          detail={
            stageBoard.stageMatches.length > 0
              ? `${stageBoard.stageMatches.length} match columns connected`
              : "Waiting for mapped match data."
          }
        />
      </div>

      <div className="-mx-4 overflow-x-auto sm:-mx-5 md:mx-0">
        <div className="flex min-w-[1120px] overflow-hidden md:min-w-0">
          <div className="shrink-0 border-r border-border bg-card shadow-[10px_0_24px_rgba(15,23,42,0.08)]">
            <table className="w-[756px] table-fixed text-sm">
              <colgroup>
                <col style={{ width: "72px" }} />
                <col style={{ width: "260px" }} />
                <col style={{ width: "70px" }} />
                <col style={{ width: "84px" }} />
                <col style={{ width: "94px" }} />
                <col style={{ width: "84px" }} />
                <col style={{ width: "92px" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-border bg-secondary/25 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  <th className="border-r border-border bg-secondary/35 px-4 py-3 text-left">#</th>
                  <th className="border-r border-border bg-secondary/35 px-4 py-3 text-left">Team</th>
                  <th className="border-r border-border bg-secondary/35 p-3 text-center">M</th>
                  <th className="border-r border-border bg-secondary/35 p-3 text-center">WWCD</th>
                  <th className="border-r border-border bg-secondary/35 p-3 text-center">Place</th>
                  <th className="border-r border-border bg-secondary/35 p-3 text-center">Elims</th>
                  <th className="bg-background p-3 text-center font-black text-foreground">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stageBoard.standings.map((team, index) => (
                  <m.tr
                    key={`summary-${team.teamId || team.teamName}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.015 }}
                    className="h-[72px] bg-card/90 transition-colors hover:bg-secondary/20"
                  >
                    <td className="h-[72px] border-r border-border px-4 py-3 align-middle">
                      <RankBadge rank={team.rank} />
                    </td>
                    <td className="h-[72px] border-r border-border px-4 py-3 align-middle">
                      <LeaderboardTeamLink teamName={team.teamName} logoName={team.logoName} />
                    </td>
                    <td className="h-[72px] border-r border-border p-3 text-center align-middle text-foreground">{team.matches}</td>
                    <td className="h-[72px] border-r border-border p-3 text-center align-middle text-foreground">{team.wwcd}</td>
                    <td className="h-[72px] border-r border-border p-3 text-center align-middle text-foreground">{team.placementPoints}</td>
                    <td className="h-[72px] border-r border-border p-3 text-center align-middle text-foreground">{team.elims}</td>
                    <td className="h-[72px] bg-background p-3 text-center align-middle text-lg font-black text-primary">{team.points}</td>
                  </m.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="min-w-0 flex-1 overflow-x-auto">
            <table className="w-max table-fixed text-sm">
              <colgroup>
                {stageBoard.stageMatches.map((match) => (
                  <col key={`match-col-${match.id}`} style={{ width: "94px" }} />
                ))}
              </colgroup>
              <thead>
                <tr className="border-b border-border bg-secondary/25 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {stageBoard.stageMatches.map((match) => (
                    <th key={match.id} className="p-3 text-center">
                      M{match.board_match_number || match.match_number || "-"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stageBoard.standings.map((team, index) => (
                  <m.tr
                    key={`matches-${team.teamId || team.teamName}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.015 }}
                    className="h-[72px] bg-card/90 transition-colors hover:bg-secondary/20"
                  >
                    {stageBoard.stageMatches.map((match) => (
                      <td key={`${team.teamId || team.teamName}-${match.id}`} className="h-[72px] p-3 text-center align-middle">
                        <MatchCell cell={team.matchCells[match.id]} />
                      </td>
                    ))}
                  </m.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </m.section>
  );
}
