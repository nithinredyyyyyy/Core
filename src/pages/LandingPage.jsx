import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Download,
  Megaphone,
  Moon,
  UserCircle2,
  Sparkles,
  Sun,
  Trophy,
  Waves,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { BrandMark } from "@/components/shared/BrandMark";
import StatusBadge from "@/components/shared/StatusBadge";
import TeamIdentity from "@/components/shared/TeamIdentity";
import { useTheme } from "@/lib/ThemeContext";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

function Shell({ eyebrow, title, body, id, children }) {
  return (
    <section id={id} className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="type-kicker text-[#67c9bb]">
          {eyebrow}
        </p>
        <h2 className="type-display-section mt-4 text-[#111111]">
          {title}
        </h2>
        {body ? (
          <p className="type-body mt-4 text-[#636363]">
            {body}
          </p>
        ) : null}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function SoftCard({ className = "", children }) {
  return (
    <div
      className={`rounded-[30px] border border-[#ececec] bg-white shadow-[0_24px_70px_rgba(17,17,17,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}

function MiniPreview({ step, title, body, accent = "mint" }) {
  const accentMap = {
    mint: "bg-[#dcfbf5] text-[#18b7a0]",
    peach: "bg-[#fff0e6] text-[#ff8e58]",
    ink: "bg-[#f3f4f6] text-[#111111]",
  };

  return (
    <div className="rounded-[26px] border border-[#efefef] bg-[#fcfcfc] p-4">
      <div
        className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${accentMap[accent] || accentMap.mint}`}
      >
        {step}
      </div>
      <h3 className="type-title-md mt-5 text-[#111111]">
        {title}
      </h3>
      <p className="type-caption mt-2 text-[#666666]">{body}</p>
    </div>
  );
}

// eslint-disable-next-line
export default function LandingPage() {
  const { theme, toggle } = useTheme();
  const { isInstallable, promptInstall } = useInstallPrompt();
  const { data: homeView } = useQuery({
    queryKey: ["landing-home-view"],
    queryFn: () => base44.home.view("desktop"),
  });

  const featuredTournament = homeView?.featuredTournament || null;
  const featuredStages = homeView?.featuredStages || [];
  const latestNews = homeView?.latestNews || [];
  const boardLeaders = (homeView?.homeBoard || []).slice(0, 3);
  const upcomingMatches = homeView?.upcomingMatches || [];

  const featureCards = [
    {
      icon: Trophy,
      title: "Tournament control",
      body:
        "Stages, boards, participants, prize flow, and schedule windows in one clean operational layer.",
    },
    {
      icon: Megaphone,
      title: "Community energy",
      body:
        "Retention-ready engagement features can live inside the product without turning the public site into a cluttered hub.",
    },
    {
      icon: UserCircle2,
      title: "Profile access",
      body:
        "Account access, saved team preference, and a cleaner local profile flow inside the product.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#111111]">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(103,201,187,0.10),transparent_28%),linear-gradient(180deg,#fbfbfa_0%,#f7f7f5_55%,#f4f4f2_100%)]" />
        <div className="absolute left-[-4rem] top-24 size-56 rounded-full bg-[#d8faf2] blur-3xl" />
        <div className="absolute right-[-4rem] top-40 size-72 rounded-full bg-[#f2f5f3] blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-[#ececec]/90 bg-[rgba(247,247,245,0.88)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[5rem] w-full max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-3 transition-opacity hover:opacity-90"
          >
            <div
              data-core-logo-target="primary"
              className="flex size-10 items-center justify-center rounded-full border border-[#e8e8e8] bg-white p-1.5 shadow-[0_10px_24px_rgba(17,17,17,0.05)]"
            >
              <BrandMark concept="site" className="size-full object-contain" />
            </div>
            <div>
              <p className="type-title-lg text-[#111111]">
                Core
              </p>
              <p className="type-kicker text-[#7a7a7a]">
                StageCore
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {[
              ["Why StageCore", "#why"],
              ["Platform", "#platform"],
              ["Circuit", "#circuit"],
              ["Profile", "#profile"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="type-nav rounded-full px-4 py-2 text-[#444444] transition hover:bg-white hover:text-[#111111]"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggle}
              className="inline-flex size-11 items-center justify-center rounded-full border border-[#e7e7e7] bg-white text-[#111111] shadow-[0_8px_20px_rgba(17,17,17,0.04)]"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <Moon className="size-4" strokeWidth={2.2} />
              ) : (
                <Sun className="size-4" strokeWidth={2.2} />
              )}
            </button>
            <Link
              to="/app"
              className="hidden rounded-full border border-[#e7e7e7] bg-white px-5 py-2.5 text-sm font-semibold text-[#111111] shadow-[0_8px_20px_rgba(17,17,17,0.04)] sm:inline-flex"
            >
              Open desktop app
            </Link>
            {isInstallable ? (
              <button
                type="button"
                onClick={promptInstall}
                className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Get the app <Download className="size-4" />
              </button>
            ) : (
              <Link
                to="/signin"
                className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Sign in to profile <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="pb-20 pt-6 sm:pt-8 lg:pt-10">
        <section className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <SoftCard className="overflow-hidden p-5 sm:p-7 lg:p-8">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="max-w-3xl">
                <div className="type-kicker inline-flex items-center gap-2 rounded-full border border-[#ececec] bg-white px-3 py-1.5 text-[#666666]">
                  <Sparkles className="size-3.5 text-[#67c9bb]" />
                  Premium esports platform
                </div>

                <h1 className="type-display-hero mt-6 text-[#111111]">
                  A smarter esports system for fans,
                  <span className="ml-3 inline-flex rounded-full bg-[#dcfbf5] px-4 py-1 text-[#18b7a0]">
                    organizers
                  </span>
                </h1>

                <p className="type-body mt-5 max-w-2xl text-[#636363]">
                  StageCore helps you follow the live Indian esports season with
                  one cleaner layer for tournaments, standings, fan momentum,
                  team tracking, and editorial updates.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/app"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#111111] px-6 py-3 text-sm font-semibold text-white"
              >
                    Open desktop app <ArrowRight className="size-4" />
                  </Link>
                  {isInstallable ? (
                    <button
                      type="button"
                      onClick={promptInstall}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-[#e7e7e7] bg-white px-6 py-3 text-sm font-semibold text-[#111111]"
                    >
                      Install mobile app <Download className="size-4" />
                    </button>
                  ) : (
                  <Link
                      to="/signin"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-[#e7e7e7] bg-white px-6 py-3 text-sm font-semibold text-[#111111]"
                    >
                      Sign in to profile <Waves className="size-4" />
                    </Link>
                  )}
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <MiniPreview
                    step="Step 1"
                    title="Track every major event"
                    body="Tournament flows, stage windows, and bracket pressure in one place."
                    accent="mint"
                  />
                  <MiniPreview
                    step="Step 2"
                    title="See the live board move"
                    body="Standings, match count, points swings, and team momentum without clutter."
                    accent="peach"
                  />
                  <MiniPreview
                    step="Step 3"
                    title="Open your profile"
                    body="Keep session access, saved team preference, and mobile-first actions ready when speed matters."
                    accent="ink"
                  />
                </div>
              </div>

              <div className="grid gap-4">
                <SoftCard className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7a7a7a]">
                        Featured circuit
                      </p>
                      <h2 className="mt-3 text-[1.8rem] font-semibold leading-[0.96] tracking-[-0.05em] text-[#111111]">
                        {featuredTournament?.name || "Current event loading"}
                      </h2>
                      <p className="mt-3 text-sm leading-7 text-[#636363]">
                        {featuredStages[0]?.name
                          ? `${featuredStages[0].name} is currently in focus across the platform.`
                          : "The current circuit headline will appear here once the event feed syncs."}
                      </p>
                    </div>
                    {featuredTournament?.status ? (
                      <StatusBadge status={featuredTournament.status} />
                    ) : null}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {(homeView?.featuredTournamentFacts || []).slice(0, 3).map((fact) => (
                      <div
                        key={fact.label}
                        className="rounded-[22px] border border-[#ededed] bg-[#fbfbfa] px-4 py-3"
                      >
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[#7a7a7a]">
                          {fact.label}
                        </p>
                        <p className="mt-2 text-sm font-semibold tracking-[-0.02em] text-[#111111]">
                          {fact.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </SoftCard>

                <SoftCard className="p-5 sm:p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7a7a7a]">
                    Platform split
                  </p>
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-[22px] border border-[#ededed] bg-[#fbfbfa] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#67c9bb]">
                        Landing page
                      </p>
                      <p className="mt-2 text-lg font-semibold text-[#111111]">
                        Brand-first and easier to scan
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-[#ededed] bg-[#fbfbfa] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#67c9bb]">
                        Desktop app
                      </p>
                      <p className="mt-2 text-lg font-semibold text-[#111111]">
                        Operational control for deep use
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-[#ededed] bg-[#fbfbfa] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#67c9bb]">
                        Mobile app
                      </p>
                      <p className="mt-2 text-lg font-semibold text-[#111111]">
                        Faster matchday actions and alerts
                      </p>
                    </div>
                  </div>
                </SoftCard>
              </div>
            </div>
          </SoftCard>
        </section>

        <div className="mt-20 space-y-20">
          <Shell
            id="why"
            eyebrow="Why StageCore"
            title="Three product surfaces. One system behind them."
            body="The landing page tells the story, the desktop app handles depth, and the mobile app carries the fast matchday layer."
          >
            <div className="grid gap-4 lg:grid-cols-3">
              {featureCards.map((card) => (
                <SoftCard key={card.title} className="p-5 sm:p-6">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-[#dcfbf5] text-[#18b7a0]">
                    <card.icon className="size-5" />
                  </div>
                  <h3 className="mt-5 text-[1.35rem] font-semibold leading-tight tracking-[-0.04em] text-[#111111]">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#636363]">
                    {card.body}
                  </p>
                </SoftCard>
              ))}
            </div>
          </Shell>

          <Shell
            id="platform"
            eyebrow="Platform preview"
            title="Designed to feel like a product, not one overloaded homepage."
            body="This side previews the desktop and mobile experiences without forcing the landing page to behave like a dashboard."
          >
            <div className="grid gap-4 lg:grid-cols-[1.04fr_0.96fr]">
              <SoftCard className="overflow-hidden bg-[linear-gradient(180deg,#161616_0%,#1c1c1c_100%)] p-5 text-white sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/68">
                      Desktop app
                    </p>
                    <h3 className="mt-3 text-[2rem] font-semibold leading-[0.96] tracking-[-0.05em] text-white">
                      Deep standings, teams, matches, and tournament control.
                    </h3>
                  </div>
                  <Link
                    to="/app"
                    className="hidden rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#111111] sm:inline-flex"
                  >
                    Open app
                  </Link>
                </div>

                <div className="mt-6 space-y-3">
                  {boardLeaders.length > 0 ? (
                    boardLeaders.map((team) => (
                      <div
                        key={`${team.rank}-${team.teamName}`}
                        className="flex items-center gap-4 rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3.5"
                      >
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-white/[0.08] text-sm font-bold text-white">
                          {team.rank}
                        </div>
                        <div className="min-w-0 flex-1">
                          <TeamIdentity
                            name={team.logoName || team.teamName}
                            className="truncate text-sm font-semibold text-white"
                          />
                          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/68">
                            {team.status} • {team.wwcd} WWCD
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-[#67c9bb]">
                            {team.points}
                          </p>
                          <p className="text-[10px] uppercase tracking-[0.14em] text-white/62">
                            points
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.05] p-4 text-sm text-white/76">
                      Tournament board data is syncing into the desktop preview.
                    </div>
                  )}
                </div>
              </SoftCard>

              <div className="grid gap-4">
                <SoftCard className="p-5 sm:p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a7a7a]">
                    Mobile app
                  </p>
                  <div className="mt-4 rounded-[26px] bg-[linear-gradient(180deg,#ebfaf6_0%,#dcfbf5_100%)] p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#18b7a0]">
                      Matchday mobile
                    </p>
                    <p className="mt-3 text-[1.6rem] font-semibold leading-[0.96] tracking-[-0.05em] text-[#111111]">
                      Faster matchday flow for the live season.
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[#5e6664]">
                      Countdown hero, live board strip, fan pulse, and alerts
                      without the density of the desktop experience.
                    </p>
                  </div>
                </SoftCard>

                <SoftCard className="p-5 sm:p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a7a7a]">
                    Landing logic
                  </p>
                  <p className="mt-3 text-[1.35rem] font-semibold leading-tight tracking-[-0.04em] text-[#111111]">
                    Brand first. Product second. Depth where it belongs.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#636363]">
                    This page is now for discovery and trust, not for dropping
                    every operational module above the fold.
                  </p>
                </SoftCard>
              </div>
            </div>
          </Shell>

          <Shell
            id="circuit"
            eyebrow="Circuit pulse"
            title="Still alive with the current season."
            body="The landing page previews the live circuit, but it stays curated and readable instead of becoming a desktop dashboard clone."
          >
            <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
              <SoftCard className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#7a7a7a]">
                      Featured stage
                    </p>
                    <h3 className="mt-3 text-[1.8rem] font-semibold leading-[0.96] tracking-[-0.05em] text-[#111111]">
                      {featuredStages[0]?.name || "Stage preview pending"}
                    </h3>
                  </div>
                  {featuredTournament?.status ? (
                    <StatusBadge status={featuredTournament.status} />
                  ) : null}
                </div>
                <p className="mt-4 text-sm leading-7 text-[#636363]">
                  {featuredStages[0]?.week
                    ? `${featuredStages[0].week} is the active schedule window in the current circuit focus.`
                    : "As soon as the circuit schedule locks, this preview will show the active window."}
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-[#ededed] bg-[#fbfbfa] px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#7a7a7a]">
                      Upcoming matches
                    </p>
                    <p className="mt-2 text-[1.9rem] font-bold tracking-[-0.05em] text-[#111111]">
                      {upcomingMatches.length}
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-[#ededed] bg-[#fbfbfa] px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#7a7a7a]">
                      Live updates
                    </p>
                    <p className="mt-2 text-[1.9rem] font-bold tracking-[-0.05em] text-[#111111]">
                      {latestNews.length}
                    </p>
                  </div>
                </div>
              </SoftCard>

              <SoftCard className="p-5 sm:p-6">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#7a7a7a]">
                  Stage map
                </p>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {featuredStages.length > 0 ? (
                    featuredStages.slice(0, 6).map((stage) => (
                      <div
                        key={stage.key}
                        className="rounded-[22px] border border-[#ededed] bg-[#fbfbfa] px-4 py-3.5"
                      >
                        <p className="text-sm font-semibold text-[#111111]">
                          {stage.name}
                        </p>
                        {stage.status ? (
                          <div className="mt-2">
                            <StatusBadge status={stage.status} />
                          </div>
                        ) : null}
                        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#7a7a7a]">
                          {stage.week || "Window pending"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[22px] border border-[#ededed] bg-[#fbfbfa] p-4 text-sm text-[#636363]">
                      Stage cards will appear here once the tournament data syncs.
                    </div>
                  )}
                </div>
              </SoftCard>
            </div>
          </Shell>

          <Shell
            id="profile"
            eyebrow="Profile flow"
            title="Account access without a cluttered dashboard shell."
            body="The landing page now points users into a simpler profile path while the operational product stays focused on tournaments, teams, and standings."
          >
            <div className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
              <SoftCard className="overflow-hidden bg-[linear-gradient(180deg,#161616_0%,#1d1d1d_100%)] p-5 text-white sm:p-6">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/72">Profile access</p>
                <h3 className="mt-3 text-[2rem] font-semibold leading-[0.96] tracking-[-0.05em] text-white">
                  Sign in once, then keep the season in reach from your personal deck.
                </h3>
                <p className="mt-4 text-sm leading-7 text-white/86">
                  Profile access, saved team preference, and local session controls now sit in one cleaner route instead of being scattered across extra public pages.
                </p>
                <div className="mt-6">
                  <Link
                    to="/signin"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#111111]"
                  >
                    Open sign in <ArrowRight className="size-4" />
                  </Link>
                </div>
              </SoftCard>

              <div className="grid gap-4">
                {[
                  {
                    label: "Profile deck",
                    title: "Saved team preference and local session control.",
                  },
                  {
                    label: "Desktop route",
                    title: "Jump straight into tournaments, teams, and standings.",
                  },
                  {
                    label: "Mobile route",
                    title: "Install the faster matchday layer when you need it.",
                  },
                ].map((item) => (
                  <SoftCard key={item.label} className="p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#67c9bb]">
                      {item.label}
                    </p>
                    <p className="mt-3 text-[1.1rem] font-semibold leading-[1.08] tracking-[-0.03em] text-[#111111]">
                      {item.title}
                    </p>
                  </SoftCard>
                ))}
              </div>
            </div>
          </Shell>

          <section className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <SoftCard className="p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#67c9bb]">
                    Final call
                  </p>
                  <h2 className="mt-4 text-[2.1rem] font-semibold leading-[0.94] tracking-[-0.06em] text-[#111111] sm:text-[3rem]">
                    Enter StageCore with the right surface for the job.
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-[#636363] sm:text-[15px]">
                    Use the landing page to discover the brand, the desktop app
                    for deep control, and the mobile layer for fast matchday use.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/app"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#111111] px-6 py-3 text-sm font-semibold text-white"
                  >
                    Open desktop app <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    to="/signin"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#e7e7e7] bg-white px-6 py-3 text-sm font-semibold text-[#111111]"
                  >
                    Sign in to profile <Waves className="size-4" />
                  </Link>
                </div>
              </div>
            </SoftCard>
          </section>
        </div>
      </main>
    </div>
  );
}
