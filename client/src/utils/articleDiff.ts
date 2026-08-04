import type { AdminArticle, Block } from '../content/poradna/types';

export type DiffType = 'same' | 'add' | 'remove';

export interface DiffLine {
  type: DiffType;
  text: string;
}

function blockToLines(block: Block): string[] {
  switch (block.type) {
    case 'paragraph':
      return [block.text];
    case 'subheading':
      return [`### ${block.text}`];
    case 'quote':
      return [`> ${block.text}`];
    case 'divider':
      return ['———'];
    case 'bullets':
      return block.items.map((it, i) => (block.ordered ? `${i + 1}. ${it}` : `• ${it}`));
    case 'callout':
      return [`[${block.variant}${block.title ? ` · ${block.title}` : ''}] ${block.text}`];
    default:
      return [];
  }
}

// Plochá textová reprezentácia článku pre riadkový diff.
export function articleToLines(article: AdminArticle): string[] {
  const lines: string[] = [`# ${article.title}`];
  if (article.intro.trim()) lines.push(article.intro);
  article.sections.forEach((section) => {
    lines.push(`## ${section.heading}`);
    section.blocks.forEach((block) => lines.push(...blockToLines(block)));
  });
  return lines;
}

// Riadkový diff cez LCS (longest common subsequence).
export function diffLines(oldLines: string[], newLines: string[]): DiffLine[] {
  const n = oldLines.length;
  const m = newLines.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));

  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] =
        oldLines[i] === newLines[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (oldLines[i] === newLines[j]) {
      result.push({ type: 'same', text: oldLines[i] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: 'remove', text: oldLines[i] });
      i += 1;
    } else {
      result.push({ type: 'add', text: newLines[j] });
      j += 1;
    }
  }
  while (i < n) {
    result.push({ type: 'remove', text: oldLines[i] });
    i += 1;
  }
  while (j < m) {
    result.push({ type: 'add', text: newLines[j] });
    j += 1;
  }
  return result;
}
