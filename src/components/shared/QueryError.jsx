import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QueryError({
  title = "Something went wrong",
  message = "We couldn't load this page. Try again in a moment.",
  onRetry,
}) {
  return (
    <div className="mx-auto flex min-h-[40vh] w-full max-w-lg items-center justify-center px-6">
      <div className="rounded-[24px] border border-destructive/20 bg-destructive/5 p-8 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-6 text-destructive" />
        </div>
        <h2 className="mt-4 text-xl font-heading font-semibold tracking-wide text-foreground">
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
