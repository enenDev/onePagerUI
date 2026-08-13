export type ScoringMode = "UNWEIGHTED" | "WEIGHTED";

export type InitiativeImage = {
  id: string;
  name: string;
  /** In-browser blob: URL kept on the form until a real upload API exists. */
  blobUrl: string;
  file: File;
};

export type InitiativeDraft = {
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
  images: InitiativeImage[];
};

export type PillarDraft = {
  pillar_number: number;
  pillar_name: string;
  pillar_description: string;
  pillar_weight: number;
  initiatives: InitiativeDraft[];
};

const DEFAULT_PILLARS = [
  { pillar_number: 1, pillar_name: "Category Leadership" },
  { pillar_number: 2, pillar_name: "Unmissable Retail Theater" },
  { pillar_number: 3, pillar_name: "More Stores Better Stores" },
  { pillar_number: 4, pillar_name: "Frictionless Digital" },
  { pillar_number: 5, pillar_name: "Always Available" },
] as const;

export const MAX_INITIATIVES_PER_PILLAR = 3;
export const MAX_INITIATIVE_IMAGES = 3;

export function createDefaultPillars(): PillarDraft[] {
  return DEFAULT_PILLARS.map((pillar) => ({
    pillar_number: pillar.pillar_number,
    pillar_name: pillar.pillar_name,
    pillar_description: "",
    pillar_weight: 20,
    initiatives: [],
  }));
}

export function nextPriorityLevel(
  count: number,
): InitiativeDraft["priority_level"] | null {
  if (count >= MAX_INITIATIVES_PER_PILLAR) return null;
  return `P${count + 1}` as InitiativeDraft["priority_level"];
}

export function revokeInitiativeImageUrls(images: InitiativeImage[]) {
  images.forEach((image) => {
    if (image.blobUrl.startsWith("blob:")) {
      URL.revokeObjectURL(image.blobUrl);
    }
  });
}
