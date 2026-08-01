import { useTranslation } from 'react-i18next';
import { Stack, TextField } from '@mui/material';
import { NotesOutlined as NotesIcon } from '@mui/icons-material';

import type { ClinicalNotesValues } from '../formTypes';
import SectionCard from './SectionCard';

interface ClinicalNotesProps {
  values: ClinicalNotesValues;
  expanded: boolean;
  onExpand: (next: boolean) => void;
  onChange: <K extends keyof ClinicalNotesValues>(field: K, value: ClinicalNotesValues[K]) => void;
}

export default function ClinicalNotes({
  values,
  expanded,
  onExpand,
  onChange,
}: ClinicalNotesProps) {
  const { t } = useTranslation('healthPassport');
  return (
    <SectionCard
      title={t('addRecord.clinical.title')}
      description={t('addRecord.clinical.description')}
      icon={<NotesIcon />}
      collapsible
      expanded={expanded}
      onExpandChange={onExpand}
    >
      <Stack spacing={1.5}>
        <TextField
          size="small"
          label={t('addRecord.clinical.findings')}
          placeholder={t('addRecord.clinical.findingsPlaceholder')}
          value={values.findings}
          onChange={(e) => onChange('findings', e.target.value)}
          multiline
          minRows={3}
          maxRows={8}
          fullWidth
        />
        <TextField
          size="small"
          label={t('addRecord.clinical.diagnosis')}
          placeholder={t('addRecord.clinical.diagnosisPlaceholder')}
          value={values.diagnosis}
          onChange={(e) => onChange('diagnosis', e.target.value)}
          multiline
          minRows={3}
          maxRows={8}
          fullWidth
        />
        <TextField
          size="small"
          label={t('addRecord.clinical.recommendations')}
          placeholder={t('addRecord.clinical.recommendationsPlaceholder')}
          value={values.recommendations}
          onChange={(e) => onChange('recommendations', e.target.value)}
          multiline
          minRows={3}
          maxRows={8}
          fullWidth
        />
      </Stack>
    </SectionCard>
  );
}
