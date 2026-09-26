import { format, formatDistanceToNowStrict, isSameDay } from "date-fns";

const DEFAULT_FALLBACK = "TBA";

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "26 Sep 2026" — used by news, cards, and meta rows. */
export function formatDate(value, fallback = DEFAULT_FALLBACK) {
  const date = toDate(value);
  return date ? format(date, "d MMM yyyy") : fallback;
}

/** "26 Sep 2026, 7:30 PM" — used by match schedules. */
export function formatDateTime(value, fallback = DEFAULT_FALLBACK) {
  const date = toDate(value);
  return date ? format(date, "d MMM yyyy, h:mm a") : fallback;
}

/** "7:30 PM" — compact time for match cards. */
export function formatTime(value, fallback = "Time TBA") {
  const date = toDate(value);
  return date ? format(date, "h:mm a") : fallback;
}

/** "Sep 22 – Oct 18, 2026" — tournament windows. */
export function formatDateRange(startValue, endValue, fallback = "Dates TBA") {
  const start = toDate(startValue);
  const end = toDate(endValue);
  if (!start && !end) return fallback;
  if (start && !end) return formatDate(start, fallback);
  if (!start && end) return formatDate(end, fallback);
  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  }
  return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
}

/** "Today", "Tomorrow", or the formatted date. */
export function formatRelativeDay(value, now = new Date()) {
  const date = toDate(value);
  if (!date) return DEFAULT_FALLBACK;
  if (isSameDay(date, now)) return "Today";
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isSameDay(date, tomorrow)) return "Tomorrow";
  return formatDate(date);
}

/** "3 hours ago" — used by rankings/news freshness labels. */
export function formatRelativeTime(value, fallback = "") {
  const date = toDate(value);
  if (!date) return fallback;
  try {
    return `${formatDistanceToNowStrict(date)} ago`;
  } catch {
    return formatDate(date, fallback);
  }
}

/** Estimated reading time from an article body. */
export function estimateReadingTime(...textParts) {
  const words = textParts
    .flatMap((part) => (typeof part === "string" ? part.split(/\s+/) : []))
    .filter(Boolean).length;
  if (words === 0) return "";
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

/** "1,234" — safe numeric formatting for stats tables. */
export function formatNumber(value, fallback = "—") {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return number.toLocaleString("en-IN");
}

/** "109 pts" style value used by standings tables. */
export function formatPoints(value, fallback = "—") {
  const number = Number(value);
  return Number.isFinite(number) ? `${number}` : fallback;
}
