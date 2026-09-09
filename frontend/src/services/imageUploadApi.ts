import ApiBase from "@/components/auth/apiBase";

export type UploadImageResult =
  | { ok: true; signed_url: string; public_url: string }
  | { ok: false; error: string };

/**
 * Upload one image. Display uses `signed_url`; draft/publish uses `public_url`.
 */
export async function uploadImage(file: File): Promise<UploadImageResult> {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const { data } = await ApiBase.post("api/v1/upload", formData, {
      headers: {
        accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    });
    const body = data?.data ?? data;
    console.log(body)
    const obj =body[0]
    const signed_url = obj?.image_signed_url ?? "";
    const public_url = obj?.image_name ?? "";
    if (!signed_url || !public_url) {
      return { ok: false, error: "Upload failed. Please try again." };
    }
    return { ok: true, signed_url, public_url };
  } catch (error) {
    console.error("Error fetching data:", error);
    return { ok: false, error: "Upload failed. Please try again." };
  }
}
