import type { NationalFormValues } from "@/components/form/nationalForm";
import type {
  PillarDraft,
  ScoringMode,
} from "@/components/form/pillars";
import createFormMetadataMock from "@/services/mocks/createFormMetadata.json";

import type { FilterMetadata } from "@/types/onePager";
import ApiBase from "@/components/auth/apiBase";

export type FilterOption = {
  label: string;
  value: string;
};

export type MarketScopedOptions = {
  categories: FilterOption[];
  campaigns: FilterOption[];
  channels: FilterOption[];
  /** Used by Retailer create (Target Retailer). National form ignores this. */
  retailers: FilterOption[];
};

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

/** Initiative-modal extras only. Strategy dropdowns come from FilterMetadata. */
export type CreateFormExtras = {
  accountableDepartments: FilterOption[];
  /**
   * KPI options per pillar_number (1–5). Different lists per pillar; mock has 14 total.
   * TODO: Replace with real KPI catalog from FastAPI; keep this keyed shape.
   */
  kpisByPillarNumber: Record<number, FilterOption[]>;
};

/**
 * Form catalog: Market / Retailer / Channel / Category / Campaign are composed
 * from homepage `FilterMetadata` (`landing.metadata`). Departments / KPIs come
 * from getCreateFormMetadata.
 */
export type CreateFormMetadata = {
  markets: FilterOption[];
  /** All dependent dropdown options, keyed by market value. */
  optionsByMarket: Record<string, MarketScopedOptions>;
} & CreateFormExtras;

function loadCreateFormExtras(): CreateFormExtras {
  const raw = structuredClone(createFormMetadataMock);
  const kpisByPillarNumber: Record<number, FilterOption[]> = {};
  for (const [key, options] of Object.entries(raw.kpisByPillarNumber)) {
    kpisByPillarNumber[Number(key)] = options as FilterOption[];
  }
  return {
    accountableDepartments: raw.accountableDepartments as FilterOption[],
    kpisByPillarNumber,
  };
}

/**
 * Map homepage filter keys (singular) onto the create-form catalog shape (plural)
 * so strategy forms keep reading `markets` / `categories` / etc.
 */
export function composeCreateFormCatalog(
  filterMetadata: FilterMetadata | null,
  extras: CreateFormExtras | null,
): CreateFormMetadata | null {
  if (!filterMetadata || !extras) return null;

  const optionsByMarket: Record<string, MarketScopedOptions> = {};
  for (const [market, scoped] of Object.entries(
    filterMetadata.optionsByMarket,
  )) {
    optionsByMarket[market] = {
      categories: scoped.category,
      campaigns: scoped.campaign,
      channels: scoped.channel,
      retailers: scoped.retailer,
    };
  }

  return {
    markets: filterMetadata.market,
    optionsByMarket,
    accountableDepartments: extras.accountableDepartments,
    kpisByPillarNumber: extras.kpisByPillarNumber,
  };
}

/**
 * Initiative dropdowns only (accountable department + KPIs per pillar).
 * Pillar names stay hardcoded in the app.
 *
 * TODO: Replace with real FastAPI GET for initiative extras
 * (e.g. /api/create-form/metadata). Temporary: dummy from
 * `mocks/createFormMetadata.json`. Do not put Market / Retailer / Channel /
 * Category / Campaign here — those come from getMetadata / landing.metadata.
 * Keep CreateFormExtras shape. Client filters kpisByPillarNumber — do not add
 * per-pillar option round-trips.
 */
export async function getCreateFormMetadata(): Promise<CreateFormExtras> {
  await delay();
  return loadCreateFormExtras();
}

export type AddCampaignResult =
  | { ok: true; campaign: FilterOption }
  | { ok: false; error: string };

/**
 * TODO: Replace with real FastAPI add-campaign endpoint.
 * - POST body: { market, campaign_name }
 * - On success, FE appends the returned option to `landing.metadata` (no metadata refetch)
 *   and selects it on the form. Keep that UX when swapping the POST.
 * - Duplicate check uses the shared catalog already in Redux (passed in as existingCampaigns).
 */
export async function addCampaign(
  market: string,
  campaignName: string,
  existingCampaigns: FilterOption[] = [],
): Promise<AddCampaignResult> {
  const trimmed = campaignName.trim();
  if (!market) {
    return { ok: false, error: "Select a market before adding a campaign." };
  }
  if (!trimmed) {
    return { ok: false, error: "Campaign name is required." };
  }

  const exists = existingCampaigns.some(
    (item) => item.value.toLowerCase() === trimmed.toLowerCase(),
  );

  if (exists) {
    return {
      ok: false,
      error: "This campaign already exists for the selected market.",
    };
  }
  try {
    await ApiBase.post('api/v1/campaigns', {
      market: market,
      campaign_name: trimmed,
      created_by: "gowtham.gunasekaran@unilver.com",
      user_id: "gowtham.gunasekaran@unilver.com",
    })
    return { ok: true, campaign: { label: trimmed, value: trimmed } };
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }

}

/**
 * Image fields on the national create/save payload.
 *
 * `blob_url` holds the URL from `uploadImage` (mock or real). Keep this field name
 * when swapping FastAPI — do not POST raw `blob:` object URLs as final storage.
 * Cover/initiative picks call `uploadImage` on file select; form state already has URLs
 * before Save Draft / Publish. See `frontend/src/services/imageUploadApi.ts`.
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
  images: string[];
  /** GET-by-id RAG. `null` = Clear. View/Edit ignore this. */
  initiative_track?: "red" | "amber" | "green" | null;
  /** GET-by-id UUID — required for Track PATCH. View/Edit ignore this. */
  initiative_id?: string;
};

export type NationalPillarPayload = {
  pillar_number: number;
  pillar_name: string;
  pillar_description: string;
  pillar_weight: number;
  initiatives: NationalInitiativePayload[];
  /** GET-by-id RAG. `null` = Clear. View/Edit ignore this. */
  pillar_track?: "red" | "amber" | "green" | null;
  /** GET-by-id UUID — required for Track PATCH. View/Edit ignore this. */
  pillar_id?: string;
};

export type NationalOnePagerCreatePayload = {
  market: string;
  category: string;
  campaign: string;
  channel: string;
  created_by?: string;
  pager_type?: string;
  title: string;
  business_outcome_statement: string;
  image_url: string | null;
  scoring_mode: ScoringMode;
  pillars: NationalPillarPayload[];
  status?: string;
  published_at?: string;
  published_by?: string;
  campaign_focus?: string;
};

/**
 * Builds the create/save/publish request body from form state.
 * Image URLs must already be uploaded (`uploadImage`) into form state — this
 * builder only maps `coverImageUrl` / initiative `blobUrl` into `blob_url`.
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
    image_url: values.coverImageUrl
      ? values.coverImageUrl
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
        // images: initiative.images
        images: initiative?.images?.map((image) =>
        image.blobUrl || ""
        )?.filter(Boolean),
      })),
    })),
  };
}

export type OnePagerRecordStatus = "draft" | "published";

/** Response shape the real backend should return for save/publish. */
export type NationalOnePagerMutationResult =
  | { ok: true; id: string; status: OnePagerRecordStatus, error?: string }
  | { ok: false; error: string };

// type StoredNationalRecord = {
//   id: string;
//   status: OnePagerRecordStatus;
//   payload: NationalOnePagerCreatePayload;
// };

/**
 * In-memory mock DB for national one-pagers.
 *
 * TODO: Delete `nationalRecords` Map when FastAPI persistence exists.
 * - Real drafts/publishes must live in backend DB (survive refresh / multi-device).
 * - GET-by-id is mocked below (constant JSON) for Import-from-National.
 *   Edit uses the common getOnePagerById in onePagerApi.ts instead.
 * - Landing Active/Drafts lists should read from the same backend source, not only sample data.
 * - Required-field validation belongs on the backend; FE already gates via `getNationalSubmitBlockers`.
 */
// const nationalRecords = new Map<string, StoredNationalRecord>();

// function createRecordId(status: OnePagerRecordStatus) {
//   const prefix = status === "draft" ? "draft" : "published";
//   return `${prefix}-${crypto.randomUUID()}`;
// }

// function upsertNationalRecord(
//   payload: NationalOnePagerCreatePayload,
//   status: OnePagerRecordStatus,
//   id?: string | null,
// ): NationalOnePagerMutationResult {
//   const existing = id ? nationalRecords.get(id) : undefined;
//   const nextId = existing?.id ?? createRecordId(status);

//   nationalRecords.set(nextId, {
//     id: nextId,
//     status,
//     payload: structuredClone(payload),
//   });

//   // TODO: Remove FE landing upsert when FastAPI list returns saved/published
//   // rows with permanent cover_image_url. Keep card cover_image_url field name.
//   upsertLandingCardFromPayload({
//     pager_id: nextId,
//     pager_type: "national",
//     record_status: status,
//     payload,
//   });

//   return { ok: true, id: nextId, status };
// }

/**
 * Mock POST save-draft — swap implementation body for real HTTP call.
 *
 * TODO: Integrate real API
 * - Endpoint (example): POST /api/national-one-pagers/draft
 * - Body: `NationalOnePagerCreatePayload` (+ id when updating existing draft)
 * - Response: `{ id, status: "draft" }` (keep `NationalOnePagerMutationResult` shape)
 * - Payload image URLs come from `uploadImage` into form state before this call.
 * - Remove `delay` + `upsertNationalRecord` in-memory path.
 */
export async function saveNationalDraft(
  payload: NationalOnePagerCreatePayload,
  id?: string | null,
): Promise<NationalOnePagerMutationResult> {
  try {
    if (id) {
      const { data } = await ApiBase.patch(`api/v1/pagers/${id}`, { ...payload, pager_id: id || "" })
      return { ok: true, id: data?.pager_id || "", status: "draft" };
    }
    const { data } = await ApiBase.post('api/v1/pagers', { ...payload, pager_id: id || "" })
    return { ok: true, id: data?.pager_id || "", status: "draft" };
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
  // return upsertNationalRecord(payload, "draft", id);
}

/**
 * Mock POST publish — swap implementation body for real HTTP call.
 *
 * TODO: Integrate real API
 * - Endpoint (example): POST /api/national-one-pagers/publish
 * - Creates published OR promotes existing draft id → published
 * - Response: `{ id, status: "published" }`
 * - FE: confirm Publish on preview calls this with `NationalOnePagerCreatePayload` (+ id).
 *   On success FE replace-navigates to `/track/:id` and shows the publish toast there.
 * - Remove in-memory upsert once backend owns status transitions.
 */
export async function publishNationalOnePager(
  payload: NationalOnePagerCreatePayload,
  id?: string | null,
): Promise<NationalOnePagerMutationResult> {
  try {
    if (id) {
      const { data } = await ApiBase.patch(`api/v1/pagers/${id}`, { ...payload, pager_id: id || "" })
      return { ok: true, id: data?.pager_id || "", status: "draft" };
    }
    const { data } = await ApiBase.post('api/v1/pagers', { ...payload, pager_id: id || "" })
    
    return { ok: true, id: data?.pager_id || "", status: "published" };
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
  // return upsertNationalRecord(payload, "published", id);
}

export type NationalOnePagerRecord = {
  id: string;
  status: OnePagerRecordStatus;
  payload: NationalOnePagerCreatePayload;
};

/**
 * Mock GET-by-id for a national one-pager.
 *
 * TODO: Replace the function body with GET /api/national-one-pagers/:id
 * Keep signature `getNationalOnePager(id)` and NationalOnePagerRecord shape.
 * Temporary: any id returns mocks/nationalOnePager.json (same full record).
 * Delete that JSON when FastAPI returns the real record for `id`.
 */
export async function getNationalOnePager(
  id: string,
): Promise<NationalOnePagerRecord | null> {
  try {
    const { data } = await ApiBase.get(`api/v1/pagers/${id}`)
    return { payload: data as NationalOnePagerCreatePayload, id, status: data?.status || "" } as NationalOnePagerRecord;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }

}
