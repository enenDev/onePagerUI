import type { RetailerFormValues } from "@/components/form/retailerForm";
import type {
  PillarDraft,
  ScoringMode,
} from "@/components/form/pillars";
import type {
  FilterOption,
  MarketScopedOptions,
  NationalImagePayload,
  NationalInitiativePayload,
  NationalPillarPayload,
  OnePagerRecordStatus,
} from "@/services/createFormApi";

export type { FilterOption, MarketScopedOptions };

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export type RetailerOnePagerCreatePayload = {
  market: string;
  target_retailer: string;
  category: string;
  campaign: string;
  channel: string;
  title: string;
  business_outcome_statement: string;
  cover_image: NationalImagePayload | null;
  scoring_mode: ScoringMode;
  pillars: NationalPillarPayload[];
};

/**
 * Builds the create/save/publish request body from retailer form state.
 *
 * TODO: When image upload exists, upload files first then put permanent URLs into
 * form state (or map here). Do not POST raw `blob:` URLs as final image locations.
 * Keep field names (`target_retailer`, `cover_image.blob_url`, pillar/initiative shape)
 * stable when swapping to FastAPI.
 */
export function buildRetailerOnePagerPayload(
  values: RetailerFormValues,
  scoringMode: ScoringMode,
  pillars: PillarDraft[],
): RetailerOnePagerCreatePayload {
  return {
    market: values.market,
    target_retailer: values.targetRetailer,
    category: values.category,
    campaign: values.campaign,
    channel: values.channel,
    title: values.title.trim(),
    business_outcome_statement: values.businessOutcome.trim(),
    cover_image: values.coverImageUrl
      ? {
          name: values.coverImageName,
          blob_url: values.coverImageUrl,
        }
      : null,
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
          images: initiative.images.map((image) => ({
            id: image.id,
            name: image.name,
            blob_url: image.blobUrl,
          })),
        }),
      ),
    })),
  };
}

export type RetailerOnePagerMutationResult =
  | { ok: true; id: string; status: OnePagerRecordStatus }
  | { ok: false; error: string };

type StoredRetailerRecord = {
  id: string;
  status: OnePagerRecordStatus;
  payload: RetailerOnePagerCreatePayload;
};

/**
 * In-memory mock DB for retailer one-pagers.
 *
 * TODO: Delete `retailerRecords` Map when FastAPI persistence exists.
 * - Real drafts/publishes must live in backend DB.
 * - GET-by-id for edit is getOnePagerById in onePagerApi (common fetch + pager_type).
 * - Landing lists should read from the same backend source.
 */
const retailerRecords = new Map<string, StoredRetailerRecord>();

function createRecordId(status: OnePagerRecordStatus) {
  const prefix = status === "draft" ? "retailer-draft" : "retailer-published";
  return `${prefix}-${crypto.randomUUID()}`;
}

function upsertRetailerRecord(
  payload: RetailerOnePagerCreatePayload,
  status: OnePagerRecordStatus,
  id?: string | null,
): RetailerOnePagerMutationResult {
  const existing = id ? retailerRecords.get(id) : undefined;
  const nextId = existing?.id ?? createRecordId(status);

  retailerRecords.set(nextId, {
    id: nextId,
    status,
    payload: structuredClone(payload),
  });

  return { ok: true, id: nextId, status };
}

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
  await delay(400);
  return upsertRetailerRecord(payload, "draft", id);
}

/**
 * Mock POST publish for retailer one-pagers.
 *
 * TODO: Replace with POST /api/retailer-one-pagers/publish
 * Response: { id, status: "published" }. Preview stays on-page after success.
 */
export async function publishRetailerOnePager(
  payload: RetailerOnePagerCreatePayload,
  id?: string | null,
): Promise<RetailerOnePagerMutationResult> {
  await delay(500);
  return upsertRetailerRecord(payload, "published", id);
}
