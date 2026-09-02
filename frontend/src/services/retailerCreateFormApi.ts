import type { RetailerFormValues } from "@/components/form/retailerForm";
import type {
  PillarDraft,
  ScoringMode,
} from "@/components/form/pillars";
import {
  mapInitiativeImageFields,
  toPublicImageSavePayload,
  type FilterOption,
  type MarketScopedOptions,
  type NationalInitiativePayload,
  type NationalPillarPayload,
  type OnePagerRecordStatus,
} from "@/services/createFormApi";
import ApiBase from "@/components/auth/apiBase";

export type { FilterOption, MarketScopedOptions };


export type RetailerOnePagerCreatePayload = {
  market: string;
  target_retailer: string;
  category: string;
  campaign: string;
  channel: string;
  title: string;
  created_by?: string;
  pager_type?: string;
  business_outcome_statement: string;
  image_url: string | null;
  image_signed_url?: string | null;
  scoring_mode: ScoringMode;
  pillars: NationalPillarPayload[];
  status?:string;
  published_at?: string;
  published_by?: string;  
  campaign_focus?: string;
  retailer?: string;
};

/**
 * Builds the create/save/publish request body from retailer form state.
 * Image URLs must already be uploaded into form state (`uploadImage`).
 * Keep field names (`target_retailer`, `cover_image.blob_url`, pillar/initiative shape)
 * stable when swapping to FastAPI.
 */
export function buildRetailerOnePagerPayload(
  values: RetailerFormValues,
  scoringMode: ScoringMode,
  pillars: PillarDraft[],
): RetailerOnePagerCreatePayload {
  const image_url = values.coverImagePublicUrl || null;
  const image_signed_url = values.coverImageUrl || null;
  return {
    market: values.market,
    target_retailer: values.targetRetailer,
    category: values.category,
    campaign: values.campaign,
    channel: values.channel,
    title: values.title.trim(),
    business_outcome_statement: values.businessOutcome.trim(),
    image_url,
    image_signed_url,
    scoring_mode: scoringMode,
    pillars: pillars.map((pillar) => ({
      pillar_number: pillar.pillar_number,
      pillar_name: pillar.pillar_name,
      pillar_description: pillar.pillar_description.trim(),
      pillar_weight: pillar.pillar_weight,
      initiatives: pillar.initiatives.map(
        (initiative): NationalInitiativePayload => ({
          initiative_number: initiative.initiative_number,
          priority_level: initiative.priority_level,
          accountable_function_department:
            initiative.accountable_function_department,
          initiative_description: initiative.initiative_description,
          kpi_metric: initiative.kpi_metric,
          success_target: initiative.success_target,
          unit: initiative.unit,
          week_start: initiative.week_start,
          week_end: initiative.week_end,
          guidelines: initiative.guidelines,
          checklist_compliance_notes: initiative.checklist_compliance_notes,
          ...mapInitiativeImageFields(initiative.images),
        }),
      ),
    })),
  };
}

export type RetailerOnePagerMutationResult =
  | { ok: true; id: string; status: OnePagerRecordStatus,error?: string }
  | { ok: false; error: string };

// type StoredRetailerRecord = {
//   id: string;
//   status: OnePagerRecordStatus;
//   payload: RetailerOnePagerCreatePayload;
// };

/**
 * In-memory mock DB for retailer one-pagers.
 *
 * TODO: Delete `retailerRecords` Map when FastAPI persistence exists.
 * - Real drafts/publishes must live in backend DB.
 * - GET-by-id for edit is getOnePagerById in onePagerApi (common fetch + pager_type).
 * - Landing lists should read from the same backend source.
 */
// const retailerRecords = new Map<string, StoredRetailerRecord>();

// function createRecordId(status: OnePagerRecordStatus) {
//   const prefix = status === "draft" ? "retailer-draft" : "retailer-published";
//   return `${prefix}-${crypto.randomUUID()}`;
// }

// function upsertRetailerRecord(
//   payload: RetailerOnePagerCreatePayload,
//   status: OnePagerRecordStatus,
//   id?: string | null,
// ): RetailerOnePagerMutationResult {
//   const existing = id ? retailerRecords.get(id) : undefined;
//   const nextId = existing?.id ?? createRecordId(status);

//   retailerRecords.set(nextId, {
//     id: nextId,
//     status,
//     payload: structuredClone(payload),
//   });

//   // TODO: Remove FE landing upsert when FastAPI list returns saved/published
//   // rows with permanent cover_image_url. Keep card cover_image_url field name.
//   upsertLandingCardFromPayload({
//     pager_id: nextId,
//     pager_type: "retailer",
//     record_status: status,
//     payload,
//   });

//   return { ok: true, id: nextId, status };
// }

/**
 * Mock POST save-draft for retailer one-pagers.
 *
 * TODO: Replace with POST /api/retailer-one-pagers/draft
 * Body: RetailerOnePagerCreatePayload (+ id when updating existing draft)
 * Response: { id, status: "draft" } — keep RetailerOnePagerMutationResult shape.
 */
export async function saveRetailerDraft(
  payload: RetailerOnePagerCreatePayload,
  id?: string | null,
): Promise<RetailerOnePagerMutationResult> {
  try {
    if (id) {
      const { data } = await ApiBase.patch(`api/v1/pagers/${id}`, { ...toPublicImageSavePayload(payload), pager_id: id || "" })
      return { ok: true, id: data?.pager_id || "", status: "draft" };
    }
    const {data} = await ApiBase.post('api/v1/pagers', { ...toPublicImageSavePayload(payload), pager_id: id || "" })
    return { ok: true, id: data?.pager_id || "", status: "draft" };
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

/**
 * Mock POST publish for retailer one-pagers.
 *
 * TODO: Replace with POST /api/retailer-one-pagers/publish
 * Response: { id, status: "published" }. FE then replace-navigates to `/track/:id`.
 */
export async function publishRetailerOnePager(
  payload: RetailerOnePagerCreatePayload,
  id?: string | null,
): Promise<RetailerOnePagerMutationResult> {
  try {
    if (id) {
      const { data } = await ApiBase.patch(`api/v1/pagers/${id}`, { ...toPublicImageSavePayload(payload), pager_id: id || "" })
      return { ok: true, id: data?.pager_id || "", status: "draft" };
    }
    const { data } = await ApiBase.post('api/v1/pagers', { ...toPublicImageSavePayload(payload), pager_id: id || "" })
    return { ok: true, id: data?.pager_id || "", status: "published" };
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}
