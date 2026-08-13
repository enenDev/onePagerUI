import { Info, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type UnsavedChangesModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
  onSaveDraft: () => void;
};

export function UnsavedChangesModal({
  open,
  onOpenChange,
  onDiscard,
  onSaveDraft,
}: UnsavedChangesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>You have unsaved changes</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            You have unsaved changes. Your progress might be lost. Save your
            progress to drafts to access it later.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer rounded-full border-primary text-primary hover:bg-accent hover:text-primary"
            onClick={onDiscard}
          >
            Discard Changes
          </Button>
          <Button
            type="button"
            className="cursor-pointer rounded-full"
            onClick={onSaveDraft}
          >
            <Save className="size-4" />
            Save Draft
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
