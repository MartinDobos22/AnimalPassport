import { Box, Stack, TextField, Typography } from '@mui/material';
import { InfoOutlined as InfoIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import { VISIT_CATEGORY_OPTIONS } from '../../constants';
import type { ErrorMap, VisitBasicsValues } from '../formTypes';
import SectionCard from './SectionCard';
import DateField from '../../../DateField';
import SearchableSelect from '../../../ui/SearchableSelect';

interface VisitBasicsProps {
  values: VisitBasicsValues;
  errors: ErrorMap;
  onChange: <K extends keyof VisitBasicsValues>(field: K, value: VisitBasicsValues[K]) => void;
}

export default function VisitBasics({ values, errors, onChange }: VisitBasicsProps) {
  const { t } = useTranslation('healthPassport');
  const subOptions =
    VISIT_CATEGORY_OPTIONS.find((opt) => opt.key === values.mainCategory)?.sub ?? [];

  return (
    <SectionCard title={t('addRecord.basics.title')} icon={<InfoIcon />}>
      <Stack spacing={1.5}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <DateField
            label={t('addRecord.basics.date')}
            value={values.date}
            onChange={(v) => onChange('date', v)}
            error={Boolean(errors['basics.date'])}
            helperText={errors['basics.date']}
            sx={{ width: { xs: '100%', sm: 200 } }}
          />
          <TextField
            size="small"
            label={t('addRecord.basics.clinic')}
            value={values.clinicName}
            onChange={(e) => onChange('clinicName', e.target.value)}
            error={Boolean(errors['basics.clinicName'])}
            helperText={errors['basics.clinicName']}
            fullWidth
            required
          />
        </Stack>
        <TextField
          size="small"
          label={t('addRecord.basics.reason')}
          placeholder={t('addRecord.basics.reasonPlaceholder')}
          value={values.reason}
          onChange={(e) => onChange('reason', e.target.value)}
          fullWidth
        />
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', textTransform: 'none', letterSpacing: 0, mt: -0.5 }}
        >
          {t('addRecord.basics.categoryHint')}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
          <SearchableSelect
            label={t('addRecord.basics.mainCategory')}
            value={values.mainCategory}
            options={[
              { value: '', label: t('visitCategory.notSelected') },
              ...VISIT_CATEGORY_OPTIONS.map((opt) => ({
                value: opt.key,
                label: t(`visitCategory.${opt.key}` as never),
              })),
            ]}
            onChange={(next) => {
              onChange('mainCategory', next);
              onChange('subcategory', '');
            }}
          />
          <SearchableSelect
            label={t('addRecord.basics.subcategory')}
            value={values.subcategory}
            disabled={!values.mainCategory}
            options={[
              { value: '', label: t('visitCategory.notSelected') },
              ...subOptions.map((sub) => ({
                value: sub.key,
                label: t(`visitCategory.${sub.key}` as never),
              })),
            ]}
            onChange={(next) => onChange('subcategory', next)}
          />
        </Box>
      </Stack>
    </SectionCard>
  );
}
