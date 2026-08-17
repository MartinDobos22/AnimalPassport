import { createContext, useContext, useState, type ReactNode } from 'react';

import AiConsentDialog from '../../AiConsentDialog';
import { useAiConsent } from '../../../hooks/useAiConsent';

import type { VisitBundle } from '../../../utils/vetVisitHelper';
import type { AiDetectedDraftRecord } from '../hpTypes';
import type { AiFormState, AiStep, AiVisitDraftValues } from './formTypes';
import { useAiImport as useAiImportInternal } from './useAiImport';

interface AiImportContextValue {
  state: AiFormState;
  petId: string;
  maxAttachments: number;
  setStep: (step: AiStep) => void;
  addAttachments: (files: File[]) => Promise<void>;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
  restartUpload: () => void;
  setAttachmentLabel: (value: string) => void;
  setMainCategory: (value: string) => void;
  setSubcategory: (value: string) => void;
  setImportAllHistory: (value: boolean) => void;
  updateAiRecord: (id: string, patch: Partial<AiDetectedDraftRecord>) => void;
  setVisitDraftField: (field: keyof AiVisitDraftValues, value: string) => void;
  /** Spustí analýzu; pri prvom použití si najprv vypýta súhlas s AI. */
  requestAnalyze: () => void;
  /** Je k dispozícii jedna fotka, ktorú má zmysel skúsiť ako obal lieku? */
  scanHandoffAvailable: boolean;
  scanHandoff: () => void;
  clearProfilePatch: () => void;
  submit: () => void;
  cancel: () => void;
}

const AiImportContext = createContext<AiImportContextValue | null>(null);

export function useAiImportContext(): AiImportContextValue {
  const ctx = useContext(AiImportContext);
  if (!ctx) throw new Error('useAiImportContext must be used inside AiImportProvider');
  return ctx;
}

interface AiImportProviderProps {
  petId: string;
  onSave: (bundle: VisitBundle) => void;
  onCancel: () => void;
  /** Prepne dialóg na scan obalu lieku a prenesie doň nahranú fotku. */
  onScanHandoff?: (file: File) => void;
  children: ReactNode;
}

export default function AiImportProvider({
  petId,
  onSave,
  onCancel,
  onScanHandoff,
  children,
}: AiImportProviderProps) {
  const {
    state,
    maxAttachments,
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
  } = useAiImportInternal(petId);

  const { granted } = useAiConsent();
  const [consentOpen, setConsentOpen] = useState(false);

  const submit = () => {
    const bundle = buildBundle({ petId });
    onSave(bundle);
    reset();
  };

  const requestAnalyze = () => {
    if (!granted) {
      setConsentOpen(true);
      return;
    }
    void analyze();
  };

  // Fotka jedného obalu v toku pre dokumenty je typicky obal lieku — ponúkneme
  // prepnutie do správneho režimu namiesto opakovaného zlyhania.
  const singlePhoto =
    state.attachments.length === 1 && state.attachments[0].file.type.startsWith('image/')
      ? state.attachments[0].file
      : null;

  const scanHandoff = () => {
    if (singlePhoto && onScanHandoff) onScanHandoff(singlePhoto);
  };

  const value: AiImportContextValue = {
    state,
    petId,
    maxAttachments,
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
    requestAnalyze,
    scanHandoffAvailable: singlePhoto !== null && Boolean(onScanHandoff),
    scanHandoff,
    clearProfilePatch,
    submit,
    cancel: onCancel,
  };

  return (
    <AiImportContext.Provider value={value}>
      {children}
      <AiConsentDialog
        open={consentOpen}
        onClose={() => setConsentOpen(false)}
        onGranted={() => {
          void analyze();
        }}
      />
    </AiImportContext.Provider>
  );
}
