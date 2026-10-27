import { Save, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";

type FormActionBarProps = {
  onCancel?: () => void;
  onSaveDraft?: () => void;
  onPreviewPublish?: () => void;
  /** Dev-only sample fill. Omit in production UI. */
  onFillSample?: () => void;
  savingDraft?: boolean;
  publishing?: boolean;
  /** When false, Preview & Publish stays disabled. Save Draft is never gated by this. */
  canSubmit?: boolean;
  submitBlockedReason?: string | null;
};

export function FormActionBar({
  onCancel,
  onSaveDraft,
  onPreviewPublish,
  onFillSample,
  savingDraft = false,
  publishing = false,
  canSubmit = true,
  submitBlockedReason = null,
}: FormActionBarProps) {
  const busy = savingDraft || publishing;
  const previewDisabled = busy || !canSubmit;

  return (
    <div className="sticky bottom-0 z-30 w-full border-t border-border bg-white/95 backdrop-blur-sm">
      <PageContainer className="flex flex-col gap-2 py-3">
        {submitBlockedReason ? (
          <p className="text-left text-xs text-muted-foreground sm:text-right">
            {submitBlockedReason}
          </p>
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={busy}
              className="h-9 w-full cursor-pointer rounded-lg border-[#f0a8a0] px-5 text-[#e11d48] hover:bg-red-50 hover:text-[#e11d48] sm:w-auto"
            >
              Cancel
            </Button>
            {onFillSample ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onFillSample}
                disabled={busy}
                className="h-9 w-full cursor-pointer rounded-lg px-3 text-muted-foreground sm:w-auto"
              >
                Fill sample data
              </Button>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            {onSaveDraft ? (
              <Button
                type="button"
                variant="outline"
                onClick={onSaveDraft}
                disabled={busy}
                className="h-9 w-full cursor-pointer rounded-lg border-primary px-4 text-primary hover:bg-accent hover:text-primary sm:w-auto"
              >
                <Save className="size-4" />
                {savingDraft ? "Saving..." : "Save Draft"}
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={onPreviewPublish}
              disabled={previewDisabled}
              title={submitBlockedReason ?? undefined}
              className="h-9 w-full cursor-pointer rounded-lg bg-primary px-4 text-primary-foreground sm:w-auto"
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
