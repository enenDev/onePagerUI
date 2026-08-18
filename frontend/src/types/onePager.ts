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
  | "campaign";

export interface FilterOption {
  label: string;
  value: string;
}

/** Dependent homepage filters for one market (not used by create-form APIs). */
export interface MarketScopedFilterOptions {
  retailer: FilterOption[];
  channel: FilterOption[];
  category: FilterOption[];
  campaign: FilterOption[];
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
}

/** Clone UI filter state into the array-only API request body. */
export function toOnePagerSearchPayload(filters: FilterPayload): FilterPayload {
  return {
    market: [...filters.market],
    retailer: [...filters.retailer],
    channel: [...filters.channel],
    category: [...filters.category],
    campaign: [...filters.campaign],
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
  title: string;
  business_outcome_statement: string;
  /**
   * Cover from create/edit (`cover_image.blob_url`). Null when none.
   * TODO: Real list API should return a permanent CDN URL, not blob:.
   */
  cover_image_url: string | null;
  scoring_mode: ScoringMode;
  status: OnePagerStatus;
  created_by: string;
  published_at: string;
  pillars: unknown[];
}

export const CURRENT_USER_ID = "user-001";
export const CURRENT_USER_EMAIL = "nitesh@example.com";
export const CURRENT_USER_INITIALS = "NN";

export function isCurrentUserOwner(createdBy: string) {
  return createdBy === CURRENT_USER_ID;
}

export const emptyFilters: FilterPayload = {
  market: [],
  retailer: [],
  channel: [],
  category: [],
  campaign: [],
};

/** Fresh empty selection — avoid sharing array refs with Redux state. */
export function createEmptyFilters(): FilterPayload {
  return {
    market: [],
    retailer: [],
    channel: [],
    category: [],
    campaign: [],
  };
}
