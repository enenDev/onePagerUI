import ApiBase from "@/components/auth/apiBase";

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
  const formData = new FormData();
  formData.append('file', file)
  try {
    const { data } = await ApiBase.post('api/v1/upload', formData, {
      headers: {
        'accept': 'application/json',
        'Content-Type': 'multipart/form-data'
      }
    })
    // const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    return {
      ok: true,
      url: data?.url || '',
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}
