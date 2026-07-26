import { getSupabase } from '../config/supabase';
import { httpError } from '../utils/httpError';
import { ANIMAL_SPECIES } from '../constants/animalSpecies';
import type {
  AdminArticle,
  Article,
  ArticleSection,
  ArticleSource,
  ArticleStatus,
  Block,
  CalloutVariant,
  EmbedProvider,
  FaqItem,
  RiskLevel,
  TextAlign,
} from '../types/article';

type Row = Record<string, unknown>;

const TEXT_ALIGNS: TextAlign[] = ['left', 'center', 'right'];
const ARTICLE_STATUSES: ArticleStatus[] = [
  'draft',
  'in_review',
  'approved',
  'scheduled',
  'published',
  'archived',
];

// Povolené prechody stavov — jediný zdroj pravdy, vynucované na API.
export const ARTICLE_STATUS_TRANSITIONS: Record<ArticleStatus, ArticleStatus[]> = {
  draft: ['in_review', 'archived'],
  in_review: ['draft', 'approved'],
  approved: ['published', 'scheduled', 'draft'],
  scheduled: ['published', 'draft'],
  published: ['archived', 'draft'],
  archived: ['draft'],
};

export function isTransitionAllowed(from: ArticleStatus, to: ArticleStatus): boolean {
  return ARTICLE_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

const SELECT_COLUMNS =
  'slug, category, species, title, description, teaser, tags, intro, sections, faqs, related_slugs, cover_image, cover_alt, cover_credit, cta_intent, author, sources, updated, position, reviewed_by, reviewed_at, reviewer_title, medical_reviewed_at, disclaimer';

const SELECT_COLUMNS_ADMIN = `${SELECT_COLUMNS}, published, status, assigned_editor, editorial_notes, publish_at, unpublish_at, submitted_for_review_at, submitted_for_review_by, approved_at, approved_by, published_at, published_by, archived_at, archived_by, risk_level, fact_checked_by, fact_checked_at, medical_reviewed_by, last_content_review_at, next_review_due_at`;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CALLOUT_VARIANTS: CalloutVariant[] = ['tip', 'warning', 'info'];
const EMBED_PROVIDERS: EmbedProvider[] = ['facebook', 'youtube', 'instagram'];

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function rowToArticle(row: Row): Article {
  return {
    slug: asString(row.slug),
    category: asString(row.category) === 'zdravie' ? 'zdravie' : 'krmivo',
    species: asStringArray(row.species),
    title: asString(row.title),
    description: asString(row.description),
    teaser: asOptionalString(row.teaser),
    intro: asString(row.intro),
    sections: (Array.isArray(row.sections) ? row.sections : []) as ArticleSection[],
    faqs: (Array.isArray(row.faqs) ? row.faqs : []) as FaqItem[],
    relatedSlugs: asStringArray(row.related_slugs),
    tags: asStringArray(row.tags),
    updated: asString(row.updated),
    coverImage: asOptionalString(row.cover_image),
    coverAlt: asOptionalString(row.cover_alt),
    coverCredit: asOptionalString(row.cover_credit),
    ctaIntent: asString(row.cta_intent),
    reviewedBy: asOptionalString(row.reviewed_by),
    reviewedAt: asOptionalString(row.reviewed_at),
    reviewerTitle: asOptionalString(row.reviewer_title),
    medicalReviewedAt: asOptionalString(row.medical_reviewed_at),
    disclaimer: asOptionalString(row.disclaimer),
    author: asOptionalString(row.author),
    sources: (Array.isArray(row.sources) ? row.sources : []) as ArticleSource[],
  };
}

export async function listPublishedArticles(): Promise<Article[]> {
  const { data, error } = await getSupabase()
    .from('articles')
    .select(SELECT_COLUMNS)
    .eq('published', true)
    .order('position', { ascending: true });
  if (error) throw error;
  return ((data as Row[] | null) ?? []).map(rowToArticle);
}

export async function getPublishedArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await getSupabase()
    .from('articles')
    .select(SELECT_COLUMNS)
    .eq('published', true)
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToArticle(data as Row) : null;
}

// ── Admin (write) ───────────────────────────────────────────────────────────

function asStatus(value: unknown): ArticleStatus {
  return ARTICLE_STATUSES.includes(value as ArticleStatus) ? (value as ArticleStatus) : 'draft';
}

function rowToAdminArticle(row: Row): AdminArticle {
  return {
    ...rowToArticle(row),
    published: row.published === true,
    position: typeof row.position === 'number' ? row.position : 0,
    status: asStatus(row.status),
    assignedTo: asOptionalString(row.assigned_editor),
    internalNotes: asOptionalString(row.editorial_notes),
    scheduledFor: asOptionalString(row.publish_at),
    unpublishAt: asOptionalString(row.unpublish_at),
    riskLevel: ['low', 'medium', 'high'].includes(String(row.risk_level))
      ? (row.risk_level as RiskLevel)
      : undefined,
    factCheckedBy: asOptionalString(row.fact_checked_by),
    factCheckedAt: asOptionalString(row.fact_checked_at),
    medicalReviewedBy: asOptionalString(row.medical_reviewed_by),
    lastContentReviewAt: asOptionalString(row.last_content_review_at),
    nextReviewDueAt: asOptionalString(row.next_review_due_at),
    submittedForReviewAt: asOptionalString(row.submitted_for_review_at),
    submittedForReviewBy: asOptionalString(row.submitted_for_review_by),
    approvedAt: asOptionalString(row.approved_at),
    approvedBy: asOptionalString(row.approved_by),
    publishedAt: asOptionalString(row.published_at),
    publishedBy: asOptionalString(row.published_by),
    archivedAt: asOptionalString(row.archived_at),
    archivedBy: asOptionalString(row.archived_by),
  };
}

function bad(message: string): never {
  throw httpError(400, message, 'INVALID_INPUT');
}

function reqStr(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    bad(`Pole "${field}" je povinné.`);
  }
  return (value as string).trim();
}

function validateBlocks(value: unknown): Block[] {
  if (!Array.isArray(value)) bad('Pole "blocks" musí byť zoznam.');
  return (value as unknown[]).map((raw, i) => {
    if (!raw || typeof raw !== 'object') bad(`Blok #${i + 1} je neplatný.`);
    const b = raw as Record<string, unknown>;
    switch (b.type) {
      case 'paragraph': {
        const out: Block = { type: 'paragraph', text: reqStr(b.text, `blok #${i + 1} text`) };
        if (TEXT_ALIGNS.includes(b.align as TextAlign) && b.align !== 'left') {
          out.align = b.align as TextAlign;
        }
        return out;
      }
      case 'subheading':
        return { type: 'subheading', text: reqStr(b.text, `blok #${i + 1} text`) };
      case 'quote':
        return { type: 'quote', text: reqStr(b.text, `blok #${i + 1} text`) };
      case 'divider':
        return { type: 'divider' };
      case 'bullets': {
        if (!Array.isArray(b.items) || b.items.length === 0) bad(`Blok #${i + 1}: prázdny zoznam.`);
        const out: Block = {
          type: 'bullets',
          items: (b.items as unknown[]).map((it, j) =>
            reqStr(it, `blok #${i + 1} položka #${j + 1}`)
          ),
        };
        if (b.ordered === true) out.ordered = true;
        return out;
      }
      case 'callout': {
        const variant = b.variant as CalloutVariant;
        if (!CALLOUT_VARIANTS.includes(variant)) bad(`Blok #${i + 1}: neplatný variant calloutu.`);
        const out: Block = {
          type: 'callout',
          variant,
          text: reqStr(b.text, `blok #${i + 1} text`),
        };
        if (typeof b.title === 'string' && b.title.trim().length > 0) out.title = b.title.trim();
        return out;
      }
      case 'image': {
        const out: Block = { type: 'image', src: reqStr(b.src, `blok #${i + 1} src`) };
        if (typeof b.alt === 'string' && b.alt.trim().length > 0) out.alt = b.alt.trim();
        if (typeof b.width === 'number' && b.width >= 10 && b.width <= 100) {
          out.width = Math.round(b.width);
        }
        if (typeof b.caption === 'string' && b.caption.trim().length > 0) {
          out.caption = b.caption.trim();
        }
        return out;
      }
      case 'gallery': {
        if (!Array.isArray(b.images) || b.images.length === 0)
          bad(`Blok #${i + 1}: prázdna galéria.`);
        const images = (b.images as unknown[]).map((raw, j) => {
          const img = (raw ?? {}) as Record<string, unknown>;
          const out: { src: string; alt?: string } = {
            src: reqStr(img.src, `blok #${i + 1} obrázok #${j + 1} src`),
          };
          if (typeof img.alt === 'string' && img.alt.trim().length > 0) out.alt = img.alt.trim();
          return out;
        });
        return { type: 'gallery', images };
      }
      case 'embed': {
        const provider = b.provider as EmbedProvider;
        if (!EMBED_PROVIDERS.includes(provider)) bad(`Blok #${i + 1}: neplatný typ embedu.`);
        const out: Block = {
          type: 'embed',
          provider,
          url: reqStr(b.url, `blok #${i + 1} URL`),
        };
        if (typeof b.caption === 'string' && b.caption.trim().length > 0) {
          out.caption = b.caption.trim();
        }
        return out;
      }
      default:
        return bad(`Blok #${i + 1}: neznámy typ.`);
    }
  });
}

function validateSections(value: unknown): ArticleSection[] {
  if (!Array.isArray(value)) bad('Pole "sections" musí byť zoznam.');
  return (value as unknown[]).map((raw, i) => {
    if (!raw || typeof raw !== 'object') bad(`Sekcia #${i + 1} je neplatná.`);
    const s = raw as Record<string, unknown>;
    return {
      // Sekcia bez nadpisu = lead obsah pred prvým H2 (perex/obrázok). Povolené.
      heading: asString(s.heading),
      blocks: validateBlocks(s.blocks),
    };
  });
}

function validateFaqs(value: unknown): FaqItem[] {
  if (value == null) return [];
  if (!Array.isArray(value)) bad('Pole "faqs" musí byť zoznam.');
  return (value as unknown[]).map((raw, i) => {
    const f = (raw ?? {}) as Record<string, unknown>;
    return { q: reqStr(f.q, `FAQ #${i + 1} otázka`), a: reqStr(f.a, `FAQ #${i + 1} odpoveď`) };
  });
}

function validateSources(value: unknown): ArticleSource[] {
  if (value == null) return [];
  if (!Array.isArray(value)) bad('Pole "sources" musí byť zoznam.');
  return (value as unknown[]).map((raw, i) => {
    const s = (raw ?? {}) as Record<string, unknown>;
    return {
      label: reqStr(s.label, `zdroj #${i + 1} názov`),
      url: reqStr(s.url, `zdroj #${i + 1} URL`),
    };
  });
}

// Obsahové stĺpce — status a audit polia sa menia výhradne cez changeArticleStatus.
interface ContentRow {
  slug: string;
  category: string;
  species: string[];
  title: string;
  description: string;
  teaser: string | null;
  intro: string;
  sections: ArticleSection[];
  faqs: FaqItem[];
  related_slugs: string[];
  tags: string[];
  cover_image: string | null;
  cta_intent: string;
  author: string | null;
  sources: ArticleSource[];
  updated: string;
  position: number;
  assigned_editor: string | null;
  editorial_notes: string | null;
  cover_alt: string | null;
  cover_credit: string | null;
  risk_level: RiskLevel | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reviewer_title: string | null;
  fact_checked_by: string | null;
  fact_checked_at: string | null;
  medical_reviewed_by: string | null;
  medical_reviewed_at: string | null;
  last_content_review_at: string | null;
  next_review_due_at: string | null;
  disclaimer: string | null;
}

function optionalStr(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function optionalIso(value: unknown, field: string): string | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') bad(`Pole "${field}" musí byť dátum.`);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) bad(`Pole "${field}" má neplatný dátum.`);
  return d.toISOString();
}

function toRow(input: unknown): ContentRow {
  if (!input || typeof input !== 'object') bad('Telo požiadavky musí byť objekt.');
  const a = input as Record<string, unknown>;

  const slug = reqStr(a.slug, 'slug').toLowerCase();
  if (!SLUG_RE.test(slug)) bad('Slug smie obsahovať len malé písmená, číslice a pomlčky.');

  const category = reqStr(a.category, 'category');
  if (category !== 'krmivo' && category !== 'zdravie')
    bad('Kategória musí byť "krmivo" alebo "zdravie".');

  return {
    slug,
    category,
    species: Array.isArray(a.species)
      ? (a.species as unknown[]).filter(
          (s): s is string =>
            typeof s === 'string' && (ANIMAL_SPECIES as readonly string[]).includes(s)
        )
      : [],
    // Titulok a popis nie sú povinné pri ukladaní konceptu — povinné sú až pred
    // publikovaním (viď articleValidation.ts). Umožňuje uložiť rozpracovaný článok.
    title: asString(a.title),
    description: asString(a.description),
    teaser: optionalStr(a.teaser),
    // Perex = prvý odsek tela; samostatný `intro` je voliteľný (legacy obsah).
    intro: asString(a.intro),
    sections: validateSections(a.sections),
    faqs: validateFaqs(a.faqs),
    related_slugs: Array.isArray(a.relatedSlugs)
      ? (a.relatedSlugs as unknown[]).filter((s): s is string => typeof s === 'string')
      : [],
    tags: Array.isArray(a.tags)
      ? (a.tags as unknown[])
          .filter((s): s is string => typeof s === 'string')
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : [],
    cover_image:
      typeof a.coverImage === 'string' && a.coverImage.trim().length > 0
        ? a.coverImage.trim()
        : null,
    cover_alt:
      typeof a.coverAlt === 'string' && a.coverAlt.trim().length > 0 ? a.coverAlt.trim() : null,
    cover_credit: optionalStr(a.coverCredit),
    cta_intent: reqStr(a.ctaIntent, 'ctaIntent'),
    author: typeof a.author === 'string' && a.author.trim().length > 0 ? a.author.trim() : null,
    sources: validateSources(a.sources),
    updated:
      typeof a.updated === 'string' && a.updated.trim().length > 0
        ? a.updated.trim()
        : new Date().toISOString().slice(0, 10),
    position: typeof a.position === 'number' && Number.isFinite(a.position) ? a.position : 0,
    assigned_editor:
      typeof a.assignedTo === 'string' && a.assignedTo.trim().length > 0
        ? a.assignedTo.trim()
        : null,
    editorial_notes:
      typeof a.internalNotes === 'string' && a.internalNotes.trim().length > 0
        ? a.internalNotes.trim()
        : null,
    risk_level: ['low', 'medium', 'high'].includes(String(a.riskLevel))
      ? (a.riskLevel as RiskLevel)
      : null,
    reviewed_by: optionalStr(a.reviewedBy),
    reviewed_at: optionalIso(a.reviewedAt, 'reviewedAt'),
    reviewer_title: optionalStr(a.reviewerTitle),
    fact_checked_by: optionalStr(a.factCheckedBy),
    fact_checked_at: optionalIso(a.factCheckedAt, 'factCheckedAt'),
    medical_reviewed_by: optionalStr(a.medicalReviewedBy),
    medical_reviewed_at: optionalIso(a.medicalReviewedAt, 'medicalReviewedAt'),
    last_content_review_at: optionalIso(a.lastContentReviewAt, 'lastContentReviewAt'),
    next_review_due_at: optionalIso(a.nextReviewDueAt, 'nextReviewDueAt'),
    disclaimer: optionalStr(a.disclaimer),
  };
}

export async function listAllArticles(): Promise<AdminArticle[]> {
  const { data, error } = await getSupabase()
    .from('articles')
    .select(SELECT_COLUMNS_ADMIN)
    .order('position', { ascending: true });
  if (error) throw error;
  return ((data as Row[] | null) ?? []).map(rowToAdminArticle);
}

export async function listAllArticlesWithId(): Promise<{ id: string; article: AdminArticle }[]> {
  const { data, error } = await getSupabase()
    .from('articles')
    .select(`id, ${SELECT_COLUMNS_ADMIN}`)
    .order('position', { ascending: true });
  if (error) throw error;
  return ((data as Row[] | null) ?? []).map((row) => ({
    id: String(row.id),
    article: rowToAdminArticle(row),
  }));
}

export async function getArticleBySlugAdmin(slug: string): Promise<AdminArticle | null> {
  const { data, error } = await getSupabase()
    .from('articles')
    .select(SELECT_COLUMNS_ADMIN)
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToAdminArticle(data as Row) : null;
}

export async function createArticle(input: unknown): Promise<AdminArticle> {
  // Nový článok vždy začína ako koncept; stav sa odvtedy mení len cez workflow.
  const row = { ...toRow(input), status: 'draft' as ArticleStatus, published: false };
  const { data, error } = await getSupabase()
    .from('articles')
    .insert(row)
    .select(SELECT_COLUMNS_ADMIN)
    .single();
  if (error) {
    if ((error as { code?: string }).code === '23505') {
      throw httpError(409, 'Článok s týmto slugom už existuje.', 'SLUG_EXISTS');
    }
    throw error;
  }
  return rowToAdminArticle(data as Row);
}

export async function updateArticle(slug: string, input: unknown): Promise<AdminArticle> {
  const row = toRow({ ...(input as object), slug });
  const { data, error } = await getSupabase()
    .from('articles')
    .update(row)
    .eq('slug', slug)
    .select(SELECT_COLUMNS_ADMIN)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw httpError(404, 'Článok sa nenašiel.', 'NOT_FOUND');
  return rowToAdminArticle(data as Row);
}

export async function getExistingSlugs(): Promise<Set<string>> {
  const { data, error } = await getSupabase().from('articles').select('slug');
  if (error) throw error;
  return new Set(
    ((data as Row[] | null) ?? []).map((r) => String(r.slug)).filter((s) => s.length > 0)
  );
}

export async function changeArticleStatus(
  slug: string,
  target: ArticleStatus,
  opts: { by?: string | null; scheduledFor?: unknown; bypassTransition?: boolean } = {}
): Promise<AdminArticle> {
  if (!ARTICLE_STATUSES.includes(target)) bad('Neplatný cieľový stav.');

  const current = await getArticleBySlugAdmin(slug);
  if (!current) throw httpError(404, 'Článok sa nenašiel.', 'NOT_FOUND');
  if (current.status === target) return current;

  if (!opts.bypassTransition && !isTransitionAllowed(current.status, target)) {
    throw httpError(
      400,
      `Prechod „${current.status}" → „${target}" nie je povolený.`,
      'INVALID_TRANSITION'
    );
  }

  const by = typeof opts.by === 'string' && opts.by.length > 0 ? opts.by : null;
  const nowIso = new Date().toISOString();
  const patch: Row = { status: target, published: target === 'published' };

  if (target === 'scheduled') {
    const when = optionalIso(opts.scheduledFor, 'scheduledFor');
    if (!when) bad('Pre naplánovanie je potrebný dátum publikovania.');
    patch.publish_at = when;
  }
  if (target === 'published') {
    patch.published_at = nowIso;
    patch.published_by = by;
  }
  if (target === 'in_review') {
    patch.submitted_for_review_at = nowIso;
    patch.submitted_for_review_by = by;
  }
  if (target === 'approved') {
    patch.approved_at = nowIso;
    patch.approved_by = by;
  }
  if (target === 'archived') {
    patch.archived_at = nowIso;
    patch.archived_by = by;
  }

  const { data, error } = await getSupabase()
    .from('articles')
    .update(patch)
    .eq('slug', slug)
    .select(SELECT_COLUMNS_ADMIN)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw httpError(404, 'Článok sa nenašiel.', 'NOT_FOUND');
  return rowToAdminArticle(data as Row);
}

export async function deleteArticle(slug: string): Promise<void> {
  const { error } = await getSupabase().from('articles').delete().eq('slug', slug);
  if (error) throw error;
}
