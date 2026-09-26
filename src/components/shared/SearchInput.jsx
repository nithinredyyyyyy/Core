import React from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared search input. Used by the players/teams directories and the global
 * search overlay so search affordances stay consistent.
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  ariaLabel = "Search",
  className = "",
  autoFocus = false,
  inputRef = null,
  onKeyDown = null,
  trailing = null,
}) {
  return (
    <div className={cn("relative w-full", className)}>
      <SearchIcon
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        role="searchbox"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange?.(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange?.("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      ) : (
        trailing
      )}
    </div>
  );
}
