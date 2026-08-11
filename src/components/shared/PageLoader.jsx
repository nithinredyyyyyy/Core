import React from "react";

export default function PageLoader({
  label = "Loading",
  className = "min-h-[62vh]",
}) {
  return (
    <div className={`mx-auto flex w-full max-w-6xl items-center justify-center ${className}`}>
      <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
          {label}
        </p>
        <div className="mt-5 space-y-3">
          <div className="h-8 w-3/4 rounded-full bg-secondary" />
          <div className="h-4 w-full rounded-full bg-secondary/70" />
          <div className="h-4 w-2/3 rounded-full bg-secondary/70" />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-24 rounded-lg border border-border bg-secondary/30"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
