

export const PLACEMENT_POINTS = { 1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1 };

export const VALID_PLACEMENTS = Array.from({ length: 16 }, (_, index) => index + 1);

export function parsePlacementValue(value) {
  if (value === "" || value === null || typeof value === "undefined") return 0;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(16, Math.max(0, parsed));
}
