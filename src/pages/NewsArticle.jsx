import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Tag,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getNewsCategoryLabel } from "@/lib/newsCategories";
import {
  decodeNewsText,
  getEditorialNewsBlocks,
  getEditorialNewsSummary,
} from "@/lib/newsEditorial";

// removed DetailShell helper

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

function ArticleHeader({ article, tags, tournaments }) {
  return (
    <div className="rounded-[28px] border border-brand-border bg-card p-6 shadow-sm dark:border-white/10">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brand-gold-shell px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-coral-rose">
          {getNewsCategoryLabel(article.category)}
        </span>
        <span className="rounded-full border border-brand-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-taupe dark:border-white/15">
          {article.game || "BGMI"}
        </span>
        {article.ai_summary ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
            <Sparkles className="size-3.5" />
            AI summary
          </span>
        ) : null}
      </div>
      <h1 className="mt-5 text-[2.2rem] font-semibold leading-[1.02] tracking-[-0.05em] text-brand-ink dark:text-foreground sm:text-[3.2rem]">
        {decodeNewsText(article.title)}
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-brand-slate dark:text-muted-foreground">
        {getEditorialNewsSummary(article, tournaments)}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          ["Published", formatDate(article.created_date)],
          ["Game", article.game || "BGMI"],
          ["Tags", tags.length || 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[20px] bg-secondary/30 p-4 border border-border/30">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArticleBodyColumn({ article, blocks }) {
  return (
    <div className="space-y-6">
      {article.ai_summary ? (
        <div className="rounded-[24px] border border-brand-border bg-card p-5 shadow-sm dark:border-white/10">
          <p className="type-kicker text-brand-taupe">AI-generated summary</p>
          <p className="mt-3 text-sm leading-7 text-brand-slate dark:text-muted-foreground">
            {decodeNewsText(article.ai_summary)}
          </p>
        </div>
      ) : null}

      <div className="rounded-[24px] border border-brand-border bg-card p-6 shadow-sm dark:border-white/10">
        <div className="space-y-5">
          {blocks.map((block, index) =>
            block.type === "heading" ? (
              <h2 key={`${block.text}-${index}`} className="text-[1.25rem] font-semibold tracking-[-0.03em] text-foreground pt-4 first:pt-0">
                {decodeNewsText(block.text)}
              </h2>
            ) : (
              <p key={`${block.text}-${index}`} className="text-sm leading-8 text-muted-foreground">
                {decodeNewsText(block.text)}
              </p>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function ArticleSideColumn({ relatedArticles, tags, tournaments }) {
  return (
    <div className="space-y-6">
      {tags.length > 0 ? (
        <div className="rounded-[24px] border border-brand-border bg-card p-6 shadow-sm dark:border-white/10">
          <p className="type-kicker text-brand-taupe">Tags</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-white dark:border-white/10 dark:bg-secondary/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-taupe dark:text-muted-foreground"
              >
                <Tag className="size-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-[24px] border border-brand-border bg-card p-6 shadow-sm dark:border-white/10">
        <p className="type-kicker text-brand-taupe">Related coverage</p>
        <div className="mt-5 space-y-4">
          {relatedArticles.map((entry) => (
            <Link
              key={entry.id}
              to={`/news/${entry.id}`}
              className="block rounded-[22px] border border-brand-border bg-white dark:border-white/10 dark:bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
            >
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition line-clamp-2">
                {decodeNewsText(entry.title)}
              </p>
              <p className="mt-2 text-[12px] leading-5 text-muted-foreground line-clamp-3">
                {getEditorialNewsSummary(entry, tournaments)}
              </p>
              <span className="mt-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                Open coverage <ArrowRight className="size-3" />
              </span>
            </Link>
          ))}
          {relatedArticles.length === 0 ? (
            <p className="text-xs text-muted-foreground">No related coverage available.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function NewsArticle() {
  const { articleId } = useParams();

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

  const relatedArticles = useMemo(() => {
    if (!article) return [];
    const tagSet = new Set(Array.isArray(article.tags) ? article.tags : []);
    const scoredArticles = [];
    for (const entry of articles) {
      if (entry.id === article.id) continue;
        let score = entry.category === article.category ? 4 : 0;
        score += entry.game === article.game ? 2 : 0;
        for (const tag of Array.isArray(entry.tags) ? entry.tags : []) {
          if (tagSet.has(tag)) score += 3;
        }
      scoredArticles.push({ ...entry, score });
    }
    return scoredArticles
      .toSorted((left, right) => right.score - left.score)
      .slice(0, 4);
  }, [article, articles]);

  const blocks = useMemo(
    () => (article ? getEditorialNewsBlocks(article, tournaments) : []),
    [article, tournaments],
  );

  if (!article) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center rounded-[28px] border border-dashed border-brand-border-faint bg-[rgba(255,255,255,0.75)] p-6 text-sm text-brand-slate">
        Loading article…
      </div>
    );
  }

  const tags = Array.isArray(article.tags) ? article.tags : [];

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6">
      <Link
        to="/news"
        className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground transition hover:text-foreground dark:border-white/10 w-fit"
      >
        <ArrowLeft className="size-3.5" />
        Back to news desk
      </Link>

      <article className="space-y-6">
        <ArticleHeader
          article={article}
          tags={tags}
          tournaments={tournaments}
        />

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <ArticleBodyColumn
            article={article}
            blocks={blocks}
          />
          <ArticleSideColumn
            relatedArticles={relatedArticles}
            tags={tags}
            tournaments={tournaments}
          />
        </div>
      </article>
    </div>
  );
}
