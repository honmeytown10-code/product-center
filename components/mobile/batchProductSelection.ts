/** Keep bulk selection aligned with the visible list, preserving other categories. */
export function toggleVisibleProducts(
  previous: ReadonlySet<string>, visibleIds: readonly string[], clear: boolean, limit?: number,
): { selected: Set<string>; limited: boolean } {
  const selected = new Set(previous);
  const scope = [...new Set(visibleIds)];
  if (clear) {
    scope.forEach(id => selected.delete(id));
    return { selected, limited: false };
  }
  let limited = false;
  for (const id of scope) {
    if (selected.has(id)) continue;
    if (limit !== undefined && selected.size >= limit) { limited = true; continue; }
    selected.add(id);
  }
  return { selected, limited };
}

export function visibleSelectionState(selected: ReadonlySet<string>, visibleIds: readonly string[], limit?: number) {
  const ids = [...new Set(visibleIds)];
  const count = ids.filter(id => selected.has(id)).length;
  const allSelected = ids.length > 0 && count === ids.length;
  const atLimit = limit !== undefined && selected.size >= limit;
  return { total: ids.length, count, allSelected, atLimit, clear: allSelected || (atLimit && count > 0) };
}
