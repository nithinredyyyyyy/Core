import React, { Suspense, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { base44 } from "@/api/base44Client";
import PageLoader from "@/components/shared/PageLoader";
import QueryError from "@/components/shared/QueryError";
import { filterRankings, LazyPerformanceChart } from "@/components/rankings/utils/rankingHelpers";
import { RankingHeader } from "@/components/rankings/sections/RankingHeader";
import { RankingTabs } from "@/components/rankings/sections/RankingTabs";
import { TopThreeShowcase } from "@/components/rankings/sections/TopThreeShowcase";
import { MobileRankingList } from "@/components/rankings/sections/MobileRankingList";
import { RankingTable } from "@/components/rankings/sections/RankingTable";
import { RankingInsights } from "@/components/rankings/sections/RankingInsights";
import { RankingRules } from "@/components/rankings/sections/RankingRules";
import { RankingStats } from "@/components/rankings/sections/RankingStats";
import { RecentUpdates } from "@/components/rankings/sections/RecentUpdates";

export default function Rankings() {
  const [activeTab, setActiveTab] = useState("teams");
  const [searchQuery, setSearchQuery] = useState("");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["rankings-page"],
    queryFn: () => base44.pages.rankings(),
    staleTime: 60_000,
  });

  const tabData = useMemo(() => {
    if (!data) return [];
    if (activeTab === "teams") {
      return filterRankings(data.teams, searchQuery, ["teamName"]);
    }
    if (activeTab === "players") {
      return filterRankings(data.players, searchQuery, ["playerName", "teamName"]);
    }
    return filterRankings(data.organizations, searchQuery, ["clubName"]);
  }, [activeTab, data, searchQuery]);

  const chartTeamNames = useMemo(
    () => (data?.teams || []).slice(0, 3).map((entry) => entry.teamName),
    [data],
  );

  if (isLoading && !data) {
    return <PageLoader label="Loading rankings" />;
  }

  if (isError || !data) {
    return (
      <QueryError
        title="Rankings unavailable"
        message="We couldn't load the latest rankings board."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-background pb-20">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <RankingHeader
            activeTab={activeTab}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            updatedAt={data.updatedAt}
          />
          <RankingTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          <m.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TopThreeShowcase data={tabData} type={activeTab} />
            <MobileRankingList data={tabData} type={activeTab} />
            <RankingTable data={tabData} type={activeTab} />
          </m.div>

          <RankingInsights insights={data.insights} />

          <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="flex flex-col justify-end lg:col-span-2">
              <Suspense fallback={null}>
                <LazyPerformanceChart chartData={data.chartData} teamNames={chartTeamNames} />
              </Suspense>
              <RankingRules />
            </div>
            <div className="flex flex-col justify-start gap-6">
              <RankingStats stats={data.stats} />
              <RecentUpdates updates={data.recentUpdates} />
            </div>
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}
