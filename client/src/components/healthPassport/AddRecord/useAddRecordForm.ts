import { useCallback, useMemo, useReducer } from 'react';
import { useTranslation } from 'react-i18next';

import i18n from '../../../i18n';
import { VISIT_CATEGORY_OPTIONS } from '../constants';

import type { DietEntry, EctoparasiteRecord, VaccinationRecord } from '../../../types/petHealth';
import {
  VetVisitHelper,
  type VisitBundle,
  type WizardVisitDraft,
} from '../../../utils/vetVisitHelper';
import { plusDays, today, uid } from '../utils';

import type {
  ClinicalNotesValues,
  DewormingFieldsValues,
  DietFieldsValues,
  EctoFieldsValues,
  ErrorMap,
  ExpensesValues,
  LinkedKind,
  ManualFormState,
  MedicationFieldsValues,
  TreatmentFieldsValues,
  VaccinationFieldsValues,
  VisitBasicsValues,
} from './formTypes';

const DEFAULT_VACCINATION: VaccinationFieldsValues = {
  name: '',
  type: 'RABIES',
  validUntil: '',
  batchNumber: '',
};

const DEFAULT_DEWORMING: DewormingFieldsValues = {
  product: '',
  validUntil: '',
  intervalDays: 90,
};

const DEFAULT_ECTO: EctoFieldsValues = {
  product: '',
  form: 'TABLET',
  validUntil: '',
  intervalDays: 30,
};

const DEFAULT_TREATMENT: TreatmentFieldsValues = {
  category: 'ALLERGY_SKIN',
  name: '',
  form: 'TABLET',
  validUntil: '',
  intervalDays: 28,
};

const DEFAULT_MEDICATION: MedicationFieldsValues = {
  name: '',
  reason: '',
  dose: '',
  frequency: '',
  endDate: '',
};

const DEFAULT_DIET: DietFieldsValues = {
  foodName: '',
  reactionNotes: '',
  suitabilityStatus: 'SUITABLE',
};

export const INITIAL_MANUAL_STATE: ManualFormState = {
  basics: {
    date: today(),
    clinicName: '',
    reason: '',
    mainCategory: '',
    subcategory: '',
  },
  clinical: {
    findings: '',
    diagnosis: '',
    recommendations: '',
  },
  linked: {},
  expenses: {
    totalExpense: '',
    extraMedicationExpense: '',
    extraFoodExpense: '',
    nextCheckDate: '',
  },
  submitAttempted: false,
};

export type ManualFormAction =
  | { type: 'SET_BASICS_FIELD'; field: keyof VisitBasicsValues; value: string }
  | { type: 'SET_CLINICAL_FIELD'; field: keyof ClinicalNotesValues; value: string }
  | { type: 'TOGGLE_LINKED'; kind: LinkedKind; on: boolean }
  | {
      type: 'SET_VACCINATION_FIELD';
      field: keyof VaccinationFieldsValues;
      value: string | VaccinationRecord['type'];
    }
  | {
      type: 'SET_DEWORMING_FIELD';
      field: keyof DewormingFieldsValues;
      value: string | number;
    }
  | {
      type: 'SET_ECTO_FIELD';
      field: keyof EctoFieldsValues;
      value: string | number | EctoparasiteRecord['form'];
    }
  | {
      type: 'SET_TREATMENT_FIELD';
      field: keyof TreatmentFieldsValues;
      value: string | number | TreatmentFieldsValues['category'] | TreatmentFieldsValues['form'];
    }
  | {
      type: 'SET_MEDICATION_FIELD';
      field: keyof MedicationFieldsValues;
      value: string;
    }
  | {
      type: 'SET_DIET_FIELD';
      field: keyof DietFieldsValues;
      value: string | NonNullable<DietEntry['suitabilityStatus']>;
    }
  | { type: 'SET_EXPENSE_FIELD'; field: keyof ExpensesValues; value: string }
  | { type: 'SET_SUBMIT_ATTEMPTED'; on: boolean }
  | { type: 'RESET' };

const defaultsByKind = {
  vaccination: DEFAULT_VACCINATION,
  deworming: DEFAULT_DEWORMING,
  ecto: DEFAULT_ECTO,
  treatment: DEFAULT_TREATMENT,
  medication: DEFAULT_MEDICATION,
  diet: DEFAULT_DIET,
} as const;

function reducer(state: ManualFormState, action: ManualFormAction): ManualFormState {
  switch (action.type) {
    case 'SET_BASICS_FIELD':
      return { ...state, basics: { ...state.basics, [action.field]: action.value } };
    case 'SET_CLINICAL_FIELD':
      return { ...state, clinical: { ...state.clinical, [action.field]: action.value } };
    case 'TOGGLE_LINKED': {
      const next = { ...state.linked };
      if (action.on) {
        if (action.kind === 'vaccination')
          next.vaccination = next.vaccination ?? DEFAULT_VACCINATION;
        if (action.kind === 'deworming') next.deworming = next.deworming ?? DEFAULT_DEWORMING;
        if (action.kind === 'ecto') next.ecto = next.ecto ?? DEFAULT_ECTO;
        if (action.kind === 'treatment') next.treatment = next.treatment ?? DEFAULT_TREATMENT;
        if (action.kind === 'medication') next.medication = next.medication ?? DEFAULT_MEDICATION;
        if (action.kind === 'diet') next.diet = next.diet ?? DEFAULT_DIET;
      } else {
        delete next[action.kind];
      }
      return { ...state, linked: next };
    }
    case 'SET_VACCINATION_FIELD': {
      const current = state.linked.vaccination ?? defaultsByKind.vaccination;
      return {
        ...state,
        linked: { ...state.linked, vaccination: { ...current, [action.field]: action.value } },
      };
    }
    case 'SET_DEWORMING_FIELD': {
      const current = state.linked.deworming ?? defaultsByKind.deworming;
      return {
        ...state,
        linked: { ...state.linked, deworming: { ...current, [action.field]: action.value } },
      };
    }
    case 'SET_ECTO_FIELD': {
      const current = state.linked.ecto ?? defaultsByKind.ecto;
      return {
        ...state,
        linked: { ...state.linked, ecto: { ...current, [action.field]: action.value } },
      };
    }
    case 'SET_TREATMENT_FIELD': {
      const current = state.linked.treatment ?? defaultsByKind.treatment;
      return {
        ...state,
        linked: { ...state.linked, treatment: { ...current, [action.field]: action.value } },
      };
    }
    case 'SET_MEDICATION_FIELD': {
      const current = state.linked.medication ?? defaultsByKind.medication;
      return {
        ...state,
        linked: { ...state.linked, medication: { ...current, [action.field]: action.value } },
      };
    }
    case 'SET_DIET_FIELD': {
      const current = state.linked.diet ?? defaultsByKind.diet;
      return {
        ...state,
        linked: { ...state.linked, diet: { ...current, [action.field]: action.value } },
      };
    }
    case 'SET_EXPENSE_FIELD':
      return { ...state, expenses: { ...state.expenses, [action.field]: action.value } };
    case 'SET_SUBMIT_ATTEMPTED':
      return { ...state, submitAttempted: action.on };
    case 'RESET':
      return { ...INITIAL_MANUAL_STATE, basics: { ...INITIAL_MANUAL_STATE.basics, date: today() } };
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}

const isPositiveNumeric = (raw: string): boolean => {
  if (raw.trim() === '') return true;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0;
};

const isInvalidDateRange = (startIso: string, endIso: string): boolean => {
  if (!startIso?.trim() || !endIso?.trim()) return false;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  return end < start;
};

export function validateManualForm(state: ManualFormState): ErrorMap {
  const t = (k: string) => i18n.t(k as never, { ns: 'healthPassport' }) as string;
  const errors: ErrorMap = {};
  if (!state.basics.date.trim() || Number.isNaN(new Date(state.basics.date).getTime())) {
    errors['basics.date'] = t('validation.invalidDate');
  }
  if (!state.basics.clinicName.trim()) {
    errors['basics.clinicName'] = t('validation.clinicRequired');
  }
  if (state.linked.vaccination && !state.linked.vaccination.name.trim()) {
    errors['linked.vaccination.name'] = t('validation.vaccinationNameRequired');
  }
  if (
    state.linked.vaccination &&
    isInvalidDateRange(state.basics.date, state.linked.vaccination.validUntil)
  ) {
    errors['linked.vaccination.validUntil'] = t('validation.vaccinationValidUntilBeforeApplied');
  }
  if (state.linked.deworming && !state.linked.deworming.product.trim()) {
    errors['linked.deworming.product'] = t('validation.productRequired');
  }
  if (
    state.linked.deworming &&
    isInvalidDateRange(state.basics.date, state.linked.deworming.validUntil)
  ) {
    errors['linked.deworming.validUntil'] = t('validation.dewormingNextDueBeforeGiven');
  }
  if (state.linked.ecto && !state.linked.ecto.product.trim()) {
    errors['linked.ecto.product'] = t('validation.productRequired');
  }
  if (state.linked.ecto && isInvalidDateRange(state.basics.date, state.linked.ecto.validUntil)) {
    errors['linked.ecto.validUntil'] = t('validation.ectoNextDueBeforeGiven');
  }
  if (state.linked.treatment && !state.linked.treatment.name.trim()) {
    errors['linked.treatment.name'] = t('validation.treatmentNameRequired');
  }
  if (state.linked.medication && !state.linked.medication.name.trim()) {
    errors['linked.medication.name'] = t('validation.medicationNameRequired');
  }
  if (state.linked.diet && !state.linked.diet.foodName.trim()) {
    errors['linked.diet.foodName'] = t('validation.foodNameRequired');
  }
  if (!isPositiveNumeric(state.expenses.totalExpense)) {
    errors['expenses.totalExpense'] = t('validation.nonNegativeRequired');
  }
  if (!isPositiveNumeric(state.expenses.extraMedicationExpense)) {
    errors['expenses.extraMedicationExpense'] = t('validation.nonNegativeRequired');
  }
  if (!isPositiveNumeric(state.expenses.extraFoodExpense)) {
    errors['expenses.extraFoodExpense'] = t('validation.nonNegativeRequired');
  }
  return errors;
}

export const sectionsWithErrors = (errors: ErrorMap) => ({
  basics: Boolean(errors['basics.date'] || errors['basics.clinicName']),
  linked: Boolean(
    errors['linked.vaccination.name'] ||
    errors['linked.vaccination.validUntil'] ||
    errors['linked.deworming.product'] ||
    errors['linked.deworming.validUntil'] ||
    errors['linked.ecto.product'] ||
    errors['linked.ecto.validUntil'] ||
    errors['linked.treatment.name'] ||
    errors['linked.medication.name'] ||
    errors['linked.diet.foodName']
  ),
  expenses: Boolean(
    errors['expenses.totalExpense'] ||
    errors['expenses.extraMedicationExpense'] ||
    errors['expenses.extraFoodExpense']
  ),
});

interface BuildContext {
  petId: string;
  currentDietEntryId?: string;
}

function toWizardDraft(state: ManualFormState): WizardVisitDraft {
  const v = state.linked.vaccination;
  const d = state.linked.deworming;
  const e = state.linked.ecto;
  const m = state.linked.medication;
  const di = state.linked.diet;

  return {
    date: state.basics.date,
    clinicName: state.basics.clinicName,
    reason: state.basics.reason,
    findings: state.clinical.findings,
    diagnosis: state.clinical.diagnosis,
    recommendations: state.clinical.recommendations,
    nextCheckDate: state.expenses.nextCheckDate,
    addVaccination: Boolean(v),
    vaccineName: v?.name ?? '',
    vaccineType: v?.type ?? 'RABIES',
    vaccineValidUntil: v?.validUntil ?? '',
    addDeworming: Boolean(d),
    dewormProduct: d?.product ?? '',
    dewormValidUntil: d?.validUntil ?? '',
    dewormInterval: d?.intervalDays ?? 90,
    addEcto: Boolean(e),
    ectoProduct: e?.product ?? '',
    ectoForm: e?.form ?? 'TABLET',
    ectoValidUntil: e?.validUntil ?? '',
    ectoInterval: e?.intervalDays ?? 30,
    addMedication: Boolean(m),
    medName: m?.name ?? '',
    medReason: m?.reason ?? '',
    medDose: m?.dose ?? '',
    medFrequency: m?.frequency ?? '',
    medEndDate: m?.endDate ?? '',
    addDiet: Boolean(di),
    foodName: di?.foodName ?? '',
    reactionNotes: di?.reactionNotes ?? '',
    suitabilityStatus: di?.suitabilityStatus ?? 'SUITABLE',
    totalExpense: state.expenses.totalExpense,
    extraMedicationExpense: state.expenses.extraMedicationExpense,
    extraFoodExpense: state.expenses.extraFoodExpense,
  };
}

export function useAddRecordForm() {
  const [state, dispatch] = useReducer(reducer, INITIAL_MANUAL_STATE);
  const { t } = useTranslation('healthPassport');

  const errors = useMemo<ErrorMap>(
    () => (state.submitAttempted ? validateManualForm(state) : {}),
    [state]
  );

  const buildBundle = useCallback(
    (ctx: BuildContext): VisitBundle => {
      const mainCatKey = state.basics.mainCategory;
      const subCatKey = state.basics.subcategory;
      const mainLabel = mainCatKey
        ? t(`visitCategory.${mainCatKey}`, { defaultValue: mainCatKey })
        : '';
      const subLabel = subCatKey
        ? (() => {
            const cat = VISIT_CATEGORY_OPTIONS.find((o) => o.key === mainCatKey);
            const sub = cat?.sub.find((s) => s.key === subCatKey);
            return sub ? t(`visitCategory.${sub.key}`, { defaultValue: sub.key }) : subCatKey;
          })()
        : '';
      return VetVisitHelper.createWizardVisitBundle({
        petId: ctx.petId,
        draft: toWizardDraft(state),
        mainCategory: mainLabel,
        subcategory: subLabel,
        attachmentDraft: { attachmentLabel: '' },
        currentDietEntryId: ctx.currentDietEntryId,
        plusDays,
        uid,
      });
    },
    [state, t]
  );

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);
  const markSubmitAttempted = useCallback(
    () => dispatch({ type: 'SET_SUBMIT_ATTEMPTED', on: true }),
    []
  );

  return { state, dispatch, errors, buildBundle, reset, markSubmitAttempted };
}
