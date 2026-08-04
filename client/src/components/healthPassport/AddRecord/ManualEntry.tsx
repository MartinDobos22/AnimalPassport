import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

import type { TreatmentRecord } from '../../../types/petHealth';
import type { VisitBundle } from '../../../utils/vetVisitHelper';
import { plusDays } from '../utils';
import { findBundleDuplicates, type DuplicateMatch } from '../../../utils/duplicateDetection';
import { useHealthData } from '../../../hooks/useHealthData';
import type { ErrorMap, ManualFormState } from './formTypes';
import {
  sectionsWithErrors,
  useAddRecordForm,
  validateManualForm,
  type ManualFormAction,
} from './useAddRecordForm';

interface ManualEntryContextValue {
  state: ManualFormState;
  dispatch: Dispatch<ManualFormAction>;
  errors: ErrorMap;
  errorCount: number;
  clinicalOpen: boolean;
  setClinicalOpen: (next: boolean) => void;
  linkedOpen: boolean;
  setLinkedOpen: (next: boolean) => void;
  expensesOpen: boolean;
  setExpensesOpen: (next: boolean) => void;
  submit: () => void;
  cancel: () => void;
}

const ManualEntryContext = createContext<ManualEntryContextValue | null>(null);

export function useManualEntry(): ManualEntryContextValue {
  const ctx = useContext(ManualEntryContext);
  if (!ctx) throw new Error('useManualEntry must be used inside ManualEntryProvider');
  return ctx;
}

interface ManualEntryProviderProps {
  petId: string;
  currentDietEntryId?: string;
  onSave: (bundle: VisitBundle) => void;
  onSaveTreatment: (payload: Partial<TreatmentRecord>) => void;
  onCancel: () => void;
  children: ReactNode;
}

export default function ManualEntryProvider({
  petId,
  currentDietEntryId,
  onSave,
  onSaveTreatment,
  onCancel,
  children,
}: ManualEntryProviderProps) {
  const { state, dispatch, errors, buildBundle, reset, markSubmitAttempted } = useAddRecordForm();
  const [clinicalOpen, setClinicalOpen] = useState(true);
  const [linkedOpen, setLinkedOpen] = useState(false);
  const [expensesOpen, setExpensesOpen] = useState(false);
  const { vaccinations, dewormings, ectos, medications } = useHealthData();
  const { t } = useTranslation('healthPassport');

  const [duplicateDialog, setDuplicateDialog] = useState<{
    open: boolean;
    items: DuplicateMatch[];
    pendingBundle: VisitBundle | null;
  }>({ open: false, items: [], pendingBundle: null });

  const sectionErrors = useMemo(() => sectionsWithErrors(errors), [errors]);
  const errorCount = useMemo(() => Object.keys(errors).length, [errors]);

  useEffect(() => {
    if (!state.submitAttempted) return;
    if (sectionErrors.linked) setLinkedOpen(true);
    if (sectionErrors.expenses) setExpensesOpen(true);
  }, [state.submitAttempted, sectionErrors.linked, sectionErrors.expenses]);

  const finalize = (bundle: VisitBundle): void => {
    const tr = state.linked.treatment;
    if (tr && tr.name.trim()) {
      onSaveTreatment({
        petId,
        category: tr.category,
        name: tr.name.trim(),
        form: tr.form,
        dateGiven: state.basics.date,
        intervalDays: tr.intervalDays > 0 ? tr.intervalDays : undefined,
        nextDueDate:
          tr.intervalDays > 0 ? tr.validUntil || plusDays(state.basics.date, tr.intervalDays) : '',
      });
    }
    onSave(bundle);
    reset();
  };

  const submit = () => {
    markSubmitAttempted();
    const validationErrors = validateManualForm(state);
    if (Object.keys(validationErrors).length > 0) return;
    const bundle = buildBundle({ petId, currentDietEntryId });

    const duplicates = findBundleDuplicates(bundle, {
      vaccinations,
      dewormings,
      ectos,
      medications,
    });
    if (duplicates.length > 0) {
      setDuplicateDialog({ open: true, items: duplicates, pendingBundle: bundle });
      return;
    }

    finalize(bundle);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const handleConfirmDuplicate = () => {
    const bundle = duplicateDialog.pendingBundle;
    setDuplicateDialog({ open: false, items: [], pendingBundle: null });
    if (bundle) finalize(bundle);
  };

  const handleCancelDuplicate = () => {
    setDuplicateDialog({ open: false, items: [], pendingBundle: null });
  };

  const value: ManualEntryContextValue = {
    state,
    dispatch,
    errors,
    errorCount,
    clinicalOpen,
    setClinicalOpen,
    linkedOpen,
    setLinkedOpen,
    expensesOpen,
    setExpensesOpen,
    submit,
    cancel: onCancel,
  };

  return (
    <ManualEntryContext.Provider value={value}>
      {children}
      <Dialog open={duplicateDialog.open} onClose={handleCancelDuplicate} maxWidth="sm" fullWidth>
        <DialogTitle>{t('duplicateDialog.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {t('duplicateDialog.description', { count: duplicateDialog.items.length })}
          </DialogContentText>
          <List dense>
            {duplicateDialog.items.map((item, idx) => (
              <ListItem key={`${item.type}-${item.existingId}-${idx}`} disableGutters>
                <ListItemText
                  primary={`${t(`duplicateDialog.types.${item.type}`)}: ${item.label}`}
                  secondary={t('duplicateDialog.dateLabel', { date: item.date })}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDuplicate}>{t('duplicateDialog.cancel')}</Button>
          <Button onClick={handleConfirmDuplicate} variant="contained" color="warning">
            {t('duplicateDialog.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </ManualEntryContext.Provider>
  );
}
