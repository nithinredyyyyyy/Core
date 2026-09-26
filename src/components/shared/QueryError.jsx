import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * User-facing error state. Never surfaces raw server messages; the caller may
 * pass a friendly override.
 */
export default function QueryError({
  title = "Something went wrong",
  message = "We couldn't load this page. Please try again.",
  onRetry,
  className = "",
}) {
  return (
    <div
      role="alert"
      className={`mx-auto flex min-h-[40vh] w-full max-w-lg items-center justify-center px-6 ${className}`}
    >
      <div className="w-full rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
        </div>
        <h2 className="mt-4 font-heading text-xl font-semibold tracking-[-0.02em] text-foreground">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p>
        {onRetry ? (
          <Button className="mt-5 rounded-full" onClick={onRetry} type="button">
            Try again
          </Button>
        ) : null}
      </div>
    </div>
  );
}
