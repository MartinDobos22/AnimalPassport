import { createContext, useContext, useState, type ReactNode } from 'react';

import AiConsentDialog from '../../AiConsentDialog';
import { useAiConsent } from '../../../hooks/useAiConsent';
import type { PetProfile } from '../../../types';
import type { ProductScanDraft, VisitBundle } from '../../../utils/vetVisitHelper';
import type { ScanAlert } from '../../../utils/medicationScanChecks';
import { useMedicationScan as useMedicationScanInternal } from './useMedicationScan';
import type { MedicationScanState } from './useMedicationScan';

interface MedicationScanContextValue {
  state: MedicationScanState;
  pet?: PetProfile;
  alerts: ScanAlert[];
  canScan: boolean;
  canSave: boolean;
  setPhoto: (file: File) => Promise<void>;
  clearPhoto: () => void;
  setDraftField: (field: keyof ProductScanDraft, value: string) => void;
  /** Spustí rozpoznanie; pri prvom použití si najprv vypýta súhlas s AI. */
  requestScan: () => void;
  backToPhoto: () => void;
  submit: () => void;
  cancel: () => void;
}

const MedicationScanContext = createContext<MedicationScanContextValue | null>(null);

export function useMedicationScanContext(): MedicationScanContextValue {
  const ctx = useContext(MedicationScanContext);
  if (!ctx) throw new Error('useMedicationScanContext must be used inside MedicationScanProvider');
  return ctx;
}

interface MedicationScanProviderProps {
  petId: string;
  initialFile?: File | null;
  onSave: (bundle: VisitBundle) => void;
  onCancel: () => void;
  children: ReactNode;
}

export default function MedicationScanProvider({
  petId,
  initialFile,
  onSave,
  onCancel,
  children,
}: MedicationScanProviderProps) {
  const {
    state,
    pet,
    alerts,
    canScan,
    canSave,
    setPhoto,
    clearPhoto,
    setDraftField,
    scan,
    backToPhoto,
    buildBundle,
    reset,
  } = useMedicationScanInternal(petId, initialFile);
  const { granted } = useAiConsent();
  const [consentOpen, setConsentOpen] = useState(false);

  const submit = () => {
    onSave(buildBundle());
    reset();
  };

  const requestScan = () => {
    if (!granted) {
      setConsentOpen(true);
      return;
    }
    void scan();
  };

  const value: MedicationScanContextValue = {
    state,
    pet,
    alerts,
    canScan,
    canSave,
    setPhoto,
    clearPhoto,
    setDraftField,
    requestScan,
    backToPhoto,
    submit,
    cancel: onCancel,
  };

  return (
    <MedicationScanContext.Provider value={value}>
      {children}
      <AiConsentDialog
        open={consentOpen}
        onClose={() => setConsentOpen(false)}
        onGranted={() => {
          void scan();
        }}
      />
    </MedicationScanContext.Provider>
  );
}
