import { useId, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
  PhotoLibrary as PhotoLibraryIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import DateField from '../../DateField';
import SearchableSelect from '../../ui/SearchableSelect';
import AiProcessingNote from '../../AiProcessingNote';
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

function PhotoStep() {
  const theme = useTheme();
  const { t } = useTranslation('healthPassport');
  const { state, setPhoto, clearPhoto } = useMedicationScanContext();
  const cameraInputId = useId();
  const galleryInputId = useId();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void setPhoto(file);
  };

  return (
    <Stack spacing={2}>
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

      {state.photo ? (
        <Box
          sx={{
            position: 'relative',
            borderRadius: 2,
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            component="img"
            src={state.photo.previewUrl}
            alt={t('productScan.photoAlt')}
            sx={{ display: 'block', width: '100%', maxHeight: 260, objectFit: 'contain' }}
          />
          <IconButton
            size="small"
            onClick={clearPhoto}
            aria-label={t('productScan.removePhoto')}
            sx={{
              position: 'absolute',
              top: theme.spacing(1),
              right: theme.spacing(1),
              bgcolor: alpha(theme.palette.background.paper, 0.9),
              '&:hover': { bgcolor: theme.palette.background.paper },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <ButtonRow
          onCamera={() => cameraInputRef.current?.click()}
          onGallery={() => galleryInputRef.current?.click()}
        />
      )}

      {state.photo && (
        <Button
          size="small"
          startIcon={<PhotoCameraIcon />}
          onClick={() => cameraInputRef.current?.click()}
          sx={{ alignSelf: 'flex-start' }}
        >
          {t('productScan.retakePhoto')}
        </Button>
      )}

      {state.scanning && (
        <Stack direction="row" alignItems="center" gap={1}>
          <CircularProgress size={18} />
          <Typography variant="body2">{t('productScan.scanning')}</Typography>
        </Stack>
      )}

      {state.photoError && <Alert severity="warning">{state.photoError}</Alert>}
      {state.scanError && <Alert severity="error">{state.scanError}</Alert>}

      <AiProcessingNote />
    </Stack>
  );
}

interface ButtonRowProps {
  onCamera: () => void;
  onGallery: () => void;
}

function ButtonRow({ onCamera, onGallery }: ButtonRowProps) {
  const theme = useTheme();
  const { t } = useTranslation('healthPassport');

  return (
    <Stack spacing={1.5} alignItems="center" sx={{ py: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 64,
          height: 64,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          color: 'primary.main',
        }}
      >
        <PhotoCameraIcon fontSize="large" />
      </Box>
      <Typography variant="body2" color="text.secondary" align="center">
        {t('productScan.photoDescription')}
      </Typography>
      <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="center">
        <Button variant="contained" size="large" startIcon={<PhotoCameraIcon />} onClick={onCamera}>
          {t('productScan.takePhoto')}
        </Button>
        <Button
          variant="outlined"
          size="large"
          startIcon={<PhotoLibraryIcon />}
          onClick={onGallery}
        >
          {t('productScan.fromGallery')}
        </Button>
      </Stack>
    </Stack>
  );
}

function ReviewStep() {
  const { t } = useTranslation('healthPassport');
  const { state, alerts, setDraftField } = useMedicationScanContext();
  const scan = state.scan;
  const draft = state.draft;
  const isMedication = draft.targetType === 'MEDICATION';

  if (!scan) return null;

  const blocking = alerts.filter((a) => a.severity === 'error');
  const advisory = alerts.filter((a) => a.severity !== 'error');

  return (
    <Stack spacing={2}>
      {blocking.map((alert) => (
        <Alert key={alert.code} severity="error">
          {t(`productScan.alerts.${alert.code}`, { ...alert.params })}
        </Alert>
      ))}

      <Stack spacing={1.5}>
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
            {NEXT_DUE_PRESET_DAYS.map((days) => {
              const active = draft.nextDueDate === plusDays(draft.dateGiven, days);
              return (
                <Chip
                  key={days}
                  label={t('productScan.presetDays', { days })}
                  size="small"
                  clickable
                  variant={active ? 'filled' : 'outlined'}
                  color={active ? 'primary' : 'default'}
                  onClick={() => setDraftField('nextDueDate', plusDays(draft.dateGiven, days))}
                />
              );
            })}
          </Stack>
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
      </Stack>

      {advisory.map((alert) => (
        <Alert key={alert.code} severity={alert.severity}>
          {t(`productScan.alerts.${alert.code}`, { ...alert.params })}
        </Alert>
      ))}

      <DetailsSection />
    </Stack>
  );
}

function DetailsSection() {
  const { t } = useTranslation('healthPassport');
  const { state, setDraftField } = useMedicationScanContext();
  // Varovania z obalu (kontraindikácie) sú dôvod detail rovno otvoriť.
  const [open, setOpen] = useState((state.scan?.warnings.length ?? 0) > 0);
  const scan = state.scan;
  if (!scan) return null;

  return (
    <Box>
      <Button size="small" onClick={() => setOpen(!open)} sx={{ px: 0 }}>
        {open ? t('productScan.hideDetails') : t('productScan.showDetails')}
      </Button>
      <Collapse in={open}>
        <Stack spacing={1.5} sx={{ pt: 1 }}>
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

          {state.draft.targetType !== 'MEDICATION' && scan.intervalRationale && (
            <Typography variant="caption" color="text.secondary">
              {t('productScan.intervalRationale', { value: scan.intervalRationale })}
            </Typography>
          )}

          <TextField
            size="small"
            label={t('productScan.batchNumber')}
            value={state.draft.batchNumber}
            onChange={(e) => setDraftField('batchNumber', e.target.value)}
            sx={{ width: { xs: '100%', sm: 240 } }}
          />

          {state.draft.targetType === 'MEDICATION' && (
            <DateField
              label={t('productScan.endDate')}
              value={state.draft.endDate}
              onChange={(value) => setDraftField('endDate', value)}
              sx={{ width: { xs: '100%', sm: 240 } }}
            />
          )}

          <TextField
            size="small"
            label={t('productScan.note')}
            value={state.draft.note}
            onChange={(e) => setDraftField('note', e.target.value)}
            multiline
            minRows={3}
            fullWidth
          />
        </Stack>
      </Collapse>
    </Box>
  );
}

export default function MedicationScanBody() {
  const { state } = useMedicationScanContext();
  return state.step === 0 ? <PhotoStep /> : <ReviewStep />;
}
