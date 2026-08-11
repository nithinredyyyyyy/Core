import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Calendar({
  events = [],
  className = "",
  onDateClick,
  selectedDate,
}) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const todayDate = today.getDate();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const startDay = getFirstDayOfMonth(currentYear, currentMonth);

  const eventDates = useMemo(() => {
    const map = {};
    for (const ev of events) {
      const d = ev.date ? new Date(ev.date) : null;
      if (d && d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(ev);
      }
    }
    return map;
  }, [events, currentYear, currentMonth]);

  const cells = useMemo(() => {
    const result = [];
    for (let i = 0; i < startDay; i++) {
      result.push({ key: `empty-${i}`, empty: true });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      result.push({
        key: `day-${day}`,
        day,
        isToday: day === todayDate,
        isSelected: selectedDate === day,
        hasEvents: Boolean(eventDates[day]),
        events: eventDates[day] || [],
      });
    }
    return result;
  }, [startDay, daysInMonth, todayDate, selectedDate, eventDates]);

  return (
    <div className={`overflow-hidden rounded-2xl border border-border bg-card shadow-sm ${className}`}>
      <div className="bg-brand-navy px-5 py-4">
        <p className="text-sm font-black uppercase tracking-[0.1em] text-white">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </p>
      </div>

      <div className="bg-secondary/30 px-4 py-3">
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="py-1 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4 pt-2">
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((cell) =>
            cell.empty ? (
              <div key={cell.key} className="aspect-square" />
            ) : (
              <button
                key={cell.key}
                type="button"
                onClick={() => onDateClick?.(cell.day, cell.events)}
                className={`relative aspect-square rounded-xl text-sm font-medium transition-all active:scale-95 ${
                  cell.isToday
                    ? "bg-primary font-bold text-primary-foreground shadow-md shadow-primary/25"
                    : cell.isSelected
                      ? "bg-primary/10 font-bold text-primary"
                      : cell.hasEvents
                        ? "bg-secondary font-semibold text-foreground hover:bg-secondary/80"
                        : "text-foreground hover:bg-secondary/50"
                }`}
              >
                {cell.day}
                {cell.hasEvents && !cell.isToday ? (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                ) : null}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
