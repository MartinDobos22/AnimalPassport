import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MedicalServices as VetIcon,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ExamResult, VetVisitRecord } from '../../types/petHealth';
import AiFormattedText from '../AiFormattedText';

const EXAM_RESULTS: ExamResult[] = ['NORMAL', 'ABNORMAL', 'INCONCLUSIVE'];

interface VisitDraft {
  date: string;
  clinicName: string;
  vetName: string;
  reason: string;
  findings: string;
  diagnosis: string;
  recommendations: string;
  nextCheckDate: string;
  examResult: ExamResult | '';
}

interface VisitDetailDialogProps {
  visit: VetVisitRecord | null;
  open: boolean;
  onClose: () => void;
  onSave: (draft: VisitDraft) => void;
  onDelete: () => void;
}

export default function VisitDetailDialog({
  visit,
  open,
  onClose,
  onSave,
  onDelete,
}: VisitDetailDialogProps) {
  const theme = useTheme();
  const { t } = useTranslation('healthPassport');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<VisitDraft>({
    date: '',
    clinicName: '',
    vetName: '',
    reason: '',
    findings: '',
    diagnosis: '',
    recommendations: '',
    nextCheckDate: '',
    examResult: '',
  });

  useEffect(() => {
    if (visit) {
      setDraft({
        date: visit.date,
        clinicName: visit.clinicName,
        vetName: visit.vetName ?? '',
        reason: visit.reason,
        findings: visit.findings ?? '',
        diagnosis: visit.diagnosis ?? '',
        recommendations: visit.recommendations ?? '',
        nextCheckDate: visit.nextCheckDate ?? '',
        examResult: visit.examResult ?? '',
      });
      setEditing(false);
    }
  }, [visit]);

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };

  if (!visit) return null;

  const SectionLabel = ({ children }: { children: string }) => (
    <Typography
      variant="caption"
      sx={{
        display: 'block',
        fontWeight: 700,
        fontSize: '0.68rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'text.secondary',
        mb: 0.5,
      }}
    >
      {children}
    </Typography>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          backgroundImage: 'none',
        },
      }}
    >
      {/* Custom title with close button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 3,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.info.main, 0.1),
            color: theme.palette.info.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <VetIcon sx={{ fontSize: 18 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>
            {visit.clinicName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {visit.date} {visit.aiExamType ? `· ${visit.aiExamType}` : ''}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ borderRadius: 2 }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ pt: 2.5 }}>
        <Stack spacing={2}>
          {editing ? (
            // Edit mode
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                <TextField
                  label={t('detail.date')}
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={draft.date}
                  onChange={(e) => setDraft((p) => ({ ...p, date: e.target.value }))}
                  size="small"
                />
                <TextField
                  label={t('detail.clinic')}
                  value={draft.clinicName}
                  onChange={(e) => setDraft((p) => ({ ...p, clinicName: e.target.value }))}
                  size="small"
                />
                <TextField
                  label={t('detail.vetName')}
                  value={draft.vetName}
                  onChange={(e) => setDraft((p) => ({ ...p, vetName: e.target.value }))}
                  size="small"
                />
                <TextField
                  label={t('detail.nextCheck')}
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={draft.nextCheckDate}
                  onChange={(e) => setDraft((p) => ({ ...p, nextCheckDate: e.target.value }))}
                  size="small"
                />
                <TextField
                  select
                  label={t('detail.examResult')}
                  value={draft.examResult}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, examResult: e.target.value as ExamResult | '' }))
                  }
                  size="small"
                >
                  <MenuItem value="">{t('examResults.none')}</MenuItem>
                  {EXAM_RESULTS.map((r) => (
                    <MenuItem key={r} value={r}>
                      {t(`examResults.${r}`)}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <TextField
                label={t('detail.visitReason')}
                value={draft.reason}
                onChange={(e) => setDraft((p) => ({ ...p, reason: e.target.value }))}
                size="small"
              />
              <TextField
                label={t('detail.findings')}
                multiline
                minRows={2}
                value={draft.findings}
                onChange={(e) => setDraft((p) => ({ ...p, findings: e.target.value }))}
                size="small"
              />
              <TextField
                label={t('detail.diagnosis')}
                value={draft.diagnosis}
                onChange={(e) => setDraft((p) => ({ ...p, diagnosis: e.target.value }))}
                size="small"
              />
              <TextField
                label={t('detail.recommendations')}
                multiline
                minRows={2}
                value={draft.recommendations}
                onChange={(e) => setDraft((p) => ({ ...p, recommendations: e.target.value }))}
                size="small"
              />
            </>
          ) : (
            // View mode
            <>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 1.5,
                }}
              >
                {[
                  { label: t('detail.date'), value: draft.date },
                  { label: t('detail.clinic'), value: draft.clinicName },
                  draft.vetName ? { label: t('detail.vetName'), value: draft.vetName } : null,
                  draft.nextCheckDate
                    ? { label: t('detail.nextCheck'), value: draft.nextCheckDate }
                    : null,
                  draft.examResult
                    ? { label: t('detail.examResult'), value: t(`examResults.${draft.examResult}`) }
                    : null,
                ]
                  .filter(Boolean)
                  .map(
                    (field) =>
                      field && (
                        <Box key={field.label}>
                          <SectionLabel>{field.label}</SectionLabel>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {field.value || '–'}
                          </Typography>
                        </Box>
                      )
                  )}
              </Box>

              {draft.reason && (
                <Box>
                  <SectionLabel>{t('detail.visitReason')}</SectionLabel>
                  <Typography variant="body2">{draft.reason}</Typography>
                </Box>
              )}

              {draft.diagnosis && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.05),
                    border: '1px solid',
                    borderColor: alpha(theme.palette.info.main, 0.15),
                  }}
                >
                  <SectionLabel>{t('detail.diagnosis')}</SectionLabel>
                  <AiFormattedText text={draft.diagnosis} />
                </Box>
              )}

              {draft.findings && (
                <Box>
                  <SectionLabel>{t('detail.findings')}</SectionLabel>
                  <AiFormattedText text={draft.findings} />
                </Box>
              )}

              {draft.recommendations && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.05),
                    border: '1px solid',
                    borderColor: alpha(theme.palette.success.main, 0.15),
                  }}
                >
                  <SectionLabel>{t('detail.recommendations')}</SectionLabel>
                  <AiFormattedText text={draft.recommendations} />
                </Box>
              )}

              {visit.aiExamType && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  {t('detail.aiSource')}: <strong>{visit.aiExamType}</strong>
                </Alert>
              )}

              {visit.attachments?.length ? (
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <SectionLabel>{t('detail.attachments')}</SectionLabel>
                    {visit.attachments.map((a) => (
                      <Typography
                        key={a.objectPath}
                        variant="body2"
                        sx={{ color: 'text.secondary' }}
                      >
                        • {a.caption ?? a.objectPath.split('/').pop()}
                      </Typography>
                    ))}
                  </CardContent>
                </Card>
              ) : null}
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          startIcon={<DeleteIcon />}
          color="error"
          onClick={onDelete}
          size="small"
          sx={{ borderRadius: 2, mr: 'auto' }}
        >
          {t('detail.delete')}
        </Button>
        <Button onClick={onClose} size="small" sx={{ borderRadius: 2 }}>
          {t('detail.close')}
        </Button>
        {!editing ? (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            size="small"
            onClick={() => setEditing(true)}
            sx={{ borderRadius: 2 }}
          >
            {t('detail.edit')}
          </Button>
        ) : (
          <Button variant="contained" size="small" onClick={handleSave} sx={{ borderRadius: 2 }}>
            {t('detail.save')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
