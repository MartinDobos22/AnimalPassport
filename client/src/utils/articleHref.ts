// Netlify servíruje prerendrovaný obsah poradne na URL s koncovou lomkou
// (adresárový index) a z verzie bez lomky 301-uje. Interné odkazy aj štruktúrované
// dáta preto MUSIA ukazovať priamo na 200-URL (s lomkou), inak Google crawluje
// redirect a hlási „Page with redirect". Canonical/sitemap už lomku majú; toto
// zjednocuje aj odkazy a JSON-LD, aby Google bez-lomkovú verziu vôbec neobjavil.

export const PORADNA_PATH = '/poradna/';

export function articleHref(slug: string): string {
  return `/poradna/${slug}/`;
}

/**
 * Doplní koncovú lomku internému `/poradna…` odkazu (napr. z markdownu v tele
 * článku), aby ukazoval priamo na prerendrovanú 200-URL a nie na jej
 * redirectujúcu bez-lomkovú verziu. Ostatné cesty a query/hash necháva tak.
 */
export function withPoradnaTrailingSlash(url: string): string {
  if (!/^\/poradna(\/|$)/.test(url)) return url;
  const splitAt = url.search(/[?#]/);
  const path = splitAt === -1 ? url : url.slice(0, splitAt);
  const suffix = splitAt === -1 ? '' : url.slice(splitAt);
  if (path.endsWith('/') || /\.[a-z0-9]+$/i.test(path)) return url;
  return `${path}/${suffix}`;
}
