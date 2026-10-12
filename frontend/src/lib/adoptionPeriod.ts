import { displayToIso, isValidDisplayDate } from "@/lib/displayDate";

export type PeriodId =
  | "last7"
  | "last30"
  | "last3Months"
  | "last6Months"
  | "custom";

export type IsoDateRange = {
  start: string;
  end: string;
};

export const PERIOD_OPTIONS: { id: PeriodId; label: string }[] = [
  { id: "last7", label: "Last 7 days" },
  { id: "last30", label: "Last 30 days" },
  { id: "last3Months", label: "Last 3 months" },
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
    case "last3Months":
      return "(vs previous 3 months)";
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

/** Same calendar day shifted by `months`. 12 Oct − 3 months → 12 Jul. Clamps when that day does not exist (31 Mar − 1 month → 28 or 29 Feb). */
function addMonths(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  return new Date(
    target.getFullYear(),
    target.getMonth(),
    Math.min(date.getDate(), lastDay),
  );
}

/** Rolling window that ends today. Start is the same day `monthCount` months earlier. */
function rollingMonths(today: Date, monthCount: number): IsoDateRange {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return { start: formatIso(addMonths(end, -monthCount)), end: formatIso(end) };
}

/** Same month length immediately before `range`. 12 Jul–12 Oct → 12 Apr–11 Jul. */
function previousRollingMonths(
  range: IsoDateRange,
  monthCount: number,
): IsoDateRange {
  const currentStart = parseIso(range.start);
  return {
    start: formatIso(addMonths(currentStart, -monthCount)),
    end: formatIso(addDays(currentStart, -1)),
  };
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

  if (period === "last3Months") {
    const current = rollingMonths(today, 3);
    return { current, previous: previousRollingMonths(current, 3) };
  }

  const current = rollingMonths(today, 6);
  return { current, previous: previousRollingMonths(current, 6) };
}
