/**
 * Dummy pillar icons for PPT export.
 * Replace the 5 SVG files in this folder with the real icons.
 * Keep these filenames — lookup is by pillar_number 1–5.
 */
import pillar1CategoryLeadership from "@/assets/pillars/pillar-1-category-leadership.svg";
import pillar2UnmissableRetailTheater from "@/assets/pillars/pillar-2-unmissable-retail-theater.svg";
import pillar3MoreStoresBetterStores from "@/assets/pillars/pillar-3-more-stores-better-stores.svg";
import pillar4FrictionlessDigital from "@/assets/pillars/pillar-4-frictionless-digital.svg";
import pillar5AlwaysAvailable from "@/assets/pillars/pillar-5-always-available.svg";

export const PILLAR_ICON_BY_NUMBER: Record<number, string> = {
  1: pillar1CategoryLeadership,
  2: pillar2UnmissableRetailTheater,
  3: pillar3MoreStoresBetterStores,
  4: pillar4FrictionlessDigital,
  5: pillar5AlwaysAvailable,
};
