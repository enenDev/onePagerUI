import type { FilterMetadata, FilterOption } from "@/types/onePager";

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Homepage filter metadata — independent of create-form option maps.
 *
 * Shape:
 * - `market`: flat list of market options (always enabled).
 * - `optionsByMarket`: dependent filter options keyed by market value.
 *   UI unions these when multiple markets are selected.
 */
const metadata: FilterMetadata = {
  market: [
    { label: "National", value: "National" },
    { label: "US", value: "US" },
  ],
  optionsByMarket: {
    National: {
      retailer: [
        { label: "All Retailers", value: "All Retailers" },
        { label: "Supermarket", value: "Supermarket" },
      ],
      channel: [
        { label: "All Channels", value: "All Channels" },
        { label: "Supermarket", value: "Supermarket" },
      ],
      category: [
        { label: "Hair Care", value: "Hair Care" },
        { label: "Execution Excellence", value: "Execution Excellence" },
        { label: "Deodorants", value: "Deodorants" },
      ],
      campaign: [
        { label: "Summer Freshness", value: "Summer Freshness" },
        { label: "National Growth Program", value: "National Growth Program" },
        { label: "Maximum Protection", value: "Maximum Protection" },
      ],
    },
    US: {
      retailer: [
        { label: "Walmart", value: "Walmart" },
        { label: "Target", value: "Target" },
      ],
      channel: [
        { label: "Supermarket", value: "Supermarket" },
        { label: "Hypermarket", value: "Hypermarket" },
      ],
      category: [
        { label: "Hair Care", value: "Hair Care" },
        { label: "Oral Care", value: "Oral Care" },
      ],
      campaign: [
        { label: "Fresh Breath", value: "Fresh Breath" },
        { label: "Scalp & Shine", value: "Scalp & Shine" },
      ],
    },
  },
};

const DEPENDENT_KEYS = [
  "retailer",
  "channel",
  "category",
  "campaign",
] as const;

/** Union distinct options for a dependent filter across selected markets. */
export function unionMarketScopedOptions(
  metadata: FilterMetadata,
  markets: string[],
  key: (typeof DEPENDENT_KEYS)[number],
): FilterOption[] {
  const seen = new Set<string>();
  const options: FilterOption[] = [];

  for (const market of markets) {
    const scoped = metadata.optionsByMarket[market]?.[key] ?? [];
    for (const option of scoped) {
      if (seen.has(option.value)) continue;
      seen.add(option.value);
      options.push(option);
    }
  }

  return options;
}

/**
 * TODO: Replace with real FastAPI GET metadata endpoint.
 * Temporary: markets flat + dependents keyed by market for homepage filters.
 * Next: GET /api/metadata (or /api/filters) returning the same FilterMetadata shape
 * (`market` + `optionsByMarket`). Keep FilterPayload search body array-only.
 */
export async function getMetadata(): Promise<FilterMetadata> {
  await delay();
  return structuredClone(metadata);
}
