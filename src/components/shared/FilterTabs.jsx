import React from "react";
import { cn } from "@/lib/utils";

/**
 * Filter/tab pill row used by Match Center, Tournaments, News, and Rankings.
 * Renders real buttons with proper pressed state so keyboard and screen-reader
 * users get the same affordance as pointer users.
 */
export default function FilterTabs({
  options = [],
  value,
  onChange,
  className = "",
  ariaLabel = "Filters",
  size = "md",
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(option.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              size === "sm"
                ? "min-h-9 px-3 text-[10px]"
                : "min-h-11 px-4 text-[11px]",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {option.label}
            {typeof option.count === "number" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px]",
                  active ? "bg-primary-foreground/20" : "bg-muted",
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
