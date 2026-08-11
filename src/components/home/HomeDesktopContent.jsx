import React from "react";
import { Link } from "react-router-dom";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  ArrowRight,
  Asterisk,
  Calendar,
  CheckCircle2,
  Radio,
  Swords,
  Target,
  TrendingUp,
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
      className={`rounded-[28px] border border-brand-sky-soft bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,253,0.94))] shadow-[0_22px_64px_rgba(15,23,42,0.06)] transition-colors dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(11,23,41,0.96),rgba(7,17,31,0.94))] dark:shadow-[0_26px_70px_rgba(2,8,23,0.34)] ${className}`}
    >
      {children}
    </div>
  );
}

function HeroHighlights({ featuredTournament, featuredSpotlightStage }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-[20px] border border-brand-sky-soft bg-white/80 p-4 dark:border-white/8 dark:bg-brand-navy-night">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Title</p>
        <p className="mt-2 text-sm font-semibold tracking-[0.01em] text-foreground">
          {featuredTournament?.game || "BGMI"}
        </p>
      </div>
      <div className="rounded-[20px] border border-brand-sky-soft bg-white/80 p-4 dark:border-white/8 dark:bg-brand-navy-night">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Current stage</p>
        <p className="mt-2 text-sm font-semibold tracking-[0.01em] text-foreground">
          {featuredSpotlightStage?.name || "Pending"}
        </p>
      </div>
      <div className="rounded-[20px] border border-brand-sky-soft bg-white/80 p-4 dark:border-white/8 dark:bg-brand-navy-night">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Circuit status</p>
        <p className="mt-2 text-sm font-semibold tracking-[0.01em] text-foreground">
          {featuredTournament?.status === "ongoing" ? "Live" : "Upcoming"}
        </p>
      </div>
    </div>
  );
}

function LatestTournamentHud({
  championTeam,
  lastTournament,
}) {
  const latestTournamentLogo = lastTournament?.banner_url || "/images/core-logo.svg";
  const championName = championTeam?.teamName || championTeam?.rawTeamName || null;

  return (
    <Link
      to={lastTournament ? `/tournaments?id=${lastTournament.id}` : "/tournaments"}
      className="group relative z-10 block overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(145deg,rgba(5,14,28,0.97),rgba(10,24,44,0.95)_45%,rgba(22,12,4,0.92)_100%)] text-white shadow-[0_28px_72px_rgba(2,8,23,0.44)] transition-all hover:-translate-y-1 hover:shadow-[0_36px_88px_rgba(2,8,23,0.52)]"
    >
      {/* Accent bar */}
      <div className="absolute inset-x-0 top-0 h-[2.5px] bg-[linear-gradient(90deg,var(--brand-coral-deep)_0%,var(--brand-orange)_22%,var(--brand-sky-clear)_60%,var(--brand-white)_100%)]" />

      {/* Glow blobs */}
      <div className="pointer-events-none absolute -right-8 -top-12 size-52 rounded-full bg-sky-400/14 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 left-8 size-48 rounded-full bg-orange-500/16 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 size-36 rounded-full bg-amber-400/8 blur-3xl" />

      {/* Header: tournament logo + name */}
      <div className="relative flex items-start gap-4 p-5 pb-3">
        <LogoBlock
          src={latestTournamentLogo}
          alt={`${lastTournament?.name || "Latest tournament"} logo`}
          sizeClass="size-[72px]"
          roundedClass="rounded-[18px]"
          paddingClass="p-2.5"
          surfaceTone="light"
          imgClassName="h-full w-full object-contain"
          className="shrink-0 border-white/10 bg-brand-navy-darkest shadow-[0_12px_28px_rgba(0,0,0,0.34)]"
        />

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-brand-mint-lime" />
            </span>
            <p className="text-[9.5px] font-black uppercase tracking-[0.3em] text-emerald-200/70">
              Latest tournament
            </p>
          </div>
          <h2 className="mt-1.5 line-clamp-2 text-[1.28rem] font-black leading-[1.02] tracking-[-0.04em] text-white transition-colors group-hover:text-orange-100">
            {lastTournament?.name || "Latest completed tournament"}
          </h2>
        </div>
      </div>

      {/* Champion showcase */}
      {championName ? (
        <div className="relative mx-4 mb-3 overflow-hidden rounded-[18px] border border-amber-400/18 bg-[linear-gradient(135deg,rgba(255,170,50,0.12),rgba(255,106,26,0.08)_60%,rgba(10,24,44,0.8)_100%)] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-[14px] border border-amber-400/20 bg-amber-400/10">
              <svg className="size-4.5 text-amber-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.26em] text-amber-300/70">Tournament champion</p>
              <TeamIdentity
                name={championName}
                className="mt-0.5 truncate text-[0.92rem] font-black tracking-[-0.02em] text-white"
                compact
                plain
                logoClassName="size-5 shrink-0 object-contain"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="relative mx-4 mb-3 rounded-[18px] border border-white/8 bg-white/[0.04] px-4 py-3">
          <p className="text-sm font-semibold text-white/50">Champion details updating</p>
        </div>
      )}

      {/* Stats grid */}
      <div className="relative mx-4 mb-4 grid grid-cols-3 gap-2">
        {[
          ["Champion", championTeam?.teamName || "—"],
          ["Points", championTeam?.totalPoints ?? "—"],
          ["WWCD", championTeam?.wins ?? "—"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="min-w-0 rounded-[14px] border border-white/8 bg-white/[0.06] px-2.5 py-2.5"
          >
            <p className="text-[8.5px] font-bold uppercase tracking-[0.2em] text-white/38">{label}</p>
            <p className="mt-1 truncate text-sm font-black leading-none text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="relative flex items-center justify-between border-t border-white/8 px-5 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Full results</p>
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/80 transition-colors group-hover:text-cyan-200">
          View details
          <ArrowRight className="size-3.5" />
        </div>
      </div>
    </Link>
  );
}

function TournamentVisualPanel({ featuredTournament, featuredTournamentVisual }) {
  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(135deg,rgba(7,17,31,0.96),rgba(13,30,50,0.94)_48%,rgba(255,106,26,0.18)_100%)] p-7 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] dark:border-white/10">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,var(--brand-coral-deep),var(--brand-sky-clear),var(--brand-white))]" />
      <div className="absolute -right-24 -top-28 size-80 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="absolute -bottom-32 left-0 size-80 rounded-full bg-orange-400/22 blur-3xl" />
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-[linear-gradient(0deg,rgba(2,8,23,0.86),transparent)]" />
      <div className="absolute inset-x-8 bottom-20 h-px bg-white/10" />
      <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between gap-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-200/80">
            Featured event
          </p>
          <p className="mt-2 max-w-[18rem] text-xl font-black leading-[0.96] tracking-[-0.04em] text-white">
            {featuredTournament?.name || "Battlegrounds Mobile India Pro Series 2026"}
          </p>
        </div>
        <div className="hidden rounded-full border border-white/12 bg-white/8 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/70 xl:block">
          Live circuit
        </div>
      </div>
      <div className="relative flex min-h-[250px] items-center justify-center pb-16">
        <div className="absolute size-56 rounded-full bg-white/8 blur-2xl" />
        <img
                  src={featuredTournamentVisual || "/images/bmps-2026.webp"}
          alt={featuredTournament?.name || "Featured tournament"}
          className="relative size-64 object-contain drop-shadow-[0_28px_44px_rgba(0,0,0,0.52)]"
          loading="lazy"
        />
      </div>
    </div>
  );
}

function HomeDesktopHero(props) {
  const {
    boardLink,
    championTeam,
    featuredSpotlightStage,
    featuredTournament,
    featuredTournamentVisual,
    heroMeta,
    lastTournament,
  } = props;

  return (
    <m.section {...fadeUp(0)} className="w-full pt-16 pb-32">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center text-center">
        {/* Centered Typography Hook */}
        <div className="type-kicker flex flex-wrap items-center justify-center gap-3 text-muted-foreground mb-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 shadow-sm text-foreground">
            <Radio className="size-4 text-primary" />
            Mobile esports
          </span>
          <span className="inline-flex items-center gap-2 text-primary font-bold">
            <Asterisk className="size-4" />
            Tournament hub
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[5.5rem] font-black leading-[1.05] tracking-tighter text-foreground">
          Follow the active <br className="hidden md:block" /> mobile esports season.
        </h1>
        
        <p className="mt-8 max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed">
          Track the headline tournament, current stage, upcoming matches, standings pressure, and the latest tournament stories from one clean desktop view.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/tournaments"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-foreground px-8 py-4 text-sm font-bold tracking-[0.1em] text-background transition-transform hover:-translate-y-1 shadow-lg"
          >
            Explore events <ArrowRight className="size-4" />
          </Link>
          <Link
            to={boardLink}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-border bg-card px-8 py-4 text-sm font-bold tracking-[0.1em] text-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary shadow-sm"
          >
            Open board <TrendingUp className="size-4" />
          </Link>
        </div>

        {/* Fanned Overlapping Cards */}
        <div className="relative mt-16 md:mt-24 flex w-full max-w-4xl h-[300px] md:h-[400px] items-center justify-center perspective-[1000px]">
          {/* Extreme Outer Left Card */}
          <Link to="/tournaments" className="absolute block left-1/2 -ml-[220px] md:-ml-[400px] top-20 w-[200px] md:w-[300px] transform -translate-x-[5%] md:-translate-x-[10%] -rotate-12 md:-rotate-[24deg] rounded-[24px] md:rounded-[32px] border border-border bg-card p-4 md:p-6 shadow-xl transition-all duration-500 hover:-translate-y-4 hover:-rotate-[20deg] hover:z-30 dark:bg-card">
            <div className="flex flex-col items-center justify-center text-center gap-3">
              <div className="flex size-10 md:size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Radio className="size-5 md:size-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-2">Season 2026</p>
                <p className="text-sm md:text-lg font-black text-foreground mt-1">Esports Hub</p>
              </div>
            </div>
          </Link>

          {/* Extreme Outer Right Card */}
          <Link to="/tournaments" className="absolute block right-1/2 -mr-[220px] md:-mr-[400px] top-20 w-[200px] md:w-[300px] transform translate-x-[5%] md:translate-x-[10%] rotate-12 md:rotate-[24deg] rounded-[24px] md:rounded-[32px] border border-border bg-card p-4 md:p-6 shadow-xl transition-all duration-500 hover:-translate-y-4 hover:rotate-[20deg] hover:z-30 dark:bg-card">
            <div className="flex flex-col items-center justify-center text-center gap-3">
              <div className="flex size-10 md:size-12 items-center justify-center rounded-2xl bg-secondary text-foreground">
                <CheckCircle2 className="size-5 md:size-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-2">Integrity</p>
                <p className="text-sm md:text-lg font-black text-foreground mt-1">Official Board</p>
              </div>
            </div>
          </Link>

          {/* Back Card (Left) - Latest Tournament */}
          <Link to={lastTournament ? `/tournaments?id=${lastTournament.id}` : "/tournaments"} className="absolute block left-1/2 -ml-[140px] md:-ml-[250px] top-10 w-[240px] md:w-[350px] transform -translate-x-[10%] md:-translate-x-[20%] -rotate-6 md:-rotate-12 rounded-[24px] md:rounded-[32px] border border-border bg-card p-4 md:p-6 shadow-xl transition-all duration-500 hover:-translate-y-4 hover:-rotate-3 hover:z-40 dark:bg-card">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Target className="size-6" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Latest Event</p>
                <p className="text-base font-bold text-foreground leading-tight line-clamp-1">{lastTournament?.name || "Tournament"}</p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl bg-secondary/50 p-4 text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Champion</p>
              <p className="text-xl font-black text-foreground mt-1 truncate">{championTeam?.teamName || "TBA"}</p>
            </div>
          </Link>

          {/* Back Card (Right) - Stats */}
          <Link to={boardLink} className="absolute block right-1/2 -mr-[140px] md:-mr-[250px] top-10 w-[240px] md:w-[350px] transform translate-x-[10%] md:translate-x-[20%] rotate-6 md:rotate-12 rounded-[24px] md:rounded-[32px] border border-border bg-brand-lime text-black p-4 md:p-6 shadow-xl transition-all duration-500 hover:-translate-y-4 hover:rotate-3 hover:z-40">
             <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-black/10">
                <TrendingUp className="size-6 text-black" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/60">Live Stats</p>
                <p className="text-base font-bold text-black leading-tight line-clamp-1">{featuredSpotlightStage?.name || "Pending"}</p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl bg-black/5 p-4 text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/60">Teams</p>
              <p className="text-xl font-black text-black mt-1">{featuredSpotlightStage?.teamCount || "16"} Active</p>
            </div>
          </Link>

          {/* Front Card (Center) - Featured Tournament */}
          <Link to={featuredTournament ? `/tournaments?id=${featuredTournament.id}` : "/tournaments"} className="absolute block z-20 w-[280px] md:w-[400px] transform -translate-y-4 rounded-[28px] md:rounded-[36px] border border-white/20 bg-gradient-to-br from-primary to-[#c43e00] text-white p-6 md:p-8 shadow-2xl transition-all duration-500 hover:-translate-y-8 hover:z-50">
            <div className="flex items-center justify-between mb-8">
               <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">Featured Event</p>
               <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md">
                 Live Circuit
               </span>
            </div>
            <div className="flex justify-center mb-8">
               <img
          src={featuredTournamentVisual || "/images/bmps-2026.webp"}
                  alt="Featured tournament visual"
                  className="h-32 object-contain drop-shadow-2xl"
                  loading="lazy"
               />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-black leading-tight tracking-tight text-white text-center">
                {featuredTournament?.name || "Battlegrounds Mobile India Pro Series"}
              </h2>
            </div>
          </Link>
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
                      {featuredSpotlightStage?.name || "Opening stage"}
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
                    {featuredSpotlightStage?.week || "Schedule to be announced"}
                  </p>
                  <p className="mt-2 text-sm font-black tracking-[0.01em] text-foreground">
                    {featuredSpotlightStage?.teamCount ? `${featuredSpotlightStage.teamCount} teams in play` : "Field locking"}
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
                          <div>{stage.week || "Schedule to be announced"}</div>
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
            {homeBoard.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-border/80 bg-background/70 p-5 text-sm leading-6 text-muted-foreground dark:border-white/10 dark:bg-white/[0.04]">
                Standings will appear here once official match results are published.
              </div>
            ) : null}
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
                  <p className="mt-2 text-xs text-muted-foreground">{match.formattedTime || "Schedule TBA"}</p>
                </div>
              </div>
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[22px] border border-border/70 bg-background/70 p-8 text-center dark:border-white/10 dark:bg-white/[0.045]">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary/30">
                <Calendar className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground dark:text-slate-300">
                No upcoming matches right now.
              </p>
            </div>
          )}
        </div>
      </LightPanel>

      <div className="grid gap-4">
        <LightPanel className="p-4 sm:p-5 md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Quick jump</p>
              <p className="mt-2 text-[1.3rem] font-semibold tracking-[-0.05em] text-foreground">Go straight to the active tournament.</p>
            </div>
            <Target className="mt-1 size-5 text-primary" />
          </div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Open the current tournament board without digging through the full navigation.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to={featuredTournamentLink} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-primary-foreground">
              Open tournament <ArrowRight className="size-3.5" />
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
