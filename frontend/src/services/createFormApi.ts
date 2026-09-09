import type { NationalFormValues } from "@/components/form/nationalForm";
import type { PillarDraft, ScoringMode } from "@/components/form/pillars";

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
  /** Business Group options (market-dependent) for both forms. */
  businessGroups: FilterOption[];
  /** Initiative modal — Accountable Function/Department options. */
  accountableTeam: FilterOption[];
  /** Initiative modal — KPI options keyed by pillar_number (1–5). */
  kpisByPillarNumber: Record<number, FilterOption[]>;
};

/**
 * Form catalog: every dropdown (strategy Market/Retailer/Channel/Category/
 * Campaign AND initiative Accountable Team/KPIs) is composed from the single
 * homepage `FilterMetadata` (`landing.metadata` ← GET api/v1/metadata). All
 * initiative options are market-scoped, same as the strategy dropdowns.
 */
export type CreateFormMetadata = {
  markets: FilterOption[];
  /** All dependent dropdown options, keyed by market value. */
  optionsByMarket: Record<string, MarketScopedOptions>;
};

/**
 * Map homepage filter keys (singular) onto the create-form catalog shape (plural)
 * so strategy forms keep reading `markets` / `categories` / etc. Accountable team
 * + per-pillar KPIs are carried through per market for the initiative modal.
 */
export function composeCreateFormCatalog(
  filterMetadata: FilterMetadata | null,
): CreateFormMetadata | null {
  if (!filterMetadata) return null;

  const optionsByMarket: Record<string, MarketScopedOptions> = {};
  for (const [market, scoped] of Object.entries(
    filterMetadata.optionsByMarket,
  )) {
    optionsByMarket[market] = {
      categories: scoped.category,
      campaigns: scoped.campaign,
      channels: scoped.channel,
      retailers: scoped.retailer,
      businessGroups: scoped.business_group,
      accountableTeam: scoped.accountableTeam,
      kpisByPillarNumber: scoped.kpisByPillarNumber,
    };
  }

  return {
    markets: filterMetadata.market,
    optionsByMarket,
  };
}

export type AddCampaignResult =
  | { ok: true; campaign: FilterOption }
  | { ok: false; error: string };

/**
 * Add a campaign for a market via the real backend.
 * - POST body: { market, campaign_name, created_by, user_id } — the last two
 *   are the signed-in user's email (same identity used for created_by elsewhere).
 * - On success, FE appends the returned option to `landing.metadata` (no metadata
 *   refetch) and selects it on the form.
 * - Duplicate check uses the shared catalog already in Redux (passed in as existingCampaigns).
 */
export async function addCampaign(
  market: string,
  campaignName: string,
  createdBy: string,
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
    await ApiBase.post("api/v1/campaigns", {
      market: market,
      campaign_name: trimmed,
      created_by: createdBy,
      user_id: createdBy,
    });
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
  /** Optional ISO-agnostic week number (1–53) alongside week_start date. */
  week_start_number?: string;
  /** Optional ISO-agnostic week number (1–53) alongside week_end date. */
  week_end_number?: string;
  guidelines: string;
  checklist_compliance_notes: string;
  /** Public URLs persisted in DB. Sent on draft/publish. */
  images: string[];
  /** Signed URLs for UI / PPT. GET + form state only — omit on save. */
  image_signed_url?: string[];
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
  /** Business Group (market-dependent, required by the form). */
  business_group?: string;
  /** Plan year, e.g. "2026" (required by the form). */
  year?: string;
  created_by?: string;
  pager_type?: string;
  title: string;
  business_outcome_statement: string;
  /** Public cover URL for DB. `null` when none. Sent on draft/publish. */
  image_url: string | null;
  /** Signed cover URL for display. GET + form/preview only — omit on save. */
  image_signed_url?: string | null;
  scoring_mode: ScoringMode;
  pillars: NationalPillarPayload[];
  status?: string;
  published_at?: string;
  published_by?: string;
  campaign_focus?: string;
};

export function mapInitiativeImageFields(
  images: PillarDraft["initiatives"][number]["images"],
) {
  const publicUrls: string[] = [];
  const signedUrls: string[] = [];
  for (const image of images) {
    if (!image.publicUrl && !image.blobUrl) continue;
    publicUrls.push(image.publicUrl);
    signedUrls.push(image.blobUrl);
  }
  return {
    images: publicUrls,
    image_signed_url: signedUrls,
  };
}

/**
 * Builds the in-memory create payload from form state (both URL kinds).
 * Preview / PPT / hydrate use signed URLs. Call `toPublicImageSavePayload`
 * before POST draft/publish so the body has public URLs only.
 */
export function buildNationalOnePagerPayload(
  values: NationalFormValues,
  scoringMode: ScoringMode,
  pillars: PillarDraft[],
): NationalOnePagerCreatePayload {
  const image_url = values.coverImagePublicUrl || null;
  const image_signed_url = values.coverImageUrl || null;
  return {
    market: values.market,
    category: values.category,
    campaign: values.campaign,
    channel: values.channel,
    business_group: values.businessGroup,
    year: values.year,
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
        week_start_number: initiative.week_start_number,
        week_end_number: initiative.week_end_number,
        guidelines: initiative.guidelines,
        checklist_compliance_notes: initiative.checklist_compliance_notes,
        ...mapInitiativeImageFields(initiative.images),
      })),
    })),
  };
}

/** Drop signed URLs so the draft/publish body matches the API (public only). */
export function toPublicImageSavePayload<
  T extends {
    image_url: string | null;
    image_signed_url?: string | null;
    pillars: NationalPillarPayload[];
  },
>(payload: T): Omit<T, "image_signed_url"> {
  const { image_signed_url: _coverSigned, ...rest } = payload;
  return {
    ...rest,
    image_url: payload.image_url,
    pillars: payload.pillars.map((pillar) => ({
      ...pillar,
      initiatives: pillar.initiatives.map((initiative) => {
        const { image_signed_url: _signed, ...initiativeRest } = initiative;
        return initiativeRest;
      }),
    })),
  };
}

export type OnePagerRecordStatus = "draft" | "published";

/** Response shape the real backend should return for save/publish. */
export type NationalOnePagerMutationResult =
  | { ok: true; id: string; status: OnePagerRecordStatus; error?: string }
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
      const { data } = await ApiBase.patch(`api/v1/pagers/${id}`, {
        ...toPublicImageSavePayload(payload),
        pager_id: id || "",
      });
      return { ok: true, id: data?.pager_id || "", status: "draft" };
    }
    const { data } = await ApiBase.post("api/v1/pagers", {
      ...toPublicImageSavePayload(payload),
      pager_id: id || "",
    });
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
      const { data } = await ApiBase.patch(`api/v1/pagers/${id}`, {
        ...toPublicImageSavePayload(payload),
        pager_id: id || "",
      });
      return { ok: true, id: data?.pager_id || "", status: "draft" };
    }
    const { data } = await ApiBase.post("api/v1/pagers", {
      ...toPublicImageSavePayload(payload),
      pager_id: id || "",
    });

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
    const { data } = await ApiBase.get(`api/v1/pagers/${id}`);
    return {
      payload: data as NationalOnePagerCreatePayload,
      id,
      status: data?.status || "",
    } as NationalOnePagerRecord;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}
