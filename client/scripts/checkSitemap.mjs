// Overí, že každá URL v dist/sitemap.xml je reálne 200-URL, nie redirect.
// Beží ako posledný krok buildu — chytá presne tie dve chyby, ktoré Search
// Console hlási ako „Page with redirect":
//   1) koncová lomka (Netlify z '/foo/' 301-uje na '/foo'),
//   2) chýbajúci prerender ('/poradna/<slug>' bez dist/poradna/<slug>.html
//      spadne na SPA fallback, kde neznámy slug končí soft-404).

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const clientRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(clientRoot, 'dist');
const SITE_URL = 'https://pawly.sk';

// Routy, ktoré vedome nie sú prerendrované (čistý SPA render, Netlify ich
// servíruje cez fallback /* → /index.html so statusom 200).
const SPA_ONLY = new Set(['/login', '/register']);

const xml = readFileSync(resolve(distDir, 'sitemap.xml'), 'utf-8');
const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const errors = [];

if (locs.length === 0) errors.push('sitemap.xml neobsahuje žiadnu <loc>.');

for (const loc of locs) {
  if (!loc.startsWith(`${SITE_URL}/`)) {
    errors.push(`${loc} — nesedí kanonická doména (${SITE_URL}).`);
    continue;
  }

  const path = loc.slice(SITE_URL.length);

  if (path !== '/' && path.endsWith('/')) {
    errors.push(`${loc} — koncová lomka; Netlify z nej 301-uje na ${loc.replace(/\/+$/, '')}.`);
    continue;
  }

  if (path === '/' || SPA_ONLY.has(path)) continue;

  const file = resolve(distDir, `${path.replace(/^\//, '')}.html`);
  if (!existsSync(file)) {
    errors.push(`${loc} — chýba prerender (${file.slice(distDir.length - 4)}).`);
  }
}

const articleCount = locs.filter((l) => l.includes('/poradna/')).length;
console.log(`[check-sitemap] ${locs.length} URL, z toho ${articleCount} článkov.`);

if (errors.length > 0) {
  console.error('[check-sitemap] sitemap obsahuje redirectujúce alebo neexistujúce URL:');
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

console.log('[check-sitemap] ✓ všetky URL sú prerendrované 200-URL bez koncovej lomky.');
