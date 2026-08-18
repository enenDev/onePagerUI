import type { NationalOnePagerCreatePayload } from "@/services/createFormApi";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function ordinal(day: number) {
  const remainder = day % 100;
  if (remainder >= 11 && remainder <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MDY_DATE = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/(\d{4})$/;

/** Parse ISO `yyyy-mm-dd` or display `mm/dd/yyyy` into a local calendar date. */
function parsePreviewDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let year: number;
  let month: number;
  let day: number;

  const iso = ISO_DATE.exec(trimmed);
  if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else {
    const mdy = MDY_DATE.exec(trimmed);
    if (!mdy) return null;
    month = Number(mdy[1]);
    day = Number(mdy[2]);
    year = Number(mdy[3]);
  }

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function formatMonthDay(value: string) {
  if (!value) return "";
  const date = parsePreviewDate(value);
  if (!date) return value;
  return `${MONTHS[date.getMonth()]} ${ordinal(date.getDate())}`;
}

export function composeNationalPreviewTitle(
  payload: Pick<
    NationalOnePagerCreatePayload,
    "channel" | "category" | "campaign" | "market"
  >,
) {
  return ["National", payload.channel, payload.category, payload.campaign, payload.market]
    .map((part) => part.trim())
    .filter(Boolean)
    .join("-");
}

/** Retailer preview header title — includes Target Retailer. */
export function composeRetailerPreviewTitle(payload: {
  target_retailer: string;
  channel: string;
  category: string;
  campaign: string;
  market: string;
}) {
  return [
    "Retailer",
    payload.target_retailer,
    payload.channel,
    payload.category,
    payload.campaign,
    payload.market,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join("-");
}

export function formatPreviewDateRange(start: string, end: string) {
  const from = formatMonthDay(start);
  const to = formatMonthDay(end);
  if (from && to) return `${from} – ${to}`;
  return from || to;
}

export function formatPublishedAt(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

export function formatSuccessTarget(initiative: {
  success_target: string;
  unit: string;
  kpi_metric: string;
}) {
  const value = `${initiative.success_target}${initiative.unit}`.trim();
  if (initiative.kpi_metric) {
    return value ? `${value} (${initiative.kpi_metric})` : initiative.kpi_metric;
  }
  return value || "—";
}
