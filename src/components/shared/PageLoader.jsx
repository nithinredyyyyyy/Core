import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route-level loading fallback used by Suspense boundaries and query gates.
 * Renders a neutral skeleton rather than a blank screen.
 */
export default function PageLoader({
  label = "Loading",
  className = "min-h-[62vh]",
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`mx-auto flex w-full max-w-5xl items-start justify-center ${className}`}
    >
      <span className="sr-only">{label}</span>
      <div className="w-full space-y-5">
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
