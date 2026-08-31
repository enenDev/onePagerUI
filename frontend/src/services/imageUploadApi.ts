const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

export type UploadImageResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Upload one image to blob/cloud storage; returns a permanent URL for the form payload.
 *
 * TODO: Replace body with real multipart/signed-url upload (e.g. POST /api/uploads).
 * Keep `(file: File) => Promise<UploadImageResult>` and `{ ok: true, url }` / `{ ok: false, error }`.
 * Callers already store `url` in coverImageUrl / initiative `blobUrl` (payload `blob_url`).
 */
export async function uploadImage(file: File): Promise<UploadImageResult> {
  await delay(500);
  const safeName = file.name.replace(/[^\w.-]+/g, "_");
  return {
    ok: true,
    url: `https://cdn.example.com/uploads/${crypto.randomUUID()}-${safeName}`,
  };
}
