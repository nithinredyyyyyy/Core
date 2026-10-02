import QueryError from "@/components/shared/QueryError";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/lib/ThemeContext";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { LandingHeader } from "@/components/landing/sections/LandingHeader";
import { LandingHero } from "@/components/landing/sections/LandingHero";
import { WhyCoreSection } from "@/components/landing/sections/WhyCoreSection";
import { PlatformPreviewSection } from "@/components/landing/sections/PlatformPreviewSection";
import { CircuitPulseSection } from "@/components/landing/sections/CircuitPulseSection";
import { SigninSection } from "@/components/landing/sections/SigninSection";
import { LandingFinalCta } from "@/components/landing/sections/LandingFinalCta";

export default function LandingPage() {
  const { theme, toggle } = useTheme();
  const { isInstallable, promptInstall } = useInstallPrompt();
  const { data: homeView, isError, refetch } = useQuery({
    queryKey: ["landing-home-view"],
    queryFn: () => base44.home.view("desktop"),
  });

  const featuredTournament = homeView?.featuredTournament || null;
  const featuredStages = homeView?.featuredStages || [];
  const latestNews = homeView?.latestNews || [];
  const boardLeaders = (homeView?.homeBoard || []).slice(0, 3);
  const upcomingMatches = homeView?.upcomingMatches || [];
  const featuredFacts = homeView?.featuredTournamentFacts || [];

  return (
    <div className="landing-page min-h-screen bg-background text-foreground">
      <a href="#landing-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-card focus:p-4">Skip to content</a>
      <LandingHeader theme={theme} toggle={toggle} isInstallable={isInstallable} promptInstall={promptInstall} />

      <main id="landing-content" className="pb-20">
        <LandingHero featuredTournament={featuredTournament} featuredStages={featuredStages} featuredFacts={featuredFacts} isInstallable={isInstallable} promptInstall={promptInstall} />

        {isError && <QueryError title="Circuit preview unavailable" onRetry={refetch} />}

        <div className="mt-20 space-y-20">
          <WhyCoreSection />

          <PlatformPreviewSection boardLeaders={boardLeaders} />

          <CircuitPulseSection featuredTournament={featuredTournament} featuredStages={featuredStages} upcomingMatches={upcomingMatches} latestNews={latestNews} />

          <SigninSection />

          <LandingFinalCta />
        </div>
      </main>
    </div>
  );
}
