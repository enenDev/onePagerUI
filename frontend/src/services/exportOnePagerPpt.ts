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
 *   P1/P2/P3 circle + department pill
 *   Initiative (label + initiative_description)
 *   Success Target (kpi_metric + success_target + unit)
 *   Guidelines
 *   Timeline pill (week_start / week_end as "w/c …")
 *   Photo strip: up to 3 images, FIXED width = 1/3 of the column
 *     (1 image does not stretch; same slot size as a 3-up strip)
 *   checklist_compliance_notes under the photos
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
import perfectStoreLogo from "@/assets/Perfect_Store_Hero_Logo.svg";
import unileverBrandLogo from "@/assets/Unilever_Brand_Logo.svg";
import {
  composeNationalPreviewTitle,
  composeRetailerPreviewTitle,
  formatPreviewDateRange,
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

/** P1 / P2 / P3 circle fill on each initiative. */
const PRIORITY_COLOR: Record<string, string> = {
  P1: "E73C43",
  P2: "EF9E22",
  P3: "A5BA02",
};

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

function formatTimeline(start: string, end: string) {
  const label = formatPreviewDateRange(start, end);
  if (!label) return "";
  const [from, to] = label.split(" – ");
  return to ? `w/c ${from} – w/c ${to}` : `w/c ${from}`;
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(blob);
  });
}

function blobToPngDataUrl(blob: Blob) {
  return new Promise<string | null>((resolve) => {
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, img.naturalWidth);
      canvas.height = Math.max(1, img.naturalHeight);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
    img.src = objectUrl;
  });
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
      for (const image of initiative?.images?.slice(0, MAX_INITIATIVE_IMAGES) ||
        []) {
        if (image) urls.add(image);
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
  if (storeLogo) {
    slide.addImage({ data: storeLogo, x: 0.12, y: 0.18, w: 1.55, h: 0.34 });
  }

  const unilever = images.get(unileverBrandLogo);
  if (unilever) {
    slide.addImage({
      data: unilever,
      x: SLIDE_W - 1.22,
      y: 0.22,
      w: 1.05,
      h: 0.26,
    });
  }

  const labels = [payload.channel, payload.category, payload.market]
    .map((value) => value.trim())
    .filter(Boolean);
  const barH = 0.28;
  const barY = 0.21;
  const barRight = SLIDE_W - 1.28;
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
      rectRadius: barH / 2,
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
  const titleX = 1.8;
  const titleW = Math.max(3.5, barX - titleX - 0.12);
  slide.addText(title, {
    x: titleX,
    y: 0.08,
    w: titleW,
    h: 0.32,
    fontSize: 12,
    fontFace: "Arial",
    color: "FFFFFF",
    bold: true,
    margin: 0,
    valign: "middle",
  });
  slide.addText(payload.business_outcome_statement || "", {
    x: titleX,
    y: 0.38,
    w: titleW,
    h: 0.26,
    fontSize: 8,
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
) {
  slide.addText(
    [
      {
        text: label,
        options: { bold: true, color: "0066CC", fontSize: 7, breakLine: true },
      },
      { text: value || "—", options: { color: "333333", fontSize: 7 } },
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
 * One P1/P2/P3 block. `cursor` walks down the slot; the 0.32 / 0.24 / 0.33
 * steps are the text-box heights (keep in sync with fieldLimits.ts).
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
  const priorityColor = PRIORITY_COLOR[priority] ?? "E73C43";
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
    color: "FFFFFF",
    bold: true,
    margin: 0,
  });

  const dept = initiative.accountable_function_department || "—";
  const deptW = Math.min(0.9, innerW - badge - 0.06);
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
  cursor += badge + 0.04;

  addLabeledBlock(
    slide,
    "Initiative",
    initiative.initiative_description,
    innerX,
    cursor,
    innerW,
    0.32,
  );
  cursor += 0.33;

  addLabeledBlock(
    slide,
    "Success Target",
    formatSuccessTarget(initiative),
    innerX,
    cursor,
    innerW,
    0.24,
  );
  cursor += 0.25;

  addLabeledBlock(
    slide,
    "Guidelines",
    initiative.guidelines,
    innerX,
    cursor,
    innerW,
    0.32,
  );
  cursor += 0.33;

  const timeline = formatTimeline(initiative.week_start, initiative.week_end);
  if (timeline) {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: innerX,
      y: cursor,
      w: Math.min(innerW, 1.7),
      h: 0.16,
      rectRadius: 0.08,
      fill: { color: "A4F9FF" },
      line: { color: "A4F9FF" },
    });
    slide.addText(timeline, {
      x: innerX,
      y: cursor,
      w: Math.min(innerW, 1.7),
      h: 0.16,
      align: "center",
      valign: "middle",
      fontSize: 6,
      fontFace: "Arial",
      color: "1F2937",
      margin: 0,
    });
    cursor += 0.2;
  }

  const imageGap = 0.04;
  const imageW =
    (innerW - imageGap * (MAX_INITIATIVE_IMAGES - 1)) / MAX_INITIATIVE_IMAGES;
  const imageH = 0.34;
  const urls = (initiative.images ?? [])
    .filter(Boolean)
    .slice(0, MAX_INITIATIVE_IMAGES);

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
  if (urls.length > 0) cursor += imageH + 0.04;

  if (initiative.checklist_compliance_notes) {
    const captionH = Math.max(0.16, y + h - cursor - pad);
    slide.addText(initiative.checklist_compliance_notes, {
      x: innerX,
      y: cursor,
      w: innerW,
      h: captionH,
      fontSize: 6,
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
  const icon = 0.28;
  const iconUrl = PILLAR_ICON_BY_NUMBER[pillar.pillar_number];
  const iconData = iconUrl ? images.get(iconUrl) : undefined;
  if (iconData) {
    slide.addImage({
      data: iconData,
      x: x + pad,
      y: y + pad,
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

  slide.addText(pillar.pillar_name, {
    x: x + pad + icon + 0.06,
    y: y + pad,
    w: w - pad * 2 - icon - 0.06,
    h: icon,
    fontSize: 9,
    fontFace: "Arial",
    color: theme.title,
    bold: true,
    valign: "middle",
    margin: 0,
  });
  const weightH = 0.12;
  slide.addText(`${pillar.pillar_weight}%`, {
    x: x + pad,
    y: y + pad + icon,
    w: w - pad * 2,
    h: weightH,
    fontSize: 6,
    fontFace: "Arial",
    color: theme.title,
    align: "right",
    valign: "middle",
    margin: 0,
    wrap: false,
  });

  slide.addText(pillar.pillar_description || "", {
    x: x + pad,
    y: y + pad + icon + weightH + 0.02,
    w: w - pad * 2,
    h: 0.32,
    fontSize: 7,
    fontFace: "Arial",
    color: "555555",
    valign: "top",
    margin: 0,
  });

  const bodyY = y + pad + icon + weightH + 0.38;
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
