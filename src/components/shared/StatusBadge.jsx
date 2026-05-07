import React from "react";

const statusStyles = {
  upcoming: "bg-blue-50 text-blue-600 border-blue-200",
  ongoing: "bg-emerald-50 text-emerald-600 border-emerald-200",
  live: "bg-red-50 text-red-600 border-red-200",
  completed: "bg-gray-100 text-gray-500 border-gray-200",
  scheduled: "bg-amber-50 text-amber-600 border-amber-200",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold rounded-full border ${statusStyles[status] || statusStyles.upcoming}`}>
      {(status === "live" || status === "ongoing") && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}