import type { EmbedProvider } from '../content/poradna/types';

// Prevod verejnej URL sociálnej siete na bezpečnú iframe embed URL.
// Žiadny externý JS SDK — používame oficiálne iframe endpointy (plugins / embed).

export function detectEmbedProvider(url: string): EmbedProvider | null {
  const u = url.trim().toLowerCase();
  if (!u) return null;
  if (u.includes('facebook.com') || u.includes('fb.watch')) return 'facebook';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('instagram.com')) return 'instagram';
  return null;
}

function youtubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
  ];
  for (const re of patterns) {
    const m = re.exec(url);
    if (m) return m[1];
  }
  return null;
}

export function toEmbedSrc(provider: EmbedProvider, url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  switch (provider) {
    case 'youtube': {
      const id = youtubeId(trimmed);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    case 'facebook':
      return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(
        trimmed
      )}&show_text=true&width=500`;
    case 'instagram': {
      const base = trimmed.split('?')[0].replace(/\/+$/, '');
      return `${base}/embed`;
    }
  }
}
