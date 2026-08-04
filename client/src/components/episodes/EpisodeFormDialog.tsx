import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import StringListEditor from './StringListEditor';
import AttachmentGallery from './AttachmentGallery';
import SearchableSelect from '../ui/SearchableSelect';
import {
  EPISODE_CATEGORIES,
  EPISODE_OUTCOMES,
  EPISODE_SEVERITIES,
  type EpisodeAttachment,
  type EpisodeCategory,
  type EpisodeOutcome,
  type EpisodeSeverity,
  type HealthEpisodeRecord,
} from '../../types/healthEpisode';
import type { MedicationRecord, VetVisitRecord } from '../../types/petHealth';

interface EpisodeFormDialogProps {
  open: boolean;
  initial?: HealthEpisodeRecord;
  petId: string;
  medications: MedicationRecord[];
  vetVisits: VetVisitRecord[];
  storageWarning?: string;
  onClose: () => void;
  onSave: (
    payload: Omit<HealthEpisodeRecord, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => Promise<void> | void;
}

interface FormState {
  symptomTitle: string;
  symptomDescription: string;
  category: EpisodeCategory;
  startedAt: string;
  endedAt: string;
  location: string;
  triggers: string[];
  diagnosis: string;
  vetVisitId: string;
  medicationIds: string[];
  treatmentNotes: string;
  whatWorked: string[];
  whatDidntWork: string[];
  outcome: EpisodeOutcome;
  severity: EpisodeSeverity;
  lessonsLearned: string;
  attachments: EpisodeAttachment[];
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function emptyState(): FormState {
  return {
    symptomTitle: '',
    symptomDescription: '',
    category: 'digestive',
    startedAt: todayIso(),
    endedAt: '',
    location: '',
    triggers: [],
    diagnosis: '',
    vetVisitId: '',
    medicationIds: [],
    treatmentNotes: '',
    whatWorked: [],
    whatDidntWork: [],
    outcome: 'unspecified',
    severity: 'moderate',
    lessonsLearned: '',
    attachments: [],
  };
}

function fromRecord(record: HealthEpisodeRecord): FormState {
  return {
    symptomTitle: record.symptomTitle,
    symptomDescription: record.symptomDescription,
    category: record.category,
    startedAt: record.startedAt || todayIso(),
    endedAt: record.endedAt ?? '',
    location: record.location ?? '',
    triggers: record.triggers ?? [],
    diagnosis: record.diagnosis ?? '',
    vetVisitId: record.vetVisitId ?? '',
    medicationIds: record.medicationIds,
    treatmentNotes: record.treatmentNotes ?? '',
    whatWorked: record.whatWorked,
    whatDidntWork: record.whatDidntWork,
    outcome: record.outcome,
    severity: record.severity,
    lessonsLearned: record.lessonsLearned ?? '',
    attachments: record.attachments ?? [],
  };
}

export default function EpisodeFormDialog({
  open,
  initial,
  petId,
  medications,
  vetVisits,
  storageWarning,
  onClose,
  onSave,
}: EpisodeFormDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation('episodes');
  const [state, setState] = useState<FormState>(emptyState());

  useEffect(() => {
    if (open) {
      setState(initial ? fromRecord(initial) : emptyState());
    }
  }, [open, initial]);

  const dogMedications = useMemo(
    () => medications.filter((m) => m.petId === petId),
    [medications, petId]
  );
  const dogVetVisits = useMemo(
    () => vetVisits.filter((v) => v.petId === petId),
    [vetVisits, petId]
  );

  const [isSaving, setIsSaving] = useState(false);
  const canSave = state.symptomTitle.trim().length > 0;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!canSave || isSaving) return;
    setIsSaving(true);
    try {
      await onSave(
        {
          petId,
          symptomTitle: state.symptomTitle.trim(),
          symptomDescription: state.symptomDescription.trim(),
          category: state.category,
          startedAt: state.startedAt || todayIso(),
          endedAt: state.endedAt || undefined,
          location: state.location.trim() || undefined,
          triggers: state.triggers.length > 0 ? state.triggers : undefined,
          diagnosis: state.diagnosis.trim() || undefined,
          vetVisitId: state.vetVisitId || undefined,
          medicationIds: state.medicationIds,
          treatmentNotes: state.treatmentNotes.trim() || undefined,
          whatWorked: state.whatWorked,
          whatDidntWork: state.whatDidntWork,
          outcome: state.outcome,
          severity: state.severity,
          lessonsLearned: state.lessonsLearned.trim() || undefined,
          attachments: state.attachments.length > 0 ? state.attachments : undefined,
        },
        initial?.id
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" fullScreen={fullScreen}>
      <DialogTitle>{initial ? t('form.titleEdit') : t('form.titleNew')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {storageWarning && <Alert severity="warning">{storageWarning}</Alert>}

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              {t('form.symptomContext')}
            </Typography>
            <Stack spacing={2}>
              <TextField
                label={t('form.symptomTitle')}
                placeholder={t('form.symptomTitlePlaceholder')}
                value={state.symptomTitle}
                onChange={(e) => update('symptomTitle', e.target.value)}
                required
                fullWidth
              />
              <TextField
                label={t('form.symptomDescription')}
                value={state.symptomDescription}
                onChange={(e) => update('symptomDescription', e.target.value)}
                multiline
                minRows={2}
                fullWidth
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <SearchableSelect<EpisodeCategory>
                  label={t('form.category')}
                  value={state.category}
                  options={EPISODE_CATEGORIES.map((c) => ({
                    value: c,
                    label: t(`category.${c}` as never),
                  }))}
                  onChange={(next) => update('category', next)}
                  size="medium"
                  fullWidth
                />
                <SearchableSelect<EpisodeSeverity>
                  label={t('form.severity')}
                  value={state.severity}
                  options={EPISODE_SEVERITIES.map((s) => ({
                    value: s,
                    label: t(`severity.${s}` as never),
                  }))}
                  onChange={(next) => update('severity', next)}
                  helperText={t('hints.severity')}
                  size="medium"
                  fullWidth
                />
                <SearchableSelect<EpisodeOutcome>
                  label={t('form.outcome')}
                  value={state.outcome}
                  options={EPISODE_OUTCOMES.map((o) => ({
                    value: o,
                    label: t(`outcome.${o}` as never),
                  }))}
                  onChange={(next) => update('outcome', next)}
                  size="medium"
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label={t('form.startedAt')}
                  type="date"
                  value={state.startedAt}
                  onChange={(e) => update('startedAt', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label={t('form.endedAt')}
                  type="date"
                  value={state.endedAt}
                  onChange={(e) => update('endedAt', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label={t('form.location')}
                  placeholder={t('form.locationPlaceholder')}
                  value={state.location}
                  onChange={(e) => update('location', e.target.value)}
                  fullWidth
                />
              </Stack>
              <StringListEditor
                label={t('form.triggers')}
                placeholder={t('form.triggersPlaceholder')}
                values={state.triggers}
                onChange={(v) => update('triggers', v)}
              />
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              {t('form.diagnosisTreatment')}
            </Typography>
            <Stack spacing={2}>
              <TextField
                label={t('form.diagnosis')}
                value={state.diagnosis}
                onChange={(e) => update('diagnosis', e.target.value)}
                multiline
                minRows={2}
                fullWidth
              />
              <SearchableSelect
                label={t('form.vetVisitLabel')}
                value={state.vetVisitId}
                options={[
                  { value: '', label: t('form.noVetVisit') },
                  ...dogVetVisits.map((v) => ({
                    value: v.id,
                    label: `${v.clinicName}${
                      v.date ? ` – ${new Date(v.date).toLocaleDateString()}` : ''
                    }`,
                  })),
                ]}
                onChange={(next) => update('vetVisitId', next)}
                size="medium"
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel id="episode-form-meds">{t('form.medications')}</InputLabel>
                <Select
                  labelId="episode-form-meds"
                  label={t('form.medications')}
                  multiple
                  value={state.medicationIds}
                  onChange={(e) =>
                    update(
                      'medicationIds',
                      typeof e.target.value === 'string'
                        ? e.target.value.split(',')
                        : e.target.value
                    )
                  }
                  renderValue={(selected) =>
                    selected
                      .map((id) => dogMedications.find((m) => m.id === id)?.name ?? id)
                      .join(', ')
                  }
                >
                  {dogMedications.length === 0 && (
                    <MenuItem disabled value="">
                      {t('form.noMedications')}
                    </MenuItem>
                  )}
                  {dogMedications.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.name}
                      {m.dose ? ` (${m.dose})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label={t('form.treatmentNotes')}
                value={state.treatmentNotes}
                onChange={(e) => update('treatmentNotes', e.target.value)}
                multiline
                minRows={2}
                fullWidth
              />
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              {t('form.outcomeSection')}
            </Typography>
            <Stack spacing={2}>
              <StringListEditor
                label={t('form.whatWorked')}
                placeholder={t('form.whatWorkedPlaceholder')}
                values={state.whatWorked}
                onChange={(v) => update('whatWorked', v)}
                chipColor="success"
              />
              <StringListEditor
                label={t('form.whatDidntWork')}
                placeholder={t('form.whatDidntWorkPlaceholder')}
                values={state.whatDidntWork}
                onChange={(v) => update('whatDidntWork', v)}
                chipColor="error"
              />
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              {t('form.lessonsSection')}
            </Typography>
            <TextField
              label={t('form.lessonsFieldLabel')}
              placeholder={t('form.lessonsPlaceholder')}
              value={state.lessonsLearned}
              onChange={(e) => update('lessonsLearned', e.target.value)}
              multiline
              minRows={3}
              fullWidth
            />
          </Box>

          <Divider />

          <AttachmentGallery
            petId={petId}
            attachments={state.attachments}
            onChange={(v) => update('attachments', v)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          {t('actions.cancel', { ns: 'common' })}
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSave()}
          disabled={!canSave || isSaving}
        >
          {isSaving ? t('saving', { ns: 'common' }) : t('actions.save', { ns: 'common' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
