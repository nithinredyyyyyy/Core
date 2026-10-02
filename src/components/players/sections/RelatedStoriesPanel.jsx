import React from "react";
import { Link } from "react-router-dom";
import ProfilePanel from "@/components/shared/ProfilePanel";

export function RelatedStoriesPanel({ articles }) {
  return (
    <ProfilePanel title="Related stories">
      {articles.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No linked stories have been found for this player yet.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {articles.map((article) => (
            <Link
              key={article.id}
              to={`/news/${article.id}`}
              className="block rounded-[18px] border border-border bg-background/75 p-4 transition-colors hover:border-primary/30"
            >
              <p className="text-sm font-semibold text-foreground">
                {article.title}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {article.category?.replace(/_/g, " ") || "Story"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </ProfilePanel>
  );
}
