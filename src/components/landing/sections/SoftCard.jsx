import React from "react";

export function SoftCard({ className = "", children }) {
  return (
    <div
      className={`rounded-[30px] border border-brand-cream-edge bg-white shadow-[0_24px_70px_rgba(17,17,17,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}
