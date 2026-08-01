import type {
  CheckIn,
  DewormingRecord,
  DietEntry,
  EctoparasiteRecord,
  ExpenseRecord,
  MedicationDoseLog,
  MedicationRecord,
  TreatmentRecord,
  VaccinationRecord,
  VetVisitRecord,
  WeightLog,
} from '../types/petHealth';
import type { HealthEpisodeRecord } from '../types/episode';

type Row = Record<string, unknown>;

const str = (v: unknown): string | undefined => (v == null ? undefined : String(v));
const num = (v: unknown): number | undefined => (v == null ? undefined : Number(v));
const bool = (v: unknown): boolean | undefined => (v == null ? undefined : Boolean(v));

function build(pairs: Array<[string, unknown]>): Row {
  const row: Row = {};
  for (const [k, v] of pairs) if (v !== undefined) row[k] = v;
  return row;
}

export interface EntityMapper<Dto extends { id: string; petId: string }> {
  table: string;
  toRow: (dto: Partial<Dto>) => Row;
  toDto: (row: Row) => Dto;
}

export const vaccinationMapper: EntityMapper<VaccinationRecord> = {
  table: 'vaccinations',
  toRow: (d) =>
    build([
      ['type', d.type],
      ['name', d.name],
      ['date_applied', d.dateApplied],
      ['valid_until', d.validUntil],
      ['batch_number', d.batchNumber],
      ['note', d.note],
      ['attachments', d.attachments],
    ]),
  toDto: (r) => ({
    id: String(r.id),
    petId: String(r.pet_id),
    type: r.type as VaccinationRecord['type'],
    name: String(r.name),
    dateApplied: str(r.date_applied) ?? '',
    validUntil: str(r.valid_until) ?? '',
    batchNumber: str(r.batch_number),
    note: str(r.note),
    attachments: (r.attachments as VaccinationRecord['attachments']) ?? [],
  }),
};

export const dewormingMapper: EntityMapper<DewormingRecord> = {
  table: 'dewormings',
  toRow: (d) =>
    build([
      ['product_name', d.productName],
      ['date_given', d.dateGiven],
      ['interval_days', d.intervalDays],
      ['next_due_date', d.nextDueDate],
      ['note', d.note],
      ['attachments', d.attachments],
    ]),
  toDto: (r) => ({
    id: String(r.id),
    petId: String(r.pet_id),
    productName: String(r.product_name),
    dateGiven: str(r.date_given) ?? '',
    intervalDays: num(r.interval_days) ?? 0,
    nextDueDate: str(r.next_due_date) ?? '',
    note: str(r.note),
    attachments: (r.attachments as DewormingRecord['attachments']) ?? [],
  }),
};

export const ectoparasiteMapper: EntityMapper<EctoparasiteRecord> = {
  table: 'ectoparasites',
  toRow: (d) =>
    build([
      ['product_name', d.productName],
      ['form', d.form],
      ['date_given', d.dateGiven],
      ['interval_days', d.intervalDays],
      ['duration_days', d.durationDays],
      ['next_due_date', d.nextDueDate],
      ['note', d.note],
      ['attachments', d.attachments],
    ]),
  toDto: (r) => ({
    id: String(r.id),
    petId: String(r.pet_id),
    productName: String(r.product_name),
    form: r.form as EctoparasiteRecord['form'],
    dateGiven: str(r.date_given) ?? '',
    intervalDays: num(r.interval_days),
    durationDays: num(r.duration_days),
    nextDueDate: str(r.next_due_date) ?? '',
    note: str(r.note),
    attachments: (r.attachments as EctoparasiteRecord['attachments']) ?? [],
  }),
};

export const treatmentMapper: EntityMapper<TreatmentRecord> = {
  table: 'treatments',
  toRow: (d) =>
    build([
      ['category', d.category],
      ['name', d.name],
      ['form', d.form],
      ['reason', d.reason],
      ['date_given', d.dateGiven],
      ['interval_days', d.intervalDays],
      ['next_due_date', d.nextDueDate],
      ['note', d.note],
      ['attachments', d.attachments],
    ]),
  toDto: (r) => ({
    id: String(r.id),
    petId: String(r.pet_id),
    category: (r.category as TreatmentRecord['category']) ?? 'OTHER',
    name: String(r.name),
    form: (r.form as TreatmentRecord['form']) ?? undefined,
    reason: str(r.reason),
    dateGiven: str(r.date_given) ?? '',
    intervalDays: num(r.interval_days),
    nextDueDate: str(r.next_due_date) ?? '',
    note: str(r.note),
    createdAt: str(r.created_at),
    attachments: (r.attachments as TreatmentRecord['attachments']) ?? [],
  }),
};

export const vetVisitMapper: EntityMapper<VetVisitRecord> = {
  table: 'vet_visits',
  toRow: (d) =>
    build([
      ['date', d.date],
      ['clinic_name', d.clinicName],
      ['vet_name', d.vetName],
      ['reason', d.reason],
      ['findings', d.findings],
      ['diagnosis', d.diagnosis],
      ['recommendations', d.recommendations],
      ['diet_change', d.dietChange],
      ['next_check_date', d.nextCheckDate],
      ['ai_extracted_text', d.aiExtractedText],
      ['ai_exam_type', d.aiExamType],
      ['exam_result', d.examResult],
      ['medication_ids', d.medicationIds],
      ['attachments', d.attachments],
    ]),
  toDto: (r) => ({
    id: String(r.id),
    petId: String(r.pet_id),
    date: str(r.date) ?? '',
    clinicName: str(r.clinic_name) ?? '',
    vetName: str(r.vet_name),
    reason: str(r.reason) ?? '',
    findings: str(r.findings),
    diagnosis: str(r.diagnosis),
    recommendations: str(r.recommendations),
    dietChange: str(r.diet_change),
    nextCheckDate: str(r.next_check_date),
    aiExtractedText: str(r.ai_extracted_text),
    aiExamType: str(r.ai_exam_type),
    examResult: str(r.exam_result) as VetVisitRecord['examResult'],
    medicationIds: (r.medication_ids as string[]) ?? [],
    attachments: (r.attachments as VetVisitRecord['attachments']) ?? [],
  }),
};

export const medicationMapper: EntityMapper<MedicationRecord> = {
  table: 'medications',
  toRow: (d) =>
    build([
      ['name', d.name],
      ['reason', d.reason],
      ['dose', d.dose],
      ['frequency', d.frequency],
      ['start_date', d.startDate],
      ['end_date', d.endDate],
      ['long_term', d.longTerm],
      ['from_vet_visit_id', d.fromVetVisitId],
    ]),
  toDto: (r) => ({
    id: String(r.id),
    petId: String(r.pet_id),
    name: String(r.name),
    reason: str(r.reason) ?? '',
    dose: str(r.dose) ?? '',
    frequency: str(r.frequency) ?? '',
    startDate: str(r.start_date) ?? '',
    endDate: str(r.end_date),
    longTerm: bool(r.long_term),
    fromVetVisitId: str(r.from_vet_visit_id),
  }),
};

export const doseLogMapper: EntityMapper<MedicationDoseLog> = {
  table: 'medication_dose_logs',
  toRow: (d) =>
    build([
      ['medication_id', d.medicationId],
      ['date', d.date],
      ['taken', d.taken],
    ]),
  toDto: (r) => ({
    id: String(r.id),
    petId: String(r.pet_id),
    medicationId: String(r.medication_id),
    date: str(r.date) ?? '',
    taken: Boolean(r.taken),
  }),
};

export const dietEntryMapper: EntityMapper<DietEntry> = {
  table: 'diet_entries',
  toRow: (d) =>
    build([
      ['food_id', d.foodId],
      ['food_name', d.foodName],
      ['food_type', d.foodType],
      ['started_at', d.startedAt],
      ['ended_at', d.endedAt],
      ['reaction_notes', d.reactionNotes],
      ['suitability_status', d.suitabilityStatus],
      ['suitability_reasons', d.suitabilityReasons],
    ]),
  toDto: (r) => ({
    id: String(r.id),
    petId: String(r.pet_id),
    foodId: str(r.food_id),
    foodName: String(r.food_name),
    foodType: (r.food_type as DietEntry['foodType']) ?? 'main',
    startedAt: str(r.started_at) ?? '',
    endedAt: str(r.ended_at),
    reactionNotes: str(r.reaction_notes),
    suitabilityStatus: r.suitability_status as DietEntry['suitabilityStatus'],
    suitabilityReasons: (r.suitability_reasons as string[]) ?? undefined,
    createdAt: str(r.created_at),
  }),
};

export const expenseMapper: EntityMapper<ExpenseRecord> = {
  table: 'expenses',
  toRow: (d) =>
    build([
      ['date', d.date],
      ['amount', d.amount],
      ['currency', d.currency],
      ['category', d.category],
      ['related_vet_visit_id', d.relatedVetVisitId],
      ['related_diet_entry_id', d.relatedDietEntryId],
      ['note', d.note],
    ]),
  toDto: (r) => ({
    id: String(r.id),
    petId: String(r.pet_id),
    date: str(r.date) ?? '',
    amount: Number(r.amount ?? 0),
    currency: str(r.currency) ?? 'EUR',
    category: r.category as ExpenseRecord['category'],
    relatedVetVisitId: str(r.related_vet_visit_id),
    relatedDietEntryId: str(r.related_diet_entry_id),
    note: str(r.note),
  }),
};

export const weightLogMapper: EntityMapper<WeightLog> = {
  table: 'weight_logs',
  toRow: (d) =>
    build([
      ['date', d.date],
      ['kg', d.kg],
    ]),
  toDto: (r) => ({
    id: String(r.id),
    petId: String(r.pet_id),
    date: str(r.date) ?? '',
    kg: Number(r.kg ?? 0),
  }),
};

export const checkInMapper: EntityMapper<CheckIn> = {
  table: 'check_ins',
  toRow: (d) =>
    build([
      ['date', d.date],
      ['overall_status', d.overallStatus],
      ['appetite', d.appetite],
      ['energy', d.energy],
      ['stool', d.stool],
      ['skin_coat', d.skinCoat],
      ['behavior', d.behavior],
      ['weight_kg', d.weightKg],
      ['note', d.note],
      ['severity', d.severity],
      ['attachments', d.attachments],
    ]),
  toDto: (r) => ({
    id: String(r.id),
    petId: String(r.pet_id),
    date: str(r.date) ?? '',
    overallStatus: r.overall_status as CheckIn['overallStatus'],
    appetite: r.appetite ? (String(r.appetite) as CheckIn['appetite']) : undefined,
    energy: r.energy ? (String(r.energy) as CheckIn['energy']) : undefined,
    stool: r.stool ? (String(r.stool) as CheckIn['stool']) : undefined,
    skinCoat: r.skin_coat ? (String(r.skin_coat) as CheckIn['skinCoat']) : undefined,
    behavior: r.behavior ? (String(r.behavior) as CheckIn['behavior']) : undefined,
    weightKg: num(r.weight_kg),
    note: str(r.note),
    severity: (r.severity as CheckIn['severity']) ?? 'none',
    attachments: (r.attachments as CheckIn['attachments']) ?? [],
    createdAt: str(r.created_at),
  }),
};

export const episodeMapper: EntityMapper<HealthEpisodeRecord> = {
  table: 'health_episodes',
  toRow: (d) =>
    build([
      ['symptom_title', d.symptomTitle],
      ['symptom_description', d.symptomDescription],
      ['category', d.category],
      ['started_at', d.startedAt],
      ['ended_at', d.endedAt],
      ['location', d.location],
      ['triggers', d.triggers],
      ['diagnosis', d.diagnosis],
      ['vet_visit_id', d.vetVisitId],
      ['medication_ids', d.medicationIds],
      ['treatment_notes', d.treatmentNotes],
      ['what_worked', d.whatWorked],
      ['what_didnt_work', d.whatDidntWork],
      ['outcome', d.outcome],
      ['severity', d.severity],
      ['lessons_learned', d.lessonsLearned],
      ['attachments', d.attachments],
    ]),
  toDto: (r) => ({
    id: String(r.id),
    petId: String(r.pet_id),
    createdAt: str(r.created_at) ?? '',
    updatedAt: str(r.updated_at) ?? '',
    symptomTitle: String(r.symptom_title),
    symptomDescription: str(r.symptom_description) ?? '',
    category: r.category as HealthEpisodeRecord['category'],
    startedAt: str(r.started_at) ?? '',
    endedAt: str(r.ended_at),
    location: str(r.location),
    triggers: (r.triggers as string[]) ?? undefined,
    diagnosis: str(r.diagnosis),
    vetVisitId: str(r.vet_visit_id),
    medicationIds: (r.medication_ids as string[]) ?? [],
    treatmentNotes: str(r.treatment_notes),
    whatWorked: (r.what_worked as string[]) ?? [],
    whatDidntWork: (r.what_didnt_work as string[]) ?? [],
    outcome: r.outcome as HealthEpisodeRecord['outcome'],
    severity: r.severity as HealthEpisodeRecord['severity'],
    lessonsLearned: str(r.lessons_learned),
    attachments: (r.attachments as HealthEpisodeRecord['attachments']) ?? [],
  }),
};
