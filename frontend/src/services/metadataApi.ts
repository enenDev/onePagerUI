import ApiBase from "@/components/auth/apiBase";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import type {
  FilterMetadata,
  FilterOption,
  MarketScopedFilterKey,
} from "@/types/onePager";

type DependentFilterKey = MarketScopedFilterKey;

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

/** Number of pillars whose KPI lists arrive as pillar_kpi_1…pillar_kpi_N. */
const PILLAR_COUNT = 5;

// 1. Define the API response structure to eliminate implicit 'any'
interface RawMarketOptions {
  retailer?: string[];
  channel?: string[];
  category?: string[];
  campaign?: string[];
  /** Business Group options (market-dependent). */
  business_group?: string[];
  /** Accountable Function/Department options for the initiative modal. */
  accountable_team?: string[];
  /** Per-pillar KPI options (pillar_kpi_1 … pillar_kpi_5). */
  [pillarKpiKey: `pillar_kpi_${number}`]: string[] | undefined;
}

interface RawMetadataInput {
  [marketKey: string]: RawMarketOptions;
}

type MetadataItemOption = {
  value: string;
  label?: string;
};

type MetadataItemsMarketResponse = {
  retailer?: MetadataItemOption[];
  channel?: MetadataItemOption[];
  category?: MetadataItemOption[];
  campaign?: MetadataItemOption[];
  business_group?: MetadataItemOption[];
  accountable_team?: MetadataItemOption[];
  pillar_kpi_1?: MetadataItemOption[];
  pillar_kpi_2?: MetadataItemOption[];
  pillar_kpi_3?: MetadataItemOption[];
  pillar_kpi_4?: MetadataItemOption[];
  pillar_kpi_5?: MetadataItemOption[];
  year?: MetadataItemOption[];
};

type MetadataItemsInput = Record<string, MetadataItemsMarketResponse>;

const toOptions = (items: string[] | undefined): FilterOption[] =>
  (items ?? []).map((item) => ({ label: item, value: item }));

const toNormalizedOptions = (
  items: MetadataItemOption[] | undefined,
): FilterOption[] =>
  (items ?? [])
    .map((item) => ({
      label: item.label || item.value,
      value: item.value,
    }))
    .filter((item) => item.label && item.value);

const toKpiOptions = (
  items: MetadataItemOption[] | undefined,
): FilterOption[] =>
  (items ?? []).map((item) => ({
    label: item.label || item.value,
    value: item.value,
  }));

// 2. Type-safe data transformer with exact existing logic
const transformData = (input: RawMetadataInput): FilterMetadata => {
  const market: FilterOption[] = [];
  const optionsByMarket: FilterMetadata["optionsByMarket"] = {};

  Object.keys(input).forEach((marketKey) => {
    market.push({ label: marketKey, value: marketKey });

    const raw = input[marketKey] ?? {};

    const kpisByPillarNumber: Record<number, FilterOption[]> = {};
    for (let pillar = 1; pillar <= PILLAR_COUNT; pillar += 1) {
      kpisByPillarNumber[pillar] = toOptions(raw[`pillar_kpi_${pillar}`]);
    }

    optionsByMarket[marketKey] = {
      retailer: toOptions(raw.retailer),
      channel: toOptions(raw.channel),
      category: toOptions(raw.category),
      campaign: toOptions(raw.campaign),
      business_group: toOptions(raw.business_group),
      accountableTeam: toOptions(raw.accountable_team),
      kpisByPillarNumber,
    };
  });

  return {
    market,
    optionsByMarket,
  };
};

const transformMetadataItemsData = (
  input: MetadataItemsInput,
): FilterMetadata => {
  const market: FilterOption[] = [];
  const optionsByMarket: FilterMetadata["optionsByMarket"] = {};

  Object.keys(input).forEach((marketKey) => {
    market.push({ label: marketKey, value: marketKey });

    const raw = input[marketKey] ?? {};
    const kpisByPillarNumber: Record<number, FilterOption[]> = {};

    for (let pillar = 1; pillar <= PILLAR_COUNT; pillar += 1) {
      const key = `pillar_kpi_${pillar}`;
      const rawKeyed = (raw as Record<string, MetadataItemOption[] | undefined>)[
        key
      ];
      kpisByPillarNumber[pillar] = toKpiOptions(rawKeyed);
    }

    optionsByMarket[marketKey] = {
      retailer: toNormalizedOptions(raw.retailer),
      channel: toNormalizedOptions(raw.channel),
      category: toNormalizedOptions(raw.category),
      campaign: toNormalizedOptions(raw.campaign),
      business_group: toNormalizedOptions(raw.business_group),
      accountableTeam: toNormalizedOptions(raw.accountable_team),
      kpisByPillarNumber,
    };
  });

  return {
    market,
    optionsByMarket,
  };
};

/**
 * Temporary runtime switch for testing the normalized metadata_items source.
 * Keep this false by default so the current legacy flow remains the production path.
 * Set to true only when validating the adapter against the existing FE contract.
 */
export const USE_METADATA_ITEMS_SOURCE = true;

export async function getMetadata(): Promise<FilterMetadata> {
  if (USE_METADATA_ITEMS_SOURCE) {
    return getMetadataItems();
  }

  try {
    // Explicitly fallback to unknown/any for runtime parsing if ApiBase isn't generic
    const { data } = await ApiBase.get(API_ENDPOINTS.metadata);
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

export async function getMetadataItems(): Promise<FilterMetadata> {
  try {
    const { data } = await ApiBase.get(API_ENDPOINTS.metadataItems);
    return transformMetadataItemsData(data as MetadataItemsInput);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching metadata items:", error.message);
    } else {
      console.error("Error fetching metadata items:", error);
    }
    throw error;
  }
}
