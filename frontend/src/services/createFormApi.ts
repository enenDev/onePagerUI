import type { NationalFormValues } from "@/components/form/nationalForm";
import type {
  PillarDraft,
  ScoringMode,
} from "@/components/form/pillars";

export type FilterOption = {
  label: string;
  value: string;
};

export type MarketScopedOptions = {
  categories: FilterOption[];
  campaigns: FilterOption[];
  channels: FilterOption[];
};

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

const markets: FilterOption[] = [
  { label: "National", value: "National" },
  { label: "US", value: "US" },
];

/** In-memory campaign list per market — Add Campaign appends here (mock DB). */
const campaignsByMarket: Record<string, FilterOption[]> = {
  National: [
    { label: "National Growth Program", value: "National Growth Program" },
    { label: "Summer Freshness", value: "Summer Freshness" },
  ],
  US: [
    { label: "Summer Freshness", value: "Summer Freshness" },
    { label: "Scalp & Shine", value: "Scalp & Shine" },
    { label: "Fresh Breath", value: "Fresh Breath" },
  ],
};

const categoriesByMarket: Record<string, FilterOption[]> = {
  National: [
    { label: "Hair Care", value: "Hair Care" },
    { label: "Oral Care", value: "Oral Care" },
    { label: "Execution Excellence", value: "Execution Excellence" },
  ],
  US: [
    { label: "Hair Care", value: "Hair Care" },
    { label: "Oral Care", value: "Oral Care" },
    { label: "Deodorants", value: "Deodorants" },
  ],
};

const channelsByMarket: Record<string, FilterOption[]> = {
  National: [
    { label: "All Channels", value: "All Channels" },
    { label: "Supermarket", value: "Supermarket" },
  ],
  US: [
    { label: "Supermarket", value: "Supermarket" },
    { label: "Hypermarket", value: "Hypermarket" },
  ],
};

export async function getCreateFormMarkets(): Promise<FilterOption[]> {
  await delay();
  return structuredClone(markets);
}

export async function getOptionsForMarket(
  market: string,
): Promise<MarketScopedOptions> {
  await delay();
  if (!market) {
    return { categories: [], campaigns: [], channels: [] };
  }

  return {
    categories: structuredClone(categoriesByMarket[market] ?? []),
    campaigns: structuredClone(campaignsByMarket[market] ?? []),
    channels: structuredClone(channelsByMarket[market] ?? []),
  };
}

export type AddCampaignResult =
  | { ok: true; campaign: FilterOption }
  | { ok: false; error: string };

/** Mock API — replace with real backend call later. */
export async function addCampaign(
  market: string,
  campaignName: string,
): Promise<AddCampaignResult> {
  await delay(400);

  const trimmed = campaignName.trim();
  if (!market) {
    return { ok: false, error: "Select a market before adding a campaign." };
  }
  if (!trimmed) {
    return { ok: false, error: "Campaign name is required." };
  }

  const list = campaignsByMarket[market] ?? (campaignsByMarket[market] = []);
  const exists = list.some(
    (item) => item.value.toLowerCase() === trimmed.toLowerCase(),
  );

  if (exists) {
    return {
      ok: false,
      error: "This campaign already exists for the selected market.",
    };
  }

  const campaign = { label: trimmed, value: trimmed };
  list.push(campaign);
  return { ok: true, campaign };
}

/** Image fields persisted on the national create payload (blob URLs for now). */
export type NationalImagePayload = {
  id?: string;
  name: string;
  blob_url: string;
};

export type NationalInitiativePayload = {
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
  images: NationalImagePayload[];
};

export type NationalPillarPayload = {
  pillar_number: number;
  pillar_name: string;
  pillar_description: string;
  pillar_weight: number;
  initiatives: NationalInitiativePayload[];
};

export type NationalOnePagerCreatePayload = {
  market: string;
  category: string;
  campaign: string;
  channel: string;
  title: string;
  business_outcome_statement: string;
  cover_image: NationalImagePayload | null;
  scoring_mode: ScoringMode;
  pillars: NationalPillarPayload[];
};

/** Builds the create/save payload, including blob: URLs for every image on the form. */
export function buildNationalOnePagerPayload(
  values: NationalFormValues,
  scoringMode: ScoringMode,
  pillars: PillarDraft[],
): NationalOnePagerCreatePayload {
  return {
    market: values.market,
    category: values.category,
    campaign: values.campaign,
    channel: values.channel,
    title: values.title.trim(),
    business_outcome_statement: values.businessOutcome.trim(),
    cover_image: values.coverImageUrl
      ? {
          name: values.coverImageName,
          blob_url: values.coverImageUrl,
        }
      : null,
    scoring_mode: scoringMode,
    pillars: pillars.map((pillar) => ({
      pillar_number: pillar.pillar_number,
      pillar_name: pillar.pillar_name,
      pillar_description: pillar.pillar_description.trim(),
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
        images: initiative.images.map((image) => ({
          id: image.id,
          name: image.name,
          blob_url: image.blobUrl,
        })),
      })),
    })),
  };
}

type SaveDraftResult = { ok: true; id: string } | { ok: false; error: string };

const draftStore: NationalOnePagerCreatePayload[] = [];

/** Mock save-draft API — stores payload (with image blob URLs) in memory. */
export async function saveNationalDraft(
  payload: NationalOnePagerCreatePayload,
): Promise<SaveDraftResult> {
  await delay(400);
  if (!payload.title.trim()) {
    return { ok: false, error: "Title is required to save a draft." };
  }
  draftStore.push(structuredClone(payload));
  return { ok: true, id: `draft-${draftStore.length}` };
}
