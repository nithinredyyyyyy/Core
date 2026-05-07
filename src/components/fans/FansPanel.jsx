import React from "react";

export default function FansPanel({ className = "", children }) {
  return (
    <div
      className={`rounded-[18px] border border-[#d9e1ef] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}
