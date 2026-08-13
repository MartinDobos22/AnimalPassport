import type {
  AttachmentRef,
  DietEntry,
  EctoparasiteRecord,
  TreatmentCategory,
  TreatmentForm,
  VaccinationRecord,
} from '../../../types/petHealth';
import type { AiDetectedDraftRecord } from '../hpTypes';

export interface VisitBasicsValues {
  date: string;
  clinicName: string;
  reason: string;
  mainCategory: string;
  subcategory: string;
}

export interface ClinicalNotesValues {
  findings: string;
  diagnosis: string;
  recommendations: string;
}

export interface VaccinationFieldsValues {
  name: string;
  type: VaccinationRecord['type'];
  validUntil: string;
  batchNumber: string;
}

export interface DewormingFieldsValues {
  product: string;
  validUntil: string;
  intervalDays: number;
}

export interface EctoFieldsValues {
  product: string;
  form: EctoparasiteRecord['form'];
  validUntil: string;
  intervalDays: number;
}

export interface TreatmentFieldsValues {
  category: TreatmentCategory;
  name: string;
  form: TreatmentForm;
  validUntil: string;
  intervalDays: number;
}

export interface MedicationFieldsValues {
  name: string;
  reason: string;
  dose: string;
  frequency: string;
  endDate: string;
}

export interface DietFieldsValues {
  foodName: string;
  reactionNotes: string;
  suitabilityStatus: NonNullable<DietEntry['suitabilityStatus']>;
}

export type LinkedKind = 'vaccination' | 'deworming' | 'ecto' | 'treatment' | 'medication' | 'diet';

export interface LinkedRecordsValues {
  vaccination?: VaccinationFieldsValues;
  deworming?: DewormingFieldsValues;
  ecto?: EctoFieldsValues;
  treatment?: TreatmentFieldsValues;
  medication?: MedicationFieldsValues;
  diet?: DietFieldsValues;
}

export interface ExpensesValues {
  totalExpense: string;
  extraMedicationExpense: string;
  extraFoodExpense: string;
  nextCheckDate: string;
}

export type FieldKey =
  | 'basics.date'
  | 'basics.clinicName'
  | 'linked.vaccination.name'
  | 'linked.vaccination.validUntil'
  | 'linked.deworming.product'
  | 'linked.deworming.validUntil'
  | 'linked.ecto.product'
  | 'linked.ecto.validUntil'
  | 'linked.treatment.name'
  | 'linked.medication.name'
  | 'linked.diet.foodName'
  | 'expenses.totalExpense'
  | 'expenses.extraMedicationExpense'
  | 'expenses.extraFoodExpense';

export type ErrorMap = Partial<Record<FieldKey, string>>;

export interface ManualFormState {
  basics: VisitBasicsValues;
  clinical: ClinicalNotesValues;
  linked: LinkedRecordsValues;
  expenses: ExpensesValues;
  submitAttempted: boolean;
}

export type AiStep = 0 | 1 | 2;

export interface AiAttachmentDraft {
  fileName: string;
  mimeType: string;
  base64Data: string;
}

export interface AiAttachmentEntry {
  id: string;
  file: File;
  previewUrl: string;
  pending: AiAttachmentDraft;
  attachment: AttachmentRef;
}

export type AnalyzeStage = 'ocr' | 'interpret';

export interface AnalyzeProgress {
  done: number;
  total: number;
  stage: AnalyzeStage;
}

export interface AiVisitDraftValues {
  date: string;
  clinicName: string;
  diagnosis: string;
  recommendations: string;
}

export interface AiFormState {
  step: AiStep;
  attachments: AiAttachmentEntry[];
  attachmentError: string;
  attachmentLabel: string;
  analyzeError: string;
  analyzeProgress: AnalyzeProgress | null;
  selectedMainCategory: string;
  selectedSubcategory: string;
  aiDetectedRecords: AiDetectedDraftRecord[];
  useVisitDetailsFromManual: boolean;
  visitDraft: AiVisitDraftValues;
  feedback: string | null;
  detectedProfilePatch: import('../../../utils/petProfileMerge').PetProfilePatch | null;
  detectedProfileAvailable: boolean;
  documentSummary: string;
  importAllHistory: boolean;
}
