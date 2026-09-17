/**
 * Character limits so create/edit copy fits one widescreen PPT slide.
 * Column body is ~2.35" at 7pt Arial (~40 chars/line). Header is ~6.5" at 8–12pt.
 */
export const FIELD_LIMITS = {
  /** Landing + payload title (auto from strategy dropdowns; editable). */
  title: 100,
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

/**
 * PPT export font-size buckets — single source of truth.
 *
 * Longer copy shrinks to fit its FIXED box in the exported slide. Boxes do not
 * resize; only the font size changes. Change ranges/sizes HERE only.
 *
 * Applied (via fontSizeForLength) to: Initiative, Guidelines, pillar
 * description, and checklist/image notes. Success Measure uses the fixed
 * PPT_SUCCESS_MEASURE_FONT_SIZE (single line). Header Business Outcome stays
 * a fixed size.
 *
 * A bucket matches when `value.length <= maxChars` (first match wins). Content
 * longer than the last bucket stays at the smallest (floor) size and is allowed
 * to overflow rather than being clipped.
 */
export type FontSizeBucket = { maxChars: number; fontSize: number };

export const PPT_FONT_SIZE_BUCKETS: readonly FontSizeBucket[] = [
  { maxChars: 120, fontSize: 7 },
  { maxChars: 200, fontSize: 5.5 },
  { maxChars: 300, fontSize: 4.5 },
  { maxChars: 400, fontSize: 4 },
  { maxChars: 500, fontSize: 3.5 }, // floor
] as const;

/**
 * Success Measure is a single non-wrapping line between Initiative and
 * Guidelines. Keep this smaller than the Initiative default (7pt) so a
 * slightly overflowing Initiative is less likely to collide, and so the
 * 0.14" row still has air above Guidelines. 6pt line ≈ 0.10" inside 0.14".
 */
export const PPT_SUCCESS_MEASURE_FONT_SIZE = 6;

/** First bucket whose maxChars >= length; falls back to the smallest (floor) size. */
export function fontSizeForLength(
  length: number,
  buckets: readonly FontSizeBucket[] = PPT_FONT_SIZE_BUCKETS,
): number {
  for (const bucket of buckets) {
    if (length <= bucket.maxChars) return bucket.fontSize;
  }
  return buckets[buckets.length - 1]?.fontSize ?? 4;
}
