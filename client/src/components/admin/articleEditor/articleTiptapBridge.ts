import type { JSONContent } from '@tiptap/react';
import type {
  ArticleSection,
  Block,
  CalloutVariant,
  EmbedProvider,
} from '../../../content/poradna/types';

const EMBED_PROVIDERS: readonly EmbedProvider[] = ['facebook', 'youtube', 'instagram'];

// Most medzi TipTap dokumentom a štruktúrovaným modelom článku (ArticleSection[]).
// Editor pracuje vizuálne (WYSIWYG), ale ukladá sa do existujúceho typovaného
// modelu, takže SEO schéma, prerender aj DB ostávajú nedotknuté.
//
// Mapovanie:
//   H2            ↔ ArticleSection.heading
//   H3            ↔ Block 'subheading'
//   paragraph     ↔ Block 'paragraph'
//   bulletList    ↔ Block 'bullets'
//   callout (node)↔ Block 'callout'
//
// Inline formát odseku/odrážok/boxu sa serializuje do markdown-lite
// (`**tučné**`, `[text](url)`), ktorý vie renderovať RichText. Nadpisy (H2/H3)
// sa ukladajú ako čistý text — ArticleBody ich nerenderuje cez RichText.

const VARIANTS: readonly CalloutVariant[] = ['tip', 'warning', 'info'];

function asVariant(value: unknown): CalloutVariant {
  return VARIANTS.includes(value as CalloutVariant) ? (value as CalloutVariant) : 'tip';
}

// --- Inline (TipTap text nodes) → reťazec ---------------------------------

function inlineToPlain(content: JSONContent[] | undefined): string {
  if (!content) return '';
  return content.map((n) => (n.type === 'text' ? (n.text ?? '') : '')).join('');
}

function inlineToMarkdown(content: JSONContent[] | undefined): string {
  if (!content) return '';
  return content
    .map((node) => {
      if (node.type !== 'text') return '';
      const text = node.text ?? '';
      if (!text) return '';
      const marks = node.marks ?? [];
      const link = marks.find((m) => m.type === 'link');
      if (link && typeof link.attrs?.href === 'string') {
        return `[${text}](${link.attrs.href})`;
      }
      // RichText nepodporuje vnorené značky — zvolíme jednu podľa priority.
      if (marks.some((m) => m.type === 'bold')) return `**${text}**`;
      if (marks.some((m) => m.type === 'italic')) return `*${text}*`;
      if (marks.some((m) => m.type === 'underline')) return `__${text}__`;
      if (marks.some((m) => m.type === 'strike')) return `~~${text}~~`;
      return text;
    })
    .join('');
}

// --- Reťazec (markdown-lite) → inline TipTap text nodes -------------------

const TOKEN = /(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;

function markdownToInline(text: string): JSONContent[] {
  if (!text) return [];
  const parts = text.split(TOKEN);
  const nodes: JSONContent[] = [];
  parts.forEach((part, i) => {
    if (!part) return;
    const isToken = i % 2 === 1;
    if (!isToken) {
      nodes.push({ type: 'text', text: part });
      return;
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      nodes.push({ type: 'text', text: part.slice(2, -2), marks: [{ type: 'bold' }] });
      return;
    }
    if (part.startsWith('__') && part.endsWith('__')) {
      nodes.push({ type: 'text', text: part.slice(2, -2), marks: [{ type: 'underline' }] });
      return;
    }
    if (part.startsWith('~~') && part.endsWith('~~')) {
      nodes.push({ type: 'text', text: part.slice(2, -2), marks: [{ type: 'strike' }] });
      return;
    }
    const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      nodes.push({ type: 'text', text: label, marks: [{ type: 'link', attrs: { href } }] });
      return;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      nodes.push({ type: 'text', text: part.slice(1, -1), marks: [{ type: 'italic' }] });
      return;
    }
    nodes.push({ type: 'text', text: part });
  });
  return nodes;
}

function plainTextNode(text: string): JSONContent[] {
  return text ? [{ type: 'text', text }] : [];
}

// --- ArticleSection[] → TipTap dokument -----------------------------------

function blockToNodes(block: Block): JSONContent[] {
  switch (block.type) {
    case 'paragraph':
      return [
        {
          type: 'paragraph',
          ...(block.align ? { attrs: { textAlign: block.align } } : {}),
          content: markdownToInline(block.text),
        },
      ];
    case 'subheading':
      return [{ type: 'heading', attrs: { level: 3 }, content: plainTextNode(block.text) }];
    case 'quote':
      return [
        {
          type: 'blockquote',
          content: [{ type: 'paragraph', content: markdownToInline(block.text) }],
        },
      ];
    case 'divider':
      return [{ type: 'horizontalRule' }];
    case 'bullets':
      return [
        {
          type: block.ordered ? 'orderedList' : 'bulletList',
          content: block.items.map((item) => ({
            type: 'listItem',
            content: [{ type: 'paragraph', content: markdownToInline(item) }],
          })),
        },
      ];
    case 'callout':
      return [
        {
          type: 'callout',
          attrs: { variant: block.variant, title: block.title ?? '' },
          content: markdownToInline(block.text),
        },
      ];
    case 'image':
      return [
        {
          type: 'image',
          attrs: {
            src: block.src,
            alt: block.alt ?? null,
            width: block.width ?? null,
            caption: block.caption ?? null,
          },
        },
      ];
    case 'gallery':
      return [{ type: 'gallery', attrs: { images: block.images } }];
    case 'embed':
      return [
        {
          type: 'embed',
          attrs: { provider: block.provider, url: block.url, caption: block.caption ?? null },
        },
      ];
  }
}

export function sectionsToTiptap(sections: ArticleSection[]): JSONContent {
  const content: JSONContent[] = [];
  sections.forEach((section) => {
    content.push({
      type: 'heading',
      attrs: { level: 2 },
      content: plainTextNode(section.heading),
    });
    section.blocks.forEach((block) => content.push(...blockToNodes(block)));
  });
  if (content.length === 0) {
    content.push({ type: 'paragraph' });
  }
  return { type: 'doc', content };
}

// --- TipTap dokument → ArticleSection[] -----------------------------------

function nodeToBlock(node: JSONContent): Block | null {
  switch (node.type) {
    case 'paragraph': {
      const text = inlineToMarkdown(node.content);
      if (!text.trim()) return null;
      const align = node.attrs?.textAlign;
      return align === 'center' || align === 'right'
        ? { type: 'paragraph', text, align }
        : { type: 'paragraph', text };
    }
    case 'blockquote': {
      const text = (node.content ?? [])
        .filter((c) => c.type === 'paragraph')
        .map((p) => inlineToMarkdown(p.content))
        .filter((t) => t.trim().length > 0)
        .join('\n');
      if (!text.trim()) return null;
      return { type: 'quote', text };
    }
    case 'horizontalRule':
      return { type: 'divider' };
    case 'heading': {
      if (node.attrs?.level !== 3) return null;
      const text = inlineToPlain(node.content).trim();
      if (!text) return null;
      return { type: 'subheading', text };
    }
    case 'bulletList':
    case 'orderedList': {
      const items = (node.content ?? [])
        .map((li) => {
          const para = (li.content ?? []).find((c) => c.type === 'paragraph');
          return inlineToMarkdown(para?.content);
        })
        .filter((item) => item.trim().length > 0);
      if (items.length === 0) return null;
      return node.type === 'orderedList'
        ? { type: 'bullets', ordered: true, items }
        : { type: 'bullets', items };
    }
    case 'callout': {
      const text = inlineToMarkdown(node.content);
      const title = typeof node.attrs?.title === 'string' ? node.attrs.title.trim() : '';
      return {
        type: 'callout',
        variant: asVariant(node.attrs?.variant),
        ...(title ? { title } : {}),
        text,
      };
    }
    case 'image': {
      const src = typeof node.attrs?.src === 'string' ? node.attrs.src : '';
      if (!src) return null;
      const alt =
        typeof node.attrs?.alt === 'string' && node.attrs.alt ? node.attrs.alt : undefined;
      const rawWidth = node.attrs?.width;
      const width =
        typeof rawWidth === 'number' && rawWidth >= 10 && rawWidth <= 100
          ? Math.round(rawWidth)
          : undefined;
      const caption =
        typeof node.attrs?.caption === 'string' && node.attrs.caption.trim()
          ? node.attrs.caption.trim()
          : undefined;
      return {
        type: 'image',
        src,
        ...(alt ? { alt } : {}),
        ...(width ? { width } : {}),
        ...(caption ? { caption } : {}),
      };
    }
    case 'gallery': {
      const raw = Array.isArray(node.attrs?.images) ? node.attrs.images : [];
      const images = raw
        .filter(
          (im): im is { src: string; alt?: string } => Boolean(im) && typeof im.src === 'string'
        )
        .map((im) => (im.alt ? { src: im.src, alt: im.alt } : { src: im.src }));
      if (images.length === 0) return null;
      return { type: 'gallery', images };
    }
    case 'embed': {
      const provider = node.attrs?.provider;
      const url = typeof node.attrs?.url === 'string' ? node.attrs.url.trim() : '';
      if (!url || !EMBED_PROVIDERS.includes(provider as EmbedProvider)) return null;
      const caption =
        typeof node.attrs?.caption === 'string' && node.attrs.caption.trim()
          ? node.attrs.caption.trim()
          : undefined;
      return {
        type: 'embed',
        provider: provider as EmbedProvider,
        url,
        ...(caption ? { caption } : {}),
      };
    }
    default:
      return null;
  }
}

export function tiptapToSections(doc: JSONContent): ArticleSection[] {
  const nodes = doc.content ?? [];
  const sections: ArticleSection[] = [];
  let current: ArticleSection | null = null;

  const ensureSection = () => {
    if (!current) {
      current = { heading: '', blocks: [] };
      sections.push(current);
    }
    return current;
  };

  nodes.forEach((node) => {
    if (node.type === 'heading' && node.attrs?.level === 2) {
      current = { heading: inlineToPlain(node.content).trim(), blocks: [] };
      sections.push(current);
      return;
    }
    const block = nodeToBlock(node);
    if (block) ensureSection().blocks.push(block);
  });

  return sections.filter((s) => s.heading.trim().length > 0 || s.blocks.length > 0);
}
