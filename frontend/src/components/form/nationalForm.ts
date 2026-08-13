export type NationalFormValues = {
  market: string;
  category: string;
  campaign: string;
  channel: string;
  title: string;
  businessOutcome: string;
  coverImageName: string;
  /** In-browser blob: URL for the cover until a real upload API exists. */
  coverImageUrl: string;
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
