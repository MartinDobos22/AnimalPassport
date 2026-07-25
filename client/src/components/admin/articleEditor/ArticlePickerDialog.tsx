import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { STATUS_COLORS, STATUS_LABELS } from '../../../utils/articleWorkflow';
import { listAdminArticles } from '../../../services/adminApi';
import type { AdminArticle } from '../../../content/poradna/types';

export interface PickableArticle {
  slug: string;
  title: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Volané pri výbere článku. V `multiple` režime sa dialóg nezavrie. */
  onSelect: (article: PickableArticle) => void;
  /** Slugy, ktoré sa nemajú ponúkať (aktuálny článok, už pridané). */
  excludeSlugs?: string[];
  /** true = pridávanie viacerých (riadky majú tlačidlo „Pridať"); false = jeden výber a zavrie. */
  multiple?: boolean;
  title?: string;
}

export default function ArticlePickerDialog({
  open,
  onClose,
  onSelect,
  excludeSlugs = [],
  multiple = false,
  title = 'Vybrať článok',
}: Props) {
  const [articles, setArticles] = useState<AdminArticle[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open || articles) return;
    listAdminArticles()
      .then(setArticles)
      .catch((e: Error) => setError(e.message));
  }, [open, articles]);

  const excluded = useMemo(() => new Set(excludeSlugs), [excludeSlugs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (articles ?? [])
      .filter((a) => !excluded.has(a.slug))
      .filter((a) => !q || a.title.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q));
  }, [articles, excluded, query]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          label="Hľadať podľa titulku alebo slugu"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          fullWidth
          size="small"
          autoFocus
          margin="dense"
        />
        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
        {articles === null && !error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <List dense sx={{ maxHeight: 360, overflow: 'auto' }}>
            {filtered.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 2 }}>
                Žiadne články.
              </Typography>
            )}
            {filtered.map((a) => (
              <ListItemButton
                key={a.slug}
                onClick={() => {
                  onSelect({ slug: a.slug, title: a.title });
                  if (!multiple) onClose();
                }}
              >
                <ListItemText
                  primary={a.title || '(bez titulku)'}
                  secondary={a.slug}
                  slotProps={{ primary: { noWrap: true }, secondary: { noWrap: true } }}
                />
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={STATUS_LABELS[a.status]}
                    color={STATUS_COLORS[a.status]}
                    size="small"
                  />
                  {multiple && (
                    <Button size="small" variant="outlined">
                      Pridať
                    </Button>
                  )}
                </Stack>
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{multiple ? 'Hotovo' : 'Zrušiť'}</Button>
      </DialogActions>
    </Dialog>
  );
}
