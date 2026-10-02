import React from "react";
import { MINI_PREVIEW_ACCENT_CLASSES } from "@/components/landing/utils/landingConstants";

export function MiniPreview({ step, title, body, accent = "mint" }) {
  return (
    <div className="rounded-[26px] border border-brand-cream-line-soft bg-brand-cream-cloud p-4">
      <div
        className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${MINI_PREVIEW_ACCENT_CLASSES[accent] || MINI_PREVIEW_ACCENT_CLASSES.mint}`}
      >
        {step}
      </div>
      <p className="type-title-md mt-5 text-brand-ink-pure">
        {title}
      </p>
      <p className="type-caption mt-2 text-brand-slate-bone">{body}</p>
    </div>
  );
}
