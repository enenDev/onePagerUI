import type { RetailerFormValues } from "@/components/form/retailerForm";
import { clipToLimit, FIELD_LIMITS } from "@/components/form/fieldLimits";
import {
  createDefaultPillars,
  MAX_INITIATIVES_PER_PILLAR,
  nextPriorityLevel,
  type PillarDraft,
  type ScoringMode,
} from "@/components/form/pillars";
import { data as sampleOnePager } from "@/services/sampleData";

/**
 * TODO: Remove this helper (and the create-form Fill sample / ?fill=1 hook)
 * before production. Local testing only for Retailer Scratch form.
 */
export function buildRetailerFormSample(): {
  values: RetailerFormValues;
  scoringMode: ScoringMode;
  pillars: PillarDraft[];
} {
  const values: RetailerFormValues = {
    market: "US",
    targetRetailer: "Walmart",
    // Must match homepage metadata options for market "US" (not National-only values).
    category: "Hair Care",
    campaign: "Scalp & Shine",
    channel: "Supermarket",
    title: clipToLimit(
      "Retailer-Walmart-Hair Care-Scalp & Shine-US",
      FIELD_LIMITS.title,
    ),
    businessOutcome: clipToLimit(
      sampleOnePager.business_outcome_statement,
      FIELD_LIMITS.businessOutcome,
    ),
    coverImageName: "",
    coverImageUrl: "",
    coverImageFile: null,
  };

  const scoringMode: ScoringMode =
    sampleOnePager.scoring_mode === "WEIGHTED" ? "WEIGHTED" : "UNWEIGHTED";

  const pillars = createDefaultPillars().map((pillar, index) => {
    const sample = sampleOnePager.pillars[index];
    const initiatives = (sample?.initiatives ?? [])
      .slice(0, MAX_INITIATIVES_PER_PILLAR)
      .map((initiative, initiativeIndex) => ({
        initiative_number: initiativeIndex + 1,
        priority_level: nextPriorityLevel(initiativeIndex) ?? "P3",
        accountable_function_department:
          initiative.accountable_function_department,
        initiative_description: clipToLimit(
          initiative.initiative_description,
          FIELD_LIMITS.initiativeDescription,
        ),
        kpi_metric: initiative.kpi_metric,
        success_target: clipToLimit(
          initiative.success_target,
          FIELD_LIMITS.successTarget,
        ),
        unit: clipToLimit(initiative.unit, FIELD_LIMITS.unit),
        week_start: initiative.week_start,
        week_end: initiative.week_end,
        guidelines: clipToLimit(
          initiative.guidelines,
          FIELD_LIMITS.guidelines,
        ),
        checklist_compliance_notes: clipToLimit(
          initiative.checklist_compliance_notes,
          FIELD_LIMITS.checklistNotes,
        ),
        images: [],
      }));

    return {
      ...pillar,
      pillar_description: clipToLimit(
        sample?.pillar_description ?? "",
        FIELD_LIMITS.pillarDescription,
      ),
      pillar_weight: sample?.pillar_weight ?? 20,
      initiatives,
    };
  });

  return { values, scoringMode, pillars };
}
