import { Box, Button, Paper, Stack, Typography, useTheme } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { AnimalType } from '../../constants/animalSpecies';
import SearchableSelect from '../ui/SearchableSelect';
import { CATEGORY_LABELS } from '../../content/poradna/articles';
import type { ArticleCategory } from '../../content/poradna/types';

type CategoryFilter = 'all' | ArticleCategory;
type SpeciesFilter = 'all' | AnimalType;

interface Props {
  category: CategoryFilter;
  species: SpeciesFilter;
  availableSpecies: AnimalType[];
  speciesLabels: Record<string, string>;
  resultCount: number;
  onCategoryChange: (value: CategoryFilter) => void;
  onSpeciesChange: (value: SpeciesFilter) => void;
  onReset: () => void;
}

const CATEGORY_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'Všetky témy' },
  { value: 'krmivo', label: CATEGORY_LABELS.krmivo },
  { value: 'zdravie', label: CATEGORY_LABELS.zdravie },
];

export default function ArticleFilterBar({
  category,
  species,
  availableSpecies,
  speciesLabels,
  resultCount,
  onCategoryChange,
  onSpeciesChange,
  onReset,
}: Props) {
  const theme = useTheme();
  const isDefault = category === 'all' && species === 'all';

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: theme.spacing(2), md: theme.spacing(2.5) },
        mb: theme.spacing(4),
        borderRadius: theme.spacing(2),
        bgcolor: 'background.paper',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={theme.spacing(2)}
        alignItems={{ xs: 'stretch', md: 'center' }}
      >
        <SearchableSelect<CategoryFilter>
          label="Téma"
          value={category}
          options={CATEGORY_OPTIONS}
          onChange={onCategoryChange}
          sx={{ minWidth: { xs: '100%', md: 220 } }}
        />

        {availableSpecies.length > 0 && (
          <SearchableSelect<SpeciesFilter>
            label="Druh zvieraťa"
            value={species}
            options={[
              { value: 'all', label: 'Všetky druhy' },
              ...availableSpecies.map((value) => ({
                value,
                label: speciesLabels[value] ?? value,
              })),
            ]}
            onChange={onSpeciesChange}
            sx={{ minWidth: { xs: '100%', md: 240 } }}
          />
        )}

        <Box sx={{ flexGrow: 1 }} />

        <Stack
          direction="row"
          spacing={theme.spacing(1.5)}
          alignItems="center"
          justifyContent={{ xs: 'space-between', md: 'flex-end' }}
        >
          <Typography variant="body2" color="text.secondary">
            {resultCount === 1 ? '1 článok' : `${resultCount} článkov`}
          </Typography>
          {!isDefault && (
            <Button
              size="small"
              variant="text"
              color="inherit"
              startIcon={<CloseIcon />}
              onClick={onReset}
              sx={{ color: 'text.secondary', flexShrink: 0 }}
            >
              Vymazať filtre
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
