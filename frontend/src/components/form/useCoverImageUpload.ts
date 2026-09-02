import { useRef, useState } from "react";

import { uploadImage } from "@/services/imageUploadApi";

type CoverImageFields = {
  coverImageName: string;
  coverImageUrl: string;
  coverImagePublicUrl: string;
  coverImageFile: File | null;
};

type UseCoverImageUploadArgs = {
  patch: (next: Partial<CoverImageFields>) => void;
};

const UPLOAD_FAILED_MESSAGE = "Upload failed. Please try again.";

/**
 * Cover pick → upload → signed URL for preview, public URL for save.
 * Keeps previous cover if the new upload fails. No delete API on replace/clear.
 */
export function useCoverImageUpload({ patch }: UseCoverImageUploadArgs) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uploadGen = useRef(0);

  const onCoverFileChange = async (file: File | null) => {
    if (!file) {
      patch({
        coverImageName: "",
        coverImageUrl: "",
        coverImagePublicUrl: "",
        coverImageFile: null,
      });
      setError(null);
      return;
    }

    const gen = ++uploadGen.current;
    setUploading(true);
    setError(null);

    const result = await uploadImage(file);
    if (gen !== uploadGen.current) return;

    setUploading(false);

    if (!result.ok) {
      setError(UPLOAD_FAILED_MESSAGE);
      return;
    }

    patch({
      coverImageName: file.name,
      coverImageUrl: result.signed_url,
      coverImagePublicUrl: result.public_url,
      coverImageFile: null,
    });
  };

  return { uploading, error, onCoverFileChange };
}
