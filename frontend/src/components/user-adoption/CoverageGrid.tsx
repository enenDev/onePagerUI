import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { PillTabs } from "@/components/user-adoption/PillTabs";
import type {
  CoverageMarketBlock,
  CoverageResponse,
} from "@/services/adoptionDashboardApi";

type CoverageGridProps = {
  data: CoverageResponse;
  loading: boolean;
};

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

  return (
    <section className="max-w-full overflow-hidden rounded-xl border border-border bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-700">
        {block.filled} out of {block.possible}
      </p>
      {block.unmapped_count > 0 ? (
        <p className="mt-1 text-sm text-slate-500">
          {unmappedLabel(block.unmapped_count)}
        </p>
      ) : null}
      <div className="mt-4 max-h-[calc(100vh-16rem)] w-full max-w-full overflow-auto">
        <table className="w-max border-separate border-spacing-0 text-left text-xs">
          <thead>
            <tr ref={headerRowRef}>
              <th
                className={`sticky top-0 left-0 z-30 border-t border-l bg-slate-50 ${cellBorder}`}
              />
              <th
                className={`sticky top-0 z-30 border-t bg-slate-50 ${cellBorder}`}
                style={{ left: channelWidth }}
              />
              {block.business_groups.map((group) => (
                <th
                  key={group.business_group}
                  colSpan={group.categories.length}
                  className={`sticky top-0 z-20 border-t bg-slate-50 px-2 py-1.5 text-center font-semibold whitespace-nowrap text-slate-700 ${cellBorder}`}
                >
                  {group.business_group}
                </th>
              ))}
            </tr>
            <tr>
              <th
                ref={channelHeaderRef}
                className={`sticky left-0 z-30 border-l bg-slate-50 px-2 py-1.5 font-semibold whitespace-nowrap text-slate-700 ${cellBorder}`}
                style={{ top: headerRowHeight }}
              >
                Channel
              </th>
              <th
                className={`sticky z-30 bg-slate-50 px-2 py-1.5 font-semibold whitespace-nowrap text-slate-700 ${cellBorder}`}
                style={{ left: channelWidth, top: headerRowHeight }}
              >
                National/Retailer
              </th>
              {block.business_groups.flatMap((group) =>
                group.categories.map((category) => (
                  <th
                    key={`${group.business_group}\u0000${category}`}
                    className={`sticky z-20 bg-white px-2 py-1.5 text-center font-medium whitespace-nowrap text-slate-600 ${cellBorder}`}
                    style={{ top: headerRowHeight }}
                  >
                    {category}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {block.channels.map((channel) =>
              channel.rows.map((row, rowIndex) => (
                <tr key={`${channel.channel}\u0000${row}`}>
                  {rowIndex === 0 ? (
                    <th
                      rowSpan={channel.rows.length}
                      className={`sticky left-0 z-10 border-l bg-white px-2 py-1.5 align-middle font-semibold whitespace-nowrap text-slate-800 ${cellBorder}`}
                    >
                      {channel.channel}
                    </th>
                  ) : null}
                  <th
                    className={`sticky z-10 bg-white px-2 py-1.5 font-medium whitespace-nowrap text-slate-700 ${cellBorder}`}
                    style={{ left: channelWidth }}
                  >
                    {row}
                  </th>
                  {block.business_groups.flatMap((group) =>
                    group.categories.map((category) => {
                      const green = filled.has(
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
                          className={
                            green
                              ? `h-7 bg-[#22a06b] ${cellBorder}`
                              : `h-7 bg-white ${cellBorder}`
                          }
                        />
                      );
                    }),
                  )}
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function CoverageGrid({ data, loading }: CoverageGridProps) {
  const [market, setMarket] = useState(data.by_market[0]?.market ?? "");

  useEffect(() => {
    if (!data.by_market.some((block) => block.market === market)) {
      setMarket(data.by_market[0]?.market ?? "");
    }
  }, [data.by_market, market]);

  if (loading) {
    return (
      <section className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="h-4 w-40 rounded bg-slate-100" />
        <div className="mt-4 h-28 rounded bg-slate-50" />
      </section>
    );
  }

  if (data.by_market.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold tracking-wide text-[#004f9e] uppercase">
          Published coverage
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          No coverage for the selected markets and dates.
        </p>
      </section>
    );
  }

  const selected =
    data.by_market.find((block) => block.market === market) ??
    data.by_market[0];

  return (
    <div className="grid min-w-0 gap-4">
      <PillTabs
        tabs={data.by_market.map((block) => ({
          id: block.market,
          label: block.market,
        }))}
        value={selected.market}
        onChange={setMarket}
      />
      <MarketGrid key={selected.market} block={selected} />
    </div>
  );
}
