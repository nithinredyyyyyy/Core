export function getSortableNumber(value) {
  if (value === null || value === undefined || value === "-") return null;
  const numeric = Number(String(value).replace("%", "").trim());
  return Number.isFinite(numeric) ? numeric : null;
}

export function compareSortableValues(left, right, direction = "desc") {
  const leftNumber = getSortableNumber(left);
  const rightNumber = getSortableNumber(right);

  if (leftNumber !== null && rightNumber !== null) {
    return direction === "asc" ? leftNumber - rightNumber : rightNumber - leftNumber;
  }

  const result = String(left ?? "").localeCompare(String(right ?? ""), undefined, {
    numeric: true,
    sensitivity: "base",
  });
  return direction === "asc" ? result : -result;
}

export function sortTableRows(rows, tableSort, tableKey, getValue) {
  if (!tableSort || tableSort.tableKey !== tableKey || !tableSort.field) return rows;

  return rows
    .map((row, index) => ({ row, index }))
    .toSorted((left, right) => {
      const result = compareSortableValues(
        getValue(left.row, tableSort.field, left.index),
        getValue(right.row, tableSort.field, right.index),
        tableSort.direction,
      );
      return result || left.index - right.index;
    })
    .map(({ row }) => row);
}
