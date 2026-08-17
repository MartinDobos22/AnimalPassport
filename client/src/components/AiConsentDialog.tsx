import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import {
  AutoAwesome as AiIcon,
  FactCheck as FactCheckIcon,
  LockOutlined as LockIcon,
  SettingsBackupRestore as RevokeIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import { useAiConsent } from '../hooks/useAiConsent';

interface Props {
  open: boolean;
  /** `consent` pýta súhlas a potvrdením spustí akciu, `info` len vysvetľuje. */
  mode?: 'consent' | 'info';
  onClose: () => void;
  /** Zavolá sa až po úspešnom uložení súhlasu — volajúci môže rovno pokračovať. */
  onGranted?: () => void;
}

const POINT_ICONS = [LockIcon, FactCheckIcon, RevokeIcon];

export default function AiConsentDialog({ open, mode = 'consent', onClose, onGranted }: Props) {
  const { t } = useTranslation('common');
  const { grant } = useAiConsent();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleGrant = async () => {
    setSaving(true);
    setError('');
    try {
      await grant();
      onGranted?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('aiConsent.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const points = t('aiConsent.points', { returnObjects: true }) as string[];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" gap={1}>
          <AiIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('aiConsent.title')}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            {t('aiConsent.intro')}
          </Typography>
          <Stack spacing={1}>
            {(Array.isArray(points) ? points : []).map((point, index) => {
              const Icon = POINT_ICONS[index] ?? LockIcon;
              return (
                <Stack key={point} direction="row" gap={1} alignItems="flex-start">
                  <Icon fontSize="small" color="action" sx={{ mt: 0.25 }} />
                  <Typography variant="body2">{point}</Typography>
                </Stack>
              );
            })}
          </Stack>
          <Link href="/ochrana-sukromia" target="_blank" rel="noopener" variant="body2">
            {t('aiConsent.privacyLink')}
          </Link>
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {mode === 'info' ? (
          <Button onClick={onClose}>{t('actions.close')}</Button>
        ) : (
          <>
            <Button onClick={onClose} disabled={saving}>
              {t('aiConsent.later')}
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                void handleGrant();
              }}
              disabled={saving}
            >
              {t('aiConsent.accept')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
