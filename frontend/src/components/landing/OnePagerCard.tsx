import { useState, type ReactNode } from "react";
import {
  Archive,
  MoreVertical,
  Pencil,
  RotateCcw,
  Share2,
  Target,
  Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { DeleteOnePagerModal } from "@/components/landing/DeleteOnePagerModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch } from "@/redux/hooks";
import { deleteOnePager } from "@/redux/landingSlice";
import {
  isCurrentUserOwner,
  type OnePagerListItem,
  type OnePagerStatus,
} from "@/types/onePager";

type OnePagerCardProps = {
  item: OnePagerListItem;
};

type CardMenuAction = "track" | "export" | "archive" | "restore" | "edit" | "delete";

function menuActionsForStatus(status: OnePagerStatus): CardMenuAction[] {
  if (status === "ACTIVE") {
    return ["track", "export", "archive", "edit", "delete"];
  }
  if (status === "DRAFT") {
    return ["edit", "delete"];
  }
  return ["export", "restore", "delete"];
}

export function OnePagerCard({ item }: OnePagerCardProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const scoringLabel =
    item.scoring_mode === "WEIGHTED" ? "Weighted" : "Unweighted";
  const canEdit = isCurrentUserOwner(item.created_by);
  const canDelete = canEdit;
  const viewPath = `/view/${item.pager_id}`;
  const actions = menuActionsForStatus(item.status);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await dispatch(deleteOnePager(item.pager_id)).unwrap();
      setDeleteOpen(false);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete one-pager",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article className="relative overflow-hidden rounded-xl border border-border bg-card-surface shadow-sm transition-shadow hover:shadow-md">
      <div className="absolute top-5 right-5 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="cursor-pointer rounded-full bg-brand-soft text-primary hover:bg-brand-soft-hover"
              aria-label="Card actions"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40 p-0">
            {actions.map((action, index) => (
              <CardMenuItem
                key={action}
                action={action}
                canEdit={canEdit}
                canDelete={canDelete}
                showSeparator={index < actions.length - 1}
                onEdit={() => {
                  if (!canEdit) return;
                  navigate(`/edit/${item.pager_id}`);
                }}
                onDelete={() => {
                  if (!canDelete) return;
                  setDeleteError(null);
                  setDeleteOpen(true);
                }}
              />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Link
        to={viewPath}
        className="block cursor-pointer text-inherit no-underline outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        aria-label={`Open ${item.title}`}
      >
        {/* Cover inset — grey card bg forms the border around it */}
        <div className="px-3 pt-3">
          <div className="relative h-36 overflow-hidden rounded-lg bg-white">
            {item.cover_image_url ? (
              <img
                src={item.cover_image_url}
                alt=""
                className="size-full object-cover"
              />
            ) : null}
          </div>
        </div>

        <div className="space-y-3 p-4 text-left">
          <h3 className="text-sm font-semibold text-foreground md:text-base">
            {item.title}
          </h3>
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {item.business_outcome_statement}
          </p>
          <Badge
            variant="secondary"
            className="rounded-full bg-brand-soft text-accent-foreground hover:bg-brand-soft"
          >
            {scoringLabel}
          </Badge>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">Published:</span>{" "}
              {item.published_at}
            </p>
            <p>
              <span className="font-semibold text-foreground">Owner:</span>{" "}
              {item.created_by}
            </p>
          </div>
        </div>
      </Link>

      <DeleteOnePagerModal
        open={deleteOpen}
        title={item.title}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        deleting={deleting}
        error={deleteError}
      />
    </article>
  );
}

function CardMenuItem({
  action,
  canEdit,
  canDelete,
  showSeparator,
  onEdit,
  onDelete,
}: {
  action: CardMenuAction;
  canEdit: boolean;
  canDelete: boolean;
  showSeparator: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const itemClassName = "cursor-pointer rounded-none px-3 py-2";

  let menuItem: ReactNode;

  switch (action) {
    case "track":
      menuItem = (
        <DropdownMenuItem
          className={itemClassName}
          onClick={() => {
            // TODO: Track is UI-only. Temporary: no navigation / API.
            // Next: open Track / scoring screen for this one-pager
            // (e.g. /track/:pager_id or GET/POST track endpoints).
            // Keep: menu label + Target icon, card ⋯ entry point.
          }}
        >
          <Target className="size-4" />
          Track
        </DropdownMenuItem>
      );
      break;
    case "export":
      menuItem = (
        <DropdownMenuItem
          className={itemClassName}
          onClick={() => {
            // TODO: Export is UI-only. Temporary: no download / API.
            // Next: FastAPI export (PDF/PPT) e.g. GET /api/one-pagers/:id/export
            // and trigger browser download / share flow.
            // Keep: menu label + Share2 icon, card ⋯ entry point.
          }}
        >
          <Share2 className="size-4" />
          Export
        </DropdownMenuItem>
      );
      break;
    case "archive":
      menuItem = (
        <DropdownMenuItem
          className={itemClassName}
          onClick={() => {
            // TODO: Archive is UI-only. Temporary: no status mutation.
            // Next: PATCH/POST to set status ARCHIVE (e.g.
            // POST /api/one-pagers/:id/archive), then refresh landing list /
            // optimistic update item.status.
            // Keep: menu label + Archive icon; only on ACTIVE cards.
          }}
        >
          <Archive className="size-4" />
          Archive
        </DropdownMenuItem>
      );
      break;
    case "restore":
      menuItem = (
        <DropdownMenuItem
          className={itemClassName}
          onClick={() => {
            // TODO: Restore is UI-only. Temporary: no status mutation.
            // Next: PATCH/POST to restore ARCHIVE → ACTIVE (e.g.
            // POST /api/one-pagers/:id/restore), then refresh landing list.
            // Keep: menu label + RotateCcw icon; only on ARCHIVE cards.
          }}
        >
          <RotateCcw className="size-4" />
          Restore
        </DropdownMenuItem>
      );
      break;
    case "edit":
      menuItem = (
        <DropdownMenuItem
          disabled={!canEdit}
          title={
            canEdit ? undefined : "Only the owner can edit this one-pager"
          }
          className={itemClassName}
          onClick={onEdit}
        >
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
      );
      break;
    case "delete":
      menuItem = (
        <DropdownMenuItem
          variant="destructive"
          disabled={!canDelete}
          title={
            canDelete
              ? undefined
              : "Only the owner can delete this one-pager"
          }
          className={itemClassName}
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      );
      break;
  }

  return (
    <>
      {menuItem}
      {showSeparator ? <DropdownMenuSeparator className="m-0" /> : null}
    </>
  );
}
