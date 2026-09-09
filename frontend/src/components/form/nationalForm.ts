import {
  getWeightedPillarWeightBlocker,
  type PillarDraft,
  type ScoringMode,
} from "@/components/form/pillars";

export type NationalFormValues = {
  market: string;
  category: string;
  campaign: string;
  channel: string;
  /** Market-dependent Business Group (required). */
  businessGroup: string;
  /** Plan year, e.g. "2026" (required). */
  year: string;
  title: string;
  businessOutcome: string;
  coverImageName: string;
  /** Signed cover URL for display. */
  coverImageUrl: string;
  /** Public cover URL for draft/publish `image_url`. */
  coverImagePublicUrl: string;
  /** Kept for compatibility; cleared after a successful upload. */
  coverImageFile: File | null;
};

export const emptyNationalFormValues: NationalFormValues = {
  market: "",
  category: "",
  campaign: "",
  channel: "",
  businessGroup: "",
  year: "",
  title: "",
  businessOutcome: "",
  coverImageName: "",
  coverImageUrl: "",
  coverImagePublicUrl: "",
  coverImageFile: null,
};

/** Required strategy fields. Campaign/cover/outcome are optional. Initiatives are recommended, not required. */
export function getNationalSubmitBlockers(
  values: NationalFormValues,
  pillars: PillarDraft[],
  scoringMode: ScoringMode,
): string | null {
  if (!values.market.trim()) return "Select a Market.";
  if (!values.channel.trim()) return "Select a Channel.";
  if (!values.businessGroup.trim()) return "Select a Business Group.";
  if (!values.category.trim()) return "Select a Category.";
  if (!values.year.trim()) return "Select a Year.";
  if (!values.title.trim()) return "Enter a Title.";

  return getWeightedPillarWeightBlocker(scoringMode, pillars);
}
