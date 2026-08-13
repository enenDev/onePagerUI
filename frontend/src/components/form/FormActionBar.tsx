import { Save, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";

type FormActionBarProps = {
  onCancel?: () => void;
  onSaveDraft?: () => void;
  onPreviewPublish?: () => void;
  savingDraft?: boolean;
  publishing?: boolean;
  /** When false, Save Draft + Preview & Publish stay disabled. */
  canSubmit?: boolean;
  submitBlockedReason?: string | null;
};

export function FormActionBar({
  onCancel,
  onSaveDraft,
  onPreviewPublish,
  savingDraft = false,
  publishing = false,
  canSubmit = true,
  submitBlockedReason = null,
}: FormActionBarProps) {
  const busy = savingDraft || publishing;
  const actionsDisabled = busy || !canSubmit;

  return (
    <div className="sticky bottom-0 z-30 w-full border-t border-border bg-white/95 backdrop-blur-sm">
      <PageContainer className="flex flex-col gap-2 py-3">
        {submitBlockedReason ? (
          <p className="text-right text-xs text-muted-foreground">
            {submitBlockedReason}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={busy}
            className="h-9 cursor-pointer rounded-lg border-[#f0a8a0] px-5 text-[#e11d48] hover:bg-red-50 hover:text-[#e11d48]"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onSaveDraft}
              disabled={actionsDisabled}
              title={submitBlockedReason ?? undefined}
              className="h-9 cursor-pointer rounded-lg border-primary px-4 text-primary hover:bg-accent hover:text-primary"
            >
              <Save className="size-4" />
              {savingDraft ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              type="button"
              onClick={onPreviewPublish}
              disabled={actionsDisabled}
              title={submitBlockedReason ?? undefined}
              className="h-9 cursor-pointer rounded-lg bg-primary px-4 text-primary-foreground"
            >
              <Send className="size-4" />
              {publishing ? "Publishing..." : "Preview & Publish"}
            </Button>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
