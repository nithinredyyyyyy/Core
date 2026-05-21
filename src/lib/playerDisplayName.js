function normalizePlayerDisplayKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const PLAYER_DISPLAY_NAME_OVERRIDES = {
  ak: "AK OP",
  akop: "AK OP",
};

export function getPlayerDisplayName(name) {
  return PLAYER_DISPLAY_NAME_OVERRIDES[normalizePlayerDisplayKey(name)] || name;
}

export function normalizePlayerDisplayKeyForLookup(name) {
  return normalizePlayerDisplayKey(name);
}
