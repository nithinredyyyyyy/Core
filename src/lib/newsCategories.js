export const NEWS_CATEGORY_LABELS = {
  all: "All News",
  tournament: "Tournament News",
  announcement: "Announcements",
  patch_update: "Game Updates",
  roster_change: "Roster News",
  general: "Daily News",
};

export function getNewsCategoryLabel(category) {
  const key = String(category || "").trim();
  if (!key) return "Daily News";
  return (
    NEWS_CATEGORY_LABELS[key] ||
    key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}
