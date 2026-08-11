import type { FilterMetadata } from "@/types/onePager";

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

const metadata: FilterMetadata = {
  market: [
    { label: "National", value: "National" },
    { label: "US", value: "US" },
  ],
  retailer: [
    { label: "Supermarket", value: "Supermarket" },
    { label: "Walmart", value: "Walmart" },
    { label: "Target", value: "Target" },
  ],
  channel: [
    { label: "Supermarket", value: "Supermarket" },
    { label: "Hypermarket", value: "Hypermarket" },
  ],
  category: [
    { label: "Hair Care", value: "Hair Care" },
    { label: "Oral Care", value: "Oral Care" },
    { label: "Deodorants", value: "Deodorants" },
    { label: "Execution Excellence", value: "Execution Excellence" },
  ],
  campaign: [
    { label: "Summer Freshness", value: "Summer Freshness" },
    { label: "National Growth Program", value: "National Growth Program" },
    { label: "Fresh Breath", value: "Fresh Breath" },
    { label: "Scalp & Shine", value: "Scalp & Shine" },
    { label: "Maximum Protection", value: "Maximum Protection" },
  ],
};

/** Mock getMetadata — replace with real API later. */
export async function getMetadata(): Promise<FilterMetadata> {
  await delay();
  return structuredClone(metadata);
}
