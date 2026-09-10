import {
  emptyNationalFormValues,
  type NationalFormValues,
} from "@/components/form/nationalForm";
import {
  emptyRetailerFormValues,
  type RetailerFormValues,
} from "@/components/form/retailerForm";
import type {
  PillarDraft,
  ScoringMode,
  InitiativeImage,
} from "@/components/form/pillars";
import type {
  NationalOnePagerCreatePayload,
  NationalPillarPayload,
} from "@/services/createFormApi";
import type { RetailerOnePagerCreatePayload } from "@/services/retailerCreateFormApi";

function fileName(url: string, fallback: string) {
  const part = url.split("/").pop();
  return part || fallback;
}

/**
 * Extract just the file name from a (possibly signed) URL: drop the query
 * string / hash, take the last path segment, and decode percent-encoding.
 * Signed URLs carry long query strings that must not leak into the UI label.
 *
 * Returns "" when there is no URL at all (so callers can fall back to another
 * URL via `||`). When a URL IS present but doesn't yield a usable file name
 * (unexpected shape), returns `fallback` so the UI still shows a sensible label
 * instead of an empty control.
 */
function fileNameFromUrl(
  url?: string | null,
  fallback = "Cover image",
): string {
  if (!url) return "";
  const withoutQuery = url.split("?")[0].split("#")[0];
  const last = withoutQuery.split("/").pop() ?? "";
  let name: string;
  try {
    name = decodeURIComponent(last);
  } catch {
    name = last;
  }
  return name.trim() || fallback;
}

function toFormImages(
  publicUrls: string[] = [],
  signedUrls: string[] = [],
): InitiativeImage[] {
  const count = Math.max(publicUrls.length, signedUrls.length);
  const images: InitiativeImage[] = [];
  for (let index = 0; index < count; index += 1) {
    const publicUrl = publicUrls[index] ?? "";
    const signedUrl = signedUrls[index] ?? publicUrl;
    if (!publicUrl && !signedUrl) continue;
    images.push({
      id: crypto.randomUUID(),
      name: fileName(signedUrl || publicUrl, `image-${index + 1}`),
      blobUrl: signedUrl,
      publicUrl,
      file: null,
    });
  }
  return images;
}

export function hydratePillarsFromPayload(
  pillars: NationalPillarPayload[],
): PillarDraft[] {
  return pillars.map((pillar) => ({
    pillar_number: pillar.pillar_number,
    pillar_name: pillar.pillar_name,
    pillar_description: pillar.pillar_description,
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
      week_start_number: initiative.week_start_number ?? "",
      week_end_number: initiative.week_end_number ?? "",
      guidelines: initiative.guidelines,
      checklist_compliance_notes: initiative.checklist_compliance_notes,
      images: toFormImages(initiative.images, initiative.image_signed_url),
    })),
  }));
}

export function hydrateNationalFormFromPayload(
  payload: NationalOnePagerCreatePayload,
): {
  values: NationalFormValues;
  scoringMode: ScoringMode;
  pillars: PillarDraft[];
} {
  return {
    values: {
      ...emptyNationalFormValues,
      market: payload.market,
      category: payload.category,
      campaign: payload.campaign,
      channel: payload.channel,
      businessGroup: payload.business_group ?? "",
      year: payload.year ?? "",
      title: payload.title,
      businessOutcome: payload.business_outcome_statement,
      coverImageName:
        fileNameFromUrl(payload.image_signed_url) ||
        fileNameFromUrl(payload.image_url),
      coverImageUrl: payload.image_signed_url ?? payload.image_url ?? "",
      coverImagePublicUrl: payload.image_url ?? "",
      coverImageFile: null,
    },
    scoringMode: payload.scoring_mode,
    pillars: hydratePillarsFromPayload(payload.pillars),
  };
}

export function hydrateRetailerFormFromPayload(
  payload: RetailerOnePagerCreatePayload,
): {
  values: RetailerFormValues;
  scoringMode: ScoringMode;
  pillars: PillarDraft[];
} {
  return {
    values: {
      ...emptyRetailerFormValues,
      market: payload.market,
      targetRetailer: payload.target_retailer,
      category: payload.category,
      campaign: payload.campaign,
      channel: payload.channel,
      businessGroup: payload.business_group ?? "",
      year: payload.year ?? "",
      title: payload.title,
      businessOutcome: payload.business_outcome_statement,
      coverImageName:
        fileNameFromUrl(payload.image_signed_url) ||
        fileNameFromUrl(payload.image_url),
      coverImageUrl: payload.image_signed_url ?? payload.image_url ?? "",
      coverImagePublicUrl: payload.image_url ?? "",
      coverImageFile: null,
    },
    scoringMode: payload.scoring_mode,
    pillars: hydratePillarsFromPayload(payload.pillars),
  };
}

/** Import-from-National: copy national payload into a new retailer form. */
export function hydrateRetailerFormFromNationalPayload(
  payload: NationalOnePagerCreatePayload,
): {
  values: RetailerFormValues;
  scoringMode: ScoringMode;
  pillars: PillarDraft[];
} {
  const next = hydrateNationalFormFromPayload(payload);
  return {
    values: {
      ...emptyRetailerFormValues,
      ...next.values,
      targetRetailer: "",
    },
    scoringMode: next.scoringMode,
    pillars: next.pillars,
  };
}
