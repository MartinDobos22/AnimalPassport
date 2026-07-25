import { randomUUID } from 'crypto';
import { getSupabase } from '../config/supabase';
import { httpError } from '../utils/httpError';
import { recordMediaImage, type MediaImage } from './mediaImageService';

// Upload titulného obrázka článku do verejného bucketu `article-images`.
// Vzor: petPhotoService.ts. Upload len server-side (service_role).

const BUCKET = 'article-images';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function decodeBase64(base64Data: unknown): Buffer {
  if (typeof base64Data !== 'string' || base64Data.trim().length === 0) {
    throw httpError(400, 'Chýbajú dáta obrázka.', 'INVALID_IMAGE');
  }
  const cleaned = base64Data.includes(',') ? base64Data.split(',').pop() : base64Data;
  const buffer = Buffer.from(cleaned ?? '', 'base64');
  if (buffer.length === 0) throw httpError(400, 'Obrázok je prázdny.', 'INVALID_IMAGE');
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw httpError(413, 'Obrázok je príliš veľký.', 'IMAGE_TOO_LARGE');
  }
  return buffer;
}

export async function uploadArticleImage(
  input: {
    mimeType?: unknown;
    base64Data?: unknown;
    alt?: unknown;
    caption?: unknown;
    author?: unknown;
    width?: unknown;
    height?: unknown;
  },
  createdBy?: string | null
): Promise<{ url: string; objectPath: string; media: MediaImage }> {
  const mimeType = typeof input.mimeType === 'string' ? input.mimeType : '';
  const ext = EXT_BY_MIME[mimeType];
  if (!ext) throw httpError(400, 'Nepodporovaný formát obrázka.', 'INVALID_IMAGE');

  const buffer = decodeBase64(input.base64Data);
  const objectPath = `articles/${randomUUID()}.${ext}`;

  const { error } = await getSupabase()
    .storage.from(BUCKET)
    .upload(objectPath, buffer, { contentType: mimeType, upsert: false });
  if (error) throw error;

  const { data } = getSupabase().storage.from(BUCKET).getPublicUrl(objectPath);
  const url = data.publicUrl;

  const media = await recordMediaImage({
    objectPath,
    url,
    mime: mimeType,
    sizeBytes: buffer.length,
    alt: input.alt,
    caption: input.caption,
    author: input.author,
    width: input.width,
    height: input.height,
    createdBy: createdBy ?? null,
  });

  return { url, objectPath, media };
}
