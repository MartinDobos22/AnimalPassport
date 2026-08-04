import { useTranslation } from 'react-i18next';
import { Stack, TextField } from '@mui/material';

import type { DewormingFieldsValues } from '../../formTypes';
import NextDueFields from './NextDueFields';

interface DewormingFieldsProps {
  values: DewormingFieldsValues;
  baseDate: string;
  errorProduct?: string;
  onChange: <K extends keyof DewormingFieldsValues>(
    field: K,
    value: DewormingFieldsValues[K]
  ) => void;
}

export default function DewormingFields({
  values,
  baseDate,
  errorProduct,
  onChange,
}: DewormingFieldsProps) {
  const { t } = useTranslation('healthPassport');

  return (
    <Stack spacing={1.5}>
      <TextField
        size="small"
        label={t('deworming.product')}
        value={values.product}
        onChange={(e) => onChange('product', e.target.value)}
        error={Boolean(errorProduct)}
        helperText={errorProduct}
        fullWidth
      />
      <NextDueFields
        intervalLabel={t('deworming.intervalDays')}
        intervalDays={values.intervalDays}
        validUntil={values.validUntil}
        baseDate={baseDate}
        onChangeInterval={(days) => onChange('intervalDays', days)}
        onChangeValidUntil={(date) => onChange('validUntil', date)}
      />
    </Stack>
  );
}
