import React from "react";
import { Search } from "lucide-react";
import { formatDateTime } from "@/lib/formatting";
import { HEADER_COPY } from "@/components/rankings/utils/rankingHelpers";

export function RankingHeader({ activeTab, searchQuery, onSearchChange, updatedAt }) {
  const copy = HEADER_COPY[activeTab] ?? HEADER_COPY.teams;

  return (
    <div className="mb-10 mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-foreground md:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{copy.description}</p>
        {updatedAt ? (
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Last updated <time dateTime={updatedAt}>{formatDateTime(updatedAt)}</time>
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search rankings..."
            className="h-10 w-full rounded-full border border-border bg-background/50 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary sm:w-64"
          />
        </div>
      </div>
    </div>
  );
}
