import { Fragment } from 'react';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography, useTheme } from '@mui/material';

type AiFormattedTextProps = {
  text: string;
};

// ── Inline bold: **text** ──────────────────────────────────────
function renderInline(input: string) {
  const parts = input.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
          ? <Box key={i} component="span" sx={{ fontWeight: 700 }}>{part.slice(2, -2)}</Box>
          : <Fragment key={i}>{part}</Fragment>,
  );
}

// ── Detect if a line looks like a markdown table row ──────────
function isTableRow(line: string) {
  return line.trimStart().startsWith('|') && line.trimEnd().endsWith('|');
}

function isSeparatorRow(line: string) {
  // e.g.  |---|---|---|
  return isTableRow(line) && /^\|[\s|:-]+\|$/.test(line.trim());
}

function parseCells(line: string): string[] {
  return line
      .trim()
      .replace(/^\||\|$/g, '')   // strip leading/trailing pipes
      .split('|')
      .map((c) => c.trim());
}

// ── Group consecutive lines into blocks ───────────────────────
type Block =
    | { kind: 'paragraph'; lines: string[] }
    | { kind: 'ul'; items: string[] }
    | { kind: 'ol'; items: string[] }
    | { kind: 'heading'; level: number; text: string }
    | { kind: 'table'; header: string[]; rows: string[][] }
    | { kind: 'empty' };

function parseBlocks(raw: string): Block[] {
  const normalized = raw.replace(/\\n/g, '\n');
  const lines = normalized.split('\n');

  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      blocks.push({ kind: 'empty' });
      i++;
      continue;
    }

    // Heading
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({ kind: 'heading', level: headingMatch[1].length, text: headingMatch[2] });
      i++;
      continue;
    }

    // Markdown table — collect header + separator + rows
    if (isTableRow(trimmed)) {
      const tableLines: string[] = [];
      while (i < lines.length && isTableRow(lines[i].trim())) {
        tableLines.push(lines[i]);
        i++;
      }
      // Filter out separator rows, first real row = header
      const dataRows = tableLines.filter((l) => !isSeparatorRow(l));
      if (dataRows.length >= 1) {
        const [headerRow, ...bodyRows] = dataRows;
        blocks.push({
          kind: 'table',
          header: parseCells(headerRow),
          rows: bodyRows.map(parseCells),
        });
      }
      continue;
    }

    // Unordered list item
    const ulMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    if (ulMatch) {
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        const m = t.match(/^[-*•]\s+(.+)$/);
        if (m) { items.push(m[1]); i++; }
        else if (!t) { i++; break; }
        else break;
      }
      blocks.push({ kind: 'ul', items });
      continue;
    }

    // Ordered list item — match "1." "1)" etc., grab only the text after the marker
    const olMatch = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (olMatch) {
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        const m = t.match(/^\d+[.)]\s+(.+)$/);
        if (m) { items.push(m[1]); i++; }
        else if (!t) { i++; break; }
        else break;
      }
      blocks.push({ kind: 'ol', items });
      continue;
    }

    // Plain paragraph — collect consecutive non-special lines
    const paraLines: string[] = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t) break;
      if (t.match(/^#{1,6}\s/) || isTableRow(t) || t.match(/^[-*•]\s/) || t.match(/^\d+[.)]\s/)) break;
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length) blocks.push({ kind: 'paragraph', lines: paraLines });
  }

  return blocks;
}

export default function AiFormattedText({ text }: AiFormattedTextProps) {
  const theme = useTheme();
  const blocks = parseBlocks(text);

  return (
      <Box sx={{ '& > *:first-of-type': { mt: 0 } }}>
        {blocks.map((block, idx) => {
          if (block.kind === 'empty') {
            return <Box key={idx} sx={{ height: 6 }} />;
          }

          if (block.kind === 'heading') {
            const variantMap = ['h6', 'subtitle1', 'subtitle2', 'subtitle2', 'subtitle2', 'subtitle2'] as const;
            return (
                <Typography
                    key={idx}
                    variant={variantMap[block.level - 1] ?? 'subtitle2'}
                    sx={{ fontWeight: 700, mt: idx === 0 ? 0 : 1.5, mb: 0.5, color: 'text.primary' }}
                >
                  {renderInline(block.text)}
                </Typography>
            );
          }

          if (block.kind === 'paragraph') {
            return (
                <Typography
                    key={idx}
                    variant="body2"
                    sx={{ mt: idx === 0 ? 0 : 0.75, lineHeight: 1.65, color: 'text.primary', whiteSpace: 'pre-wrap' }}
                >
                  {renderInline(block.lines.join('\n'))}
                </Typography>
            );
          }

          if (block.kind === 'ul') {
            return (
                <Box key={idx} component="ul" sx={{ m: 0, mt: idx === 0 ? 0 : 0.75, pl: 2.5, listStyle: 'none' }}>
                  {block.items.map((item, j) => (
                      <Box
                          key={j}
                          component="li"
                          sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 0.4 }}
                      >
                        <Box
                            component="span"
                            sx={{
                              width: 5, height: 5,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              flexShrink: 0,
                              mt: '7px',
                            }}
                        />
                        <Typography variant="body2" sx={{ lineHeight: 1.65, color: 'text.primary' }}>
                          {renderInline(item)}
                        </Typography>
                      </Box>
                  ))}
                </Box>
            );
          }

          if (block.kind === 'ol') {
            return (
                <Box key={idx} component="ol" sx={{ m: 0, mt: idx === 0 ? 0 : 0.75, pl: 0, listStyle: 'none' }}>
                  {block.items.map((item, j) => (
                      <Box
                          key={j}
                          component="li"
                          sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start', mb: 0.4 }}
                      >
                        <Box
                            component="span"
                            sx={{
                              minWidth: 22, height: 22,
                              borderRadius: '50%',
                              bgcolor: 'rgba(34,197,94,0.12)',
                              color: 'success.main',
                              fontSize: 11,
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              mt: '1px',
                            }}
                        >
                          {j + 1}
                        </Box>
                        <Typography variant="body2" sx={{ lineHeight: 1.65, color: 'text.primary', pt: '2px' }}>
                          {renderInline(item)}
                        </Typography>
                      </Box>
                  ))}
                </Box>
            );
          }

          if (block.kind === 'table') {
            return (
                <Box
                    key={idx}
                    sx={{
                      mt: idx === 0 ? 0 : 1,
                      mb: 0.5,
                      overflowX: 'auto',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                >
                  <Table size="small" sx={{ minWidth: 300 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'action.selected' }}>
                        {block.header.map((cell, j) => (
                            <TableCell
                                key={j}
                                sx={{
                                  fontWeight: 700,
                                  fontSize: 12,
                                  letterSpacing: '0.04em',
                                  color: 'text.primary',
                                  borderBottom: `1px solid ${theme.palette.divider}`,
                                  py: 1, px: 1.5,
                                  whiteSpace: 'nowrap',
                                }}
                            >
                              {renderInline(cell)}
                            </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {block.rows.map((row, j) => (
                          <TableRow
                              key={j}
                              sx={{
                                '&:last-child td': { borderBottom: 0 },
                                '&:hover': { bgcolor: 'action.hover' },
                              }}
                          >
                            {row.map((cell, k) => (
                                <TableCell
                                    key={k}
                                    sx={{
                                      fontSize: 13,
                                      color: 'text.primary',
                                      py: 0.9, px: 1.5,
                                      borderBottom: `1px solid ${theme.palette.divider}`,
                                      verticalAlign: 'top',
                                    }}
                                >
                                  {renderInline(cell)}
                                </TableCell>
                            ))}
                          </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
            );
          }

          return null;
        })}
      </Box>
  );
}