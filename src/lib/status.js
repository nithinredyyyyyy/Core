/**
 * Single source of truth for every status shown in CORE.
 *
 * Statuses are never communicated through colour alone: each tone also carries
 * a label and, for live states, a shape marker. See `StatusBadge`.
 */

export const STATUS = {
  LIVE: "live",
  ONGOING: "ongoing",
  UPCOMING: "upcoming",
  SCHEDULED: "scheduled",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  POSTPONED: "postponed",
};

/** Canonical display order used by match/tournament boards. */
export const STATUS_ORDER = [
  STATUS.LIVE,
  STATUS.UPCOMING,
  STATUS.COMPLETED,
  STATUS.CANCELLED,
  STATUS.POSTPONED,
];

const STATUS_META = {
  [STATUS.LIVE]: { label: "LIVE", tone: "live", marker: "pulse" },
  [STATUS.ONGOING]: { label: "LIVE", tone: "live", marker: "pulse" },
  [STATUS.UPCOMING]: { label: "UPCOMING", tone: "info", marker: "dot" },
  [STATUS.SCHEDULED]: { label: "UPCOMING", tone: "info", marker: "dot" },
  [STATUS.COMPLETED]: { label: "COMPLETED", tone: "neutral", marker: "dot" },
  [STATUS.CANCELLED]: { label: "CANCELLED", tone: "danger", marker: "dot" },
  [STATUS.POSTPONED]: { label: "POSTPONED", tone: "warning", marker: "dot" },
};

const UNKNOWN_STATUS_META = {
  label: "SCHEDULED",
  tone: "neutral",
  marker: "dot",
};

/**
 * Collapse the many status spellings found across the API (`ongoing`, `live`,
 * `scheduled`, `upcoming`) into the canonical set above.
 */
export function normalizeStatus(status) {
  const raw = String(status ?? "")
    .trim()
    .toLowerCase();
  if (!raw) return STATUS.SCHEDULED;
  if (raw === "live" || raw === "ongoing" || raw === "in_progress") {
    return STATUS.LIVE;
  }
  if (raw === "scheduled" || raw === "upcoming" || raw === "tba") {
    return STATUS.UPCOMING;
  }
  if (raw === "complete" || raw === "finished") return STATUS.COMPLETED;
  if (raw === "canceled") return STATUS.CANCELLED;
  if (raw in STATUS_META) return raw;
  return STATUS.SCHEDULED;
}

export function getStatusMeta(status) {
  return STATUS_META[normalizeStatus(status)] || UNKNOWN_STATUS_META;
}

export function getStatusLabel(status) {
  return getStatusMeta(status).label;
}

export function isLiveStatus(status) {
  return normalizeStatus(status) === STATUS.LIVE;
}

export function isUpcomingStatus(status) {
  return normalizeStatus(status) === STATUS.UPCOMING;
}

export function isCompletedStatus(status) {
  return normalizeStatus(status) === STATUS.COMPLETED;
}

/** Sort helper: live first, then upcoming, then completed, then the rest. */
export function getStatusSortWeight(status) {
  const normalized = normalizeStatus(status);
  const index = STATUS_ORDER.indexOf(normalized);
  return index === -1 ? STATUS_ORDER.length : index;
}
