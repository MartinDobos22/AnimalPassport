export type PetSex = 'MALE' | 'FEMALE' | 'UNKNOWN';
export type VaccineType =
  | 'RABIES'
  | 'COMBINED'
  | 'DISTEMPER'
  | 'PARVOVIROSIS'
  | 'HEPATITIS'
  | 'PARAINFLUENZA'
  | 'LEPTOSPIROSIS'
  | 'KENNEL_COUGH'
  | 'LYME'
  | 'OTHER';
export type ValidityStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'UNKNOWN';
export type EctoForm = 'TABLET' | 'SPOT_ON' | 'COLLAR';
export type ExpenseCategory = 'VET_VISIT' | 'MEDICATION' | 'FOOD' | 'OTHER';
export type ExamResult = 'NORMAL' | 'ABNORMAL' | 'INCONCLUSIVE';
export type TimelineType =
  | 'VACCINATION'
  | 'DEWORMING'
  | 'ECTOPARASITE'
  | 'TREATMENT'
  | 'VET_VISIT'
  | 'MEDICATION'
  | 'DIET'
  | 'EXPENSE'
  | 'NOTE';

export interface AttachmentRef {
  objectPath: string;
  mimeType: string;
  size: number;
  caption?: string;
  createdAt: string;
}

export interface ChronicCondition {
  id: string;
  title: string;
  description?: string;
}

export interface ProcedureRecord {
  id: string;
  title: string;
  date: string;
  notes?: string;
}

export interface VaccinationRecord {
  id: string;
  petId: string;
  type: VaccineType;
  name: string;
  dateApplied: string;
  validUntil: string;
  batchNumber?: string;
  note?: string;
  attachments?: AttachmentRef[];
}

export interface DewormingRecord {
  id: string;
  petId: string;
  productName: string;
  dateGiven: string;
  intervalDays: number;
  nextDueDate: string;
  note?: string;
  attachments?: AttachmentRef[];
}

export interface EctoparasiteRecord {
  id: string;
  petId: string;
  productName: string;
  form: EctoForm;
  dateGiven: string;
  intervalDays?: number;
  durationDays?: number;
  nextDueDate: string;
  note?: string;
  attachments?: AttachmentRef[];
}

export type TreatmentCategory =
  | 'ALLERGY_SKIN'
  | 'PAIN_JOINTS'
  | 'HEART'
  | 'ENDOCRINE'
  | 'NEURO'
  | 'DIGESTIVE'
  | 'RENAL_URINARY'
  | 'EYES'
  | 'EARS'
  | 'BEHAVIOR'
  | 'INFECTION'
  | 'IMMUNE'
  | 'ONCOLOGY'
  | 'OTHER';

export type TreatmentForm = 'TABLET' | 'INJECTION' | 'DROPS' | 'TOPICAL' | 'DIET' | 'OTHER';

export interface TreatmentRecord {
  id: string;
  petId: string;
  category: TreatmentCategory;
  name: string;
  form?: TreatmentForm;
  reason?: string;
  dateGiven: string;
  intervalDays?: number;
  nextDueDate: string;
  note?: string;
  createdAt?: string;
  attachments?: AttachmentRef[];
}

export interface VetVisitRecord {
  id: string;
  petId: string;
  date: string;
  clinicName: string;
  vetName?: string;
  reason: string;
  findings?: string;
  diagnosis?: string;
  recommendations?: string;
  dietChange?: string;
  nextCheckDate?: string;
  aiExtractedText?: string;
  aiExamType?: string;
  examResult?: ExamResult;
  medicationIds: string[];
  attachments?: AttachmentRef[];
}

export interface MedicationRecord {
  id: string;
  petId: string;
  name: string;
  reason: string;
  dose: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  longTerm?: boolean;
  fromVetVisitId?: string;
  note?: string;
}

export interface MedicationDoseLog {
  id: string;
  petId: string;
  medicationId: string;
  date: string;
  taken: boolean;
}

export interface DietEntry {
  id: string;
  petId: string;
  foodId?: string;
  foodName: string;
  foodType?: 'main' | 'wet' | 'treats' | 'supplement';
  startedAt: string;
  endedAt?: string;
  reactionNotes?: string;
  suitabilityStatus?: 'SUITABLE' | 'RISKY' | 'UNSUITABLE';
  suitabilityReasons?: string[];
  createdAt?: string;
}

export interface ExpenseRecord {
  id: string;
  petId: string;
  date: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  relatedVetVisitId?: string;
  relatedDietEntryId?: string;
  note?: string;
}

export interface TimelineEvent {
  id: string;
  petId: string;
  type: TimelineType;
  title: string;
  subtitle?: string;
  date: string;
}

export interface WeightLog {
  id: string;
  petId: string;
  date: string;
  kg: number;
}

export type CheckInOverallStatus = 'ok' | 'changed' | 'unsure';
export type CheckInAppetite = 'normal' | 'less' | 'more' | 'refuses';
export type CheckInEnergy = 'normal' | 'lower' | 'higher' | 'very_low';
export type CheckInStool = 'normal' | 'soft' | 'diarrhea' | 'constipation' | 'blood_mucus';
export type CheckInSkinCoat = 'normal' | 'itching' | 'redness' | 'dandruff' | 'hair_loss';
export type CheckInBehavior = 'normal' | 'apathetic' | 'nervous' | 'aggressive' | 'pain';
export type CheckInSeverity = 'none' | 'mild' | 'attention';

export interface CheckIn {
  id: string;
  petId: string;
  date: string;
  overallStatus: CheckInOverallStatus;
  appetite?: CheckInAppetite;
  energy?: CheckInEnergy;
  stool?: CheckInStool;
  skinCoat?: CheckInSkinCoat;
  behavior?: CheckInBehavior;
  weightKg?: number;
  note?: string;
  severity: CheckInSeverity;
  attachments?: AttachmentRef[];
  createdAt?: string;
}
