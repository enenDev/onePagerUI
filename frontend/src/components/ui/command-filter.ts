/**
 * Strict substring match for Combobox search.
 * cmdk's default filter is fuzzy and can show options that don't contain
 * the typed text (e.g. "allllll" → "All Channels").
 */
export function commandSubstringFilter(
  value: string,
  search: string,
  keywords?: string[],
): number {
  const needle = search.trim().toLowerCase();
  if (!needle) return 1;
  const haystack = `${value} ${(keywords ?? []).join(" ")}`.toLowerCase();
  return haystack.includes(needle) ? 1 : 0;
}
