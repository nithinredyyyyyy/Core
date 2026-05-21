import React from "react";

export default function FansPanel({ className = "", children }) {
  return (
    <div
      className={`rounded-[20px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,243,235,0.68))] shadow-[0_16px_38px_rgba(15,23,42,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}
