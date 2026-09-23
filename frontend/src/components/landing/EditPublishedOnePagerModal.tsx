import { Copy, Pencil } from "lucide-react";

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
  /** Open the existing record. Publish updates that same one-pager. */
  onEditAndReplace: () => void;
  /** Leave the published one-pager active and edit a new copy. */
  onCreateCopy: () => void;
};

/**
 * Shown when editing a published one-pager from Home / View / Track / Preview.
 */
export function EditPublishedOnePagerModal({
  open,
  onOpenChange,
  onEditAndReplace,
  onCreateCopy,
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
            <span className="font-semibold">Edit &amp; Replace</span> updates
            this published One-Pager.{" "}
            <span className="font-semibold">Create a copy</span> keeps it
            active and starts a new one.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer rounded-lg border-primary text-primary hover:bg-accent hover:text-primary"
            onClick={onEditAndReplace}
          >
            <Pencil className="size-4" />
            Edit &amp; Replace
          </Button>
          <Button
            type="button"
            className="cursor-pointer rounded-lg bg-primary text-primary-foreground"
            onClick={onCreateCopy}
          >
            <Copy className="size-4" />
            Create a copy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
