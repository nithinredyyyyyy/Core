// Shared pagination helpers for entity lists.
//
// The server caps every list response (see server/services/listQuery.js), so a
// single request can never be assumed to contain the complete dataset. These
// helpers walk `skip` pages until a short page is returned, which is the
// supported way to retrieve sets larger than the per-entity cap.

const DEFAULT_PAGE_SIZE = 500;

/**
 * Collect every page of an entity list.
 *
 * @param {(skip: number, limit: number) => Promise<Array>} fetchPage
 *   Called with the current offset and page size; must honour both.
 * @param {{ pageSize?: number, maxPages?: number }} [options]
 * @returns {Promise<Array>} concatenated rows in fetch order
 */
export async function collectAllPages(fetchPage, options = {}) {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const maxPages = options.maxPages ?? 200;
  const rows = [];

  for (let page = 0; page < maxPages; page += 1) {
    const batch = await fetchPage(page * pageSize, pageSize);
    if (!Array.isArray(batch) || batch.length === 0) break;
    rows.push(...batch);
    // A short page means the end of the set; a full page means keep going.
    if (batch.length < pageSize) break;
  }

  return rows;
}

export function paginateList(entity, sortBy, options = {}) {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  return collectAllPages(
    (skip, limit) => entity.list(sortBy, limit, skip),
    { ...options, pageSize },
  );
}

export function paginateFilter(entity, query, sortBy, options = {}) {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  return collectAllPages(
    (skip, limit) => entity.filter(query, sortBy, limit, skip),
    { ...options, pageSize },
  );
}
