import type { CoverageMarketBlock, CoverageResponse } from "@/services/adoptionDashboardApi";

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

function MarketGrid({ block }: { block: CoverageMarketBlock }) {
  const filled = new Set(
    block.filled_cells.map((cell) =>
      cellKey(cell.channel, cell.row, cell.business_group, cell.category),
    ),
  );

  return (
    <section className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold tracking-wide text-[#004f9e] uppercase">
        {block.market}
      </h2>
      <p className="mt-2 text-sm text-slate-700">
        {block.filled} out of {block.possible}
      </p>
      {block.unmapped_count > 0 ? (
        <p className="mt-1 text-sm text-slate-500">
          {unmappedLabel(block.unmapped_count)}
        </p>
      ) : null}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-xs">
          <thead>
            <tr>
              <th className="border border-slate-200 bg-slate-50 px-3 py-2" />
              <th className="border border-slate-200 bg-slate-50 px-3 py-2" />
              {block.business_groups.map((group) => (
                <th
                  key={group.business_group}
                  colSpan={group.categories.length}
                  className="border border-slate-200 bg-slate-50 px-3 py-2 text-center font-semibold text-slate-700"
                >
                  {group.business_group}
                </th>
              ))}
            </tr>
            <tr>
              <th className="border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-700">
                Channel
              </th>
              <th className="min-w-28 border border-slate-200 bg-slate-50 px-3 py-2" />
              {block.business_groups.flatMap((group) =>
                group.categories.map((category) => (
                  <th
                    key={`${group.business_group}\u0000${category}`}
                    className="min-w-28 border border-slate-200 bg-white px-3 py-2 text-center font-medium text-slate-600"
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
                      className="border border-slate-200 bg-white px-3 py-2 align-top font-semibold text-slate-800"
                    >
                      {channel.channel}
                    </th>
                  ) : null}
                  <th className="border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700">
                    {row}
                  </th>
                  {block.business_groups.flatMap((group) =>
                    group.categories.map((category) => {
                      const green = filled.has(
                        cellKey(channel.channel, row, group.business_group, category),
                      );
                      return (
                        <td
                          key={`${channel.channel}\u0000${row}\u0000${group.business_group}\u0000${category}`}
                          className={
                            green
                              ? "h-8 border border-slate-200 bg-[#22a06b]"
                              : "h-8 border border-slate-200 bg-white"
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

  return (
    <div className="grid gap-4">
      {data.by_market.map((block) => (
        <MarketGrid key={block.market} block={block} />
      ))}
    </div>
  );
}
