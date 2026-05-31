import React from "react";

export default function FansPanel({ className = "", children }) {
  return (
    <div
      className={`rounded-[24px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,244,236,0.92)_56%,rgba(244,239,231,0.88)_100%)] shadow-[0_20px_48px_rgba(15,23,42,0.08)] transition-colors dark:bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(11,18,30,0.96))] ${className}`}
    >
      {children}
    </div>
  );
}
