import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { scanMedicationPackage } from '../../../services/api';
import { uploadHealthAttachment } from '../../../services/healthApi';
import { usePetProfiles } from '../../../hooks/usePetProfiles';
import { prepareAttachment } from '../../../utils/prepareAttachment';
import { buildScanAlerts, formatPackageExpiry } from '../../../utils/medicationScanChecks';
import type { ScanAlert } from '../../../utils/medicationScanChecks';
import { VetVisitHelper } from '../../../utils/vetVisitHelper';
import type { ProductScanDraft, VisitBundle } from '../../../utils/vetVisitHelper';
import type { AttachmentRef } from '../../../types/petHealth';
import type { MedicationScanResult } from '../../../types/medicationScan';
import { MAX_FILE_SIZE_BYTES } from '../constants';
import { plusDays, today, uid } from '../utils';

import type { AiAttachmentDraft } from './formTypes';

const SUPPORTED_PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const FALLBACK_INTERVAL_DAYS: Record<ProductScanDraft['targetType'], number> = {
  VACCINATION: 365,
  DEWORMING: 90,
  ECTOPARASITE: 30,
  MEDICATION: 0,
};

export type ScanStep = 0 | 1;

export interface ScanPhoto {
  file: File;
  previewUrl: string;
  pending: AiAttachmentDraft;
  attachment: AttachmentRef;
}

export interface MedicationScanState {
  step: ScanStep;
  photo: ScanPhoto | null;
  photoError: string;
  scanning: boolean;
  scanError: string;
  scan: MedicationScanResult | null;
  draft: ProductScanDraft;
}

const emptyDraft = (): ProductScanDraft => ({
  targetType: 'MEDICATION',
  productName: '',
  dateGiven: today(),
  nextDueDate: '',
  batchNumber: '',
  note: '',
  dose: '',
  frequency: '',
  endDate: '',
  price: '',
});

const INITIAL_STATE: MedicationScanState = {
  step: 0,
  photo: null,
  photoError: '',
  scanning: false,
  scanError: '',
  scan: null,
  draft: emptyDraft(),
};

type ScanAction =
  | { type: 'SET_PHOTO'; photo: ScanPhoto }
  | { type: 'CLEAR_PHOTO' }
  | { type: 'SET_PHOTO_ERROR'; message: string }
  | { type: 'START_SCAN' }
  | { type: 'SCAN_SUCCESS'; scan: MedicationScanResult; draft: ProductScanDraft }
  | { type: 'SCAN_ERROR'; message: string }
  | { type: 'SET_DRAFT_FIELD'; field: keyof ProductScanDraft; value: string }
  | { type: 'BACK_TO_PHOTO' }
  | { type: 'RESET' };

function reducer(state: MedicationScanState, action: ScanAction): MedicationScanState {
  switch (action.type) {
    case 'SET_PHOTO':
      return { ...state, photo: action.photo, photoError: '', scanError: '' };
    case 'CLEAR_PHOTO':
      return { ...state, photo: null, photoError: '', scanError: '' };
    case 'SET_PHOTO_ERROR':
      return { ...state, photoError: action.message };
    case 'START_SCAN':
      return { ...state, scanning: true, scanError: '' };
    case 'SCAN_SUCCESS':
      return { ...state, scanning: false, scan: action.scan, draft: action.draft, step: 1 };
    case 'SCAN_ERROR':
      return { ...state, scanning: false, scanError: action.message };
    case 'SET_DRAFT_FIELD': {
      const draft = { ...state.draft, [action.field]: action.value };
      // Zmena typu prípravku prepočíta „chráni do", inak by po prepnutí
      // odčervenie → antiparazitiká ostal 90-dňový interval z pôvodného typu.
      if (action.field === 'targetType' && state.draft.nextDueDate) {
        const days = FALLBACK_INTERVAL_DAYS[draft.targetType];
        draft.nextDueDate = days > 0 ? plusDays(draft.dateGiven, days) : '';
      }
      return { ...state, draft };
    }
    case 'BACK_TO_PHOTO':
      return { ...state, step: 0, scan: null, scanError: '', draft: emptyDraft() };
    case 'RESET':
      return { ...INITIAL_STATE, draft: emptyDraft() };
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}

export function useMedicationScan(petId: string, initialFile?: File | null) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const { t } = useTranslation('healthPassport');
  const { profiles } = usePetProfiles();

  const pet = useMemo(() => profiles.find((p) => p.id === petId), [profiles, petId]);

  const buildNote = useCallback(
    (scan: MedicationScanResult): string => {
      const lines: string[] = [];
      if (scan.activeSubstances.length > 0) {
        lines.push(t('productScan.noteActive', { value: scan.activeSubstances.join(', ') }));
      }
      if (scan.strength) lines.push(t('productScan.noteStrength', { value: scan.strength }));
      if (scan.batchNumber) lines.push(t('productScan.noteBatch', { value: scan.batchNumber }));
      if (scan.packageExpiry) {
        lines.push(t('productScan.noteExpiry', { value: formatPackageExpiry(scan.packageExpiry) }));
      }
      if (scan.dosageNote) lines.push(t('productScan.noteDosage', { value: scan.dosageNote }));
      if (scan.manufacturer) {
        lines.push(t('productScan.noteManufacturer', { value: scan.manufacturer }));
      }
      return lines.join('\n');
    },
    [t]
  );

  const buildDraft = useCallback(
    (scan: MedicationScanResult): ProductScanDraft => {
      const targetType: ProductScanDraft['targetType'] =
        scan.recordType === 'UNKNOWN' ? 'MEDICATION' : scan.recordType;
      const dateGiven = today();
      const name = [scan.productName, scan.strength]
        .filter(Boolean)
        .filter((part, index, all) => index === 0 || !all[0].includes(part))
        .join(' ')
        .trim();

      return {
        targetType,
        productName: name,
        dateGiven,
        nextDueDate: scan.suggestedIntervalDays
          ? plusDays(dateGiven, scan.suggestedIntervalDays)
          : '',
        batchNumber: scan.batchNumber,
        note: buildNote(scan),
        dose: scan.dosageNote,
        frequency: '',
        endDate: '',
        price: '',
      };
    },
    [buildNote]
  );

  const setPhoto = useCallback(
    async (file: File) => {
      if (!SUPPORTED_PHOTO_TYPES.includes(file.type)) {
        dispatch({ type: 'SET_PHOTO_ERROR', message: t('productScan.unsupportedPhoto') });
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        dispatch({
          type: 'SET_PHOTO_ERROR',
          message: t('productScan.photoTooLarge', {
            maxMb: Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024)),
          }),
        });
        return;
      }

      try {
        const { previewUrl, base64, mimeType } = await prepareAttachment(file);
        const pending: AiAttachmentDraft = {
          fileName: file.name,
          mimeType,
          base64Data: base64,
        };
        const attachment = await uploadHealthAttachment({
          petId,
          ...pending,
          caption: t('productScan.attachmentFallback'),
        });
        dispatch({ type: 'SET_PHOTO', photo: { file, previewUrl, pending, attachment } });
      } catch (err) {
        const message = err instanceof Error ? err.message : '';
        dispatch({
          type: 'SET_PHOTO_ERROR',
          message:
            !message || message === 'FILE_LOAD_FAILED' ? t('productScan.photoFailed') : message,
        });
      }
    },
    [petId, t]
  );

  const clearPhoto = useCallback(() => dispatch({ type: 'CLEAR_PHOTO' }), []);

  // Fotka prenesená z nahrávania dokumentov sa načíta sama, aby ju používateľ
  // po prepnutí režimu nemusel vyberať druhýkrát.
  const handedOffFile = useRef<File | null>(null);
  useEffect(() => {
    if (!initialFile || handedOffFile.current === initialFile) return;
    handedOffFile.current = initialFile;
    void setPhoto(initialFile);
  }, [initialFile, setPhoto]);

  const setDraftField = useCallback(
    (field: keyof ProductScanDraft, value: string) =>
      dispatch({ type: 'SET_DRAFT_FIELD', field, value }),
    []
  );

  const backToPhoto = useCallback(() => dispatch({ type: 'BACK_TO_PHOTO' }), []);

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const scan = useCallback(async () => {
    if (!state.photo || state.scanning) return;
    dispatch({ type: 'START_SCAN' });
    try {
      const result = await scanMedicationPackage(state.photo.pending);
      dispatch({ type: 'SCAN_SUCCESS', scan: result, draft: buildDraft(result) });
    } catch (err) {
      dispatch({
        type: 'SCAN_ERROR',
        message: err instanceof Error && err.message ? err.message : t('productScan.scanFailed'),
      });
    }
  }, [state.photo, state.scanning, buildDraft, t]);

  const alerts: ScanAlert[] = useMemo(() => {
    if (!state.scan) return [];
    return buildScanAlerts({
      scan: state.scan,
      dateGiven: state.draft.dateGiven,
      animalType: pet?.animalType,
      weightKg: pet?.weightKg,
    });
  }, [state.scan, state.draft.dateGiven, pet?.animalType, pet?.weightKg]);

  const buildBundle = useCallback((): VisitBundle => {
    const reason = t(`productScan.visitReason.${state.draft.targetType}`);
    const findings = [state.scan?.summary?.trim(), state.draft.note.trim()]
      .filter(Boolean)
      .join('\n\n');

    return VetVisitHelper.createProductScanBundle({
      petId,
      draft: state.draft,
      visitReason: reason,
      visitFindings: findings,
      attachmentDraft: state.photo
        ? {
            attachmentLabel: t('productScan.attachmentFallback'),
            attachment: state.photo.attachment,
          }
        : undefined,
      plusDays,
      uid,
    });
  }, [petId, state.draft, state.scan, state.photo, t]);

  return {
    state,
    pet,
    alerts,
    canScan: state.photo !== null && !state.scanning,
    canSave: state.draft.productName.trim().length > 0 && state.draft.dateGiven !== '',
    setPhoto,
    clearPhoto,
    setDraftField,
    scan,
    backToPhoto,
    buildBundle,
    reset,
  };
}
