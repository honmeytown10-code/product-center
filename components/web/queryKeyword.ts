/** Search only the selected existing field; “all” searches every supplied field. */
export function matchesQueryKeyword(
  keyword: string,
  field: string,
  values: Record<string, string | string[] | null | undefined>,
): boolean {
  const term = keyword.trim().toLocaleLowerCase();
  if (!term) return true;
  const candidates = field === 'all' ? Object.values(values) : [values[field]];
  return candidates.flat().some(value => value?.toLocaleLowerCase().includes(term));
}
