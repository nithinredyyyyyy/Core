import React from "react";
import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { getNewsCategoryLabel } from "@/lib/newsCategories";
import { decodeNewsText, getEditorialNewsSummary } from "@/lib/newsEditorial";
import { estimateReadingTime, formatDate } from "@/lib/formatting";
import { cn } from "@/lib/utils";

/**
 * News card. Image-first when a thumbnail exists; otherwise a typographic
 * fallback. Category, date, and reading time always come from the article.
 */
export default function NewsCard({ article, tournaments = [], className = "" }) {
  if (!article) return null;

  const summary = getEditorialNewsSummary(article, tournaments);
  const readingTime = estimateReadingTime(article.content, article.summary);
  const isAiAssisted = Boolean(article.ai_summary);

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40",
        className,
      )}
    >
      <Link to={`/news/${article.id}`} className="flex flex-1 flex-col">
        {article.thumbnail_url ? (
          <img
            src={article.thumbnail_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="aspect-[16/9] w-full object-cover"
          />
        ) : null}

        <div className="flex flex-1 flex-col p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              {getNewsCategoryLabel(article.category)}
            </span>
            {isAiAssisted ? (
              <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                AI-assisted
              </span>
            ) : null}
          </div>

          <h3 className="mt-3 line-clamp-2 font-heading text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {decodeNewsText(article.title)}
          </h3>

          {summary ? (
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
              {summary}
            </p>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-4 text-xs text-muted-foreground">
            <time dateTime={article.created_date || undefined}>
              {formatDate(article.created_date)}
            </time>
            {readingTime ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" aria-hidden="true" />
                {readingTime}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
