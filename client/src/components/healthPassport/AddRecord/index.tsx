import { useState } from 'react';
import {
  Box,
  ButtonBase,
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
  ArrowBackIosNew as BackIcon,
  Bolt as BoltIcon,
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon,
  Description as DocumentIcon,
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

type Mode = 'CHOOSER' | 'SCAN' | 'AI' | 'QUICK' | 'MANUAL';
type EntryMode = Exclude<Mode, 'CHOOSER'>;

interface AddRecordProps {
  open: boolean;
  petId: string;
  currentDietEntryId?: string;
  onClose: () => void;
  onSave: (bundle: VisitBundle) => void;
  onSaveTreatment: (payload: Partial<TreatmentRecord>) => void;
}

type ModeIcon = typeof EditIcon;

const MODE_ICONS: Record<EntryMode, ModeIcon> = {
  SCAN: PhotoCameraIcon,
  AI: DocumentIcon,
  QUICK: BoltIcon,
  MANUAL: EditIcon,
};

// Poradie je zámerné: najprv to, čo používateľ spraví najčastejšie a najrýchlejšie.
const MODE_ORDER: EntryMode[] = ['SCAN', 'AI', 'QUICK', 'MANUAL'];

interface ModeTileProps {
  mode: EntryMode;
  onSelect: (mode: EntryMode) => void;
}

function ModeTile({ mode, onSelect }: ModeTileProps) {
  const theme = useTheme();
  const { t } = useTranslation('healthPassport');
  const Icon = MODE_ICONS[mode];

  return (
    <ButtonBase
      onClick={() => onSelect(mode)}
      sx={{
        width: '100%',
        justifyContent: 'flex-start',
        textAlign: 'left',
        gap: 2,
        p: 2,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        transition: 'background-color 150ms ease, border-color 150ms ease',
        '&:hover': {
          borderColor: theme.palette.primary.main,
          bgcolor: alpha(theme.palette.primary.main, 0.04),
        },
        '&:focus-visible': {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          width: 44,
          height: 44,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          color: 'primary.main',
        }}
      >
        <Icon />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {t(`addRecord.modes.${mode}.title`)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t(`addRecord.modes.${mode}.description`)}
        </Typography>
      </Box>
      <ChevronRightIcon color="action" sx={{ flexShrink: 0 }} />
    </ButtonBase>
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
  const [mode, setMode] = useState<Mode>('CHOOSER');
  // Fotka prenesená z nahrávania dokumentov, keď sa ukáže, že ide o obal lieku.
  const [handoffFile, setHandoffFile] = useState<File | null>(null);

  const handleClose = () => {
    setMode('CHOOSER');
    setHandoffFile(null);
    onClose();
  };

  const backToChooser = () => {
    setMode('CHOOSER');
    setHandoffFile(null);
  };

  const handleSave = (bundle: VisitBundle) => {
    onSave(bundle);
    handleClose();
  };

  const handleSaveTreatment = (payload: Partial<TreatmentRecord>) => {
    onSaveTreatment(payload);
    handleClose();
  };

  const handleScanHandoff = (file: File) => {
    setHandoffFile(file);
    setMode('SCAN');
  };

  const dialogTitle = (
    <DialogTitle sx={{ pb: 1 }}>
      <Stack direction="row" alignItems="center" gap={1}>
        {mode !== 'CHOOSER' && (
          <IconButton onClick={backToChooser} size="small" aria-label={t('addRecord.backToModes')}>
            <BackIcon fontSize="small" />
          </IconButton>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {mode === 'CHOOSER' ? t('addRecord.addTitle') : t(`addRecord.modes.${mode}.title`)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {mode === 'CHOOSER'
              ? t('addRecord.chooserSubtitle')
              : t(`addRecord.modes.${mode}.description`)}
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
      {mode === 'CHOOSER' && (
        <>
          {dialogTitle}
          <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
            <Stack spacing={1.25}>
              {MODE_ORDER.map((entryMode) => (
                <ModeTile key={entryMode} mode={entryMode} onSelect={setMode} />
              ))}
            </Stack>
          </DialogContent>
        </>
      )}

      {mode === 'SCAN' && (
        <MedicationScanProvider
          petId={petId}
          initialFile={handoffFile}
          onSave={handleSave}
          onCancel={handleClose}
        >
          {dialogTitle}
          <DialogContent dividers sx={{ px: { xs: 2, sm: 3 } }}>
            <MedicationScanBody />
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
            <MedicationScanFooter />
          </DialogActions>
        </MedicationScanProvider>
      )}

      {mode === 'AI' && (
        <AiImportProvider
          petId={petId}
          onSave={handleSave}
          onCancel={handleClose}
          onScanHandoff={handleScanHandoff}
        >
          {dialogTitle}
          <DialogContent dividers sx={{ px: { xs: 2, sm: 3 } }}>
            <AiImportBody />
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
            <AiImportFooter />
          </DialogActions>
        </AiImportProvider>
      )}

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
            <ManualEntryBody />
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
            <ManualEntryFooter />
          </DialogActions>
        </ManualEntryProvider>
      )}
    </Dialog>
  );
}
