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
} from '../types/petHealth';
import i18n from '../i18n';
import { inferVaccineType } from './vaccineTypes';

interface VisitAttachmentDraft {
  attachmentLabel: string;
  attachment?: AttachmentRef;
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
  dewormValidUntil: string;
  dewormInterval: number;
  addEcto: boolean;
  ectoProduct: string;
  ectoForm: EctoparasiteRecord['form'];
  ectoValidUntil: string;
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
  intervalDays?: number;
}

export interface AiVisitDraftInput {
  date: string;
  clinicName: string;
  diagnosis: string;
  recommendations: string;
}

export type ProductScanTargetType = 'VACCINATION' | 'DEWORMING' | 'ECTOPARASITE' | 'MEDICATION';

export interface ProductScanDraft {
  targetType: ProductScanTargetType;
  productName: string;
  dateGiven: string;
  /** Dokedy prípravok chráni / kedy je ďalšia dávka — NIE trvanlivosť balenia. */
  nextDueDate: string;
  batchNumber: string;
  note: string;
  dose: string;
  frequency: string;
  endDate: string;
  /** Cena zaplatená za balenie, ako ju zadal používateľ. Prázdne = bez výdavku. */
  price: string;
}

interface ProductScanBundleInput {
  petId: string;
  draft: ProductScanDraft;
  visitReason: string;
  visitFindings: string;
  attachmentDraft?: VisitAttachmentDraft;
  plusDays: (date: string, days: number) => string;
  uid: () => string;
}

interface WizardVisitBundleInput {
  petId: string;
  draft: WizardVisitDraft;
  mainCategory: string;
  subcategory: string;
  attachmentDraft: VisitAttachmentDraft;
  currentDietEntryId?: string;
  plusDays: (date: string, days: number) => string;
  uid: () => string;
}

interface AiVisitBundleInput {
  petId: string;
  draft: AiVisitDraftInput;
  selectedVisitMainCategory: string;
  selectedVisitSubcategory: string;
  examType?: string;
  aiSummary: string;
  selectedRecords: AiDetectedRecordInput[];
  attachmentDraft?: VisitAttachmentDraft;
  attachmentDrafts?: VisitAttachmentDraft[];
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

const DAY_MS = 1000 * 60 * 60 * 24;

const computeIntervalDays = (date: string, validUntil: string, fallback: number) => {
  if (!validUntil) return fallback;
  const start = new Date(date).getTime();
  const end = new Date(validUntil).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return fallback;
  const days = Math.ceil((end - start) / DAY_MS);
  return Math.max(1, days || fallback);
};

export class VetVisitHelper {
  static buildVisitReason(mainCategory: string, subcategory: string, customReason: string): string {
    return [mainCategory, subcategory, customReason.trim()].filter(Boolean).join(' · ');
  }

  static buildAttachment(
    draft: VisitAttachmentDraft,
    fallbackLabel: string,
    createdAt: string
  ): AttachmentRef[] | undefined {
    if (!draft.attachment?.objectPath) return undefined;

    return [
      {
        objectPath: draft.attachment.objectPath,
        mimeType: draft.attachment.mimeType,
        size: draft.attachment.size,
        caption: draft.attachmentLabel || draft.attachment.caption || fallbackLabel,
        createdAt: draft.attachment.createdAt || createdAt,
      },
    ];
  }

  static buildAttachments(
    drafts: VisitAttachmentDraft[],
    fallbackLabel: string,
    createdAt: string
  ): AttachmentRef[] | undefined {
    const refs = drafts.flatMap(
      (draft) => VetVisitHelper.buildAttachment(draft, fallbackLabel, createdAt) ?? []
    );
    return refs.length > 0 ? refs : undefined;
  }

  static createWizardVisitBundle(input: WizardVisitBundleInput): VisitBundle {
    const {
      petId,
      draft,
      mainCategory,
      subcategory,
      attachmentDraft,
      currentDietEntryId,
      plusDays,
      uid,
    } = input;
    const visitId = uid();
    const createdAt = new Date().toISOString();
    const reason = VetVisitHelper.buildVisitReason(mainCategory, subcategory, draft.reason);
    const attachments = VetVisitHelper.buildAttachment(
      attachmentDraft,
      i18n.t('attachmentUpload.receiptFallback', { ns: 'healthPassport' }) as string,
      createdAt
    );

    const medications: MedicationRecord[] = [];
    const doseLogs: MedicationDoseLog[] = [];

    if (draft.addMedication && draft.medName.trim()) {
      const medicationId = uid();
      medications.push({
        id: medicationId,
        petId,
        name: draft.medName,
        reason: draft.medReason,
        dose: draft.medDose,
        frequency: draft.medFrequency,
        startDate: draft.date,
        endDate: draft.medEndDate || undefined,
        fromVetVisitId: visitId,
      });
      doseLogs.push({ id: uid(), petId, medicationId, date: draft.date, taken: false });
    }

    const visit: VetVisitRecord = {
      id: visitId,
      petId,
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

    const vaccinations: VaccinationRecord[] =
      draft.addVaccination && draft.vaccineName.trim()
        ? [
            {
              id: uid(),
              petId,
              type: draft.vaccineType,
              name: draft.vaccineName,
              dateApplied: draft.date,
              validUntil: draft.vaccineValidUntil || plusDays(draft.date, 365),
              attachments,
            },
          ]
        : [];

    const dewormings: DewormingRecord[] =
      draft.addDeworming && draft.dewormProduct.trim()
        ? [
            {
              id: uid(),
              petId,
              productName: draft.dewormProduct,
              dateGiven: draft.date,
              intervalDays: computeIntervalDays(
                draft.date,
                draft.dewormValidUntil,
                draft.dewormInterval || 90
              ),
              nextDueDate:
                draft.dewormValidUntil || plusDays(draft.date, draft.dewormInterval || 90),
              attachments,
            },
          ]
        : [];

    const ectos: EctoparasiteRecord[] =
      draft.addEcto && draft.ectoProduct.trim()
        ? [
            {
              id: uid(),
              petId,
              productName: draft.ectoProduct,
              form: draft.ectoForm,
              dateGiven: draft.date,
              intervalDays: computeIntervalDays(
                draft.date,
                draft.ectoValidUntil,
                draft.ectoInterval || 30
              ),
              nextDueDate: draft.ectoValidUntil || plusDays(draft.date, draft.ectoInterval || 30),
              attachments,
            },
          ]
        : [];

    const dietEntries: DietEntry[] =
      draft.addDiet && draft.foodName.trim()
        ? [
            {
              id: uid(),
              petId,
              foodName: draft.foodName,
              startedAt: draft.date,
              reactionNotes: draft.reactionNotes,
              suitabilityStatus: draft.suitabilityStatus,
              suitabilityReasons:
                draft.suitabilityStatus === 'SUITABLE'
                  ? [
                      i18n.t('addRecord.aiImport.suitabilityNoAllergens', {
                        ns: 'healthPassport',
                      }) as string,
                    ]
                  : [
                      i18n.t('addRecord.aiImport.suitabilityCheckAllergens', {
                        ns: 'healthPassport',
                      }) as string,
                    ],
            },
          ]
        : [];

    const expenses: ExpenseRecord[] = [];
    if (draft.totalExpense) {
      expenses.push({
        id: uid(),
        petId,
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
        petId,
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
        petId,
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

  static createProductScanBundle(input: ProductScanBundleInput): VisitBundle {
    const { petId, draft, visitReason, visitFindings, attachmentDraft, plusDays, uid } = input;
    const visitId = uid();
    const createdAt = new Date().toISOString();
    const attachments = attachmentDraft
      ? VetVisitHelper.buildAttachment(
          attachmentDraft,
          i18n.t('productScan.attachmentFallback', { ns: 'healthPassport' }) as string,
          createdAt
        )
      : undefined;

    const note = draft.note.trim() || undefined;
    const productName = draft.productName.trim();
    const fallbackInterval = draft.targetType === 'ECTOPARASITE' ? 30 : 90;
    const intervalDays = computeIntervalDays(draft.dateGiven, draft.nextDueDate, fallbackInterval);
    const nextDueDate = draft.nextDueDate || plusDays(draft.dateGiven, fallbackInterval);

    const vaccinations: VaccinationRecord[] =
      draft.targetType === 'VACCINATION'
        ? [
            {
              id: uid(),
              petId,
              type: inferVaccineType(productName),
              name: productName,
              dateApplied: draft.dateGiven,
              validUntil: draft.nextDueDate || plusDays(draft.dateGiven, 365),
              batchNumber: draft.batchNumber.trim() || undefined,
              note,
              attachments,
            },
          ]
        : [];

    const dewormings: DewormingRecord[] =
      draft.targetType === 'DEWORMING'
        ? [
            {
              id: uid(),
              petId,
              productName,
              dateGiven: draft.dateGiven,
              intervalDays,
              nextDueDate,
              note,
              attachments,
            },
          ]
        : [];

    const ectos: EctoparasiteRecord[] =
      draft.targetType === 'ECTOPARASITE'
        ? [
            {
              id: uid(),
              petId,
              productName,
              form: 'TABLET',
              dateGiven: draft.dateGiven,
              intervalDays,
              nextDueDate,
              note,
              attachments,
            },
          ]
        : [];

    const medications: MedicationRecord[] = [];
    const doseLogs: MedicationDoseLog[] = [];
    if (draft.targetType === 'MEDICATION') {
      const medicationId = uid();
      medications.push({
        id: medicationId,
        petId,
        name: productName,
        reason: note ?? '',
        dose: draft.dose.trim(),
        frequency: draft.frequency.trim(),
        startDate: draft.dateGiven,
        endDate: draft.endDate || undefined,
        fromVetVisitId: visitId,
      });
      doseLogs.push({ id: uid(), petId, medicationId, date: draft.dateGiven, taken: false });
    }

    const price = Number(draft.price.replace(',', '.'));
    const expenses: ExpenseRecord[] =
      Number.isFinite(price) && price > 0
        ? [
            {
              id: uid(),
              petId,
              date: draft.dateGiven,
              amount: price,
              currency: 'EUR',
              category: 'MEDICATION',
              relatedVetVisitId: visitId,
              note: productName || undefined,
            },
          ]
        : [];

    const visit: VetVisitRecord = {
      id: visitId,
      petId,
      date: draft.dateGiven,
      clinicName: i18n.t('addRecord.ownRecord', { ns: 'healthPassport' }) as string,
      reason: visitReason,
      findings: visitFindings || undefined,
      medicationIds: medications.map((item) => item.id),
      attachments,
    };

    return {
      visit,
      vaccinations,
      dewormings,
      ectos,
      medications,
      doseLogs,
      dietEntries: [],
      expenses,
    };
  }

  static createAiVisitBundle(input: AiVisitBundleInput): VisitBundle {
    const {
      petId,
      draft,
      selectedVisitMainCategory,
      selectedVisitSubcategory,
      examType,
      aiSummary,
      selectedRecords,
      attachmentDraft,
      attachmentDrafts,
      plusDays,
      uid,
    } = input;
    const visitId = uid();
    const createdAt = new Date().toISOString();
    const reasonSource =
      selectedVisitSubcategory ||
      examType ||
      (i18n.t('addRecord.aiImport.defaultReason', { ns: 'healthPassport' }) as string);
    const reason = VetVisitHelper.buildVisitReason(selectedVisitMainCategory, reasonSource, '');
    const drafts =
      attachmentDrafts && attachmentDrafts.length > 0
        ? attachmentDrafts
        : attachmentDraft
          ? [attachmentDraft]
          : [];
    const attachments =
      drafts.length > 0
        ? VetVisitHelper.buildAttachments(
            drafts,
            i18n.t('addRecord.aiImport.defaultAttachmentLabel', { ns: 'healthPassport' }) as string,
            createdAt
          )
        : undefined;

    const vaccinations: VaccinationRecord[] = [];
    const dewormings: DewormingRecord[] = [];
    const ectos: EctoparasiteRecord[] = [];
    const medications: MedicationRecord[] = [];

    selectedRecords.forEach((record) => {
      if (record.targetType === 'VACCINATION') {
        const vaccineType: VaccinationRecord['type'] = inferVaccineType(
          record.productName,
          record.sourceDisease
        );
        vaccinations.push({
          id: uid(),
          petId,
          type: vaccineType,
          name: record.productName,
          dateApplied: record.date,
          validUntil: record.validUntil || plusDays(record.date, 365),
          batchNumber: record.batchNumber || undefined,
          attachments,
        });
      }

      if (record.targetType === 'DEWORMING') {
        const intervalDays = computeIntervalDays(
          record.date,
          record.validUntil,
          record.intervalDays ?? 90
        );
        dewormings.push({
          id: uid(),
          petId,
          productName: record.productName,
          dateGiven: record.date,
          intervalDays,
          nextDueDate: record.validUntil || plusDays(record.date, intervalDays),
          attachments,
        });
      }

      if (record.targetType === 'ECTOPARASITE') {
        const intervalDays = computeIntervalDays(
          record.date,
          record.validUntil,
          record.intervalDays ?? 30
        );
        ectos.push({
          id: uid(),
          petId,
          productName: record.productName,
          form: 'TABLET',
          dateGiven: record.date,
          intervalDays,
          nextDueDate: record.validUntil || plusDays(record.date, intervalDays),
          attachments,
        });
      }

      if (record.targetType === 'MEDICATION') {
        medications.push({
          id: uid(),
          petId,
          name: record.productName,
          reason:
            record.sourceDisease ||
            (i18n.t('addRecord.aiImport.defaultMedReason', { ns: 'healthPassport' }) as string),
          dose: i18n.t('addRecord.aiImport.defaultDose', { ns: 'healthPassport' }) as string,
          frequency: i18n.t('addRecord.aiImport.defaultFrequency', {
            ns: 'healthPassport',
          }) as string,
          startDate: record.date,
          fromVetVisitId: visitId,
        });
      }
    });

    const visit: VetVisitRecord = {
      id: visitId,
      petId,
      date: draft.date,
      clinicName: draft.clinicName.trim(),
      reason:
        reason ||
        (i18n.t('addRecord.aiImport.defaultVisitReason', { ns: 'healthPassport' }) as string),
      findings: [
        aiSummary,
        selectedRecords.length
          ? (i18n.t('addRecord.aiImport.importRecordCount', {
              ns: 'healthPassport',
              count: selectedRecords.length,
            }) as string)
          : '',
      ]
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
