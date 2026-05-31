import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Tag,
  TrendingUp,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { aggregateCommentReactions, buildTrendingArticles, FAN_REACTION_OPTIONS } from "@/lib/fanZone";
import { getNewsCategoryLabel } from "@/lib/newsCategories";
import {
  decodeNewsText,
  getEditorialNewsBlocks,
  getEditorialNewsSummary,
} from "@/lib/newsEditorial";

function DetailShell({ children }) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-[#e7ddd1] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,241,235,0.92))] shadow-[0_28px_80px_rgba(15,23,42,0.08)]">
      {children}
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

function CommentComposer({ onSubmit, isPending }) {
  const [value, setValue] = useState("");

  return (
    <div className="rounded-[24px] border border-[#eadfce] bg-white p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a7866]">
        Join the discussion
      </p>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        maxLength={280}
        placeholder="Share your take on this story..."
        className="mt-4 min-h-[140px] w-full rounded-[20px] border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#11131a] outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
      />
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[12px] text-[#8a7866]">
          Comments, reactions, and votes feed the article heat.
        </p>
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

export default function NewsArticle() {
  const { articleId } = useParams();
  const qc = useQueryClient();
  const { toast } = useToast();
  const fanSession = base44.fan.getStoredSession();

  const { data: article } = useQuery({
    queryKey: ["news-article", articleId],
    queryFn: () => base44.news.getPublished(articleId),
    enabled: Boolean(articleId),
  });
  const { data: articles = [] } = useQuery({
    queryKey: ["news-related"],
    queryFn: () => base44.news.listPublished("-created_date", 80),
  });
  const { data: tournaments = [] } = useQuery({
    queryKey: ["news-article-tournaments"],
    queryFn: () => base44.entities.Tournament.list("-created_date", 60),
  });
  const { data: comments = [] } = useQuery({
    queryKey: ["news-article-comments"],
    queryFn: () => base44.entities.FanChatMessage.list("-created_date", 300),
  });
  const { data: reactions = [] } = useQuery({
    queryKey: ["news-article-reactions"],
    queryFn: () => base44.entities.FanCommentReaction.list("-created_date", 600),
  });

  const articleComments = useMemo(() => {
    const scoped = comments.filter((entry) => entry.topic === `news:${articleId}`);
    return aggregateCommentReactions(scoped, reactions);
  }, [articleId, comments, reactions]);

  const trending = useMemo(
    () => buildTrendingArticles(articles, comments, reactions),
    [articles, comments, reactions],
  );

  const relatedArticles = useMemo(() => {
    if (!article) return [];
    const tagSet = new Set(Array.isArray(article.tags) ? article.tags : []);
    return articles
      .filter((entry) => entry.id !== article.id)
      .map((entry) => {
        let score = entry.category === article.category ? 4 : 0;
        score += entry.game === article.game ? 2 : 0;
        for (const tag of Array.isArray(entry.tags) ? entry.tags : []) {
          if (tagSet.has(tag)) score += 3;
        }
        return { ...entry, score };
      })
      .toSorted((left, right) => right.score - left.score)
      .slice(0, 4);
  }, [article, articles]);

  const blocks = useMemo(
    () => (article ? getEditorialNewsBlocks(article, tournaments) : []),
    [article, tournaments],
  );

  const commentMutation = useMutation({
    mutationFn: (body) =>
      base44.entities.FanChatMessage.create({
        user_id: fanSession.userId,
        display_name: fanSession.displayName,
        topic: `news:${articleId}`,
        body,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["news-article-comments"] });
      qc.invalidateQueries({ queryKey: ["news-comments"] });
      toast({
        title: "Comment posted",
        description: "Your take is now live under this story.",
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
      qc.invalidateQueries({ queryKey: ["news-article-reactions"] });
      qc.invalidateQueries({ queryKey: ["news-reactions"] });
    },
  });

  if (!article) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center rounded-[28px] border border-dashed border-[#d9ccbb] bg-[rgba(255,255,255,0.75)] p-6 text-sm text-[#5c6472]">
        Loading article...
      </div>
    );
  }

  const tags = Array.isArray(article.tags) ? article.tags : [];
  const trendScore = trending.find((entry) => entry.id === article.id)?.trendScore || 0;

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6">
      <Link
        to="/news"
        className="inline-flex items-center gap-2 rounded-full border border-[#e7ddd1] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#5c6472] transition hover:text-[#11131a]"
      >
        <ArrowLeft className="size-3.5" />
        Back to news desk
      </Link>

      <DetailShell>
        <div className="border-b border-[#eadfce] px-5 py-6 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#fff2e6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff7b57]">
              {getNewsCategoryLabel(article.category)}
            </span>
            <span className="rounded-full border border-[#eadfce] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a7866]">
              {article.game || "BGMI"}
            </span>
            {article.ai_summary ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#11131a] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                <Sparkles className="size-3.5" />
                AI summary
              </span>
            ) : null}
          </div>
          <h1 className="mt-5 max-w-[18ch] text-[2.4rem] font-semibold leading-[0.94] tracking-[-0.06em] text-[#11131a] sm:text-[3.5rem]">
            {decodeNewsText(article.title)}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#5c6472]">
            {getEditorialNewsSummary(article, tournaments)}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <div className="rounded-[20px] bg-[#f8f2ec] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a7866]">Published</p>
              <p className="mt-2 text-sm font-semibold text-[#11131a]">{formatDate(article.created_date)}</p>
            </div>
            <div className="rounded-[20px] bg-[#f8f2ec] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a7866]">Comments</p>
              <p className="mt-2 text-sm font-semibold text-[#11131a]">{articleComments.length}</p>
            </div>
            <div className="rounded-[20px] bg-[#f8f2ec] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a7866]">Trending</p>
              <p className="mt-2 text-sm font-semibold text-[#11131a]">{trendScore}</p>
            </div>
            <div className="rounded-[20px] bg-[#f8f2ec] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a7866]">Tags</p>
              <p className="mt-2 text-sm font-semibold text-[#11131a]">{tags.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 px-5 py-5 sm:px-6 sm:py-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            {article.ai_summary ? (
              <div className="rounded-[24px] border border-[#eadfce] bg-white p-5">
                <p className="type-kicker text-[#8a7866]">AI-generated summary</p>
                <p className="mt-3 text-sm leading-7 text-[#5c6472]">
                  {decodeNewsText(article.ai_summary)}
                </p>
              </div>
            ) : null}

            <div className="rounded-[24px] border border-[#eadfce] bg-white p-5">
              <div className="space-y-5">
                {blocks.map((block, index) =>
                  block.type === "heading" ? (
                    <h2 key={`${block.text}-${index}`} className="text-[1.25rem] font-semibold tracking-[-0.03em] text-[#11131a]">
                      {decodeNewsText(block.text)}
                    </h2>
                  ) : (
                    <p key={`${block.text}-${index}`} className="text-sm leading-8 text-[#414854]">
                      {decodeNewsText(block.text)}
                    </p>
                  ),
                )}
              </div>
            </div>

            {fanSession.userId ? (
              <CommentComposer
                onSubmit={(body) => commentMutation.mutate(body)}
                isPending={commentMutation.isPending}
              />
            ) : (
              <div className="rounded-[24px] border border-[#eadfce] bg-white p-5 text-sm text-[#5c6472]">
                Sign in to profile before joining the article discussion.
              </div>
            )}

            <div className="space-y-3">
              {articleComments.length > 0 ? (
                articleComments.map((comment) => (
                  <div key={comment.id} className="rounded-[24px] border border-[#eadfce] bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#11131a]">{comment.display_name}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[#8a7866]">
                          {formatDate(comment.created_date)}
                        </p>
                      </div>
                      <MessageSquare className="size-4 text-primary" />
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[#5c6472]">{comment.body}</p>
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
                <div className="rounded-[24px] border border-[#eadfce] bg-white p-5 text-sm text-[#5c6472]">
                  No comments on this story yet. Open the article floor with the first take.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {tags.length > 0 ? (
              <DetailShell>
                <div className="px-5 py-5 sm:px-6">
                  <p className="type-kicker text-[#8a7866]">Tags</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-2 rounded-full border border-[#eadfce] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a7866]"
                      >
                        <Tag className="size-3.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </DetailShell>
            ) : null}

            <DetailShell>
              <div className="px-5 py-5 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="type-kicker text-[#8a7866]">Trending rail</p>
                    <h2 className="type-title-md mt-2 text-[#11131a]">What readers are opening next</h2>
                  </div>
                  <TrendingUp className="size-4 text-primary" />
                </div>
                <div className="mt-5 space-y-3">
                  {trending.slice(0, 5).map((entry, index) => (
                    <Link
                      key={entry.id}
                      to={`/news/${entry.id}`}
                      className="flex items-center gap-4 rounded-[22px] border border-[#eadfce] bg-white p-4 transition hover:border-[#d7c5b1]"
                    >
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-[16px] bg-[#fff2e6] text-sm font-black text-[#ff7b57]">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#11131a]">
                          {decodeNewsText(entry.title)}
                        </p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[#8a7866]">
                          {entry.trendScore} trend score
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </DetailShell>

            <DetailShell>
              <div className="px-5 py-5 sm:px-6">
                <p className="type-kicker text-[#8a7866]">Related coverage</p>
                <div className="mt-5 space-y-3">
                  {relatedArticles.map((entry) => (
                    <Link
                      key={entry.id}
                      to={`/news/${entry.id}`}
                      className="block rounded-[22px] border border-[#eadfce] bg-white p-4 transition hover:border-[#d7c5b1]"
                    >
                      <p className="text-sm font-semibold text-[#11131a]">
                        {decodeNewsText(entry.title)}
                      </p>
                      <p className="mt-2 text-[12px] leading-6 text-[#5c6472]">
                        {getEditorialNewsSummary(entry, tournaments)}
                      </p>
                      <span className="mt-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#11131a]">
                        Open coverage <ArrowRight className="size-3.5" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </DetailShell>
          </div>
        </div>
      </DetailShell>
    </div>
  );
}
