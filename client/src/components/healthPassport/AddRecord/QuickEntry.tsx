import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Box, Button, Chip, Stack, Tooltip, Typography, alpha, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  Biotech as DewormIcon,
  Healing as HealingIcon,
  Medication as MedIcon,
  PestControl as EctoIcon,
  Restaurant as DietIcon,
  Vaccines as VaccinesIcon,
} from '@mui/icons-material';

import type { TreatmentRecord } from '../../../types/petHealth';
import type { VisitBundle, WizardVisitDraft } from '../../../utils/vetVisitHelper';
import { VetVisitHelper } from '../../../utils/vetVisitHelper';
import { plusDays, today, uid } from '../utils';
import DateField from '../../DateField';

import VaccinationFields from './sections/linked/VaccinationFields';
import DewormingFields from './sections/linked/DewormingFields';
import EctoFields from './sections/linked/EctoFields';
import TreatmentFields from './sections/linked/TreatmentFields';
import MedicationFields from './sections/linked/MedicationFields';
import DietFields from './sections/linked/DietFields';

import type {
  DewormingFieldsValues,
  DietFieldsValues,
  EctoFieldsValues,
  LinkedKind,
  MedicationFieldsValues,
  TreatmentFieldsValues,
  VaccinationFieldsValues,
} from './formTypes';

// „Liečba" (chronická/opakovaná liečba) sa neukladá cez visit-bundle, ale
// priamym addTreatment — preto ju submit vetví zvlášť (viď onSaveTreatment nižšie).
type QuickKind = LinkedKind;

const DEFAULTS = {
  vaccination: {
    name: '',
    type: 'RABIES',
    validUntil: '',
    batchNumber: '',
  } as VaccinationFieldsValues,
  deworming: { product: '', validUntil: '', intervalDays: 90 } as DewormingFieldsValues,
  ecto: { product: '', form: 'TABLET', validUntil: '', intervalDays: 30 } as EctoFieldsValues,
  treatment: {
    category: 'ALLERGY_SKIN',
    name: '',
    form: 'TABLET',
    validUntil: '',
    intervalDays: 28,
  } as TreatmentFieldsValues,
  medication: {
    name: '',
    reason: '',
    dose: '',
    frequency: '',
    endDate: '',
  } as MedicationFieldsValues,
  diet: { foodName: '', reactionNotes: '', suitabilityStatus: 'SUITABLE' } as DietFieldsValues,
};

const KIND_META: Record<QuickKind, { labelKey: string; icon: typeof VaccinesIcon }> = {
  vaccination: { labelKey: 'addRecord.kindVaccination', icon: VaccinesIcon },
  deworming: { labelKey: 'addRecord.kindDeworming', icon: DewormIcon },
  ecto: { labelKey: 'addRecord.kindEcto', icon: EctoIcon },
  treatment: { labelKey: 'addRecord.kindTreatment', icon: HealingIcon },
  medication: { labelKey: 'addRecord.kindMedication', icon: MedIcon },
  diet: { labelKey: 'addRecord.kindDiet', icon: DietIcon },
};

const KIND_ORDER: QuickKind[] = [
  'vaccination',
  'deworming',
  'ecto',
  'treatment',
  'medication',
  'diet',
];

interface ContextValue {
  submit: () => void;
  cancel: () => void;
}

const QuickEntryContext = createContext<ContextValue | null>(null);

export function useQuickEntry(): ContextValue {
  const ctx = useContext(QuickEntryContext);
  if (!ctx) throw new Error('useQuickEntry must be inside QuickEntryProvider');
  return ctx;
}

interface ProviderProps {
  petId: string;
  currentDietEntryId?: string;
  onSave: (bundle: VisitBundle) => void;
  onSaveTreatment: (payload: Partial<TreatmentRecord>) => void;
  onCancel: () => void;
  children: ReactNode;
}

const PROVIDER_DATA = createContext<{
  date: string;
  setDate: (d: string) => void;
  kind: QuickKind;
  setKind: (k: QuickKind) => void;
  vaccination: VaccinationFieldsValues;
  setVaccination: <K extends keyof VaccinationFieldsValues>(
    f: K,
    v: VaccinationFieldsValues[K]
  ) => void;
  deworming: DewormingFieldsValues;
  setDeworming: <K extends keyof DewormingFieldsValues>(f: K, v: DewormingFieldsValues[K]) => void;
  ecto: EctoFieldsValues;
  setEcto: <K extends keyof EctoFieldsValues>(f: K, v: EctoFieldsValues[K]) => void;
  treatment: TreatmentFieldsValues;
  setTreatment: <K extends keyof TreatmentFieldsValues>(f: K, v: TreatmentFieldsValues[K]) => void;
  medication: MedicationFieldsValues;
  setMedication: <K extends keyof MedicationFieldsValues>(
    f: K,
    v: MedicationFieldsValues[K]
  ) => void;
  diet: DietFieldsValues;
  setDiet: <K extends keyof DietFieldsValues>(f: K, v: DietFieldsValues[K]) => void;
  showErrors: boolean;
  primaryFieldFilled: boolean;
} | null>(null);

function useData() {
  const ctx = useContext(PROVIDER_DATA);
  if (!ctx) throw new Error('PROVIDER_DATA missing');
  return ctx;
}

export default function QuickEntryProvider({
  petId,
  currentDietEntryId,
  onSave,
  onSaveTreatment,
  onCancel,
  children,
}: ProviderProps) {
  const { t } = useTranslation('healthPassport');
  const [date, setDate] = useState(today());
  const [kind, setKind] = useState<QuickKind>('vaccination');
  const [showErrors, setShowErrors] = useState(false);
  const [vaccination, _setVaccination] = useState<VaccinationFieldsValues>(DEFAULTS.vaccination);
  const [deworming, _setDeworming] = useState<DewormingFieldsValues>(DEFAULTS.deworming);
  const [ecto, _setEcto] = useState<EctoFieldsValues>(DEFAULTS.ecto);
  const [treatment, _setTreatment] = useState<TreatmentFieldsValues>(DEFAULTS.treatment);
  const [medication, _setMedication] = useState<MedicationFieldsValues>(DEFAULTS.medication);
  const [diet, _setDiet] = useState<DietFieldsValues>(DEFAULTS.diet);

  const setVaccination = useCallback(
    <K extends keyof VaccinationFieldsValues>(f: K, v: VaccinationFieldsValues[K]) =>
      _setVaccination((prev) => ({ ...prev, [f]: v })),
    []
  );
  const setDeworming = useCallback(
    <K extends keyof DewormingFieldsValues>(f: K, v: DewormingFieldsValues[K]) =>
      _setDeworming((prev) => ({ ...prev, [f]: v })),
    []
  );
  const setEcto = useCallback(
    <K extends keyof EctoFieldsValues>(f: K, v: EctoFieldsValues[K]) =>
      _setEcto((prev) => ({ ...prev, [f]: v })),
    []
  );
  const setTreatment = useCallback(
    <K extends keyof TreatmentFieldsValues>(f: K, v: TreatmentFieldsValues[K]) =>
      _setTreatment((prev) => ({ ...prev, [f]: v })),
    []
  );
  const setMedication = useCallback(
    <K extends keyof MedicationFieldsValues>(f: K, v: MedicationFieldsValues[K]) =>
      _setMedication((prev) => ({ ...prev, [f]: v })),
    []
  );
  const setDiet = useCallback(
    <K extends keyof DietFieldsValues>(f: K, v: DietFieldsValues[K]) =>
      _setDiet((prev) => ({ ...prev, [f]: v })),
    []
  );

  const primaryFieldFilled =
    (kind === 'vaccination' && vaccination.name.trim().length > 0) ||
    (kind === 'deworming' && deworming.product.trim().length > 0) ||
    (kind === 'ecto' && ecto.product.trim().length > 0) ||
    (kind === 'treatment' && treatment.name.trim().length > 0) ||
    (kind === 'medication' && medication.name.trim().length > 0) ||
    (kind === 'diet' && diet.foodName.trim().length > 0);

  const submit = useCallback(() => {
    setShowErrors(true);
    if (!primaryFieldFilled) return;

    if (kind === 'treatment') {
      onSaveTreatment({
        petId,
        category: treatment.category,
        name: treatment.name.trim(),
        form: treatment.form,
        dateGiven: date,
        intervalDays: treatment.intervalDays > 0 ? treatment.intervalDays : undefined,
        nextDueDate:
          treatment.intervalDays > 0
            ? treatment.validUntil || plusDays(date, treatment.intervalDays)
            : '',
      });
      return;
    }

    const draft: WizardVisitDraft = {
      date,
      clinicName: t('addRecord.ownRecord'),
      reason: t(KIND_META[kind].labelKey as never),
      findings: '',
      diagnosis: '',
      recommendations: '',
      nextCheckDate: '',
      addVaccination: kind === 'vaccination',
      vaccineName: vaccination.name,
      vaccineType: vaccination.type,
      vaccineValidUntil: vaccination.validUntil,
      addDeworming: kind === 'deworming',
      dewormProduct: deworming.product,
      dewormValidUntil: deworming.validUntil,
      dewormInterval: deworming.intervalDays,
      addEcto: kind === 'ecto',
      ectoProduct: ecto.product,
      ectoForm: ecto.form,
      ectoValidUntil: ecto.validUntil,
      ectoInterval: ecto.intervalDays,
      addMedication: kind === 'medication',
      medName: medication.name,
      medReason: medication.reason,
      medDose: medication.dose,
      medFrequency: medication.frequency,
      medEndDate: medication.endDate,
      addDiet: kind === 'diet',
      foodName: diet.foodName,
      reactionNotes: diet.reactionNotes,
      suitabilityStatus: diet.suitabilityStatus,
      totalExpense: '',
      extraMedicationExpense: '',
      extraFoodExpense: '',
    };

    const bundle = VetVisitHelper.createWizardVisitBundle({
      petId,
      draft,
      mainCategory: '',
      subcategory: '',
      attachmentDraft: { attachmentLabel: '' },
      currentDietEntryId,
      plusDays,
      uid,
    });
    onSave(bundle);
  }, [
    primaryFieldFilled,
    date,
    kind,
    vaccination,
    deworming,
    ecto,
    treatment,
    medication,
    diet,
    petId,
    currentDietEntryId,
    onSave,
    onSaveTreatment,
  ]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [submit]);

  const ctxValue = useMemo<ContextValue>(() => ({ submit, cancel: onCancel }), [submit, onCancel]);

  const dataValue = {
    date,
    setDate,
    kind,
    setKind,
    vaccination,
    setVaccination,
    deworming,
    setDeworming,
    ecto,
    setEcto,
    treatment,
    setTreatment,
    medication,
    setMedication,
    diet,
    setDiet,
    showErrors,
    primaryFieldFilled,
  };

  return (
    <QuickEntryContext.Provider value={ctxValue}>
      <PROVIDER_DATA.Provider value={dataValue}>{children}</PROVIDER_DATA.Provider>
    </QuickEntryContext.Provider>
  );
}

export function QuickEntryBody() {
  const theme = useTheme();
  const { t } = useTranslation('healthPassport');
  const {
    date,
    setDate,
    kind,
    setKind,
    vaccination,
    setVaccination,
    deworming,
    setDeworming,
    ecto,
    setEcto,
    treatment,
    setTreatment,
    medication,
    setMedication,
    diet,
    setDiet,
    showErrors,
    primaryFieldFilled,
  } = useData();

  const renderFields = () => {
    switch (kind) {
      case 'vaccination':
        return (
          <VaccinationFields
            values={vaccination}
            onChange={setVaccination}
            errorName={
              showErrors && !primaryFieldFilled ? t('addRecord.errorVaccineName') : undefined
            }
          />
        );
      case 'deworming':
        return (
          <DewormingFields
            values={deworming}
            baseDate={date}
            onChange={setDeworming}
            errorProduct={
              showErrors && !primaryFieldFilled ? t('addRecord.errorProduct') : undefined
            }
          />
        );
      case 'treatment':
        return (
          <TreatmentFields
            values={treatment}
            baseDate={date}
            onChange={setTreatment}
            errorName={
              showErrors && !primaryFieldFilled ? t('addRecord.errorTreatmentName') : undefined
            }
          />
        );
      case 'ecto':
        return (
          <EctoFields
            values={ecto}
            baseDate={date}
            onChange={setEcto}
            errorProduct={
              showErrors && !primaryFieldFilled ? t('addRecord.errorProduct') : undefined
            }
          />
        );
      case 'medication':
        return (
          <MedicationFields
            values={medication}
            onChange={setMedication}
            errorName={showErrors && !primaryFieldFilled ? t('addRecord.errorDrugName') : undefined}
          />
        );
      case 'diet':
        return (
          <DietFields
            values={diet}
            onChange={setDiet}
            errorFoodName={
              showErrors && !primaryFieldFilled ? t('addRecord.errorFoodName') : undefined
            }
          />
        );
    }
  };

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            display: 'block',
            mb: 1,
            fontSize: '0.72rem',
            letterSpacing: '0.08em',
          }}
        >
          {t('addRecord.kindLabel')}
        </Typography>
        <Stack direction="row" gap={1} flexWrap="wrap">
          {KIND_ORDER.map((k) => {
            const meta = KIND_META[k];
            const label = t(meta.labelKey as never);
            const active = k === kind;
            const Icon = meta.icon;
            return (
              <Tooltip key={k} title={label}>
                <Chip
                  icon={<Icon sx={{ fontSize: 16 }} />}
                  label={label}
                  onClick={() => setKind(k)}
                  clickable
                  variant={active ? 'filled' : 'outlined'}
                  color={active ? 'primary' : 'default'}
                  sx={{
                    height: 34,
                    fontWeight: 600,
                    bgcolor: active ? undefined : alpha(theme.palette.text.primary, 0.02),
                    '& .MuiChip-icon': { color: active ? 'inherit' : 'text.secondary' },
                  }}
                />
              </Tooltip>
            );
          })}
        </Stack>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            mt: 1.25,
            fontSize: '0.8rem',
            lineHeight: 1.4,
          }}
        >
          {t(`addRecord.kindDesc.${kind}`)}
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start">
        <DateField
          label={t(`addRecord.dateByKind.${kind}`)}
          value={date}
          onChange={setDate}
          sx={{ width: { xs: '100%', sm: 220 } }}
        />
      </Stack>

      <Box>{renderFields()}</Box>

      <Typography
        variant="caption"
        sx={{
          color: 'text.disabled',
          textTransform: 'none',
          letterSpacing: 0,
          fontSize: '0.75rem',
        }}
      >
        {t('addRecord.quickHint')}
      </Typography>
    </Stack>
  );
}

export function QuickEntryFooter() {
  const { submit, cancel } = useQuickEntry();
  const { t } = useTranslation('healthPassport');
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  return (
    <>
      <Box sx={{ flex: 1, pl: 1, display: { xs: 'none', sm: 'block' } }}>
        <Typography
          variant="caption"
          sx={{ color: 'text.disabled', textTransform: 'none', letterSpacing: 0 }}
        >
          {t('addRecord.tipShortcut', { modKey })}
        </Typography>
      </Box>
      <Button onClick={cancel}>{t('addRecord.cancel')}</Button>
      <Tooltip title={`${modKey} + Enter`} placement="top">
        <Button variant="contained" onClick={submit}>
          {t('addRecord.save')}
        </Button>
      </Tooltip>
    </>
  );
}
