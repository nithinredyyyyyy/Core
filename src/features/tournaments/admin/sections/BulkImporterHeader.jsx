import React from "react";

export function BulkImporterHeader({ previewCount }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          Bulk paste/import
        </p>
        <h3 className="mt-2 text-lg font-semibold">Update tournament data from a table</h3>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Paste from Sheets, Excel, Liquipedia-style tables, or your generated rows. Headers are required so the importer can map columns safely.
        </p>
      </div>
      <div className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
        {previewCount} parsed rows
      </div>
    </div>
  );
}
