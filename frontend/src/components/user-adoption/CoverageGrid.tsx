import { useLayoutEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

import {
  formatCount,
  isMetricNumber,
} from "@/components/user-adoption/formatMetric";
import { PillTabs } from "@/components/user-adoption/PillTabs";
import type {
  CoverageMarketBlock,
  CoverageResponse,
  MetricValue,
} from "@/services/adoptionDashboardApi";

type CoverageGridProps = {
  data: CoverageResponse;
  loading: boolean;
  /** Market dropdown order. Tabs follow this list. */
  marketOrder: string[];
  /** Adopted Users from the Adoption card. CSP and CBD stay on the filter, not the market pill. */
  adoptedUsers: MetricValue;
};

function roleCount(adoptedUsers: MetricValue, role: "CSP" | "CBD") {
  const count = adoptedUsers.by_role[role];
  return isMetricNumber(count) ? formatCount(count) : "—";
}

function categoryCoverage(block: CoverageMarketBlock) {
  const columns = new Set<string>();
  for (const group of block.business_groups) {
    for (const category of group.categories) {
      columns.add(`${group.business_group}\u0000${category}`);
    }
  }
  const published = new Set<string>();
  for (const cell of block.filled_cells) {
    const key = `${cell.business_group}\u0000${cell.category}`;
    if (columns.has(key)) published.add(key);
  }
  return { published: published.size, total: columns.size };
}

function marketsInDropdownOrder(
  blocks: CoverageMarketBlock[],
  marketOrder: string[],
) {
  if (marketOrder.length === 0) return blocks;
  const rank = new Map(marketOrder.map((name, index) => [name, index]));
  return [...blocks].sort((left, right) => {
    const leftRank = rank.get(left.market);
    const rightRank = rank.get(right.market);
    if (leftRank === undefined && rightRank === undefined) return 0;
    if (leftRank === undefined) return 1;
    if (rightRank === undefined) return -1;
    return leftRank - rightRank;
  });
}

function cellKey(
  channel: string,
  row: string,
  businessGroup: string,
  category: string,
) {
  return `${channel}\u0000${row}\u0000${businessGroup}\u0000${category}`;
}

function unmappedLabel(count: number) {
  if (count === 1) return "1 published one-pager is not on this grid.";
  return `${count} published one-pagers are not on this grid.`;
}

const cellBorder = "border-r border-b border-slate-200";
const labelHeaderColor = "#004f9e";
const nationalTickColor = "#004f9e";
const retailerTickColor = "#ec4b00";
const stripeColor = "#ebebeb";
const groupHeaderColor: Record<string, string> = {
  "beauty & wellbeing": "#8652df",
  "personal care": "var(--primary)",
  "home care": "#119511",
  foods: "#ec4b00",
};

function headerColor(businessGroup: string) {
  return groupHeaderColor[businessGroup.trim().toLowerCase()];
}

function MarketGrid({ block }: { block: CoverageMarketBlock }) {
  const channelHeaderRef = useRef<HTMLTableCellElement>(null);
  const headerRowRef = useRef<HTMLTableRowElement>(null);
  const [channelWidth, setChannelWidth] = useState(0);
  const [headerRowHeight, setHeaderRowHeight] = useState(0);

  const filled = new Set(
    block.filled_cells.map((cell) =>
      cellKey(cell.channel, cell.row, cell.business_group, cell.category),
    ),
  );

  useLayoutEffect(() => {
    const measure = () => {
      setChannelWidth(channelHeaderRef.current?.offsetWidth ?? 0);
      setHeaderRowHeight(headerRowRef.current?.offsetHeight ?? 0);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (channelHeaderRef.current) observer.observe(channelHeaderRef.current);
    if (headerRowRef.current) observer.observe(headerRowRef.current);
    return () => observer.disconnect();
  }, [block]);

  const bodyRows = block.channels.flatMap((channel) =>
    channel.rows.map((row, rowIndex) => ({ channel, row, rowIndex })),
  );
  const coverage = categoryCoverage(block);

  return (
    <section className="max-w-full overflow-hidden rounded-xl border border-border bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-700">
        Total no. of published One-Pagers: {formatCount(block.published_count)}
      </p>
      <p className="mt-1 text-sm text-slate-700">
        BU Coverage (categories): {formatCount(coverage.published)} vs{" "}
        {formatCount(coverage.total)}
      </p>
      {block.unmapped_count > 0 ? (
        <p className="mt-1 text-sm text-slate-500">
          {unmappedLabel(block.unmapped_count)}
        </p>
      ) : null}
      <div className="mt-4 max-h-[calc(100vh-16rem)] w-full max-w-full overflow-auto">
        <table className="w-full border-separate border-spacing-0 text-left text-xs">
          <thead>
            <tr ref={headerRowRef}>
              <th
                className={`sticky top-0 left-0 z-30 border-t border-l text-white ${cellBorder}`}
                style={{ backgroundColor: labelHeaderColor }}
              />
              <th
                className={`sticky top-0 z-30 border-t text-white ${cellBorder}`}
                style={{ left: channelWidth, backgroundColor: labelHeaderColor }}
              />
              {block.business_groups.map((group) => {
                const color = headerColor(group.business_group);
                return (
                  <th
                    key={group.business_group}
                    colSpan={group.categories.length}
                    className={`sticky top-0 z-20 border-t px-2 py-1 text-center font-semibold whitespace-nowrap ${color ? "text-white" : "text-slate-700"} ${cellBorder}`}
                    style={{ backgroundColor: color ?? "#f8fafc" }}
                  >
                    {group.business_group}
                  </th>
                );
              })}
            </tr>
            <tr>
              <th
                ref={channelHeaderRef}
                className={`sticky left-0 z-30 border-l px-2 py-1 font-semibold whitespace-nowrap text-white ${cellBorder}`}
                style={{ top: headerRowHeight, backgroundColor: labelHeaderColor }}
              >
                Channel
              </th>
              <th
                className={`sticky z-30 px-2 py-1 font-semibold whitespace-nowrap text-white ${cellBorder}`}
                style={{
                  left: channelWidth,
                  top: headerRowHeight,
                  backgroundColor: labelHeaderColor,
                }}
              >
                National/Retailer
              </th>
              {block.business_groups.flatMap((group) =>
                group.categories.map((category) => (
                  <th
                    key={`${group.business_group}\u0000${category}`}
                    className={`sticky z-20 bg-[#e0e0e0] px-2 py-1 text-center font-medium whitespace-nowrap text-slate-800 ${cellBorder}`}
                    style={{ top: headerRowHeight }}
                  >
                    {category}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map(({ channel, row, rowIndex }, index) => {
              const rowColor = index % 2 === 1 ? stripeColor : "#ffffff";
              return (
                <tr key={`${channel.channel}\u0000${row}`}>
                  {rowIndex === 0 ? (
                    <th
                      rowSpan={channel.rows.length}
                      className={`sticky left-0 z-10 border-l bg-white px-2 py-1 align-middle font-semibold whitespace-nowrap text-slate-800 ${cellBorder}`}
                    >
                      {channel.channel}
                    </th>
                  ) : null}
                  <th
                    className={`sticky z-10 px-2 py-1 font-medium whitespace-nowrap text-slate-700 ${cellBorder}`}
                    style={{ left: channelWidth, backgroundColor: rowColor }}
                  >
                    {row}
                  </th>
                  {block.business_groups.flatMap((group) =>
                    group.categories.map((category) => {
                      const published = filled.has(
                        cellKey(
                          channel.channel,
                          row,
                          group.business_group,
                          category,
                        ),
                      );
                      return (
                        <td
                          key={`${channel.channel}\u0000${row}\u0000${group.business_group}\u0000${category}`}
                          className={`h-6 text-center align-middle ${cellBorder}`}
                          style={{ backgroundColor: rowColor }}
                        >
                          {published ? (
                            <Check
                              className="mx-auto size-3.5"
                              style={{
                                color:
                                  row.trim().toLowerCase() === "national"
                                    ? nationalTickColor
                                    : retailerTickColor,
                              }}
                              strokeWidth={3}
                              aria-label={
                                row.trim().toLowerCase() === "national"
                                  ? "Channel-level one-pager"
                                  : "Retailer+channel level one-pager"
                              }
                            />
                          ) : null}
                        </td>
                      );
                    }),
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function CoverageGrid({
  data,
  loading,
  marketOrder,
  adoptedUsers,
}: CoverageGridProps) {
  const [market, setMarket] = useState("");
  const blocks = marketsInDropdownOrder(data.by_market, marketOrder);
  const selected =
    blocks.find((block) => block.market === market) ?? blocks[0];

  return (
    <div className="grid min-w-0 gap-4">
      <div className="grid items-center gap-x-4 gap-y-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="flex flex-wrap items-center gap-2 sm:justify-self-start">
          <span className="inline-flex items-center rounded-md bg-[#f5f5f5] px-2 py-0.5 text-sm text-slate-700">
            CSP: {roleCount(adoptedUsers, "CSP")}
          </span>
          <span className="inline-flex items-center rounded-md bg-[#e8e8e8] px-2 py-0.5 text-sm text-slate-700">
            CBD: {roleCount(adoptedUsers, "CBD")}
          </span>
        </div>
        {loading || blocks.length === 0 || !selected ? (
          <span className="hidden sm:block" />
        ) : (
          <PillTabs
            tabs={blocks.map((block) => ({
              id: block.market,
              label: block.market,
            }))}
            value={selected.market}
            onChange={setMarket}
          />
        )}
        <ul className="space-y-0.5 text-sm text-slate-700 sm:justify-self-end">
          <li className="flex items-center gap-1.5">
            <Check
              className="size-3.5 shrink-0"
              style={{ color: nationalTickColor }}
              strokeWidth={3}
              aria-hidden
            />
            Channel-level one-pager
          </li>
          <li className="flex items-center gap-1.5">
            <Check
              className="size-3.5 shrink-0"
              style={{ color: retailerTickColor }}
              strokeWidth={3}
              aria-hidden
            />
            Retailer+channel level one-pager
          </li>
          <li className="flex items-center gap-1.5">
            <span className="inline-block size-3.5 shrink-0" aria-hidden />
            Blank: No coverage indicated
          </li>
        </ul>
      </div>
      {loading ? (
        <section className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="h-4 w-40 rounded bg-slate-100" />
          <div className="mt-4 h-28 rounded bg-slate-50" />
        </section>
      ) : blocks.length === 0 || !selected ? (
        <section className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold tracking-wide text-[#004f9e] uppercase">
            Published coverage
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            No coverage for the selected markets and dates.
          </p>
        </section>
      ) : (
        <MarketGrid key={selected.market} block={selected} />
      )}
    </div>
  );
}
