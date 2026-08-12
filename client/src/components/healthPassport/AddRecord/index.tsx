import { useState } from 'react';
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  AutoAwesome as AiIcon,
  Bolt as BoltIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import type { TreatmentRecord } from '../../../types/petHealth';
import type { VisitBundle } from '../../../utils/vetVisitHelper';
import ManualEntryProvider from './ManualEntry';
import ManualEntryBody from './ManualEntryBody';
import ManualEntryFooter from './ManualEntryFooter';
import AiImportProvider from './AiImport';
import AiImportBody from './AiImportBody';
import AiImportFooter from './AiImportFooter';
import QuickEntryProvider, { QuickEntryBody, QuickEntryFooter } from './QuickEntry';
import MedicationScanProvider from './MedicationScan';
import MedicationScanBody from './MedicationScanBody';
import MedicationScanFooter from './MedicationScanFooter';

type Mode = 'QUICK' | 'MANUAL' | 'SCAN' | 'AI';

interface AddRecordProps {
  open: boolean;
  petId: string;
  currentDietEntryId?: string;
  onClose: () => void;
  onSave: (bundle: VisitBundle) => void;
  onSaveTreatment: (payload: Partial<TreatmentRecord>) => void;
}

type ModeIcon = typeof EditIcon;

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (next: Mode) => void }) {
  const theme = useTheme();
  const { t } = useTranslation('healthPassport');
  const tabs: { value: Mode; label: string; icon: ModeIcon }[] = [
    { value: 'QUICK', label: t('addRecord.modeQuick'), icon: BoltIcon },
    { value: 'MANUAL', label: t('addRecord.modeManual'), icon: EditIcon },
    { value: 'SCAN', label: t('addRecord.modeScan'), icon: PhotoCameraIcon },
    { value: 'AI', label: t('addRecord.modeAi'), icon: AiIcon },
  ];

  return (
    <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'center' }}>
      <Box
        role="tablist"
        sx={{
          display: 'flex',
          width: '100%',
          maxWidth: 440,
          p: 0.5,
          gap: 0.5,
          borderRadius: 999,
          bgcolor: alpha(theme.palette.text.primary, 0.04),
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {tabs.map(({ value, label, icon: Icon }) => {
          const active = mode === value;
          return (
            <Box
              key={value}
              role="tab"
              aria-selected={active}
              component="button"
              type="button"
              onClick={() => onChange(value)}
              sx={{
                flex: '1 1 0',
                minWidth: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: 0.5,
                px: { xs: 0.75, sm: 2 },
                py: 0.75,
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: { xs: '0.72rem', sm: '0.85rem' },
                fontWeight: 600,
                lineHeight: 1.15,
                color: active ? 'primary.contrastText' : 'text.secondary',
                bgcolor: active ? 'primary.main' : 'transparent',
                boxShadow: active ? `0 2px 6px ${alpha(theme.palette.primary.main, 0.18)}` : 'none',
                transition: 'background-color 150ms ease, color 150ms ease',
                '&:hover': active ? {} : { color: 'text.primary' },
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2,
                },
              }}
            >
              <Icon sx={{ fontSize: 16, display: { xs: 'none', sm: 'block' }, flexShrink: 0 }} />
              {label}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default function AddRecord({
  open,
  petId,
  currentDietEntryId,
  onClose,
  onSave,
  onSaveTreatment,
}: AddRecordProps) {
  const { t } = useTranslation('healthPassport');
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [mode, setMode] = useState<Mode>('QUICK');

  const subtitleFor = (m: Mode): string => {
    if (m === 'QUICK') return t('addRecord.subtitleQuick');
    if (m === 'MANUAL') return t('addRecord.subtitleManual');
    if (m === 'SCAN') return t('addRecord.subtitleScan');
    return t('addRecord.subtitleAi');
  };

  const handleClose = () => {
    setMode('QUICK');
    onClose();
  };

  const handleSave = (bundle: VisitBundle) => {
    onSave(bundle);
    handleClose();
  };

  const handleSaveTreatment = (payload: Partial<TreatmentRecord>) => {
    onSaveTreatment(payload);
    handleClose();
  };

  const dialogTitle = (
    <DialogTitle sx={{ pb: 1 }}>
      <Stack direction="row" alignItems="center" gap={1}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('addRecord.addTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitleFor(mode)}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" aria-label={t('detail.close')}>
          <CloseIcon />
        </IconButton>
      </Stack>
    </DialogTitle>
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth fullScreen={fullScreen}>
      {mode === 'QUICK' && (
        <QuickEntryProvider
          petId={petId}
          currentDietEntryId={currentDietEntryId}
          onSave={handleSave}
          onSaveTreatment={handleSaveTreatment}
          onCancel={handleClose}
        >
          {dialogTitle}
          <DialogContent dividers sx={{ px: { xs: 2, sm: 3 } }}>
            <ModeToggle mode={mode} onChange={setMode} />
            <QuickEntryBody />
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
            <QuickEntryFooter />
          </DialogActions>
        </QuickEntryProvider>
      )}
      {mode === 'MANUAL' && (
        <ManualEntryProvider
          petId={petId}
          currentDietEntryId={currentDietEntryId}
          onSave={handleSave}
          onSaveTreatment={handleSaveTreatment}
          onCancel={handleClose}
        >
          {dialogTitle}
          <DialogContent dividers sx={{ px: { xs: 2, sm: 3 } }}>
            <ModeToggle mode={mode} onChange={setMode} />
            <ManualEntryBody />
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
            <ManualEntryFooter />
          </DialogActions>
        </ManualEntryProvider>
      )}
      {mode === 'SCAN' && (
        <MedicationScanProvider petId={petId} onSave={handleSave} onCancel={handleClose}>
          {dialogTitle}
          <DialogContent dividers sx={{ px: { xs: 2, sm: 3 } }}>
            <ModeToggle mode={mode} onChange={setMode} />
            <MedicationScanBody />
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
            <MedicationScanFooter />
          </DialogActions>
        </MedicationScanProvider>
      )}
      {mode === 'AI' && (
        <AiImportProvider petId={petId} onSave={handleSave} onCancel={handleClose}>
          {dialogTitle}
          <DialogContent dividers sx={{ px: { xs: 2, sm: 3 } }}>
            <ModeToggle mode={mode} onChange={setMode} />
            <AiImportBody />
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
            <AiImportFooter />
          </DialogActions>
        </AiImportProvider>
      )}
    </Dialog>
  );
}
