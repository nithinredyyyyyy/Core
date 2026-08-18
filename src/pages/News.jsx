import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Search,
  Tag,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getNewsCategoryLabel } from "@/lib/newsCategories";
import { decodeNewsText, getEditorialNewsSummary } from "@/lib/newsEditorial";

const FILTERS = ["all", "tournament", "announcement", "patch_update", "roster_change", "general"];

function NewsHeader() {
  return (
    <div className="space-y-2">
      <div>
        <p className="type-kicker text-primary">
          Editorial desk
        </p>
        <h1 className="type-title-xl mt-2 uppercase">
          News Coverage
        </h1>
        <p className="type-body-sm mt-1 text-muted-foreground">
          Transfers, roster updates, announcements, and AI-assisted editorial stories.
        </p>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Date pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date pending";
  return date.toLocaleDateString("en-IN", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function NewsCard({ article, tournaments }) {
  const summary = getEditorialNewsSummary(article, tournaments);
  const tags = Array.isArray(article.tags) ? article.tags.slice(0, 3) : [];

  return (
    <Link
      to={`/news/${article.id}`}
      className="group rounded-[24px] border border-brand-border bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-brand-border-lift-2 dark:border-white/10 dark:bg-card dark:shadow-[0_16px_34px_rgba(0,0,0,0.24)]"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brand-gold-shell px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-coral-rose">
          {getNewsCategoryLabel(article.category)}
        </span>
        <span className="rounded-full border border-brand-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-taupe">
          {article.game || "BGMI"}
        </span>
        {article.ai_summary ? (
          <span className="rounded-full bg-brand-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
            AI summary
          </span>
        ) : null}
      </div>

      <h3 className="mt-4 text-[1.45rem] font-semibold leading-[1.02] tracking-[-0.04em] text-brand-ink transition group-hover:text-primary dark:text-foreground">
        {decodeNewsText(article.title)}
      </h3>
      <p className="mt-3 line-clamp-4 text-sm leading-7 text-brand-slate dark:text-muted-foreground">
        {summary}
      </p>

      {tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-brand-border bg-brand-cream px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-taupe"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-brand-cream-beige pt-4">
        <div className="text-[12px] text-brand-taupe">
          <span>{formatDate(article.created_date)}</span>
        </div>
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-ink">
          Open coverage <ArrowRight className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}

function LeadStoryPanel({
  leadStory,
  onSelectTag,
  selectedTag,
  tournaments,
}) {
  if (!leadStory) {
    return (
      <div className="rounded-[28px] border border-dashed border-brand-border bg-white/70 p-8 text-center text-brand-slate dark:border-white/10 dark:bg-card">
        <p className="type-kicker text-brand-taupe">Lead story</p>
        <p className="mt-4 text-base font-semibold">No stories match your filter.</p>
        <p className="mt-1 text-sm text-brand-slate/70">Clear the tag or search filter to see current coverage.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-brand-border bg-card shadow-[0_18px_42px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-card">
      <div className="p-6 lg:p-7">
        <div className="flex flex-wrap items-center gap-3">
          <p className="type-kicker text-primary">Lead story</p>
          <span className="rounded-full bg-brand-gold-shell px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-coral-rose">
            {getNewsCategoryLabel(leadStory.category)}
          </span>
          {leadStory.ai_summary ? (
            <span className="rounded-full bg-brand-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
              AI summary
            </span>
          ) : null}
        </div>

        <h2 className="type-display-section mt-4 uppercase text-foreground leading-[1.05]">
          {decodeNewsText(leadStory.title)}
        </h2>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-between rounded-[24px] border border-brand-border bg-white p-5 dark:border-white/10 dark:bg-card">
            <p className="text-sm leading-7 text-brand-slate dark:text-muted-foreground line-clamp-6">
              {leadStory.ai_summary
                ? decodeNewsText(leadStory.ai_summary)
                : getEditorialNewsSummary(leadStory, tournaments)}
            </p>
            {Array.isArray(leadStory.tags) && leadStory.tags.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {leadStory.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onSelectTag(tag)}
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] transition ${
                      selectedTag === tag
                        ? "border-brand-ink bg-brand-ink text-white"
                        : "border-brand-border bg-brand-cream text-brand-taupe hover:border-brand-border-lift"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col justify-between gap-5 rounded-[24px] border border-brand-border bg-secondary/20 p-5 dark:border-white/10 dark:bg-secondary/10">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-primary">
                  Coverage snapshot
                </p>
                <div className="mt-3 space-y-2.5 text-sm text-brand-slate">
                  {[
                    ["Published", formatDate(leadStory.created_date)],
                    ["Game", leadStory.game || "BGMI"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-3 rounded-[18px] bg-background px-4 py-3 border border-border"
                    >
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className="font-semibold text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Link
              to={`/news/${leadStory.id}`}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground transition hover:opacity-90"
            >
              Open story <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransferWatchPanel({ transfers }) {
  const visibleTransfers = transfers.slice(0, 6);

  return (
    <div className="flex flex-col rounded-[28px] border border-brand-border bg-card p-6 shadow-[0_18px_42px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-card">
      <div className="mb-6">
        <p className="type-kicker text-primary">Transfer watch</p>
        <h2 className="type-display-section mt-2 uppercase text-foreground leading-[1.05]">
          Roster moves
        </h2>
        <p className="type-body-sm mt-1 text-muted-foreground">
          Transfers, roster adjustments, and lineup announcements.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto max-h-[380px] pr-1">
        {visibleTransfers.map((entry) => {
          const players = Array.isArray(entry.players)
            ? entry.players.filter(Boolean)
            : [];
          const oldTeam = String(entry.oldTeam || "").trim();
          const newTeam = String(entry.newTeam || "").trim();
          const hasOldTeam = Boolean(oldTeam);
          const hasNewTeam = Boolean(newTeam);

          return (
            <div key={entry.id} className="rounded-[22px] border border-brand-border bg-white p-4 dark:border-white/10 dark:bg-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                    {entry.window || "Transfer"}
                  </p>
                  {hasOldTeam && hasNewTeam ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-base font-semibold text-brand-ink dark:text-foreground">
                      <span className="truncate">{oldTeam}</span>
                      <span className="text-brand-coral-clay">→</span>
                      <span className="truncate">{newTeam}</span>
                    </div>
                  ) : (
                    <p className="mt-2 text-base font-semibold text-brand-ink dark:text-foreground">
                      {hasNewTeam
                        ? `${newTeam} roster update`
                        : hasOldTeam
                          ? `${oldTeam} roster update`
                          : "Roster update"}
                    </p>
                  )}
                  {players.length > 0 ? (
                    <p className="mt-2 text-[12px] leading-6 text-brand-slate dark:text-muted-foreground">
                      {players.join(", ")}
                    </p>
                  ) : (
                    <span className="mt-3 inline-flex rounded-full border border-brand-border bg-brand-cream-almond px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-taupe dark:border-white/15 dark:bg-card">
                      Roster watch
                    </span>
                  )}
                </div>
                <span className="shrink-0 text-[11px] text-brand-taupe dark:text-muted-foreground">{formatDate(entry.date)}</span>
              </div>
            </div>
          );
        })}
        {visibleTransfers.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-brand-border bg-white/70 p-5 text-sm text-brand-slate dark:border-white/15 dark:bg-card">
            Transfer watch will update when roster moves are published.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CoverageFeedPanel({
  followupStories,
  onSearch,
  onToggleTag,
  onSetActiveFilter,
  activeFilter,
  search,
  selectedTag,
  tagOptions,
  tournaments,
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
            Coverage feed
          </p>
          <h2 className="mt-2 text-2xl font-semibold uppercase tracking-[-0.04em] text-foreground">
            News Archive
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Scan tournament announcements, patch updates, and daily stories.
          </p>
        </div>

        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search news coverage"
            aria-label="Search news coverage"
            className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => onSetActiveFilter(filter)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
                activeFilter === filter
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {getNewsCategoryLabel(filter)}
            </button>
          ))}
        </div>

        {tagOptions.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tagOptions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onToggleTag(tag)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs transition ${
                  selectedTag === tag
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-muted"
                }`}
              >
                <Tag className="size-3" />
                {tag}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {followupStories.map((article) => (
          <NewsCard
            key={article.id}
            article={article}
            tournaments={tournaments}
          />
        ))}
      </div>
      
      {followupStories.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-border bg-secondary/10 p-8 text-center text-sm text-muted-foreground">
          No stories match the current filters. Try another category or clear the tag search.
        </div>
      ) : null}
    </div>
  );
}

export default function News() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  const { data: articles = [] } = useQuery({
    queryKey: ["news-published"],
    queryFn: () => base44.news.listPublished("-created_date", 120),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const { data: tournaments = [] } = useQuery({
    queryKey: ["news-tournaments"],
    queryFn: () => base44.entities.Tournament.list("-created_date", 60),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const { data: transfers = [] } = useQuery({
    queryKey: ["news-transfers"],
    queryFn: () => base44.entities.TransferWindow.list("-date", 40),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const tagOptions = useMemo(() => {
    const tags = new Set();
    for (const article of articles) {
      for (const tag of Array.isArray(article.tags) ? article.tags : []) {
        if (tag) tags.add(tag);
      }
    }
    return [...tags].slice(0, 12);
  }, [articles]);

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return articles.filter((article) => {
      const categoryMatch =
        activeFilter === "all" || article.category === activeFilter;
      const tagMatch =
        !selectedTag ||
        (Array.isArray(article.tags) && article.tags.includes(selectedTag));
      const haystack = `${article.title || ""} ${article.summary || ""} ${article.content || ""}`.toLowerCase();
      const textMatch = !query || haystack.includes(query);
      return categoryMatch && tagMatch && textMatch;
    });
  }, [activeFilter, articles, search, selectedTag]);

  const leadStory = filteredArticles[0] || null;
  const followupStories = filteredArticles
    .filter((article) => article.id !== leadStory?.id)
    .slice(0, 6);

  return (
    <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-6">
      <NewsHeader />

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <LeadStoryPanel
          leadStory={leadStory}
          onSelectTag={setSelectedTag}
          selectedTag={selectedTag}
          tournaments={tournaments}
        />
        <TransferWatchPanel transfers={transfers} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr] pt-4">
        <CoverageFeedPanel
          followupStories={followupStories}
          onSearch={setSearch}
          onToggleTag={(tag) => setSelectedTag((current) => (current === tag ? "" : tag))}
          onSetActiveFilter={setActiveFilter}
          activeFilter={activeFilter}
          search={search}
          selectedTag={selectedTag}
          tagOptions={tagOptions}
          tournaments={tournaments}
        />
      </section>
    </div>
  );
}
