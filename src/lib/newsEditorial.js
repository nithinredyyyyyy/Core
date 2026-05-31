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
  return decodeNewsText(value).replace(/\s+[|:-]\s+[A-Za-z][A-Za-z0-9 .&'-]{1,40}$/i, "").trim();
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
  if (acronym && year) aliases.add(`${acronym} ${year}`);
  if (acronym) aliases.add(acronym);
  return [...aliases];
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

function findRelatedTournament(article, tournaments = []) {
  const haystack = `${article?.title || ""} ${article?.content || ""}`.toLowerCase();
  return tournaments.find((tournament) =>
    buildTournamentAliases(tournament).some((alias) => alias && haystack.includes(alias)),
  );
}

function buildTournamentSummary(tournament) {
  const description = decodeNewsText(tournament?.description || "");
  const formatOverview = decodeNewsText(tournament?.format_overview || "");
  return description || formatOverview || "";
}

function buildScheduleBlocks(tournament) {
  const calendar = Array.isArray(tournament?.calendar) ? tournament.calendar : [];
  if (calendar.length === 0) return [];
  return [
    { type: "heading", text: "Tournament schedule" },
    ...calendar.map((entry) => ({
      type: "paragraph",
      text: `${decodeNewsText(entry.label)}: ${decodeNewsText(entry.week)}`,
    })),
  ];
}

function buildFieldBlock(tournament) {
  const participants = Array.isArray(tournament?.participants)
    ? tournament.participants.length
    : 0;
  const fieldCount = participants || Number(tournament?.max_teams || 0);
  if (!fieldCount) return null;
  return {
    type: "paragraph",
    text: `${decodeNewsText(tournament?.name)} features a field of ${fieldCount} teams, giving the event a full national-scale bracket from opening stages to finals.`,
  };
}

function buildStageBlocks(tournament) {
  const stages = Array.isArray(tournament?.stages) ? tournament.stages : [];
  const meaningfulStages = stages.filter((stage) => stage?.name && stage?.summary).slice(0, 8);
  if (meaningfulStages.length === 0) return [];
  return [
    { type: "heading", text: "Stage progression" },
    ...meaningfulStages.flatMap((stage) => [
      { type: "heading", text: decodeNewsText(stage.name) },
      { type: "paragraph", text: decodeNewsText(stage.summary) },
    ]),
  ];
}

function buildPrizeBlock(tournament) {
  const prizePool = decodeNewsText(tournament?.prize_pool || "");
  if (!prizePool) return null;
  const year = getTournamentYear(tournament?.name);
  return {
    type: "paragraph",
    text: `${decodeNewsText(tournament?.name)} carries a listed prize pool of ${prizePool}${year ? ` for the ${year} season` : ""}.`,
  };
}

function buildRulesBlock(tournament) {
  const rules = decodeNewsText(tournament?.rules || "");
  if (!rules) return null;
  return {
    type: "paragraph",
    text: rules,
  };
}

export function getEditorialNewsSummary(article, tournaments = []) {
  const relatedTournament = findRelatedTournament(article, tournaments);
  if (!isWeakImportedBody(article)) {
    return decodeNewsText(article?.summary || article?.content || "");
  }
  return (
    decodeNewsText(article?.summary || "") ||
    buildTournamentSummary(relatedTournament) ||
    decodeNewsText(article?.content || "")
  );
}

export function getEditorialNewsBlocks(article, tournaments = []) {
  const relatedTournament = findRelatedTournament(article, tournaments);
  const cleanedSummary = decodeNewsText(article?.summary || "");
  const cleanedContent = decodeNewsText(article?.content || "");

  if (!isWeakImportedBody(article) || !relatedTournament) {
    const rawBody = cleanedContent || cleanedSummary;
    return rawBody
      .split(/\n{2,}/)
      .flatMap((paragraph) => {
        const text = normalizeWhitespace(paragraph);
        return text ? [{ type: "paragraph", text }] : [];
      })
      ;
  }

  const description = decodeNewsText(relatedTournament?.description || "");
  const formatOverview = decodeNewsText(relatedTournament?.format_overview || "");
  const blocks = [];

  if (description) {
    blocks.push({ type: "paragraph", text: description });
  }

  if (formatOverview && formatOverview !== description) {
    blocks.push({ type: "paragraph", text: formatOverview });
  }

  const fieldBlock = buildFieldBlock(relatedTournament);
  if (fieldBlock) blocks.push(fieldBlock);

  const prizeBlock = buildPrizeBlock(relatedTournament);
  if (prizeBlock) blocks.push(prizeBlock);

  if (isStructureStory(article)) {
    blocks.push(...buildStageBlocks(relatedTournament));
  }

  blocks.push(...buildScheduleBlocks(relatedTournament));

  const rulesBlock = buildRulesBlock(relatedTournament);
  if (rulesBlock) blocks.push(rulesBlock);

  return blocks.filter((block) => normalizeWhitespace(block.text));
}
