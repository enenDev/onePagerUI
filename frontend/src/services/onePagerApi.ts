import type {
  NationalOnePagerCreatePayload,
  OnePagerRecordStatus,
} from "@/services/createFormApi";
import { removeLandingCard, updateLandingCardStatus } from "@/services/landingListStore";
import type { RetailerOnePagerCreatePayload } from "@/services/retailerCreateFormApi";
import {
  toOnePagerSearchPayload,
  type FilterPayload,
  type OnePagerListItem,
  type OnePagerStatus,
} from "@/types/onePager";
import ApiBase from "@/components/auth/apiBase";
import type { PagerUpdateArgs } from "@/redux/landingSlice";


// function matchesFilter(item: OnePagerListItem, filters: FilterPayload) {
//   // Multi-select: empty array = no constraint; non-empty = OR match on that key.
//   if (filters.market.length > 0 && !filters.market.includes(item.market)) {
//     return false;
//   }
//   if (
//     filters.retailer.length > 0 &&
//     !filters.retailer.includes(item.retailer)
//   ) {
//     return false;
//   }
//   if (filters.channel.length > 0 && !filters.channel.includes(item.channel)) {
//     return false;
//   }
//   if (
//     filters.category.length > 0 &&
//     !filters.category.includes(item.category)
//   ) {
//     return false;
//   }
//   if (
//     filters.campaign.length > 0 &&
//     !filters.campaign.includes(item.campaign_focus)
//   ) {
//     return false;
//   }
//   return true;
// }

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
  try {
    const payload = toOnePagerSearchPayload(filters);
    const { data } = await ApiBase.post('api/v1/pagers/fetch-all?skip=0&limit=499', payload)
    return data.pagers;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
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
  /**
   * Published → edit flows (Keep Active / Archive & Edit): hydrate form but
   * leave recordId null so Save Draft / Publish creates a new pager.
   */
  createAsNew?: boolean;
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

export type NationalEditLocationState = {
  editRecord: NationalOnePagerByIdRecord;
  createAsNew?: boolean;
};

export type RetailerEditLocationState = {
  editRecord: RetailerOnePagerByIdRecord;
  createAsNew?: boolean;
};

export function isNationalEditState(
  value: unknown,
): value is NationalEditLocationState {
  return (
    isEditLocationState(value) && value.editRecord.pager_type === "national"
  );
}

export function isRetailerEditState(
  value: unknown,
): value is RetailerEditLocationState {
  return (
    isEditLocationState(value) && value.editRecord.pager_type === "retailer"
  );
}

// function resolvePagerType(id: string): OnePagerType {
//   const listing = landingList.find((item) => item.pager_id === id);
//   if (listing) return listing.pager_type;
//   if (id.startsWith("retailer-")) return "retailer";
//   return "national";
// }

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
  try {
    const { data } = await ApiBase.get(`api/v1/pagers/${id}`)
    return {
      id: data.pager_id,
      status: data.status,
      created_by: data.created_by,
      pager_type: data.pager_type || "retailer",
      list_status: data.status,
      published_at: data.published_at,
      payload: { ...data, campaign: data.campaign_focus, target_retailer: data.retailer }
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
  // const pagerType = resolvePagerType(id);
  // const api = structuredClone(getOnePagerMock) as GetOnePagerApiResponse;
  // api.pager_id = id;
  // api.pager_type = pagerType === "retailer" ? "Retailer" : "National";
  // const mapped = mapGetOnePagerResponse(api);
  // // Prefer landing-list status so Archive/Restore mock updates show on View.
  // const listing = landingList.find((item) => item.pager_id === id);
  // if (listing) {
  //   return {
  //     ...mapped,
  //     list_status: listing.status,
  //     status: listing.status === "DRAFT" ? "draft" : "published",
  //   };
  // }
  // return mapped;
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
  pagerId: string, user: string
): Promise<DeleteOnePagerResult> {
  const trimmed = pagerId.trim();
  try {
    await ApiBase.patch(`api/v1/pagers/${trimmed}/status`, { status: "DELETED", updated_by: user })
    // removeLandingCard(trimmed);
    return { ok: true, pager_id: trimmed }
  } catch (error) {
    if (!trimmed) {
      return { ok: false, error: "Missing one-pager id." };
    }
    console.error("Error fetching data:", error);
    throw error;
  }


  // Even if the id was only in Redux (not the seed list), treat as success so
  // the card can still be dropped from landing.items after publish/upsert.
  return { ok: true, pager_id: trimmed };
}


export async function updateOnePagerStatus(
  pagerId: string, updatedBy: string, newStatus: string
): Promise<DeleteOnePagerResult> {
  const trimmed = pagerId.trim();
  try {
    await ApiBase.patch(`api/v1/pagers/${trimmed}/status`, { status: newStatus, updated_by: updatedBy })
    removeLandingCard(trimmed);
    return { ok: true, pager_id: trimmed }
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}
export type ArchiveRestoreOnePagerResult =
  | { ok: true; pager_id: string; status: OnePagerStatus }
  | { ok: false; error: string };

/**
 * Mock archive — published → ARCHIVED.
 *
 * TODO: Replace with POST /api/one-pagers/:id/archive.
 * Temporary: updateLandingCardStatus in landingListStore.
 * Keep { ok, pager_id, status: "ARCHIVED" }. Owner-only on FE; server 403 later.
 */
export async function archiveOnePager(
  args: PagerUpdateArgs
): Promise<ArchiveRestoreOnePagerResult> {
  const trimmed = args?.pagerId.trim();
  if (!trimmed) {
    return { ok: false, error: "Missing one-pager id." };
  }
  await ApiBase.patch(`api/v1/pagers/${trimmed}/status`, { status: "ARCHIVED", updated_by: args?.user || "" })
  // removeLandingCard(trimmed);
  // return { ok: true, pager_id: trimmed }
  const updated = updateLandingCardStatus(trimmed, "ARCHIVED");
  if (!updated) {
    // Card may exist only in Redux (post-publish upsert). Still succeed so FE
    // can patch landing.items.
    return { ok: true, pager_id: trimmed, status: "ARCHIVED" };
  }
  return { ok: true, pager_id: trimmed, status: "ARCHIVED" };
}

/**
 * Mock restore — archived → DRAFT (not Active).
 *
 * TODO: Replace with POST /api/one-pagers/:id/restore.
 * Temporary: updateLandingCardStatus → DRAFT.
 * Keep { ok, pager_id, status: "DRAFT" }. Owner-only on FE; server 403 later.
 */
export async function restoreOnePager(
  args: PagerUpdateArgs,
): Promise<ArchiveRestoreOnePagerResult> {
  const trimmed = args?.pagerId.trim();
  if (!trimmed) {
    return { ok: false, error: "Missing one-pager id." };
  }
  await ApiBase.patch(`api/v1/pagers/${trimmed}/status`, { status: "DRAFT", updated_by: args?.user || "" })
  const updated = updateLandingCardStatus(trimmed, "DRAFT");
  if (!updated) {
    return { ok: true, pager_id: trimmed, status: "DRAFT" };
  }
  return { ok: true, pager_id: trimmed, status: "DRAFT" };
}
