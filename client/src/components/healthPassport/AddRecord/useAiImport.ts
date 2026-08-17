import { useCallback, useReducer } from 'react';
import { useTranslation } from 'react-i18next';

import { useHealthData } from '../../../hooks/useHealthData';
import {
  extractTextFromImage,
  interpretPassportText,
  interpretPassportImage,
} from '../../../services/api';
import type {
  PassportInterpretation,
  PassportPetIdentifiers,
  PassportHealthFlags,
} from '../../../services/api';
import { uploadHealthAttachment } from '../../../services/healthApi';
import { prepareAttachment } from '../../../utils/prepareAttachment';
import { VetVisitHelper, type VisitBundle } from '../../../utils/vetVisitHelper';
import type { PetProfilePatch } from '../../../utils/petProfileMerge';
import type { AiDetectedDraftRecord, AiDetectedRecordType, AiDraftSkipReason } from '../hpTypes';
import { MAX_FILE_SIZE_BYTES, SUPPORTED_FILE_TYPES } from '../constants';
import {
  inferAiTargetType,
  isDuplicateVaccination,
  normalizeDateInput,
  plusDays,
  today,
  uid,
} from '../utils';

import type {
  AiAttachmentEntry,
  AiFormState,
  AiStep,
  AiVisitDraftValues,
  AnalyzeProgress,
} from './formTypes';

const MAX_ATTACHMENTS = 20;

// Extrakčný režim: 'vision' = obrázok priamo do modelu (1 volanie/dokument),
// inak klasická OCR → text → interpret cesta. Default OCR (bez zmeny správania).
const EXTRACTION_MODE_VISION = import.meta.env.VITE_EXTRACTION_MODE === 'vision';

const INITIAL_VISIT_DRAFT: AiVisitDraftValues = {
  date: today(),
  clinicName: '',
  diagnosis: '',
  recommendations: '',
};

export const INITIAL_AI_STATE: AiFormState = {
  step: 0,
  attachments: [],
  attachmentError: '',
  attachmentLabel: '',
  analyzeError: '',
  analyzeProgress: null,
  selectedMainCategory: '',
  selectedSubcategory: '',
  aiDetectedRecords: [],
  useVisitDetailsFromManual: false,
  visitDraft: INITIAL_VISIT_DRAFT,
  feedback: null,
  detectedProfilePatch: null,
  detectedProfileAvailable: false,
  documentSummary: '',
  importAllHistory: false,
};

type AiAction =
  | { type: 'SET_STEP'; step: AiStep }
  | { type: 'ADD_ATTACHMENTS'; entries: AiAttachmentEntry[] }
  | { type: 'REMOVE_ATTACHMENT'; id: string }
  | { type: 'CLEAR_ATTACHMENTS' }
  | { type: 'RESTART_UPLOAD' }
  | { type: 'SET_ATTACHMENT_ERROR'; message: string }
  | { type: 'SET_ATTACHMENT_LABEL'; label: string }
  | { type: 'SET_ANALYZE_PROGRESS'; progress: AnalyzeProgress | null }
  | { type: 'SET_ANALYZE_ERROR'; message: string }
  | { type: 'SET_MAIN_CATEGORY'; value: string }
  | { type: 'SET_SUBCATEGORY'; value: string }
  | { type: 'SET_AI_RECORDS'; records: AiDetectedDraftRecord[] }
  | { type: 'UPDATE_AI_RECORD'; id: string; patch: Partial<AiDetectedDraftRecord> }
  | { type: 'SET_VISIT_DRAFT_FIELD'; field: keyof AiVisitDraftValues; value: string }
  | { type: 'SET_FEEDBACK'; message: string | null }
  | { type: 'SET_PROFILE_PATCH'; patch: PetProfilePatch | null }
  | { type: 'SET_DOCUMENT_SUMMARY'; summary: string }
  | { type: 'SET_IMPORT_ALL_HISTORY'; value: boolean }
  | { type: 'RESET' };

function reducer(state: AiFormState, action: AiAction): AiFormState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step };
    case 'ADD_ATTACHMENTS': {
      const next = [...state.attachments, ...action.entries].slice(0, MAX_ATTACHMENTS);
      return { ...state, attachments: next, attachmentError: '' };
    }
    case 'REMOVE_ATTACHMENT':
      return {
        ...state,
        attachments: state.attachments.filter((a) => a.id !== action.id),
      };
    case 'CLEAR_ATTACHMENTS':
      return { ...state, attachments: [], attachmentError: '' };
    case 'RESTART_UPLOAD':
      return {
        ...state,
        step: 0,
        attachments: [],
        attachmentError: '',
        analyzeError: '',
        analyzeProgress: null,
        aiDetectedRecords: [],
        detectedProfilePatch: null,
        detectedProfileAvailable: false,
        documentSummary: '',
      };
    case 'SET_ATTACHMENT_ERROR':
      return { ...state, attachmentError: action.message };
    case 'SET_ATTACHMENT_LABEL':
      return { ...state, attachmentLabel: action.label };
    case 'SET_ANALYZE_PROGRESS':
      return { ...state, analyzeProgress: action.progress };
    case 'SET_ANALYZE_ERROR':
      return { ...state, analyzeError: action.message, analyzeProgress: null };
    case 'SET_MAIN_CATEGORY':
      return { ...state, selectedMainCategory: action.value, selectedSubcategory: '' };
    case 'SET_SUBCATEGORY':
      return { ...state, selectedSubcategory: action.value };
    case 'SET_AI_RECORDS':
      return { ...state, aiDetectedRecords: action.records };
    case 'UPDATE_AI_RECORD':
      return {
        ...state,
        aiDetectedRecords: state.aiDetectedRecords.map((r) =>
          r.id === action.id ? { ...r, ...action.patch } : r
        ),
      };
    case 'SET_VISIT_DRAFT_FIELD':
      return { ...state, visitDraft: { ...state.visitDraft, [action.field]: action.value } };
    case 'SET_FEEDBACK':
      return { ...state, feedback: action.message };
    case 'SET_PROFILE_PATCH':
      return {
        ...state,
        detectedProfilePatch: action.patch,
        detectedProfileAvailable: action.patch !== null || state.detectedProfileAvailable,
      };
    case 'SET_DOCUMENT_SUMMARY':
      return { ...state, documentSummary: action.summary };
    case 'SET_IMPORT_ALL_HISTORY':
      return { ...state, importAllHistory: action.value };
    case 'RESET':
      return { ...INITIAL_AI_STATE, visitDraft: { ...INITIAL_VISIT_DRAFT, date: today() } };
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}

function mergeIdentifiers(list: PassportInterpretation[]): PassportPetIdentifiers | undefined {
  let out: PassportPetIdentifiers | undefined;
  for (const it of list) {
    const p = it.petIdentifiers;
    if (!p) continue;
    out = {
      name: out?.name || p.name,
      breed: out?.breed || p.breed,
      dateOfBirth: out?.dateOfBirth || p.dateOfBirth,
      sex: out?.sex || p.sex,
      microchipNumber: out?.microchipNumber || p.microchipNumber,
      passportNumber: out?.passportNumber || p.passportNumber,
    };
  }
  return out;
}

function mergeHealthFlags(list: PassportInterpretation[]): PassportHealthFlags | undefined {
  const allergies = new Map<string, string>();
  const chronic = new Map<string, string>();
  let seen = false;
  for (const it of list) {
    const f = it.healthFlags;
    if (!f) continue;
    seen = true;
    for (const a of f.allergies ?? []) {
      const key = a.trim().toLowerCase();
      if (key) allergies.set(key, a.trim());
    }
    for (const c of f.chronicConditions ?? []) {
      const key = c.trim().toLowerCase();
      if (key) chronic.set(key, c.trim());
    }
  }
  if (!seen) return undefined;
  return {
    allergies: [...allergies.values()],
    chronicConditions: [...chronic.values()],
  };
}

interface BuildContext {
  petId: string;
  examType?: string;
}

export function useAiImport(petId: string) {
  const [state, dispatch] = useReducer(reducer, INITIAL_AI_STATE);
  const {
    vaccinations: existingVaccinations,
    dewormings: existingDewormings,
    ectos: existingEctos,
  } = useHealthData();
  const { t } = useTranslation('healthPassport');

  const setStep = useCallback((step: AiStep) => dispatch({ type: 'SET_STEP', step }), []);

  const addAttachmentFiles = useCallback(
    async (files: File[], currentCount: number) => {
      if (files.length === 0) return;

      if (currentCount >= MAX_ATTACHMENTS) {
        dispatch({
          type: 'SET_ATTACHMENT_ERROR',
          message: t('addRecord.aiImport.maxPages', { count: MAX_ATTACHMENTS }),
        });
        return;
      }

      const available = MAX_ATTACHMENTS - currentCount;
      const toProcess = files.slice(0, available);
      const accepted: AiAttachmentEntry[] = [];
      let lastError = '';

      for (const file of toProcess) {
        if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
          lastError = t('addRecord.aiImport.unsupportedFile', { fileName: file.name });
          continue;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          lastError = t('addRecord.aiImport.fileTooLarge', { fileName: file.name });
          continue;
        }
        try {
          const { previewUrl, base64, mimeType } = await prepareAttachment(file);
          const pending = { fileName: file.name, mimeType, base64Data: base64 };
          const attachment = await uploadHealthAttachment({
            petId: petId,
            ...pending,
            caption: file.name,
          });
          accepted.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            file,
            previewUrl,
            pending,
            attachment,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : '';
          lastError =
            msg === 'FILE_LOAD_FAILED' || !msg ? t('addRecord.aiImport.fileLoadFailed') : msg;
        }
      }

      if (accepted.length > 0) {
        dispatch({ type: 'ADD_ATTACHMENTS', entries: accepted });
      }
      if (lastError) {
        dispatch({ type: 'SET_ATTACHMENT_ERROR', message: lastError });
      }
      if (files.length > available) {
        dispatch({
          type: 'SET_ATTACHMENT_ERROR',
          message: t('addRecord.aiImport.maxPagesExceeded', { count: MAX_ATTACHMENTS }),
        });
      }
    },
    [petId, t]
  );

  const addAttachments = useCallback(
    (files: File[]) => addAttachmentFiles(files, state.attachments.length),
    [addAttachmentFiles, state.attachments.length]
  );

  const removeAttachment = useCallback(
    (id: string) => dispatch({ type: 'REMOVE_ATTACHMENT', id }),
    []
  );

  const clearAttachments = useCallback(() => dispatch({ type: 'CLEAR_ATTACHMENTS' }), []);

  const restartUpload = useCallback(() => dispatch({ type: 'RESTART_UPLOAD' }), []);

  const setAttachmentLabel = useCallback(
    (label: string) => dispatch({ type: 'SET_ATTACHMENT_LABEL', label }),
    []
  );
  const setMainCategory = useCallback(
    (value: string) => dispatch({ type: 'SET_MAIN_CATEGORY', value }),
    []
  );
  const setSubcategory = useCallback(
    (value: string) => dispatch({ type: 'SET_SUBCATEGORY', value }),
    []
  );
  const updateAiRecord = useCallback(
    (id: string, patch: Partial<AiDetectedDraftRecord>) =>
      dispatch({ type: 'UPDATE_AI_RECORD', id, patch }),
    []
  );
  const setImportAllHistory = useCallback(
    (value: boolean) => dispatch({ type: 'SET_IMPORT_ALL_HISTORY', value }),
    []
  );

  const setVisitDraftField = useCallback(
    (field: keyof AiVisitDraftValues, value: string) =>
      dispatch({ type: 'SET_VISIT_DRAFT_FIELD', field, value }),
    []
  );

  const analyze = useCallback(async () => {
    if (state.attachments.length === 0) return;

    dispatch({ type: 'SET_ANALYZE_ERROR', message: '' });

    try {
      const interpretations: PassportInterpretation[] = [];
      // Chyba poslednej neúspešnej strany — keď zlyhajú všetky, ukáže sa
      // používateľovi reálny dôvod zo servera namiesto generickej hlášky.
      let lastPageError = '';

      if (EXTRACTION_MODE_VISION) {
        // Vision režim: obrázok priamo do modelu, bez samostatného OCR kroku.
        // Presnejšie na husté tabuľky a miešaný tlačený+ručný text.
        for (let i = 0; i < state.attachments.length; i++) {
          dispatch({
            type: 'SET_ANALYZE_PROGRESS',
            progress: { done: i, total: state.attachments.length, stage: 'interpret' },
          });
          try {
            interpretations.push(await interpretPassportImage(state.attachments[i].pending));
          } catch (err) {
            // Stranu, ktorú sa nepodarilo interpretovať, preskočíme.
            if (err instanceof Error && err.message) lastPageError = err.message;
          }
        }
      } else {
        const texts: string[] = [];
        for (let i = 0; i < state.attachments.length; i++) {
          dispatch({
            type: 'SET_ANALYZE_PROGRESS',
            progress: { done: i, total: state.attachments.length, stage: 'ocr' },
          });
          const { extractedText } = await extractTextFromImage(state.attachments[i].pending);
          if (extractedText.trim()) texts.push(extractedText.trim());
        }

        if (texts.length === 0) {
          dispatch({
            type: 'SET_ANALYZE_ERROR',
            message: t('addRecord.aiImport.noTextExtracted'),
          });
          return;
        }

        // Per-dokument interpretácia: každú stranu interpretujeme zvlášť, nie
        // ako jeden spojený text. Bráni to orezaniu dlhého textu na serveri
        // (limit dĺžky) a izoluje chybu — jedna nečitateľná strana nezhodí
        // extrakciu ostatných.
        for (let i = 0; i < texts.length; i++) {
          dispatch({
            type: 'SET_ANALYZE_PROGRESS',
            progress: { done: i, total: texts.length, stage: 'interpret' },
          });
          try {
            interpretations.push(await interpretPassportText(texts[i]));
          } catch (err) {
            // Stranu, ktorú sa nepodarilo interpretovať, preskočíme.
            if (err instanceof Error && err.message) lastPageError = err.message;
          }
        }
      }

      if (interpretations.length === 0) {
        dispatch({
          type: 'SET_ANALYZE_ERROR',
          message: lastPageError || t('addRecord.aiImport.analyzeFailed'),
        });
        return;
      }

      const records = interpretations.flatMap((it) => it.records ?? []);
      const petIdentifiers = mergeIdentifiers(interpretations);
      const healthFlags = mergeHealthFlags(interpretations);
      const summary = interpretations
        .map((it) => it.summary?.trim())
        .filter((s): s is string => Boolean(s))
        .join('\n\n');

      dispatch({ type: 'SET_DOCUMENT_SUMMARY', summary });

      const patch: PetProfilePatch | null =
        (petIdentifiers &&
          (petIdentifiers.name ||
            petIdentifiers.breed ||
            petIdentifiers.dateOfBirth ||
            petIdentifiers.sex ||
            petIdentifiers.microchipNumber ||
            petIdentifiers.passportNumber)) ||
        (healthFlags &&
          ((healthFlags.allergies?.length ?? 0) > 0 ||
            (healthFlags.chronicConditions?.length ?? 0) > 0))
          ? {
              identifiers: petIdentifiers,
              allergies: healthFlags?.allergies ?? [],
              chronicConditions: healthFlags?.chronicConditions ?? [],
            }
          : null;
      dispatch({ type: 'SET_PROFILE_PATCH', patch });

      const validTypes: AiDetectedRecordType[] = [
        'VACCINATION',
        'DEWORMING',
        'ECTOPARASITE',
        'MEDICATION',
        'NOTE',
      ];

      const latestDateFor = (type: AiDetectedRecordType): string | null => {
        const pick = <T extends { petId: string }>(items: T[], dateOf: (r: T) => string) => {
          let max: string | null = null;
          for (const rec of items) {
            if (rec.petId !== petId) continue;
            const iso = normalizeDateInput(dateOf(rec));
            if (!iso) continue;
            if (!max || iso > max) max = iso;
          }
          return max;
        };
        if (type === 'VACCINATION') return pick(existingVaccinations, (r) => r.dateApplied);
        if (type === 'DEWORMING') return pick(existingDewormings, (r) => r.dateGiven);
        if (type === 'ECTOPARASITE') return pick(existingEctos, (r) => r.dateGiven);
        return null;
      };

      const HISTORICAL_MONTHS = 6;
      const historicalCutoff = (() => {
        const d = new Date();
        d.setUTCMonth(d.getUTCMonth() - HISTORICAL_MONTHS);
        return d.toISOString().slice(0, 10);
      })();

      // Pri prvom nahrávaní (prázdny profil) NECHCEME auto-skipovať staré
      // záznamy — nový user si nahráva celú históriu z pasu a všetko je staré.
      // 6-mesačný cutoff aplikujeme len ak už nejaké záznamy existujú, alebo
      // ak to používateľ explicitne nevypol cez "import celej histórie".
      const hasAnyExistingForPet =
        existingVaccinations.some((r) => r.petId === petId) ||
        existingDewormings.some((r) => r.petId === petId) ||
        existingEctos.some((r) => r.petId === petId);

      const drafts: AiDetectedDraftRecord[] = (records ?? []).map((item, index) => {
        const disease = item.disease ?? '';
        const recordType: AiDetectedRecordType = validTypes.includes(
          item.type as AiDetectedRecordType
        )
          ? item.type
          : inferAiTargetType(disease, item.name);
        const productName = item.name || disease || t('addRecord.unknownRecord');

        const normalizedDate = normalizeDateInput(item.date);
        if (!normalizedDate) {
          return {
            id: `${Date.now()}-${index}`,
            sourceConfidence: item.confidence,
            sourceDisease: disease,
            targetType: 'SKIP' as AiDetectedRecordType,
            suggestedType: recordType as Exclude<AiDetectedRecordType, 'SKIP'>,
            productName,
            date: '',
            validUntil: '',
            batchNumber: item.batchNumber ?? '',
            intervalDays: recordType === 'ECTOPARASITE' ? 30 : 90,
            skipReason: 'NO_DATE' as AiDraftSkipReason,
          };
        }

        const rawValidUntil = typeof item.validUntil === 'string' ? item.validUntil.trim() : '';
        const normalizedValidUntil = rawValidUntil ? normalizeDateInput(rawValidUntil) : null;
        const fallback = plusDays(normalizedDate, recordType === 'VACCINATION' ? 365 : 90);
        const validUntil = normalizedValidUntil ?? fallback;

        const isDuplicate =
          recordType === 'VACCINATION' &&
          petId !== '' &&
          isDuplicateVaccination({
            productName,
            sourceDisease: disease,
            date: normalizedDate,
            existing: existingVaccinations,
            petId,
          });

        const latestExisting = latestDateFor(recordType);
        const isVaccineLike =
          recordType === 'VACCINATION' ||
          recordType === 'DEWORMING' ||
          recordType === 'ECTOPARASITE';
        const isHistorical =
          isVaccineLike &&
          !state.importAllHistory &&
          ((hasAnyExistingForPet && normalizedDate < historicalCutoff) ||
            (latestExisting !== null && normalizedDate < latestExisting));

        const comparisonNote =
          isHistorical && latestExisting
            ? t('aiRecordsReview.historicalComparison', { date: latestExisting })
            : undefined;

        let skipReason: AiDraftSkipReason | undefined;
        if (isDuplicate) skipReason = 'DUPLICATE';
        else if (isHistorical) skipReason = 'HISTORICAL';

        const shouldSkip = isDuplicate || isHistorical;

        return {
          id: `${Date.now()}-${index}`,
          sourceConfidence: item.confidence,
          sourceDisease: disease,
          targetType: shouldSkip ? ('SKIP' as AiDetectedRecordType) : recordType,
          suggestedType: recordType as Exclude<AiDetectedRecordType, 'SKIP'>,
          productName,
          date: normalizedDate,
          validUntil,
          batchNumber: item.batchNumber ?? '',
          intervalDays: recordType === 'ECTOPARASITE' ? 30 : 90,
          isDuplicate,
          isHistorical,
          skipReason,
          comparisonNote,
        };
      });

      dispatch({ type: 'SET_AI_RECORDS', records: drafts });
      dispatch({ type: 'SET_ANALYZE_PROGRESS', progress: null });
      dispatch({ type: 'SET_STEP', step: 1 });
    } catch (err) {
      const message = err instanceof Error ? err.message : t('addRecord.aiImport.analyzeFailed');
      dispatch({ type: 'SET_ANALYZE_ERROR', message });
    }
  }, [
    state.attachments,
    state.importAllHistory,
    petId,
    existingVaccinations,
    existingDewormings,
    existingEctos,
    t,
  ]);

  const buildBundle = useCallback(
    (ctx: BuildContext): VisitBundle => {
      const selectedRecords = state.aiDetectedRecords
        .filter((r) => r.targetType !== 'SKIP')
        .map((r) => ({
          targetType: r.targetType,
          sourceDisease: r.sourceDisease,
          productName: r.productName,
          date: r.date,
          validUntil: r.validUntil,
          batchNumber: r.batchNumber,
          intervalDays: r.intervalDays || (r.targetType === 'ECTOPARASITE' ? 30 : 90),
        }));

      const importNote = state.attachments.length
        ? t('addRecord.aiImport.importNote', { count: state.attachments.length })
        : '';
      const aiSummary = [state.documentSummary.trim(), importNote].filter(Boolean).join('\n\n');

      const attachmentDrafts = state.attachments.map((entry, idx) => ({
        attachmentLabel:
          state.attachments.length > 1
            ? `${state.attachmentLabel || t('attachmentUpload.documentFallback')} — ${t('attachmentUpload.pageLabel', { n: idx + 1 })}`
            : state.attachmentLabel || entry.pending.fileName,
        attachment: entry.attachment,
      }));

      return VetVisitHelper.createAiVisitBundle({
        petId: ctx.petId,
        draft: state.visitDraft,
        selectedVisitMainCategory: state.selectedMainCategory,
        selectedVisitSubcategory: state.selectedSubcategory,
        examType: ctx.examType,
        aiSummary,
        selectedRecords,
        attachmentDrafts,
        plusDays,
        uid,
      });
    },
    [
      state.aiDetectedRecords,
      state.attachments,
      state.attachmentLabel,
      state.documentSummary,
      state.selectedMainCategory,
      state.selectedSubcategory,
      state.visitDraft,
    ]
  );

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const clearProfilePatch = useCallback(
    () => dispatch({ type: 'SET_PROFILE_PATCH', patch: null }),
    []
  );

  return {
    state,
    maxAttachments: MAX_ATTACHMENTS,
    setStep,
    addAttachments,
    removeAttachment,
    clearAttachments,
    restartUpload,
    setAttachmentLabel,
    setMainCategory,
    setSubcategory,
    updateAiRecord,
    setImportAllHistory,
    setVisitDraftField,
    analyze,
    buildBundle,
    clearProfilePatch,
    reset,
  };
}
