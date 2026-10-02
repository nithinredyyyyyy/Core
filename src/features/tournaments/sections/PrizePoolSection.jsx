import { Table } from "@/components/ui/table";
import React, { useState } from "react";
import { formatUsdAmount } from "@/features/tournaments/utils/detailHelpers";

/** @param {{ stage: string, rows: import("@/types/tournaments").PrizeEntry[] }} props */
export function PrizePoolSection({ stage, rows }) {
  const [expanded, setExpanded] = useState(false);
  const total = rows.reduce((sum, entry) => {
    const value = Number(String(entry?.usd || "").replace(/[^0-9.]/g, ""));
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
  const visibleRows = expanded ? rows : rows.slice(0, 8);
  const hasMore = rows.length > 8;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background/80">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-secondary/30 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-foreground">{stage}</p>
        <p className="text-xs font-semibold text-muted-foreground">
          Total: {formatUsdAmount(total)}
        </p>
      </div>
      <Table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2 text-left">Place</th>
            <th className="px-4 py-2 text-right">$ USD</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {visibleRows.map((entry) => (
            <tr key={`${stage}-${entry.placement}`} className="hover:bg-secondary/20">
              <td className="px-4 py-2 font-semibold">{entry.placement}</td>
              <td className="px-4 py-2 text-right text-muted-foreground">{formatUsdAmount(entry.usd)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      {hasMore ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="w-full border-t border-border px-4 py-2 text-center text-xs font-bold uppercase tracking-[0.12em] text-primary transition hover:bg-secondary/20"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}
