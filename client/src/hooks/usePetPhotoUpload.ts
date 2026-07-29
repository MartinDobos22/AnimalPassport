import { useCallback, useState } from 'react';
import { downscaleImage } from '../utils/imageDownscale';
import { uploadPetPhoto } from '../services/petsApi';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

export type PetPhotoUploadError = 'unsupported' | 'tooLarge' | 'failed';

/** Validates a raw file before it enters the crop step. Returns null when valid. */
export function validatePetPhotoFile(file: File): PetPhotoUploadError | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'unsupported';
  if (file.size > MAX_BYTES) return 'tooLarge';
  return null;
}

interface UsePetPhotoUpload {
  upload: (file: File) => Promise<string | null>;
  uploadCropped: (dataUrl: string, mimeType: string) => Promise<string | null>;
  uploading: boolean;
  error: PetPhotoUploadError | null;
  setError: (error: PetPhotoUploadError | null) => void;
  reset: () => void;
}

/** Downscales an image, uploads it to the pet-photos bucket and returns its public URL. */
export function usePetPhotoUpload(): UsePetPhotoUpload {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<PetPhotoUploadError | null>(null);

  const upload = useCallback(async (file: File): Promise<string | null> => {
    setError(null);
    const validationError = validatePetPhotoFile(file);
    if (validationError) {
      setError(validationError);
      return null;
    }
    setUploading(true);
    try {
      const { dataUrl, mimeType } = await downscaleImage(file, {
        maxWidth: 1024,
        mimeType: 'image/jpeg',
        quality: 0.85,
      });
      const base64Data = dataUrl.split(',')[1] ?? '';
      const { url } = await uploadPetPhoto({ mimeType, base64Data });
      return url;
    } catch {
      setError('failed');
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

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

  return { upload, uploadCropped, uploading, error, setError, reset };
}
