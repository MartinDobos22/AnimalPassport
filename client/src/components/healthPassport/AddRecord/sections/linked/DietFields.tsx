import { useTranslation } from 'react-i18next';
import { Stack, TextField } from '@mui/material';

import type { DietEntry } from '../../../../../types/petHealth';
import type { DietFieldsValues } from '../../formTypes';
import SearchableSelect from '../../../../ui/SearchableSelect';

type Suitability = NonNullable<DietEntry['suitabilityStatus']>;

interface DietFieldsProps {
  values: DietFieldsValues;
  errorFoodName?: string;
  onChange: <K extends keyof DietFieldsValues>(field: K, value: DietFieldsValues[K]) => void;
}

export default function DietFields({ values, errorFoodName, onChange }: DietFieldsProps) {
  const { t } = useTranslation('healthPassport');
  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField
          size="small"
          label={t('diet.foodName')}
          value={values.foodName}
          onChange={(e) => onChange('foodName', e.target.value)}
          error={Boolean(errorFoodName)}
          helperText={errorFoodName}
          fullWidth
        />
        <SearchableSelect
          label={t('diet.suitability')}
          value={values.suitabilityStatus}
          options={[
            { value: 'SUITABLE', label: t('detail.suitableSuitable') },
            { value: 'RISKY', label: t('detail.suitableRisky') },
            { value: 'UNSUITABLE', label: t('detail.suitableUnsuitable') },
          ]}
          onChange={(next) => onChange('suitabilityStatus', next as Suitability)}
          sx={{ minWidth: 200 }}
        />
      </Stack>
      <TextField
        size="small"
        label={t('diet.reactionNotes')}
        value={values.reactionNotes}
        onChange={(e) => onChange('reactionNotes', e.target.value)}
        multiline
        minRows={2}
        fullWidth
      />
    </Stack>
  );
}
