// Netlify servíruje prerendrovaný obsah poradne zo súboru `dist/<path>.html`,
// takže 200-URL je verzia BEZ koncovej lomky a z verzie s lomkou sa 301-uje
// (Netlify Pretty URLs). Interné odkazy, canonical, sitemap aj štruktúrované
// dáta preto MUSIA ukazovať na tvar bez lomky, inak Google crawluje redirect
// a hlási „Page with redirect".

export const PORADNA_PATH = '/poradna';

export function articleHref(slug: string): string {
  return `/poradna/${slug}`;
}

/**
 * Odstráni koncovú lomku internému `/poradna…` odkazu (napr. z markdownu v tele
 * článku), aby ukazoval priamo na prerendrovanú 200-URL a nie na jej
 * redirectujúcu verziu s lomkou. Ostatné cesty a query/hash necháva tak.
 */
export function withPoradnaCanonicalPath(url: string): string {
  if (!/^\/poradna(\/|$)/.test(url)) return url;
  const splitAt = url.search(/[?#]/);
  const path = splitAt === -1 ? url : url.slice(0, splitAt);
  const suffix = splitAt === -1 ? '' : url.slice(splitAt);
  if (!path.endsWith('/')) return url;
  return `${path.replace(/\/+$/, '')}${suffix}`;
}
