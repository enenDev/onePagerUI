import type { RetailerFormValues } from "@/components/form/retailerForm";
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
    title: "Retailer-Walmart-Hair Care-Scalp & Shine-US",
    businessOutcome: sampleOnePager.business_outcome_statement,
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
        initiative_description: initiative.initiative_description,
        kpi_metric: initiative.kpi_metric,
        success_target: initiative.success_target,
        unit: initiative.unit,
        week_start: initiative.week_start,
        week_end: initiative.week_end,
        guidelines: initiative.guidelines,
        checklist_compliance_notes: initiative.checklist_compliance_notes,
        images: [],
      }));

    return {
      ...pillar,
      pillar_description: sample?.pillar_description ?? "",
      pillar_weight: sample?.pillar_weight ?? 20,
      initiatives,
    };
  });

  return { values, scoringMode, pillars };
}
