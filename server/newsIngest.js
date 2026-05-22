import { randomUUID } from "node:crypto";
import { db, entityConfigs, normalizeRecord, serializePayload } from "./db.js";
import { NEWS_SOURCE_TYPES, getEnabledNewsSources } from "./newsSources.js";

const SOURCE_BRAND_LABELS = new Map([
  ["ign india", "IGN India"],
  ["insidesport", "InsideSport"],
  ["talkesport", "TalkEsport"],
  ["esports charts", "Esports Charts"],
  ["dailyhunt", "Dailyhunt"],
]);

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'");
}

function stripTags(value) {
  return decodeHtmlEntities(String(value || "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeWhitespace(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function toTitleCase(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildSummary(content) {
  const normalized = normalizeWhitespace(
    decodeHtmlEntities(String(content || "")).replace(/<[^>]+>/g, " "),
  );
  if (!normalized) return "";
  if (normalized.length <= 220) return normalized;
  const clipped = normalized.slice(0, 217);
  const lastBreak = Math.max(
    clipped.lastIndexOf("."),
    clipped.lastIndexOf(" "),
    clipped.lastIndexOf(","),
  );
  return `${(lastBreak > 140 ? clipped.slice(0, lastBreak) : clipped).trim()}...`;
}

function extractDomainLabel(sourceUrl) {
  try {
    const hostname = new URL(sourceUrl).hostname.replace(/^www\./i, "");
    const bare = hostname.split(".").slice(0, -1).join(".") || hostname;
    return bare
      .replace(/[-_]+/g, " ")
      .split(".")
      .map((part) => toTitleCase(part))
      .join(" ");
  } catch {
    return "";
  }
}

function cleanSourceLabel(value) {
  const normalized = normalizeWhitespace(value)
    .replace(/^google news[:\s-]*/i, "")
    .replace(/^news[:\s-]*/i, "");
  if (!normalized) return "";
  if (/^[a-z0-9.\-_]+$/i.test(normalized) && normalized.includes(".")) {
    return extractDomainLabel(`https://${normalized}`) || normalized;
  }
  return SOURCE_BRAND_LABELS.get(normalized.toLowerCase()) || normalized;
}

function extractSourceFromTitle(title) {
  const cleanTitle = normalizeWhitespace(title);
  if (!cleanTitle) return "";
  const parts = cleanTitle.split(/\s(?:-|\|)\s/);
  if (parts.length < 2) return "";
  const candidate = normalizeWhitespace(parts.at(-1));
  if (!candidate) return "";
  const wordCount = candidate.split(/\s+/).filter(Boolean).length;
  if (wordCount > 6) return "";
  return cleanSourceLabel(candidate);
}

function isGenericSourceLabel(value) {
  const normalized = normalizeWhitespace(value).toLowerCase();
  return (
    !normalized ||
    ["bgmi", "bmps", "bgis", "manual feed", "imported source"].includes(
      normalized,
    )
  );
}

function stripTitleSourceSuffix(title, sourceName) {
  const cleanTitle = normalizeWhitespace(title);
  const cleanSource = normalizeWhitespace(sourceName);
  if (!cleanTitle || !cleanSource) return cleanTitle;

  const suffixPatterns = [
    new RegExp(
      `\\s+-\\s+${cleanSource.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      "i",
    ),
    new RegExp(
      `\\s+\\|\\s+${cleanSource.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      "i",
    ),
  ];

  for (const pattern of suffixPatterns) {
    if (pattern.test(cleanTitle)) {
      return cleanTitle.replace(pattern, "").trim();
    }
  }
  return cleanTitle;
}

function normalizeTitleFingerprint(title) {
  return normalizeWhitespace(title)
    .toLowerCase()
    .replace(/\s+-\s+[^-]+$/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeNewsKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function readXmlTag(block, tagName) {
  const match = block.match(
    new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"),
  );
  return match ? decodeHtmlEntities(match[1]).trim() : "";
}

function parseRssFeed(xmlText) {
  const items = [...xmlText.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)];
  return items.map((match) => {
    const block = match[1] || "";
    const sourceLabel = stripTags(readXmlTag(block, "source"));
    return {
      title: stripTags(readXmlTag(block, "title")),
      content:
        stripTags(readXmlTag(block, "content:encoded")) ||
        stripTags(readXmlTag(block, "description")),
      source_url: stripTags(readXmlTag(block, "link")),
      source_label: sourceLabel,
      published_at:
        stripTags(readXmlTag(block, "pubDate")) ||
        stripTags(readXmlTag(block, "dc:date")),
      thumbnail_url: "",
    };
  });
}

function parseJsonFeed(payload) {
  const sourceItems = Array.isArray(payload)
    ? payload
    : payload?.articles || payload?.items || payload?.data || [];

  if (!Array.isArray(sourceItems)) return [];

  return sourceItems.map((item) => ({
    title: normalizeWhitespace(item?.title || item?.headline || ""),
    content: normalizeWhitespace(
      item?.content || item?.description || item?.summary || item?.body || "",
    ),
    source_url: normalizeWhitespace(
      item?.url || item?.link || item?.source_url || "",
    ),
    source_label: normalizeWhitespace(
      item?.source_name || item?.source || item?.publisher || "",
    ),
    published_at:
      item?.publishedAt ||
      item?.published_at ||
      item?.date ||
      item?.created_at ||
      "",
    thumbnail_url: item?.urlToImage || item?.thumbnail_url || item?.image || "",
  }));
}

function buildImportHash(article) {
  return normalizeNewsKey(
    `${normalizeTitleFingerprint(article.title)}::${article.source_url || ""}`,
  );
}

function normalizeImportedArticle(rawItem, source) {
  const hintedSourceLabel = cleanSourceLabel(rawItem.source_label);
  const titleSourceLabel = extractSourceFromTitle(rawItem.title);
  const sourceLabel =
    hintedSourceLabel ||
    titleSourceLabel ||
    cleanSourceLabel(extractDomainLabel(rawItem.source_url)) ||
    cleanSourceLabel(source.name);
  const title = stripTitleSourceSuffix(
    normalizeWhitespace(rawItem.title),
    sourceLabel,
  );
  const content = normalizeWhitespace(rawItem.content);
  const sourceUrl = normalizeWhitespace(rawItem.source_url);
  if (!title || !content) return null;

  const publishedAt = rawItem.published_at
    ? new Date(rawItem.published_at)
    : null;
  const createdDate =
    publishedAt && !Number.isNaN(publishedAt.getTime())
      ? publishedAt.toISOString()
      : new Date().toISOString();

  return {
    title,
    summary: buildSummary(content),
    content,
    category: source.category || "general",
    thumbnail_url: rawItem.thumbnail_url || "",
    featured: 0,
    game: source.game || "General",
    created_date: createdDate,
    created_by: `import:${source.id}`,
    source_name: sourceLabel,
    source_url: sourceUrl,
    source_type: source.type,
    verification_status: "needs_review",
    publication_status: "draft",
    priority: source.priority || "routine",
    is_auto_ingested: 1,
    import_hash: buildImportHash({ title, source_url: sourceUrl }),
  };
}

function deriveNormalizedDraftPatch(article) {
  const titleSourceLabel = extractSourceFromTitle(article.title);
  const existingSourceLabel = cleanSourceLabel(article.source_name);
  const preferredExistingSourceLabel =
    titleSourceLabel &&
    existingSourceLabel &&
    titleSourceLabel.toLowerCase() === existingSourceLabel.toLowerCase()
      ? titleSourceLabel
      : existingSourceLabel;
  const sourceLabel =
    (!isGenericSourceLabel(preferredExistingSourceLabel)
      ? preferredExistingSourceLabel
      : "") ||
    titleSourceLabel ||
    cleanSourceLabel(extractDomainLabel(article.source_url)) ||
    cleanSourceLabel(article.created_by?.replace(/^import:/, "")) ||
    "Imported Source";
  const title = stripTitleSourceSuffix(article.title, sourceLabel);
  const summary = buildSummary(article.content || article.summary || "");
  const importHash = buildImportHash({
    title,
    source_url: normalizeWhitespace(article.source_url),
  });

  return {
    title,
    summary,
    source_name: sourceLabel,
    import_hash: importHash,
  };
}

async function fetchSourceItems(source) {
  const response = await fetch(source.url, {
    headers: {
      "User-Agent": "StageCoreNewsBot/1.0",
      Accept:
        source.type === "json"
          ? "application/json,text/plain;q=0.9,*/*;q=0.8"
          : "application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  if (source.type === "json") {
    return parseJsonFeed(await response.json());
  }

  return parseRssFeed(await response.text());
}

function getExistingImportKeys() {
  const rows = db
    .prepare("SELECT id, title, source_url, import_hash FROM news_articles")
    .all()
    .map((row) => normalizeRecord(entityConfigs.NewsArticle, row));
  const keys = new Set();
  rows.forEach((row) => {
    keys.add(normalizeNewsKey(row.import_hash));
    keys.add(normalizeNewsKey(row.source_url));
    keys.add(normalizeNewsKey(row.title));
    keys.add(normalizeNewsKey(normalizeTitleFingerprint(row.title)));
  });
  return keys;
}

function insertImportedNewsArticle(payload) {
  const config = entityConfigs.NewsArticle;
  const now = new Date().toISOString();
  const record = {
    id: randomUUID(),
    created_date: payload.created_date || now,
    updated_date: now,
    ...serializePayload(config, payload),
  };

  const columns = Object.keys(record);
  const placeholders = columns.map(() => "?").join(", ");
  const sql = `INSERT INTO ${config.table} (${columns.join(", ")}) VALUES (${placeholders})`;
  db.prepare(sql).run(...columns.map((column) => record[column]));
}

export async function importNewsFromSources(options = {}) {
  const sources = getEnabledNewsSources(options.sourceIds);
  const manualSourceUrl = normalizeWhitespace(options.manualUrl || "");
  const allSources = [...sources];

  if (manualSourceUrl) {
    allSources.push({
      id: `manual-${Date.now()}`,
      name: normalizeWhitespace(options.manualSourceName || "Manual Feed"),
      type:
        options.manualSourceType === NEWS_SOURCE_TYPES.JSON
          ? NEWS_SOURCE_TYPES.JSON
          : NEWS_SOURCE_TYPES.RSS,
      url: manualSourceUrl,
      category: options.manualCategory || "general",
      game: options.manualGame || "General",
      priority: options.manualPriority || "routine",
    });
  }

  const existingKeys = getExistingImportKeys();
  const imported = [];
  const skipped = [];
  const failed = [];

  for (const source of allSources) {
    try {
      const items = await fetchSourceItems(source);
      const normalizedItems = items
        .map((item) => normalizeImportedArticle(item, source))
        .filter(Boolean)
        .slice(
          0,
          Number.isFinite(Number(options.limitPerSource))
            ? Number(options.limitPerSource)
            : 8,
        );

      for (const article of normalizedItems) {
        const importKey = normalizeNewsKey(
          article.import_hash || article.source_url || article.title,
        );
        const titleKey = normalizeNewsKey(
          normalizeTitleFingerprint(article.title),
        );
        if (
          !importKey ||
          existingKeys.has(importKey) ||
          (titleKey && existingKeys.has(titleKey))
        ) {
          skipped.push({
            sourceId: source.id,
            title: article.title,
            reason: "duplicate",
          });
          continue;
        }

        insertImportedNewsArticle(article);
        existingKeys.add(importKey);
        if (titleKey) existingKeys.add(titleKey);
        imported.push({
          sourceId: source.id,
          title: article.title,
          sourceName: article.source_name,
          sourceUrl: article.source_url,
        });
      }
    } catch (error) {
      failed.push({
        sourceId: source.id,
        sourceName: source.name,
        error: error.message || "Import failed",
      });
    }
  }

  return {
    sourcesTried: allSources.length,
    importedCount: imported.length,
    skippedCount: skipped.length,
    failedCount: failed.length,
    imported,
    skipped,
    failed,
  };
}

export function backfillImportedNewsMetadata() {
  const rows = db
    .prepare(
      `
      SELECT id, title, summary, content, source_name, source_url, created_by, import_hash
      FROM news_articles
      WHERE is_auto_ingested = 1
    `,
    )
    .all()
    .map((row) => normalizeRecord(entityConfigs.NewsArticle, row));

  let updatedCount = 0;
  const updateStmt = db.prepare(`
    UPDATE news_articles
    SET title = ?,
        summary = ?,
        source_name = ?,
        import_hash = ?
    WHERE id = ?
  `);

  const transaction = db.transaction(() => {
    for (const row of rows) {
      const next = deriveNormalizedDraftPatch(row);
      const changed =
        next.title !== row.title ||
        next.summary !== (row.summary || "") ||
        next.source_name !== (row.source_name || "") ||
        next.import_hash !== (row.import_hash || "");

      if (!changed) continue;
      updateStmt.run(
        next.title,
        next.summary,
        next.source_name,
        next.import_hash,
        row.id,
      );
      updatedCount += 1;
    }
  });

  transaction();
  return { checkedCount: rows.length, updatedCount };
}
