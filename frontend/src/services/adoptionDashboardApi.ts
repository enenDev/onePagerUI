import ApiBase from "@/components/auth/apiBase";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import type { IsoDateRange } from "@/lib/adoptionPeriod";

export type DashboardRole = "CSP" | "CBD" | "General";

export type RoleBreakdown = Partial<Record<DashboardRole, number | null>>;

export type MetricValue = {
  total: number | null;
  by_role: RoleBreakdown;
};

export type MarketRateRow = {
  market: string;
  csp: number | null;
  cbd: number | null;
};

export type DashboardFilterPayload = {
  markets: string[];
  current: IsoDateRange;
  previous: IsoDateRange;
};

export type FunnelResponse = {
  provisioned_users: MetricValue;
  onboarding_rate: MetricValue;
  engagement_rate: MetricValue;
  adoption_rate: MetricValue;
};

export type OnboardingResponse = {
  by_market: MarketRateRow[];
  onboarded_users: MetricValue;
  onboarded_users_growth_rate: MetricValue;
  total_one_pager_views: MetricValue;
};

export type EngagementResponse = {
  by_market: MarketRateRow[];
  engaged_users: MetricValue;
  track_to_publish: MetricValue;
  total_exports: MetricValue;
};

export type AdoptionResponse = {
  by_market: MarketRateRow[];
  adopted_users: MetricValue;
  adopted_users_growth_rate: MetricValue;
  draft_to_publish: MetricValue;
  total_one_pagers_published: MetricValue;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function asMetric(value: unknown, roles: DashboardRole[]): MetricValue {
  const record = asRecord(value);
  const byRoleRaw = asRecord(record?.by_role);
  const by_role: RoleBreakdown = {};
  for (const role of roles) {
    by_role[role] = asNumber(byRoleRaw?.[role]);
  }
  return {
    total: asNumber(record?.total),
    by_role,
  };
}

function asMarketRows(value: unknown): MarketRateRow[] {
  if (!Array.isArray(value)) return [];
  const rows: MarketRateRow[] = [];
  for (const item of value) {
    const record = asRecord(item);
    const market = typeof record?.market === "string" ? record.market.trim() : "";
    if (!market) continue;
    const roles = asRecord(record?.roles);
    const csp = asNumber(roles?.CSP);
    const cbd = asNumber(roles?.CBD);
    if (csp === null && cbd === null) continue;
    rows.push({ market, csp, cbd });
  }
  return rows;
}

const COUNT_ROLES: DashboardRole[] = ["CSP", "CBD", "General"];
const RATE_ROLES: DashboardRole[] = ["CSP", "CBD"];

export function emptyFunnel(): FunnelResponse {
  const empty = () => asMetric(null, RATE_ROLES);
  return {
    provisioned_users: asMetric(null, COUNT_ROLES),
    onboarding_rate: empty(),
    engagement_rate: empty(),
    adoption_rate: empty(),
  };
}

export function emptyOnboarding(): OnboardingResponse {
  return {
    by_market: [],
    onboarded_users: asMetric(null, COUNT_ROLES),
    onboarded_users_growth_rate: asMetric(null, RATE_ROLES),
    total_one_pager_views: asMetric(null, COUNT_ROLES),
  };
}

export function emptyEngagement(): EngagementResponse {
  return {
    by_market: [],
    engaged_users: asMetric(null, RATE_ROLES),
    track_to_publish: asMetric(null, RATE_ROLES),
    total_exports: asMetric(null, COUNT_ROLES),
  };
}

export function emptyAdoption(): AdoptionResponse {
  return {
    by_market: [],
    adopted_users: asMetric(null, RATE_ROLES),
    adopted_users_growth_rate: asMetric(null, RATE_ROLES),
    draft_to_publish: asMetric(null, RATE_ROLES),
    total_one_pagers_published: asMetric(null, RATE_ROLES),
  };
}

function parseFunnel(data: unknown): FunnelResponse {
  const record = asRecord(data);
  if (!record) return emptyFunnel();
  return {
    provisioned_users: asMetric(record.provisioned_users, COUNT_ROLES),
    onboarding_rate: asMetric(record.onboarding_rate, RATE_ROLES),
    engagement_rate: asMetric(record.engagement_rate, RATE_ROLES),
    adoption_rate: asMetric(record.adoption_rate, RATE_ROLES),
  };
}

function parseOnboarding(data: unknown): OnboardingResponse {
  const record = asRecord(data);
  if (!record) return emptyOnboarding();
  return {
    by_market: asMarketRows(record.by_market),
    onboarded_users: asMetric(record.onboarded_users, COUNT_ROLES),
    onboarded_users_growth_rate: asMetric(
      record.onboarded_users_growth_rate,
      RATE_ROLES,
    ),
    total_one_pager_views: asMetric(record.total_one_pager_views, COUNT_ROLES),
  };
}

function parseEngagement(data: unknown): EngagementResponse {
  const record = asRecord(data);
  if (!record) return emptyEngagement();
  return {
    by_market: asMarketRows(record.by_market),
    engaged_users: asMetric(record.engaged_users, RATE_ROLES),
    track_to_publish: asMetric(record.track_to_publish, RATE_ROLES),
    total_exports: asMetric(record.total_exports, COUNT_ROLES),
  };
}

function parseAdoption(data: unknown): AdoptionResponse {
  const record = asRecord(data);
  if (!record) return emptyAdoption();
  return {
    by_market: asMarketRows(record.by_market),
    adopted_users: asMetric(record.adopted_users, RATE_ROLES),
    adopted_users_growth_rate: asMetric(
      record.adopted_users_growth_rate,
      RATE_ROLES,
    ),
    draft_to_publish: asMetric(record.draft_to_publish, RATE_ROLES),
    total_one_pagers_published: asMetric(
      record.total_one_pagers_published,
      RATE_ROLES,
    ),
  };
}

async function postDashboard<T>(
  path: string,
  body: DashboardFilterPayload,
  parse: (data: unknown) => T,
): Promise<T> {
  const { data } = await ApiBase.post(path, body);
  return parse(data);
}

export function getAdoptionFunnel(body: DashboardFilterPayload) {
  return postDashboard(API_ENDPOINTS.dashboardFunnel, body, parseFunnel);
}

export function getAdoptionOnboarding(body: DashboardFilterPayload) {
  return postDashboard(
    API_ENDPOINTS.dashboardOnboarding,
    body,
    parseOnboarding,
  );
}

export function getAdoptionEngagement(body: DashboardFilterPayload) {
  return postDashboard(
    API_ENDPOINTS.dashboardEngagement,
    body,
    parseEngagement,
  );
}

export function getAdoptionDashboard(body: DashboardFilterPayload) {
  return postDashboard(API_ENDPOINTS.dashboardAdoption, body, parseAdoption);
}
