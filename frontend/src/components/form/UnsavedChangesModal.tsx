import { FileDown, Info } from "lucide-react";

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
  saving?: boolean;
  canSaveDraft?: boolean;
  saveBlockedReason?: string | null;
};

export function UnsavedChangesModal({
  open,
  onOpenChange,
  onDiscard,
  onSaveDraft,
  saving = false,
  canSaveDraft = true,
  saveBlockedReason = null,
}: UnsavedChangesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-4 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-6 font-semibold text-foreground">
            You have unsaved changes
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
          <Info className="mt-0.5 size-4 shrink-0 text-amber-700" />
          <p>
            You have unsaved changes. Your progress might be lost. Save your
            progress to drafts to access it later.
          </p>
        </div>

        {saveBlockedReason ? (
          <p className="text-sm text-destructive">{saveBlockedReason}</p>
        ) : null}

        <div className="flex items-center justify-between gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer rounded-full border-primary text-primary hover:bg-accent hover:text-primary"
            onClick={onDiscard}
            disabled={saving}
          >
            Discard Changes
          </Button>
          <Button
            type="button"
            className="cursor-pointer rounded-full"
            onClick={onSaveDraft}
            disabled={saving || !canSaveDraft}
            title={saveBlockedReason ?? undefined}
          >
            <FileDown className="size-4" />
            {saving ? "Saving..." : "Save Draft"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
