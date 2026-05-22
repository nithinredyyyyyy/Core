const CURRENT_CIRCUIT_PATTERNS = [/2026/i, /bmps/i, /bgis/i];

export function isCurrentCircuitArticle(article) {
  const text =
    `${article?.title || ""} ${article?.content || ""}`.toLowerCase();
  return CURRENT_CIRCUIT_PATTERNS.some((pattern) => pattern.test(text));
}
