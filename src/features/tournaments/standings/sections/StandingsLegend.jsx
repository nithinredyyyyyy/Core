import React from "react";

export function StandingsLegend({ legendItems }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
      {legendItems.map(([label, dotClass]) => (
        <div key={label} className="flex items-center gap-2">
          <span className={`h-3.5 w-3.5 rounded ${dotClass}`} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
