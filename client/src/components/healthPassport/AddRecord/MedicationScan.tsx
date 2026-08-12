import { createContext, useContext, type ReactNode } from 'react';

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
  setConsent: (value: boolean) => void;
  setDraftField: (field: keyof ProductScanDraft, value: string) => void;
  scan: () => Promise<void>;
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
  onSave: (bundle: VisitBundle) => void;
  onCancel: () => void;
  children: ReactNode;
}

export default function MedicationScanProvider({
  petId,
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
    setConsent,
    setDraftField,
    scan,
    backToPhoto,
    buildBundle,
    reset,
  } = useMedicationScanInternal(petId);

  const submit = () => {
    onSave(buildBundle());
    reset();
  };

  const value: MedicationScanContextValue = {
    state,
    pet,
    alerts,
    canScan,
    canSave,
    setPhoto,
    clearPhoto,
    setConsent,
    setDraftField,
    scan,
    backToPhoto,
    submit,
    cancel: onCancel,
  };

  return <MedicationScanContext.Provider value={value}>{children}</MedicationScanContext.Provider>;
}
