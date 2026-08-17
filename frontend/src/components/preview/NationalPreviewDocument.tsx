import {
  Archive,
  Info,
  MoreVertical,
  Pencil,
  Share2,
  Target,
  Trash2,
} from "lucide-react";

import {
  formatPreviewDateRange,
  formatSuccessTarget,
} from "@/components/preview/nationalPreview";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NationalInitiativePayload } from "@/services/createFormApi";
import type { RetailerOnePagerCreatePayload } from "@/services/retailerCreateFormApi";
import type { OnePagerStatus } from "@/types/onePager";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<
  OnePagerStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Active",
    className:
      "bg-preview-active text-preview-priority-fg hover:bg-preview-active",
  },
  DRAFT: {
    label: "Draft",
    className: "bg-slate-200 text-slate-800 hover:bg-slate-200",
  },
  ARCHIVE: {
    label: "Archive",
    className: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  },
};

const PILLAR_THEME: Record<number, { card: string; title: string }> = {
  1: { card: "bg-preview-pillar-1", title: "text-preview-pillar-1-title" },
  2: { card: "bg-preview-pillar-2", title: "text-preview-pillar-2-title" },
  3: { card: "bg-preview-pillar-3", title: "text-preview-pillar-3-title" },
  4: { card: "bg-preview-pillar-4", title: "text-preview-pillar-4-title" },
  5: { card: "bg-preview-pillar-5", title: "text-preview-pillar-5-title" },
};

const PRIORITY_CLASS: Record<string, string> = {
  P1: "bg-preview-priority-p1 text-preview-priority-fg",
  P2: "bg-preview-priority-p2 text-preview-priority-fg",
  P3: "bg-preview-priority-p3 text-preview-priority-fg",
};

/** National payload shape, or retailer payload (includes target_retailer). */
type PreviewDocumentPayload = Omit<
  RetailerOnePagerCreatePayload,
  "target_retailer"
> & {
  target_retailer?: string;
};

type NationalPreviewDocumentProps = {
  payload: PreviewDocumentPayload;
  owner: string;
  publishedAt: string;
  onEdit: () => void;
  /** Track/Export/Archive/Edit/Delete — off in create Preview, on after publish. */
  moreOptionsEnabled?: boolean;
  /** Edit stays visible for non-owners but is disabled. */
  canEdit?: boolean;
  /** Landing / GET list status. Create-publish preview stays Active. */
  status?: OnePagerStatus;
};

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-4 first:pl-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">
        {value || "—"}
      </p>
    </div>
  );
}

function PreviewSection({
  label,
  children,
}: {
  label: string;
  children: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-primary">{label}</p>
      <p className="text-sm leading-snug text-foreground/90">
        {children || "—"}
      </p>
    </div>
  );
}

function InitiativeBlock({
  initiative,
}: {
  initiative: NationalInitiativePayload;
}) {
  const dateLabel = formatPreviewDateRange(
    initiative.week_start,
    initiative.week_end,
  );
  const images = initiative.images.filter((image) => image.blob_url);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex max-w-full flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "shrink-0 rounded-preview-badge px-1.5 py-0.5 text-xs font-semibold",
            PRIORITY_CLASS[initiative.priority_level] ?? PRIORITY_CLASS.P1,
          )}
        >
          {initiative.priority_level}
        </span>
        <span className="inline-flex max-w-full truncate rounded-preview-badge bg-preview-dept px-1.5 py-0.5 text-xs font-medium text-preview-priority-fg">
          {initiative.accountable_function_department || "—"}
        </span>
      </div>

      <PreviewSection label="Initiative">
        {initiative.initiative_description}
      </PreviewSection>
      <PreviewSection label="Success Target">
        {formatSuccessTarget(initiative)}
      </PreviewSection>
      <PreviewSection label="Guidelines">
        {initiative.guidelines}
      </PreviewSection>

      {dateLabel ? (
        <span className="inline-flex w-fit rounded-full bg-preview-date px-2.5 py-0.5 text-xs font-medium text-preview-date-fg">
          {dateLabel}
        </span>
      ) : null}

      {images.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">
            Photo Blueprint
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {images.slice(0, 3).map((image) => (
              <img
                key={image.id ?? image.blob_url}
                src={image.blob_url}
                alt={image.name || "Initiative photo"}
                className="h-14 w-full rounded-md object-cover"
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function NationalPreviewDocument({
  payload,
  owner,
  publishedAt,
  onEdit,
  moreOptionsEnabled = false,
  canEdit = true,
  status = "ACTIVE",
}: NationalPreviewDocumentProps) {
  const statusBadge = STATUS_BADGE[status];
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <dl
            className={cn(
              "grid grid-cols-2 divide-x divide-border",
              payload.target_retailer ? "sm:grid-cols-5" : "sm:grid-cols-4",
            )}
          >
            {payload.target_retailer ? (
              <PreviewField
                label="Target Retailer"
                value={payload.target_retailer}
              />
            ) : null}
            <PreviewField label="Channel" value={payload.channel} />
            <PreviewField label="Category" value={payload.category} />
            <PreviewField label="Campaign Focus" value={payload.campaign} />
            <PreviewField label="Market / Geography" value={payload.market} />
          </dl>
          <p className="mt-4 text-sm leading-relaxed text-foreground/85">
            {payload.business_outcome_statement || "—"}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
          {moreOptionsEnabled ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-foreground hover:text-primary"
                >
                  More Options
                  <MoreVertical className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40 p-0">
                {/* TODO: Wire Track to a tracking screen/API. Keep menu labels + toast UX when adding. */}
                <DropdownMenuItem className="cursor-pointer rounded-none px-3 py-2">
                  <Target className="size-4" />
                  Track
                </DropdownMenuItem>
                <DropdownMenuSeparator className="m-0" />
                {/* TODO: Wire Export to file/PDF generation. Keep this menu item. */}
                <DropdownMenuItem className="cursor-pointer rounded-none px-3 py-2">
                  <Share2 className="size-4" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuSeparator className="m-0" />
                {/* TODO: Wire Archive to FastAPI status change. Keep menu item + confirmation if product adds one. */}
                <DropdownMenuItem className="cursor-pointer rounded-none px-3 py-2">
                  <Archive className="size-4" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator className="m-0" />
                <DropdownMenuItem
                  disabled={!canEdit}
                  title={
                    canEdit
                      ? undefined
                      : "Only the owner can edit this one-pager"
                  }
                  className="cursor-pointer rounded-none px-3 py-2"
                  onClick={onEdit}
                >
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator className="m-0" />
                {/* TODO: Wire Delete to FastAPI delete + homepage refresh. Keep destructive styling. */}
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer rounded-none px-3 py-2"
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex cursor-not-allowed items-center gap-1 text-sm font-medium text-muted-foreground opacity-50"
            >
              More Options
              <MoreVertical className="size-4" />
            </span>
          )}

          <Badge
            className={cn(
              "mt-1 rounded-full px-2.5",
              statusBadge.className,
            )}
          >
            {statusBadge.label}
          </Badge>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Published:</span>{" "}
            {publishedAt}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Owner:</span>{" "}
            {owner}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {payload.pillars.some((pillar) => pillar.initiatives.length === 0) ? (
          <div className="flex items-center gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-3 text-medium font-medium text-amber-950">
            <Info className="mt-0.5 size-4 shrink-0 text-amber-700" />
            <p>You haven't added an initiative to every pillar</p>
          </div>
        ) : null}
        <h2 className="text-sm font-semibold text-foreground">
          Five Category Execution Pillars & Directives
        </h2>

        <div className="overflow-x-auto p-1.5">
          <div className="grid min-w-[72rem] grid-cols-5 gap-3">
            {payload.pillars.map((pillar) => {
              const targetCount = pillar.initiatives.length;
              const theme =
                PILLAR_THEME[pillar.pillar_number] ?? PILLAR_THEME[1];

              return (
                <article
                  key={pillar.pillar_number}
                  className={cn(
                    "flex flex-col gap-4 rounded-preview-card p-4 shadow-preview-card",
                    theme.card,
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-preview-pillar-label">
                      Pillar {pillar.pillar_number}
                    </p>
                    <span className="inline-flex rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {targetCount} {targetCount === 1 ? "Target" : "Targets"}
                    </span>
                  </div>

                  <h3
                    className={cn(
                      "text-[14px] font-bold leading-snug",
                      theme.title,
                    )}
                  >
                    {pillar.pillar_name}
                  </h3>

                  {pillar.initiatives.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {pillar.initiatives.map((initiative, index) => (
                        <div
                          key={`${pillar.pillar_number}-${initiative.initiative_number}`}
                          className={cn(
                            index > 0
                              ? "border-t border-preview-divider pt-4"
                              : "",
                          )}
                        >
                          <InitiativeBlock initiative={initiative} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No initiative added.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
