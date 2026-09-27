// Liquipedia wikitext parser.
//
// Pure and offline: no database access, no network access. It converts a
// Liquipedia "Grand Finals" section into the CORE canonical extraction payload
// consumed by server/services/enrichment.js. Keeping it free of I/O is what
// makes it unit-testable against captured fixtures without live requests.
//
// Source semantics are preserved rather than inferred:
//   - {{MS|placement|kills}} carries exactly placement and kills.
//   - Placement points come from the source's own published {{Match|p1=..}}
//     table, not from a hardcoded CORE convention.
//   - startingpoints is a carry-over the source may or may not publish. When
//     absent it is recorded as absent (0 with starting_points_available=false)
//     and never invented.

export const PARSER_VERSION = "1.0.0";

export const SOURCE_NAME = "Liquipedia";

// Liquipedia's {{Match|p_kill=..|p1=..}} table: position -> placement points.
export function pointsTableFromMatchTemplate(templateBody) {
  const fields = splitTopLevel(templateBody);
  const table = {};
  for (const field of fields) {
    const m = /^\s*p(\d+)\s*=\s*(-?\d+)\s*$/.exec(field);
    if (m) table[Number(m[1])] = Number(m[2]);
  }
  return table;
}

// Split on top-level `|` only, so nested templates ({{MS|..}}, {{!}}) do not
// fragment a field.
export function splitTopLevel(body) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (let i = 0; i < body.length; i += 1) {
    const pair = body[i] + (body[i + 1] || "");
    if (pair === "{{" || pair === "[[") {
      depth += 1;
      current += pair;
      i += 1;
      continue;
    }
    if (pair === "}}" || pair === "]]") {
      depth -= 1;
      current += pair;
      i += 1;
      continue;
    }
    if (body[i] === "|" && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += body[i];
  }
  parts.push(current);
  return parts;
}

// Return every {{name...}} template with its body, scanning nested templates so
// an enclosing template is matched as one unit.
export function findTemplates(text, name) {
  const open = `{{${name}`;
  const found = [];
  let cursor = 0;
  while (cursor < text.length) {
    const start = text.indexOf(open, cursor);
    if (start === -1) break;
    const next = text[start + open.length];
    if (next !== "|" && next !== "}") {
      cursor = start + open.length;
      continue;
    }
    let depth = 0;
    let end = -1;
    for (let i = start; i < text.length - 1; i += 1) {
      const pair = text[i] + text[i + 1];
      if (pair === "{{") {
        depth += 1;
        i += 1;
      } else if (pair === "}}") {
        depth -= 1;
        i += 1;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    if (end === -1) break;
    found.push({ start, end, body: text.slice(start + 2, end - 2) });
    cursor = end;
  }
  return found;
}

// Decode {{MS|<placement>|<kills>}}. Anything that does not match exactly returns
// null so a malformed token becomes a reported issue, never a silent zero.
export function decodeMs(tokenBody) {
  const fields = splitTopLevel(tokenBody).map((f) => f.trim());
  const numeric = fields.slice(1);
  if (numeric.length !== 2) return null;
  // Reject empty fields explicitly: Number("") is 0, which would turn a missing
  // value into a silent zero.
  if (numeric.some((f) => f === "" || !/^-?\d+$/.test(f))) return null;
  const placement = Number(numeric[0]);
  const kills = Number(numeric[1]);
  if (!Number.isInteger(placement) || !Number.isInteger(kills)) return null;
  return { placement, kills };
}

export function parseKeyValues(fields) {
  const out = {};
  for (const field of fields) {
    const eq = field.indexOf("=");
    if (eq === -1) continue;
    const key = field.slice(0, eq).trim();
    out[key] = field.slice(eq + 1).trim();
  }
  return out;
}

// "2025-07-04 13:10 {{Abbr/IST}}" -> "2025-07-04T13:10:00+05:30". Returns null
// when the source does not carry a usable date; the value is never guessed.
export function parseSourceDate(raw) {
  if (!raw) return null;
  const text = String(raw);
  const iso = /(\d{4})-(\d{2})-(\d{2})[ T]+(\d{1,2}):(\d{2})/.exec(text);
  if (iso) {
    const [, y, mo, d, h, mi] = iso;
    return `${y}-${mo}-${d}T${String(h).padStart(2, "0")}:${mi}:00+05:30`;
  }
  const monthNames = ["january", "february", "march", "april", "may", "june", "july",
    "august", "september", "october", "november", "december"];
  const worded = /([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})\s*[-–]?\s*(\d{1,2}):(\d{2})/.exec(text);
  if (worded) {
    const monthIndex = monthNames.indexOf(worded[1].toLowerCase());
    if (monthIndex !== -1) {
      const mm = String(monthIndex + 1).padStart(2, "0");
      const dd = String(worded[2]).padStart(2, "0");
      return `${worded[3]}-${mm}-${dd}T${String(worded[4]).padStart(2, "0")}:${worded[5]}:00+05:30`;
    }
  }
  return null;
}

// Link/alias noise: "Levi (Indian player){{!}}Levi" -> "Levi". Team display names
// are not passed through this: their parenthetical qualifier is preserved.
export function normalizeSourceRef(value) {
  if (!value) return null;
  return String(value).replace(/\{\{!\}\}/g, "|").split("|").pop().trim() || null;
}

export function slugifyTeam(name) {
  return String(name)
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Normalization for identity matching only. The source writes e.g.
// "4merical esports in" and "genesis esports (indian team)"; the stored names are
// "4Merical Esports" and "Genesis Esports". Both a parenthetical qualifier and a
// trailing region token are stripped for comparison.
export function teamMatchKey(name) {
  return String(name)
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/\s+in\s*$/, " ")
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * Parse the wikitext of one Grand Finals section.
 *
 * @param {string} wikitext
 * @param {{ expectedMatches?: number, expectedTeams?: number }} [options]
 */
export function parseGrandFinalsWikitext(wikitext, options = {}) {
  const expectedMatches = options.expectedMatches ?? 18;
  const expectedTeams = options.expectedTeams ?? 16;
  const issues = [];
  const text = String(wikitext ?? "");

  // Placement points table, published by the source itself.
  const matchTemplates = findTemplates(text, "Match");
  const pointsTable = matchTemplates.length > 0
    ? pointsTableFromMatchTemplate(matchTemplates[0].body)
    : {};
  if (Object.keys(pointsTable).length === 0) {
    issues.push({ code: "MISSING_POINTS_TABLE", detail: "no {{Match|p1=..}} placement table found" });
  }

  // Matches, in source order. Every {{Map}} is one match.
  const mapTemplates = findTemplates(text, "Map");
  const matches = mapTemplates.map((template, index) => {
    const kv = parseKeyValues(splitTopLevel(template.body));
    const scheduled = parseSourceDate(kv.date);
    return {
      match_number: index + 1,
      map: kv.map ?? null,
      scheduled_time: scheduled,
      scheduled_time_raw: kv.date ?? null,
      status: kv.finished === "true" ? "completed" : "scheduled",
      day: null,
      vod_url: kv.vod ?? null,
      mvp: normalizeSourceRef(kv.mvp),
    };
  });

  if (matches.length !== expectedMatches) {
    issues.push({
      code: "MATCH_COUNT_MISMATCH",
      detail: `expected ${expectedMatches} matches, found ${matches.length}`,
    });
  }
  for (const match of matches) {
    if (!match.map) {
      issues.push({ code: "MISSING_MATCH_MAP", detail: `match ${match.match_number} has no map` });
    }
    if (!match.scheduled_time) {
      issues.push({ code: "MISSING_MATCH_DATE", detail: `match ${match.match_number} has no usable date` });
    }
  }

  // Per-team per-match matrix.
  const opponentTemplates = findTemplates(text, "TeamOpponent");
  const teams = [];
  const matrix = {};
  const seenSlugs = new Set();

  for (const template of opponentTemplates) {
    // fields[0] is the template name ("TeamOpponent"); fields[1] is the team.
    const fields = splitTopLevel(template.body);
    const rawName = (fields[1] ?? "").trim();
    if (!rawName) continue;
    const kv = parseKeyValues(fields.slice(2));
    const entries = {};
    for (const [key, value] of Object.entries(kv)) {
      const m = /^m(\d+)$/.exec(key);
      if (!m) continue;
      const msBody = /^\{\{MS\|(.*)\}\}$/.exec(value);
      const decoded = msBody ? decodeMs(`MS|${msBody[1]}`) : null;
      if (!decoded) {
        // The field exists but is not a decodable {{MS}} token: report, do not guess.
        issues.push({
          code: "MALFORMED_MS",
          detail: `${rawName} ${key}: not a decodable {{MS}} token (${value})`,
        });
        continue;
      }
      entries[Number(m[1])] = decoded;
    }
    if (Object.keys(entries).length === 0) continue;

    const slug = slugifyTeam(rawName);
    if (seenSlugs.has(slug)) {
      issues.push({ code: "DUPLICATE_TEAM_SLUG", detail: `${rawName} -> ${slug}` });
    }
    seenSlugs.add(slug);

    for (let n = 1; n <= matches.length; n += 1) {
      if (!entries[n]) {
        issues.push({
          code: "MISSING_TEAM_MATCH_ENTRY",
          detail: `${rawName} has no entry for match ${n}`,
        });
      }
    }

    teams.push({
      name: rawName,
      slug,
      match_key: teamMatchKey(rawName),
      startingpoints: kv.startingpoints ? Number(kv.startingpoints) : 0,
      starting_points_available: Object.prototype.hasOwnProperty.call(kv, "startingpoints"),
    });
    matrix[slug] = entries;
  }

  if (teams.length !== expectedTeams) {
    issues.push({
      code: "TEAM_COUNT_MISMATCH",
      detail: `expected ${expectedTeams} teams, found ${teams.length}`,
    });
  }

  return { matches, teams, matrix, pointsTable, issues, sourceMatchCount: matches.length };
}

/**
 * Flatten the parsed matrix into per-match result rows. The raw source split is
 * preserved and the total is taken directly from the source arithmetic.
 */
export function buildResultRows({ parsed, teamIdByKey }) {
  const { matches, teams, matrix, pointsTable } = parsed;
  const rows = [];
  for (const team of teams) {
    const teamId = teamIdByKey[team.match_key] ?? null;
    const entries = matrix[team.slug] || {};
    for (const match of matches) {
      const entry = entries[match.match_number];
      if (!entry) continue;
      const hasPoints = Object.prototype.hasOwnProperty.call(pointsTable, entry.placement);
      const placementPoints = hasPoints ? pointsTable[entry.placement] : 0;
      const startingPoints = team.startingpoints;
      rows.push({
        match_number: match.match_number,
        map: match.map,
        team_id: teamId,
        team_name: team.name,
        team_match_key: team.match_key,
        placement: entry.placement,
        kills: entry.kills,
        // Schema mapping: kill_points = kills + startingpoints. For this stage
        // startingpoints is not published, so kill_points === kills.
        kill_points: entry.kills + startingPoints,
        starting_points: startingPoints,
        starting_points_available: team.starting_points_available,
        placement_points: placementPoints,
        placement_points_source: hasPoints ? "source_points_table" : "outside_points_table",
        total_points: entry.kills + placementPoints + startingPoints,
        wins_count: entry.placement === 1 ? 1 : 0,
      });
    }
  }
  return rows;
}

export const DISPUTED_SPLIT_TOTAL_AGREES = "DISPUTED_SPLIT_TOTAL_AGREES";
export const FIELD_EXACT = "FIELD_EXACT";
export const IDENTITY_UNRESOLVED = "IDENTITY_UNRESOLVED";
export const TOTALS_ONLY_AGREE = "TOTALS_ONLY_AGREE";

/**
 * Classify a source row against the existing CORE-derived value. Never chooses a
 * winner: an equal total with a different kill/placement split is a dispute to be
 * adjudicated, not a value to silently normalize.
 */
export function classifyRow(source, core) {
  if (!core) return IDENTITY_UNRESOLVED;
  const coreStarting = core.starting_points ?? 0;
  const exact =
    source.kills === core.kill_points &&
    source.placement_points === core.placement_points &&
    source.starting_points === coreStarting &&
    source.total_points === core.total_points;
  if (exact) return FIELD_EXACT;
  if (source.total_points === core.total_points) return DISPUTED_SPLIT_TOTAL_AGREES;
  return TOTALS_ONLY_AGREE;
}

/**
 * Assemble the canonical payload. `playerStats` is intentionally empty: Liquipedia
 * does not publish per-match player statistics. The absence is recorded
 * explicitly, never as an extraction failure.
 */
export function buildCanonicalPayload({
  tournament,
  stage,
  parsed,
  teamIdByKey,
  source,
  reconciledRows = [],
  identityUnresolved = [],
}) {
  const rows = buildResultRows({ parsed, teamIdByKey });
  const stageSlug = String(stage).toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const matches = parsed.matches.map((match) => {
    const sourceSlug = `${source.slug_prefix}:${stageSlug}:m${match.match_number}`;
    return {
      stage,
      match_number: match.match_number,
      map: match.map,
      status: match.status,
      scheduled_time: match.scheduled_time,
      day: null,
      group_name: null,
      source_slug: sourceSlug,
      source_url: `${source.page_url}#${stageSlug}-m${match.match_number}`,
      source_name: source.source_name,
      vod_url: match.vod_url,
      mvp: match.mvp,
    };
  });
  const slugByNumber = new Map(matches.map((m) => [m.match_number, m.source_slug]));

  const resultsByMatch = {};
  const matchResults = rows.map((row) => {
    const sourceSlug = slugByNumber.get(row.match_number);
    const enriched = {
      ...row,
      match_source_slug: sourceSlug,
      source_ref: `${sourceSlug}#${row.team_match_key}`,
      source_url: `${source.page_url}#${stageSlug}-m${row.match_number}`,
      publication_status: "published",
    };
    (resultsByMatch[sourceSlug] ||= []).push(enriched);
    return enriched;
  });

  return {
    tournament,
    stage,
    matches,
    match_results: matchResults,
    resultsByMatch,
    playerStats: [],
    source: {
      source_name: source.source_name,
      source_url: source.page_url,
      retrieved_at: source.retrieved_at,
      checksum: source.checksum,
      parser_version: PARSER_VERSION,
    },
    provenance: {
      source_name: source.source_name,
      source_url: source.page_url,
      source_page: source.page_name,
      retrieved_at: source.retrieved_at,
      checksum: source.checksum,
      parser_version: PARSER_VERSION,
      license: source.license,
    },
    validation: {
      expected_matches: 18,
      expected_teams_per_match: 16,
      expected_result_rows: 288,
      extracted_matches: matches.length,
      extracted_result_rows: matchResults.length,
      player_match_stats: 0,
      player_match_stats_status: "SOURCE_NOT_AVAILABLE",
      player_match_stats_reason:
        "Liquipedia source does not publish per-match player statistics for this stage.",
      points_table: parsed.pointsTable,
      issues: parsed.issues,
      reconciliation: reconciledRows,
      identity_unresolved: identityUnresolved,
    },
  };
}

// Validate the source arithmetic: kill_points and total_points as the schema
// maps them. The source publishes one raw split only, so there is no separate
// "display" column to cross-check; the invariants asserted are the ones the
// source does support.
export function validateArithmetic(payload) {
  const errors = [];
  const seen = new Set();
  for (const row of payload.match_results) {
    const key = `${row.match_number}:${row.team_match_key}`;
    if (seen.has(key)) {
      errors.push({ code: "DUPLICATE_RESULT_ROW", detail: `${key} appears more than once` });
    }
    seen.add(key);

    // kill_points = kills + startingpoints (the source's own carry-over model).
    if (row.kills + row.starting_points !== row.kill_points) {
      errors.push({
        code: "KILL_POINTS_MISMATCH",
        detail: `match ${row.match_number} ${row.team_name}: kill_points ${row.kill_points} != kills ${row.kills} + starting ${row.starting_points}`,
      });
    }
    // total_points = kills + placement_points + startingpoints.
    const expected = row.kills + row.placement_points + row.starting_points;
    if (row.total_points !== expected) {
      errors.push({
        code: "TOTAL_POINTS_MISMATCH",
        detail: `match ${row.match_number} ${row.team_name}: total ${row.total_points} != ${expected}`,
      });
    }
    // A source that does not publish startingpoints must be recorded as absent,
    // never silently treated as a real zero.
    if (!row.starting_points_available && row.starting_points !== 0) {
      errors.push({
        code: "STARTING_POINTS_INVENTED",
        detail: `match ${row.match_number} ${row.team_name}: starting points invented for a source that does not publish them`,
      });
    }
    if (row.placement == null || !Number.isInteger(row.placement)) {
      errors.push({
        code: "INVALID_PLACEMENT",
        detail: `match ${row.match_number} ${row.team_name}: placement is not an integer`,
      });
    }
  }
  return errors;
}
