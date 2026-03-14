export type DogSex = 'MALE' | 'FEMALE' | 'UNKNOWN';
export type VaccineType = 'RABIES' | 'COMBINED' | 'OTHER';
export type ValidityStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';
export type EctoForm = 'TABLET' | 'SPOT_ON' | 'COLLAR';
export type ExpenseCategory = 'VET_VISIT' | 'MEDICATION' | 'FOOD' | 'OTHER';
export type TimelineType =
  | 'VACCINATION'
  | 'DEWORMING'
  | 'ECTOPARASITE'
  | 'VET_VISIT'
  | 'MEDICATION'
  | 'DIET'
  | 'EXPENSE'
  | 'NOTE';

export interface AttachmentRef {
  id: string;
  label: string;
  imageUrl?: string;
  fileName?: string;
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
  dogId: string;
  type: VaccineType;
  name: string;
  dateApplied: string;
  validUntil: string;
  batchNumber?: string;
  attachments?: AttachmentRef[];
}

export interface DewormingRecord {
  id: string;
  dogId: string;
  productName: string;
  dateGiven: string;
  intervalDays: number;
  nextDueDate: string;
  attachments?: AttachmentRef[];
}

export interface EctoparasiteRecord {
  id: string;
  dogId: string;
  productName: string;
  form: EctoForm;
  dateGiven: string;
  intervalDays?: number;
  durationDays?: number;
  nextDueDate: string;
  attachments?: AttachmentRef[];
}

export interface VetVisitRecord {
  id: string;
  dogId: string;
  date: string;
  clinicName: string;
  vetName?: string;
  reason: string;
  findings?: string;
  diagnosis?: string;
  recommendations?: string;
  dietChange?: string;
  nextCheckDate?: string;
  medicationIds: string[];
  attachments?: AttachmentRef[];
}

export interface MedicationRecord {
  id: string;
  dogId: string;
  name: string;
  reason: string;
  dose: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  longTerm?: boolean;
  fromVetVisitId?: string;
}

export interface MedicationDoseLog {
  id: string;
  dogId: string;
  medicationId: string;
  date: string;
  taken: boolean;
}

export interface DietEntry {
  id: string;
  dogId: string;
  foodId?: string;
  foodName: string;
  startedAt: string;
  endedAt?: string;
  reactionNotes?: string;
  suitabilityStatus?: 'SUITABLE' | 'RISKY' | 'UNSUITABLE';
  suitabilityReasons?: string[];
}

export interface ExpenseRecord {
  id: string;
  dogId: string;
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
  dogId: string;
  type: TimelineType;
  title: string;
  subtitle?: string;
  date: string;
}
