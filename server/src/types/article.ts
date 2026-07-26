// Verejné články poradne — server-side zrkadlo klientských typov
// (client/src/content/poradna/types.ts). Drift pravidlo: pri zmene tvaru
// uprav typy na oboch stranách aj SQL migráciu/seed.

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

export interface FaqItem {
  q: string;
  a: string;
}

export interface ArticleSource {
  label: string;
  url: string;
}

export interface Article {
  slug: string;
  category: ArticleCategory;
  /** Druh(y) zvieraťa, ktorých sa článok týka — verejný filter popri kategórii. */
  species?: string[];
  title: string;
  description: string;
  /** Krátky pútací text na kartu v zozname (fallback na description). */
  teaser?: string;
  intro: string;
  sections: ArticleSection[];
  faqs?: FaqItem[];
  relatedSlugs?: string[];
  /** Hashtagy / kľúčové slová pre SEO a filtrovanie. */
  tags?: string[];
  updated: string;
  coverImage?: string;
  /** Alt text titulného obrázka (prístupnosť + og:image:alt). */
  coverAlt?: string;
  /** Zdroj/kredit titulného obrázka — popisok pod obrázkom (napr. „Zdroj: Unsplash"). */
  coverCredit?: string;
  ctaIntent: string;
  // Odborná kontrola — verejne zobraziteľné polia.
  reviewedBy?: string;
  reviewedAt?: string;
  reviewerTitle?: string;
  medicalReviewedAt?: string;
  /** Per-article disclaimer; ak chýba, použije sa globálny ARTICLE_DISCLAIMER. */
  disclaimer?: string;
  author?: string;
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

// Admin pohľad — navyše stavové polia (redakčný workflow + poradie).
export interface AdminArticle extends Article {
  /** Verejná viditeľnosť — odvodené zo status (published <=> status='published'). */
  published: boolean;
  position: number;
  status: ArticleStatus;
  assignedTo?: string;
  internalNotes?: string;
  /** Naplánovaný čas publikovania (stĺpec publish_at). */
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
  // Odborná kontrola — interné polia.
  riskLevel?: RiskLevel;
  factCheckedBy?: string;
  factCheckedAt?: string;
  medicalReviewedBy?: string;
  lastContentReviewAt?: string;
  nextReviewDueAt?: string;
}
