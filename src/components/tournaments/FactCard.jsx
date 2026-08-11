import React from 'react';


/**
 * Reusable card to display a fact with an icon.
 * Props:
 *  - label: string – the name of the fact (e.g., "Prize Pool")
 *  - value: string – the value to display (e.g., "TBA")
 *  - icon: React element – the icon component to render
 */
export default function FactCard({ label, value, icon, variant = 'default' }) {
  const baseClasses = "rounded-[24px] p-6 transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between min-h-[140px]";
  
  const variants = {
    default: "bg-white dark:bg-card border border-border shadow-sm text-foreground",
    lime: "bg-brand-lime text-black border-none shadow-md",
    dark: "bg-brand-ink-mid text-white border-none shadow-md",
    blue: "bg-primary text-white border-none shadow-md"
  };

  const textClasses = {
    default: "text-primary",
    lime: "text-black/70",
    dark: "text-white/70",
    blue: "text-white/80"
  };

  return (
    <div className={`${baseClasses} ${variants[variant]}`}>
      <p className={`text-xs font-bold uppercase tracking-[0.18em] flex items-center gap-2 ${textClasses[variant]}`}>
        {icon && React.cloneElement(icon, { className: 'size-4' })}
        {label}
      </p>
      <p className="mt-4 text-3xl font-heading font-semibold tracking-[-0.04em]">
        {value}
      </p>
    </div>
  );
}
