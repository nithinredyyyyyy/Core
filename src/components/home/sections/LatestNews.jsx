import React from "react";
import { Newspaper } from "lucide-react";
import SectionHeader from "@/components/shared/SectionHeader";
import NewsCard from "@/components/shared/NewsCard";
import EmptyState from "@/components/shared/EmptyState";

/** Latest published news stories. Image-first cards, real article data only. */
export default function LatestNews({ articles = [] }) {
  return (
    <section>
      <SectionHeader
        title="Latest news"
        description="Circuit stories, roster moves, and announcements."
        actionLabel="All news"
        actionTo="/news"
      />

      {articles.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          className="mt-4"
          title="No news yet"
          description="Published BGMI esports stories will appear here."
          actionLabel="Open news"
          actionTo="/news"
        />
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.slice(0, 3).map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </section>
  );
}
