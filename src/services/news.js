import { base44 } from "@/api/base44Client";

export const NEWS_QUERY_KEY = "news-published";

export function listPublishedNews(limit = 120) {
  return base44.news.listPublished("-created_date", limit);
}

export function getPublishedArticle(articleId) {
  return base44.news.getPublished(articleId);
}
