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
  PillarBoard,
  type PillarBoardTrack,
} from "@/components/preview/PillarBoard";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RetailerOnePagerCreatePayload } from "@/services/retailerCreateFormApi";
import type { OnePagerStatus } from "@/types/onePager";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<
  OnePagerStatus,
  { label: string; className: string }
> = {
  PUBLISHED: {
    label: "Active",
    className:
      "bg-preview-active text-preview-priority-fg hover:bg-preview-active",
  },
  DRAFT: {
    label: "Draft",
    className: "bg-slate-200 text-slate-800 hover:bg-slate-200",
  },
  ARCHIVED: {
    label: "Archive",
    className: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  },
  DELETED: {
    label: "Deleted",
    className: "bg-rose-100 text-rose-800 hover:bg-rose-100",
  },
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
  onEdit?: () => void;
  /** Opens /track/:id. Omit on drafts, archive, and pre-publish preview. */
  onTrack?: () => void;
  /** Opens delete confirm; only called when canDelete is true. */
  onDelete?: () => void;
  /** Track/Export/Archive/Edit/Delete — off in create Preview, on after publish. */
  moreOptionsEnabled?: boolean;
  /** Hide More Options entirely (Track page). Status badge + date still use moreOptionsEnabled. */
  hideMoreOptions?: boolean;
  /** Edit stays visible for non-owners but is disabled. */
  canEdit?: boolean;
  /** Delete stays visible for non-owners but is disabled. */
  canDelete?: boolean;
  /** Landing / GET list status. Create-publish preview stays Active. */
  status?: OnePagerStatus;
  /** When set, pillar board shows owner-gated RAG dots (Track page). */
  track?: PillarBoardTrack;
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

export function NationalPreviewDocument({
  payload,
  owner,
  publishedAt,
  onEdit,
  onTrack,
  onDelete,
  moreOptionsEnabled = false,
  hideMoreOptions = false,
  canEdit = true,
  canDelete = true,
  status = "PUBLISHED",
  track,
}: NationalPreviewDocumentProps) {
  const statusBadge = moreOptionsEnabled
    ? STATUS_BADGE[status]
    : {
        label: "STATUS",
        className: "bg-slate-200 text-slate-600 hover:bg-slate-200",
      };
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
          {hideMoreOptions ? null : moreOptionsEnabled ? (
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
                {onTrack ? (
                  <>
                    <DropdownMenuItem
                      className="cursor-pointer rounded-none px-3 py-2"
                      onClick={onTrack}
                    >
                      <Target className="size-4" />
                      Track
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="m-0" />
                  </>
                ) : null}
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
                {/* TODO: Real FastAPI DELETE is dispatched by parents via onDelete.
                    Keep destructive styling + owner-disabled behavior. */}
                <DropdownMenuItem
                  variant="destructive"
                  disabled={!canDelete}
                  title={
                    canDelete
                      ? undefined
                      : "Only the owner can delete this one-pager"
                  }
                  className="cursor-pointer rounded-none px-3 py-2"
                  onClick={() => {
                    if (!canDelete) return;
                    onDelete?.();
                  }}
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
              "rounded-full px-2.5",
              !hideMoreOptions && "mt-1",
              statusBadge.className,
            )}
          >
            {statusBadge.label}
          </Badge>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Published:</span>{" "}
            {moreOptionsEnabled ? publishedAt : "DD MMM YYYY, HH:MM"}
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

        <PillarBoard pillars={payload.pillars} track={track} />
      </div>
    </div>
  );
}
