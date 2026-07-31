import { useTranslation } from 'react-i18next';
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';

import type { TreatmentFieldsValues } from '../../formTypes';
import { formatDate, plusDays } from '../../../utils';
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
      <FormControl size="small" fullWidth>
        <InputLabel>{t('treatment.category')}</InputLabel>
        <Select
          label={t('treatment.category')}
          value={values.category}
          onChange={(e) =>
            onChange('category', e.target.value as TreatmentFieldsValues['category'])
          }
        >
          {TREATMENT_CATEGORY_ORDER.map((c) => (
            <MenuItem key={c} value={c}>
              {t(`treatmentCategories.${c}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
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
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{t('treatment.form')}</InputLabel>
          <Select
            label={t('treatment.form')}
            value={values.form}
            onChange={(e) => onChange('form', e.target.value as TreatmentFieldsValues['form'])}
          >
            {TREATMENT_FORM_ORDER.map((f) => (
              <MenuItem key={f} value={f}>
                {t(`treatmentForms.${f}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
