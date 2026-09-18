/**
 * One-slide PPT export (pptxgenjs, client-side).
 *
 * ---------------------------------------------------------------------------
 * What this file does
 * ---------------------------------------------------------------------------
 * Click Export (Home ⋯, View / published Preview More Options) → this module
 * builds ONE widescreen slide and downloads `{title}.pptx`. There is no
 * FastAPI export endpoint yet.
 *
 * Data comes from the same GET-by-id payload as View/Edit/Track
 * (`getOnePagerById` → mapped record). Cover `image_url` and Track RAG dots
 * are NOT drawn. National vs Retailer only changes the composed header title
 * (Retailer includes Target Retailer).
 *
 * ---------------------------------------------------------------------------
 * Slide map (widescreen 13.333" × 7.5")
 * ---------------------------------------------------------------------------
 *   [ Perfect Store ]  TITLE (composed)           [Channel | Category | Market] [Unilever]
 *                      business_outcome_statement
 *   -----------------------------------------------------------------------------------
 *   | Pillar 1 col | Pillar 2 col | Pillar 3 col | Pillar 4 col | Pillar 5 col |
 *   | icon + name  | …            |              |              |              |
 *   | description  |              |              |              |              |
 *   | P1 / P2 / P3 initiative slots (empty slots stay blank so the grid does not shift)
 *
 * Each initiative slot, top → bottom:
 *   P1/P2/P3 circle + department pill + timeline pill (far right, "W30-W33 (Aug 1-Sep 27)")
 *   Initiative (label + initiative_description)
 *   Success Measure (single line, kpi_metric + success_target + unit)
 *   Guidelines (value only — label hidden/commented)
 *   Photo strip: up to 3 images, FIXED width = 1/3 of the column
 *     (1 image does not stretch; same slot size as a 3-up strip)
 *   checklist_compliance_notes under the photos
 *
 * Font sizing: Initiative / Guidelines / pillar description / checklist notes
 * scale via PPT_FONT_SIZE_BUCKETS (fontSizeForLength) in fieldLimits.ts.
 * Boxes stay fixed height; only the font size changes to fit.
 *
 * ---------------------------------------------------------------------------
 * How to change layout (all sizes are inches)
 * ---------------------------------------------------------------------------
 * Slide / header / columns: SLIDE_W, SLIDE_H, HEADER_H, MARGIN_X, COL_GAP
 * Colors: PILLAR_THEME, PRIORITY_COLOR, header fill "0066CC"
 * Header logos: x/y/w/h inside addHeader (Perfect Store left, Unilever right)
 * Header meta bar: barH / segmentPadX in addHeader (one capsule, Channel|Category|Market)
 * Column icon size: `icon` in addColumn
 * Initiative text box heights: the 0.32 / 0.24 / 0.33 cursor steps in addInitiative
 * Photo size: imageH and MAX_INITIATIVE_IMAGES (strip width = innerW / 3)
 *
 * If text overflows the slide, prefer tightening those heights — or lower
 * FIELD_LIMITS in `components/form/fieldLimits.ts` (form maxLength is sized
 * to these boxes: ~40 chars/line in a column, ~2 lines for initiative /
 * guidelines / pillar description).
 *
 * ---------------------------------------------------------------------------
 * Images & icons
 * ---------------------------------------------------------------------------
 * pptxgenjs needs data URLs. We fetch http / blob: / Vite SVG URLs, then:
 *   - raster SVG → PNG (PowerPoint SVG embed is unreliable)
 *   - other types → FileReader data URL
 * Failed / CORS / example.com URLs → empty rounded placeholder (slide still
 * downloads). Duplicate URLs are fetched once (loadImageCache).
 *
 * Pillar icons: dummy SVGs in `src/assets/pillars/`. Replace the files, keep
 * the filenames. Lookup is by pillar_number 1–5 in pillarIcons.ts.
 *
 * ---------------------------------------------------------------------------
 * Entry points
 * ---------------------------------------------------------------------------
 * exportOnePagerPpt({ pagerType, payload })  — already have the record (View)
 * exportOnePagerById(pagerId)                — Home card: GET then export
 *
 * TODO: Optional later — GET /api/one-pagers/:id/export if the server should
 * generate the file. Keep one LAYOUT_WIDE slide + these payload field names.
 * Do not POST blob: URLs as storage; upload first, then save/publish.
 */

// TODO: Remove frontend/package.json overrides.image-size once pptxgenjs
// drops unused image-size (gitbrent/PptxGenJS#1474). Keep pptxgenjs ^4.0.1;
// do not run npm audit fix --force (it downgrades to 1.1.5).
import PptxGenJS from "pptxgenjs";

import { PILLAR_ICON_BY_NUMBER } from "@/assets/pillars/pillarIcons";
import perfectStoreLogo from "@/assets/Perfect Store_Hero_Logo_DarkBG 1.svg";
import unileverBrandLogo from "@/assets/UnileverLogo.svg";
import {
  composeNationalPreviewTitle,
  composeRetailerPreviewTitle,
  formatInitiativeTimeline,
  formatSuccessTarget,
} from "@/components/preview/nationalPreview";
import {
  MAX_INITIATIVE_IMAGES,
  MAX_INITIATIVES_PER_PILLAR,
} from "@/components/form/pillars";
import type {
  NationalInitiativePayload,
  NationalOnePagerCreatePayload,
  NationalPillarPayload,
} from "@/services/createFormApi";
import { getOnePagerById } from "@/services/onePagerApi";
import type { RetailerOnePagerCreatePayload } from "@/services/retailerCreateFormApi";
import {
  flattenLineBreaks,
  fontSizeForLength,
  PPT_SUCCESS_MEASURE_FONT_SIZE,
} from "@/components/form/fieldLimits";

type Slide = ReturnType<PptxGenJS["addSlide"]>;

type ExportPayload =
  | NationalOnePagerCreatePayload
  | RetailerOnePagerCreatePayload;

export type ExportOnePagerInput = {
  pagerType: "national" | "retailer";
  payload: ExportPayload;
};

/** Widescreen inches. LAYOUT_WIDE is 13.333 × 7.5. Change these to resize the whole slide. */
const SLIDE_W = 13.333;
const SLIDE_H = 7.5;
/** Dark-blue bar. Increase if title + outcome need more than two lines. */
const HEADER_H = 0.7;
const MARGIN_X = 0.1;
const COL_GAP = 0.06;
const COL_COUNT = 5;

/** Card fill + pillar-name color. Keys are pillar_number 1–5 (preview CSS hex, no #). */
const PILLAR_THEME: Record<number, { bg: string; title: string }> = {
  1: { bg: "FFF7F6", title: "E73C43" },
  2: { bg: "FFF7FF", title: "E863E6" },
  3: { bg: "F4FCF9", title: "00C79D" },
  4: { bg: "FAFCF4", title: "A5BA02" },
  5: { bg: "FEFAF5", title: "EF9E22" },
};

/**
 * P1 / P2 / P3 badge fill — mirrors the one-pager view UI
 * (--preview-priority-p1/2/3 in index.css), not red/amber/green.
 */
const PRIORITY_COLOR: Record<string, string> = {
  P1: "FDE6D4",
  P2: "FFEDD5",
  P3: "FEF3C7",
};

/** Badge label color — mirrors --preview-priority-fg (dark, readable on the pastels). */
const PRIORITY_TEXT_COLOR = "3D3D3D";

/** Slot label: initiative 1 → P1, 2 → P2, 3 → P3 (same rule as the form). */
function priorityBadge(
  initiative: NationalInitiativePayload,
): "P1" | "P2" | "P3" {
  const fromNumber = `P${initiative.initiative_number}`;
  if (fromNumber === "P1" || fromNumber === "P2" || fromNumber === "P3") {
    return fromNumber;
  }
  return initiative.priority_level;
}

/** Blocks a second click while images fetch + the file writes. */
let exportBusy = false;

function isRetailerPayload(
  payload: ExportPayload,
): payload is RetailerOnePagerCreatePayload {
  return "target_retailer" in payload;
}

/** PPT header title — not payload.title. National: National-Channel-Category-Campaign-Market. Retailer inserts Target Retailer after Retailer. */
function composeTitle(
  pagerType: "national" | "retailer",
  payload: ExportPayload,
) {
  if (pagerType === "retailer" && isRetailerPayload(payload)) {
    return composeRetailerPreviewTitle(payload);
  }
  return composeNationalPreviewTitle(payload);
}

function safeFileName(title: string) {
  const base = title.replace(/[<>:"/\\|?*]/g, "-").trim() || "OnePager";
  return `${base.slice(0, 80)}.pptx`;
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(blob);
  });
}
async function blobToPngDataUrl(
  blob: Blob,
  targetWidth = 900,
  targetHeight = 900,
  scale = 2, // supersample factor so it stays crisp even when resized larger in PPT
): Promise<string> {
  const svgUrl = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = svgUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
    });

    // Preserve aspect ratio if the SVG has intrinsic dimensions,
    // otherwise fall back to the target box.
    let width = targetWidth;
    let height = targetHeight;
    if (img.naturalWidth && img.naturalHeight) {
      const aspect = img.naturalWidth / img.naturalHeight;
      if (aspect >= 1) {
        width = targetWidth;
        height = Math.round(targetWidth / aspect);
      } else {
        height = targetHeight;
        width = Math.round(targetHeight * aspect);
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null as unknown as string; // shouldn't happen, but keep type-safe
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

/**
 * Fetch an image URL (http, blob:, or local SVG) into a data URL for pptxgenjs.
 * SVG is rasterized to PNG because PowerPoint embed of SVG is unreliable.
 */
async function urlToImageData(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    const isSvg =
      blob.type.includes("svg") || url.toLowerCase().includes(".svg");
    if (isSvg) return blobToPngDataUrl(blob);
    return blobToDataUrl(blob);
  } catch {
    return null;
  }
}

async function loadImageCache(urls: string[]) {
  const cache = new Map<string, string>();
  await Promise.all(
    urls.map(async (url) => {
      const data = await urlToImageData(url);
      if (data) cache.set(url, data);
    }),
  );
  return cache;
}

/** Logos, 5 pillar icons, then each initiative’s images (max 3). Cover image is skipped. */
function collectImageUrls(payload: ExportPayload): string[] {
  const urls = new Set<string>([
    perfectStoreLogo,
    unileverBrandLogo,
    ...Object.values(PILLAR_ICON_BY_NUMBER),
  ]);
  for (const pillar of payload.pillars) {
    for (const initiative of pillar.initiatives) {
      const displayUrls = initiative.image_signed_url?.length
        ? initiative.image_signed_url
        : (initiative.images ?? []);
      for (const url of displayUrls.slice(0, MAX_INITIATIVE_IMAGES)) {
        if (url) urls.add(url);
      }
    }
  }
  return Array.from(urls);
}

/** Blue bar: logos, composed title, outcome, Channel|Category|Market capsule (not Campaign). Tweak x/y/w/h here for header spacing. */
function addHeader(
  pptx: PptxGenJS,
  slide: Slide,
  payload: ExportPayload,
  pagerType: "national" | "retailer",
  images: Map<string, string>,
) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: HEADER_H,
    fill: { color: "0066CC" },
    line: { color: "0066CC" },
  });

  const storeLogo = images.get(perfectStoreLogo);
  const storeLogoW = 0.55;
  const storeLogoH = 0.34;
  const logoInset = 0.08;
  if (storeLogo) {
    slide.addImage({
      data: storeLogo,
      x: logoInset,
      y: (HEADER_H - storeLogoH) / 2,
      w: storeLogoW,
      h: storeLogoH,
    });
  }

  const unilever = images.get(unileverBrandLogo);
  const unileverW = 0.42;
  const unileverH = 0.3;
  const unileverX = SLIDE_W - logoInset - unileverW;
  if (unilever) {
    slide.addImage({
      data: unilever,
      x: unileverX,
      y: (HEADER_H - unileverH) / 2,
      w: unileverW,
      h: unileverH,
    });
  }

  const labels = [payload.channel, payload.category, payload.market]
    .map((value) => value.trim())
    .filter(Boolean);
  const barH = 0.28;
  const barY = (HEADER_H - barH) / 2;
  const barRight = unileverX - 0.06;
  const segmentPadX = 0.16;
  const charW = 0.072;
  const minSegW = 0.78;
  const maxSegW = 1.75;
  const segmentWidths = labels.map((label) =>
    Math.min(
      maxSegW,
      Math.max(minSegW, segmentPadX * 2 + label.length * charW),
    ),
  );
  const barW = segmentWidths.reduce((sum, width) => sum + width, 0);
  const barX = labels.length > 0 ? barRight - barW : barRight;

  if (labels.length > 0) {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: barX,
      y: barY,
      w: barW,
      h: barH,
      rectRadius: 0.05,
      fill: { color: "FFFFFF", transparency: 45 },
      line: { type: "none" },
    });

    let segmentX = barX;
    labels.forEach((label, index) => {
      const segmentW = segmentWidths[index] ?? minSegW;
      if (index > 0) {
        const dividerInset = 0.06;
        slide.addShape(pptx.ShapeType.rect, {
          x: segmentX - 0.007,
          y: barY + dividerInset,
          w: 0.014,
          h: barH - dividerInset * 2,
          fill: { color: "FFFFFF" },
          line: { type: "none" },
        });
      }
      slide.addText(label, {
        x: segmentX,
        y: barY,
        w: segmentW,
        h: barH,
        align: "center",
        valign: "middle",
        fontSize: 8,
        fontFace: "Arial",
        color: "FFFFFF",
        bold: true,
        margin: 0,
      });
      segmentX += segmentW;
    });
  }

  const title = composeTitle(pagerType, payload);
  const titleX = logoInset + storeLogoW + 0.08;
  const titleW = Math.max(3.5, barX - titleX - 0.08);
  slide.addText(title, {
    x: titleX,
    y: 0.02,
    w: titleW,
    h: 0.2,
    fontSize: 11,
    fontFace: "Arial",
    color: "FFFFFF",
    bold: true,
    margin: 0,
    valign: "top",
  });
  slide.addText(flattenLineBreaks(payload.business_outcome_statement || ""), {
    x: titleX,
    y: 0.24,
    w: titleW,
    h: HEADER_H - 0.24,
    fontSize: 7.5,
    fontFace: "Arial",
    color: "FFFFFF",
    margin: 0,
    valign: "top",
  });
}

/** Blue label + body in one text box. `h` is the slot height — raise it if FIELD_LIMITS still clips on the slide. */
function addLabeledBlock(
  slide: Slide,
  label: string,
  value: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fontSize = 7,
) {
  const body = flattenLineBreaks(value);
  slide.addText(
    [
      {
        text: label,
        options: { bold: true, color: "0066CC", fontSize, breakLine: true },
      },
      { text: body || "—", options: { color: "333333", fontSize } },
    ],
    {
      x,
      y,
      w,
      h,
      fontFace: "Arial",
      valign: "top",
      margin: 0,
    },
  );
}

/**
 * One P1/P2/P3 block. `cursor` walks down the slot; the height steps are the
 * text-box heights. Font sizes for Initiative / Guidelines / checklist notes
 * come from the char→size buckets in fieldLimits.ts (fontSizeForLength).
 * Photo slots are always 1/3 of innerW — do not use full column width for 1 image.
 */
function addInitiative(
  pptx: PptxGenJS,
  slide: Slide,
  initiative: NationalInitiativePayload,
  x: number,
  y: number,
  w: number,
  h: number,
  images: Map<string, string>,
) {
  const pad = 0.04;
  const innerX = x + pad;
  const innerW = w - pad * 2;
  let cursor = y + pad;

  const badge = 0.18;
  const priority = priorityBadge(initiative);
  const priorityColor = PRIORITY_COLOR[priority] ?? PRIORITY_COLOR.P1;
  slide.addShape(pptx.ShapeType.ellipse, {
    x: innerX,
    y: cursor,
    w: badge,
    h: badge,
    fill: { color: priorityColor },
    line: { color: priorityColor },
  });
  slide.addText(priority, {
    x: innerX,
    y: cursor,
    w: badge,
    h: badge,
    align: "center",
    valign: "middle",
    fontSize: 6,
    fontFace: "Arial",
    color: PRIORITY_TEXT_COLOR,
    bold: true,
    margin: 0,
  });

  // Timeline moved up to the badge row, pinned to the far right (same Y level
  // as the P1/P2/P3 badge).
  const timeline = formatInitiativeTimeline(initiative);
  const timelineW = 1.45;

  const dept = initiative.accountable_function_department || "—";
  const deptMaxW = innerW - badge - 0.06 - (timeline ? timelineW + 0.06 : 0);
  const deptW = Math.min(0.9, deptMaxW);
  slide.addShape(pptx.ShapeType.roundRect, {
    x: innerX + badge + 0.04,
    y: cursor,
    w: deptW,
    h: badge,
    rectRadius: 0.04,
    fill: { color: "E0E0E0" },
    line: { color: "E0E0E0" },
  });
  slide.addText(dept, {
    x: innerX + badge + 0.04,
    y: cursor,
    w: deptW,
    h: badge,
    align: "center",
    valign: "middle",
    fontSize: 6,
    fontFace: "Arial",
    color: "3D3D3D",
    margin: 0,
  });

  if (timeline) {
    const timelineX = innerX + innerW - timelineW;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: timelineX,
      y: cursor,
      w: timelineW,
      h: badge,
      rectRadius: 0.08,
      fill: { color: "A4F9FF" },
      line: { color: "A4F9FF" },
    });
    slide.addText(timeline, {
      x: timelineX,
      y: cursor,
      w: timelineW,
      h: badge,
      align: "center",
      valign: "middle",
      fontSize: 6,
      fontFace: "Arial",
      color: "1F2937",
      margin: 0,
    });
  }
  cursor += badge + 0.04;

  const urls = (
    initiative.image_signed_url?.length
      ? initiative.image_signed_url
      : (initiative.images ?? [])
  )
    .filter(Boolean)
    .slice(0, MAX_INITIATIVE_IMAGES);
  const hasImages = urls.length > 0;
  const hasNotes = Boolean(initiative.checklist_compliance_notes?.trim());

  // Leftover space at the slot bottom goes to Initiative + Guidelines.
  // Photos keep a fixed height; Success Measure / photos / notes shift down.
  const minInitH = 0.32;
  const minGuideH = 0.32;
  const smH = 0.12;
  const gapAfterInit = 0.01;
  const gapAfterSm = 0.01;
  const gapAfterGuide = 0.02;
  const imageH = 0.34;
  const gapAfterImages = 0.03;
  const minNotesH = 0.16;
  const usedMin =
    pad +
    badge +
    0.04 +
    minInitH +
    gapAfterInit +
    smH +
    gapAfterSm +
    minGuideH +
    gapAfterGuide +
    (hasImages ? imageH + gapAfterImages : 0) +
    (hasNotes ? minNotesH : 0) +
    pad;
  const extra = Math.max(0, h - usedMin);
  const initBoxH = minInitH + extra / 2;
  const guideBoxH = minGuideH + extra / 2;
  // Wider than the badge row: less left/right inset, same pillar width.
  const textX = x + 0.01;
  const textW = w - 0.02;

  addLabeledBlock(
    slide,
    "Initiative",
    initiative.initiative_description,
    textX,
    cursor,
    textW,
    initBoxH,
    fontSizeForLength(
      flattenLineBreaks(initiative.initiative_description).length,
    ),
  );
  cursor += initBoxH + gapAfterInit;

  slide.addText(
    [
      {
        text: "Success Measure: ",
        options: {
          bold: true,
          color: "0066CC",
          fontSize: PPT_SUCCESS_MEASURE_FONT_SIZE,
        },
      },
      {
        text: formatSuccessTarget(initiative) || "—",
        options: {
          color: "333333",
          fontSize: PPT_SUCCESS_MEASURE_FONT_SIZE,
        },
      },
    ],
    {
      x: textX,
      y: cursor,
      w: textW,
      h: smH,
      fontFace: "Arial",
      valign: "middle",
      margin: 0,
      wrap: false,
    },
  );
  cursor += smH + gapAfterSm;

  // Guidelines — heading on (sample/prod). Hide by commenting the label run.
  const guidelinesText = flattenLineBreaks(initiative.guidelines);
  const guidelinesFont = fontSizeForLength(guidelinesText.length);
  slide.addText(
    [
      {
        text: "Guidelines",
        options: {
          bold: true,
          color: "0066CC",
          fontSize: guidelinesFont,
          breakLine: true,
        },
      },
      {
        text: guidelinesText || "—",
        options: { color: "333333", fontSize: guidelinesFont },
      },
    ],
    {
      x: textX,
      y: cursor,
      w: textW,
      h: guideBoxH,
      fontFace: "Arial",
      valign: "top",
      margin: 0,
    },
  );
  cursor += guideBoxH + gapAfterGuide;

  const imageGap = 0.04;
  const imageW =
    (innerW - imageGap * (MAX_INITIATIVE_IMAGES - 1)) / MAX_INITIATIVE_IMAGES;

  urls.forEach((url, index) => {
    const imgX = innerX + index * (imageW + imageGap);
    const data = images.get(url);
    if (data) {
      slide.addImage({
        data,
        x: imgX,
        y: cursor,
        w: imageW,
        h: imageH,
        sizing: { type: "cover", w: imageW, h: imageH },
      });
    } else {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: imgX,
        y: cursor,
        w: imageW,
        h: imageH,
        rectRadius: 0.03,
        fill: { color: "FFFFFF" },
        line: { color: "DDDDDD" },
      });
    }
  });
  if (hasImages) cursor += imageH + gapAfterImages;

  if (hasNotes) {
    const captionH = Math.max(minNotesH, y + h - cursor - pad);
    const notesText = flattenLineBreaks(
      initiative.checklist_compliance_notes,
    );
    slide.addText(notesText, {
      x: textX,
      y: cursor,
      w: textW,
      h: captionH,
      fontSize: fontSizeForLength(notesText.length),
      fontFace: "Arial",
      color: "555555",
      valign: "top",
      margin: 0,
    });
  }
}

/** One of the 5 columns: tinted card, dummy/real icon, name, description, then 3 initiative slots. */
function addColumn(
  pptx: PptxGenJS,
  slide: Slide,
  pillar: NationalPillarPayload,
  x: number,
  y: number,
  w: number,
  h: number,
  images: Map<string, string>,
  showWeight: boolean,
) {
  const theme = PILLAR_THEME[pillar.pillar_number] ?? PILLAR_THEME[1];
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.06,
    fill: { color: theme.bg },
    line: { color: "E5E7EB" },
  });

  const pad = 0.08;
  const icon = 0.26; // −2px vs prior 0.28"
  const titleH = 0.18;
  // Weight now sits at the title row's right (not stacked below), so no
  // vertical reservation is needed here.
  const scoreH = 0;
  const stackH = titleH + scoreH;
  const headerH = Math.max(icon, stackH);
  const iconUrl = PILLAR_ICON_BY_NUMBER[pillar.pillar_number];
  const iconData = iconUrl ? images.get(iconUrl) : undefined;
  const iconY = y + pad + (headerH - icon) / 2;
  if (iconData) {
    slide.addImage({
      data: iconData,
      x: x + pad,
      y: iconY,
      w: icon,
      h: icon,
    });
  } else {
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + pad,
      y: y + pad,
      w: icon,
      h: icon,
      fill: { color: theme.title },
      line: { color: theme.title },
    });
  }

  // Reserve room on the far right of the title row for the weight (WEIGHTED).
  const weightW = showWeight ? 0.5 : 0;
  const titleX = x + pad + icon + 0.05;
  const titleW = w - pad * 2 - icon - 0.05 - weightW;
  const textY = y + pad + (headerH - stackH) / 2;

  slide.addText(pillar.pillar_name, {
    x: titleX,
    y: textY,
    w: titleW,
    h: titleH,
    fontSize: 7,
    fontFace: "Arial",
    color: theme.title,
    bold: true,
    valign: "middle",
    margin: 0,
  });

  // Pillar weight — WEIGHTED mode only. Small font, pinned to the title row's
  // far right, e.g. "20pts".
  if (showWeight) {
    slide.addText(`${pillar.pillar_weight}pts`, {
      x: x + w - pad - weightW,
      y: textY,
      w: weightW,
      h: titleH,
      align: "right",
      valign: "middle",
      fontSize: 7,
      fontFace: "Arial",
      color: theme.title,
      bold: true,
      margin: 0,
    });
  }

  const pillarDescription = flattenLineBreaks(pillar.pillar_description || "");
  slide.addText(pillarDescription, {
    x: x + pad,
    y: y + pad + headerH + 0.04,
    w: w - pad * 2,
    h: 0.32,
    fontSize: fontSizeForLength(pillarDescription.length),
    fontFace: "Arial",
    color: "555555",
    valign: "top",
    margin: 0,
  });

  const bodyY = y + pad + headerH + 0.4;
  const bodyH = h - (bodyY - y) - pad;
  const initGap = 0.05;
  const initH =
    (bodyH - initGap * (MAX_INITIATIVES_PER_PILLAR - 1)) /
    MAX_INITIATIVES_PER_PILLAR;
  const initiatives = [...pillar.initiatives].sort(
    (a, b) => a.initiative_number - b.initiative_number,
  );

  for (let i = 0; i < MAX_INITIATIVES_PER_PILLAR; i++) {
    const initiative = initiatives[i];
    const initY = bodyY + i * (initH + initGap);
    if (!initiative) continue;
    if (i > 0) {
      slide.addShape(pptx.ShapeType.rect, {
        x: x + pad,
        y: initY - initGap / 2,
        w: w - pad * 2,
        h: 0.01,
        fill: { color: "D1D5DB" },
        line: { color: "D1D5DB" },
      });
    }
    addInitiative(
      pptx,
      slide,
      initiative,
      x + pad,
      initY,
      w - pad * 2,
      initH,
      images,
    );
  }
}

/**
 * Build and download the PPT from a payload already in memory (View / Preview).
 * Fetches images first, then draws header + 5 columns on a single LAYOUT_WIDE slide.
 */
export async function exportOnePagerPpt(input: ExportOnePagerInput) {
  if (exportBusy) return;
  exportBusy = true;
  try {
    const images = await loadImageCache(collectImageUrls(input.payload));
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    pptx.title = composeTitle(input.pagerType, input.payload);
    const slide = pptx.addSlide();
    slide.background = { color: "F5F5F5" };

    addHeader(pptx, slide, input.payload, input.pagerType, images);

    const colW =
      (SLIDE_W - MARGIN_X * 2 - COL_GAP * (COL_COUNT - 1)) / COL_COUNT;
    const colY = HEADER_H + 0.08;
    const colH = SLIDE_H - colY - 0.08;
    const pillars = [...input.payload.pillars]
      .sort((a, b) => a.pillar_number - b.pillar_number)
      .slice(0, COL_COUNT);

    pillars.forEach((pillar, index) => {
      addColumn(
        pptx,
        slide,
        pillar,
        MARGIN_X + index * (colW + COL_GAP),
        colY,
        colW,
        colH,
        images,
        input.payload.scoring_mode === "WEIGHTED",
      );
    });

    await pptx.writeFile({
      fileName: safeFileName(composeTitle(input.pagerType, input.payload)),
    });
  } finally {
    exportBusy = false;
  }
}

/** Landing Export: load GET-by-id, then download the PPT. */
export async function exportOnePagerById(pagerId: string) {
  const record = await getOnePagerById(pagerId);
  if (!record) {
    throw new Error("Could not load the one-pager.");
  }
  await exportOnePagerPpt({
    pagerType: record.pager_type,
    payload: record.payload,
  });
}
