import React from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminNewsHeader({
  articles,
  isMutating,
  backfillImportedMetadata,
  importArticles,
  openCreate,
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <h2 className="font-semibold">News Articles ({articles.length})</h2>
        <p className="text-xs text-muted-foreground">
          Imported stories land as drafts until you review and publish them.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => backfillImportedMetadata.mutate()}
          size="sm"
          className="gap-2"
          disabled={isMutating}
        >
          <RefreshCw
            className={`size-4 ${backfillImportedMetadata.isPending ? "animate-spin" : ""}`}
          />
          Refresh Draft Metadata
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => importArticles.mutate()}
          size="sm"
          className="gap-2"
          disabled={isMutating}
        >
          <RefreshCw
            className={`size-4 ${importArticles.isPending ? "animate-spin" : ""}`}
          />
          Import Sources
        </Button>
        <Button
          type="button"
          onClick={openCreate}
          size="sm"
          className="gap-2"
          disabled={isMutating}
        >
          <Plus className="size-4" />
          New Article
        </Button>
      </div>
    </div>
  );
}
