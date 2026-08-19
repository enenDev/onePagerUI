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
   * In-browser preview URL for cover (`blob:...`) until upload API exists.
   *
   * TODO: After real upload, store the permanent CDN/API URL here (or add `coverImageRemoteUrl`
   * and keep blob only for local preview). Revoke blob URLs when replacing/discarding.
   */
  coverImageUrl: string;
  /** Raw file kept for future multipart/signed upload. Null in edit mode until re-picked. */
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
