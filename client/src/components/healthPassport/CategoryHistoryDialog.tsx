import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Dialog, DialogContent, IconButton, Stack, Typography, alpha } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { formatDateShort } from '../../utils/relativeDate';

export interface CategoryHistoryEntry {
  id: string;
  /** ISO date used for sorting + display. */
  date: string;
  /** Product / what was administered. */
  product: string;
  /** Secondary line, e.g. "platné do …" / "ďalší termín …". */
  meta?: string;
  note?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  accentColor: string;
  icon: ReactElement;
  entries: CategoryHistoryEntry[];
  onOpenEntry?: (id: string) => void;
}

export default function CategoryHistoryDialog({
  open,
  onClose,
  title,
  accentColor,
  icon,
  entries,
  onOpenEntry,
}: Props) {
  const { t } = useTranslation('healthPassport');
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, backgroundImage: 'none' } }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 3,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            bgcolor: alpha(accentColor, 0.12),
            color: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& svg': { fontSize: 20 },
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', flex: 1 }}>
          {title}
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ borderRadius: 2 }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ pt: 2.5 }}>
        {sorted.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>
            {t('history.empty')}
          </Typography>
        ) : (
          <Stack spacing={0}>
            {sorted.map((entry, i) => (
              <Box key={entry.id} sx={{ display: 'flex', gap: 1.5 }}>
                {/* Rail: dot + connecting line */}
                <Box
                  sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16 }}
                >
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: accentColor,
                      mt: 0.5,
                      flexShrink: 0,
                    }}
                  />
                  {i < sorted.length - 1 && (
                    <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', my: 0.5 }} />
                  )}
                </Box>

                <Box
                  onClick={onOpenEntry ? () => onOpenEntry(entry.id) : undefined}
                  sx={{
                    flex: 1,
                    mb: 2,
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    cursor: onOpenEntry ? 'pointer' : 'default',
                    transition: 'border-color 120ms ease, background-color 120ms ease',
                    '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                    '&:hover': onOpenEntry
                      ? { borderColor: accentColor, bgcolor: alpha(accentColor, 0.04) }
                      : undefined,
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {formatDateShort(entry.date)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {entry.product || '–'}
                  </Typography>
                  {entry.meta && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
                      {entry.meta}
                    </Typography>
                  )}
                  {entry.note && (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {entry.note}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
