import { useCallback, useState } from 'react';
import { downscaleImage } from '../utils/imageDownscale';
import { uploadPetPhoto } from '../services/petsApi';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

export type PetPhotoUploadError = 'unsupported' | 'tooLarge' | 'failed';

interface UsePetPhotoUpload {
  upload: (file: File) => Promise<string | null>;
  uploading: boolean;
  error: PetPhotoUploadError | null;
  reset: () => void;
}

/** Downscales an image, uploads it to the pet-photos bucket and returns its public URL. */
export function usePetPhotoUpload(): UsePetPhotoUpload {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<PetPhotoUploadError | null>(null);

  const upload = useCallback(async (file: File): Promise<string | null> => {
    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('unsupported');
      return null;
    }
    if (file.size > MAX_BYTES) {
      setError('tooLarge');
      return null;
    }
    setUploading(true);
    try {
      const { dataUrl, mimeType } = await downscaleImage(file, {
        maxWidth: 1280,
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

  const reset = useCallback(() => setError(null), []);

  return { upload, uploading, error, reset };
}
