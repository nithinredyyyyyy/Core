import React from "react";
import { Link } from "react-router-dom";
import { useHomeData } from "@/hooks/useHomeData";
import { usePageMeta } from "@/hooks/usePageMeta";
import QueryError from "@/components/shared/QueryError";
import PageSkeleton from "@/components/shared/PageSkeleton";
import HomeHero from "@/components/home/sections/HomeHero";
import NextMatch from "@/components/home/sections/NextMatch";
import StandingsPreview from "@/components/home/sections/StandingsPreview";
import RecentResults from "@/components/home/sections/RecentResults";
import LatestNews from "@/components/home/sections/LatestNews";
import UpcomingEvents from "@/components/home/sections/UpcomingEvents";

/**
 * Home. A thin composition of section components, ordered by esports
 * information hierarchy: live/next match, standings, results, news, events.
 * All data flows from `useHomeData`; nothing is fabricated here.
 */
export default function Home() {
  const {
    isLoading,
    isError,
    liveMatch,
    nextMatch,
    upcomingMatches,
    recentMatches,
    standings,
    latestNews,
    upcomingTournaments,
    refetch,
  } = useHomeData();

  usePageMeta({
    title: null,
    description:
      "Live BGMI match coverage, tournament standings, results, and esports news — all in one place.",
    path: "/",
  });

  if (isError) {
    return <QueryError onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <HomeHero isLoading />
        <PageSkeleton rows={3} showHeader />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <h1 className="sr-only">CORE — BGMI Esports Hub</h1>
      <HomeHero liveMatch={liveMatch} nextMatch={nextMatch} />

      {liveMatch ? <NextMatch matches={upcomingMatches} /> : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-10">
          <RecentResults matches={recentMatches} />
          <LatestNews articles={latestNews} />
          <UpcomingEvents tournaments={upcomingTournaments} />
        </div>
        <div className="space-y-10">
          <StandingsPreview standings={standings} />
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Follow the circuit
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Track every tournament, roster, and result across the BGMI season.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { label: "Tournaments", to: "/tournaments" },
                { label: "Teams", to: "/teams" },
                { label: "Players", to: "/players" },
                { label: "Rankings", to: "/rankings" },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-xs font-bold uppercase tracking-[0.12em] text-foreground transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
