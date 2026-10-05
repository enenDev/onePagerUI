/**
 * TODO: Layout skeleton for /user-adoption. These boxes are not the metric
 * components. When the three metric API shapes are confirmed, fill this page
 * from counts (percentages calculated in React) and use Recharts for the
 * three rate-by-market charts. Market options come from the markets API.
 * Custom period reuses the shared form date field. Onboarding and adoption
 * are requested twice (current range and previous range); engagement once.
 * Keep this route behind RequireAnalyst. Do not add a back button.
 */
const SECTIONS = ["Onboarding", "Engagement", "Adoption"] as const;

const FUNNEL_STAGES = [
  "Onboarding to Adoption",
  "Stage 1 · Onboarding",
  "Stage 2 · Engagement",
  "Stage 3 · Adoption",
] as const;

export function UserAdoption() {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row">
          <FilterSlot label="Market" value="All live markets" />
          <FilterSlot label="Time Period" value="Last 30 Days" />
        </div>
        <div className="flex gap-2">
          <span className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground">
            Apply Filters
          </span>
          <span className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-sm font-medium text-foreground">
            Clear Filters
          </span>
        </div>
      </div>

      <section className="mt-6" aria-label="Adoption funnel">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground">
          ADOPTION FUNNEL
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          {FUNNEL_STAGES.map((stage) => (
            <div
              key={stage}
              className="flex h-24 items-center rounded-lg bg-primary/10 px-4 text-sm font-medium text-primary"
            >
              {stage}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {SECTIONS.map((section, index) => (
          <section
            key={section}
            className="rounded-lg border border-border p-4"
            aria-label={`Section ${index + 1} ${section}`}
          >
            <h2 className="text-sm font-semibold text-foreground">
              <span className="mr-2 text-xs font-medium tracking-wide text-muted-foreground">
                SECTION {index + 1}
              </span>
              {section}
            </h2>
            <div className="mt-4 h-40 rounded-md bg-muted" />
            <div className="mt-4 space-y-3">
              <div className="h-10 rounded-md bg-muted/70" />
              <div className="h-10 rounded-md bg-muted/70" />
              <div className="h-10 rounded-md bg-muted/70" />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function FilterSlot({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-52">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex h-8 items-center rounded-lg border border-border bg-white px-3 text-sm text-foreground">
        {value}
      </div>
    </div>
  );
}
