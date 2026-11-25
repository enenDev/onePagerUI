const REVOKE_AFTER_MS = 60_000;

const FILE_KIND = {
  pptx: {
    extension: ".pptx",
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  },
  zip: {
    extension: ".zip",
    mime: "application/zip",
  },
} as const;

export type SaveBlobKind = keyof typeof FILE_KIND;

type PendingDownload = {
  blob: Blob;
  fileName: string;
  kind: SaveBlobKind;
};

let pendingDownload: PendingDownload | null = null;
const pendingListeners = new Set<() => void>();

function notifyPendingDownload() {
  pendingListeners.forEach((listener) => listener());
}

function isTouchPrimary() {
  return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}

function exportTapCanSave() {
  return navigator.userActivation?.isActive === true;
}

function startDownload(blob: Blob, fileName: string, kind: SaveBlobKind) {
  const { extension, mime } = FILE_KIND[kind];
  const downloadName = fileName.toLowerCase().endsWith(extension)
    ? fileName
    : `${fileName}${extension}`;
  const file = new Blob([blob], { type: mime });
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = downloadName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_AFTER_MS);
  return { blob: file, fileName: downloadName, kind };
}

/**
 * Start a browser download for a finished file.
 * The temporary link stays for one minute so a phone can begin the save.
 * Desktop, and a phone whose Export tap is still active, save on this click.
 * The download bar lines stay commented below so they can be restored.
 */
export function saveBlobFile(blob: Blob, fileName: string, kind: SaveBlobKind) {
  const tapCanSave = exportTapCanSave();
  const saved = startDownload(blob, fileName, kind);
  if (tapCanSave || !isTouchPrimary()) {
    if (!pendingDownload) return;
    pendingDownload = null;
    notifyPendingDownload();
    return;
  }
  // Download bar backup. Uncomment both lines to show it again on touch
  // devices after the original tap has expired.
  // pendingDownload = saved;
  // notifyPendingDownload();
  void saved;
}

export function getManualDownload() {
  return pendingDownload;
}

export function subscribeManualDownload(listener: () => void) {
  pendingListeners.add(listener);
  return () => {
    pendingListeners.delete(listener);
  };
}

/** Fresh tap from the Download bar. Does not open the bar again. */
export function downloadPendingFile() {
  if (!pendingDownload) return;
  const current = pendingDownload;
  pendingDownload = null;
  notifyPendingDownload();
  startDownload(current.blob, current.fileName, current.kind);
}

export function dismissManualDownload() {
  if (!pendingDownload) return;
  pendingDownload = null;
  notifyPendingDownload();
}
