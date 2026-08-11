// Generuje dist/sitemap.xml z verejných statických rout + publikovaných článkov.
// Zdroj článkov: src/content/poradna/articles.data.json (mirror z DB, ktorý
// scripts/syncArticles.mjs napĺňa LEN publikovanými článkami). Nový publikovaný
// článok sa tak do sitemap dostane automaticky pri builde — bez ručnej editácie.
// Beží po `vite build` (dist už existuje). Vzor cesty/výstupu podľa prerender.mjs.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientRoot = resolve(__dirname, '..');
const SITE_URL = 'https://pawly.sk';

const MIRROR_PATH = resolve(clientRoot, 'src/content/poradna/articles.data.json');
const OUT_PATH = resolve(clientRoot, 'dist/sitemap.xml');

// Statické verejné routy (mimo poradne). changefreq/priority zachované z pôvodnej
// ručnej sitemap.
// Prerendrované routy sa zapisujú ako dist/<path>.html — Netlify ich servíruje
// BEZ koncovej lomky a z verzie s lomkou 301-uje, takže do sitemap patrí tvar bez
// lomky. Rovnako SPA routy (/login, /register) a root ('/').
const STATIC_ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/poradna', changefreq: 'weekly', priority: '0.8' },
  { path: '/info', changefreq: 'monthly', priority: '0.4' },
  { path: '/kontakt', changefreq: 'yearly', priority: '0.3' },
  { path: '/login', changefreq: 'monthly', priority: '0.3' },
  { path: '/register', changefreq: 'monthly', priority: '0.5' },
  { path: '/ochrana-sukromia/', changefreq: 'yearly', priority: '0.3' },
  { path: '/podmienky/', changefreq: 'yearly', priority: '0.3' },
];

function readArticles() {
  try {
    const raw = JSON.parse(readFileSync(MIRROR_PATH, 'utf-8'));
    return Array.isArray(raw) ? raw : (raw.articles ?? []);
  } catch (err) {
    console.warn(`[sitemap] mirror sa nepodarilo načítať (${err?.message ?? err}) — bez článkov.`);
    return [];
  }
}

function urlEntry({ path, changefreq, priority, lastmod }) {
  const lines = [
    '  <url>',
    `    <loc>${SITE_URL}${path}</loc>`,
    ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ];
  return lines.join('\n');
}

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value);
}

const articleEntries = readArticles()
  .filter((a) => typeof a?.slug === 'string' && a.slug.length > 0)
  .map((a) =>
    urlEntry({
      path: `/poradna/${a.slug}`,
      changefreq: 'monthly',
      priority: '0.8',
      lastmod: isIsoDate(a.updated) ? a.updated.slice(0, 10) : undefined,
    })
  );

const entries = [...STATIC_ROUTES.map(urlEntry), ...articleEntries];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

writeFileSync(OUT_PATH, xml, 'utf-8');
console.log(`[sitemap] ${entries.length} URL → dist/sitemap.xml`);
