function pickRecordFields(record, fields) {
  if (!record || typeof record !== "object") return record;
  return Object.fromEntries(
    fields
      .filter((field) => record[field] !== undefined)
      .map((field) => [field, record[field]]),
  );
}

export function slimTeamRecord(team) {
  return pickRecordFields(team, [
    "id",
    "name",
    "tag",
    "logo_url",
    "game",
    "region",
    "total_kills",
    "total_points",
    "matches_played",
    "wins",
  ]);
}

export function slimPlayerRecord(player) {
  return pickRecordFields(player, [
    "id",
    "ign",
    "real_name",
    "team_id",
    "role",
    "photo_url",
    "total_kills",
    "matches_played",
    "avg_damage",
  ]);
}

export function slimMatchRecord(match) {
  return pickRecordFields(match, [
    "id",
    "tournament_id",
    "stage",
    "group_name",
    "match_number",
    "map",
    "status",
    "scheduled_time",
    "stream_url",
    "day",
  ]);
}

export function slimMatchResultRecord(result) {
  return pickRecordFields(result, [
    "id",
    "match_id",
    "tournament_id",
    "team_id",
    "placement",
    "kill_points",
    "placement_points",
    "total_points",
    "matches_count",
    "wins_count",
    "stage",
    "publication_status",
  ]);
}

export function stripPageAuditFields(value) {
  if (Array.isArray(value)) return value.map(stripPageAuditFields);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "created_by" && key !== "updated_date")
      .map(([key, entryValue]) => [key, stripPageAuditFields(entryValue)]),
  );
}
