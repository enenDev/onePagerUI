const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

export type UploadImageResult =
  | { ok: true; signed_url: string; public_url: string }
  | { ok: false; error: string };

/**
 * Upload one image to blob/cloud storage.
 *
 * TODO: Replace body with real multipart/signed-url upload (e.g. POST /api/uploads).
 * Keep `(file: File) => Promise<UploadImageResult>`.
 * Response: `{ signed_url }` for `<img src>` / PPT, `{ public_url }` for draft/publish.
 * Do not send signed_url in the save payload.
 */
export async function uploadImage(file: File): Promise<UploadImageResult> {
  // TODO: POST real upload; keep UploadImageResult { signed_url, public_url }.
  await delay(500);
  const safeName = file.name.replace(/[^\w.-]+/g, "_");
  const id = crypto.randomUUID();
  return {
    ok: true,
    signed_url: `https://cdn.example.com/signed/${id}-${safeName}`,
    public_url: `https://cdn.example.com/uploads/${id}-${safeName}`,
  };
}
