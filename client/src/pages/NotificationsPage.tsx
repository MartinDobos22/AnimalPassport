import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { NotificationsActive as NotifyIcon } from '@mui/icons-material';

import FeatureIntro from '../components/FeatureIntro';
import IconTile from '../components/ui/IconTile';
import PageContainer from '../components/ui/PageContainer';
import { useAuth } from '../hooks/useAuth';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import type { NotificationPreferences } from '../services/notificationsApi';

const LEAD_DAY_OPTIONS = [30, 14, 7, 1];

const TYPE_TOGGLE_KEYS: Array<keyof NotificationPreferences> = [
  'notifyVaccinations',
  'notifyDewormings',
  'notifyEctoparasites',
  'notifyVetChecks',
  'notifyTreatments',
  'notifyMedications',
];

function statusColor(status: string): 'error' | 'warning' | 'success' {
  if (status === 'OVERDUE') return 'error';
  if (status === 'DUE_SOON') return 'warning';
  return 'success';
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { prefs, upcoming, loading, error, save } = useNotificationPreferences();
  const [localError, setLocalError] = useState<string | null>(null);
  const [customDay, setCustomDay] = useState('');
  const { t } = useTranslation('landing');

  const dueText = (days: number): string => {
    if (days < 0) return t('notifications.dueText.overdue', { count: -days });
    if (days === 0) return t('notifications.dueText.today');
    return t('notifications.dueText.upcoming', { count: days });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!prefs) {
    return <Alert severity="error">{error ?? t('notifications.loadError')}</Alert>;
  }

  const toggleLeadDay = (day: number) => {
    const has = prefs.leadDays.includes(day);
    const next = has ? prefs.leadDays.filter((d) => d !== day) : [...prefs.leadDays, day];
    if (next.length === 0) {
      setLocalError(t('notifications.minLeadDaysError'));
      return;
    }
    setLocalError(null);
    void save({ leadDays: next });
  };

  const removeLeadDay = (day: number) => {
    const next = prefs.leadDays.filter((d) => d !== day);
    if (next.length === 0) {
      setLocalError(t('notifications.minLeadDaysError'));
      return;
    }
    setLocalError(null);
    void save({ leadDays: next });
  };

  const addCustomLeadDay = () => {
    const day = Number(customDay);
    if (!Number.isInteger(day) || day < 1 || day > 365) {
      setLocalError(t('notifications.invalidLeadDay'));
      return;
    }
    setCustomDay('');
    setLocalError(null);
    if (prefs.leadDays.includes(day)) return;
    void save({ leadDays: [...prefs.leadDays, day] });
  };

  const customLeadDays = prefs.leadDays
    .filter((d) => !LEAD_DAY_OPTIONS.includes(d))
    .sort((a, b) => b - a);

  return (
    <PageContainer>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
        <IconTile icon={<NotifyIcon />} size={44} />
        <Typography variant="h4">{t('notifications.title')}</Typography>
      </Stack>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {t('notifications.description')}
      </Typography>

      <FeatureIntro featureKey="notifications" icon={<NotifyIcon />} />

      {(error || localError) && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {localError ?? error}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 3fr) minmax(0, 2fr)' },
          gap: 2,
          alignItems: 'start',
        }}
      >
        <Stack spacing={2}>
          <Card sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {t('notifications.emailSection')}
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={prefs.emailEnabled}
                    onChange={(e) => save({ emailEnabled: e.target.checked })}
                  />
                }
                label={t('notifications.emailEnabled')}
              />
              <Typography variant="caption" color="text.secondary">
                {user?.email
                  ? t('notifications.emailSentTo', { email: user.email })
                  : t('notifications.emailNoEmail')}
              </Typography>
            </Stack>
          </Card>

          <Card sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {t('notifications.leadDaysTitle')}
              </Typography>
              <Stack direction="row" gap={1} flexWrap="wrap">
                {LEAD_DAY_OPTIONS.map((day) => (
                  <Chip
                    key={day}
                    label={t('notifications.leadDayChip', { count: day })}
                    color={prefs.leadDays.includes(day) ? 'primary' : 'default'}
                    variant={prefs.leadDays.includes(day) ? 'filled' : 'outlined'}
                    onClick={() => toggleLeadDay(day)}
                  />
                ))}
                {customLeadDays.map((day) => (
                  <Chip
                    key={day}
                    label={t('notifications.leadDayChip', { count: day })}
                    color="primary"
                    variant="filled"
                    onDelete={() => removeLeadDay(day)}
                  />
                ))}
              </Stack>
              <Stack direction="row" gap={1} alignItems="center">
                <TextField
                  size="small"
                  type="number"
                  label={t('notifications.customDayLabel')}
                  value={customDay}
                  onChange={(e) => setCustomDay(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomLeadDay();
                    }
                  }}
                  inputProps={{ min: 1, max: 365 }}
                  sx={{ width: (th) => th.spacing(18) }}
                />
                <Button variant="outlined" onClick={addCustomLeadDay}>
                  {t('notifications.addLeadDay')}
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {t('notifications.leadDaysNote')}
              </Typography>
            </Stack>
          </Card>

          <Card sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={0.5}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                {t('notifications.typesTitle')}
              </Typography>
              {TYPE_TOGGLE_KEYS.map((key) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Switch
                      checked={prefs[key] as boolean}
                      onChange={(e) => save({ [key]: e.target.checked })}
                    />
                  }
                  label={t(`notifications.types.${key}` as never)}
                />
              ))}
            </Stack>
          </Card>
        </Stack>

        <Stack spacing={2}>
          <Card sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              {t('notifications.upcomingTitle')}
            </Typography>
            {upcoming.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t('notifications.noUpcoming')}
              </Typography>
            ) : (
              <Stack divider={<Divider />} spacing={0}>
                {upcoming.map((item) => (
                  <Stack
                    key={`${item.type}-${item.recordId}`}
                    direction="row"
                    alignItems="center"
                    gap={1}
                    sx={{ py: 1 }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {item.petName} · {item.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.typeLabel} · {item.dueDate}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      color={statusColor(item.status)}
                      label={dueText(item.daysUntil)}
                    />
                  </Stack>
                ))}
              </Stack>
            )}
          </Card>

          <Typography variant="caption" color="text.secondary">
            {t('notifications.pushComing')}
          </Typography>
        </Stack>
      </Box>
    </PageContainer>
  );
}
