import { useId, useRef } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
  PhotoLibrary as PhotoLibraryIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import DateField from '../../DateField';
import SearchableSelect from '../../ui/SearchableSelect';
import AiDisclaimer from '../../AiDisclaimer';
import { MAX_FILE_SIZE_BYTES } from '../constants';
import { plusDays } from '../utils';
import type { ProductScanDraft } from '../../../utils/vetVisitHelper';
import { useMedicationScanContext } from './MedicationScan';

const TARGET_TYPES: ProductScanDraft['targetType'][] = [
  'DEWORMING',
  'ECTOPARASITE',
  'VACCINATION',
  'MEDICATION',
];

const NEXT_DUE_PRESET_DAYS = [30, 90, 180, 365];

export default function MedicationScanBody() {
  const { t } = useTranslation('healthPassport');
  const { state, alerts, setPhoto, clearPhoto, setConsent, setDraftField } =
    useMedicationScanContext();
  const cameraInputId = useId();
  const galleryInputId = useId();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void setPhoto(file);
  };

  const scan = state.scan;
  const draft = state.draft;
  const isMedication = draft.targetType === 'MEDICATION';

  return (
    <Stack spacing={1.5}>
      <Stepper activeStep={state.step} alternativeLabel>
        {[t('productScan.stepPhoto'), t('productScan.stepReview')].map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {state.step === 0 && (
        <Card sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              {t('productScan.photoDescription')}
            </Typography>

            <Alert severity="warning">{t('productScan.accuracyNotice')}</Alert>
            <Alert severity="info">{t('productScan.privacyNotice')}</Alert>

            <FormControlLabel
              control={
                <Checkbox
                  checked={state.aiProcessingConsent}
                  onChange={(event) => setConsent(event.target.checked)}
                />
              }
              label={t('productScan.consent')}
            />

            <input
              ref={cameraInputRef}
              id={cameraInputId}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleChange}
            />
            <input
              ref={galleryInputRef}
              id={galleryInputId}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleChange}
            />

            <Stack direction="row" gap={1} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<PhotoCameraIcon />}
                onClick={() => cameraInputRef.current?.click()}
              >
                {t('productScan.takePhoto')}
              </Button>
              <Button
                variant="outlined"
                startIcon={<PhotoLibraryIcon />}
                onClick={() => galleryInputRef.current?.click()}
              >
                {t('productScan.fromGallery')}
              </Button>
            </Stack>

            {state.photo && (
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    component="img"
                    src={state.photo.previewUrl}
                    alt={state.photo.file.name}
                    sx={{ width: 72, height: 72, borderRadius: 1, objectFit: 'cover' }}
                  />
                  <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>
                    {state.photo.file.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={clearPhoto}
                    aria-label={t('productScan.removePhoto')}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>
            )}

            <Typography variant="caption" color="text.secondary">
              {t('productScan.photoHint', {
                maxMb: Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024)),
              })}
            </Typography>

            {state.scanning && (
              <Stack direction="row" alignItems="center" gap={1}>
                <CircularProgress size={18} />
                <Typography variant="body2">{t('productScan.scanning')}</Typography>
              </Stack>
            )}

            {state.photoError && <Alert severity="warning">{state.photoError}</Alert>}
            {state.scanError && <Alert severity="error">{state.scanError}</Alert>}
          </Stack>
        </Card>
      )}

      {state.step === 1 && scan && (
        <>
          <AiDisclaimer />

          <Card sx={{ p: 2 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2">{t('productScan.recognizedTitle')}</Typography>
              {scan.summary && (
                <Typography variant="body2" color="text.secondary">
                  {scan.summary}
                </Typography>
              )}
              <Stack direction="row" gap={0.75} flexWrap="wrap">
                {scan.activeSubstances.map((substance) => (
                  <Chip key={substance} label={substance} size="small" variant="outlined" />
                ))}
                {scan.manufacturer && (
                  <Chip label={scan.manufacturer} size="small" variant="outlined" />
                )}
                <Chip
                  label={t(`productScan.confidence.${scan.confidence}`)}
                  size="small"
                  color={
                    scan.confidence === 'high'
                      ? 'success'
                      : scan.confidence === 'medium'
                        ? 'warning'
                        : 'error'
                  }
                />
              </Stack>
            </Stack>
          </Card>

          {alerts.length > 0 && (
            <Stack spacing={1}>
              {alerts.map((alert) => (
                <Alert key={alert.code} severity={alert.severity}>
                  {t(`productScan.alerts.${alert.code}`, { ...alert.params })}
                </Alert>
              ))}
            </Stack>
          )}

          {scan.warnings.length > 0 && (
            <Alert severity="warning">
              <Stack component="ul" sx={{ pl: 2, m: 0 }} spacing={0.25}>
                {scan.warnings.map((warning) => (
                  <Typography key={warning} component="li" variant="body2">
                    {warning}
                  </Typography>
                ))}
              </Stack>
            </Alert>
          )}

          <Card sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                {t('productScan.reviewHint')}
              </Typography>

              <SearchableSelect
                label={t('productScan.recordType')}
                value={draft.targetType}
                options={TARGET_TYPES.map((type) => ({
                  value: type,
                  label: t(`productScan.recordTypes.${type}`),
                }))}
                onChange={(value) => setDraftField('targetType', value)}
              />

              <TextField
                size="small"
                label={t('productScan.productName')}
                value={draft.productName}
                onChange={(e) => setDraftField('productName', e.target.value)}
                required
                fullWidth
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <DateField
                  label={t('productScan.dateGiven')}
                  value={draft.dateGiven}
                  onChange={(value) => setDraftField('dateGiven', value)}
                  fullWidth
                />
                {!isMedication && (
                  <DateField
                    label={t('productScan.nextDueDate')}
                    value={draft.nextDueDate}
                    onChange={(value) => setDraftField('nextDueDate', value)}
                    helperText={t('productScan.nextDueHint')}
                    fullWidth
                  />
                )}
              </Stack>

              {!isMedication && (
                <Stack direction="row" gap={0.75} flexWrap="wrap">
                  {NEXT_DUE_PRESET_DAYS.map((days) => (
                    <Chip
                      key={days}
                      label={t('productScan.presetDays', { days })}
                      size="small"
                      clickable
                      variant={
                        draft.nextDueDate === plusDays(draft.dateGiven, days)
                          ? 'filled'
                          : 'outlined'
                      }
                      color={
                        draft.nextDueDate === plusDays(draft.dateGiven, days)
                          ? 'primary'
                          : 'default'
                      }
                      onClick={() => setDraftField('nextDueDate', plusDays(draft.dateGiven, days))}
                    />
                  ))}
                </Stack>
              )}

              {!isMedication && scan.intervalRationale && (
                <Typography variant="caption" color="text.secondary">
                  {t('productScan.intervalRationale', { value: scan.intervalRationale })}
                </Typography>
              )}

              {isMedication && (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField
                    size="small"
                    label={t('productScan.dose')}
                    value={draft.dose}
                    onChange={(e) => setDraftField('dose', e.target.value)}
                    fullWidth
                  />
                  <TextField
                    size="small"
                    label={t('productScan.frequency')}
                    value={draft.frequency}
                    onChange={(e) => setDraftField('frequency', e.target.value)}
                    fullWidth
                  />
                </Stack>
              )}

              {isMedication && (
                <DateField
                  label={t('productScan.endDate')}
                  value={draft.endDate}
                  onChange={(value) => setDraftField('endDate', value)}
                  sx={{ width: { xs: '100%', sm: 240 } }}
                />
              )}

              <TextField
                size="small"
                label={t('productScan.batchNumber')}
                value={draft.batchNumber}
                onChange={(e) => setDraftField('batchNumber', e.target.value)}
                sx={{ width: { xs: '100%', sm: 240 } }}
              />

              <TextField
                size="small"
                label={t('productScan.note')}
                value={draft.note}
                onChange={(e) => setDraftField('note', e.target.value)}
                multiline
                minRows={3}
                fullWidth
              />
            </Stack>
          </Card>
        </>
      )}
    </Stack>
  );
}
