import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  VaccinationRecord,
  DewormingRecord,
  EctoparasiteRecord,
  TreatmentRecord,
  MedicationRecord,
  DietEntry,
  ExpenseRecord,
  ExpenseCategory,
} from '../../types/petHealth';
import SearchableSelect from '../ui/SearchableSelect';
import { TIMELINE_ICON_MAP, TIMELINE_TYPE_META } from './constants.ts';
import { today } from './utils.ts';
import { VACCINE_TYPE_ORDER } from '../../utils/vaccineTypes';
import { TREATMENT_CATEGORY_ORDER, TREATMENT_FORM_ORDER } from '../../utils/treatmentCategories';

export type RecordDetailType =
  | 'VACCINATION'
  | 'DEWORMING'
  | 'ECTOPARASITE'
  | 'TREATMENT'
  | 'MEDICATION'
  | 'DIET'
  | 'EXPENSE';

export interface RecordDetailState {
  id: string;
  type: RecordDetailType;
}

// Draft state per type
interface VacDraft {
  name: string;
  type: VaccinationRecord['type'];
  dateApplied: string;
  validUntil: string;
  batchNumber: string;
  note: string;
}
interface DewDraft {
  productName: string;
  dateGiven: string;
  nextDueDate: string;
  note: string;
}
interface EctoDraft {
  productName: string;
  form: EctoparasiteRecord['form'];
  dateGiven: string;
  nextDueDate: string;
  note: string;
}
interface TreatDraft {
  category: TreatmentRecord['category'];
  name: string;
  form: NonNullable<TreatmentRecord['form']>;
  dateGiven: string;
  nextDueDate: string;
  note: string;
}
interface MedDraft {
  name: string;
  reason: string;
  dose: string;
  frequency: string;
  startDate: string;
  endDate: string;
}
interface DietDraft {
  foodName: string;
  startedAt: string;
  endedAt: string;
  reactionNotes: string;
  suitabilityStatus: NonNullable<DietEntry['suitabilityStatus']>;
}
interface ExpDraft {
  date: string;
  amount: string;
  currency: string;
  category: ExpenseCategory;
  note: string;
}

interface TimelineRecordDetailDialogProps {
  state: RecordDetailState | null;
  open: boolean;
  vaccination?: VaccinationRecord | null;
  deworming?: DewormingRecord | null;
  ectoparasite?: EctoparasiteRecord | null;
  treatment?: TreatmentRecord | null;
  medication?: MedicationRecord | null;
  diet?: DietEntry | null;
  expense?: ExpenseRecord | null;
  onClose: () => void;
  onSaveVaccination: (id: string, draft: VacDraft) => void;
  onSaveDeworming: (id: string, draft: DewDraft) => void;
  onSaveEcto: (id: string, draft: EctoDraft) => void;
  onSaveTreatment: (id: string, draft: TreatDraft) => void;
  onSaveMedication: (id: string, draft: MedDraft) => void;
  onSaveDiet: (id: string, draft: DietDraft) => void;
  onSaveExpense: (id: string, draft: ExpDraft) => void;
  onDelete: () => void;
}

export default function TimelineRecordDetailDialog({
  state,
  open,
  vaccination,
  deworming,
  ectoparasite,
  treatment,
  medication,
  diet,
  expense,
  onClose,
  onSaveVaccination,
  onSaveDeworming,
  onSaveEcto,
  onSaveTreatment,
  onSaveMedication,
  onSaveDiet,
  onSaveExpense,
  onDelete,
}: TimelineRecordDetailDialogProps) {
  const { t } = useTranslation('healthPassport');
  const theme = useTheme();
  const [editing, setEditing] = useState(false);

  const [vacDraft, setVacDraft] = useState<VacDraft>({
    name: '',
    type: 'OTHER',
    dateApplied: today(),
    validUntil: '',
    batchNumber: '',
    note: '',
  });
  const [dewDraft, setDewDraft] = useState<DewDraft>({
    productName: '',
    dateGiven: today(),
    nextDueDate: '',
    note: '',
  });
  const [ectoDraft, setEctoDraft] = useState<EctoDraft>({
    productName: '',
    form: 'TABLET',
    dateGiven: today(),
    nextDueDate: '',
    note: '',
  });
  const [treatDraft, setTreatDraft] = useState<TreatDraft>({
    category: 'OTHER',
    name: '',
    form: 'TABLET',
    dateGiven: today(),
    nextDueDate: '',
    note: '',
  });
  const [medDraft, setMedDraft] = useState<MedDraft>({
    name: '',
    reason: '',
    dose: '',
    frequency: '',
    startDate: today(),
    endDate: '',
  });
  const [dietDraft, setDietDraft] = useState<DietDraft>({
    foodName: '',
    startedAt: today(),
    endedAt: '',
    reactionNotes: '',
    suitabilityStatus: 'SUITABLE',
  });
  const [expDraft, setExpDraft] = useState<ExpDraft>({
    date: today(),
    amount: '',
    currency: 'EUR',
    category: 'OTHER',
    note: '',
  });

  useEffect(() => {
    setEditing(false);
    if (vaccination)
      setVacDraft({
        name: vaccination.name,
        type: vaccination.type,
        dateApplied: vaccination.dateApplied,
        validUntil: vaccination.validUntil,
        batchNumber: vaccination.batchNumber ?? '',
        note: vaccination.note ?? '',
      });
    if (deworming)
      setDewDraft({
        productName: deworming.productName,
        dateGiven: deworming.dateGiven,
        nextDueDate: deworming.nextDueDate,
        note: deworming.note ?? '',
      });
    if (ectoparasite)
      setEctoDraft({
        productName: ectoparasite.productName,
        form: ectoparasite.form,
        dateGiven: ectoparasite.dateGiven,
        nextDueDate: ectoparasite.nextDueDate,
        note: ectoparasite.note ?? '',
      });
    if (treatment)
      setTreatDraft({
        category: treatment.category,
        name: treatment.name,
        form: treatment.form ?? 'TABLET',
        dateGiven: treatment.dateGiven,
        nextDueDate: treatment.nextDueDate,
        note: treatment.note ?? '',
      });
    if (medication)
      setMedDraft({
        name: medication.name,
        reason: medication.reason,
        dose: medication.dose,
        frequency: medication.frequency,
        startDate: medication.startDate,
        endDate: medication.endDate ?? '',
      });
    if (diet)
      setDietDraft({
        foodName: diet.foodName,
        startedAt: diet.startedAt,
        endedAt: diet.endedAt ?? '',
        reactionNotes: diet.reactionNotes ?? '',
        suitabilityStatus: diet.suitabilityStatus ?? 'SUITABLE',
      });
    if (expense)
      setExpDraft({
        date: expense.date,
        amount: String(expense.amount),
        currency: expense.currency,
        category: expense.category,
        note: expense.note ?? '',
      });
  }, [vaccination, deworming, ectoparasite, treatment, medication, diet, expense]);

  if (!state) return null;

  const meta =
    state.type !== 'VACCINATION' &&
    state.type !== 'DEWORMING' &&
    state.type !== 'ECTOPARASITE' &&
    state.type !== 'TREATMENT' &&
    state.type !== 'MEDICATION' &&
    state.type !== 'DIET' &&
    state.type !== 'EXPENSE'
      ? null
      : TIMELINE_TYPE_META[state.type];

  const isInvalidRange = (start: string, end: string): boolean => {
    if (!start?.trim() || !end?.trim()) return false;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (Number.isNaN(s) || Number.isNaN(e)) return false;
    return e < s;
  };
  const vacDateError =
    state?.type === 'VACCINATION' && isInvalidRange(vacDraft.dateApplied, vacDraft.validUntil)
      ? t('validation.vaccinationValidUntilBeforeApplied')
      : '';

  const handleSave = () => {
    if (!state) return;
    if (state.type === 'VACCINATION') {
      if (vacDateError) return;
      onSaveVaccination(state.id, vacDraft);
    } else if (state.type === 'DEWORMING') onSaveDeworming(state.id, dewDraft);
    else if (state.type === 'ECTOPARASITE') onSaveEcto(state.id, ectoDraft);
    else if (state.type === 'TREATMENT') onSaveTreatment(state.id, treatDraft);
    else if (state.type === 'MEDICATION') onSaveMedication(state.id, medDraft);
    else if (state.type === 'DIET') onSaveDiet(state.id, dietDraft);
    else if (state.type === 'EXPENSE') onSaveExpense(state.id, expDraft);
    setEditing(false);
  };

  const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <Box>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          fontWeight: 700,
          fontSize: '0.68rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'text.secondary',
          mb: 0.5,
        }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  );

  const renderContent = () => {
    if (state.type === 'VACCINATION') {
      return editing ? (
        <Stack spacing={1.5}>
          <TextField
            label={t('detail.vaccineName')}
            placeholder={t('vaccination.namePlaceholder')}
            helperText={t('vaccination.nameHelper')}
            value={vacDraft.name}
            onChange={(e) => setVacDraft((p) => ({ ...p, name: e.target.value }))}
            size="small"
          />
          <SearchableSelect
            label={t('detail.vaccineType')}
            value={vacDraft.type}
            options={VACCINE_TYPE_ORDER.map((type) => ({
              value: type,
              label: t(`vaccineTypes.${type}`),
            }))}
            onChange={(next) =>
              setVacDraft((p) => ({ ...p, type: next as VaccinationRecord['type'] }))
            }
            fullWidth
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <TextField
              label={t('detail.dateApplied')}
              type="date"
              InputLabelProps={{ shrink: true }}
              value={vacDraft.dateApplied}
              onChange={(e) => setVacDraft((p) => ({ ...p, dateApplied: e.target.value }))}
              size="small"
            />
            <TextField
              label={t('detail.validUntil')}
              type="date"
              InputLabelProps={{ shrink: true }}
              value={vacDraft.validUntil}
              onChange={(e) => setVacDraft((p) => ({ ...p, validUntil: e.target.value }))}
              size="small"
              error={Boolean(vacDateError)}
              helperText={vacDateError || t('vaccination.validUntilHelper')}
            />
          </Box>
          <TextField
            label={t('detail.batchNumber')}
            placeholder={t('vaccination.batchPlaceholder')}
            helperText={t('vaccination.batchHelper')}
            value={vacDraft.batchNumber}
            onChange={(e) => setVacDraft((p) => ({ ...p, batchNumber: e.target.value }))}
            size="small"
          />
          <TextField
            label={t('detail.note')}
            value={vacDraft.note}
            onChange={(e) => setVacDraft((p) => ({ ...p, note: e.target.value }))}
            size="small"
            multiline
            minRows={2}
          />
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <FieldRow label={t('detail.name')}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {vacDraft.name || '–'}
              </Typography>
            </FieldRow>
            <FieldRow label={t('detail.type')}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {t(
                  `detail.type${vacDraft.type.charAt(0) + vacDraft.type.slice(1).toLowerCase()}` as never
                )}
              </Typography>
            </FieldRow>
            <FieldRow label={t('detail.applied')}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {vacDraft.dateApplied}
              </Typography>
            </FieldRow>
            <FieldRow label={t('detail.validUntil')}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {vacDraft.validUntil || '–'}
              </Typography>
            </FieldRow>
          </Box>
          {vacDraft.batchNumber && (
            <FieldRow label={t('detail.batchNumber')}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {vacDraft.batchNumber}
              </Typography>
            </FieldRow>
          )}
          {vacDraft.note && (
            <FieldRow label={t('detail.note')}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {vacDraft.note}
              </Typography>
            </FieldRow>
          )}
        </Stack>
      );
    }

    if (state.type === 'DEWORMING') {
      return editing ? (
        <Stack spacing={1.5}>
          <TextField
            label={t('detail.product')}
            value={dewDraft.productName}
            onChange={(e) => setDewDraft((p) => ({ ...p, productName: e.target.value }))}
            size="small"
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <TextField
              label={t('detail.dateApplied')}
              type="date"
              InputLabelProps={{ shrink: true }}
              value={dewDraft.dateGiven}
              onChange={(e) => setDewDraft((p) => ({ ...p, dateGiven: e.target.value }))}
              size="small"
            />
            <TextField
              label={t('detail.nextDue')}
              type="date"
              InputLabelProps={{ shrink: true }}
              value={dewDraft.nextDueDate}
              onChange={(e) => setDewDraft((p) => ({ ...p, nextDueDate: e.target.value }))}
              size="small"
            />
          </Box>
          <TextField
            label={t('detail.note')}
            value={dewDraft.note}
            onChange={(e) => setDewDraft((p) => ({ ...p, note: e.target.value }))}
            size="small"
            multiline
            minRows={2}
          />
        </Stack>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <FieldRow label={t('detail.product')}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {dewDraft.productName || '–'}
            </Typography>
          </FieldRow>
          <FieldRow label={t('detail.date')}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {dewDraft.dateGiven}
            </Typography>
          </FieldRow>
          <FieldRow label={t('detail.nextDue')}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {dewDraft.nextDueDate || '–'}
            </Typography>
          </FieldRow>
          {dewDraft.note && (
            <Box sx={{ gridColumn: '1 / -1' }}>
              <FieldRow label={t('detail.note')}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {dewDraft.note}
                </Typography>
              </FieldRow>
            </Box>
          )}
        </Box>
      );
    }

    if (state.type === 'TREATMENT') {
      return editing ? (
        <Stack spacing={1.5}>
          <SearchableSelect
            label={t('treatment.category')}
            value={treatDraft.category}
            options={TREATMENT_CATEGORY_ORDER.map((c) => ({
              value: c,
              label: t(`treatmentCategories.${c}`),
            }))}
            onChange={(next) =>
              setTreatDraft((p) => ({ ...p, category: next as TreatDraft['category'] }))
            }
            fullWidth
          />
          <TextField
            label={t('treatment.name')}
            placeholder={t('treatment.namePlaceholder')}
            value={treatDraft.name}
            onChange={(e) => setTreatDraft((p) => ({ ...p, name: e.target.value }))}
            size="small"
          />
          <SearchableSelect
            label={t('treatment.form')}
            value={treatDraft.form}
            options={TREATMENT_FORM_ORDER.map((f) => ({
              value: f,
              label: t(`treatmentForms.${f}`),
            }))}
            onChange={(next) => setTreatDraft((p) => ({ ...p, form: next as TreatDraft['form'] }))}
            fullWidth
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <TextField
              label={t('treatment.dateGiven')}
              type="date"
              InputLabelProps={{ shrink: true }}
              value={treatDraft.dateGiven}
              onChange={(e) => setTreatDraft((p) => ({ ...p, dateGiven: e.target.value }))}
              size="small"
            />
            <TextField
              label={t('treatment.nextDueDate')}
              type="date"
              InputLabelProps={{ shrink: true }}
              value={treatDraft.nextDueDate}
              onChange={(e) => setTreatDraft((p) => ({ ...p, nextDueDate: e.target.value }))}
              size="small"
            />
          </Box>
          <TextField
            label={t('detail.note')}
            value={treatDraft.note}
            onChange={(e) => setTreatDraft((p) => ({ ...p, note: e.target.value }))}
            size="small"
            multiline
            minRows={2}
          />
        </Stack>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <FieldRow label={t('treatment.category')}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {t(`treatmentCategories.${treatDraft.category}`)}
            </Typography>
          </FieldRow>
          <FieldRow label={t('treatment.name')}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {treatDraft.name || '–'}
            </Typography>
          </FieldRow>
          <FieldRow label={t('treatment.form')}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {t(`treatmentForms.${treatDraft.form}`)}
            </Typography>
          </FieldRow>
          <FieldRow label={t('detail.date')}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {treatDraft.dateGiven}
            </Typography>
          </FieldRow>
          <FieldRow label={t('detail.nextDue')}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {treatDraft.nextDueDate || '–'}
            </Typography>
          </FieldRow>
          {treatDraft.note && (
            <Box sx={{ gridColumn: '1 / -1' }}>
              <FieldRow label={t('detail.note')}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {treatDraft.note}
                </Typography>
              </FieldRow>
            </Box>
          )}
        </Box>
      );
    }

    if (state.type === 'ECTOPARASITE') {
      return editing ? (
        <Stack spacing={1.5}>
          <TextField
            label={t('detail.product')}
            value={ectoDraft.productName}
            onChange={(e) => setEctoDraft((p) => ({ ...p, productName: e.target.value }))}
            size="small"
          />
          <SearchableSelect
            label={t('detail.form')}
            value={ectoDraft.form}
            options={[
              { value: 'TABLET', label: t('detail.formTablet') },
              { value: 'SPOT_ON', label: t('detail.formSpotOn') },
              { value: 'COLLAR', label: t('detail.formCollar') },
            ]}
            onChange={(next) =>
              setEctoDraft((p) => ({ ...p, form: next as EctoparasiteRecord['form'] }))
            }
            fullWidth
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <TextField
              label={t('detail.dateApplied')}
              type="date"
              InputLabelProps={{ shrink: true }}
              value={ectoDraft.dateGiven}
              onChange={(e) => setEctoDraft((p) => ({ ...p, dateGiven: e.target.value }))}
              size="small"
            />
            <TextField
              label={t('detail.nextDue')}
              type="date"
              InputLabelProps={{ shrink: true }}
              value={ectoDraft.nextDueDate}
              onChange={(e) => setEctoDraft((p) => ({ ...p, nextDueDate: e.target.value }))}
              size="small"
            />
          </Box>
          <TextField
            label={t('detail.note')}
            value={ectoDraft.note}
            onChange={(e) => setEctoDraft((p) => ({ ...p, note: e.target.value }))}
            size="small"
            multiline
            minRows={2}
          />
        </Stack>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <FieldRow label={t('detail.product')}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {ectoDraft.productName || '–'}
            </Typography>
          </FieldRow>
          <FieldRow label={t('detail.form')}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {t(
                `detail.form${
                  ectoDraft.form.charAt(0) +
                  ectoDraft.form
                    .slice(1)
                    .toLowerCase()
                    .replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
                }` as never
              )}
            </Typography>
          </FieldRow>
          <FieldRow label={t('detail.date')}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {ectoDraft.dateGiven}
            </Typography>
          </FieldRow>
          <FieldRow label={t('detail.nextDue')}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {ectoDraft.nextDueDate || '–'}
            </Typography>
          </FieldRow>
          {ectoDraft.note && (
            <Box sx={{ gridColumn: '1 / -1' }}>
              <FieldRow label={t('detail.note')}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {ectoDraft.note}
                </Typography>
              </FieldRow>
            </Box>
          )}
        </Box>
      );
    }

    if (state.type === 'MEDICATION') {
      return editing ? (
        <Stack spacing={1.5}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <TextField
              label={t('detail.drugName')}
              value={medDraft.name}
              onChange={(e) => setMedDraft((p) => ({ ...p, name: e.target.value }))}
              size="small"
            />
            <TextField
              label={t('detail.reason')}
              value={medDraft.reason}
              onChange={(e) => setMedDraft((p) => ({ ...p, reason: e.target.value }))}
              size="small"
            />
            <TextField
              label={t('detail.dose')}
              value={medDraft.dose}
              onChange={(e) => setMedDraft((p) => ({ ...p, dose: e.target.value }))}
              size="small"
            />
            <TextField
              label={t('detail.frequency')}
              value={medDraft.frequency}
              onChange={(e) => setMedDraft((p) => ({ ...p, frequency: e.target.value }))}
              size="small"
            />
            <TextField
              label={t('detail.start')}
              type="date"
              InputLabelProps={{ shrink: true }}
              value={medDraft.startDate}
              onChange={(e) => setMedDraft((p) => ({ ...p, startDate: e.target.value }))}
              size="small"
            />
            <TextField
              label={t('detail.end')}
              type="date"
              InputLabelProps={{ shrink: true }}
              value={medDraft.endDate}
              onChange={(e) => setMedDraft((p) => ({ ...p, endDate: e.target.value }))}
              size="small"
            />
          </Box>
        </Stack>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <FieldRow label={t('detail.drugName')}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {medDraft.name || '–'}
            </Typography>
          </FieldRow>
          <FieldRow label={t('detail.reason')}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {medDraft.reason || '–'}
            </Typography>
          </FieldRow>
          <FieldRow label={t('detail.dose')}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {medDraft.dose || '–'}
            </Typography>
          </FieldRow>
          <FieldRow label={t('detail.frequency')}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {medDraft.frequency || '–'}
            </Typography>
          </FieldRow>
          <FieldRow label={t('detail.start')}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {medDraft.startDate}
            </Typography>
          </FieldRow>
          <FieldRow label={t('detail.end')}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {medDraft.endDate || '–'}
            </Typography>
          </FieldRow>
        </Box>
      );
    }

    if (state.type === 'DIET') {
      return editing ? (
        <Stack spacing={1.5}>
          <TextField
            label={t('detail.food')}
            value={dietDraft.foodName}
            onChange={(e) => setDietDraft((p) => ({ ...p, foodName: e.target.value }))}
            size="small"
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <TextField
              label={t('detail.start')}
              type="date"
              InputLabelProps={{ shrink: true }}
              value={dietDraft.startedAt}
              onChange={(e) => setDietDraft((p) => ({ ...p, startedAt: e.target.value }))}
              size="small"
            />
            <TextField
              label={t('detail.end')}
              type="date"
              InputLabelProps={{ shrink: true }}
              value={dietDraft.endedAt}
              onChange={(e) => setDietDraft((p) => ({ ...p, endedAt: e.target.value }))}
              size="small"
            />
          </Box>
          <SearchableSelect
            label={t('detail.rating')}
            value={dietDraft.suitabilityStatus}
            options={[
              { value: 'SUITABLE', label: t('detail.suitableSuitable') },
              { value: 'RISKY', label: t('detail.suitableRisky') },
              { value: 'UNSUITABLE', label: t('detail.suitableUnsuitable') },
            ]}
            onChange={(next) =>
              setDietDraft((p) => ({
                ...p,
                suitabilityStatus: next as DietDraft['suitabilityStatus'],
              }))
            }
            fullWidth
          />
          <TextField
            label={t('detail.reaction')}
            value={dietDraft.reactionNotes}
            onChange={(e) => setDietDraft((p) => ({ ...p, reactionNotes: e.target.value }))}
            size="small"
          />
        </Stack>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <FieldRow label={t('detail.food')}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {dietDraft.foodName || '–'}
            </Typography>
          </FieldRow>
          <FieldRow label={t('detail.rating')}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {t(
                `detail.suitable${dietDraft.suitabilityStatus.charAt(0) + dietDraft.suitabilityStatus.slice(1).toLowerCase()}` as never
              )}
            </Typography>
          </FieldRow>
          <FieldRow label={t('detail.start')}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {dietDraft.startedAt}
            </Typography>
          </FieldRow>
          {dietDraft.endedAt && (
            <FieldRow label={t('detail.end')}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {dietDraft.endedAt}
              </Typography>
            </FieldRow>
          )}
          {dietDraft.reactionNotes && (
            <Box sx={{ gridColumn: '1 / -1' }}>
              <FieldRow label={t('detail.reaction')}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {dietDraft.reactionNotes}
                </Typography>
              </FieldRow>
            </Box>
          )}
        </Box>
      );
    }

    if (state.type === 'EXPENSE') {
      return editing ? (
        <Stack spacing={1.5}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <TextField
              label={t('detail.date')}
              type="date"
              InputLabelProps={{ shrink: true }}
              value={expDraft.date}
              onChange={(e) => setExpDraft((p) => ({ ...p, date: e.target.value }))}
              size="small"
            />
            <TextField
              label={t('detail.expAmount')}
              type="number"
              value={expDraft.amount}
              onChange={(e) => setExpDraft((p) => ({ ...p, amount: e.target.value }))}
              size="small"
            />
          </Box>
          <SearchableSelect
            label={t('detail.category')}
            value={expDraft.category}
            options={[
              { value: 'VET_VISIT', label: t('detail.expCategoryVetVisit') },
              { value: 'MEDICATION', label: t('detail.expCategoryMedication') },
              { value: 'FOOD', label: t('detail.expCategoryFood') },
              { value: 'OTHER', label: t('detail.expCategoryOther') },
            ]}
            onChange={(next) => setExpDraft((p) => ({ ...p, category: next as ExpenseCategory }))}
            fullWidth
          />
          <TextField
            label={t('detail.note')}
            value={expDraft.note}
            onChange={(e) => setExpDraft((p) => ({ ...p, note: e.target.value }))}
            size="small"
          />
        </Stack>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <FieldRow label={t('detail.date')}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {expDraft.date}
            </Typography>
          </FieldRow>
          <FieldRow label={t('detail.amount')}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {expDraft.amount} {expDraft.currency}
            </Typography>
          </FieldRow>
          <FieldRow label={t('detail.category')}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {t(
                `detail.expCategory${
                  expDraft.category.charAt(0) +
                  expDraft.category
                    .slice(1)
                    .toLowerCase()
                    .replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
                }` as never
              )}
            </Typography>
          </FieldRow>
          {expDraft.note && (
            <Box sx={{ gridColumn: '1 / -1' }}>
              <FieldRow label={t('detail.note')}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {expDraft.note}
                </Typography>
              </FieldRow>
            </Box>
          )}
        </Box>
      );
    }

    return null;
  };

  const meta2 = meta ? TIMELINE_TYPE_META[state.type as keyof typeof TIMELINE_TYPE_META] : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, backgroundImage: 'none' } }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 3,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {meta2 && (
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette[meta2.color].main, 0.12),
              color: `${meta2.color}.main`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {TIMELINE_ICON_MAP[state.type as keyof typeof TIMELINE_ICON_MAP]}
          </Box>
        )}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
            {t('detail.title')}
          </Typography>
          {meta2 && (
            <Typography variant="caption" sx={{ color: `${meta2.color}.main`, fontWeight: 600 }}>
              {t(`timeline.${state!.type}`)}
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ borderRadius: 2 }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ pt: 2.5 }}>{renderContent()}</DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          startIcon={<DeleteIcon />}
          color="error"
          onClick={onDelete}
          size="small"
          sx={{ borderRadius: 2, mr: 'auto' }}
        >
          {t('detail.delete')}
        </Button>
        <Button onClick={onClose} size="small" sx={{ borderRadius: 2 }}>
          {t('detail.close')}
        </Button>
        {!editing ? (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            size="small"
            onClick={() => setEditing(true)}
            sx={{ borderRadius: 2 }}
          >
            {t('detail.edit')}
          </Button>
        ) : (
          <Button variant="contained" size="small" onClick={handleSave} sx={{ borderRadius: 2 }}>
            {t('detail.save')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
