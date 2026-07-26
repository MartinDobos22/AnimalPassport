import { getSupabase } from '../config/supabase';
import { httpError } from '../utils/httpError';

// Media knižnica — evidencia nahratých obrázkov článkov (tabuľka media_images,
// migrácia 0033) nad bucketom `article-images`. Umožňuje admin obrázok
// znovupoužiť, upraviť popis/autora/alt a zmazať (objekt aj riadok).

const BUCKET = 'article-images';

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

type Row = Record<string, unknown>;

function asStr(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
function asOptStr(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}
function asOptNum(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function rowToMedia(row: Row): MediaImage {
  return {
    id: asStr(row.id),
    objectPath: asStr(row.object_path),
    url: asStr(row.url),
    alt: asOptStr(row.alt),
    caption: asOptStr(row.caption),
    author: asOptStr(row.author),
    width: asOptNum(row.width),
    height: asOptNum(row.height),
    mime: asOptStr(row.mime),
    sizeBytes: asOptNum(row.size_bytes),
    createdAt: asStr(row.created_at),
  };
}

function optTrim(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export async function recordMediaImage(input: {
  objectPath: string;
  url: string;
  mime?: string | null;
  sizeBytes?: number | null;
  alt?: unknown;
  caption?: unknown;
  author?: unknown;
  width?: unknown;
  height?: unknown;
  createdBy?: string | null;
}): Promise<MediaImage> {
  const { data, error } = await getSupabase()
    .from('media_images')
    .insert({
      object_path: input.objectPath,
      url: input.url,
      mime: input.mime ?? null,
      size_bytes: input.sizeBytes ?? null,
      alt: optTrim(input.alt),
      caption: optTrim(input.caption),
      author: optTrim(input.author),
      width: asOptNum(input.width),
      height: asOptNum(input.height),
      created_by: input.createdBy ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToMedia(data as Row);
}

export async function listMediaImages(limit = 200): Promise<MediaImage[]> {
  const { data, error } = await getSupabase()
    .from('media_images')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data as Row[] | null) ?? []).map(rowToMedia);
}

export async function updateMediaImage(
  id: string,
  input: { alt?: unknown; caption?: unknown; author?: unknown }
): Promise<MediaImage> {
  const patch: Record<string, string | null> = {};
  if ('alt' in input) patch.alt = optTrim(input.alt);
  if ('caption' in input) patch.caption = optTrim(input.caption);
  if ('author' in input) patch.author = optTrim(input.author);

  const { data, error } = await getSupabase()
    .from('media_images')
    .update(patch)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw httpError(404, 'Obrázok sa nenašiel.', 'NOT_FOUND');
  return rowToMedia(data as Row);
}

export async function deleteMediaImage(id: string): Promise<void> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('media_images')
    .select('object_path')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw httpError(404, 'Obrázok sa nenašiel.', 'NOT_FOUND');

  const objectPath = asStr((data as Row).object_path);
  if (objectPath) {
    // Objekt zmažeme best-effort — aj keď zlyhá, riadok odstránime (ostane
    // osirelý objekt, ktorý neblokuje nič a dá sa vyčistiť neskôr).
    await supabase.storage.from(BUCKET).remove([objectPath]);
  }
  const { error: delError } = await supabase.from('media_images').delete().eq('id', id);
  if (delError) throw delError;
}
