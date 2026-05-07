import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Asterisk, Newspaper, Radio, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import EmptyState from "../components/shared/EmptyState";
import { format } from "date-fns";

const CURRENT_CIRCUIT_PATTERNS = [/2026/i, /bmps/i, /bgis/i];
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

function LightPanel({ className = "", children }) {
  return (
    <div className={`rounded-[28px] border border-border/70 bg-card shadow-[0_20px_60px_rgba(15,23,42,0.06)] ${className}`}>
      {children}
    </div>
  );
}

function isCurrentCircuitArticle(article) {
  const text = `${article?.title || ""} ${article?.content || ""}`.toLowerCase();
  return CURRENT_CIRCUIT_PATTERNS.some((pattern) => pattern.test(text));
}

function categoryLabel(category) {
  return category === "all"
    ? "All"
    : String(category || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatArticleDate(value) {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? format(parsed, "MMM d, yyyy") : "Date pending";
}

function getArticleImageConfig(article) {
  if (article?.thumbnail_url) {
    return { src: article.thumbnail_url, fit: "cover" };
  }

  const text = `${article?.title || ""} ${article?.content || ""}`;
  const matchedRule = ARTICLE_IMAGE_RULES.find((rule) => rule.match.test(text));
  if (matchedRule) return { src: matchedRule.image, fit: matchedRule.fit || "cover" };

  if (article?.category === "announcement") {
    return { src: "/images/core-ring.svg", fit: "contain" };
  }

  return null;
}

function getArticleImagePosition(article) {
  const text = `${article?.title || ""} ${article?.content || ""}`.toLowerCase();

  if (/team versatile win bgis 2025/i.test(text)) {
    return "object-center object-[50%_22%]";
  }

  if (/dplus kia win india - korea invitational 2023|inaugural india - korea/i.test(text)) {
    return "object-center object-[50%_34%]";
  }

  if (/drx win the inaugural bmic 2025/i.test(text)) {
    return "object-center object-[50%_24%]";
  }

  if (/orangutan win bmsd 2025/i.test(text)) {
    return "object-center object-[50%_24%]";
  }

  if (/aryan x tmg gaming win bmps 2025/i.test(text)) {
    return "object-center object-[50%_68%]";
  }

  return "object-center";
}

function ArticleImage({ article, className = "", heightClass = "h-44", padded = true }) {
  const imageConfig = getArticleImageConfig(article);

  if (!imageConfig) {
    return (
      <div className={`flex items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,243,235,0.96))] dark:bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.16),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(17,24,39,0.98))] ${heightClass} ${className}`}>
        <Newspaper className="h-8 w-8 text-primary/35" />
      </div>
    );
  }

  const isContain = imageConfig.fit === "contain";
  const shellClass = isContain
    ? "bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.14),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,243,235,0.96))] dark:bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.14),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(17,24,39,0.98))]"
    : "bg-[#0f1116]";
  const framePadding = isContain && padded ? "p-3 md:p-4" : "";
  const imageClass = isContain ? "object-contain" : `object-cover ${getArticleImagePosition(article)}`;

  return (
    <div
      className={`overflow-hidden ${shellClass} ${heightClass} ${className}`}
    >
      <div className={`flex h-full w-full items-center justify-center ${framePadding}`}>
        <img
          src={imageConfig.src}
          alt={article.title}
          className={`h-full w-full transition-transform duration-300 group-hover:scale-[1.02] ${imageClass}`}
        />
      </div>
    </div>
  );
}

function SignalCard({ label, value, detail, accent = "default" }) {
  const accentClass =
    accent === "primary"
      ? "border-primary/25 bg-primary/10"
      : "border-border/70 bg-background/75";

  return (
    <div className={`rounded-[24px] border p-5 shadow-sm ${accentClass}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">{label}</p>
      <p className="mt-3 text-xl font-black uppercase tracking-[-0.04em] text-foreground">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  );
}

function NewsCard({ article, index, compact = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`group overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-[0_16px_42px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_22px_48px_rgba(15,23,42,0.1)] ${
        compact ? "p-5" : ""
      }`}
    >
      {!compact ? (
        <ArticleImage article={article} />
      ) : null}

      <div className={compact ? "" : "p-5"}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              {categoryLabel(article.category)}
            </span>
            {article.game && article.game !== "General" ? (
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{article.game}</span>
            ) : null}
          </div>
          <p className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {formatArticleDate(article.created_date)}
          </p>
        </div>

        <h3 className={`mt-3 font-black uppercase tracking-[-0.03em] text-foreground ${compact ? "line-clamp-2 text-base" : "line-clamp-2 text-xl"}`}>
          {article.title}
        </h3>
        <p className={`mt-3 text-muted-foreground ${compact ? "line-clamp-3 text-sm leading-6" : "line-clamp-3 text-sm leading-7"}`}>
          {article.content}
        </p>
      </div>
    </motion.div>
  );
}

export default function News() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["news"],
    queryFn: () => base44.entities.NewsArticle.list("-created_date", 50),
  });

  const categories = useMemo(() => {
    const discovered = [...new Set(articles.map((article) => article.category).filter(Boolean))];
    return ["all", ...discovered];
  }, [articles]);

  const { featuredArticle, spotlightArticles, archiveArticles, filtered } = useMemo(() => {
    const seen = new Set();
    const unique = articles.filter((article) => {
      const key = `${article.title}::${article.created_date || ""}::${article.category || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const filteredArticles =
      selectedCategory === "all"
        ? unique
        : unique.filter((article) => article.category === selectedCategory);

    const ordered = [...filteredArticles].sort((a, b) => {
      const aDate = a.created_date ? new Date(a.created_date).getTime() : 0;
      const bDate = b.created_date ? new Date(b.created_date).getTime() : 0;
      return bDate - aDate;
    });

    return {
      filtered: filteredArticles,
      featuredArticle: ordered[0] || null,
      spotlightArticles: ordered.slice(1, 4),
      archiveArticles: ordered.slice(4),
    };
  }, [articles, selectedCategory]);

  const circuitCount = useMemo(() => articles.filter(isCurrentCircuitArticle).length, [articles]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
          Loading news
        </p>
      </div>
    );
  }

  if (!featuredArticle) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
            News desk
          </p>
          <h1 className="mt-2 text-3xl font-heading font-black tracking-[-0.04em] text-foreground md:text-4xl">
            NEWS
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Latest esports stories and editorial updates.
          </p>
        </div>
        <EmptyState icon={Newspaper} title="No articles yet" description="News articles will appear here." />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
          News desk
        </p>
        <h1 className="mt-2 text-3xl font-heading font-black tracking-[-0.04em] text-foreground md:text-4xl">
          NEWS
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Current circuit stories, patch signals, announcements, and archived updates in one cleaner editorial feed.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <Link to={`/news/${featuredArticle.id}`} className="block w-full overflow-hidden rounded-[32px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,243,235,0.98))] text-left shadow-[0_28px_70px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-1 hover:border-primary/30 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(17,24,39,0.98))]">
        <div className="grid gap-6 px-6 py-6 md:px-8 md:py-8 lg:grid-cols-[1.02fr_0.98fr] lg:px-10">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.22em] text-foreground/70">
              <span className="rounded-full border border-border/80 bg-card px-3 py-1.5 shadow-sm">
                Lead story
              </span>
              <span className="inline-flex items-center gap-2 text-primary">
                <Radio className="h-3.5 w-3.5" />
                Circuit desk live
              </span>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.36em] text-foreground/45">
                Editorial priority
              </p>
              <h2 className="max-w-4xl text-[2.5rem] font-black uppercase leading-[0.92] tracking-[-0.06em] text-foreground md:text-[4rem]">
                {featuredArticle.title}
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                {featuredArticle.content}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              <span className="rounded-full border border-border/80 bg-card px-3 py-1.5 shadow-sm">
                {categoryLabel(featuredArticle.category)}
              </span>
              <span className="rounded-full border border-border/80 bg-card px-3 py-1.5 shadow-sm">
                {featuredArticle.game || "General desk"}
              </span>
              <span className="rounded-full border border-border/80 bg-card px-3 py-1.5 shadow-sm">
                {formatArticleDate(featuredArticle.created_date)}
              </span>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-rows-[1fr_auto]">
            <div className="overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-[0_18px_44px_rgba(15,23,42,0.08)]">
              <ArticleImage article={featuredArticle} heightClass="min-h-[280px] h-full" className="rounded-[28px]" padded />
            </div>

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <SignalCard
                label="Stories"
                value={filtered.length}
                detail="Articles visible inside the current category filter."
                accent="primary"
              />
              <SignalCard
                label="Circuit Focus"
                value={circuitCount}
                detail="Articles tied directly to BGIS or BMPS current-cycle coverage."
              />
              <SignalCard
                label="Category"
                value={categoryLabel(selectedCategory)}
                detail="Active desk filter controlling the article stack."
              />
            </div>
          </div>
        </div>
        </Link>
      </motion.div>

      <LightPanel className="p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              Desk filter
            </p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-foreground">
              Story categories
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition-colors ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {categoryLabel(category)}
              </button>
            ))}
          </div>
        </div>
      </LightPanel>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <LightPanel className="p-6 md:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
                Spotlight
              </p>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-foreground">
                Follow-up stories
              </h2>
            </div>
            <Asterisk className="hidden h-5 w-5 text-primary md:block" />
          </div>

          <div className="mt-5 space-y-4">
            {spotlightArticles.length > 0 ? (
              spotlightArticles.map((article, index) => (
                <Link key={article.id} to={`/news/${article.id}`} className="block w-full text-left">
                  <NewsCard article={article} index={index} compact />
                </Link>
              ))
            ) : (
              <div className="rounded-[22px] border border-border/70 bg-background/75 p-5 text-sm text-muted-foreground">
                No additional spotlight stories for this filter yet.
              </div>
            )}
          </div>
        </LightPanel>

        <LightPanel className="p-6 md:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
                Feed note
              </p>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-foreground">
                Desk posture
              </h2>
            </div>
            <Sparkles className="hidden h-5 w-5 text-primary md:block" />
          </div>

          <div className="mt-5 grid gap-4">
            <div className="rounded-[22px] border border-border/70 bg-background/75 p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Current priority
              </p>
              <p className="mt-2 text-lg font-black uppercase tracking-[-0.03em] text-foreground">
                {isCurrentCircuitArticle(featuredArticle) ? "Current circuit coverage" : "Archive or general coverage"}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The lead story is simply the newest article inside the current filter.
              </p>
            </div>
            <div className="rounded-[22px] border border-border/70 bg-background/75 p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Filter effect
              </p>
              <p className="mt-2 text-lg font-black uppercase tracking-[-0.03em] text-foreground">
                {categoryLabel(selectedCategory)}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Use the desk filter to narrow the feed into the categories currently present in the article stack.
              </p>
            </div>
          </div>
        </LightPanel>
      </section>

      {archiveArticles.length > 0 ? (
        <section className="space-y-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              Archive
            </p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-foreground">
              More stories
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {archiveArticles.map((article, index) => (
              <Link key={article.id} to={`/news/${article.id}`} className="block w-full text-left">
                <NewsCard article={article} index={index} />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
