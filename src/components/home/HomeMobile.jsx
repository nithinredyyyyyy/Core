import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Newspaper,
  Play,
  Swords,
  TrendingUp,
  Trophy,
} from "lucide-react";
import TeamIdentity from "@/components/shared/TeamIdentity";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: "easeOut" },
});

export default function HomeMobile({
  featuredTournament,
  featuredSpotlightStage,
  featuredTournamentLink,
  featuredTournamentVisual,
  liveMatches,
  boardLink,
  mobilePulseCards,
  mobileQuickActions,
  mobileBoardLeaders,
  nextMatch,
  fanHubLink,
  featuredNews,
}) {
  const iconMap = { TrendingUp, Swords, Trophy, Newspaper };

  return (
    <div className="mx-auto max-w-[420px] space-y-4 pb-4">
      <motion.section {...fadeUp(0)}>
        <div className="relative overflow-hidden rounded-[2.15rem] border border-white/10 bg-[linear-gradient(180deg,rgba(4,10,26,0.98),rgba(10,18,42,0.97)_58%,rgba(18,55,126,0.9))] p-4 text-white shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(96,165,250,0.2),transparent_24%),radial-gradient(circle_at_80%_16%,rgba(255,255,255,0.08),transparent_12%),linear-gradient(180deg,transparent_40%,rgba(255,255,255,0.06)_100%)]" />
          <div className="relative mx-auto mb-4 h-1.5 w-20 rounded-full bg-white/40" />
          <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur">
            <div
              className="absolute inset-y-0 right-0 w-[52%] bg-cover bg-center opacity-75"
              style={{
                backgroundImage: `linear-gradient(270deg, rgba(4,10,26,0.12), rgba(4,10,26,0.92) 78%), url('${featuredTournamentVisual}')`,
              }}
            />
            <div className="relative flex min-h-[230px] flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-sky-200/90">
                    Matchday Central
                  </p>
                  <h1 className="mt-2 max-w-[10ch] text-[2.05rem] font-semibold leading-[0.88] tracking-[-0.06em] text-white">
                    Own the next drop.
                  </h1>
                </div>
                <div className="rounded-full border border-red-400/20 bg-red-500/16 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-red-100 backdrop-blur">
                  {liveMatches.length > 0
                    ? "Live"
                    : featuredTournament?.status || "Ready"}
                </div>
              </div>
              <div className="relative max-w-[58%]">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/54">
                  Featured Event
                </p>
                <p className="mt-2 text-[1.2rem] font-black leading-tight tracking-[-0.04em] text-white">
                  {featuredTournament?.name || "Tournament spotlight"}
                </p>
                <p className="mt-2 text-xs leading-5 text-white/64">
                  {featuredSpotlightStage?.name || "Stage pending"}
                  {featuredSpotlightStage?.week
                    ? ` • ${featuredSpotlightStage.week}`
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={featuredTournamentLink}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-slate-950 shadow-[0_12px_24px_rgba(255,255,255,0.16)]"
                >
                  Open Event <Play className="size-3.5 fill-current" />
                </Link>
                <Link
                  to={boardLink}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white/92"
                >
                  Board <TrendingUp className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {mobilePulseCards.map((card) => (
              <div
                key={card.label}
                className={`rounded-[1.35rem] border p-3 backdrop-blur ${card.tone}`}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-black leading-none tracking-[-0.05em] text-white">
                  {card.value}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {mobileQuickActions.map((action) => {
              const ActionIcon = iconMap[action.icon] || Trophy;
              return (
                <Link
                  key={action.title}
                  to={action.link}
                  className="flex min-h-[104px] flex-col items-start justify-between rounded-[1.45rem] border border-white/10 bg-white/8 p-3.5 shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur"
                >
                  <div className="flex w-full items-start justify-between gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/14 text-white">
                      <ActionIcon className="size-5" />
                    </div>
                    <ChevronRight className="size-4 text-white/44" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black uppercase tracking-[0.01em] text-white">
                      {action.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-white/58">
                      {action.detail}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
          {mobileBoardLeaders.length > 0 ? (
            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.05))] p-3.5 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/52">
                    Top Board
                  </p>
                  <p className="mt-1 text-sm font-black uppercase tracking-[0.01em] text-white">
                    Season Leaders
                  </p>
                </div>
                <Link
                  to={boardLink}
                  className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-200"
                >
                  View all
                </Link>
              </div>
              <div className="mt-3 grid gap-2.5">
                {mobileBoardLeaders.map((team) => (
                  <div
                    key={`${team.rank}-${team.teamName}`}
                    className="flex items-center gap-3 rounded-[1.2rem] border border-white/8 bg-black/12 p-3"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-[1rem] bg-white/10 text-sm font-black text-white">
                      {team.rank}
                    </div>
                    <div className="min-w-0 flex-1">
                      <TeamIdentity
                        name={team.logoName || team.teamName}
                        className="truncate text-sm font-black uppercase tracking-[0.01em] text-white"
                      />
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/48">
                        {team.wwcd} WWCD
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black leading-none tracking-[-0.04em] text-white">
                        {team.points}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
                        pts
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </motion.section>
      <motion.section {...fadeUp(0.08)}>
        <div className="grid gap-3">
          <div className="rounded-[1.7rem] border border-border/70 bg-card p-4 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                  Next Match
                </p>
                <p className="mt-2 text-lg font-black uppercase leading-tight tracking-[-0.04em] text-foreground">
                  {nextMatch
                    ? `${nextMatch.stage || "Stage"} - Match ${nextMatch.match_number || "-"}`
                    : "Schedule locking in"}
                </p>
              </div>
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Clock3 className="size-5" />
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {nextMatch?.formattedTime ||
                "The next lobby time will appear here."}
              {nextMatch?.map ? ` • ${nextMatch.map}` : ""}
            </p>
          </div>
          <div className="rounded-[1.7rem] border border-border/70 bg-card p-4 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                  Fan Pulse
                </p>
                <p className="mt-2 text-lg font-black uppercase leading-tight tracking-[-0.04em] text-foreground">
                  Predictions, polls, and live chat.
                </p>
              </div>
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Swords className="size-5" />
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Jump into community picks and matchday energy without leaving the
              app flow.
            </p>
            <Link
              to={fanHubLink}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-primary-foreground"
            >
              Open fan hub <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="rounded-[1.7rem] border border-border/70 bg-card p-4 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                  Headline Drop
                </p>
                <p className="mt-2 text-lg font-black uppercase leading-tight tracking-[-0.04em] text-foreground">
                  {featuredNews?.title || "News desk standing by"}
                </p>
              </div>
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CalendarDays className="size-5" />
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {featuredNews?.formattedDate ||
                "Open the news desk for the latest circuit update."}
            </p>
            <Link
              to={featuredNews ? `/news/${featuredNews.id}` : "/news"}
              className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-primary"
            >
              Read story <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
