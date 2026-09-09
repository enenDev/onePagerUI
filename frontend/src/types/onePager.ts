export type OnePagerStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED" | "DELETED";
export type OnePagerType = "national" | "retailer";
export type ScoringMode = "WEIGHTED" | "UNWEIGHTED";
export type StatusTab = "active" | "drafts" | "archive";
export type ScopeTab = "all" | "my";

export type FilterKey =
  | "market"
  | "retailer"
  | "channel"
  | "category"
  | "campaign"
  | "business_group"
  | "year";

/** Market-scoped dependent filter keys (exclude market itself + market-independent year). */
export type MarketScopedFilterKey = Exclude<FilterKey, "market" | "year">;

export interface FilterOption {
  label: string;
  value: string;
}

/**
 * Dependent options for one market.
 * - retailer/channel/category/campaign feed the homepage filters + strategy form.
 * - accountableTeam/kpisByPillarNumber feed the create-form initiative modal
 *   (Accountable Function/Department + per-pillar KPI Metric). All come from the
 *   same market object in the metadata response.
 */
export interface MarketScopedFilterOptions {
  retailer: FilterOption[];
  channel: FilterOption[];
  category: FilterOption[];
  campaign: FilterOption[];
  /** Business Group options (market-dependent), from `business_group`. */
  business_group: FilterOption[];
  accountableTeam: FilterOption[];
  /** KPI options keyed by pillar_number (1–5), from pillar_kpi_1…pillar_kpi_5. */
  kpisByPillarNumber: Record<number, FilterOption[]>;
}

/**
 * Homepage filter metadata.
 * - `market` stays a flat option list (always available).
 * - `optionsByMarket` holds retailer/channel/category/campaign per market value.
 */
export interface FilterMetadata {
  market: FilterOption[];
  optionsByMarket: Record<string, MarketScopedFilterOptions>;
}

/**
 * Homepage search body for backend (mock today, FastAPI later).
 * Every dropdown is multi-select → each key is always a `string[]`
 * (empty array = no filter on that key; never a bare string).
 */
export interface FilterPayload {
  market: string[];
  retailer: string[];
  channel: string[];
  category: string[];
  campaign: string[];
  /** Market-dependent Business Group filter. */
  business_group: string[];
  /** Market-independent Year filter (current + next year). */
  year: string[];
  campaign_focus?: string[];
}

/** Clone UI filter state into the array-only API request body. */
export function toOnePagerSearchPayload(filters: FilterPayload): FilterPayload {
  return {
    market: [...filters.market],
    retailer: [...filters.retailer],
    channel: [...filters.channel],
    category: [...filters.category],
    campaign: [...filters.campaign],
    business_group: [...filters.business_group],
    year: [...filters.year],
  };
}

export interface OnePagerListItem {
  /** Stable record id — used for GET-by-id, edit, track, export. */
  pager_id: string;
  /** Which create/edit form and API surface this row belongs to. */
  pager_type: OnePagerType;
  market: string;
  retailer: string;
  category: string;
  campaign_focus: string;
  channel: string;
  /** Business Group (market-dependent). */
  business_group?: string;
  /** Plan year, e.g. "2026". */
  year?: string;
  title: string;
  business_outcome_statement: string;
  /**
   * Signed cover URL for landing card display.
   */
  image_signed_url?: string | null;
  /**
   * Legacy list field. Prefer image_signed_url when the API sends both.
   */
  cover_image_url?: string | null;
  scoring_mode: ScoringMode;
  status: OnePagerStatus;
  created_by: string;
  published_at: string;
  updated_at?: string;
  pillars: unknown[];
}

export const emptyFilters: FilterPayload = {
  market: [],
  retailer: [],
  channel: [],
  category: [],
  campaign: [],
  business_group: [],
  year: [],
};

/** Fresh empty selection — avoid sharing array refs with Redux state. */
export function createEmptyFilters(): FilterPayload {
  return {
    market: [],
    retailer: [],
    channel: [],
    category: [],
    campaign: [],
    business_group: [],
    year: [],
  };
}
