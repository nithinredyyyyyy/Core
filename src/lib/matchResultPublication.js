export function getMatchResultPublicationStatus(result) {
  const raw = String(result?.publication_status || result?.status || "")
    .trim()
    .toLowerCase();
  if (raw === "draft") return "draft";
  return "published";
}

export function isPublishedMatchResult(result) {
  return getMatchResultPublicationStatus(result) === "published";
}

export function filterPublishedMatchResults(results = []) {
  const matchDraftState = new Map();

  for (const result of results) {
    const matchId = result?.match_id;
    if (!matchId) continue;
    const hasDraft = getMatchResultPublicationStatus(result) !== "published";
    matchDraftState.set(
      matchId,
      matchDraftState.get(matchId) || false || hasDraft,
    );
  }

  return results.filter((result) => {
    if (!isPublishedMatchResult(result)) return false;
    const matchId = result?.match_id;
    if (!matchId) return true;
    return !matchDraftState.get(matchId);
  });
}
