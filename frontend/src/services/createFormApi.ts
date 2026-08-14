import type { NationalFormValues } from "@/components/form/nationalForm";
import type {
  PillarDraft,
  ScoringMode,
} from "@/components/form/pillars";

export type FilterOption = {
  label: string;
  value: string;
};

export type MarketScopedOptions = {
  categories: FilterOption[];
  campaigns: FilterOption[];
  channels: FilterOption[];
};

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

const markets: FilterOption[] = [
  { label: "National", value: "National" },
  { label: "US", value: "US" },
];

/** In-memory campaign list per market — Add Campaign appends here (mock DB). */
// TODO: Remove in-memory `campaignsByMarket` when campaigns come from backend.
// Real flow should load campaigns via market-scoped options API and persist new
// campaigns with POST add-campaign (see `addCampaign` TODO below).
const campaignsByMarket: Record<string, FilterOption[]> = {
  National: [
    { label: "National Growth Program", value: "National Growth Program" },
    { label: "Summer Freshness", value: "Summer Freshness" },
  ],
  US: [
    { label: "Summer Freshness", value: "Summer Freshness" },
    { label: "Scalp & Shine", value: "Scalp & Shine" },
    { label: "Fresh Breath", value: "Fresh Breath" },
  ],
};

const categoriesByMarket: Record<string, FilterOption[]> = {
  National: [
    { label: "Hair Care", value: "Hair Care" },
    { label: "Oral Care", value: "Oral Care" },
    { label: "Execution Excellence", value: "Execution Excellence" },
  ],
  US: [
    { label: "Hair Care", value: "Hair Care" },
    { label: "Oral Care", value: "Oral Care" },
    { label: "Deodorants", value: "Deodorants" },
  ],
};

const channelsByMarket: Record<string, FilterOption[]> = {
  National: [
    { label: "All Channels", value: "All Channels" },
    { label: "Supermarket", value: "Supermarket" },
  ],
  US: [
    { label: "Supermarket", value: "Supermarket" },
    { label: "Hypermarket", value: "Hypermarket" },
  ],
};

export async function getCreateFormMarkets(): Promise<FilterOption[]> {
  // TODO: Replace with real API (e.g. GET /api/create-form/markets).
  // Keep `FilterOption[]` return shape for NationalStrategyForm selects.
  await delay();
  return structuredClone(markets);
}

export async function getOptionsForMarket(
  market: string,
): Promise<MarketScopedOptions> {
  // TODO: Replace with real API (e.g. GET /api/create-form/options?market=...).
  // Must return categories/campaigns/channels for the selected market.
  // On market change the FE already resets category/campaign/channel — keep that contract.
  await delay();
  if (!market) {
    return { categories: [], campaigns: [], channels: [] };
  }

  return {
    categories: structuredClone(categoriesByMarket[market] ?? []),
    campaigns: structuredClone(campaignsByMarket[market] ?? []),
    channels: structuredClone(channelsByMarket[market] ?? []),
  };
}

export type AddCampaignResult =
  | { ok: true; campaign: FilterOption }
  | { ok: false; error: string };

/**
 * TODO: Replace with real FastAPI add-campaign endpoint.
 * - POST body: { market, campaign_name }
 * - On success, FE already appends to local campaign select + selects the new value.
 * - Remove mutation of in-memory `campaignsByMarket`.
 */
export async function addCampaign(
  market: string,
  campaignName: string,
): Promise<AddCampaignResult> {
  await delay(400);

  const trimmed = campaignName.trim();
  if (!market) {
    return { ok: false, error: "Select a market before adding a campaign." };
  }
  if (!trimmed) {
    return { ok: false, error: "Campaign name is required." };
  }

  const list = campaignsByMarket[market] ?? (campaignsByMarket[market] = []);
  const exists = list.some(
    (item) => item.value.toLowerCase() === trimmed.toLowerCase(),
  );

  if (exists) {
    return {
      ok: false,
      error: "This campaign already exists for the selected market.",
    };
  }

  const campaign = { label: trimmed, value: trimmed };
  list.push(campaign);
  return { ok: true, campaign };
}

/**
 * Image fields on the national create/save payload.
 *
 * TODO: Image upload / blob storage integration
 * - Today `blob_url` is a browser-only `blob:...` object URL (not durable, not sendable as final CDN URL).
 * - Keep payload field names stable for the form (`name` + `blob_url`) OR introduce `url` alongside
 *   `blob_url` and map after upload — avoid renaming form state fields without a migration plan.
 * - Real flow (preferred):
 *   1) Upload cover `File` + each initiative `File` to backend/storage (multipart or signed URL).
 *   2) Receive permanent URLs from API.
 *   3) Put those permanent URLs into this payload (same shape consumers expect).
 * - FE already keeps `File` on cover (`coverImageFile`) and initiative images (`file`) for upload.
 * - Until then, mock save/publish stores `blob_url` in memory only (lost on refresh).
 */
export type NationalImagePayload = {
  id?: string;
  name: string;
  blob_url: string;
};

export type NationalInitiativePayload = {
  initiative_number: number;
  priority_level: "P1" | "P2" | "P3";
  accountable_function_department: string;
  initiative_description: string;
  kpi_metric: string;
  success_target: string;
  unit: string;
  week_start: string;
  week_end: string;
  guidelines: string;
  checklist_compliance_notes: string;
  images: NationalImagePayload[];
};

export type NationalPillarPayload = {
  pillar_number: number;
  pillar_name: string;
  pillar_description: string;
  pillar_weight: number;
  initiatives: NationalInitiativePayload[];
};

export type NationalOnePagerCreatePayload = {
  market: string;
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
 * Builds the create/save/publish request body from form state.
 *
 * TODO: When image upload exists, either:
 * - Upload files first, then call this builder with permanent URLs already written into form state, OR
 * - Extend this builder to accept uploaded URL maps and substitute `blob_url` before POST.
 * Do not POST raw `blob:` URLs to FastAPI as final image locations.
 */
export function buildNationalOnePagerPayload(
  values: NationalFormValues,
  scoringMode: ScoringMode,
  pillars: PillarDraft[],
): NationalOnePagerCreatePayload {
  return {
    market: values.market,
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
      initiatives: pillar.initiatives.map((initiative) => ({
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
      })),
    })),
  };
}

export type OnePagerRecordStatus = "draft" | "published";

/** Response shape the real backend should return for save/publish. */
export type NationalOnePagerMutationResult =
  | { ok: true; id: string; status: OnePagerRecordStatus }
  | { ok: false; error: string };

type StoredNationalRecord = {
  id: string;
  status: OnePagerRecordStatus;
  payload: NationalOnePagerCreatePayload;
};

/**
 * In-memory mock DB for national one-pagers.
 *
 * TODO: Delete `nationalRecords` Map when FastAPI persistence exists.
 * - Real drafts/publishes must live in backend DB (survive refresh / multi-device).
 * - Add GET-by-id for Edit-from-home prepopulation (not implemented on FE yet).
 * - Landing Active/Drafts lists should read from the same backend source, not only sample data.
 * - Required-field validation belongs on the backend; FE already gates via `getNationalSubmitBlockers`.
 */
const nationalRecords = new Map<string, StoredNationalRecord>();

function createRecordId(status: OnePagerRecordStatus) {
  const prefix = status === "draft" ? "draft" : "published";
  return `${prefix}-${crypto.randomUUID()}`;
}

function upsertNationalRecord(
  payload: NationalOnePagerCreatePayload,
  status: OnePagerRecordStatus,
  id?: string | null,
): NationalOnePagerMutationResult {
  const existing = id ? nationalRecords.get(id) : undefined;
  const nextId = existing?.id ?? createRecordId(status);

  nationalRecords.set(nextId, {
    id: nextId,
    status,
    payload: structuredClone(payload),
  });

  return { ok: true, id: nextId, status };
}

/**
 * Mock POST save-draft — swap implementation body for real HTTP call.
 *
 * TODO: Integrate real API
 * - Endpoint (example): POST /api/national-one-pagers/draft
 * - Body: `NationalOnePagerCreatePayload` (+ id when updating existing draft)
 * - Response: `{ id, status: "draft" }` (keep `NationalOnePagerMutationResult` shape)
 * - After image upload exists, payload image URLs must be permanent (see NationalImagePayload TODO).
 * - Remove `delay` + `upsertNationalRecord` in-memory path.
 */
export async function saveNationalDraft(
  payload: NationalOnePagerCreatePayload,
  id?: string | null,
): Promise<NationalOnePagerMutationResult> {
  await delay(400);
  return upsertNationalRecord(payload, "draft", id);
}

/**
 * Mock POST publish — swap implementation body for real HTTP call.
 *
 * TODO: Integrate real API
 * - Endpoint (example): POST /api/national-one-pagers/publish
 * - Creates published OR promotes existing draft id → published
 * - Response: `{ id, status: "published" }`
 * - FE: confirm Publish on preview calls this with `NationalOnePagerCreatePayload` (+ id).
 *   On success the preview stays on-page (toast, drop "(Preview)" prefix, enable More Options).
 * - Remove in-memory upsert once backend owns status transitions.
 */
export async function publishNationalOnePager(
  payload: NationalOnePagerCreatePayload,
  id?: string | null,
): Promise<NationalOnePagerMutationResult> {
  await delay(500);
  return upsertNationalRecord(payload, "published", id);
}
