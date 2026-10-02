import React from "react";

export function Shell({ eyebrow, title, body, id, children }) {
  return (
    <section id={id} className="landing-section mx-auto max-w-[var(--content-max-width)] px-4 sm:px-6">
      <div className="text-center">
        <p className="type-kicker text-brand-mint">
          {eyebrow}
        </p>
        <h2 className="type-display-section mt-4 text-brand-ink-pure">
          {title}
        </h2>
        {body ? (
          <p className="type-body mt-4 text-brand-slate-stone">
            {body}
          </p>
        ) : null}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}
