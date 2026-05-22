export const NEWS_SOURCE_TYPES = {
  RSS: "rss",
  JSON: "json",
  PRESS: "press",
  SOCIAL: "social",
};

export const NEWS_SOURCES = [
  {
    id: "google-news-bgmi",
    name: "Google News BGMI",
    type: NEWS_SOURCE_TYPES.RSS,
    url: "https://news.google.com/rss/search?q=BGMI%20esports&hl=en-IN&gl=IN&ceid=IN:en",
    category: "general",
    game: "BGMI",
    enabled: true,
    priority: "important",
  },
  {
    id: "google-news-bmps",
    name: "Google News BMPS",
    type: NEWS_SOURCE_TYPES.RSS,
    url: "https://news.google.com/rss/search?q=BMPS%20BGMI&hl=en-IN&gl=IN&ceid=IN:en",
    category: "tournament",
    game: "BGMI",
    enabled: true,
    priority: "important",
  },
  {
    id: "google-news-bgis",
    name: "Google News BGIS",
    type: NEWS_SOURCE_TYPES.RSS,
    url: "https://news.google.com/rss/search?q=BGIS%20BGMI&hl=en-IN&gl=IN&ceid=IN:en",
    category: "tournament",
    game: "BGMI",
    enabled: false,
    priority: "routine",
  },
];

export function getEnabledNewsSources(selectedIds = []) {
  const selected = new Set(
    Array.isArray(selectedIds)
      ? selectedIds.map((value) => String(value || "").trim()).filter(Boolean)
      : [],
  );

  return NEWS_SOURCES.filter((source) => {
    if (selected.size === 0) return source.enabled;
    return selected.has(source.id);
  });
}
