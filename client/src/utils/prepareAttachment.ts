import { downscaleImage } from './imageDownscale';

export interface PreparedAttachment {
  previewUrl: string;
  base64: string;
  mimeType: string;
}

const OCR_MAX_WIDTH = 2000;

const readFileAsBase64 = (file: File) =>
  new Promise<{ previewUrl: string; base64: string }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = typeof reader.result === 'string' ? reader.result : '';
      const base64 = raw.split(',')[1] ?? '';
      if (!base64) {
        reject(new Error('FILE_LOAD_FAILED'));
        return;
      }
      resolve({ previewUrl: raw, base64 });
    };
    reader.onerror = () => reject(new Error('FILE_LOAD_FAILED'));
    reader.readAsDataURL(file);
  });

export async function prepareAttachment(file: File): Promise<PreparedAttachment> {
  if (file.type.startsWith('image/')) {
    const { dataUrl, mimeType } = await downscaleImage(file, {
      maxWidth: OCR_MAX_WIDTH,
      mimeType: 'image/jpeg',
      quality: 0.9,
      enhanceForOcr: true,
    });
    const base64 = dataUrl.split(',')[1] ?? '';
    if (!base64) throw new Error('FILE_LOAD_FAILED');
    return { previewUrl: dataUrl, base64, mimeType };
  }

  const { previewUrl, base64 } = await readFileAsBase64(file);
  return { previewUrl, base64, mimeType: file.type };
}
