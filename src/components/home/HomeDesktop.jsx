import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Asterisk,
  Newspaper,
  Radio,
  Swords,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import TeamIdentity from "@/components/shared/TeamIdentity";
import LogoBlock from "@/components/shared/LogoBlock";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: "easeOut" },
});

const staggerGroup = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const riseItem = {
  initial: { opacity: 0, y: 22, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] },
};

function LightPanel({ className = "", children }) {
  return (
    <div
      className={`rounded-[28px] border border-border/70 bg-card shadow-[0_20px_60px_rgba(15,23,42,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}

export default function HomeDesktop({
  championLogo,
  championLogoSurfaceTone,
  championTeam,
  featuredCurrentStageLink,
  featuredNews,
  featuredSpotlightStage,
  featuredStages,
  featuredTournament,
  featuredTournamentFacts,
  featuredTournamentLink,
  heroMeta,
  homeBoard,
  boardEyebrow,
  boardHeadline,
  boardLink,
  featuredTournamentBoard,
  tickerItems,
  stackedLinks,
  buildTournamentStageLink,
  HOME_STAGE_STATUS_STYLES,
  lastTournament,
  latestNews,
  upcomingMatches,
}) {
  const iconMap = { Trophy, Users, Swords, Newspaper };

  return (
    <div className="mx-auto max-w-[1380px] space-y-6 pb-4 md:space-y-8 md:pb-6">
      <motion.section {...fadeUp(0)}>
        <div className="relative overflow-hidden rounded-[28px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,243,235,0.96))] shadow-[0_28px_70px_rgba(15,23,42,0.08)] md:rounded-[36px] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(17,24,39,0.96))]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.14),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(251,191,36,0.12),transparent_18%)]" />
          <div className="relative grid gap-5 px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:grid-cols-[1.02fr_0.98fr] lg:px-10 lg:py-10">
            <div className="space-y-6 md:space-y-7">
              <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-foreground/62">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-3 py-1 shadow-sm">
                  <Radio className="size-3.5 text-primary" />
                  Matchday command
                </span>
                <span className="inline-flex items-center gap-2 text-primary">
                  <Asterisk className="size-3.5" />
                  Built for season control
                </span>
              </div>

              <div className="space-y-4 md:space-y-5">
                <p className="max-w-28 text-[10px] font-semibold uppercase tracking-[0.38em] text-foreground/42">
                  Daily esports index
                </p>
                <h1 className="max-w-5xl text-[2.3rem] font-semibold uppercase leading-[0.9] tracking-[-0.06em] text-foreground sm:text-[2.85rem] md:text-[4.5rem] lg:text-[5.6rem]">
                  Control the season before the lobby drops.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-[15px]">
                  A cleaner esports front page for tracking the main event,
                  tournament boards, team movement, and fresh stories without
                  repeating the same tournament block over and over.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  to="/tournaments"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-primary-foreground transition-transform hover:-translate-y-0.5 sm:w-auto"
                >
                  Explore events <ArrowRight className="size-4" />
                </Link>
                <Link
                  to={boardLink}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border/80 bg-card px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-secondary sm:w-auto"
                >
                  Open tournament board <TrendingUp className="size-4" />
                </Link>
              </div>

              {heroMeta.length > 0 ? (
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {heroMeta.map((item, index) => (
                    <React.Fragment key={item}>
                      {index > 0 ? (
                        <span className="text-muted-foreground/50">&bull;</span>
                      ) : null}
                      <span>{item}</span>
                    </React.Fragment>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="relative min-h-[320px] md:min-h-[360px]">
              <div className="grid h-full gap-4 lg:grid-rows-[1fr_auto]">
                <div className="relative min-h-[260px] rounded-[24px] border border-[#3b3022] bg-[linear-gradient(135deg,rgba(14,14,16,1),rgba(24,24,27,0.98)_54%,rgba(47,31,17,0.95)_100%)] p-4 text-white shadow-[0_26px_70px_rgba(0,0,0,0.24)] md:min-h-[280px] md:rounded-[30px] md:p-5">
                  <div className="absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.22),transparent_28%),radial-gradient(circle_at_84%_22%,rgba(255,255,255,0.08),transparent_18%)] md:rounded-[30px]" />
                  {championTeam?.teamName ? (
                    <div className="pointer-events-none absolute inset-y-6 right-6 hidden items-center justify-end lg:flex">
                      <div className="opacity-[0.12] saturate-0">
                        {championLogo ? (
                          <LogoBlock
                            src={championLogo}
                            alt={`${championTeam.teamName} logo`}
                            sizeClass="size-48"
                            roundedClass="rounded-[2rem]"
                            paddingClass="p-5"
                            surfaceTone={championLogoSurfaceTone}
                            className="border-white/10 bg-white/5"
                          />
                        ) : (
                          <TeamIdentity
                            name={
                              championTeam.rawTeamName || championTeam.teamName
                            }
                            hideText
                            contained
                            logoClassName="h-40 w-auto object-contain"
                          />
                        )}
                      </div>
                    </div>
                  ) : null}
                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-white/50">
                          Last tournament highlight
                        </p>
                        <Link
                          to={
                            lastTournament
                              ? `/tournaments?id=${lastTournament.id}`
                              : "/tournaments"
                          }
                          className="mt-3 block max-w-[13ch] text-[1.75rem] font-black uppercase leading-[0.92] tracking-[-0.05em] transition-opacity hover:opacity-80 md:text-[2rem]"
                        >
                          {lastTournament?.name ||
                            "Latest completed tournament"}
                        </Link>
                        <p className="mt-3 max-w-[34ch] text-sm leading-7 text-white/66">
                          {championTeam?.teamName
                            ? `${championTeam.teamName} closed the event as champions in the latest finished tournament.`
                            : "The most recent completed tournament highlight will appear here."}
                        </p>
                      </div>
                      {lastTournament?.status ? (
                        <StatusBadge status={lastTournament.status} />
                      ) : null}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Link
                        to={
                          lastTournament
                            ? `/tournaments?id=${lastTournament.id}`
                            : "/tournaments"
                        }
                        className="rounded-[22px] border border-white/10 bg-white/6 p-4 transition-colors hover:bg-white/10"
                      >
                        <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                          Champion
                        </p>
                        <p className="mt-2 text-sm font-bold text-white">
                          {championTeam?.teamName || "TBD"}
                        </p>
                      </Link>
                      <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                          Total points
                        </p>
                        <p className="mt-2 text-sm font-bold text-white">
                          {championTeam?.totalPoints || 0}
                        </p>
                      </div>
                      <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">
                          WWCD
                        </p>
                        <p className="mt-2 text-sm font-bold text-white">
                          {championTeam?.wins || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <motion.div
                  variants={staggerGroup}
                  initial="initial"
                  animate="animate"
                  className="flex flex-col gap-4 xl:min-h-[340px] xl:block"
                >
                  {stackedLinks.map((card, idx) => {
                    const CardIcon = iconMap[card.icon] || Trophy;
                    return (
                      <motion.div
                        key={card.title}
                        variants={riseItem}
                        style={{ zIndex: 10 + idx }}
                      >
                        <Link
                          to={card.link}
                          className={`relative block w-full rounded-[24px] border border-border/80 bg-card p-4 text-foreground shadow-[0_18px_44px_rgba(15,23,42,0.1)] transition-transform duration-300 hover:z-30 hover:-translate-y-1 hover:scale-[1.02] sm:rounded-[28px] sm:p-5 xl:absolute xl:w-[17.5rem] xl:origin-bottom-right ${card.desktopPose}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10">
                              <CardIcon className="size-5 text-primary" />
                            </div>
                            <ArrowRight className="size-4 text-muted-foreground" />
                          </div>
                          <p className="mt-8 text-xl font-black uppercase tracking-[-0.04em] sm:mt-12 sm:text-2xl">
                            {card.title}
                          </p>
                          <p className="mt-3 max-w-[24ch] text-sm leading-7 text-muted-foreground xl:text-[13px] xl:leading-6">
                            {card.desc}
                          </p>
                        </Link>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section {...fadeUp(0.06)}>
        <div className="ticker-shell rounded-[24px] border border-border/70 bg-card px-0 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:rounded-full">
          <div className="ticker-track">
            {[...tickerItems, ...tickerItems].map((item, idx) => (
              <div
                key={`${item}-${idx}`}
                className="inline-flex items-center gap-4 px-6 text-[11px] font-bold uppercase tracking-[0.28em] text-foreground/76"
              >
                <Asterisk className="size-3.5 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.div {...fadeUp(0.1)}>
          <LightPanel className="h-full p-4 transition-transform duration-300 hover:-translate-y-1 sm:p-5 md:p-7">
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
                        Main event
                      </span>
                      {featuredTournament?.status ? (
                        <StatusBadge status={featuredTournament.status} />
                      ) : null}
                    </div>
                    <Link to={featuredTournamentLink} className="inline-block">
                      <h2 className="mt-4 max-w-3xl text-[1.9rem] font-semibold uppercase leading-[0.94] tracking-[-0.05em] text-foreground transition-colors hover:text-primary sm:text-[2.3rem] lg:text-[2.8rem]">
                        {featuredTournament?.name || "Tournament spotlight"}
                      </h2>
                    </Link>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-[15px]">
                      {featuredTournament?.description ||
                        "Create tournaments and the dashboard will promote the current headline event automatically."}
                    </p>
                  </div>
                  <Asterisk className="mt-1 hidden size-6 text-primary md:block" />
                </div>
                <Link
                  to={featuredCurrentStageLink}
                  className="block rounded-[22px] border border-border/70 bg-[linear-gradient(135deg,rgba(251,146,60,0.08),rgba(255,255,255,0.98))] p-4 transition-transform hover:-translate-y-0.5 dark:bg-[linear-gradient(135deg,rgba(251,146,60,0.12),rgba(15,23,42,0.9))] sm:px-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                        Current stage
                      </p>
                      <h3 className="mt-1.5 text-xl font-semibold uppercase tracking-[-0.04em] text-foreground sm:text-2xl">
                        {featuredSpotlightStage?.name || "Stage pending"}
                      </h3>
                    </div>
                    {featuredSpotlightStage?.status ? (
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${HOME_STAGE_STATUS_STYLES[featuredSpotlightStage.status] || HOME_STAGE_STATUS_STYLES.upcoming}`}
                      >
                        {featuredSpotlightStage.status}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 rounded-[18px] border border-primary/10 bg-background/75 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      {featuredSpotlightStage?.week ||
                        "Schedule window pending"}
                    </p>
                    <p className="mt-2 text-sm font-black uppercase tracking-[0.01em] text-foreground">
                      {featuredSpotlightStage?.teamCount
                        ? `${featuredSpotlightStage.teamCount} teams in play`
                        : "Field pending"}
                    </p>
                  </div>
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {featuredTournamentFacts.map((fact) => (
                  <div
                    key={fact.label}
                    className="rounded-[18px] border border-border/70 bg-secondary/30 px-4 py-3"
                  >
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {fact.label}
                    </p>
                    <p className="mt-1.5 text-sm font-black uppercase tracking-[0.01em] text-foreground">
                      {fact.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.05)] sm:rounded-[28px] sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Tournament stages
                    </p>
                    <h3 className="mt-2 text-xl font-semibold uppercase leading-tight tracking-[-0.04em] text-foreground">
                      {featuredStages.length > 0
                        ? `${featuredStages.length} stages mapped`
                        : "Stage map pending"}
                    </h3>
                  </div>
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Target className="size-5" />
                  </div>
                </div>

                {featuredStages.length > 0 ? (
                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {featuredStages.map((stage, index) => {
                      const isSpotlight =
                        stage.name === featuredSpotlightStage?.name &&
                        stage.status === featuredSpotlightStage?.status;
                      return (
                        <Link
                          key={stage.key}
                          to={buildTournamentStageLink(
                            featuredTournament?.id,
                            stage.name,
                          )}
                          className={`rounded-[18px] border px-4 py-3.5 transition-colors ${isSpotlight ? "border-primary/25 bg-primary/10 shadow-[0_14px_32px_rgba(251,146,60,0.1)]" : "border-border/70 bg-secondary/20 hover:border-primary/20 hover:bg-secondary/35"}`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex size-9 shrink-0 items-center justify-center rounded-[14px] text-sm font-black ${isSpotlight ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}
                            >
                              {index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-black uppercase leading-tight tracking-[0.01em] text-foreground">
                                {stage.name}
                              </p>
                              {stage.status ? (
                                <span
                                  className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] ${HOME_STAGE_STATUS_STYLES[stage.status] || HOME_STAGE_STATUS_STYLES.upcoming}`}
                                >
                                  {stage.status}
                                </span>
                              ) : null}
                              <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                                <div>
                                  {stage.week || "Schedule window pending"}
                                </div>
                                {stage.teamCount ? (
                                  <div className="mt-1">
                                    {stage.teamCount} teams
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    Add tournament stages and the home page will show the full
                    stage path here.
                  </p>
                )}
              </div>
            </div>
          </LightPanel>
        </motion.div>

        <motion.div {...fadeUp(0.14)}>
          <LightPanel className="h-full p-4 sm:p-5 md:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  {boardEyebrow}
                </p>
                <h2 className="mt-3 text-[1.85rem] font-semibold uppercase leading-none tracking-[-0.06em] text-foreground sm:text-3xl md:text-[3.15rem]">
                  {boardHeadline}
                </h2>
              </div>
              <Link
                to={boardLink}
                className="hidden text-xs font-bold uppercase tracking-[0.18em] text-primary md:inline-flex"
              >
                Open board
              </Link>
            </div>
            <div className="mt-6 space-y-3">
              {homeBoard.length > 0 ? (
                homeBoard.map((team) => (
                  <motion.div
                    key={`${team.rank}-${team.teamName}`}
                    initial={{ opacity: 0, x: 18 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.45 }}
                    transition={{ duration: 0.42, ease: "easeOut" }}
                    whileHover={{ y: -3, transition: { duration: 0.18 } }}
                    className="flex items-center gap-3 rounded-[20px] border border-border/70 bg-background/70 p-3 sm:gap-4 sm:rounded-[24px] sm:px-4 sm:py-4"
                  >
                    <div className="flex size-9 items-center justify-center rounded-2xl bg-secondary text-sm font-black text-foreground sm:h-10 sm:w-10">
                      {team.rank}
                    </div>
                    <div className="min-w-0 flex-1">
                      <TeamIdentity
                        name={team.logoName || team.teamName}
                        className="truncate text-sm font-black uppercase tracking-[0.02em] text-foreground"
                      />
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          {team.status}
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          &bull;
                        </span>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          {team.wwcd} WWCD
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black tracking-[-0.04em] text-primary sm:text-2xl">
                        {team.points || 0}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        points
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="rounded-[24px] border border-border/70 bg-background/70 px-4 py-5">
                  <p className="text-sm font-semibold text-foreground">
                    {featuredTournament?.status === "ongoing"
                      ? "Live tournament detected. Results are still syncing into the home board."
                      : "Current tournament selected. Standings will appear here once results land."}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {featuredTournamentBoard.featuredStage
                      ? `Stage focus: ${featuredTournamentBoard.featuredStage}. Open the tournament board for the full stage view.`
                      : "Open the tournament page to track the active stage and upcoming schedule."}
                  </p>
                </div>
              )}
            </div>
          </LightPanel>
        </motion.div>
      </section>

      <section>
        <motion.div {...fadeUp(0.22)}>
          <div className="grid gap-4 md:grid-cols-2">
            <LightPanel className="p-4 sm:p-5 md:p-7">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Upcoming matches
                </h2>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Up next
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {upcomingMatches.length > 0 ? (
                  upcomingMatches.map((match) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.35 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      whileHover={{ y: -2, transition: { duration: 0.18 } }}
                      className="rounded-[22px] border border-border/70 bg-background/70 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10">
                          <Swords className="size-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black uppercase leading-tight tracking-[0.02em] text-foreground">
                            {match.stage} - Match {match.match_number || "-"}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {match.formattedTime || "TBD"}
                            {match.map ? (
                              <>
                                <span className="px-1 text-muted-foreground/60">
                                  &bull;
                                </span>
                                {match.map}
                              </>
                            ) : null}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="rounded-[22px] border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                    No upcoming matches right now.
                  </p>
                )}
              </div>
            </LightPanel>

            <LightPanel className="p-4 sm:p-5 md:p-7">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Latest news
                </h2>
                <Link
                  to="/news"
                  className="text-xs font-bold uppercase tracking-[0.18em] text-primary"
                >
                  All news
                </Link>
              </div>
              <div className="mt-5 space-y-3">
                {latestNews.length > 0 ? (
                  latestNews.map((article) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.35 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      whileHover={{ y: -2, transition: { duration: 0.18 } }}
                      className="rounded-[22px] border border-border/70 bg-background/70 p-4"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                        {article.category?.replace("_", " ") || "Update"}
                      </p>
                      <p className="mt-2 text-sm font-black uppercase leading-6 tracking-[0.01em] text-foreground">
                        {article.title}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {article.formattedDate || ""}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <p className="rounded-[22px] border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                    No news yet.
                  </p>
                )}
              </div>
            </LightPanel>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
