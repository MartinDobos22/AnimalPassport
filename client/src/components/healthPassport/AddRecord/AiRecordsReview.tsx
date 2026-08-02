import { useTranslation } from 'react-i18next';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { FactCheck as FactCheckIcon } from '@mui/icons-material';

import type { AiDetectedDraftRecord, AiDetectedRecordType } from '../hpTypes';
import SearchableSelect from '../../ui/SearchableSelect';

interface AiRecordsReviewProps {
  records: AiDetectedDraftRecord[];
  onChange: (id: string, patch: Partial<AiDetectedDraftRecord>) => void;
  hasProfileData?: boolean;
}

const CONFIDENCE_COLOR: Record<
  AiDetectedDraftRecord['sourceConfidence'],
  'success' | 'warning' | 'error'
> = {
  high: 'success',
  medium: 'warning',
  low: 'error',
};

const TARGET_TYPES: AiDetectedRecordType[] = [
  'VACCINATION',
  'DEWORMING',
  'ECTOPARASITE',
  'MEDICATION',
  'NOTE',
  'SKIP',
];

export default function AiRecordsReview({
  records,
  onChange,
  hasProfileData,
}: AiRecordsReviewProps) {
  const { t } = useTranslation('healthPassport');

  if (records.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {hasProfileData ? t('aiRecordsReview.emptyWithProfile') : t('aiRecordsReview.empty')}
      </Typography>
    );
  }

  const skippedCount = records.filter((r) => r.targetType === 'SKIP').length;
  const toSaveCount = records.length - skippedCount;
  const needsVerifyCount = records.filter(
    (r) => r.targetType !== 'SKIP' && r.sourceConfidence !== 'high'
  ).length;

  // Triedenie iba pre zobrazenie: záznamy na overenie navrch, preskočené naspodok.
  const rank = (r: AiDetectedDraftRecord): number => {
    if (r.targetType === 'SKIP') return 2;
    return r.sourceConfidence !== 'high' ? 0 : 1;
  };
  const sorted = records
    .map((record, index) => ({ record, index }))
    .sort((a, b) => rank(a.record) - rank(b.record) || a.index - b.index)
    .map((entry) => entry.record);

  const includeAll = () => {
    records.forEach((r) => {
      if (r.targetType === 'SKIP') {
        onChange(r.id, { targetType: r.suggestedType ?? 'NOTE' });
      }
    });
  };
  const skipAll = () => {
    records.forEach((r) => {
      if (r.targetType !== 'SKIP') {
        onChange(r.id, { targetType: 'SKIP' });
      }
    });
  };

  return (
    <Stack spacing={1.5}>
      <Alert severity="info" icon={<FactCheckIcon />}>
        <AlertTitle sx={{ fontWeight: 600 }}>{t('aiRecordsReview.headerTitle')}</AlertTitle>
        {t('aiRecordsReview.hint')}
      </Alert>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1,
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            color="success"
            variant="outlined"
            label={t('aiRecordsReview.summaryToSave', { count: toSaveCount })}
          />
          {needsVerifyCount > 0 && (
            <Chip
              size="small"
              color="warning"
              variant="outlined"
              label={t('aiRecordsReview.summaryNeedsVerify', { count: needsVerifyCount })}
            />
          )}
          {skippedCount > 0 && (
            <Chip
              size="small"
              variant="outlined"
              label={t('aiRecordsReview.summarySkipped', { count: skippedCount })}
            />
          )}
        </Stack>
        <Stack direction="row" spacing={0.75}>
          {skippedCount > 0 && (
            <Button size="small" onClick={includeAll}>
              {t('aiRecordsReview.includeAll')}
            </Button>
          )}
          {toSaveCount > 0 && (
            <Button size="small" color="inherit" onClick={skipAll}>
              {t('aiRecordsReview.skipAll')}
            </Button>
          )}
        </Stack>
      </Box>

      {sorted.map((record) => {
        const needsVerify = record.sourceConfidence !== 'high';
        return (
          <Card
            key={record.id}
            variant={needsVerify ? 'outlined' : undefined}
            sx={needsVerify ? { borderColor: 'warning.main' } : undefined}
          >
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }} flexWrap="wrap">
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, flex: 1, minWidth: 0 }}
                  noWrap
                >
                  {record.sourceDisease ||
                    record.productName ||
                    t('aiRecordsReview.recordFallback')}
                </Typography>
                {record.isDuplicate && (
                  <Chip
                    size="small"
                    label={t('aiRecordsReview.duplicate')}
                    color="warning"
                    variant="filled"
                  />
                )}
                {record.isHistorical && !record.isDuplicate && (
                  <Chip
                    size="small"
                    label={t('aiRecordsReview.historical')}
                    color="warning"
                    variant="outlined"
                  />
                )}
                <Chip
                  size="small"
                  label={t('aiRecordsReview.confidence', {
                    level: t(`aiRecordsReview.confidenceLevel.${record.sourceConfidence}` as never),
                  })}
                  color={CONFIDENCE_COLOR[record.sourceConfidence]}
                  variant="outlined"
                />
              </Stack>

              {record.skipReason === 'NO_DATE' && (
                <Alert severity="warning" sx={{ mb: 1 }}>
                  {t('aiRecordsReview.skipReason.NO_DATE')}
                </Alert>
              )}
              {record.skipReason === 'HISTORICAL' && (
                <Alert severity="warning" sx={{ mb: 1 }}>
                  <AlertTitle sx={{ fontWeight: 600, mb: 0.25 }}>
                    {t('aiRecordsReview.historicalTitle')}
                  </AlertTitle>
                  {record.comparisonNote ?? t('aiRecordsReview.historicalDefault')}
                </Alert>
              )}

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 1.25,
                }}
              >
                <SearchableSelect
                  label={t('aiRecordsReview.targetTypeLabel')}
                  value={record.targetType}
                  options={TARGET_TYPES.map((key) => ({
                    value: key,
                    label: t(`aiRecordsReview.type.${key}` as never),
                  }))}
                  onChange={(next) =>
                    onChange(record.id, { targetType: next as AiDetectedRecordType })
                  }
                />
                <TextField
                  size="small"
                  label={t('aiRecordsReview.fieldName')}
                  value={record.productName}
                  onChange={(e) => onChange(record.id, { productName: e.target.value })}
                />
                <TextField
                  size="small"
                  type="date"
                  label={t('aiRecordsReview.fieldDate')}
                  InputLabelProps={{ shrink: true }}
                  value={record.date}
                  onChange={(e) => onChange(record.id, { date: e.target.value })}
                  color={needsVerify ? 'warning' : undefined}
                  helperText={needsVerify ? t('aiRecordsReview.verifyDateHint') : undefined}
                  FormHelperTextProps={
                    needsVerify ? { sx: { color: 'warning.main', mx: 0 } } : undefined
                  }
                />
                <TextField
                  size="small"
                  type="date"
                  label={t('aiRecordsReview.fieldValidUntil')}
                  InputLabelProps={{ shrink: true }}
                  value={record.validUntil}
                  onChange={(e) => onChange(record.id, { validUntil: e.target.value })}
                  color={needsVerify ? 'warning' : undefined}
                  helperText={needsVerify ? t('aiRecordsReview.verifyDateHint') : undefined}
                  FormHelperTextProps={
                    needsVerify ? { sx: { color: 'warning.main', mx: 0 } } : undefined
                  }
                />
                <TextField
                  size="small"
                  label={t('aiRecordsReview.fieldBatch')}
                  value={record.batchNumber}
                  onChange={(e) => onChange(record.id, { batchNumber: e.target.value })}
                />
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}
