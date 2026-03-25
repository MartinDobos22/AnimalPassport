import type {
  AttachmentRef,
  DewormingRecord,
  DietEntry,
  EctoparasiteRecord,
  ExpenseRecord,
  MedicationDoseLog,
  MedicationRecord,
  VaccinationRecord,
  VetVisitRecord,
} from '../types/dogHealth';

interface VisitAttachmentDraft {
  attachmentLabel: string;
  attachmentUrl: string;
  attachmentPreviewUrl: string;
  attachmentFileName?: string;
}

export interface WizardVisitDraft {
  date: string;
  clinicName: string;
  reason: string;
  findings: string;
  diagnosis: string;
  recommendations: string;
  nextCheckDate: string;
  addVaccination: boolean;
  vaccineName: string;
  vaccineType: VaccinationRecord['type'];
  vaccineValidUntil: string;
  addDeworming: boolean;
  dewormProduct: string;
  dewormInterval: number;
  addEcto: boolean;
  ectoProduct: string;
  ectoForm: EctoparasiteRecord['form'];
  ectoInterval: number;
  addMedication: boolean;
  medName: string;
  medReason: string;
  medDose: string;
  medFrequency: string;
  medEndDate: string;
  addDiet: boolean;
  foodName: string;
  reactionNotes: string;
  suitabilityStatus: NonNullable<DietEntry['suitabilityStatus']>;
  totalExpense: string;
  extraMedicationExpense: string;
  extraFoodExpense: string;
}

export interface AiDetectedRecordInput {
  targetType: 'VACCINATION' | 'DEWORMING' | 'ECTOPARASITE' | 'MEDICATION' | 'NOTE' | 'SKIP';
  sourceDisease?: string;
  productName: string;
  date: string;
  validUntil: string;
  batchNumber: string;
  intervalDays: number;
}

export interface AiVisitDraftInput {
  date: string;
  clinicName: string;
  diagnosis: string;
  recommendations: string;
}

interface WizardVisitBundleInput {
  dogId: string;
  draft: WizardVisitDraft;
  mainCategory: string;
  subcategory: string;
  attachmentDraft: VisitAttachmentDraft;
  currentDietEntryId?: string;
  plusDays: (date: string, days: number) => string;
  uid: () => string;
}

interface AiVisitBundleInput {
  dogId: string;
  draft: AiVisitDraftInput;
  selectedVisitMainCategory: string;
  selectedVisitSubcategory: string;
  examType?: string;
  aiSummary: string;
  selectedRecords: AiDetectedRecordInput[];
  attachmentDraft: VisitAttachmentDraft;
  plusDays: (date: string, days: number) => string;
  uid: () => string;
}

export interface VisitBundle {
  visit: VetVisitRecord;
  vaccinations: VaccinationRecord[];
  dewormings: DewormingRecord[];
  ectos: EctoparasiteRecord[];
  medications: MedicationRecord[];
  doseLogs: MedicationDoseLog[];
  dietEntries: DietEntry[];
  expenses: ExpenseRecord[];
}

const KNOWN_RABIES_KEYWORDS = ['rabies', 'besnot', 'nobivac rabies'];

export class VetVisitHelper {
  static buildVisitReason(mainCategory: string, subcategory: string, customReason: string): string {
    return [mainCategory, subcategory, customReason.trim()].filter(Boolean).join(' · ');
  }

  static buildAttachment(
    draft: VisitAttachmentDraft,
    fallbackLabel: string,
    createdAt: string,
    uid: () => string,
  ): AttachmentRef[] | undefined {
    const attachmentUrl = draft.attachmentPreviewUrl || draft.attachmentUrl;
    if (!draft.attachmentLabel && !attachmentUrl && !draft.attachmentFileName) return undefined;

    return [{
      id: uid(),
      label: draft.attachmentLabel || draft.attachmentFileName || fallbackLabel,
      imageUrl: attachmentUrl || undefined,
      fileName: draft.attachmentFileName || undefined,
      createdAt,
    }];
  }

  static createWizardVisitBundle(input: WizardVisitBundleInput): VisitBundle {
    const { dogId, draft, mainCategory, subcategory, attachmentDraft, currentDietEntryId, plusDays, uid } = input;
    const visitId = uid();
    const createdAt = new Date().toISOString();
    const reason = VetVisitHelper.buildVisitReason(mainCategory, subcategory, draft.reason);
    const attachments = VetVisitHelper.buildAttachment(attachmentDraft, 'Doklad', createdAt, uid);

    const medications: MedicationRecord[] = [];
    const doseLogs: MedicationDoseLog[] = [];

    if (draft.addMedication && draft.medName.trim()) {
      const medicationId = uid();
      medications.push({
        id: medicationId,
        dogId,
        name: draft.medName,
        reason: draft.medReason,
        dose: draft.medDose,
        frequency: draft.medFrequency,
        startDate: draft.date,
        endDate: draft.medEndDate || undefined,
        fromVetVisitId: visitId,
      });
      doseLogs.push({ id: uid(), dogId, medicationId, date: draft.date, taken: false });
    }

    const visit: VetVisitRecord = {
      id: visitId,
      dogId,
      date: draft.date,
      clinicName: draft.clinicName,
      reason,
      findings: draft.findings || undefined,
      diagnosis: draft.diagnosis || undefined,
      recommendations: draft.recommendations || undefined,
      nextCheckDate: draft.nextCheckDate || undefined,
      medicationIds: medications.map((item) => item.id),
      attachments,
    };

    const vaccinations: VaccinationRecord[] = draft.addVaccination && draft.vaccineName.trim()
      ? [{
          id: uid(),
          dogId,
          type: draft.vaccineType,
          name: draft.vaccineName,
          dateApplied: draft.date,
          validUntil: draft.vaccineValidUntil,
          attachments,
        }]
      : [];

    const dewormings: DewormingRecord[] = draft.addDeworming && draft.dewormProduct.trim()
      ? [{
          id: uid(),
          dogId,
          productName: draft.dewormProduct,
          dateGiven: draft.date,
          intervalDays: draft.dewormInterval,
          nextDueDate: plusDays(draft.date, draft.dewormInterval),
          attachments,
        }]
      : [];

    const ectos: EctoparasiteRecord[] = draft.addEcto && draft.ectoProduct.trim()
      ? [{
          id: uid(),
          dogId,
          productName: draft.ectoProduct,
          form: draft.ectoForm,
          dateGiven: draft.date,
          intervalDays: draft.ectoInterval,
          nextDueDate: plusDays(draft.date, draft.ectoInterval),
          attachments,
        }]
      : [];

    const dietEntries: DietEntry[] = draft.addDiet && draft.foodName.trim()
      ? [{
          id: uid(),
          dogId,
          foodName: draft.foodName,
          startedAt: draft.date,
          reactionNotes: draft.reactionNotes,
          suitabilityStatus: draft.suitabilityStatus,
          suitabilityReasons: draft.suitabilityStatus === 'SUITABLE'
            ? ['Bez konfliktu s alergiami a diagnózami']
            : ['Skontrolovať zloženie voči alergénom'],
        }]
      : [];

    const expenses: ExpenseRecord[] = [];
    if (draft.totalExpense) {
      expenses.push({
        id: uid(),
        dogId,
        date: draft.date,
        amount: Number(draft.totalExpense),
        currency: 'EUR',
        category: 'VET_VISIT',
        relatedVetVisitId: visitId,
      });
    }
    if (draft.extraMedicationExpense) {
      expenses.push({
        id: uid(),
        dogId,
        date: draft.date,
        amount: Number(draft.extraMedicationExpense),
        currency: 'EUR',
        category: 'MEDICATION',
        relatedVetVisitId: visitId,
      });
    }
    if (draft.extraFoodExpense) {
      expenses.push({
        id: uid(),
        dogId,
        date: draft.date,
        amount: Number(draft.extraFoodExpense),
        currency: 'EUR',
        category: 'FOOD',
        relatedVetVisitId: visitId,
        relatedDietEntryId: currentDietEntryId,
      });
    }

    return { visit, vaccinations, dewormings, ectos, medications, doseLogs, dietEntries, expenses };
  }

  static createAiVisitBundle(input: AiVisitBundleInput): VisitBundle {
    const { dogId, draft, selectedVisitMainCategory, selectedVisitSubcategory, examType, aiSummary, selectedRecords, attachmentDraft, plusDays, uid } = input;
    const visitId = uid();
    const createdAt = new Date().toISOString();
    const reasonSource = selectedVisitSubcategory || examType || 'AI import zdravotného pasu';
    const reason = VetVisitHelper.buildVisitReason(selectedVisitMainCategory, reasonSource, '');
    const attachments = VetVisitHelper.buildAttachment(attachmentDraft, 'AI analyzovaný dokument', createdAt, uid);

    const vaccinations: VaccinationRecord[] = [];
    const dewormings: DewormingRecord[] = [];
    const ectos: EctoparasiteRecord[] = [];
    const medications: MedicationRecord[] = [];

    selectedRecords.forEach((record) => {
      if (record.targetType === 'VACCINATION') {
        const vaccineType: VaccinationRecord['type'] = KNOWN_RABIES_KEYWORDS.some((keyword) => (
          `${record.productName} ${record.sourceDisease ?? ''}`.toLowerCase().includes(keyword)
        ))
          ? 'RABIES'
          : 'OTHER';
        vaccinations.push({
          id: uid(),
          dogId,
          type: vaccineType,
          name: record.productName,
          dateApplied: record.date,
          validUntil: record.validUntil || plusDays(record.date, 365),
          batchNumber: record.batchNumber || undefined,
          attachments,
        });
      }

      if (record.targetType === 'DEWORMING') {
        dewormings.push({
          id: uid(),
          dogId,
          productName: record.productName,
          dateGiven: record.date,
          intervalDays: record.intervalDays,
          nextDueDate: plusDays(record.date, record.intervalDays),
          attachments,
        });
      }

      if (record.targetType === 'ECTOPARASITE') {
        ectos.push({
          id: uid(),
          dogId,
          productName: record.productName,
          form: 'TABLET',
          dateGiven: record.date,
          intervalDays: record.intervalDays,
          nextDueDate: plusDays(record.date, record.intervalDays),
          attachments,
        });
      }

      if (record.targetType === 'MEDICATION') {
        medications.push({
          id: uid(),
          dogId,
          name: record.productName,
          reason: record.sourceDisease || 'AI import zo zdravotného pasu',
          dose: 'Neuvedené',
          frequency: 'Podľa odporúčania veterinára',
          startDate: record.date,
          fromVetVisitId: visitId,
        });
      }
    });

    const visit: VetVisitRecord = {
      id: visitId,
      dogId,
      date: draft.date,
      clinicName: draft.clinicName.trim(),
      reason: reason || 'AI analýza dokumentu',
      findings: [aiSummary, selectedRecords.length ? `AI import záznamov: ${selectedRecords.length}` : '']
        .filter(Boolean)
        .join('\n\n'),
      diagnosis: draft.diagnosis.trim() || undefined,
      recommendations: draft.recommendations.trim() || undefined,
      medicationIds: medications.map((item) => item.id),
      attachments,
    };

    return {
      visit,
      vaccinations,
      dewormings,
      ectos,
      medications,
      doseLogs: [],
      dietEntries: [],
      expenses: [],
    };
  }
}
