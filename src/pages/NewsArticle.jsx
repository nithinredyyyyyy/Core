import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Newspaper, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import EmptyState from "@/components/shared/EmptyState";

const ARTICLE_IMAGE_RULES = [
  { match: /bmps 2026 announced/i, image: "/images/bmps-2026.png", fit: "contain" },
  { match: /bmps 2026/i, image: "/images/bmps-2026.png", fit: "contain" },
  { match: /bgis 2026/i, image: "/images/bgis2026-banner-1920.png", fit: "cover" },
  { match: /bmsd 2025/i, image: "/images/bmsd2025-champion.jpg", fit: "cover" },
  { match: /orangutan win bmsd 2025/i, image: "/images/bmsd2025-champion.jpg", fit: "cover" },
  { match: /drx win the inaugural bmic 2025/i, image: "/images/bmic2025-champion.png", fit: "cover" },
  { match: /bmic 2025/i, image: "/images/bmic2025-champion.png", fit: "cover" },
  { match: /bmps 2025/i, image: "/images/bmps2025-champion.jpg", fit: "cover" },
  { match: /bgis 2025/i, image: "/images/bgis2025-champion.jpg", fit: "cover" },
  { match: /bmps 2024/i, image: "/images/bmps2024-champion.jpg", fit: "cover" },
  { match: /bgis 2024/i, image: "/images/bgis2024-champion.jpg", fit: "cover" },
  { match: /bmps 2023/i, image: "/images/bmps2023-champion.jpg", fit: "cover" },
  { match: /bgis 2023/i, image: "/images/bgis2023-champion.png", fit: "cover" },
  { match: /india - korea invitational|inaugural india - korea/i, image: "/images/in-kr-champion.png", fit: "cover" },
];

function categoryLabel(category) {
  return String(category || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatArticleDate(value) {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? format(parsed, "MMM d, yyyy") : "Date pending";
}

function getArticleImageConfig(article) {
  if (article?.thumbnail_url) return { src: article.thumbnail_url, fit: "cover" };
  const text = `${article?.title || ""} ${article?.content || ""}`;
  const matchedRule = ARTICLE_IMAGE_RULES.find((rule) => rule.match.test(text));
  if (matchedRule) return { src: matchedRule.image, fit: matchedRule.fit || "cover" };
  if (article?.category === "announcement") return { src: "/images/core-ring.svg", fit: "contain" };
  return null;
}

function ArticleHeroImage({ article }) {
  const imageConfig = getArticleImageConfig(article);
  if (!imageConfig) {
    return (
      <div className="flex h-[260px] items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,243,235,0.96))] dark:bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.16),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(17,24,39,0.98))]">
        <Newspaper className="h-8 w-8 text-primary/35" />
      </div>
    );
  }

  const isContain = imageConfig.fit === "contain";
  return (
    <div className={`h-[260px] overflow-hidden md:h-[320px] ${isContain ? "bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.14),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,243,235,0.96))] dark:bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.14),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(17,24,39,0.98))]" : "bg-[#0f1116]"}`}>
      <div className={`flex h-full w-full items-center justify-center ${isContain ? "p-4" : ""}`}>
        <img src={imageConfig.src} alt={article.title} className={`h-full w-full ${isContain ? "object-contain" : "object-cover object-center"}`} />
      </div>
    </div>
  );
}

export default function NewsArticle() {
  const { articleId } = useParams();
  const { data: article, isLoading } = useQuery({
    queryKey: ["news-article", articleId],
    queryFn: () => base44.entities.NewsArticle.get(articleId),
    enabled: Boolean(articleId),
  });
  const { data: articles = [] } = useQuery({
    queryKey: ["news"],
    queryFn: () => base44.entities.NewsArticle.list("-created_date", 50),
  });

  const relatedArticles = React.useMemo(() => {
    if (!article) return [];
    const sourceTokens = `${article.title || ""} ${article.content || ""}`.toLowerCase();

    return articles
      .filter((entry) => entry.id !== article.id)
      .map((entry) => {
        let score = 0;
        if (entry.category && entry.category === article.category) score += 5;
        if (entry.game && entry.game === article.game) score += 3;
        if (sourceTokens.includes("bmps") && `${entry.title || ""} ${entry.content || ""}`.toLowerCase().includes("bmps")) score += 2;
        if (sourceTokens.includes("bgis") && `${entry.title || ""} ${entry.content || ""}`.toLowerCase().includes("bgis")) score += 2;
        if (sourceTokens.includes("2026") && `${entry.title || ""} ${entry.content || ""}`.toLowerCase().includes("2026")) score += 2;
        return { entry, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || new Date(b.entry.created_date || 0) - new Date(a.entry.created_date || 0))
      .slice(0, 3)
      .map((item) => item.entry);
  }, [article, articles]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Loading article</p>
      </div>
    );
  }

  if (!article) {
    return <EmptyState icon={Newspaper} title="Article not found" description="The story you opened is not available." />;
  }

  return (
    <div className="space-y-6">
      <Link to="/news" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to news
      </Link>

      <div className="overflow-hidden rounded-[32px] border border-border/70 bg-card shadow-[0_28px_70px_rgba(15,23,42,0.08)]">
        <ArticleHeroImage article={article} />
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              {categoryLabel(article.category)}
            </span>
            {article.game && article.game !== "General" ? (
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{article.game}</span>
            ) : null}
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {formatArticleDate(article.created_date)}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-black uppercase leading-tight tracking-[-0.04em] text-foreground md:text-5xl">
            {article.title}
          </h1>

          <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground">
            {String(article.content || "")
              .split(/\n{2,}/)
              .filter(Boolean)
              .map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
          </div>
        </div>
      </div>

      {relatedArticles.length > 0 ? (
        <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">Related coverage</p>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {relatedArticles.map((entry) => (
              <Link
                key={entry.id}
                to={`/news/${entry.id}`}
                className="overflow-hidden rounded-[22px] border border-border/70 bg-background/70 transition-all hover:-translate-y-1 hover:border-primary/30"
              >
                <ArticleHeroImage article={entry} />
                <div className="p-4">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {categoryLabel(entry.category)} · {formatArticleDate(entry.created_date)}
                  </p>
                  <h3 className="mt-2 line-clamp-2 text-sm font-black uppercase tracking-[-0.02em] text-foreground">
                    {entry.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
