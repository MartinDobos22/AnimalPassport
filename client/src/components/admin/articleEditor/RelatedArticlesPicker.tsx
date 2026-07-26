import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import ArticlePickerDialog from './ArticlePickerDialog';
import { listAdminArticles } from '../../../services/adminApi';

interface Props {
  value: string[];
  onChange: (slugs: string[]) => void;
  /** Aktuálny slug — nesmie odkazovať sám na seba. */
  currentSlug?: string;
}

export default function RelatedArticlesPicker({ value, onChange, currentSlug }: Props) {
  const [open, setOpen] = useState(false);
  const [titleBySlug, setTitleBySlug] = useState<Record<string, string>>({});

  useEffect(() => {
    listAdminArticles()
      .then((articles) =>
        setTitleBySlug(Object.fromEntries(articles.map((a) => [a.slug, a.title])))
      )
      .catch(() => setTitleBySlug({}));
  }, []);

  const excludeSlugs = useMemo(
    () => [...value, ...(currentSlug ? [currentSlug] : [])],
    [value, currentSlug]
  );

  const add = (slug: string) => {
    if (!value.includes(slug)) onChange([...value, slug]);
  };
  const remove = (slug: string) => onChange(value.filter((s) => s !== slug));

  return (
    <Box>
      {value.length > 0 ? (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
          {value.map((slug) => (
            <Chip key={slug} label={titleBySlug[slug] ?? slug} onDelete={() => remove(slug)} />
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Zatiaľ žiadne súvisiace články.
        </Typography>
      )}
      <Button startIcon={<AddIcon />} size="small" variant="outlined" onClick={() => setOpen(true)}>
        Pridať súvisiaci článok
      </Button>
      <ArticlePickerDialog
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(a) => add(a.slug)}
        excludeSlugs={excludeSlugs}
        multiple
        title="Pridať súvisiace články"
      />
    </Box>
  );
}
