import React from "react";
import { RANKING_TABS } from "@/components/rankings/utils/rankingHelpers";

export function RankingTabs({ activeTab, setActiveTab }) {
  return (
    <div className="mb-8 flex space-x-2 overflow-x-auto pb-2">
      {RANKING_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Icon className="size-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
