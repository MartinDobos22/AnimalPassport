import { useTranslation } from 'react-i18next';
import { Stack, TextField } from '@mui/material';

import type { EctoparasiteRecord } from '../../../../../types/petHealth';
import type { EctoFieldsValues } from '../../formTypes';
import SearchableSelect from '../../../../ui/SearchableSelect';
import NextDueFields from './NextDueFields';

interface EctoFieldsProps {
  values: EctoFieldsValues;
  baseDate: string;
  errorProduct?: string;
  onChange: <K extends keyof EctoFieldsValues>(field: K, value: EctoFieldsValues[K]) => void;
}

export default function EctoFields({ values, baseDate, errorProduct, onChange }: EctoFieldsProps) {
  const { t } = useTranslation('healthPassport');

  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField
          size="small"
          label={t('ectoparasite.product')}
          value={values.product}
          onChange={(e) => onChange('product', e.target.value)}
          error={Boolean(errorProduct)}
          helperText={errorProduct}
          fullWidth
        />
        <SearchableSelect
          label={t('ectoparasite.form')}
          value={values.form}
          options={[
            { value: 'TABLET', label: t('ectoparasite.formTablet') },
            { value: 'SPOT_ON', label: t('ectoparasite.formSpotOn') },
            { value: 'COLLAR', label: t('ectoparasite.formCollar') },
          ]}
          onChange={(next) => onChange('form', next as EctoparasiteRecord['form'])}
          sx={{ minWidth: 160 }}
        />
      </Stack>
      <NextDueFields
        intervalLabel={t('ectoparasite.intervalDays')}
        intervalDays={values.intervalDays}
        validUntil={values.validUntil}
        baseDate={baseDate}
        onChangeInterval={(days) => onChange('intervalDays', days)}
        onChangeValidUntil={(date) => onChange('validUntil', date)}
      />
    </Stack>
  );
}
