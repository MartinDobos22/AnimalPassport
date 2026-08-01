import { useTranslation } from 'react-i18next';
import { Box, Stack, TextField } from '@mui/material';
import HelpHint from '../HelpHint';
import SearchableSelect from '../ui/SearchableSelect';
import {
  EPISODE_CATEGORIES,
  EPISODE_OUTCOMES,
  type EpisodeCategory,
  type EpisodeOutcome,
} from '../../types/healthEpisode';

interface EpisodeFiltersBarProps {
  category: EpisodeCategory | 'all';
  outcome: EpisodeOutcome | 'all';
  query: string;
  onCategoryChange: (next: EpisodeCategory | 'all') => void;
  onOutcomeChange: (next: EpisodeOutcome | 'all') => void;
  onQueryChange: (next: string) => void;
}

export default function EpisodeFiltersBar({
  category,
  outcome,
  query,
  onCategoryChange,
  onOutcomeChange,
  onQueryChange,
}: EpisodeFiltersBarProps) {
  const { t } = useTranslation('episodes');

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
      <Stack direction="row" alignItems="center" gap={0.5}>
        <SearchableSelect<EpisodeCategory | 'all'>
          label={t('form.category')}
          value={category}
          options={[
            { value: 'all', label: t('filter.all') },
            ...EPISODE_CATEGORIES.map((c) => ({ value: c, label: t(`category.${c}` as never) })),
          ]}
          onChange={onCategoryChange}
          sx={{ minWidth: 160, flex: 1 }}
        />
        <HelpHint text={t('hints.category')} />
      </Stack>

      <SearchableSelect<EpisodeOutcome | 'all'>
        label={t('form.outcome')}
        value={outcome}
        options={[
          { value: 'all', label: t('filter.all') },
          ...EPISODE_OUTCOMES.map((o) => ({ value: o, label: t(`outcome.${o}` as never) })),
        ]}
        onChange={onOutcomeChange}
        sx={{ minWidth: 160 }}
      />

      <Box sx={{ flex: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={t('filter.searchPlaceholder')}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </Box>
    </Stack>
  );
}
