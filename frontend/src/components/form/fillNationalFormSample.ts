import type { NationalFormValues } from "@/components/form/nationalForm";
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
 * before production. It exists only so local testing can skip typing the full
 * National form. Keep using `sampleData.ts` as the source until then.
 */
export function buildNationalFormSample(): {
  values: NationalFormValues;
  scoringMode: ScoringMode;
  pillars: PillarDraft[];
} {
  const values: NationalFormValues = {
    market: sampleOnePager.market,
    category: sampleOnePager.category,
    campaign: sampleOnePager.campaign_focus,
    channel: sampleOnePager.channel,
    title: sampleOnePager.title,
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
