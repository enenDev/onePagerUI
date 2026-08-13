import {
  everyPillarHasInitiative,
  pillarsMissingInitiatives,
  type PillarDraft,
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

/** Required strategy fields + 1 initiative per pillar. Campaign/cover/outcome are optional. */
export function getNationalSubmitBlockers(
  values: NationalFormValues,
  pillars: PillarDraft[],
): string | null {
  if (!values.market.trim()) return "Select a Market.";
  if (!values.category.trim()) return "Select a Category.";
  if (!values.channel.trim()) return "Select a Channel.";
  if (!values.title.trim()) return "Enter a Title.";

  if (!everyPillarHasInitiative(pillars)) {
    const missing = pillarsMissingInitiatives(pillars);
    return missing.length > 0
      ? `Add at least one initiative to each pillar. Missing: ${missing.join(", ")}.`
      : "Add at least one initiative to each of the 5 pillars.";
  }

  return null;
}
