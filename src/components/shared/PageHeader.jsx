import React from "react";
import { cn } from "@/lib/utils";

/**
 * Page-level header. One H1 per page, with an optional kicker, description, and
 * trailing actions slot. Keeps heading hierarchy consistent across the app.
 */
export default function PageHeader({
  kicker = null,
  title,
  description = null,
  actions = null,
  className = "",
  children = null,
}) {
  return (
    <header className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          {kicker ? (
            <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-primary">
              {kicker}
            </p>
          ) : null}
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {children}
    </header>
  );
}
