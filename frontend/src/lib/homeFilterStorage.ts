import {
  createEmptyFilters,
  type FilterKey,
  type FilterPayload,
} from "@/types/onePager";

/**
 * Session persistence for the homepage dropdown filters (market, channel,
 * business_group, retailer, category, campaign, year).
 *
 * Scope: only the dropdown `FilterPayload` is persisted — NOT statusTab /
 * scopeTab (those stay Redux-only and reset on full reload by design).
 *
 * Lifetime: sessionStorage → survives reloads and in-app navigation, clears
 * when the browser tab is closed. Swap to localStorage here if product later
 * wants filters to outlive the tab.
 *
 * Timing: written only when filters are *applied* (FilterBar Submit) and
 * removed on Clear, so storage always mirrors the list the user is seeing.
 */
const STORAGE_KEY = "home-filters:v1";

const FILTER_KEYS: FilterKey[] = [
  "market",
  "retailer",
  "channel",
  "category",
  "campaign",
  "business_group",
  "year",
];

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

/**
 * Read + sanitize persisted filters. Returns null when nothing is stored or the
 * payload is corrupt / from an older schema, so callers fall back to empty
 * filters. Values are NOT validated against live metadata here — Redux's
 * syncDependentFilters prunes stale market-scoped values on fetchMetadata.
 */
export function loadPersistedFilters(): FilterPayload | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return null;

    const source = parsed as Record<string, unknown>;
    const filters = createEmptyFilters();
    for (const key of FILTER_KEYS) {
      const value = source[key];
      if (isStringArray(value)) {
        filters[key] = value;
      }
    }
    return filters;
  } catch {
    return null;
  }
}

export function savePersistedFilters(filters: FilterPayload): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const payload: FilterPayload = {
      market: [...filters.market],
      retailer: [...filters.retailer],
      channel: [...filters.channel],
      category: [...filters.category],
      campaign: [...filters.campaign],
      business_group: [...filters.business_group],
      year: [...filters.year],
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota / serialization errors — persistence is best-effort.
  }
}

export function clearPersistedFilters(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore — nothing actionable if removal fails.
  }
}
