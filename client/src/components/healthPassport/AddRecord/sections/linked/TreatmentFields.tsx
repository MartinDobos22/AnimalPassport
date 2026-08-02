import { useTranslation } from 'react-i18next';
import { Checkbox, FormControlLabel, FormHelperText, Stack, TextField } from '@mui/material';

import type { TreatmentFieldsValues } from '../../formTypes';
import { formatDate, plusDays } from '../../../utils';
import SearchableSelect from '../../../../ui/SearchableSelect';
import {
  TREATMENT_CATEGORY_ORDER,
  TREATMENT_FORM_ORDER,
} from '../../../../../utils/treatmentCategories';

const DEFAULT_INTERVAL_DAYS = 28;

interface TreatmentFieldsProps {
  values: TreatmentFieldsValues;
  baseDate: string;
  errorName?: string;
  onChange: <K extends keyof TreatmentFieldsValues>(
    field: K,
    value: TreatmentFieldsValues[K]
  ) => void;
}

export default function TreatmentFields({
  values,
  baseDate,
  errorName,
  onChange,
}: TreatmentFieldsProps) {
  const { t, i18n } = useTranslation('healthPassport');
  const locale = i18n.language === 'en' ? 'en-GB' : 'sk-SK';
  const isOneOff = values.intervalDays === 0;
  const nextDue =
    baseDate && values.intervalDays > 0
      ? formatDate(plusDays(baseDate, values.intervalDays), locale)
      : '—';

  return (
    <Stack spacing={1.5}>
      <SearchableSelect
        label={t('treatment.category')}
        value={values.category}
        options={TREATMENT_CATEGORY_ORDER.map((c) => ({
          value: c,
          label: t(`treatmentCategories.${c}`),
        }))}
        onChange={(next) => onChange('category', next as TreatmentFieldsValues['category'])}
        fullWidth
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField
          size="small"
          label={t('treatment.name')}
          placeholder={t('treatment.namePlaceholder')}
          value={values.name}
          onChange={(e) => onChange('name', e.target.value)}
          error={Boolean(errorName)}
          helperText={errorName}
          fullWidth
        />
        <SearchableSelect
          label={t('treatment.form')}
          value={values.form}
          options={TREATMENT_FORM_ORDER.map((f) => ({
            value: f,
            label: t(`treatmentForms.${f}`),
          }))}
          onChange={(next) => onChange('form', next as TreatmentFieldsValues['form'])}
          sx={{ minWidth: 150 }}
        />
      </Stack>
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={isOneOff}
            onChange={(e) => onChange('intervalDays', e.target.checked ? 0 : DEFAULT_INTERVAL_DAYS)}
          />
        }
        label={t('treatment.oneOff')}
      />
      {isOneOff ? (
        <FormHelperText>{t('treatment.oneOffHint')}</FormHelperText>
      ) : (
        <TextField
          size="small"
          type="number"
          label={t('treatment.intervalDays')}
          value={values.intervalDays}
          onChange={(e) => onChange('intervalDays', Number(e.target.value) || 0)}
          inputProps={{ min: 0, step: 1 }}
          helperText={t('treatment.nextDue', { date: nextDue })}
          fullWidth
        />
      )}
    </Stack>
  );
}
