import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import HomeMobile from "@/components/home/HomeMobile";
import HomeDesktop from "@/components/home/HomeDesktop";
import {
  HOME_STAGE_STATUS_STYLES,
  buildTournamentStageLink,
} from "@/lib/homeContent";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Home() {
  const isMobile = useIsMobile();
  const homeMode = isMobile ? "mobile" : "desktop";
  const { data: homeView, isLoading: loadHome } = useQuery({
    queryKey: ["home-view", homeMode],
    queryFn: () => base44.home.view(homeMode),
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
  const stackedLinks = [
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
      title: "Fans",
      desc: "Predictions, fantasy squads, polls, fan clubs, and the live community floor.",
      icon: "Waves",
      link: "/fans",
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
  const mobileQuickActions = (homeView?.mobileQuickActions || []).map(
    (action) =>
      action.tournamentId
          ? {
              ...action,
              title: action.title,
              icon: action.icon,
              link: `/tournaments?id=${encodeURIComponent(action.tournamentId)}`,
            }
          : {
              ...action,
              title: action.title,
              icon: action.icon,
              link: action.link || "/tournaments",
            },
  );

  if (isMobile) {
    return (
      <HomeMobile
        featuredTournament={featuredTournament}
        featuredSpotlightStage={featuredSpotlightStage}
        featuredTournamentLink={featuredTournamentLink}
        featuredTournamentVisual={
          homeView?.featuredTournamentVisual || "/images/core-logo.png"
        }
        liveMatches={homeView?.liveMatches || []}
        boardLink={boardLink}
        mobilePulseCards={homeView?.mobilePulseCards || []}
        mobileQuickActions={mobileQuickActions}
        mobileBoardLeaders={homeView?.mobileBoardLeaders || []}
        nextMatch={homeView?.nextMatch || null}
      />
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
      featuredTournamentFacts={homeView?.featuredTournamentFacts || []}
      featuredTournamentLink={featuredTournamentLink}
      heroMeta={homeView?.heroMeta || []}
      homeBoard={homeView?.homeBoard || []}
      boardEyebrow={homeView?.boardEyebrow || "Tournament board"}
      boardHeadline={homeView?.boardHeadline || "Tournament board pending."}
      boardLink={boardLink}
      featuredTournamentBoard={featuredTournamentBoard}
      tickerItems={homeView?.tickerItems || []}
      stackedLinks={stackedLinks}
      buildTournamentStageLink={buildTournamentStageLink}
      HOME_STAGE_STATUS_STYLES={HOME_STAGE_STATUS_STYLES}
      lastTournament={homeView?.lastTournament || null}
      upcomingMatches={homeView?.upcomingMatches || []}
    />
  );
}
