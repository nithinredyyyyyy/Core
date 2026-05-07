import React from "react";

function CoreRing({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="core-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#fcd34d" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="23" fill="none" stroke="url(#core-ring-gradient)" strokeWidth="8" strokeDasharray="112 38" strokeLinecap="round" transform="rotate(-32 32 32)" />
      <circle cx="32" cy="32" r="7" fill="#0f172a" opacity="0.9" />
      <path d="M43 20c-3.1-2.8-6.8-4.2-11.1-4.2-8.9 0-16.1 7.2-16.1 16.1S23 48 31.9 48c4.3 0 8-1.4 11.1-4.2" fill="none" stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

function CoreGrid({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="core-grid-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#fdba74" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="44" height="44" rx="14" fill="none" stroke="url(#core-grid-gradient)" strokeWidth="5" />
      <path d="M42 18H30c-7.7 0-14 6.3-14 14s6.3 14 14 14h12" fill="none" stroke="#111827" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M38 24h10M38 40h10" stroke="#111827" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function CorePulse({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="core-pulse-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#facc15" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="22" fill="none" stroke="url(#core-pulse-gradient)" strokeWidth="6" opacity="0.45" />
      <path d="M44 18c-3.2-2.1-6.8-3.2-10.8-3.2-9.9 0-18 8.1-18 18s8.1 18 18 18c4 0 7.6-1.1 10.8-3.2" fill="none" stroke="#111827" strokeWidth="6" strokeLinecap="round" />
      <path d="M24 32h7l3-7 4 14 3-7h7" fill="none" stroke="#111827" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const MARKS = {
  ring: CoreRing,
  grid: CoreGrid,
  pulse: CorePulse,
};

export function BrandMark({ concept = "ring", className = "" }) {
  if (concept === "site") {
    return (
      <img
        src="/images/core-logo.png"
        alt="Core logo"
        className={className}
      />
    );
  }

  const Mark = MARKS[concept] || CoreRing;
  return <Mark className={className} />;
}

export function BrandWordmark({ className = "" }) {
  return (
    <span className={`font-heading text-sm font-black uppercase tracking-[0.28em] text-foreground ${className}`}>
      Core
    </span>
  );
}

export const BRAND_CONCEPTS = [
  {
    id: "ring",
    name: "Core Ring",
    note: "Zone-inspired mark with the strongest esports fit.",
  },
  {
    id: "grid",
    name: "Core Grid",
    note: "Bracket and dashboard feel, more system/product-like.",
  },
  {
    id: "pulse",
    name: "Core Pulse",
    note: "Signal-driven mark with a cleaner tech identity.",
  },
];
