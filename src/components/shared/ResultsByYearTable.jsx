import React from "react";
import { format } from "date-fns";

export default function ResultsByYearTable({
  buckets = [],
  title = "Results by Year",
  wrapperClassName = "space-y-5 border-t border-border pt-5",
  headingClassName = "text-[11px] font-bold uppercase tracking-[0.18em] text-primary",
  yearClassName = "text-[11px] font-bold uppercase tracking-[0.18em] text-primary",
  tableClassName = "w-full min-w-[760px] text-sm",
  headerRowClassName = "border-b border-border text-left text-[11px] uppercase tracking-[0.18em] text-muted-foreground",
  cellClassName = "px-3 py-3",
  bodyRowClassName = "border-b border-border/70 last:border-b-0",
  hoverRowClassName = "",
}) {
  if (!buckets.length) return null;

  return (
    <div className={wrapperClassName}>
      <p className={headingClassName}>{title}</p>
      {buckets.map((bucket) => (
        <div key={bucket.year} className="space-y-3">
          <p className={yearClassName}>{bucket.year}</p>
          <div className="overflow-x-auto">
            <table className={tableClassName}>
              <thead>
                <tr className={headerRowClassName}>
                  <th className={`${cellClassName} font-bold`}>Date</th>
                  <th className={`${cellClassName} font-bold`}>Place</th>
                  <th className={`${cellClassName} font-bold`}>Tier</th>
                  <th className={`${cellClassName} font-bold`}>Tournament</th>
                  <th className={`${cellClassName} font-bold`}>Team</th>
                  <th className={`${cellClassName} font-bold`}>Prize</th>
                </tr>
              </thead>
              <tbody>
                {bucket.entries.map((entry) => (
                  <tr
                    key={`${bucket.year}-${entry.id}`}
                    className={`${bodyRowClassName}${hoverRowClassName ? ` ${hoverRowClassName}` : ""}`}
                  >
                    <td className={`${cellClassName} text-muted-foreground`}>
                      {entry.date ? format(new Date(entry.date), "yyyy-MM-dd") : "TBA"}
                    </td>
                    <td className={`${cellClassName} font-semibold text-foreground`}>
                      {entry.placement || "-"}
                    </td>
                    <td className={`${cellClassName} text-muted-foreground`}>
                      {entry.tier || "Unrated"}
                    </td>
                    <td className={`${cellClassName} text-foreground`}>
                      {entry.tournament}
                    </td>
                    <td className={`${cellClassName} text-muted-foreground`}>
                      {entry.team}
                    </td>
                    <td className={`${cellClassName} text-muted-foreground`}>
                      {entry.prize || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
