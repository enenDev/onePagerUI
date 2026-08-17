import homepageMetadataMock from "@/services/mocks/homepageMetadata.json";
import type {
  FilterKey,
  FilterMetadata,
  FilterOption,
} from "@/types/onePager";

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

type DependentFilterKey = Exclude<FilterKey, "market">;

/** Union distinct options for a dependent filter across selected markets. */
export function unionMarketScopedOptions(
  metadata: FilterMetadata,
  markets: string[],
  key: DependentFilterKey,
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
 * Temporary: dummy from `mocks/homepageMetadata.json`
 * (markets flat + dependents keyed by market).
 * Shared by homepage filters AND create/edit strategy dropdowns
 * (Market, Retailer, Channel, Category, Campaign) via `landing.metadata`.
 * Initiative departments/KPIs stay on getCreateFormMetadata.
 * Next: GET /api/metadata (or /api/filters) returning the same FilterMetadata shape
 * (`market` + `optionsByMarket`). Keep FilterPayload search body array-only.
 */
export async function getMetadata(): Promise<FilterMetadata> {
  await delay();
  return structuredClone(homepageMetadataMock) as FilterMetadata;
}
