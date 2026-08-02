import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Stack, TextField, Typography } from '@mui/material';

import type { VaccinationRecord } from '../../../../../types/petHealth';
import type { VaccinationFieldsValues } from '../../formTypes';
import DateField from '../../../../DateField';
import HelpHint from '../../../../HelpHint';
import SearchableSelect from '../../../../ui/SearchableSelect';
import { VACCINE_TYPE_ORDER, inferVaccineType } from '../../../../../utils/vaccineTypes';

interface VaccinationFieldsProps {
  values: VaccinationFieldsValues;
  errorName?: string;
  errorValidUntil?: string;
  onChange: <K extends keyof VaccinationFieldsValues>(
    field: K,
    value: VaccinationFieldsValues[K]
  ) => void;
}

export default function VaccinationFields({
  values,
  errorName,
  errorValidUntil,
  onChange,
}: VaccinationFieldsProps) {
  const { t } = useTranslation('healthPassport');
  const [typeTouched, setTypeTouched] = useState(false);

  const handleNameChange = (name: string) => {
    onChange('name', name);
    if (!typeTouched) onChange('type', inferVaccineType(name));
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Typography variant="caption" color="text.secondary">
          {t('vaccination.passportHelpTitle')}
        </Typography>
        <HelpHint text={t('vaccination.passportHelp')} size={15} />
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField
          size="small"
          label={t('vaccination.name')}
          placeholder={t('vaccination.namePlaceholder')}
          value={values.name}
          onChange={(e) => handleNameChange(e.target.value)}
          error={Boolean(errorName)}
          helperText={errorName || t('vaccination.nameHelper')}
          fullWidth
        />
        <SearchableSelect
          label={t('vaccination.type')}
          value={values.type}
          options={VACCINE_TYPE_ORDER.map((type) => ({
            value: type,
            label: t(`vaccineTypes.${type}`),
          }))}
          onChange={(next) => {
            setTypeTouched(true);
            onChange('type', next as VaccinationRecord['type']);
          }}
          sx={{ minWidth: 160 }}
        />
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <DateField
          label={t('vaccination.validUntil')}
          value={values.validUntil}
          onChange={(v) => onChange('validUntil', v)}
          error={Boolean(errorValidUntil)}
          helperText={errorValidUntil || t('vaccination.validUntilHelper')}
          fullWidth
        />
        <TextField
          size="small"
          label={t('vaccination.batchNumber')}
          placeholder={t('vaccination.batchPlaceholder')}
          value={values.batchNumber}
          onChange={(e) => onChange('batchNumber', e.target.value)}
          helperText={t('vaccination.batchHelper')}
          fullWidth
        />
      </Stack>
    </Stack>
  );
}
