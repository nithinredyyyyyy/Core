import React from "react";
import { Link } from "react-router-dom";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Meaningful empty state. Always explains what is missing and offers a next
 * action instead of printing "No data".
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = "Nothing here yet",
  description = "This section will populate once data is available.",
  actionLabel = null,
  actionTo = null,
  onAction = null,
  className = "",
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="mt-4 font-heading text-base font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {actionLabel && (actionTo || onAction) ? (
        actionTo ? (
          <Link
            to={actionTo}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAction}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {actionLabel}
          </button>
        )
      ) : null}
    </div>
  );
}
