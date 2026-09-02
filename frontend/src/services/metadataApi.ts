import ApiBase from "@/components/auth/apiBase";
import type {
  FilterKey,
  FilterMetadata,
  FilterOption,
} from "@/types/onePager";

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

// 1. Define the API response structure to eliminate implicit 'any'
interface RawMetadataInput {
  [marketKey: string]: {
    [categoryKey in DependentFilterKey]?: string[];
  };
}

// 2. Type-safe data transformer with exact existing logic
const transformData = (input: RawMetadataInput): FilterMetadata => {
  const market: FilterOption[] = [];
  const optionsByMarket: FilterMetadata["optionsByMarket"] = {};

  Object.keys(input).forEach((marketKey) => {
    market.push({ label: marketKey, value: marketKey });
    
    // Cast empty object to bypass strict initialization checks safely
    optionsByMarket[marketKey] = {} as FilterMetadata["optionsByMarket"][string];
    
    Object.keys(input[marketKey]).forEach((categoryKey) => {
      const depKey = categoryKey as DependentFilterKey;
      const items = input[marketKey][depKey];

      if (items) {
        optionsByMarket[marketKey][depKey] = items.map((item) => ({
          label: item,
          value: item,
        }));
      }
    });
  });

  return {
    market,
    optionsByMarket,
  };
};

export async function getMetadata(): Promise<FilterMetadata> {
  try {
    // Explicitly fallback to unknown/any for runtime parsing if ApiBase isn't generic
    const { data } = await ApiBase.get("api/v1/metadata");
    const marketData = transformData(data as RawMetadataInput);
    return marketData;
  } catch (error) {
    // Fixed: standard error object type checking for lint rules that ban error.message directly on 'unknown'
    if (error instanceof Error) {
      console.error("Error fetching data:", error.message);
    } else {
      console.error("Error fetching data:", error);
    }
    throw error;
  }
}
