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
  title: string;
  businessOutcome: string;
  coverImageName: string;
  /**
   * Signed cover URL for display (`<img src>`). From upload `signed_url` or GET `image_signed_url`.
   */
  coverImageUrl: string;
  /** Public cover URL for draft/publish `image_url`. From upload `public_url` or GET `image_url`. */
  coverImagePublicUrl: string;
  /** Kept for compatibility; cleared after a successful upload. */
  coverImageFile: File | null;
};

export const emptyNationalFormValues: NationalFormValues = {
  market: "",
  category: "",
  campaign: "",
  channel: "",
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
  if (!values.category.trim()) return "Select a Category.";
  if (!values.channel.trim()) return "Select a Channel.";
  if (!values.title.trim()) return "Enter a Title.";

  return getWeightedPillarWeightBlocker(scoringMode, pillars);
}
