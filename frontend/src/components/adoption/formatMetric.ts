import type {
  DashboardRole,
  RoleBreakdown,
} from "@/services/adoptionDashboardApi";

export const NO_METRIC_DATA = "No data for this metric yet";

export function isMetricNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatSignedPercent(value: number): string {
  if (value > 0) return `+${formatPercent(value)}`;
  return formatPercent(value);
}

export function formatRoleLine(
  byRole: RoleBreakdown | undefined,
  roles: DashboardRole[],
  format: (value: number) => string,
): string | null {
  const parts: string[] = [];
  for (const role of roles) {
    const value = byRole?.[role];
    if (!isMetricNumber(value)) continue;
    parts.push(`${role}: ${format(value)}`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}
