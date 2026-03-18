import { Fragment } from 'react';
import { Box, List, ListItem, ListItemText, Typography } from '@mui/material';

type AiFormattedTextProps = {
  text: string;
};

function renderInlineFormatting(input: string) {
  const parts = input.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Box key={`${part}-${index}`} component="span" sx={{ fontWeight: 700 }}>
          {part.slice(2, -2)}
        </Box>
      );
    }

    return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
}

export default function AiFormattedText({ text }: AiFormattedTextProps) {
  const lines = text.split('\n');

  return (
    <Box sx={{ mt: 1 }}>
      {lines.map((rawLine, index) => {
        const line = rawLine.trim();

        if (!line) {
          return <Box key={`empty-${index}`} sx={{ height: 8 }} />;
        }

        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
          return (
            <Typography key={`heading-${index}`} variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>
              {renderInlineFormatting(headingMatch[2])}
            </Typography>
          );
        }

        const numberedListMatch = line.match(/^(\d+)[.)]\s+(.+)$/);
        if (numberedListMatch) {
          return (
            <List key={`ordered-${index}`} dense disablePadding sx={{ pl: 2, listStyleType: 'decimal', display: 'list-item' }}>
              <ListItem sx={{ display: 'list-item', py: 0 }}>
                <ListItemText
                  primaryTypographyProps={{ variant: 'body2', sx: { m: 0 } }}
                  primary={renderInlineFormatting(numberedListMatch[2])}
                />
              </ListItem>
            </List>
          );
        }

        const bulletListMatch = line.match(/^[-*•]\s+(.+)$/);
        if (bulletListMatch) {
          return (
            <List key={`bullet-${index}`} dense disablePadding sx={{ pl: 2, listStyleType: 'disc', display: 'list-item' }}>
              <ListItem sx={{ display: 'list-item', py: 0 }}>
                <ListItemText
                  primaryTypographyProps={{ variant: 'body2', sx: { m: 0 } }}
                  primary={renderInlineFormatting(bulletListMatch[1])}
                />
              </ListItem>
            </List>
          );
        }

        return (
          <Typography key={`line-${index}`} variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {renderInlineFormatting(rawLine)}
          </Typography>
        );
      })}
    </Box>
  );
}
