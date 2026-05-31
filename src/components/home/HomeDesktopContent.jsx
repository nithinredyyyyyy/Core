import React from "react";
import { Link } from "react-router-dom";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  ArrowRight,
  Asterisk,
  CheckCircle2,
  Radio,
  Swords,
  Target,
  TrendingUp,
  UserCircle2,
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import TeamIdentity from "@/components/shared/TeamIdentity";
import LogoBlock from "@/components/shared/LogoBlock";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: "easeOut" },
});

function LightPanel({ className = "", children }) {
  return (
    <div
      className={`rounded-[28px] border border-[#dfe6ee] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,253,0.94))] shadow-[0_22px_64px_rgba(15,23,42,0.06)] transition-colors dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(11,23,41,0.96),rgba(7,17,31,0.94))] dark:shadow-[0_26px_70px_rgba(2,8,23,0.34)] ${className}`}
    >
      {children}
    </div>
  );
}

function HeroHighlights({ featuredTournament, featuredSpotlightStage }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-[20px] border border-[#dfe6ee] bg-white/80 p-4 dark:border-white/8 dark:bg-[#101a2a]">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Title</p>
        <p className="mt-2 text-sm font-semibold tracking-[0.01em] text-foreground">
          {featuredTournament?.game || "BGMI"}
        </p>
      </div>
      <div className="rounded-[20px] border border-[#dfe6ee] bg-white/80 p-4 dark:border-white/8 dark:bg-[#101a2a]">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Current stage</p>
        <p className="mt-2 text-sm font-semibold tracking-[0.01em] text-foreground">
          {featuredSpotlightStage?.name || "Pending"}
        </p>
      </div>
      <div className="rounded-[20px] border border-[#dfe6ee] bg-white/80 p-4 dark:border-white/8 dark:bg-[#101a2a]">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Circuit status</p>
        <p className="mt-2 text-sm font-semibold tracking-[0.01em] text-foreground">
          {featuredTournament?.status === "ongoing" ? "Live" : "Upcoming"}
        </p>
      </div>
    </div>
  );
}

function HomeDesktopHero(props) {
  const {
    boardLink,
    championLogo,
    championLogoSurfaceTone,
    championTeam,
    featuredSpotlightStage,
    featuredTournament,
    heroMeta,
    lastTournament,
  } = props;

  return (
    <m.section {...fadeUp(0)}>
      <div className="relative overflow-hidden rounded-[28px] border border-[#dfe6ee] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(247,250,253,0.98)_58%,rgba(237,244,251,0.96)_100%)] shadow-[0_28px_70px_rgba(15,23,42,0.08)] transition-colors dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(11,23,41,0.96),rgba(8,18,32,0.98)_58%,rgba(5,13,24,0.96)_100%)] dark:shadow-[0_30px_80px_rgba(2,8,23,0.34)] md:rounded-[36px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,184,122,0.32),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(144,198,255,0.22),transparent_20%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.16),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(56,189,248,0.14),transparent_20%)]" />
        <div className="relative grid gap-5 px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-start lg:px-10 lg:py-10">
          <div className="space-y-6">
            <div className="type-kicker flex flex-wrap items-center gap-3 text-[#5d6775] dark:text-slate-400">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#dfe6ee] bg-white px-3 py-1 shadow-sm dark:border-white/8 dark:bg-[#111b2c] dark:text-slate-200">
                <Radio className="size-3.5 text-primary" />
                BGMI season
              </span>
              <span className="inline-flex items-center gap-2 text-primary">
                <Asterisk className="size-3.5" />
                Tournament hub
              </span>
            </div>

            <div className="space-y-4">
              <p className="type-kicker max-w-28 tracking-[0.34em] text-[#728093] dark:text-slate-500">
                Home
              </p>
              <h1 className="type-display-hero max-w-5xl text-[#11131a] dark:text-white">
                Follow the active BGMI season in one place.
              </h1>
              <p className="type-body max-w-2xl text-[#5c6673] dark:text-slate-300">
                Track the headline tournament, current stage, upcoming matches,
                standings pressure, and the latest BGMI stories from one clean
                desktop view.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/tournaments"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary p-3 text-sm font-black uppercase tracking-[0.14em] text-primary-foreground transition-transform hover:-translate-y-0.5 sm:w-auto sm:px-6"
              >
                Explore events <ArrowRight className="size-4" />
              </Link>
              <Link
                to={boardLink}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#dfe6ee] bg-white p-3 text-sm font-bold uppercase tracking-[0.14em] text-[#11131a] transition-colors hover:bg-[#f8fbff] dark:border-white/8 dark:bg-[#111b2c] dark:text-slate-100 dark:hover:bg-[#16263c] sm:w-auto sm:px-6"
              >
                Open tournament board <TrendingUp className="size-4" />
              </Link>
            </div>

            {heroMeta.length > 0 ? (
              <div className="type-kicker flex flex-wrap items-center gap-3 text-[#4e5865] dark:text-slate-300">
                {heroMeta.map((item, index) => (
                  <React.Fragment key={item}>
                    {index > 0 ? (
                      <span className="text-[#b2bdcb] dark:text-slate-600">&bull;</span>
                    ) : null}
                    <span>{item}</span>
                  </React.Fragment>
                ))}
              </div>
            ) : null}

            <HeroHighlights
              featuredTournament={featuredTournament}
              featuredSpotlightStage={featuredSpotlightStage}
            />
          </div>

          <div className="relative self-start rounded-[30px] border border-[#dfe6ee] bg-[linear-gradient(135deg,rgba(15,23,42,0.84),rgba(10,19,34,0.94)_54%,rgba(7,17,31,0.98)_100%)] p-5 text-white shadow-[0_26px_70px_rgba(2,8,23,0.34)]">
            <div className="relative flex flex-col gap-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="max-w-[26rem]">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/50">
                    Latest BGMI champion
                  </p>
                  <Link
                    to={lastTournament ? `/tournaments?id=${lastTournament.id}` : "/tournaments"}
                    className="mt-3 block max-w-[14ch] text-[1.45rem] font-black leading-[0.96] tracking-[-0.05em] transition-opacity hover:opacity-80 md:text-[1.7rem]"
                  >
                    {lastTournament?.name || "Latest completed tournament"}
                  </Link>
                  <p className="mt-3 max-w-[32ch] text-sm leading-6 text-white/68">
                    {championTeam?.teamName
                      ? `${championTeam.teamName} won the latest completed BGMI tournament.`
                      : "The latest completed BGMI tournament summary will appear here."}
                  </p>
                </div>
                {championTeam?.teamName && championLogo ? (
                  <div className="shrink-0 self-start md:ml-4">
                    <LogoBlock
                      src={championLogo}
                      alt={`${championTeam.teamName} logo`}
                      sizeClass="size-28 md:size-32"
                      roundedClass="rounded-[1.6rem]"
                      paddingClass="p-4"
                      surfaceTone={championLogoSurfaceTone}
                      className="border-slate-200 bg-white"
                    />
                  </div>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">Champion</p>
                  <p className="mt-2 text-sm font-bold text-white">{championTeam?.teamName || "TBD"}</p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">Total points</p>
                  <p className="mt-2 text-sm font-bold text-white">{championTeam?.totalPoints || 0}</p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">WWCD</p>
                  <p className="mt-2 text-sm font-bold text-white">{championTeam?.wins || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </m.section>
  );
}

function HomeDesktopBoardSection({
  HOME_STAGE_STATUS_STYLES,
  boardEyebrow,
  boardHeadline,
  boardLink,
  buildTournamentStageLink,
  featuredCurrentStageLink,
  featuredSpotlightStage,
  featuredStages,
  featuredTournament,
  featuredTournamentBoard,
  featuredTournamentFacts,
  featuredTournamentLink,
  homeBoard,
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <m.div {...fadeUp(0.1)}>
        <LightPanel className="h-full p-4 sm:p-5 md:p-7">
          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
                    Main event
                  </span>
                  {featuredTournament?.status ? <StatusBadge status={featuredTournament.status} /> : null}
                </div>
                <Link to={featuredTournamentLink} className="inline-block">
                  <h2 className="mt-4 max-w-3xl text-[1.9rem] font-semibold leading-[0.94] tracking-[-0.05em] text-foreground transition-colors hover:text-primary sm:text-[2.3rem] lg:text-[2.8rem]">
                    {featuredTournament?.name || "Tournament spotlight"}
                  </h2>
                </Link>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-[15px]">
                  {featuredTournament?.description || "The current headline BGMI tournament will appear here with its active stage, schedule window, and field details."}
                </p>
              </div>
              <Link
                to={featuredCurrentStageLink}
                className="block rounded-[22px] border border-border/70 bg-[linear-gradient(135deg,rgba(251,146,60,0.08),rgba(255,255,255,0.98))] p-4 transition-transform hover:-translate-y-0.5 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(251,146,60,0.12),rgba(15,23,42,0.9))] sm:px-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Current stage</p>
                    <h3 className="mt-1.5 text-xl font-semibold tracking-[-0.04em] text-foreground sm:text-2xl">
                      {featuredSpotlightStage?.name || "Stage pending"}
                    </h3>
                  </div>
                  {featuredSpotlightStage?.status ? (
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${HOME_STAGE_STATUS_STYLES[featuredSpotlightStage.status] || HOME_STAGE_STATUS_STYLES.upcoming}`}>
                      {featuredSpotlightStage.status}
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 rounded-[18px] border border-primary/10 bg-background/75 p-4 dark:border-primary/15 dark:bg-white/[0.04]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {featuredSpotlightStage?.week || "Schedule window pending"}
                  </p>
                  <p className="mt-2 text-sm font-black tracking-[0.01em] text-foreground">
                    {featuredSpotlightStage?.teamCount ? `${featuredSpotlightStage.teamCount} teams in play` : "Field pending"}
                  </p>
                </div>
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {featuredTournamentFacts.map((fact) => (
                <div key={fact.label} className="rounded-[18px] border border-border/70 bg-secondary/30 p-4 dark:border-white/10 dark:bg-white/[0.045]">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{fact.label}</p>
                  <p className="mt-1.5 text-sm font-black tracking-[0.01em] text-foreground">{fact.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 dark:border-white/10 dark:bg-white/[0.04] sm:rounded-[28px] sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Tournament stages</p>
                  <h3 className="mt-2 text-xl font-semibold leading-tight tracking-[-0.04em] text-foreground">
                    {featuredStages.length > 0 ? `${featuredStages.length} stages mapped` : "Stage map pending"}
                  </h3>
                </div>
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Target className="size-5" />
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {featuredStages.map((stage, index) => (
                  <Link
                    key={stage.key}
                    to={buildTournamentStageLink(featuredTournament?.id, stage.name)}
                    className="rounded-[18px] border border-border/70 bg-secondary/20 px-4 py-3.5 transition-colors hover:border-primary/20 hover:bg-secondary/35 dark:border-white/10 dark:bg-white/[0.035] dark:hover:border-primary/25 dark:hover:bg-white/[0.06]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-sm font-black text-primary">
                        {stage.status === "completed" ? (
                          <CheckCircle2 className="size-4.5" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black leading-tight tracking-[0.01em] text-foreground">{stage.name}</p>
                        <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                          <div>{stage.week || "Schedule window pending"}</div>
                          {stage.teamCount ? <div className="mt-1">{stage.teamCount} teams</div> : null}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </LightPanel>
      </m.div>

      <m.div {...fadeUp(0.14)}>
        <LightPanel className="h-full p-4 sm:p-5 md:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{boardEyebrow}</p>
              <h2 className="mt-3 text-[1.85rem] font-semibold leading-none tracking-[-0.06em] text-foreground sm:text-3xl md:text-[3.15rem]">
                {boardHeadline}
              </h2>
            </div>
            <Link to={boardLink} className="hidden text-xs font-bold uppercase tracking-[0.18em] text-primary md:inline-flex">
              Open board
            </Link>
          </div>
          <div className="mt-6 space-y-3">
            {homeBoard.map((team) => (
              <div key={`${team.rank}-${team.teamName}`} className="flex items-center gap-3 rounded-[20px] border border-border/70 bg-background/70 p-3 dark:border-white/10 dark:bg-white/[0.045]">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-secondary text-sm font-black text-foreground dark:bg-white/[0.08] dark:text-white">
                  {team.rank}
                </div>
                <div className="min-w-0 flex-1">
                  <TeamIdentity name={team.logoName || team.teamName} className="truncate text-sm font-black tracking-[0.02em] text-foreground" />
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{team.status}</p>
                    <span className="text-[10px] text-muted-foreground">&bull;</span>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{team.wwcd} WWCD</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black tracking-[-0.04em] text-primary">{team.points || 0}</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">points</p>
                </div>
              </div>
            ))}
            {featuredTournamentBoard.featuredStage ? (
              <div className="mt-5 rounded-[24px] border border-primary/12 bg-[linear-gradient(135deg,rgba(251,146,60,0.08),rgba(255,255,255,0.98))] p-4 dark:border-primary/15 dark:bg-[linear-gradient(135deg,rgba(251,146,60,0.12),rgba(15,23,42,0.88))]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Stage focus</p>
                    <p className="mt-2 text-base font-semibold tracking-[-0.03em] text-foreground">
                      {featuredTournamentBoard.featuredStage}
                    </p>
                  </div>
                  <TrendingUp className="size-4 text-primary" />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  The board is currently centered on this stage, so rankings and momentum snapshots below follow the live tournament path.
                </p>
              </div>
            ) : null}
          </div>
        </LightPanel>
      </m.div>
    </section>
  );
}

function HomeDesktopLowerSection({ featuredTournamentLink, upcomingMatches }) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <LightPanel className="p-4 sm:p-5 md:p-7">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Upcoming matches</h2>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Up next</span>
        </div>
        <div className="mt-5 space-y-3">
          {upcomingMatches.length > 0 ? upcomingMatches.map((match) => (
            <div key={match.id} className="rounded-[22px] border border-border/70 bg-background/70 p-4 dark:border-white/10 dark:bg-white/[0.045]">
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10">
                  <Swords className="size-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black uppercase leading-tight tracking-[0.02em] text-foreground">{match.stage}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{match.formattedTime || "TBD"}</p>
                </div>
              </div>
            </div>
          )) : (
            <p className="rounded-[22px] border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-300">
              No upcoming matches right now.
            </p>
          )}
        </div>
      </LightPanel>

      <div className="grid gap-4">
        <LightPanel className="p-4 sm:p-5 md:p-7">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Fan profile</h2>
              <p className="mt-2 text-[1.5rem] font-semibold tracking-[-0.05em] text-foreground">Save your team and return faster.</p>
            </div>
            <Link to="/profile" className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Profile
            </Link>
          </div>
          <div className="mt-5">
            <div className="rounded-[22px] border border-border/70 bg-background/70 p-4 dark:border-white/10 dark:bg-white/[0.05]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Account
              </p>
              <p className="mt-3 text-lg font-semibold leading-tight tracking-[-0.03em] text-foreground">
                Keep your favorite team, followed players, and profile access ready for the next matchday.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Open your profile when you want your personal BGMI shortcuts in one place.
              </p>
            </div>
          </div>
        </LightPanel>

        <LightPanel className="p-4 sm:p-5 md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Quick jump</p>
              <p className="mt-2 text-[1.3rem] font-semibold tracking-[-0.05em] text-foreground">Go straight to the active tournament.</p>
            </div>
            <Target className="mt-1 size-5 text-primary" />
          </div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Open the current BGMI event board or jump back into your profile without digging through the full navigation.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to={featuredTournamentLink} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-primary-foreground">
              Open tournament <ArrowRight className="size-3.5" />
            </Link>
            <Link to="/profile" className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-foreground dark:border-white/10 dark:bg-white/[0.045] dark:text-white">
              Open profile <UserCircle2 className="size-3.5" />
            </Link>
          </div>
        </LightPanel>
      </div>
    </section>
  );
}

export default function HomeDesktopContent(props) {
  const { tickerItems } = props;

  return (
    <LazyMotion features={domAnimation}>
      <div className="mx-auto max-w-[1380px] space-y-6 pb-4 md:space-y-8 md:pb-6">
        <HomeDesktopHero {...props} />

        <m.section {...fadeUp(0.06)}>
          <div className="ticker-shell rounded-[24px] border border-border/70 bg-card px-0 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/[0.05] dark:shadow-[0_22px_48px_rgba(2,8,23,0.24)] sm:rounded-full">
            <div className="ticker-track">
              {[...tickerItems, ...tickerItems].map((item, idx) => (
                <div key={`${item}-${idx}`} className="inline-flex items-center gap-4 px-6 text-[11px] font-bold uppercase tracking-[0.28em] text-foreground/82">
                  <Asterisk className="size-3.5 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </m.section>

        <HomeDesktopBoardSection {...props} />
        <HomeDesktopLowerSection {...props} />
      </div>
    </LazyMotion>
  );
}
