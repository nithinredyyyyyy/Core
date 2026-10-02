import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatAdminNewsDate, categoryLabel } from "@/components/admin/news/utils/newsEditorHelpers";

export function ImportedDraftsPanel({
  importedDrafts,
  setFilter,
  openEdit,
  handleQuickPublish,
  handleQuickReject,
  isMutating,
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Imported Drafts ({importedDrafts.length})</h3>
          <p className="text-xs text-muted-foreground">
            Fast review lane for auto-ingested stories waiting on an editor.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setFilter("draft")}>
          View all drafts
        </Button>
      </div>
      <div className="mt-4 space-y-2">
        {importedDrafts.length > 0 ? (
          importedDrafts.slice(0, 8).map((article) => (
            <div
              key={article.id}
              className="rounded-lg border border-border bg-background/60 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => openEdit(article)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="text-sm font-semibold">{article.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground" suppressHydrationWarning>
                    {article.priority || "routine"} - {formatAdminNewsDate(article.created_date)}
                  </p>
                  {article.summary ? (
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                      {article.summary}
                    </p>
                  ) : null}
                  <p className="mt-1 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <span>{article.verification_status || "needs_review"}</span>
                    <span>{categoryLabel(article.category)}</span>
                  </p>
                </button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleQuickPublish(article)}
                    disabled={isMutating}
                  >
                    <CheckCircle2 className="size-4" />
                    Publish
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => handleQuickReject(article)}
                    disabled={isMutating}
                  >
                    <XCircle className="size-4" />
                    Reject
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(article)}
                    disabled={isMutating}
                  >
                    Review
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-border bg-background/60 p-4 text-sm text-muted-foreground">
            No imported drafts waiting right now.
          </div>
        )}
      </div>
    </div>
  );
}
