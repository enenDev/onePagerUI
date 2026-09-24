import { Archive, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type EditPublishedOnePagerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArchiveAndEdit: () => void;
  onKeepActiveAndEdit: () => void;
  busy?: boolean;
  error?: string | null;
};

/**
 * Shown when editing a published one-pager from Home / View / Preview.
 * Both paths open the form; Save Draft / Publish create a new record.
 */
export function EditPublishedOnePagerModal({
  open,
  onOpenChange,
  onArchiveAndEdit,
  onKeepActiveAndEdit,
  busy = false,
  error = null,
}: EditPublishedOnePagerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-4 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-6 font-semibold text-foreground">
            Edit One-Pager
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
          <span
            aria-hidden
            className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white"
          >
            i
          </span>
          <p>
            Editing this published One-Pager will create a{" "}
            <span className="font-semibold">new draft</span>. What would you
            like to do with the current published One-Pager?
          </p>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer rounded-lg border-primary text-primary hover:bg-accent hover:text-primary"
            onClick={onArchiveAndEdit}
            disabled={busy}
          >
            <Archive className="size-4" />
            Archive &amp; Edit
          </Button>
          <Button
            type="button"
            className="cursor-pointer rounded-lg bg-primary text-primary-foreground"
            onClick={onKeepActiveAndEdit}
            disabled={busy}
          >
            <Pencil className="size-4" />
            Keep Active &amp; Edit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
