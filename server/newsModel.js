import { db, entityConfigs, normalizeRecord } from "./db.js";

function normalizeWhitespace(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

export function decodeNewsText(value) {
  return normalizeWhitespace(
    String(value || "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/â‚¹/g, "₹")
      .replace(/â€“/g, "–")
      .replace(/â€”/g, "—")
      .replace(/â€˜/g, "'")
      .replace(/â€™/g, "'")
      .replace(/â€œ/g, '"')
      .replace(/â€/g, '"'),
  );
}

function cleanTitle(value) {
  return decodeNewsText(value).replace(/\s+[|:-]\s+[A-Za-z][A-Za-z0-9 .&'/-]{1,40}$/i, "").trim();
}

function getAcronymForTournament(name) {
  const text = String(name || "").toLowerCase();
  if (text.includes("pro series")) return "bmps";
  if (text.includes("india series")) return "bgis";
  if (text.includes("international cup")) return "bmic";
  if (text.includes("showdown")) return "bmsd";
  return "";
}

function getTournamentYear(name) {
  const match = String(name || "").match(/\b(20\d{2})\b/);
  return match ? match[1] : "";
}

function buildTournamentAliases(tournament) {
  const name = decodeNewsText(tournament?.name || "").toLowerCase();
  const acronym = getAcronymForTournament(name);
  const year = getTournamentYear(name);
  const aliases = new Set([name]);
  if (acronym) aliases.add(acronym);
  if (acronym && year) aliases.add(`${acronym} ${year}`);
  return [...aliases];
}

function loadTournaments() {
  return db
    .prepare(
      "SELECT id, name, description, format_overview, calendar, prize_pool, rules, game, start_date, end_date, stages, participants, max_teams FROM tournaments",
    )
    .all()
    .map((row) => normalizeRecord(entityConfigs.Tournament, row));
}

function findRelatedTournament(article, tournaments) {
  const haystack = `${article?.title || ""} ${article?.content || ""}`.toLowerCase();
  return tournaments.find((tournament) =>
    buildTournamentAliases(tournament).some((alias) => alias && haystack.includes(alias)),
  );
}

function isWeakImportedBody(article) {
  const title = cleanTitle(article?.title || "");
  const content = decodeNewsText(article?.content || "");
  const source = decodeNewsText(article?.source_name || "");
  if (!content) return true;
  const lowered = content.toLowerCase();
  const titleMatch = title && lowered.startsWith(title.toLowerCase());
  const sourceTail =
    source &&
    (lowered.endsWith(source.toLowerCase()) ||
      lowered.includes(` ${source.toLowerCase()}`));
  return (
    Boolean(article?.is_auto_ingested) &&
    (content.length <= title.length + 48 ||
      (titleMatch && sourceTail) ||
      !/[.?!]/.test(content))
  );
}

function isStructureStory(article) {
  const text = `${article?.title || ""} ${article?.summary || ""}`.toLowerCase();
  return /(format|schedule|groups|teams|details|round|stage|explained)/.test(text);
}

function buildFieldText(tournament) {
  const participants = Array.isArray(tournament?.participants)
    ? tournament.participants.length
    : 0;
  const fieldCount = participants || Number(tournament?.max_teams || 0);
  if (!fieldCount) return "";
  return `${decodeNewsText(tournament?.name)} features a field of ${fieldCount} teams, giving the event a full national-scale bracket from opening stages to finals.`;
}

function buildScheduleText(tournament) {
  const calendar = Array.isArray(tournament?.calendar) ? tournament.calendar : [];
  if (calendar.length === 0) return "";

  return [
    "Tournament schedule",
    ...calendar.map(
      (entry) => `${decodeNewsText(entry.label)}\n${decodeNewsText(entry.week)}`,
    ),
  ].join("\n\n");
}

function buildStageProgressionText(tournament) {
  const stages = Array.isArray(tournament?.stages) ? tournament.stages : [];
  if (stages.length === 0) return "";
  return [
    "Stage progression",
    ...stages
      .filter((stage) => stage?.name && stage?.summary)
      .slice(0, 8)
      .map(
        (stage) =>
          `${decodeNewsText(stage.name)}\n${decodeNewsText(stage.summary)}`,
      ),
  ].join("\n\n");
}

function buildEditorialBody(article, tournament) {
  const bodyParts = [];
  const description = decodeNewsText(tournament?.description || "");
  const formatOverview = decodeNewsText(tournament?.format_overview || "");
  const prizePool = decodeNewsText(tournament?.prize_pool || "");
  const rules = decodeNewsText(tournament?.rules || "");
  const scheduleText = buildScheduleText(tournament);
  const stageProgressionText = buildStageProgressionText(tournament);
  const fieldText = buildFieldText(tournament);
  const structureStory = isStructureStory(article);

  if (description) bodyParts.push(description);
  if (formatOverview && formatOverview !== description) bodyParts.push(formatOverview);
  if (fieldText) bodyParts.push(fieldText);
  if (prizePool) {
    bodyParts.push(
      `${decodeNewsText(tournament?.name || article?.title)} carries a listed prize pool of ${prizePool}.`,
    );
  }
  if (structureStory && stageProgressionText) bodyParts.push(stageProgressionText);
  if (scheduleText) bodyParts.push(scheduleText);
  if (rules) bodyParts.push(rules);

  return bodyParts.filter(Boolean).join("\n\n");
}

function buildEditorialSummary(article, tournament, content) {
  const summary = decodeNewsText(article?.summary || "");
  if (summary && summary.length > 120 && !summary.endsWith(decodeNewsText(article?.source_name || ""))) {
    return summary;
  }
  return (
    decodeNewsText(tournament?.description || "") ||
    decodeNewsText(tournament?.format_overview || "") ||
    decodeNewsText(content || "")
  );
}

export function enrichImportedNewsArticle(article) {
  const tournaments = loadTournaments();
  const relatedTournament = findRelatedTournament(article, tournaments);
  const content = decodeNewsText(article?.content || "");

  if (!isWeakImportedBody(article) || !relatedTournament) {
    return {
      ...article,
      title: cleanTitle(article?.title || ""),
      content,
      summary: buildEditorialSummary(article, null, content),
    };
  }

  const editorialBody = buildEditorialBody(article, relatedTournament);
  return {
    ...article,
    title: cleanTitle(article?.title || ""),
    content: editorialBody || content,
    summary: buildEditorialSummary(article, relatedTournament, editorialBody || content),
  };
}
