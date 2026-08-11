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

function DetailShell({ children }) {
  return (
    <section className="mb-16">
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

function ArticleHeader({ article, tags, tournaments }) {
  return (
    <div className="border-b border-brand-border px-5 py-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brand-gold-shell px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-coral-rose">
          {getNewsCategoryLabel(article.category)}
        </span>
        <span className="rounded-full border border-brand-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-taupe">
          {article.game || "BGMI"}
        </span>
        {article.ai_summary ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
            <Sparkles className="size-3.5" />
            AI summary
          </span>
        ) : null}
      </div>
      <h1 className="mt-5 max-w-[18ch] text-[2.4rem] font-semibold leading-[0.94] tracking-[-0.06em] text-brand-ink sm:text-[3.5rem]">
        {decodeNewsText(article.title)}
      </h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-brand-slate">
        {getEditorialNewsSummary(article, tournaments)}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          ["Published", formatDate(article.created_date)],
          ["Game", article.game || "BGMI"],
          ["Tags", tags.length || 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[20px] bg-brand-cream-milk p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-taupe">{label}</p>
            <p className="mt-2 text-sm font-semibold text-brand-ink">{value}</p>
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
        <div className="rounded-[24px] border border-brand-border bg-white p-5">
          <p className="type-kicker text-brand-taupe">AI-generated summary</p>
          <p className="mt-3 text-sm leading-7 text-brand-slate">
            {decodeNewsText(article.ai_summary)}
          </p>
        </div>
      ) : null}

      <div className="rounded-[24px] border border-brand-border bg-white p-5">
        <div className="space-y-5">
          {blocks.map((block, index) =>
            block.type === "heading" ? (
              <h2 key={`${block.text}-${index}`} className="text-[1.25rem] font-semibold tracking-[-0.03em] text-brand-ink">
                {decodeNewsText(block.text)}
              </h2>
            ) : (
              <p key={`${block.text}-${index}`} className="text-sm leading-8 text-brand-slate-ink">
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
        <DetailShell>
          <div className="px-5 py-5 sm:px-6">
            <p className="type-kicker text-brand-taupe">Tags</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-taupe"
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
          <p className="type-kicker text-brand-taupe">Related coverage</p>
          <div className="mt-5 space-y-3">
            {relatedArticles.map((entry) => (
              <Link
                key={entry.id}
                to={`/news/${entry.id}`}
                className="block rounded-[22px] border border-brand-border bg-white p-4 transition hover:border-brand-border-lift-2"
              >
                <p className="text-sm font-semibold text-brand-ink">
                  {decodeNewsText(entry.title)}
                </p>
                <p className="mt-2 text-[12px] leading-6 text-brand-slate">
                  {getEditorialNewsSummary(entry, tournaments)}
                </p>
                <span className="mt-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-ink">
                  Open coverage <ArrowRight className="size-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </DetailShell>
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
        className="inline-flex items-center gap-2 rounded-full border border-brand-border-tan bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-slate transition hover:text-brand-ink"
      >
        <ArrowLeft className="size-3.5" />
        Back to news desk
      </Link>

      <DetailShell>
        <ArticleHeader
          article={article}
          tags={tags}
          tournaments={tournaments}
        />

        <div className="grid gap-6 px-5 py-5 sm:px-6 sm:py-6 xl:grid-cols-[1.1fr_0.9fr]">
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
      </DetailShell>
    </div>
  );
}
