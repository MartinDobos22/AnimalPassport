import { Box, Button, CircularProgress, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { useMedicationScanContext } from './MedicationScan';

export default function MedicationScanFooter() {
  const { t } = useTranslation('healthPassport');
  const { state, canScan, canSave, requestScan, backToPhoto, submit, cancel } =
    useMedicationScanContext();

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
      <Button onClick={cancel}>{t('actions.cancel', { ns: 'common' })}</Button>
      <Stack direction="row" gap={1}>
        {state.step === 1 && <Button onClick={backToPhoto}>{t('productScan.retake')}</Button>}
        {state.step === 0 && (
          <Button
            variant="contained"
            disabled={!canScan}
            onClick={requestScan}
            startIcon={state.scanning ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {state.scanning ? t('productScan.scanning') : t('productScan.recognize')}
          </Button>
        )}
        {state.step === 1 && (
          <Button variant="contained" disabled={!canSave} onClick={submit}>
            {t('addRecord.save')}
          </Button>
        )}
      </Stack>
    </Box>
  );
}
