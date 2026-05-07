import React from "react";

function joinClassNames(...values) {
  return values.filter(Boolean).join(" ");
}

export default function ProfilePanel({
  title,
  children,
  className = "",
  titleClassName = "text-[11px] font-bold uppercase tracking-[0.24em] text-primary",
  panelClassName = "rounded-[24px] border border-border bg-card p-5 shadow-sm",
}) {
  return (
    <div className={joinClassNames(panelClassName, className)}>
      <p className={titleClassName}>{title}</p>
      {children}
    </div>
  );
}
