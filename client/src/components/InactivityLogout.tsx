import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { clearLastActivity, useInactivityLogout } from '../hooks/useInactivityLogout';
import { markInactivityLogout } from '../utils/inactivityNotice';
import { logger } from '../utils/logger';

const DEFAULT_TIMEOUT_MINUTES = 30;
const WARNING_SECONDS = 60;

// 0 = funkcia vypnutá, chýbajúca/neplatná hodnota = default.
function resolveTimeoutMinutes(): number {
  const raw = import.meta.env.VITE_INACTIVITY_TIMEOUT_MINUTES;
  if (raw === undefined || raw === '') return DEFAULT_TIMEOUT_MINUTES;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_TIMEOUT_MINUTES;
  return parsed;
}

export default function InactivityLogout() {
  const { t } = useTranslation('auth');
  const { logout } = useAuth();
  const timeoutMinutes = resolveTimeoutMinutes();

  const handleTimeout = useCallback(() => {
    markInactivityLogout();
    clearLastActivity();
    void logout().catch((err: unknown) => {
      logger.warn('Odhlásenie pri neaktivite zlyhalo', {
        reason: err instanceof Error ? err.message : String(err),
      });
    });
  }, [logout]);

  const { warningActive, secondsLeft, stayActive } = useInactivityLogout({
    timeoutMs: Math.max(timeoutMinutes, 0) * 60_000,
    warningMs: WARNING_SECONDS * 1_000,
    onTimeout: handleTimeout,
  });

  if (timeoutMinutes === 0) return null;

  return (
    <Dialog open={warningActive} onClose={stayActive}>
      <DialogTitle>{t('inactivity.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t('inactivity.body', { seconds: secondsLeft })}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleTimeout}>{t('inactivity.logout')}</Button>
        <Button variant="contained" onClick={stayActive}>
          {t('inactivity.stay')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
