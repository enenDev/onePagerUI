import type { FilterOption } from "@/types/onePager";

/**
 * Year options for the landing filter and create forms.
 * Always exactly the current year and the next year (computed at runtime),
 * e.g. in 2026 → [{ "2026" }, { "2027" }]. Market-independent.
 */
export function getYearOptions(now: Date = new Date()): FilterOption[] {
  const currentYear = now.getFullYear();
  return [currentYear, currentYear + 1].map((year) => ({
    label: String(year),
    value: String(year),
  }));
}
