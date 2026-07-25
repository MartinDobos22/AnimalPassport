import type { FaqItem } from '../../utils/seoSchema';
import type { OnboardingIntent } from '../../utils/onboardingIntent';
import type { AnimalType } from '../../constants/animalSpecies';

export type ArticleCategory = 'krmivo' | 'zdravie';

export type CalloutVariant = 'tip' | 'warning' | 'info';

export type TextAlign = 'left' | 'center' | 'right';

export type EmbedProvider = 'facebook' | 'youtube' | 'instagram';

export type Block =
  | { type: 'paragraph'; text: string; align?: TextAlign }
  | { type: 'bullets'; ordered?: boolean; items: string[] }
  | { type: 'subheading'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'divider' }
  | { type: 'callout'; variant: CalloutVariant; title?: string; text: string }
  | { type: 'image'; src: string; alt?: string; width?: number; caption?: string }
  | { type: 'gallery'; images: { src: string; alt?: string }[] }
  | { type: 'embed'; provider: EmbedProvider; url: string; caption?: string };

export interface ArticleSection {
  heading: string;
  blocks: Block[];
}

export interface ArticleSource {
  label: string;
  url: string;
}

export interface Article {
  slug: string;
  category: ArticleCategory;
  /** Druh(y) zvieraťa, ktorých sa článok týka — verejný filter popri kategórii. */
  species?: AnimalType[];
  title: string;
  /** Meta description + perex v zozname. */
  description: string;
  /** Krátky pútací text na kartu v zozname (fallback na description). */
  teaser?: string;
  /** Úvodný odsek pod H1. */
  intro: string;
  sections: ArticleSection[];
  faqs?: FaqItem[];
  relatedSlugs?: string[];
  /** Hashtagy / kľúčové slová pre SEO a filtrovanie. */
  tags?: string[];
  /** ISO dátum poslednej aktualizácie (pre Article schema). */
  updated: string;
  /** URL titulného obrázka (zatiaľ Unsplash placeholder, neskôr vlastné). */
  coverImage?: string;
  /** Alt text titulného obrázka (prístupnosť + og:image:alt). */
  coverAlt?: string;
  /** Zdroj/kredit titulného obrázka — popisok pod obrázkom (napr. „Zdroj: Unsplash"). */
  coverCredit?: string;
  /** CTA na konci článku → registrácia s daným intentom. */
  ctaIntent: OnboardingIntent;
  // Odborná kontrola — verejne zobraziteľné.
  reviewedBy?: string;
  reviewedAt?: string;
  reviewerTitle?: string;
  medicalReviewedAt?: string;
  /** Per-article disclaimer; ak chýba, použije sa globálny ARTICLE_DISCLAIMER. */
  disclaimer?: string;
  /** Autorský riadok (E-E-A-T). Default „Tím Pawly" ak chýba. */
  author?: string;
  /** Zdroje (E-E-A-T) — externé odkazy na konci článku. */
  sources?: ArticleSource[];
}

export type RiskLevel = 'low' | 'medium' | 'high';

export type ArticleStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'archived';

/** Admin pohľad na článok — navyše redakčný workflow + poradie. */
export interface AdminArticle extends Article {
  /** Verejná viditeľnosť — odvodené zo status (published <=> status='published'). */
  published: boolean;
  position: number;
  status: ArticleStatus;
  assignedTo?: string;
  internalNotes?: string;
  /** Naplánovaný čas publikovania. */
  scheduledFor?: string;
  unpublishAt?: string;
  // Audit — kto a kedy vykonal prechod do daného stavu.
  submittedForReviewAt?: string;
  submittedForReviewBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  publishedAt?: string;
  publishedBy?: string;
  archivedAt?: string;
  archivedBy?: string;
  // Odborná kontrola — interné.
  riskLevel?: RiskLevel;
  factCheckedBy?: string;
  factCheckedAt?: string;
  medicalReviewedBy?: string;
  lastContentReviewAt?: string;
  nextReviewDueAt?: string;
}

export type ArticleVersionKind = 'manual' | 'autosave' | 'publish' | 'restore';

/** Metadáta verzie článku (bez plného snapshotu) — pre zoznam histórie. */
export interface ArticleVersionMeta {
  id: string;
  versionNumber: number;
  kind: ArticleVersionKind;
  changeSummary: string | null;
  createdBy: string | null;
  createdAt: string;
}

/** Plná verzia vrátane snapshotu dát článku. */
export interface ArticleVersion extends ArticleVersionMeta {
  data: AdminArticle;
}

export type ArticleEventType =
  | 'view'
  | 'cta_click'
  | 'scroll_50'
  | 'scroll_90'
  | 'related_click'
  | 'source_click';

export interface ArticleMetrics {
  slug: string;
  views: number;
  ctaClicks: number;
  scroll50: number;
  scroll90: number;
  relatedClicks: number;
  sourceClicks: number;
  ctr: number;
}

export type ArticleAiType =
  | 'outline'
  | 'rewrite'
  | 'meta_description'
  | 'faq'
  | 'summary'
  | 'source_check';

export interface ArticleAiResult {
  generationId: string;
  type: ArticleAiType;
  text?: string;
  faqs?: { q: string; a: string }[];
  headings?: string[];
}

export interface AiGenerationLog {
  id: string;
  type: ArticleAiType;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCost: number | null;
  createdAt: string;
  userEmail: string | null;
}

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
