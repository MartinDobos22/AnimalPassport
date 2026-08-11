import { useEffect } from 'react';

export const SITE_URL = 'https://pawly.sk';
const DEFAULT_OG_IMAGE = `${SITE_URL}/branding/pawly-banner.png`;

// Prerendrované stránky servíruje Netlify zo súboru `dist/<path>.html`, takže
// 200-URL je bez koncovej lomky a z verzie s lomkou sa 301-uje. Canonical musí
// sedieť s 200-URL, inak po hydratácii klient prepíše prerendrovaný canonical na
// redirectujúcu verziu. Root ('/') ostáva nezmenený.
function canonicalPath(path: string): string {
  if (path === '/') return path;
  return path.replace(/\/+$/, '');
}

interface Props {
  title: string;
  description?: string;
  path?: string;
  noindex?: boolean;
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: string;
  keywords?: string[];
  jsonLd?: object;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(data: object | undefined) {
  const existing = document.head.querySelector<HTMLScriptElement>('script[data-seo-jsonld]');
  if (!data) {
    existing?.remove();
    return;
  }
  const el = existing ?? document.createElement('script');
  el.setAttribute('type', 'application/ld+json');
  el.setAttribute('data-seo-jsonld', '');
  el.textContent = JSON.stringify(data);
  if (!existing) document.head.appendChild(el);
}

export default function Seo({
  title,
  description,
  path,
  noindex,
  ogImage,
  ogImageAlt,
  ogType,
  keywords,
  jsonLd,
}: Props) {
  useEffect(() => {
    document.title = title;
    upsertMeta('property', 'og:title', title);
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('property', 'og:type', ogType ?? 'website');
    upsertMeta('name', 'twitter:card', 'summary_large_image');

    if (description) {
      upsertMeta('name', 'description', description);
      upsertMeta('property', 'og:description', description);
      upsertMeta('name', 'twitter:description', description);
    }

    const image = ogImage ?? DEFAULT_OG_IMAGE;
    upsertMeta('property', 'og:image', image);
    upsertMeta('name', 'twitter:image', image);
    if (ogImageAlt) {
      upsertMeta('property', 'og:image:alt', ogImageAlt);
      upsertMeta('name', 'twitter:image:alt', ogImageAlt);
    }

    const canonical = `${SITE_URL}${canonicalPath(path ?? window.location.pathname)}`;
    upsertLink('canonical', canonical);
    upsertMeta('property', 'og:url', canonical);

    upsertMeta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow');

    if (keywords && keywords.length > 0) {
      upsertMeta('name', 'keywords', keywords.join(', '));
    }

    upsertJsonLd(jsonLd);
    return () => {
      // JSON-LD je per-stránka — odstráň pri odchode, aby sa nezdedil na app routy
      if (jsonLd) upsertJsonLd(undefined);
    };
  }, [title, description, path, noindex, ogImage, ogImageAlt, ogType, keywords, jsonLd]);

  return null;
}
