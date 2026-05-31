import React from "react";
import { Link } from "react-router-dom";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  ArrowRight,
  Newspaper,
  Swords,
  Trophy,
  TrendingUp,
  UserCircle2,
  Waves,
} from "lucide-react";
import TeamIdentity from "@/components/shared/TeamIdentity";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: "easeOut" },
});

const chipIcons = {
  Trophy,
  Swords,
  TrendingUp,
  Newspaper,
  Shield: UserCircle2,
  Waves,
};

function getTimeRemaining(targetTime) {
  if (!targetTime) return null;
  const target = new Date(targetTime).getTime();
  if (Number.isNaN(target)) return null;

  const delta = target - Date.now();
  if (delta <= 0) {
    return { days: "00", hours: "00", minutes: "00", isLive: true };
  }

  const totalMinutes = Math.floor(delta / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    isLive: false,
  };
}

function PulseCard({ label, value, detail, accent = "orange" }) {
  const glowClass =
    accent === "rose"
      ? "from-[#ff8f82]/24 to-transparent"
      : "from-[#ffbe79]/24 to-transparent";

  return (
    <div className="relative overflow-hidden rounded-[1.45rem] bg-[linear-gradient(180deg,rgba(28,10,20,0.98),rgba(17,8,14,0.98))] p-4 text-white shadow-[0_16px_28px_rgba(44,13,22,0.18)]">
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${glowClass}`}
      />
      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/46">
          {label}
        </p>
        <p className="mt-4 text-[2rem] font-semibold leading-none text-white">
          {value}
        </p>
        <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-white/60">
          {detail}
        </p>
      </div>
    </div>
  );
}

function ActionChip({ icon: Icon, label, href, active = false }) {
  return (
    <Link
      to={href}
      className={`flex items-center gap-2.5 rounded-full px-3.5 py-2.5 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 ${
        active
          ? "bg-[rgba(27,10,21,0.92)] text-white shadow-[0_12px_24px_rgba(44,13,22,0.18)]"
          : "bg-white/40 text-[#4b1822]"
      }`}
    >
      <span
        className={`flex size-7 items-center justify-center rounded-full ${
          active ? "bg-[#ff7a6b] text-white" : "bg-white/70 text-[#4b1822]"
        }`}
      >
        <Icon className="size-3.5" />
      </span>
      {label}
    </Link>
  );
}

function CompactModule({ title, detail, href, icon: Icon }) {
  return (
    <Link
      to={href}
      className="rounded-[1.4rem] bg-[linear-gradient(180deg,rgba(28,10,20,0.98),rgba(17,8,14,0.98))] p-4 text-white shadow-[0_16px_28px_rgba(44,13,22,0.18)]"
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-white/8">
        <Icon className="size-4" />
      </div>
      <p className="mt-4 text-[15px] font-semibold text-white">{title}</p>
      <p className="mt-2 text-[11px] leading-5 text-white/58">{detail}</p>
    </Link>
  );
}

export default function HomeMobile({
  featuredTournament,
  featuredSpotlightStage,
  featuredTournamentLink,
  featuredTournamentVisual,
  boardLink,
  mobilePulseCards,
  mobileQuickActions,
  mobileBoardLeaders,
  nextMatch,
  liveMatches,
}) {
  const heroMatch = liveMatches[0] || nextMatch || null;
  const countdownTarget = nextMatch?.scheduled_time || heroMatch?.scheduled_time || null;
  const headline = featuredTournament?.name || "Featured tournament";
  const stageName = featuredSpotlightStage?.name || "Stage pending";
  const metrics = mobilePulseCards.slice(0, 2);
  const deskMetric = mobilePulseCards[2] || null;
  const categories = mobileQuickActions.slice(0, 4);
  const leaders = mobileBoardLeaders.slice(0, 3);
  const heroImage = featuredTournamentVisual || "/images/core-logo.png";
  const [countdown, setCountdown] = React.useState(() =>
    getTimeRemaining(countdownTarget),
  );

  React.useEffect(() => {
    setCountdown(getTimeRemaining(countdownTarget));

    if (!countdownTarget) return undefined;

    const intervalId = window.setInterval(() => {
      setCountdown(getTimeRemaining(countdownTarget));
    }, 1000 * 30);

    return () => window.clearInterval(intervalId);
  }, [countdownTarget]);

  return (
    <LazyMotion features={domAnimation}>
      <div className="mx-auto max-w-[420px] space-y-4 pb-5 text-[#2d1419]">
        <m.section {...fadeUp(0)}>
          <div className="relative overflow-hidden rounded-[2.2rem] bg-[linear-gradient(180deg,#af1430_0%,#db3b54_52%,#ec6970_100%)] px-5 pb-5 pt-5 text-white shadow-[0_24px_54px_rgba(121,30,48,0.24)]">
            <div
              className="pointer-events-none absolute inset-0 bg-center bg-cover opacity-28 mix-blend-screen"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(43, 7, 18, 0.12), rgba(43, 7, 18, 0.46)), url('${heroImage}')`,
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(38,8,18,0.12),rgba(38,8,18,0.28)_36%,rgba(38,8,18,0.64)_72%,rgba(38,8,18,0.86)_100%)]" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-[68%] bg-[linear-gradient(90deg,rgba(38,8,18,0.78),rgba(38,8,18,0.38),transparent)]" />

            <div className="relative flex items-start justify-between gap-3">
              <div className="rounded-full bg-white/16 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/86 backdrop-blur">
                Top Event
              </div>
              <div className="rounded-full bg-white/16 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/86 backdrop-blur">
                {stageName}
              </div>
            </div>

            <div className="relative mt-6 flex items-end justify-between gap-4">
              <div>
                <div className="flex items-end gap-2 text-white/96">
                  <div>
                    <p className="text-[4rem] font-semibold leading-[0.84] tracking-[-0.05em] [text-shadow:0_8px_26px_rgba(18,4,9,0.55)]">
                      {countdown?.days || "00"}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/62">
                      Days
                    </p>
                  </div>
                  <div className="pb-3 text-[2rem] font-semibold leading-none text-white/72">
                    :
                  </div>
                  <div>
                    <p className="text-[2.35rem] font-semibold leading-none tracking-[-0.04em] [text-shadow:0_8px_26px_rgba(18,4,9,0.55)]">
                      {countdown?.hours || "00"}
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/62">
                      Hrs
                    </p>
                  </div>
                  <div className="pb-2.5 text-[1.55rem] font-semibold leading-none text-white/72">
                    :
                  </div>
                  <div>
                    <p className="text-[2.35rem] font-semibold leading-none tracking-[-0.04em] [text-shadow:0_8px_26px_rgba(18,4,9,0.55)]">
                      {countdown?.minutes || "00"}
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/62">
                      Min
                    </p>
                  </div>
                </div>
                <h1 className="mt-1 max-w-[8ch] text-[1.8rem] font-medium leading-[0.92] tracking-[-0.04em] text-white [text-shadow:0_8px_28px_rgba(18,4,9,0.6)]">
                  {countdown?.isLive ? "Match live now" : "Next match starts in"}
                </h1>
                <p className="mt-3 max-w-[18ch] text-[12px] leading-5 text-white/84 [text-shadow:0_6px_20px_rgba(18,4,9,0.48)]">
                  {heroMatch?.formattedTime || "Schedule updates coming in shortly."}
                </p>
              </div>
              <Link
                to={featuredTournamentLink}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#3d1620] shadow-[0_12px_24px_rgba(50,11,20,0.18)]"
              >
                Explore
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </m.section>

        <m.section {...fadeUp(0.08)}>
          <div className="rounded-[2rem] bg-[linear-gradient(180deg,#ffb39f_0%,#ff9b89_100%)] p-5 shadow-[0_22px_42px_rgba(121,30,48,0.16)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6b3741]">
                  Event
                </p>
                <p className="mt-1 text-base font-semibold text-[#2d1419]">
                  {headline}
                </p>
              </div>
              <div className="rounded-full bg-[rgba(27,10,21,0.92)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                {heroMatch?.status || "Round ready"}
              </div>
            </div>

            <h2 className="mt-4 max-w-[8ch] text-[2.35rem] font-medium leading-[0.94] text-[#2d1419]">
              Catch Game Day
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <PulseCard
                label={metrics[0]?.label || "Live Matches"}
                value={metrics[0]?.value || "0"}
                detail={headline}
              />
              <PulseCard
                label={metrics[1]?.label || "Upcoming"}
                value={metrics[1]?.value || "0"}
                detail={heroMatch?.formattedTime || "Schedule updates on deck"}
                accent="rose"
              />
            </div>

            <div className="mt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#6b3741]">
                Quick routes
              </p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {categories.map((item, index) => {
                  const Icon = chipIcons[item.icon] || Trophy;
                  return (
                    <ActionChip
                      key={item.title}
                      icon={Icon}
                      label={item.title === "Fan hub" ? "Fans" : item.title}
                      href={item.link || "/tournaments"}
                      active={index === 1}
                    />
                  );
                })}
              </div>
            </div>

            {deskMetric ? (
              <div className="mt-5 rounded-[1.35rem] bg-[rgba(27,10,21,0.92)] p-4 text-white shadow-[0_16px_30px_rgba(44,13,22,0.14)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/42">
                      Live pulse
                    </p>
                    <p className="mt-2 text-[1.05rem] font-semibold leading-tight text-white">
                      {deskMetric.value} live updates on radar
                    </p>
                  </div>
                  <TrendingUp className="mt-0.5 size-4 text-white/58" />
                </div>
                <p className="mt-3 text-[11px] leading-5 text-white/58">
                  {"Fan chatter, editorial hits, and stage pressure stay live on this mobile deck."}
                </p>
              </div>
            ) : null}
          </div>
        </m.section>

        <m.section {...fadeUp(0.16)}>
          <div className="rounded-[1.8rem] bg-[linear-gradient(180deg,rgba(28,10,20,0.98),rgba(17,8,14,0.98))] p-4 text-white shadow-[0_18px_30px_rgba(44,13,22,0.18)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/44">
                  Live board
                </p>
                <p className="mt-1 text-base font-semibold text-white">
                  Match control
                </p>
              </div>
              <Link
                to={boardLink}
                className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white"
              >
                View
              </Link>
            </div>

            <div className="mt-4 rounded-[1.35rem] bg-white/[0.04] p-3.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">
                  {heroMatch?.stage || "Match focus"}
                </p>
                <p className="text-[11px] text-white/54">
                  {heroMatch?.formattedTime || "Live updates soon"}
                </p>
              </div>

              <div className="mt-4 space-y-2.5">
                {leaders.length > 0 ? (
                  leaders.map((team) => (
                    <div
                      key={`${team.rank}-${team.teamName}`}
                      className="flex items-center justify-between gap-3 rounded-[1rem] bg-white/[0.04] px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
                          Rank {team.rank}
                        </p>
                        <TeamIdentity
                          name={team.logoName || team.teamName}
                          className="mt-1 truncate text-sm font-semibold text-white"
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-white">
                          {team.points}
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">
                          pts
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1rem] bg-white/[0.04] p-3 text-sm text-white/58">
                    Board leaders will appear after standings sync.
                  </div>
                )}
              </div>
            </div>
          </div>
        </m.section>

        <m.section {...fadeUp(0.22)}>
          <div className="grid grid-cols-2 gap-3">
            <CompactModule
              title="Fans"
              detail="Jump into predictions, fantasy squads, fan clubs, and the live floor."
              href="/fans"
              icon={Waves}
            />
            <CompactModule
              title="News"
              detail="Track transfers, announcements, patch notes, and the editorial desk."
              href="/news"
              icon={Newspaper}
            />
          </div>
        </m.section>
      </div>
    </LazyMotion>
  );
}
