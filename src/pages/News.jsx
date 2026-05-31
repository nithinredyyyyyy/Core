import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  MessageSquare,
  Search,
  Sparkles,
  Tag,
  TrendingUp,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import {
  aggregateCommentReactions,
  buildTrendingArticles,
  FAN_REACTION_OPTIONS,
} from "@/lib/fanZone";
import { getNewsCategoryLabel } from "@/lib/newsCategories";
import { decodeNewsText, getEditorialNewsSummary } from "@/lib/newsEditorial";

const FILTERS = ["all", "tournament", "announcement", "patch_update", "roster_change", "general"];

function Shell({ eyebrow, title, body, actions, children }) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-[#e7ddd1] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,241,235,0.92))] shadow-[0_28px_80px_rgba(15,23,42,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eadfce] px-5 py-5 sm:px-6">
        <div className="max-w-3xl">
          <p className="type-kicker text-[#8c7763]">{eyebrow}</p>
          <h2 className="type-title-lg mt-2 text-[#11131a]">{title}</h2>
          {body ? <p className="type-body-sm mt-3 text-[#5c6472]">{body}</p> : null}
        </div>
        {actions ? <div>{actions}</div> : null}
      </div>
      <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
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

function countArticleComments(messages, articleId) {
  return messages.filter((entry) => entry.topic === `news:${articleId}`).length;
}

function NewsCard({ article, tournaments, commentCount }) {
  const summary = getEditorialNewsSummary(article, tournaments);
  const tags = Array.isArray(article.tags) ? article.tags.slice(0, 3) : [];

  return (
    <Link
      to={`/news/${article.id}`}
      className="group rounded-[24px] border border-[#eadfce] bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-[#d7c5b1]"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#fff2e6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff7b57]">
          {getNewsCategoryLabel(article.category)}
        </span>
        <span className="rounded-full border border-[#eadfce] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a7866]">
          {article.game || "BGMI"}
        </span>
        {article.ai_summary ? (
          <span className="rounded-full bg-[#11131a] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
            AI summary
          </span>
        ) : null}
      </div>

      <h3 className="mt-4 text-[1.45rem] font-semibold leading-[1.02] tracking-[-0.04em] text-[#11131a] transition group-hover:text-primary">
        {decodeNewsText(article.title)}
      </h3>
      <p className="mt-3 line-clamp-4 text-sm leading-7 text-[#5c6472]">
        {summary}
      </p>

      {tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#eadfce] bg-[#fffdfa] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a7866]"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#f0e7dc] pt-4">
        <div className="text-[12px] text-[#8a7866]">
          <span>{formatDate(article.created_date)}</span>
          <span className="mx-2">•</span>
          <span>{commentCount} comments</span>
        </div>
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#11131a]">
          Open coverage <ArrowRight className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}

export default function News() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const fanSession = base44.fan.getStoredSession();
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  const { data: articles = [] } = useQuery({
    queryKey: ["news-published"],
    queryFn: () => base44.news.listPublished("-created_date", 120),
  });
  const { data: tournaments = [] } = useQuery({
    queryKey: ["news-tournaments"],
    queryFn: () => base44.entities.Tournament.list("-created_date", 60),
  });
  const { data: transfers = [] } = useQuery({
    queryKey: ["news-transfers"],
    queryFn: () => base44.entities.TransferWindow.list("-date", 40),
  });
  const { data: comments = [] } = useQuery({
    queryKey: ["news-comments"],
    queryFn: () => base44.entities.FanChatMessage.list("-created_date", 300),
  });
  const { data: reactions = [] } = useQuery({
    queryKey: ["news-reactions"],
    queryFn: () => base44.entities.FanCommentReaction.list("-created_date", 600),
  });

  const discussion = useMemo(
    () =>
      aggregateCommentReactions(
        comments.filter((entry) => String(entry.topic || "").startsWith("news:")),
        reactions,
      ),
    [comments, reactions],
  );

  const trendingArticles = useMemo(
    () => buildTrendingArticles(articles, comments, reactions).slice(0, 5),
    [articles, comments, reactions],
  );

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

  const leadStory = filteredArticles[0] || trendingArticles[0] || null;
  const followupStories = filteredArticles
    .filter((article) => article.id !== leadStory?.id)
    .slice(0, 6);

  const commentMutation = useMutation({
    mutationFn: ({ articleId, body }) =>
      base44.entities.FanChatMessage.create({
        user_id: fanSession.userId,
        display_name: fanSession.displayName,
        topic: `news:${articleId}`,
        body,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["news-comments"] });
      toast({
        title: "Comment posted",
        description: "Your take has been added to the news feed.",
      });
    },
  });

  const reactionMutation = useMutation({
    mutationFn: ({ commentId, reaction, voteValue }) =>
      base44.entities.FanCommentReaction.create({
        user_id: fanSession.userId,
        display_name: fanSession.displayName,
        comment_id: commentId,
        reaction,
        vote_value: voteValue,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["news-reactions"] });
    },
  });

  const newsDeskComments = discussion.slice(0, 4);

  return (
    <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-6">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Shell
          eyebrow="Lead story"
          title={leadStory ? decodeNewsText(leadStory.title) : "Latest story loading"}
          body={leadStory ? getEditorialNewsSummary(leadStory, tournaments) : "The latest article will appear here."}
          actions={
            leadStory ? (
              <Link
                to={`/news/${leadStory.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-[#11131a] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Open story <ArrowRight className="size-4" />
              </Link>
            ) : null
          }
        >
          {leadStory ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
              <div className="rounded-[24px] border border-[#eadfce] bg-white p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#fff2e6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff7b57]">
                    {getNewsCategoryLabel(leadStory.category)}
                  </span>
                  {leadStory.ai_summary ? (
                    <span className="rounded-full bg-[#11131a] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                      AI summary
                    </span>
                  ) : null}
                </div>
                <p className="mt-5 text-sm leading-7 text-[#5c6472]">
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
                        onClick={() => setSelectedTag(tag)}
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                          selectedTag === tag
                            ? "border-[#11131a] bg-[#11131a] text-white"
                            : "border-[#eadfce] bg-[#fffdfa] text-[#8a7866]"
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="rounded-[24px] border border-[#eadfce] bg-white p-5">
                <p className="type-kicker text-[#8a7866]">Coverage snapshot</p>
                <div className="mt-4 space-y-3 text-sm text-[#5c6472]">
                  <div className="flex items-center justify-between gap-3 rounded-[18px] bg-[#f8f2ec] px-4 py-3">
                    <span>Published</span>
                    <span className="font-semibold text-[#11131a]">{formatDate(leadStory.created_date)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-[18px] bg-[#f8f2ec] px-4 py-3">
                    <span>Game</span>
                    <span className="font-semibold text-[#11131a]">{leadStory.game || "BGMI"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-[18px] bg-[#f8f2ec] px-4 py-3">
                    <span>Trending score</span>
                    <span className="font-semibold text-[#11131a]">
                      {trendingArticles.find((entry) => entry.id === leadStory.id)?.trendScore || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-[18px] bg-[#f8f2ec] px-4 py-3">
                    <span>Comments</span>
                    <span className="font-semibold text-[#11131a]">{countArticleComments(comments, leadStory.id)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </Shell>

        <Shell
          eyebrow="Transfer watch"
          title="Roster moves and season announcements"
          body="Transfers, roster adjustments, and lineup drama stay visible beside the main coverage feed."
        >
          <div className="space-y-3">
            {transfers.slice(0, 6).map((entry) => (
              <div key={entry.id} className="rounded-[22px] border border-[#eadfce] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                      {entry.window || "Transfer"}
                    </p>
                    <p className="mt-2 text-base font-semibold text-[#11131a]">
                      {entry.oldTeam || "Previous team"} → {entry.newTeam || "New team"}
                    </p>
                    <p className="mt-2 text-[12px] leading-6 text-[#5c6472]">
                      {(Array.isArray(entry.players) ? entry.players : []).join(", ") || "Roster move details incoming."}
                    </p>
                  </div>
                  <span className="text-[11px] text-[#8a7866]">{formatDate(entry.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </Shell>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Shell
          eyebrow="Coverage filters"
          title="Filter by category, tags, or keywords"
          body="Scan tournament announcements, patch updates, roster news, and daily stories from one organized feed."
          actions={
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8a7866]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search news coverage"
                className="h-11 rounded-full border border-[#d9c7b3] bg-white pl-10 pr-4 text-sm text-[#11131a] outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              />
            </div>
          }
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {tagOptions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag((current) => (current === tag ? "" : tag))}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
                  selectedTag === tag
                    ? "border-[#11131a] bg-[#11131a] text-white"
                    : "border-[#eadfce] bg-white text-[#8a7866]"
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
                commentCount={countArticleComments(comments, article.id)}
              />
            ))}
            {followupStories.length === 0 ? (
              <div className="rounded-[24px] border border-[#eadfce] bg-white p-5 text-sm text-[#5c6472]">
                No stories match the current filters. Try another category or clear the tag search.
              </div>
            ) : null}
          </div>
        </Shell>

        <div className="grid gap-6">
          <Shell
            eyebrow="Trending articles"
            title="What fans are reading now"
            body="Freshness, feature weight, and fan discussion shape the trending rail."
          >
            <div className="space-y-3">
              {trendingArticles.slice(0, 5).map((article, index) => (
                <Link
                  key={article.id}
                  to={`/news/${article.id}`}
                  className="flex items-center gap-4 rounded-[22px] border border-[#eadfce] bg-white p-4 transition hover:border-[#d7c5b1]"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-[16px] bg-[#fff2e6] text-sm font-black text-[#ff7b57]">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#11131a]">
                      {decodeNewsText(article.title)}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[#8a7866]">
                      {article.trendScore} trend score
                    </p>
                  </div>
                  <TrendingUp className="size-4 text-primary" />
                </Link>
              ))}
            </div>
          </Shell>

          <Shell
            eyebrow="Reader floor"
            title="Latest article discussion"
            body="Comments, upvotes, downvotes, and quick emoji reactions stay tied directly to each story."
          >
            <div className="space-y-3">
              {newsDeskComments.length > 0 ? (
                newsDeskComments.map((comment) => (
                  <div key={comment.id} className="rounded-[22px] border border-[#eadfce] bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#11131a]">{comment.display_name}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[#8a7866]">
                          {comment.topic?.replace("news:", "Article ")}
                        </p>
                      </div>
                      <MessageSquare className="size-4 text-primary" />
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[#5c6472]">{comment.body}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={!fanSession.userId}
                        onClick={() =>
                          reactionMutation.mutate({ commentId: comment.id, reaction: "", voteValue: 1 })
                        }
                        className="rounded-full border border-[#d9c7b3] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#11131a]"
                      >
                        ↑ {comment.reactionSummary.upvotes}
                      </button>
                      <button
                        type="button"
                        disabled={!fanSession.userId}
                        onClick={() =>
                          reactionMutation.mutate({ commentId: comment.id, reaction: "", voteValue: -1 })
                        }
                        className="rounded-full border border-[#d9c7b3] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#11131a]"
                      >
                        ↓ {comment.reactionSummary.downvotes}
                      </button>
                      {FAN_REACTION_OPTIONS.map((reaction) => (
                        <button
                          key={reaction.key}
                          type="button"
                          disabled={!fanSession.userId}
                          onClick={() =>
                            reactionMutation.mutate({
                              commentId: comment.id,
                              reaction: reaction.key,
                              voteValue: 0,
                            })
                          }
                          className="rounded-full border border-[#d9c7b3] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#11131a]"
                        >
                          {reaction.emoji} {comment.reactionSummary.emojis?.[reaction.key] || 0}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[22px] border border-[#eadfce] bg-white p-4 text-sm text-[#5c6472]">
                  The article discussion floor is waiting for the first reaction.
                </div>
              )}
            </div>
          </Shell>
        </div>
      </section>

      {leadStory && fanSession.userId ? (
        <Shell
          eyebrow="Open the floor"
          title="Comment on the lead story"
          body="Turn readers into participants by letting them rate the latest announcement or roster move directly from the feed."
          actions={
            leadStory.ai_summary ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#11131a] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                <Sparkles className="size-3.5" />
                AI summary active
              </span>
            ) : null
          }
        >
          <LeadStoryCommentComposer
            article={leadStory}
            onSubmit={(body) => commentMutation.mutate({ articleId: leadStory.id, body })}
            isPending={commentMutation.isPending}
          />
        </Shell>
      ) : null}
    </div>
  );
}

function LeadStoryCommentComposer({ article, onSubmit, isPending }) {
  const [value, setValue] = useState("");

  return (
    <div className="rounded-[24px] border border-[#eadfce] bg-white p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a7866]">
        {decodeNewsText(article.title)}
      </p>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        maxLength={240}
        placeholder="Drop your take on the lead story..."
        className="mt-4 min-h-[140px] w-full rounded-[20px] border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#11131a] outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
      />
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[12px] text-[#8a7866]">Comments feed the live editorial reaction layer.</p>
        <button
          type="button"
          disabled={!value.trim() || isPending}
          onClick={() => {
            onSubmit(value.trim());
            setValue("");
          }}
          className="inline-flex items-center gap-2 rounded-full bg-[#11131a] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <MessageSquare className="size-4" />
          {isPending ? "Posting..." : "Post comment"}
        </button>
      </div>
    </div>
  );
}
