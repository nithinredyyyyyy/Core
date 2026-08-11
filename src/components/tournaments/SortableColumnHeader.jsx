import React from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export default function SortableColumnHeader({
  label,
  field,
  tableKey,
  tableSort,
  dispatch,
  align = "left",
}) {
  const isActive = tableSort?.tableKey === tableKey && tableSort?.field === field;
  const SortIcon = isActive
    ? tableSort.direction === "asc"
      ? ChevronUp
      : ChevronDown
    : ChevronsUpDown;

  return (
    <button
      type="button"
      onClick={() => {
        dispatch({ type: "toggleTableSort", payload: { tableKey, field } });
      }}
      className={`inline-flex w-full items-center gap-1 rounded-md text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground transition hover:text-foreground ${
        align === "center" ? "justify-center" : "justify-start"
      }`}
      aria-label={`Sort by ${label}`}
    >
      <span>{label}</span>
      <SortIcon
        className={`size-3.5 shrink-0 stroke-[2.8] ${
          isActive ? "text-primary" : "text-muted-foreground/70"
        }`}
        aria-hidden="true"
      />
    </button>
  );
}
