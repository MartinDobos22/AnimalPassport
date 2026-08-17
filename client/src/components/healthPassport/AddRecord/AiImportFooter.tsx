import { useTranslation } from 'react-i18next';
import { Box, Button, CircularProgress, Stack } from '@mui/material';

import { useAiImportContext } from './AiImport';

export default function AiImportFooter() {
  const { t } = useTranslation('healthPassport');
  const { state, setStep, restartUpload, requestAnalyze, submit, cancel } = useAiImportContext();

  const analyzing = state.analyzeProgress !== null;
  const canAnalyze = state.attachments.length > 0 && !analyzing;
  const canAdvanceFromReview =
    state.aiDetectedRecords.some((r) => r.targetType !== 'SKIP') || state.detectedProfileAvailable;

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
      <Button onClick={cancel}>{t('actions.cancel', { ns: 'common' })}</Button>
      <Stack direction="row" gap={1}>
        {state.step > 0 && !analyzing && (
          <Button onClick={() => (state.step === 1 ? restartUpload() : setStep(1))}>
            {t('actions.back', { ns: 'common' })}
          </Button>
        )}
        {state.step === 0 && (
          <Button
            variant="contained"
            disabled={!canAnalyze}
            onClick={requestAnalyze}
            startIcon={analyzing ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {analyzing ? t('addRecord.aiImport.analyzing') : t('addRecord.aiImport.analyze')}
          </Button>
        )}
        {state.step === 1 && (
          <Button variant="contained" disabled={!canAdvanceFromReview} onClick={() => setStep(2)}>
            {t('actions.continue', { ns: 'common' })}
          </Button>
        )}
        {state.step === 2 && (
          <Button variant="contained" onClick={submit}>
            {t('addRecord.aiImport.saveRecords')}
          </Button>
        )}
      </Stack>
    </Box>
  );
}
