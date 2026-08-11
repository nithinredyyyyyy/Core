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

function Shell({ eyebrow, title, body, actions, children }) {
  return (
    <section className="mb-16">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
          <h2 className="mt-2 text-4xl font-black tracking-tight text-foreground">{title}</h2>
          {body ? <p className="mt-3 text-lg text-muted-foreground max-w-2xl">{body}</p> : null}
        </div>
        {actions ? <div>{actions}</div> : null}
      </div>
      <div>{children}</div>
    </section>
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
      className="group rounded-[24px] border border-brand-border bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-brand-border-lift-2"
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

      <h3 className="mt-4 text-[1.45rem] font-semibold leading-[1.02] tracking-[-0.04em] text-brand-ink transition group-hover:text-primary">
        {decodeNewsText(article.title)}
      </h3>
      <p className="mt-3 line-clamp-4 text-sm leading-7 text-brand-slate">
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
  return (
    <Shell
      eyebrow="Lead story"
      title={leadStory ? decodeNewsText(leadStory.title) : "Latest story loading"}
      body={leadStory ? getEditorialNewsSummary(leadStory, tournaments) : "The latest article will appear here."}
      actions={
        leadStory ? (
          <Link
            to={`/news/${leadStory.id}`}
            className="inline-flex items-center gap-2 rounded-full bg-brand-ink px-5 py-2.5 text-sm font-semibold text-white"
          >
            Open story <ArrowRight className="size-4" />
          </Link>
        ) : null
      }
    >
      {leadStory ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[24px] border border-brand-border bg-white p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-gold-shell px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-coral-rose">
                {getNewsCategoryLabel(leadStory.category)}
              </span>
              {leadStory.ai_summary ? (
                <span className="rounded-full bg-brand-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                  AI summary
                </span>
              ) : null}
            </div>
            <p className="mt-5 text-sm leading-7 text-brand-slate">
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
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                      selectedTag === tag
                        ? "border-brand-ink bg-brand-ink text-white"
                        : "border-brand-border bg-brand-cream text-brand-taupe"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="rounded-[24px] border border-brand-border bg-white p-5">
            <p className="type-kicker text-brand-taupe">Coverage snapshot</p>
            <div className="mt-4 space-y-3 text-sm text-brand-slate">
              {[
                ["Published", formatDate(leadStory.created_date)],
                ["Game", leadStory.game || "BGMI"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 rounded-[18px] bg-brand-cream-milk px-4 py-3"
                >
                  <span>{label}</span>
                  <span className="font-semibold text-brand-ink">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}

function TransferWatchPanel({ transfers }) {
  const visibleTransfers = transfers.slice(0, 6);

  return (
    <Shell
      eyebrow="Transfer watch"
      title="Roster moves and season announcements"
      body="Transfers, roster adjustments, and lineup drama stay visible beside the main coverage feed."
    >
      <div className="space-y-3">
        {visibleTransfers.map((entry) => {
          const players = Array.isArray(entry.players)
            ? entry.players.filter(Boolean)
            : [];
          const oldTeam = String(entry.oldTeam || "").trim();
          const newTeam = String(entry.newTeam || "").trim();
          const hasOldTeam = Boolean(oldTeam);
          const hasNewTeam = Boolean(newTeam);

          return (
          <div key={entry.id} className="rounded-[22px] border border-brand-border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                  {entry.window || "Transfer"}
                </p>
                {hasOldTeam && hasNewTeam ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-base font-semibold text-brand-ink">
                    <span className="truncate">{oldTeam}</span>
                    <span className="text-brand-coral-clay">→</span>
                    <span className="truncate">{newTeam}</span>
                  </div>
                ) : (
                  <p className="mt-2 text-base font-semibold text-brand-ink">
                    {hasNewTeam
                      ? `${newTeam} roster update`
                      : hasOldTeam
                        ? `${oldTeam} roster update`
                        : "Roster update"}
                  </p>
                )}
                {players.length > 0 ? (
                  <p className="mt-2 text-[12px] leading-6 text-brand-slate">
                    {players.join(", ")}
                  </p>
                ) : (
                  <span className="mt-3 inline-flex rounded-full border border-brand-border bg-brand-cream-almond px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-taupe">
                    Roster watch
                  </span>
                )}
              </div>
              <span className="shrink-0 text-[11px] text-brand-taupe">{formatDate(entry.date)}</span>
            </div>
          </div>
          );
        })}
        {visibleTransfers.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-brand-border bg-white/70 p-5 text-sm text-brand-slate">
            Transfer watch will update when roster moves are published.
          </div>
        ) : null}
      </div>
    </Shell>
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
    <Shell
      eyebrow="Coverage filters"
      title="Filter by category, tags, or keywords"
      body="Scan tournament announcements, patch updates, roster news, and daily stories from one organized feed."
      actions={
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-taupe" />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search news coverage"
            aria-label="Search news coverage"
            className="h-11 rounded-full border border-brand-border-lift bg-white pl-10 pr-4 text-sm text-brand-ink outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => onSetActiveFilter(filter)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
              activeFilter === filter
                ? "border-brand-ink bg-brand-ink text-white"
                : "border-brand-border bg-white text-brand-taupe"
            }`}
          >
            {getNewsCategoryLabel(filter)}
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {tagOptions.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onToggleTag(tag)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
              selectedTag === tag
                ? "border-brand-ink bg-brand-ink text-white"
                : "border-brand-border bg-white text-brand-taupe"
            }`}
          >
            <Tag className="size-3.5" />
            {tag}
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {followupStories.map((article) => (
          <NewsCard
            key={article.id}
            article={article}
            tournaments={tournaments}
          />
        ))}
        {followupStories.length === 0 ? (
          <div className="rounded-[24px] border border-brand-border bg-white p-5 text-sm text-brand-slate">
            No stories match the current filters. Try another category or clear the tag search.
          </div>
        ) : null}
      </div>
    </Shell>
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
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <LeadStoryPanel
          leadStory={leadStory}
          onSelectTag={setSelectedTag}
          selectedTag={selectedTag}
          tournaments={tournaments}
        />
        <TransferWatchPanel transfers={transfers} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr]">
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
