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
  const { data: homeView } = useQuery({
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
    <div className="min-h-screen bg-brand-cream-canvas text-brand-ink-pure">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(103,201,187,0.10),transparent_28%),linear-gradient(180deg,var(--brand-cream-paper)_0%,var(--brand-cream-canvas)_55%,var(--brand-cream-mist)_100%)]" />
        <div className="absolute left-[-4rem] top-24 size-56 rounded-full bg-brand-mint-fog blur-3xl" />
        <div className="absolute right-[-4rem] top-40 size-72 rounded-full bg-brand-cream-haze-2 blur-3xl" />
      </div>

      <LandingHeader theme={theme} toggle={toggle} isInstallable={isInstallable} promptInstall={promptInstall} />

      <main className="pb-20 pt-6 sm:pt-8 lg:pt-10">
        <LandingHero featuredTournament={featuredTournament} featuredStages={featuredStages} featuredFacts={featuredFacts} isInstallable={isInstallable} promptInstall={promptInstall} />

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
