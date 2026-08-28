// Build-time sync: načíta verejné články zo Supabase a prepíše committed mirror
// `src/content/poradna/articles.data.json`, ktorý konzumuje SPA aj prerender.
//
// Fallback vs. fail-fast: pri lokálnom builde smie chýbajúca DB len varovať a
// nechať posledný committed mirror. Na produkčnom builde (Netlify/CI) sú chýbajúce
// credentials konfiguračná chyba — mirror ostane starý, nové články sa
// neprerendrujú ani nedostanú do sitemap a Google ich zaradí ako neindexované.
// Preto tam build zámerne padne. Prechodné zlyhanie DB (fetch/HTTP/0 riadkov) len
// varuje — deploy sa vtedy zaobíde s obsahom z posledného buildu.
// Únikový ventil: ARTICLES_SYNC_OPTIONAL=1 vráti staré mäkké správanie.
//
// Env (build, server-side — NEbundluje sa do klienta):
//   SUPABASE_URL a SUPABASE_SERVICE_ROLE_KEY (alebo SUPABASE_SERVICE_KEY).

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIRROR_PATH = resolve(__dirname, '../src/content/poradna/articles.data.json');

const SELECT =
  'slug,category,species,title,description,intro,sections,faqs,related_slugs,cover_image,cover_alt,cta_intent,author,sources,updated,reviewed_by,reviewed_at,reviewer_title,medical_reviewed_at,disclaimer';

function normalizeUrl(raw) {
  return raw
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1$/, '')
    .replace(/\/+$/, '');
}

function rowToArticle(row) {
  return {
    slug: row.slug,
    category: row.category,
    species: row.species ?? [],
    title: row.title,
    description: row.description,
    intro: row.intro,
    sections: row.sections ?? [],
    faqs: row.faqs ?? [],
    relatedSlugs: row.related_slugs ?? [],
    updated: row.updated,
    coverImage: row.cover_image ?? undefined,
    coverAlt: row.cover_alt ?? undefined,
    ctaIntent: row.cta_intent,
    author: row.author ?? undefined,
    sources: row.sources ?? [],
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewerTitle: row.reviewer_title ?? undefined,
    medicalReviewedAt: row.medical_reviewed_at ?? undefined,
    disclaimer: row.disclaimer ?? undefined,
  };
}

function isProductionBuild() {
  return Boolean(process.env.NETLIFY || process.env.CI);
}

function isSyncOptional() {
  return process.env.ARTICLES_SYNC_OPTIONAL === '1';
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    const message =
      '[syncArticles] SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY nie sú nastavené — mirror sa neobnoví z DB.';
    if (isProductionBuild() && !isSyncOptional()) {
      throw new Error(
        `${message} Na produkčnom builde je to konfiguračná chyba: novo publikované články by ostali bez prerenderu a mimo sitemap. ` +
          'Doplň build env premenné v Netlify (Site settings → Environment variables), alebo nastav ARTICLES_SYNC_OPTIONAL=1.'
      );
    }
    console.warn(`${message} Používam committed mirror (fallback).`);
    return;
  }

  const endpoint =
    `${normalizeUrl(url)}/rest/v1/articles` +
    `?select=${encodeURIComponent(SELECT)}&published=eq.true&order=position.asc`;

  let rows;
  try {
    const res = await fetch(endpoint, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.warn(`[syncArticles] Supabase odpoveď ${res.status} — ponechávam fallback.`);
      return;
    }
    rows = await res.json();
  } catch (err) {
    console.warn(`[syncArticles] fetch zlyhal (${err?.message ?? err}) — ponechávam fallback.`);
    return;
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    console.warn('[syncArticles] DB vrátila 0 článkov — ponechávam fallback (nevymazávam obsah).');
    return;
  }

  const articles = rows.map(rowToArticle);
  await writeFile(MIRROR_PATH, JSON.stringify(articles, null, 2) + '\n', 'utf8');
  console.log(`[syncArticles] mirror obnovený z DB — ${articles.length} článkov.`);
}

main().catch((err) => {
  if (isProductionBuild() && !isSyncOptional()) {
    console.error(`[syncArticles] ${err?.message ?? err}`);
    process.exit(1);
  }
  console.warn(`[syncArticles] neočakávaná chyba (${err?.message ?? err}) — ponechávam fallback.`);
});
