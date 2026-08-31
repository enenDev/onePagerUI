import {
  emptyNationalFormValues,
  type NationalFormValues,
} from "@/components/form/nationalForm";
import {
  emptyRetailerFormValues,
  type RetailerFormValues,
} from "@/components/form/retailerForm";
import type { PillarDraft, ScoringMode } from "@/components/form/pillars";
import type {
  NationalOnePagerCreatePayload,
  NationalPillarPayload,
} from "@/services/createFormApi";
import type { RetailerOnePagerCreatePayload } from "@/services/retailerCreateFormApi";

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
      guidelines: initiative.guidelines,
      checklist_compliance_notes: initiative.checklist_compliance_notes,
      images: (initiative.images ?? []).map((url) => ({
        id: crypto.randomUUID(),
        name: url.split("/").pop() || "image",
        blobUrl: url,
        file: null,
      })),
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
      title: payload.title,
      businessOutcome: payload.business_outcome_statement,
      coverImageName: payload.image_url?.split("/").pop() || "",
      coverImageUrl: payload.image_url ?? "",
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
      title: payload.title,
      businessOutcome: payload.business_outcome_statement,
      coverImageName: payload.image_url?.split("/").pop() || "",
      coverImageUrl: payload.image_url ?? "",
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
