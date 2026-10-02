import React from "react";
import { CheckCircle2, Pencil, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categoryLabel, formatAdminNewsDate } from "@/components/admin/news/utils/newsEditorHelpers";

export function AdminNewsList({
  visibleArticles,
  openEdit,
  handleQuickPublish,
  handleQuickReject,
  isMutating,
  deleteArticle,
}) {
  return (
    <div className="space-y-2">
      {visibleArticles.map((article) => (
        <div
          key={article.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
        >
          <button
            type="button"
            onClick={() => openEdit(article)}
            className="min-w-0 flex-1 text-left"
          >
            <span className="font-semibold text-sm">{article.title}</span>
            <p className="mt-0.5 text-xs text-muted-foreground" suppressHydrationWarning>
              {categoryLabel(article.category)} - {article.game || "General"} -{" "}
              {formatAdminNewsDate(article.created_date)}
            </p>
            <p className="mt-1 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <span>{article.publication_status || "published"}</span>
              <span>{article.verification_status || "verified"}</span>
              <span>{article.priority || "routine"}</span>
            </p>
          </button>
          <div className="flex gap-1">
            {article.publication_status === "draft" ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleQuickPublish(article)}
                  disabled={isMutating}
                >
                  <CheckCircle2 className="size-4 text-emerald-600" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleQuickReject(article)}
                  disabled={isMutating}
                >
                  <XCircle className="size-4 text-amber-600" />
                </Button>
              </>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => openEdit(article)}
              disabled={isMutating}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => { if (window.confirm("Delete this article?")) deleteArticle.mutate(article.id); }}
              disabled={isMutating}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
