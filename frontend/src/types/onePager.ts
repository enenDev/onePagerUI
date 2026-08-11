export type OnePagerStatus = "ACTIVE" | "DRAFT" | "ARCHIVE";
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

export interface FilterMetadata {
  market: FilterOption[];
  retailer: FilterOption[];
  channel: FilterOption[];
  category: FilterOption[];
  campaign: FilterOption[];
}

export interface FilterPayload {
  market: string;
  retailer: string;
  channel: string;
  category: string;
  campaign: string;
}

export interface OnePagerListItem {
  market: string;
  retailer: string;
  category: string;
  campaign_focus: string;
  channel: string;
  title: string;
  business_outcome_statement: string;
  scoring_mode: ScoringMode;
  status: OnePagerStatus;
  created_by: string;
  published_at: string;
  pillars: unknown[];
}

export const CURRENT_USER_ID = "user-001";
export const CURRENT_USER_EMAIL = "nitesh@example.com";
export const CURRENT_USER_INITIALS = "NN";

export const emptyFilters: FilterPayload = {
  market: "",
  retailer: "",
  channel: "",
  category: "",
  campaign: "",
};
