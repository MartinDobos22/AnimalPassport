import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Collapse,
  FormControlLabel,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';

import { useTranslation } from 'react-i18next';

import { VISIT_CATEGORY_OPTIONS } from '../constants';
import SearchableSelect from '../../ui/SearchableSelect';
import AiProcessingNote from '../../AiProcessingNote';
import { useAiImportContext } from './AiImport';
import AttachmentUpload from './AttachmentUpload';
import AiRecordsReview from './AiRecordsReview';
import AiProfileMergeReview from './AiProfileMergeReview';
import AiDisclaimer from '../../AiDisclaimer';

function UploadStep() {
  const { t } = useTranslation('healthPassport');
  const {
    state,
    maxAttachments,
    addAttachments,
    removeAttachment,
    setAttachmentLabel,
    setMainCategory,
    setSubcategory,
    setImportAllHistory,
    scanHandoffAvailable,
    scanHandoff,
  } = useAiImportContext();
  const [optionsOpen, setOptionsOpen] = useState(false);

  const subOptions =
    VISIT_CATEGORY_OPTIONS.find((opt) => opt.key === state.selectedMainCategory)?.sub ?? [];

  const progress = state.analyzeProgress;
  const progressPercent = progress
    ? progress.stage === 'interpret'
      ? 100
      : Math.round((progress.done / progress.total) * 100)
    : 0;

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {t('addRecord.aiImport.uploadDescription')}
      </Typography>

      <AttachmentUpload
        attachments={state.attachments}
        error={state.attachmentError}
        label={state.attachmentLabel}
        maxFiles={maxAttachments}
        showLabelField={false}
        onLabelChange={setAttachmentLabel}
        onAddFiles={(files) => {
          void addAttachments(files);
        }}
        onRemove={removeAttachment}
      />

      <Box>
        <Button
          size="small"
          onClick={() => setOptionsOpen(!optionsOpen)}
          endIcon={optionsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{ px: 0 }}
        >
          {t('addRecord.aiImport.optionsToggle')}
        </Button>
        <Collapse in={optionsOpen}>
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <TextField
              size="small"
              label={t('attachmentUpload.docLabel')}
              placeholder={t('attachmentUpload.docPlaceholder')}
              value={state.attachmentLabel}
              onChange={(e) => setAttachmentLabel(e.target.value)}
              fullWidth
            />
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 1.5,
              }}
            >
              <SearchableSelect
                label={t('addRecord.basics.mainCategoryOptional')}
                value={state.selectedMainCategory}
                options={[
                  { value: '', label: t('visitCategory.notSelected') },
                  ...VISIT_CATEGORY_OPTIONS.map((opt) => ({
                    value: opt.key,
                    label: t(`visitCategory.${opt.key}` as never),
                  })),
                ]}
                onChange={setMainCategory}
              />
              <SearchableSelect
                label={t('addRecord.basics.subcategory')}
                value={state.selectedSubcategory}
                disabled={!state.selectedMainCategory}
                options={[
                  { value: '', label: t('visitCategory.notSelected') },
                  ...subOptions.map((sub) => ({
                    value: sub.key,
                    label: t(`visitCategory.${sub.key}` as never),
                  })),
                ]}
                onChange={setSubcategory}
              />
            </Box>
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={state.importAllHistory}
                    onChange={(event) => setImportAllHistory(event.target.checked)}
                  />
                }
                label={t('addRecord.aiImport.importAllHistory')}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pl: 4 }}>
                {t('addRecord.aiImport.importAllHistoryHint')}
              </Typography>
            </Box>
          </Stack>
        </Collapse>
      </Box>

      {progress && (
        <Box>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            {progress.stage === 'ocr'
              ? t('addRecord.progressOcr', {
                  done: Math.min(progress.done + 1, progress.total),
                  total: progress.total,
                })
              : t('addRecord.progressInterpret')}
          </Typography>
          <LinearProgress
            variant={progress.stage === 'interpret' ? 'indeterminate' : 'determinate'}
            value={progressPercent}
          />
        </Box>
      )}

      {state.analyzeError && (
        <Alert
          severity="error"
          action={
            scanHandoffAvailable ? (
              <Button
                color="inherit"
                size="small"
                startIcon={<PhotoCameraIcon fontSize="small" />}
                onClick={scanHandoff}
              >
                {t('addRecord.aiImport.tryAsMedicine')}
              </Button>
            ) : null
          }
        >
          {state.analyzeError}
        </Alert>
      )}

      <AiProcessingNote />
    </Stack>
  );
}

export default function AiImportBody() {
  const { t } = useTranslation('healthPassport');
  const { state, petId, updateAiRecord, setVisitDraftField, clearProfilePatch } =
    useAiImportContext();

  if (state.step === 0) return <UploadStep />;

  if (state.step === 1) {
    return (
      <Stack spacing={1.5}>
        <AiDisclaimer />
        {state.detectedProfilePatch && petId !== '' && (
          <AiProfileMergeReview
            petId={petId}
            patch={state.detectedProfilePatch}
            onDone={() => clearProfilePatch()}
            onSkip={() => clearProfilePatch()}
          />
        )}
        <AiRecordsReview
          records={state.aiDetectedRecords}
          onChange={updateAiRecord}
          hasProfileData={state.detectedProfileAvailable}
        />
      </Stack>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" color="text.secondary">
        {t('addRecord.confirmVisitHint')}
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField
          size="small"
          type="date"
          label={t('addRecord.basics.date')}
          InputLabelProps={{ shrink: true }}
          value={state.visitDraft.date}
          onChange={(e) => setVisitDraftField('date', e.target.value)}
          fullWidth
        />
        <TextField
          size="small"
          label={t('addRecord.clinicOptional')}
          value={state.visitDraft.clinicName}
          onChange={(e) => setVisitDraftField('clinicName', e.target.value)}
          fullWidth
        />
      </Stack>
      <TextField
        size="small"
        label={t('addRecord.diagnosisOptional')}
        value={state.visitDraft.diagnosis}
        onChange={(e) => setVisitDraftField('diagnosis', e.target.value)}
        multiline
        minRows={2}
        fullWidth
      />
      <TextField
        size="small"
        label={t('addRecord.recommendationsOptional')}
        value={state.visitDraft.recommendations}
        onChange={(e) => setVisitDraftField('recommendations', e.target.value)}
        multiline
        minRows={2}
        fullWidth
      />
    </Stack>
  );
}
