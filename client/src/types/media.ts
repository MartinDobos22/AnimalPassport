// Media knižnica — zrkadlo servera (server/src/services/mediaImageService.ts).
export interface MediaImage {
  id: string;
  objectPath: string;
  url: string;
  alt: string | null;
  caption: string | null;
  author: string | null;
  width: number | null;
  height: number | null;
  mime: string | null;
  sizeBytes: number | null;
  createdAt: string;
}
