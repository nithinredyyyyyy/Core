import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Section-level header used inside pages and home sections. Renders H2 by
 * default so the page H1 stays unique.
 */
export default function SectionHeader({
  title,
  description = null,
  actionLabel = null,
  actionTo = null,
  className = "",
  as: Heading = "h2",
}) {
  return (
    <div
      className={cn(
        "flex items-end justify-between gap-4 border-b border-border pb-3",
        className,
      )}
    >
      <div className="min-w-0">
        <Heading className="font-heading text-lg font-semibold tracking-[-0.02em] text-foreground">
          {title}
        </Heading>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actionLabel && actionTo ? (
        <Link
          to={actionTo}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {actionLabel}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
