import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import HomeDesktop from "@/components/home/HomeDesktop";
import {
  HOME_STAGE_STATUS_STYLES,
  buildTournamentStageLink,
} from "@/lib/homeContent";

const STACKED_LINKS = [
  {
    title: "Tournaments",
    desc: "Every major event, stage path, and prize chase in one bracket view.",
    icon: "Trophy",
    link: "/tournaments",
    desktopPose: "xl:right-[19.5rem] xl:bottom-0 xl:-rotate-[14deg]",
  },
  {
    title: "Teams",
    desc: "Roster moves, title history, and organization profiles in one place.",
    icon: "Users",
    link: "/teams",
    desktopPose: "xl:right-[13rem] xl:bottom-2 xl:-rotate-[9deg]",
  },
  {
    title: "Rankings",
    desc: "Global power rankings, regional leaderboards, and team statistics.",
    icon: "TrendingUp",
    link: "/rankings",
    desktopPose: "xl:right-[6.5rem] xl:bottom-4 xl:-rotate-[2deg]",
  },
  {
    title: "News",
    desc: "Transfers, announcements, patch notes, and AI-assisted editorial coverage.",
    icon: "Newspaper",
    link: "/news",
    desktopPose: "xl:right-0 xl:bottom-6 xl:rotate-[6deg]",
  },
];

export default function Home() {
  const { data: homeView, isLoading: loadHome } = useQuery({
    queryKey: ["home-view", "desktop"],
    queryFn: () => base44.home.view("desktop"),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const featuredTournament = homeView?.featuredTournament || null;
  const featuredSpotlightStage = homeView?.featuredSpotlightStage || null;
  const featuredTournamentBoard = homeView?.featuredTournamentBoard || {
    standings: [],
    featuredStage: null,
  };
  const boardLink = homeView?.boardTournamentId
    ? `/tournaments?id=${encodeURIComponent(homeView.boardTournamentId)}`
    : "/tournaments";
  const featuredTournamentLink = buildTournamentStageLink(
    featuredTournament?.id,
  );
  const featuredCurrentStageLink = buildTournamentStageLink(
    featuredTournament?.id,
    homeView?.featuredSpotlightStage?.name || null,
  );

  if (loadHome && !homeView) {
    return (
      <div className="mx-auto flex min-h-[62vh] w-full max-w-6xl items-center justify-center">
        <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
            Loading season hub
          </p>
          <div className="mt-5 space-y-3">
            <div className="h-8 w-3/4 rounded-full bg-secondary" />
            <div className="h-4 w-full rounded-full bg-secondary/70" />
            <div className="h-4 w-2/3 rounded-full bg-secondary/70" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-24 rounded-lg border border-border bg-secondary/30" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <HomeDesktop
      championLogo={homeView?.championLogo || null}
      championLogoSurfaceTone={homeView?.championLogoSurfaceTone || "light"}
      championTeam={homeView?.championTeam || null}
      featuredCurrentStageLink={featuredCurrentStageLink}
      featuredNews={homeView?.featuredNews || null}
      featuredSpotlightStage={featuredSpotlightStage}
      featuredStages={homeView?.featuredStages || []}
      featuredTournament={featuredTournament}
      featuredTournamentVisual={
        homeView?.featuredTournamentVisual || "/images/bmps-2026.webp"
      }
      featuredTournamentFacts={homeView?.featuredTournamentFacts || []}
      featuredTournamentLink={featuredTournamentLink}
      heroMeta={homeView?.heroMeta || []}
      homeBoard={homeView?.homeBoard || []}
      boardEyebrow={homeView?.boardEyebrow || "Tournament board"}
      boardHeadline={homeView?.boardHeadline || "Tournament board pending."}
      boardLink={boardLink}
      featuredTournamentBoard={featuredTournamentBoard}
      tickerItems={homeView?.tickerItems || []}
      stackedLinks={STACKED_LINKS}
      buildTournamentStageLink={buildTournamentStageLink}
      HOME_STAGE_STATUS_STYLES={HOME_STAGE_STATUS_STYLES}
      lastTournament={homeView?.lastTournament || null}
      upcomingMatches={homeView?.upcomingMatches || []}
    />
  );
}
