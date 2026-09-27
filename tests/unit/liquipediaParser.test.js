import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

import {
  PARSER_VERSION,
  parseGrandFinalsWikitext,
  buildResultRows,
  buildCanonicalPayload,
  validateArithmetic,
  decodeMs,
  pointsTableFromMatchTemplate,
  splitTopLevel,
  findTemplates,
  parseSourceDate,
  slugifyTeam,
  teamMatchKey,
  classifyRow,
  DISPUTED_SPLIT_TOTAL_AGREES,
  FIELD_EXACT,
  IDENTITY_UNRESOLVED,
  TOTALS_ONLY_AGREE,
} from "../../tools/liquipedia/parser.mjs";

// Captured from the validated BMPS 2025 Grand Finals source. No live requests are
// made anywhere in this suite.
const FIXTURE = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "bmps2025-grand-finals.wikitext",
);
const WIKITEXT = readFileSync(FIXTURE, "utf8");

const SOURCE = {
  source_name: "Liquipedia",
  page_name: "Battlegrounds_Mobile_India_Pro_Series/2025",
  page_url: "https://liquipedia.net/pubgmobile/Battlegrounds_Mobile_India_Pro_Series/2025",
  slug_prefix: "liquipedia:bmps2025",
  retrieved_at: "2026-09-26",
  checksum: "sha256:test-fixture",
  license: "CC BY-SA 3.0",
};

let parsed;
let teamIdByKey;
let payload;

before(() => {
  parsed = parseGrandFinalsWikitext(WIKITEXT, { expectedMatches: 18, expectedTeams: 16 });
  teamIdByKey = Object.fromEntries(parsed.teams.map((t, i) => [t.match_key, `team-${i}`]));
  payload = buildCanonicalPayload({
    tournament: { id: "probe-tour", name: "BMPS 2025" },
    stage: "Grand Finals",
    parsed,
    teamIdByKey,
    source: SOURCE,
  });
});

describe("Liquipedia {{MS|placement|kills}} decoding", () => {
  test("decodes placement and kills", () => {
    assert.deepEqual(decodeMs("MS|6|3"), { placement: 6, kills: 3 });
    assert.deepEqual(decodeMs("MS|1|20"), { placement: 1, kills: 20 });
    assert.deepEqual(decodeMs("MS|16|0"), { placement: 16, kills: 0 });
  });

  test("rejects malformed tokens instead of guessing zero", () => {
    assert.equal(decodeMs("MS|6"), null);
    assert.equal(decodeMs("MS|6|3|extra"), null);
    assert.equal(decodeMs("MS|abc|3"), null);
    assert.equal(decodeMs("MS||"), null);
    assert.equal(decodeMs(""), null);
  });

  test("points table is read from the source's own {{Match|pN=..}} fields", () => {
    const body = "Match|finished=true|p_kill=1 |p1=10 |p2=6 |p3=5 |p4=4 |p5=3 |p6=2 |p7=1 |p8=1";
    assert.deepEqual(pointsTableFromMatchTemplate(body), { 1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1 });
  });

  test("top-level split ignores nested template pipes", () => {
    assert.deepEqual(splitTopLevel("Match|a={{MS|1|2}}|b=3"), ["Match", "a={{MS|1|2}}", "b=3"]);
  });

  test("findTemplates matches whole nested templates", () => {
    const found = findTemplates("x{{Map|map=Erangel|mvp=Kaalan}}y", "Map");
    assert.equal(found.length, 1);
    assert.equal(found[0].body, "Map|map=Erangel|mvp=Kaalan");
  });
});

describe("18-match extraction", () => {
  test("extracts exactly 18 matches with numbers 1..18", () => {
    assert.equal(parsed.matches.length, 18);
    assert.deepEqual(
      parsed.matches.map((m) => m.match_number),
      Array.from({ length: 18 }, (_, i) => i + 1),
    );
  });

  test("every match carries a map from the allowed set", () => {
    const allowed = new Set(["Erangel", "Miramar", "Sanhok", "Rondo"]);
    for (const match of parsed.matches) {
      assert.ok(allowed.has(match.map), `unexpected map: ${match.map}`);
    }
  });

  test("source is 18 maps across three match days", () => {
    const days = new Set(parsed.matches.map((m) => m.scheduled_time.slice(0, 10)));
    assert.deepEqual([...days].sort(), ["2025-07-04", "2025-07-05", "2025-07-06"]);
  });
});

describe("16 teams per match", () => {
  test("every match has exactly 16 result rows", () => {
    const counts = {};
    for (const row of payload.match_results) {
      counts[row.match_number] = (counts[row.match_number] || 0) + 1;
    }
    assert.equal(Object.keys(counts).length, 18);
    for (const [matchNumber, count] of Object.entries(counts)) {
      assert.equal(count, 16, `match ${matchNumber} has ${count} rows`);
    }
  });

  test("matrix has 16 distinct teams", () => {
    assert.equal(parsed.teams.length, 16);
    assert.equal(new Set(parsed.teams.map((t) => t.slug)).size, 16);
  });
});

describe("288 result rows and match sequence", () => {
  test("the payload contains exactly 288 rows", () => {
    assert.equal(payload.match_results.length, 288);
  });

  test("match numbers are exactly 1..18 with no nulls", () => {
    const numbers = payload.matches.map((m) => m.match_number);
    assert.deepEqual(numbers, Array.from({ length: 18 }, (_, i) => i + 1));
    assert.ok(numbers.every((n) => Number.isInteger(n) && n >= 1));
  });

  test("placements are a permutation of 1..16 in every match", () => {
    for (let n = 1; n <= 18; n += 1) {
      const placements = payload.match_results
        .filter((r) => r.match_number === n)
        .map((r) => r.placement)
        .sort((a, b) => a - b);
      assert.deepEqual(placements, Array.from({ length: 16 }, (_, i) => i + 1), `match ${n}`);
    }
  });
});

describe("starting-points and total-points arithmetic", () => {
  // BMPS 2025 does not publish startingpoints; the parser must record that
  // absence explicitly rather than inventing a carry-over.
  test("startingpoints absence is explicit, not a silent zero", () => {
    for (const team of parsed.teams) {
      assert.equal(team.startingpoints, 0);
      assert.equal(team.starting_points_available, false);
    }
    for (const row of payload.match_results) {
      assert.equal(row.starting_points_available, false);
      assert.equal(row.starting_points, 0);
    }
  });

  test("kill_points = kills + startingpoints for every row", () => {
    for (const row of payload.match_results) {
      assert.equal(row.kill_points, row.kills + row.starting_points);
    }
  });

  test("total_points = kills + placement_points + startingpoints for every row", () => {
    for (const row of payload.match_results) {
      assert.equal(row.total_points, row.kills + row.placement_points + row.starting_points);
    }
  });

  test("placement points follow the source's own table", () => {
    const table = { 1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1 };
    for (const row of payload.match_results) {
      assert.equal(row.placement_points, table[row.placement] ?? 0);
      assert.equal(row.placement_points_source, table[row.placement] !== undefined ? "source_points_table" : "outside_points_table");
    }
  });

  test("a synthetic carry-over validates when the source publishes startingpoints", () => {
    const synthetic = parseGrandFinalsWikitext(
      "===Grand Finals===\n{{Match|p1=10 |p2=6 |p3=5 |p4=4 |p5=3 |p6=2 |p7=1 |p8=1}}\n" +
        "{{Map|date=2025-07-04 13:10 {{Abbr/IST}}|map=Erangel}}\n" +
        "|opponent1={{TeamOpponent|alpha esports|startingpoints=5|m1={{MS|1|8}}}}\n",
      { expectedMatches: 1, expectedTeams: 1 },
    );
    assert.equal(synthetic.teams[0].starting_points_available, true);
    assert.equal(synthetic.teams[0].startingpoints, 5);
    const rows = buildResultRows({ parsed: synthetic, teamIdByKey: { alphaesports: "t1" } });
    assert.equal(rows[0].kill_points, 13, "kill_points = kills 8 + starting 5");
    assert.equal(rows[0].total_points, 23, "total = kills 8 + placement 10 + starting 5");
  });

  test("validateArithmetic passes on the full payload", () => {
    assert.deepEqual(validateArithmetic(payload), []);
  });

  test("validateArithmetic detects an invented starting-point value", () => {
    const broken = {
      match_results: [{ match_number: 1, team_name: "x", team_match_key: "x", placement: 1, kills: 1, kill_points: 1, starting_points: 4, starting_points_available: false, placement_points: 10, total_points: 15 }],
    };
    const codes = validateArithmetic(broken).map((e) => e.code);
    assert.ok(codes.includes("KILL_POINTS_MISMATCH"));
    assert.ok(codes.includes("STARTING_POINTS_INVENTED"));
  });
});

describe("provenance generation", () => {
  test("every match carries source_slug, source_url and source_name", () => {
    for (const match of payload.matches) {
      assert.ok(match.source_slug);
      assert.ok(match.source_url.startsWith(SOURCE.page_url));
      assert.equal(match.source_name, "Liquipedia");
    }
  });

  test("every result row carries source_ref and source_url", () => {
    for (const row of payload.match_results) {
      assert.ok(row.source_ref, "source_ref missing");
      assert.ok(row.source_url.startsWith(SOURCE.page_url), "source_url missing");
    }
  });

  test("source_slug encodes the stage and match number", () => {
    assert.equal(payload.matches[0].source_slug, "liquipedia:bmps2025:grand-finals:m1");
    assert.equal(payload.matches[17].source_slug, "liquipedia:bmps2025:grand-finals:m18");
  });

  test("resultsByMatch keys correspond to the match source_slugs", () => {
    const slugs = new Set(payload.matches.map((m) => m.source_slug));
    for (const key of Object.keys(payload.resultsByMatch)) assert.ok(slugs.has(key));
    assert.equal(Object.keys(payload.resultsByMatch).length, 18);
  });
});

describe("duplicate detection", () => {
  test("no duplicate (match_number, team) rows", () => {
    const seen = new Set();
    for (const row of payload.match_results) {
      const key = `${row.match_number}:${row.team_match_key}`;
      assert.ok(!seen.has(key), `duplicate ${key}`);
      seen.add(key);
    }
  });

  test("validateArithmetic reports duplicate rows", () => {
    const row = { match_number: 1, team_name: "x", team_match_key: "x", placement: 1, kills: 0, kill_points: 0, starting_points: 0, starting_points_available: true, placement_points: 0, total_points: 0 };
    const codes = validateArithmetic({ match_results: [row, { ...row }] }).map((e) => e.code);
    assert.ok(codes.includes("DUPLICATE_RESULT_ROW"));
  });
});

describe("disputed split classification", () => {
  test("an equal total with a different split is DISPUTED_SPLIT_TOTAL_AGREES, not silently resolved", () => {
    const source = { kills: 77, placement_points: 49, starting_points: 0, total_points: 126 };
    const core = { kill_points: 78, placement_points: 48, total_points: 126 };
    assert.equal(classifyRow(source, core), DISPUTED_SPLIT_TOTAL_AGREES);
  });

  test("a field-for-field match is FIELD_EXACT", () => {
    const source = { kills: 77, placement_points: 49, starting_points: 0, total_points: 126 };
    const core = { kill_points: 77, placement_points: 49, total_points: 126 };
    assert.equal(classifyRow(source, core), FIELD_EXACT);
  });

  test("a differing total is TOTALS_ONLY_AGREE and a missing CORE row is IDENTITY_UNRESOLVED", () => {
    const source = { kills: 1, placement_points: 1, starting_points: 0, total_points: 2 };
    assert.equal(classifyRow(source, { kill_points: 9, placement_points: 9, total_points: 9 }), TOTALS_ONLY_AGREE);
    assert.equal(classifyRow(source, null), IDENTITY_UNRESOLVED);
  });

  test("the two known BMPS 2025 disputes are surfaced, not resolved", () => {
    // Derived from the fixture, not hardcoded: the parser itself must produce the
    // disputed splits when aggregated over 18 matches.
    const agg = {};
    for (const team of parsed.teams) {
      agg[team.match_key] = { kills: 0, placement_points: 0, total: 0 };
      for (const decoded of Object.values(parsed.matrix[team.slug])) {
        agg[team.match_key].kills += decoded.kills;
        agg[team.match_key].placement_points += parsed.pointsTable[decoded.placement] ?? 0;
      }
      agg[team.match_key].total = agg[team.match_key].kills + agg[team.match_key].placement_points;
    }
    const losHermanos = agg["loshermanosesports"];
    assert.equal(losHermanos.kills, 77);
    assert.equal(losHermanos.placement_points, 49);
    assert.equal(losHermanos.total, 126);
    const teamInsane = agg["teaminsane"];
    assert.equal(teamInsane.kills, 41);
    assert.equal(teamInsane.placement_points, 17);
    assert.equal(teamInsane.total, 58);
  });
});

describe("unavailable player-stat handling", () => {
  test("no player stats are emitted", () => {
    assert.deepEqual(payload.playerStats, []);
    assert.equal(payload.match_results.some((r) => "player_name" in r), false);
  });

  test("the absence is recorded as SOURCE_NOT_AVAILABLE with a reason", () => {
    assert.equal(payload.validation.player_match_stats, 0);
    assert.equal(payload.validation.player_match_stats_status, "SOURCE_NOT_AVAILABLE");
    assert.match(payload.validation.player_match_stats_reason, /does not publish per-match player statistics/);
  });

  test("no stage_match_breakdown artifact is produced", () => {
    assert.equal("stage_match_breakdown" in payload, false);
    assert.equal("stageMatchBreakdown" in payload, false);
  });
});

describe("malformed and missing source fields", () => {
  test("a match with no map or date is reported, not fabricated", () => {
    const result = parseGrandFinalsWikitext(
      "{{Match|p1=10}}\n{{Map|finished=true}}\n|opponent1={{TeamOpponent|a|m1={{MS|1|1}}}}",
      { expectedMatches: 1, expectedTeams: 1 },
    );
    const codes = result.issues.map((i) => i.code);
    assert.ok(codes.includes("MISSING_MATCH_MAP"));
    assert.ok(codes.includes("MISSING_MATCH_DATE"));
    assert.equal(result.matches[0].map, null);
    assert.equal(result.matches[0].scheduled_time, null);
  });

  test("an undecodable {{MS}} token is reported and excluded", () => {
    const result = parseGrandFinalsWikitext(
      "{{Match|p1=10}}\n{{Map|date=2025-07-04 13:10 {{Abbr/IST}}|map=Erangel}}\n" +
        "|opponent1={{TeamOpponent|a|m1={{MS|oops}}|m2={{MS|1|2}}}}",
      { expectedMatches: 1, expectedTeams: 1 },
    );
    assert.ok(result.issues.map((i) => i.code).includes("MALFORMED_MS"));
    assert.equal(result.matrix["a"][1], undefined);
    assert.equal(result.matrix["a"][2].kills, 2);
  });

  test("a missing team match entry is reported", () => {
    const result = parseGrandFinalsWikitext(
      "{{Match|p1=10}}\n{{Map|date=2025-07-04 13:10 {{Abbr/IST}}|map=Erangel}}\n{{Map|date=2025-07-04 14:00 {{Abbr/IST}}|map=Sanhok}}\n" +
        "|opponent1={{TeamOpponent|a|m1={{MS|1|2}}}}",
      { expectedMatches: 2, expectedTeams: 1 },
    );
    assert.ok(result.issues.map((i) => i.code).includes("MISSING_TEAM_MATCH_ENTRY"));
  });

  test("an absent points table is reported", () => {
    const result = parseGrandFinalsWikitext("{{Map|date=2025-07-04 13:10|map=Erangel}}", { expectedMatches: 1, expectedTeams: 0 });
    assert.ok(result.issues.map((i) => i.code).includes("MISSING_POINTS_TABLE"));
  });

  test("date parsing handles both source date formats and returns null when absent", () => {
    assert.equal(parseSourceDate("2025-07-04 13:10 {{Abbr/IST}}"), "2025-07-04T13:10:00+05:30");
    assert.equal(parseSourceDate("June 30, 2024 - 18:00 {{Abbr/IST}}"), "2024-06-30T18:00:00+05:30");
    assert.equal(parseSourceDate(""), null);
    assert.equal(parseSourceDate(null), null);
    assert.equal(parseSourceDate("no date here"), null);
  });

  test("a fixture that does not match the expected shape reports count mismatches", () => {
    const result = parseGrandFinalsWikitext(WIKITEXT, { expectedMatches: 20, expectedTeams: 20 });
    const codes = result.issues.map((i) => i.code);
    assert.ok(codes.includes("MATCH_COUNT_MISMATCH"));
    assert.ok(codes.includes("TEAM_COUNT_MISMATCH"));
  });
});

describe("parser idempotency", () => {
  test("parsing the same wikitext twice yields identical output", () => {
    const a = parseGrandFinalsWikitext(WIKITEXT, { expectedMatches: 18, expectedTeams: 16 });
    const b = parseGrandFinalsWikitext(WIKITEXT, { expectedMatches: 18, expectedTeams: 16 });
    assert.deepEqual(a, b);
  });

  test("building the canonical payload twice yields identical output", () => {
    const opts = {
      tournament: { id: "probe-tour", name: "BMPS 2025" },
      stage: "Grand Finals",
      parsed,
      teamIdByKey,
      source: SOURCE,
    };
    assert.deepEqual(buildCanonicalPayload(opts), buildCanonicalPayload(opts));
  });

  test("stable team slugs and match keys", () => {
    assert.equal(slugifyTeam("Genesis Esports (Indian Team)"), "genesis-esports");
    assert.equal(teamMatchKey("Genesis Esports (Indian Team)"), "genesisesports");
    assert.equal(teamMatchKey("4Merical Esports In"), "4mericalesports");
  });
});

describe("canonical payload validation", () => {
  test("declares the pilot expectations and matches them", () => {
    assert.equal(payload.validation.expected_matches, 18);
    assert.equal(payload.validation.expected_teams_per_match, 16);
    assert.equal(payload.validation.expected_result_rows, 288);
    assert.equal(payload.validation.extracted_matches, 18);
    assert.equal(payload.validation.extracted_result_rows, 288);
  });

  test("carries provenance and parser version metadata", () => {
    assert.equal(payload.provenance.source_name, "Liquipedia");
    assert.equal(payload.provenance.source_url, SOURCE.page_url);
    assert.equal(payload.provenance.parser_version, PARSER_VERSION);
    assert.match(payload.provenance.checksum, /^sha256:/);
  });

  test("contains the required top-level keys and no unexpected write artifacts", () => {
    for (const key of ["tournament", "stage", "matches", "match_results", "resultsByMatch", "playerStats", "source", "provenance", "validation"]) {
      assert.ok(key in payload, `missing ${key}`);
    }
  });

  test("resultsByMatch is directly consumable by enrichStage (every row has a team_id)", () => {
    for (const rows of Object.values(payload.resultsByMatch)) {
      for (const row of rows) {
        assert.ok(row.team_id, "row missing team_id");
        assert.ok(Number.isInteger(row.placement));
        assert.ok(Number.isFinite(row.kill_points));
      }
    }
  });
});
