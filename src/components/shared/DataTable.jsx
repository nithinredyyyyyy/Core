import React from "react";
import { cn } from "@/lib/utils";

/**
 * Esports data table.
 *
 * - `columns`: `[{ key, label, align, width, render(row), className }]`
 * - Horizontal scroll is enabled on small screens with a sticky header row so
 *   tables stay readable instead of shrinking to unreadable type.
 */
export default function DataTable({
  columns = [],
  rows = [],
  getRowKey = (row, index) => row?.id ?? index,
  caption = null,
  className = "",
  emptyMessage = "No rows to display.",
  dense = false,
}) {
  const cellPadding = dense ? "px-3 py-2" : "px-3 py-2.5";

  return (
    <div className={cn("relative w-full overflow-x-auto rounded-xl border border-border bg-card", className)}>
      <table className="w-full min-w-[560px] border-collapse text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-border bg-muted/60 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={column.width ? { width: column.width } : undefined}
                className={cn(
                  "sticky top-0 z-10 bg-muted/60 text-left font-bold",
                  cellPadding,
                  column.align === "center" && "text-center",
                  column.align === "right" && "text-right",
                  column.className,
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length || 1}
                className="px-3 py-8 text-center text-sm text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={getRowKey(row, index)}
                className="border-b border-border/70 transition-colors last:border-b-0 hover:bg-muted/40"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "align-middle",
                      cellPadding,
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right",
                      column.cellClassName,
                    )}
                  >
                    {column.render ? column.render(row, index) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
