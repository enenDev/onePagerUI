/**
 * Dynamic PPT layout. Turn it on with USE_DYNAMIC_PPT_EXPORT in pptExport.ts.
 *
 * Initiatives stack from the top. The separator sits under each block.
 * Initiative, Guidelines, and notes share one size: 8 pt, or 7 pt when every
 * initiative has guidelines, photos, and notes. If the stack is taller than
 * the column, that size drops by 0.5 pt until it fits. Lines are not cut.
 * Photos are 0.24" tall and one third of the column wide.
 */
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
import { MAX_INITIATIVE_IMAGES } from "@/components/form/pillars";
import type {
  NationalInitiativePayload,
  NationalOnePagerCreatePayload,
  NationalPillarPayload,
} from "@/services/createFormApi";
import type { RetailerOnePagerCreatePayload } from "@/services/retailerCreateFormApi";
import { logPagerActivity } from "@/services/pagerActivityApi";
import { getOnePagerById } from "@/services/onePagerApi";
import {
  flattenLineBreaks,
  fontSizeForLength,
} from "@/components/form/fieldLimits";
import type { ExportOnePagerInput } from "@/services/exportOnePagerPpt";

type Slide = ReturnType<PptxGenJS["addSlide"]>;

type DynamicPayload =
  | NationalOnePagerCreatePayload
  | RetailerOnePagerCreatePayload;

export type DynamicExportInput = {
  pagerType: "national" | "retailer";
  payload: DynamicPayload;
};

function slideTitle(input: DynamicExportInput) {
  if (input.pagerType === "retailer" && "target_retailer" in input.payload) {
    return composeRetailerPreviewTitle(input.payload);
  }
  return composeNationalPreviewTitle(input.payload);
}

export function dynamicSlideTitle(input: DynamicExportInput) {
  return slideTitle(input);
}

export function dynamicSafeFileName(title: string) {
  const base = title.replace(/[<>:"/\\|?*]/g, "-").trim() || "OnePager";
  return `${base.slice(0, 80)}.pptx`;
}

export function recordDynamicExport(pagerId: string) {
  logPagerActivity({ pager_id: pagerId, action: "export" });
}

const SLIDE_W = 13.333;
const SLIDE_H = 7.5;
const HEADER_H = 0.7;
const MARGIN_X = 0.1;
const COL_GAP = 0.06;
const COL_COUNT = 5;
const IMAGE_H = 0.24;
const FONT_STEP = 0.5;
/** PowerPoint will not draw useful type below this. The loop stops here instead of cutting lines. */
const FONT_MIN = 1;

const PILLAR_THEME: Record<number, { bg: string; title: string }> = {
  1: { bg: "FFF7F6", title: "E73C43" },
  2: { bg: "FFF7FF", title: "E863E6" },
  3: { bg: "F4FCF9", title: "00C79D" },
  4: { bg: "FAFCF4", title: "A5BA02" },
  5: { bg: "FEFAF5", title: "EF9E22" },
};

const PRIORITY_COLOR: Record<string, string> = {
  P1: "FDE6D4",
  P2: "FFEDD5",
  P3: "FEF3C7",
};

type PlannedColumn = {
  descriptionFont: number;
  descriptionH: number;
  initiatives: Array<{
    initiative: NationalInitiativePayload;
    font: number;
    height: number;
  }>;
};

export type PlannedPillar = {
  pillarNumber: number;
  mode: "stack" | "thirds";
  initiatives: Array<{ number: number; font: number; height: number }>;
};

function lineSpacingPt(fontPt: number) {
  return Math.round(fontPt * 1.2 * 10) / 10;
}

function lineHeightIn(fontPt: number) {
  return lineSpacingPt(fontPt) / 72;
}

/** Average Arial character in a ~2.35" column. Short lines stay one line. */
function wrappedLineCount(text: string, fontPt: number) {
  const charW = (fontPt / 72) * 0.5;
  const cpl = Math.max(12, Math.floor(2.35 / charW));
  const parts = text.replace(/\r\n/g, "\n").split("\n");
  return parts.reduce(
    (sum, part) => sum + Math.max(1, Math.ceil(part.length / cpl)),
    0,
  );
}

function blockHeight(text: string, fontPt: number, labelLines: number) {
  return (labelLines + wrappedLineCount(text, fontPt)) * lineHeightIn(fontPt);
}

function imageUrls(initiative: NationalInitiativePayload) {
  const urls = initiative.image_signed_url?.length
    ? initiative.image_signed_url
    : (initiative.images ?? []);
  return urls.filter(Boolean).slice(0, MAX_INITIATIVE_IMAGES);
}

function hasText(value: string | undefined) {
  return Boolean(value?.trim());
}

function allSectionsPresent(initiative: NationalInitiativePayload) {
  return (
    hasText(initiative.guidelines) &&
    imageUrls(initiative).length > 0 &&
    hasText(initiative.checklist_compliance_notes)
  );
}

function pillarStartFont(initiatives: NationalInitiativePayload[]) {
  const allFilled =
    initiatives.length > 0 && initiatives.every(allSectionsPresent);
  return allFilled ? 7 : 8;
}

function stepDown(fontPt: number) {
  return Math.max(FONT_MIN, Math.round((fontPt - FONT_STEP) * 10) / 10);
}

/** Badge, initiative, success measure, then only the sections that have content. */
function measureInitiative(
  initiative: NationalInitiativePayload,
  fontPt: number,
) {
  const gap = 0.03;
  let height = 0.04 + 0.18 + 0.04;
  height += blockHeight(initiative.initiative_description || "—", fontPt, 1);
  height += gap + 0.14;
  if (hasText(initiative.guidelines)) {
    height += gap + blockHeight(initiative.guidelines, fontPt, 1);
  }
  if (imageUrls(initiative).length > 0) height += gap + IMAGE_H;
  if (hasText(initiative.checklist_compliance_notes)) {
    height +=
      gap + blockHeight(initiative.checklist_compliance_notes, fontPt, 0);
  }
  return height + 0.04;
}

function descriptionHeight(text: string, fontPt: number) {
  if (!hasText(text)) return 0;
  return blockHeight(text, fontPt, 0);
}

/**
 * Description size comes from the character buckets, so a long paragraph
 * starts smaller than 7 pt. Line breaks stay. Initiatives start under it.
 * Initiative font steps down first. Description steps down further only when
 * the initiatives are already at the floor and the column is still too short.
 */
function planColumn(pillar: NationalPillarPayload, contentH: number): PlannedColumn {
  const initiatives = [...pillar.initiatives]
    .sort((a, b) => a.initiative_number - b.initiative_number)
    .slice(0, 3);
  const text = pillar.pillar_description || "";
  const gap = 0.06;
  let descriptionFont = fontSizeForLength(text.length);
  const stackHeight = (size: number) =>
    initiatives.length === 0
      ? 0
      : initiatives.reduce(
          (sum, initiative) => sum + measureInitiative(initiative, size),
          0,
        ) +
        gap * (initiatives.length - 1);

  while (true) {
    const descriptionH = descriptionHeight(text, descriptionFont);
    const afterDescription = descriptionH > 0 ? gap : 0;
    const bodyH = contentH - descriptionH - afterDescription;
    let font = initiatives.length > 0 ? pillarStartFont(initiatives) : 7;
    while (stackHeight(font) > bodyH && font > FONT_MIN) {
      font = stepDown(font);
    }
    const fits = stackHeight(font) <= bodyH + 0.001;
    if (fits || descriptionFont <= FONT_MIN) {
      return {
        descriptionFont,
        descriptionH,
        initiatives: initiatives.map((initiative) => ({
          initiative,
          font,
          height: measureInitiative(initiative, font),
        })),
      };
    }
    descriptionFont = stepDown(descriptionFont);
  }
}

export function describeDynamicLayout(
  payload: NationalOnePagerCreatePayload,
): PlannedPillar[] {
  const colH = SLIDE_H - (HEADER_H + 0.08) - 0.08;
  return [...payload.pillars]
    .sort((a, b) => a.pillar_number - b.pillar_number)
    .slice(0, COL_COUNT)
    .map((pillar) => {
      const contentH = colH - (0.08 + 0.26 + 0.04) - 0.08;
      const planned = planColumn(pillar, contentH);
      return {
        pillarNumber: pillar.pillar_number,
        mode: "stack",
        initiatives: planned.initiatives.map((item) => ({
          number: item.initiative.initiative_number,
          font: item.font,
          height: Math.round(item.height * 100) / 100,
        })),
      };
    });
}

function textRuns(text: string, fontSize: number, color: string) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const spacing = lineSpacingPt(fontSize);
  return lines.map((line, index) => ({
    text: line.length > 0 ? line : " ",
    options: {
      fontSize,
      color,
      breakLine: index < lines.length - 1,
      lineSpacing: spacing,
      paraSpaceBefore: 0,
      paraSpaceAfter: 0,
    },
  }));
}

function addLabeledText(
  slide: Slide,
  label: string,
  value: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fontSize: number,
) {
  slide.addText(
    [
      {
        text: label,
        options: {
          bold: true,
          color: "0066CC",
          fontSize,
          breakLine: true,
          lineSpacing: lineSpacingPt(fontSize),
          paraSpaceBefore: 0,
          paraSpaceAfter: 0,
        },
      },
      ...textRuns(value, fontSize, "333333"),
    ],
    {
      x,
      y,
      w,
      h,
      fontFace: "Arial",
      valign: "top",
      margin: 0,
      paraSpaceBefore: 0,
      paraSpaceAfter: 0,
    },
  );
}

function addInitiativeContent(
  pptx: PptxGenJS,
  slide: Slide,
  initiative: NationalInitiativePayload,
  fontPt: number,
  x: number,
  y: number,
  w: number,
  limitY: number,
  images: Map<string, string>,
) {
  const pad = 0.04;
  const innerX = x + pad;
  const innerW = w - pad * 2;
  let cursor = y + pad;
  const textX = x + 0.01;
  const textW = w - 0.02;
  const room = () => limitY - cursor;

  const badge = 0.18;
  const priority = `P${initiative.initiative_number}` as "P1" | "P2" | "P3";
  const priorityColor = PRIORITY_COLOR[priority] ?? PRIORITY_COLOR.P1;
  if (room() < badge) return;

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
    color: "3D3D3D",
    bold: true,
    margin: 0,
  });

  const timeline = formatInitiativeTimeline(initiative);
  const timelineW = 1.45;
  const dept = initiative.accountable_function_department || "—";
  const deptMaxW = innerW - badge - 0.06 - (timeline ? timelineW + 0.06 : 0);
  const deptW = Math.min(0.9, Math.max(0.36, deptMaxW));
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

  if (timeline && deptMaxW > 0.2) {
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

  const placeText = (label: string, value: string, withLabel: boolean) => {
    const h = blockHeight(value, fontPt, withLabel ? 1 : 0);
    if (withLabel) {
      addLabeledText(slide, label, value, textX, cursor, textW, h, fontPt);
    } else {
      slide.addText(textRuns(value, fontPt, "555555"), {
        x: textX,
        y: cursor,
        w: textW,
        h,
        fontFace: "Arial",
        valign: "top",
        margin: 0,
        paraSpaceBefore: 0,
        paraSpaceAfter: 0,
      });
    }
    cursor += h;
  };

  placeText("Initiative", initiative.initiative_description || "—", true);
  slide.addText(
    [
      {
        text: "Success Measure: ",
        options: { bold: true, color: "0066CC", fontSize: 5.5 },
      },
      {
        text: formatSuccessTarget(initiative) || "—",
        options: { bold: true, color: "333333", fontSize: 5.5 },
      },
    ],
    {
      x: textX,
      y: cursor + 0.03,
      w: textW,
      h: 0.14,
      fontFace: "Arial",
      valign: "middle",
      margin: 0,
      wrap: false,
    },
  );
  cursor += 0.03 + 0.14;

  if (hasText(initiative.guidelines)) {
    cursor += 0.03;
    placeText("Guidelines", initiative.guidelines, true);
  }

  const urls = imageUrls(initiative);
  if (urls.length > 0) {
    cursor += 0.03;
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
          h: IMAGE_H,
          sizing: { type: "cover", w: imageW, h: IMAGE_H },
        });
      } else {
        slide.addShape(pptx.ShapeType.roundRect, {
          x: imgX,
          y: cursor,
          w: imageW,
          h: IMAGE_H,
          rectRadius: 0.03,
          fill: { color: "FFFFFF" },
          line: { color: "DDDDDD" },
        });
      }
    });
    cursor += IMAGE_H;
  }

  if (hasText(initiative.checklist_compliance_notes)) {
    cursor += 0.03;
    placeText("", initiative.checklist_compliance_notes, false);
  }
}

function addSeparator(
  pptx: PptxGenJS,
  slide: Slide,
  x: number,
  y: number,
  w: number,
) {
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h: 0.01,
    fill: { color: "D1D5DB" },
    line: { color: "D1D5DB" },
  });
}

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
  const icon = 0.26;
  const titleH = 0.18;
  const headerH = Math.max(icon, titleH);
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

  const weightW = showWeight ? 0.5 : 0;
  const titleX = x + pad + icon + 0.05;
  const titleW = w - pad * 2 - icon - 0.05 - weightW;
  const textY = y + pad + (headerH - titleH) / 2;
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

  const description = pillar.pillar_description || "";
  const contentTop = y + pad + icon + 0.04;
  const contentH = y + h - pad - contentTop;
  const planned = planColumn(pillar, contentH);
  if (planned.descriptionH > 0) {
    slide.addText(textRuns(description, planned.descriptionFont, "555555"), {
      x: x + pad,
      y: contentTop,
      w: w - pad * 2,
      h: planned.descriptionH,
      fontFace: "Arial",
      valign: "top",
      margin: 0,
      paraSpaceBefore: 0,
      paraSpaceAfter: 0,
    });
  }

  const bodyY =
    contentTop + planned.descriptionH + (planned.descriptionH > 0 ? 0.06 : 0);
  if (planned.initiatives.length === 0) return;

  const innerX = x + pad;
  const innerW = w - pad * 2;
  let cursor = bodyY;
  planned.initiatives.forEach((item, index) => {
    if (index > 0) {
      addSeparator(pptx, slide, innerX, cursor + 0.02, innerW);
      cursor += 0.06;
    }
    addInitiativeContent(
      pptx,
      slide,
      item.initiative,
      item.font,
      innerX,
      cursor,
      innerW,
      cursor + item.height,
      images,
    );
    cursor += item.height;
  });
}

async function urlToImageData(url: string): Promise<string | null> {
  if (url.startsWith("data:")) return url;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    const isSvg = blob.type.includes("svg") || url.toLowerCase().includes(".svg");
    if (!isSvg) {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read image."));
        reader.readAsDataURL(blob);
      });
    }
    const svgUrl = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.src = svgUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Could not draw icon."));
      });
      let width = 900;
      let height = 900;
      if (img.naturalWidth && img.naturalHeight) {
        const aspect = img.naturalWidth / img.naturalHeight;
        if (aspect >= 1) height = Math.round(900 / aspect);
        else width = Math.round(900 * aspect);
      }
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/png");
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  } catch {
    return null;
  }
}

async function loadImages(payload: DynamicPayload) {
  const urls = new Set<string>([
    perfectStoreLogo,
    unileverBrandLogo,
    ...Object.values(PILLAR_ICON_BY_NUMBER),
  ]);
  for (const pillar of payload.pillars) {
    for (const initiative of pillar.initiatives) {
      for (const url of imageUrls(initiative)) urls.add(url);
    }
  }
  const cache = new Map<string, string>();
  await Promise.all(
    Array.from(urls).map(async (url) => {
      const data = await urlToImageData(url);
      if (data) cache.set(url, data);
    }),
  );
  return cache;
}

function addHeader(
  pptx: PptxGenJS,
  slide: Slide,
  input: DynamicExportInput,
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

  const payload = input.payload;
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
    Math.min(maxSegW, Math.max(minSegW, segmentPadX * 2 + label.length * charW)),
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

  const titleX = logoInset + storeLogoW + 0.08;
  const titleW = Math.max(3.5, barX - titleX - 0.08);
  slide.addText(slideTitle(input), {
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

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function buildDynamicOnePagerPptBlob(input: DynamicExportInput) {
  const images = await loadImages(input.payload);
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = slideTitle(input);
  const slide = pptx.addSlide();
  slide.background = { color: "F5F5F5" };
  addHeader(pptx, slide, input, images);

  const colW = (SLIDE_W - MARGIN_X * 2 - COL_GAP * (COL_COUNT - 1)) / COL_COUNT;
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

  return (await pptx.write({ outputType: "blob" })) as Blob;
}

let exportBusy = false;

export async function exportDynamicOnePager(
  input: DynamicExportInput & { pagerId?: string },
) {
  if (exportBusy) return;
  exportBusy = true;
  try {
    const blob = await buildDynamicOnePagerPptBlob(input);
    triggerDownload(blob, dynamicSafeFileName(slideTitle(input)));
    if (input.pagerId) {
      recordDynamicExport(input.pagerId);
    }
  } finally {
    exportBusy = false;
  }
}

/** Local dummy page. Real Export uses exportDynamicOnePager, including the activity log. */
export async function exportDynamicOnePagerPpt(input: ExportOnePagerInput) {
  await exportDynamicOnePager(input);
}

export async function exportDynamicOnePagerById(pagerId: string) {
  const record = await getOnePagerById(pagerId);
  if (!record) {
    throw new Error("Could not load the one-pager.");
  }
  await exportDynamicOnePager({
    pagerType: record.pager_type,
    payload: record.payload,
    pagerId,
  });
}
