import type { AdminArticle, ArticleSource, Block } from '../types/article';

export type ValidationSeverity = 'error' | 'warning' | 'suggestion';

export interface ValidationResult {
  key: string;
  severity: ValidationSeverity;
  message: string;
  field?: string;
}

export interface ArticleValidation {
  canPublish: boolean;
  errors: ValidationResult[];
  warnings: ValidationResult[];
  suggestions: ValidationResult[];
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 6;
// Interný odkaz na iný článok: [text](/poradna/<slug>)
const ARTICLE_LINK_RE = /\]\(\/poradna\/([a-z0-9-]+)/g;
const ANY_INTERNAL_LINK_RE = /\]\(\//;

function blockText(block: Block): string {
  switch (block.type) {
    case 'paragraph':
    case 'subheading':
    case 'quote':
    case 'callout':
      return block.text ?? '';
    case 'bullets':
      return block.items.join('\n');
    default:
      return '';
  }
}

function collectText(article: AdminArticle): string {
  return article.sections
    .flatMap((s) => s.blocks.map(blockText))
    .filter((t) => t.trim().length > 0)
    .join('\n');
}

function hasBody(article: AdminArticle): boolean {
  return article.sections.some((s) =>
    s.blocks.some((b) => {
      if (b.type === 'bullets') return b.items.some((i) => i.trim().length > 0);
      if (b.type === 'divider') return false;
      return blockText(b).trim().length > 0;
    })
  );
}

function externalSources(sources: ArticleSource[]): ArticleSource[] {
  return sources.filter((s) => /^https?:\/\//i.test(s.url.trim()));
}

export function validateArticleForPublish(
  article: AdminArticle,
  ctx: { existingSlugs: Set<string> }
): ValidationResult[] {
  const out: ValidationResult[] = [];
  const text = collectText(article);
  const sources = (article.sources ?? []).filter((s) => s.url.trim().length > 0);
  const isHealth = article.category === 'zdravie';

  // ── Errors (tvrdé blokery) ──────────────────────────────────────────────
  if (!article.title.trim()) {
    out.push({
      key: 'missing_title',
      severity: 'error',
      message: 'Chýba titulok.',
      field: 'title',
    });
  }
  if (!article.slug.trim()) {
    out.push({ key: 'missing_slug', severity: 'error', message: 'Chýba slug.', field: 'slug' });
  } else if (!SLUG_RE.test(article.slug)) {
    out.push({
      key: 'invalid_slug',
      severity: 'error',
      message: 'Slug nie je validný (len malé písmená, číslice a pomlčky).',
      field: 'slug',
    });
  }
  if (article.category !== 'krmivo' && article.category !== 'zdravie') {
    out.push({
      key: 'missing_category',
      severity: 'error',
      message: 'Chýba kategória.',
      field: 'category',
    });
  }
  if (!article.description.trim()) {
    out.push({
      key: 'missing_meta_description',
      severity: 'error',
      message: 'Meta popis je povinný pred publikovaním.',
      field: 'description',
    });
  }
  if (!article.ctaIntent) {
    out.push({
      key: 'missing_cta',
      severity: 'error',
      message: 'Chýba CTA cieľ.',
      field: 'ctaIntent',
    });
  }
  if (!(article.coverImage ?? '').trim()) {
    out.push({
      key: 'missing_cover_image',
      severity: 'error',
      message: 'Chýba titulný obrázok.',
      field: 'coverImage',
    });
  }
  if (!(article.coverAlt ?? '').trim()) {
    out.push({
      key: 'missing_cover_alt',
      severity: 'error',
      message: 'Chýba alt text titulného obrázka.',
      field: 'coverAlt',
    });
  }
  if (!hasBody(article)) {
    out.push({ key: 'empty_body', severity: 'error', message: 'Článok nemá telo.' });
  }
  if (isHealth && sources.length === 0) {
    out.push({
      key: 'health_no_sources',
      severity: 'warning',
      message: 'Zdravotný článok nemá žiadny zdroj (odporúčané, ale nie povinné).',
    });
  }
  if (isHealth) {
    if (!(article.disclaimer ?? '').trim()) {
      out.push({
        key: 'health_no_disclaimer',
        severity: 'error',
        message: 'Zdravotný článok musí mať disclaimer.',
        field: 'disclaimer',
      });
    }
    if (!article.lastContentReviewAt) {
      out.push({
        key: 'health_no_review_date',
        severity: 'error',
        message: 'Zdravotný článok musí mať dátum poslednej kontroly.',
        field: 'lastContentReviewAt',
      });
    }
    if (!article.riskLevel) {
      out.push({
        key: 'health_no_risk_level',
        severity: 'error',
        message: 'Zdravotný článok musí mať nastavenú úroveň rizika.',
        field: 'riskLevel',
      });
    }
    if (article.riskLevel === 'high') {
      if (!article.medicalReviewedBy || !article.medicalReviewedAt) {
        out.push({
          key: 'high_risk_no_medical_review',
          severity: 'error',
          message: 'Vysoko rizikový článok vyžaduje medicínsku kontrolu (kto + kedy).',
          field: 'medicalReviewedBy',
        });
      }
      if (!article.factCheckedBy || !article.factCheckedAt) {
        out.push({
          key: 'high_risk_no_fact_check',
          severity: 'error',
          message: 'Vysoko rizikový článok vyžaduje fact-check (kto + kedy).',
          field: 'factCheckedBy',
        });
      }
    }
  }
  const broken = new Set<string>();
  for (const match of text.matchAll(ARTICLE_LINK_RE)) {
    const target = match[1];
    if (target && !ctx.existingSlugs.has(target)) broken.add(target);
  }
  for (const target of broken) {
    out.push({
      key: 'broken_internal_link',
      severity: 'error',
      message: `Interný odkaz na neexistujúci článok: /poradna/${target}`,
    });
  }

  // ── Warnings ────────────────────────────────────────────────────────────
  const descLen = article.description.trim().length;
  if (descLen > 0 && descLen < 120) {
    out.push({
      key: 'meta_description_short',
      severity: 'warning',
      message: `Meta popis je krátky (${descLen} znakov, ideál 120–160).`,
      field: 'description',
    });
  }
  if (descLen > 160) {
    out.push({
      key: 'meta_description_long',
      severity: 'warning',
      message: `Meta popis je dlhý (${descLen} znakov, ideál 120–160).`,
      field: 'description',
    });
  }
  if (article.title.trim().length > 60) {
    out.push({
      key: 'title_long',
      severity: 'warning',
      message: `Titulok je veľmi dlhý (${article.title.trim().length} znakov).`,
      field: 'title',
    });
  }
  if ((article.faqs ?? []).filter((f) => f.q.trim() && f.a.trim()).length === 0) {
    out.push({ key: 'no_faq', severity: 'warning', message: 'Článok nemá žiadne FAQ.' });
  }
  if ((article.relatedSlugs ?? []).length === 0) {
    out.push({
      key: 'no_related_articles',
      severity: 'warning',
      message: 'Článok nemá žiadne súvisiace články.',
    });
  }
  if (!ANY_INTERNAL_LINK_RE.test(text)) {
    out.push({
      key: 'no_internal_links',
      severity: 'warning',
      message: 'Článok nemá interné odkazy.',
    });
  }
  if (sources.length > 0 && sources.length < 2) {
    out.push({
      key: 'few_sources',
      severity: 'warning',
      message: 'Článok má málo zdrojov (menej než 2).',
    });
  }
  if (article.updated) {
    const updatedMs = new Date(article.updated).getTime();
    if (!Number.isNaN(updatedMs) && Date.now() - updatedMs > SIX_MONTHS_MS) {
      out.push({
        key: 'stale',
        severity: 'warning',
        message: 'Článok nebol aktualizovaný viac ako 6 mesiacov.',
        field: 'updated',
      });
    }
  }

  // ── Suggestions ─────────────────────────────────────────────────────────
  if (externalSources(sources).length > 0) {
    out.push({
      key: 'verify_external_sources',
      severity: 'suggestion',
      message: 'Over, že externé zdroje sú dôveryhodné a funkčné.',
    });
  }

  return out;
}

export function groupValidation(results: ValidationResult[]): ArticleValidation {
  const errors = results.filter((r) => r.severity === 'error');
  return {
    canPublish: errors.length === 0,
    errors,
    warnings: results.filter((r) => r.severity === 'warning'),
    suggestions: results.filter((r) => r.severity === 'suggestion'),
  };
}
