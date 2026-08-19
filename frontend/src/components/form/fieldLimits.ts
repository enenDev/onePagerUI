/**
 * Character limits so create/edit copy fits one widescreen PPT slide.
 * Column body is ~2.35" at 7pt Arial (~40 chars/line). Header is ~6.5" at 8–12pt.
 */
export const FIELD_LIMITS = {
  /** Landing + payload title. PPT header uses composed Market/Channel/etc. */
  title: 80,
  /** PPT header subtitle — about 2 lines. */
  businessOutcome: 120,
  /** Header pill + composed title segment. */
  campaignName: 30,
  /** Pillar intro under the name — about 2 lines. */
  pillarDescription: 80,
  /** Initiative line — about 2 lines. */
  initiativeDescription: 80,
  /** Numeric/short target before unit. */
  successTarget: 10,
  /** %, Outlets, ACV%, etc. */
  unit: 10,
  /** Body under Success Target — about 2 lines. */
  guidelines: 80,
  /** Caption under the photo strip — about 2 short lines. */
  checklistNotes: 60,
} as const;

export function clipToLimit(value: string, max: number) {
  return value.length <= max ? value : value.slice(0, max);
}
