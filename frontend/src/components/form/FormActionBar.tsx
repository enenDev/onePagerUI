import { Save, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";

type FormActionBarProps = {
  onCancel?: () => void;
  onSaveDraft?: () => void;
  onPreviewPublish?: () => void;
};

export function FormActionBar({
  onCancel,
  onSaveDraft,
  onPreviewPublish,
}: FormActionBarProps) {
  return (
    <div className="sticky bottom-0 z-30 w-full border-t border-border bg-white/95 backdrop-blur-sm">
      <PageContainer className="flex items-center justify-between gap-4 py-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-9 cursor-pointer rounded-lg border-[#f0a8a0] px-5 text-[#e11d48] hover:bg-red-50 hover:text-[#e11d48]"
        >
          Cancel
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSaveDraft}
            className="h-9 cursor-pointer rounded-lg border-primary px-4 text-primary hover:bg-accent hover:text-primary"
          >
            <Save className="size-4" />
            Save Draft
          </Button>
          <Button
            type="button"
            onClick={onPreviewPublish}
            className="h-9 cursor-pointer rounded-lg bg-primary px-4 text-primary-foreground"
          >
            <Send className="size-4" />
            Preview & Publish
          </Button>
        </div>
      </PageContainer>
    </div>
  );
}
