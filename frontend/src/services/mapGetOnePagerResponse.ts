import { formatPublishedAt } from "@/components/preview/nationalPreview";
import type {
  NationalImagePayload,
  NationalInitiativePayload,
  NationalOnePagerCreatePayload,
  NationalPillarPayload,
} from "@/services/createFormApi";
import type {
  NationalOnePagerByIdRecord,
  OnePagerByIdRecord,
  RetailerOnePagerByIdRecord,
} from "@/services/onePagerApi";
import type { RetailerOnePagerCreatePayload } from "@/services/retailerCreateFormApi";
import type { ApiTrackColor } from "@/services/trackApi";
import type { OnePagerStatus } from "@/types/onePager";

export type GetOnePagerApiInitiative = {
  pillar_initiative_id: number;
  initiative_id: string;
  pager_id: string;
  pillar_id: string;
  initiative_number: number;
  initiative_track: ApiTrackColor | null;
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
  image_urls: string[];
};

export type GetOnePagerApiPillar = {
  pillar_id: string;
  pager_id: string;
  pillar_number: number;
  pillar_name: string;
  pillar_description: string;
  pillar_weight: number;
  pillar_track: ApiTrackColor | null;
  initiatives: GetOnePagerApiInitiative[];
};

/** Flat GET /api/one-pagers/:id body. Top-level `track` is a DB label — ignore for RAG. */
export type GetOnePagerApiResponse = {
  pager_id: string;
  title: string;
  market: string;
  retailer: string;
  channel: string;
  category: string;
  campaign_focus: string;
  business_outcome_statement: string;
  scoring_mode: "WEIGHTED" | "UNWEIGHTED";
  status: string;
  track: string | null;
  pager_type: string;
  image_url: string | null;
  created_by: string;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
  published_by: string | null;
  published_at: string | null;
  pillars: GetOnePagerApiPillar[];
};

function fileName(url: string, fallback: string) {
  const part = url.split("/").pop();
  return part || fallback;
}

function toCoverImage(url: string | null): NationalImagePayload | null {
  if (!url) return null;
  return { name: fileName(url, "cover"), blob_url: url };
}

function toInitiativeImages(urls: string[]): NationalImagePayload[] {
  return urls.map((url, index) => ({
    name: fileName(url, `image-${index + 1}`),
    blob_url: url,
  }));
}

function toListStatus(status: string): OnePagerStatus {
  const normalized = status.trim().toUpperCase();
  if (normalized === "DRAFT") return "DRAFT";
  if (normalized === "ARCHIVED" || normalized === "ARCHIVE") return "ARCHIVED";
  if (normalized === "DELETED") return "DELETED";
  return "PUBLISHED";
}

function formatApiPublishedAt(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return formatPublishedAt(date);
}

function isRetailerType(pagerType: string) {
  return pagerType.trim().toLowerCase() === "retailer";
}

function mapInitiative(
  initiative: GetOnePagerApiInitiative,
): NationalInitiativePayload {
  return {
    initiative_number: initiative.initiative_number,
    priority_level: initiative.priority_level,
    accountable_function_department: initiative.accountable_function_department,
    initiative_description: initiative.initiative_description,
    kpi_metric: initiative.kpi_metric,
    success_target: initiative.success_target,
    unit: initiative.unit,
    week_start: initiative.week_start,
    week_end: initiative.week_end,
    guidelines: initiative.guidelines,
    checklist_compliance_notes: initiative.checklist_compliance_notes,
    images: toInitiativeImages(initiative.image_urls ?? []),
    initiative_track: initiative.initiative_track,
    initiative_id: initiative.initiative_id,
  };
}

function mapPillar(pillar: GetOnePagerApiPillar): NationalPillarPayload {
  return {
    pillar_number: pillar.pillar_number,
    pillar_name: pillar.pillar_name,
    pillar_description: pillar.pillar_description,
    pillar_weight: pillar.pillar_weight,
    pillar_track: pillar.pillar_track,
    pillar_id: pillar.pillar_id,
    initiatives: pillar.initiatives.map(mapInitiative),
  };
}

function mapSharedPayload(api: GetOnePagerApiResponse): NationalOnePagerCreatePayload {
  return {
    market: api.market,
    category: api.category,
    campaign: api.campaign_focus,
    channel: api.channel,
    title: api.title,
    business_outcome_statement: api.business_outcome_statement,
    cover_image: toCoverImage(api.image_url),
    scoring_mode: api.scoring_mode,
    pillars: api.pillars.map(mapPillar),
  };
}

/**
 * Map the real GET-by-id body onto the existing View / Edit / Track record.
 * Top-level `track` is ignored. RAG lives on pillar_track / initiative_track.
 */
export function mapGetOnePagerResponse(
  api: GetOnePagerApiResponse,
): OnePagerByIdRecord {
  const listStatus = toListStatus(api.status);
  const publishedAt = formatApiPublishedAt(api.published_at);
  const shared = {
    id: api.pager_id,
    status: listStatus === "DRAFT" ? ("draft" as const) : ("published" as const),
    created_by: api.created_by,
    list_status: listStatus,
    published_at: publishedAt,
  };
  const payload = mapSharedPayload(api);

  if (isRetailerType(api.pager_type)) {
    const record: RetailerOnePagerByIdRecord = {
      ...shared,
      pager_type: "retailer",
      payload: {
        ...payload,
        target_retailer: api.retailer,
      } satisfies RetailerOnePagerCreatePayload,
    };
    return record;
  }

  const record: NationalOnePagerByIdRecord = {
    ...shared,
    pager_type: "national",
    payload,
  };
  return record;
}
