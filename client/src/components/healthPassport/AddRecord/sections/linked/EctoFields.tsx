import { useTranslation } from 'react-i18next';
import { Stack, TextField } from '@mui/material';

import type { EctoparasiteRecord } from '../../../../../types/petHealth';
import type { EctoFieldsValues } from '../../formTypes';
import SearchableSelect from '../../../../ui/SearchableSelect';
import { formatDate, plusDays } from '../../../utils';

interface EctoFieldsProps {
  values: EctoFieldsValues;
  baseDate: string;
  errorProduct?: string;
  onChange: <K extends keyof EctoFieldsValues>(field: K, value: EctoFieldsValues[K]) => void;
}

export default function EctoFields({ values, baseDate, errorProduct, onChange }: EctoFieldsProps) {
  const { t, i18n } = useTranslation('healthPassport');
  const locale = i18n.language === 'en' ? 'en-GB' : 'sk-SK';
  const nextDue =
    baseDate && values.intervalDays > 0
      ? formatDate(plusDays(baseDate, values.intervalDays), locale)
      : '—';

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
      <TextField
        size="small"
        type="number"
        label={t('ectoparasite.intervalDays')}
        value={values.intervalDays}
        onChange={(e) => onChange('intervalDays', Number(e.target.value) || 0)}
        inputProps={{ min: 1, step: 1 }}
        helperText={t('ectoparasite.nextDue', { date: nextDue })}
        fullWidth
      />
    </Stack>
  );
}
