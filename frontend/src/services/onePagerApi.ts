import getOnePagerMock from "@/services/mocks/getOnePager.json";
import type {
  NationalOnePagerCreatePayload,
  OnePagerRecordStatus,
} from "@/services/createFormApi";
import { landingList, removeLandingCard } from "@/services/landingListStore";
import {
  mapGetOnePagerResponse,
  type GetOnePagerApiResponse,
} from "@/services/mapGetOnePagerResponse";
import type { RetailerOnePagerCreatePayload } from "@/services/retailerCreateFormApi";
import {
  toOnePagerSearchPayload,
  type FilterPayload,
  type OnePagerListItem,
  type OnePagerStatus,
  type OnePagerType,
} from "@/types/onePager";

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

function matchesFilter(item: OnePagerListItem, filters: FilterPayload) {
  // Multi-select: empty array = no constraint; non-empty = OR match on that key.
  if (filters.market.length > 0 && !filters.market.includes(item.market)) {
    return false;
  }
  if (
    filters.retailer.length > 0 &&
    !filters.retailer.includes(item.retailer)
  ) {
    return false;
  }
  if (filters.channel.length > 0 && !filters.channel.includes(item.channel)) {
    return false;
  }
  if (
    filters.category.length > 0 &&
    !filters.category.includes(item.category)
  ) {
    return false;
  }
  if (
    filters.campaign.length > 0 &&
    !filters.campaign.includes(item.campaign_focus)
  ) {
    return false;
  }
  return true;
}

/**
 * TODO: Replace with real FastAPI list/search endpoint.
 * Temporary: normalize to array-only payload, then filter the in-memory
 * landingList (seeded from mocks/landingOnePagers.json; save/publish upserts
 * cover_image_url into the same list). Used by Submit + Clear all + import picker.
 * Next: POST /api/one-pagers/search with JSON body from toOnePagerSearchPayload —
 * always `{ market: string[], retailer: string[], channel: string[],
 * category: string[], campaign: string[] }` (never scalar strings).
 * Response cards should include cover_image_url (permanent URL).
 * Prefer server-side Active/Drafts/Archive + All/My if product agrees; today those
 * tabs are filtered on the FE from this full mock list.
 * Keep stable: FilterPayload / toOnePagerSearchPayload array shape,
 * OnePagerListItem[] response (incl. cover_image_url).
 */
export async function submitOnePagerSearch(
  filters: FilterPayload,
): Promise<OnePagerListItem[]> {
  // Backend contract: each dropdown is an array only.
  const payload = toOnePagerSearchPayload(filters);
  await delay();
  return landingList.filter((item) => matchesFilter(item, payload));
}

type OnePagerByIdBase = {
  id: string;
  status: OnePagerRecordStatus;
  created_by: string;
  /** Landing tab / view badge — Active, Draft, or Archive. */
  list_status: OnePagerStatus;
  published_at: string;
};

export type NationalOnePagerByIdRecord = OnePagerByIdBase & {
  pager_type: "national";
  payload: NationalOnePagerCreatePayload;
};

export type RetailerOnePagerByIdRecord = OnePagerByIdBase & {
  pager_type: "retailer";
  payload: RetailerOnePagerCreatePayload;
};

/** Common GET-by-id response — branch on `pager_type` then open the matching form. */
export type OnePagerByIdRecord =
  | NationalOnePagerByIdRecord
  | RetailerOnePagerByIdRecord;

export type EditOnePagerLocationState = {
  editRecord: OnePagerByIdRecord;
};

export function isEditLocationState(
  value: unknown,
): value is EditOnePagerLocationState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<EditOnePagerLocationState>;
  const record = state.editRecord;
  if (!record || typeof record !== "object") return false;
  return (
    typeof record.id === "string" &&
    (record.pager_type === "national" || record.pager_type === "retailer") &&
    Boolean(record.payload)
  );
}

export function isNationalEditState(
  value: unknown,
): value is { editRecord: NationalOnePagerByIdRecord } {
  return (
    isEditLocationState(value) && value.editRecord.pager_type === "national"
  );
}

export function isRetailerEditState(
  value: unknown,
): value is { editRecord: RetailerOnePagerByIdRecord } {
  return (
    isEditLocationState(value) && value.editRecord.pager_type === "retailer"
  );
}

function resolvePagerType(id: string): OnePagerType {
  const listing = landingList.find((item) => item.pager_id === id);
  if (listing) return listing.pager_type;
  if (id.startsWith("retailer-")) return "retailer";
  return "national";
}

/**
 * GET-by-id for View, Edit, and Track. Same API body for all three.
 *
 * TODO: Replace the function body with GET /api/one-pagers/:id returning
 * GetOnePagerApiResponse. Keep mapGetOnePagerResponse so View/Edit/Track
 * still receive OnePagerByIdRecord. Stamp pager_id from the URL in the mock
 * only. Import From National still uses getNationalOnePager (national-only).
 * Top-level `track` is ignored. RAG is pillar_track / initiative_track.
 * Mock strategy fields (market / channel / category / campaign_focus / retailer)
 * must match homepageMetadata option values, or Edit dropdowns render empty
 * (Select only shows a value that exists in the catalog).
 */
export async function getOnePagerById(
  id: string,
): Promise<OnePagerByIdRecord | null> {
  await delay(300);
  const pagerType = resolvePagerType(id);
  const api = structuredClone(getOnePagerMock) as GetOnePagerApiResponse;
  api.pager_id = id;
  api.pager_type = pagerType === "retailer" ? "Retailer" : "National";
  return mapGetOnePagerResponse(api);
}

export type DeleteOnePagerResult =
  | { ok: true; pager_id: string }
  | { ok: false; error: string };

/**
 * Mock DELETE one-pager by id.
 *
 * TODO: Replace with real FastAPI DELETE /api/one-pagers/:id (or soft-delete).
 * Temporary: remove from in-memory landingList by pager_id.
 * Keep request shape: pager_id only. Keep success → FE removes from
 * landing.items (Redux) without requiring a full list refetch.
 * On 404 / failure, return { ok: false, error } and leave Redux unchanged.
 */
export async function deleteOnePager(
  pagerId: string,
): Promise<DeleteOnePagerResult> {
  await delay(400);
  const trimmed = pagerId.trim();
  if (!trimmed) {
    return { ok: false, error: "Missing one-pager id." };
  }

  removeLandingCard(trimmed);
  // Even if the id was only in Redux (not the seed list), treat as success so
  // the card can still be dropped from landing.items after publish/upsert.
  return { ok: true, pager_id: trimmed };
}
