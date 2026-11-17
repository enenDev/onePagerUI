import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  dismissManualDownload,
  downloadPendingFile,
  getManualDownload,
  subscribeManualDownload,
} from "@/services/saveBlobFile";

export function ManualDownloadBar() {
  const [open, setOpen] = useState(() => getManualDownload() !== null);

  useEffect(
    () =>
      subscribeManualDownload(() => {
        setOpen(getManualDownload() !== null);
      }),
    [],
  );

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 z-50 flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-full bg-white px-3 py-2 shadow-lg ring-1 ring-foreground/10"
    >
      <p className="pl-2 text-sm font-medium text-foreground">File ready</p>
      <Button
        type="button"
        onClick={downloadPendingFile}
        className="h-9 cursor-pointer rounded-full px-4"
      >
        Download
      </Button>
      <button
        type="button"
        className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-foreground hover:bg-accent"
        aria-label="Dismiss"
        onClick={dismissManualDownload}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
