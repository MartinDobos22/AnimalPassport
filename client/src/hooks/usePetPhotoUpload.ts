import { useCallback, useState } from 'react';
import { uploadPetPhoto } from '../services/petsApi';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

export type PetPhotoUploadError = 'unsupported' | 'tooLarge' | 'failed';

/** Validates a raw file before it enters the adjust step. Returns null when valid. */
export function validatePetPhotoFile(file: File): PetPhotoUploadError | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'unsupported';
  if (file.size > MAX_BYTES) return 'tooLarge';
  return null;
}

interface UsePetPhotoUpload {
  uploadCropped: (dataUrl: string, mimeType: string) => Promise<string | null>;
  uploading: boolean;
  error: PetPhotoUploadError | null;
  setError: (error: PetPhotoUploadError | null) => void;
  reset: () => void;
}

/** Uploads an already-processed (downscaled/cropped) image to the pet-photos bucket. */
export function usePetPhotoUpload(): UsePetPhotoUpload {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<PetPhotoUploadError | null>(null);

  const uploadCropped = useCallback(
    async (dataUrl: string, mimeType: string): Promise<string | null> => {
      setError(null);
      setUploading(true);
      try {
        const base64Data = dataUrl.split(',')[1] ?? '';
        const { url } = await uploadPetPhoto({ mimeType, base64Data });
        return url;
      } catch {
        setError('failed');
        return null;
      } finally {
        setUploading(false);
      }
    },
    []
  );

  const reset = useCallback(() => setError(null), []);

  return { uploadCropped, uploading, error, setError, reset };
}
