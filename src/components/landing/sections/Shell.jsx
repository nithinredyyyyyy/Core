import React from "react";

export function Shell({ eyebrow, title, body, id, children }) {
  return (
    <section id={id} className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
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
