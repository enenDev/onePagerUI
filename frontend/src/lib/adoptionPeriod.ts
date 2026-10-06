import { displayToIso, isValidDisplayDate } from "@/lib/displayDate";

export type PeriodId =
  | "last7"
  | "last30"
  | "lastQuarter"
  | "last6Months"
  | "custom";

export type IsoDateRange = {
  start: string;
  end: string;
};

export const PERIOD_OPTIONS: { id: PeriodId; label: string }[] = [
  { id: "last7", label: "Last 7 days" },
  { id: "last30", label: "Last 30 days" },
  { id: "lastQuarter", label: "Last quarter" },
  { id: "last6Months", label: "Last 6 months" },
  { id: "custom", label: "Custom period" },
];

export const DEFAULT_PERIOD: PeriodId = "last30";

export function growthComparisonLabel(period: PeriodId): string {
  switch (period) {
    case "last7":
      return "(vs previous 7 days)";
    case "last30":
      return "(vs previous 30 days)";
    case "lastQuarter":
      return "(vs previous quarter)";
    case "last6Months":
      return "(vs previous 6 months)";
    case "custom":
      return "(vs previous period)";
  }
}

function formatIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIso(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

function daysInclusive(start: Date, end: Date): number {
  const utcStart = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((utcEnd - utcStart) / 86_400_000) + 1;
}

/** Rolling window that ends today and includes today. */
function rollingDays(today: Date, dayCount: number): IsoDateRange {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = addDays(end, -(dayCount - 1));
  return { start: formatIso(start), end: formatIso(end) };
}

function previousSameLength(range: IsoDateRange): IsoDateRange {
  const start = parseIso(range.start);
  const length = daysInclusive(start, parseIso(range.end));
  const end = addDays(start, -1);
  return { start: formatIso(addDays(end, -(length - 1))), end: formatIso(end) };
}

/** Previous finished calendar quarter. October 2026 → 1 Jul–30 Sep. */
function lastCalendarQuarter(today: Date): IsoDateRange {
  const currentQuarter = Math.floor(today.getMonth() / 3);
  let quarter = currentQuarter - 1;
  let year = today.getFullYear();
  if (quarter < 0) {
    quarter = 3;
    year -= 1;
  }
  const start = new Date(year, quarter * 3, 1);
  const end = new Date(year, quarter * 3 + 3, 0);
  return { start: formatIso(start), end: formatIso(end) };
}

function previousCalendarQuarter(range: IsoDateRange): IsoDateRange {
  const end = addDays(parseIso(range.start), -1);
  const start = new Date(end.getFullYear(), end.getMonth() - 2, 1);
  return { start: formatIso(start), end: formatIso(end) };
}

/** Six finished months before the current month. October 2026 → 1 Apr–30 Sep. */
function lastSixFullMonths(today: Date): IsoDateRange {
  const end = new Date(today.getFullYear(), today.getMonth(), 0);
  const start = new Date(end.getFullYear(), end.getMonth() - 5, 1);
  return { start: formatIso(start), end: formatIso(end) };
}

function previousSixFullMonths(range: IsoDateRange): IsoDateRange {
  const end = addDays(parseIso(range.start), -1);
  const start = new Date(end.getFullYear(), end.getMonth() - 5, 1);
  return { start: formatIso(start), end: formatIso(end) };
}

export function resolveDashboardRanges(
  period: PeriodId,
  today: Date,
  customStartDisplay: string,
  customEndDisplay: string,
): { current: IsoDateRange; previous: IsoDateRange } | null {
  if (period === "custom") {
    if (
      !isValidDisplayDate(customStartDisplay) ||
      !isValidDisplayDate(customEndDisplay)
    ) {
      return null;
    }
    const start = displayToIso(customStartDisplay);
    const end = displayToIso(customEndDisplay);
    if (end < start) return null;
    const current = { start, end };
    return { current, previous: previousSameLength(current) };
  }

  if (period === "last7") {
    const current = rollingDays(today, 7);
    return { current, previous: previousSameLength(current) };
  }

  if (period === "last30") {
    const current = rollingDays(today, 30);
    return { current, previous: previousSameLength(current) };
  }

  if (period === "lastQuarter") {
    const current = lastCalendarQuarter(today);
    return { current, previous: previousCalendarQuarter(current) };
  }

  const current = lastSixFullMonths(today);
  return { current, previous: previousSixFullMonths(current) };
}
