import { useRef, useState } from "react";

import { uploadImage } from "@/services/imageUploadApi";

type CoverImageFields = {
  coverImageName: string;
  coverImageUrl: string;
  coverImageFile: File | null;
};

type UseCoverImageUploadArgs = {
  patch: (next: Partial<CoverImageFields>) => void;
};

const UPLOAD_FAILED_MESSAGE = "Upload failed. Please try again.";

/**
 * Cover pick → upload → store returned URL (preview only after success).
 * Keeps previous cover if the new upload fails.
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
      coverImageUrl: result.url,
      coverImageFile: null,
    });
  };

  return { uploading, error, onCoverFileChange };
}
