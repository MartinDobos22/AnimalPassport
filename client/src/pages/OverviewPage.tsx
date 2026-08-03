import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Add as AddIcon,
  FactCheck as FactCheckIcon,
  InfoOutlined as InfoOutlinedIcon,
  SpaceDashboard as SpaceDashboardIcon,
} from '@mui/icons-material';
import Seo from '../components/Seo';
import FeatureIntro from '../components/FeatureIntro';
import PageContainer from '../components/ui/PageContainer';
import PetStatusCard from '../components/overview/PetStatusCard';
import CareStatusChip from '../components/overview/CareStatusChip';
import OnboardingWelcomeCard from '../components/overview/OnboardingWelcomeCard';
import {
  getOnboardingIntent,
  clearOnboardingIntent,
  intentActionRoute,
  type OnboardingIntent,
} from '../utils/onboardingIntent';
import { usePetProfiles } from '../hooks/usePetProfiles';
import { useHealthData } from '../hooks/useHealthData';
import { useCareStatus } from '../hooks/useCareStatus';
import { notificationsApi, type UpcomingItem } from '../services/notificationsApi';
import type { CareStatusLevel, CheckIn } from '../types/petHealth';

const LEVEL_PRIORITY: Record<CareStatusLevel, number> = { red: 0, orange: 1, green: 2 };

export default function OverviewPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();

  const { profiles, loading: profilesLoading } = usePetProfiles();
  const { dietEntries, checkIns } = useHealthData();
  const { statuses, loading: statusLoading, error } = useCareStatus();
  const [upcoming, setUpcoming] = useState<UpcomingItem[]>([]);
  const [intent, setIntent] = useState<OnboardingIntent | null>(() => getOnboardingIntent());

  useEffect(() => {
    let active = true;
    notificationsApi
      .getUpcoming()
      .then((res) => {
        if (active) setUpcoming(res.items);
      })
      .catch(() => {
        /* dashboard funguje aj bez pripomienok */
      });
    return () => {
      active = false;
    };
  }, []);

  // Onboarding intent (z landing CTA): user s aspoň jedným psom → presmeruj na
  // relevantnú akciu. Nový user (0 psov) dostane uvítaciu kartu nižšie.
  useEffect(() => {
    if (!intent || profilesLoading) return;
    if (profiles.length > 0) {
      clearOnboardingIntent();
      navigate(intentActionRoute(intent), { replace: true });
    }
  }, [intent, profilesLoading, profiles.length, navigate]);

  const statusByPet = useMemo(() => new Map(statuses.map((s) => [s.petId, s])), [statuses]);

  const currentFoodByPet = useMemo(() => {
    const map = new Map<string, (typeof dietEntries)[number]>();
    for (const d of dietEntries) {
      if (d.endedAt) continue;
      const prev = map.get(d.petId);
      if (!prev || d.startedAt > prev.startedAt) map.set(d.petId, d);
    }
    return map;
  }, [dietEntries]);

  const lastCheckInByPet = useMemo(() => {
    const map = new Map<string, CheckIn>();
    for (const c of checkIns) {
      const prev = map.get(c.petId);
      const isNewer =
        !prev ||
        c.date > prev.date ||
        (c.date === prev.date && (c.createdAt ?? '') > (prev.createdAt ?? ''));
      if (isNewer) map.set(c.petId, c);
    }
    return map;
  }, [checkIns]);

  const nextReminderByPet = useMemo(() => {
    const map = new Map<string, UpcomingItem>();
    for (const item of upcoming) {
      const prev = map.get(item.petId);
      if (!prev || item.daysUntil < prev.daysUntil) map.set(item.petId, item);
    }
    return map;
  }, [upcoming]);

  const aggregateLevel = useMemo<CareStatusLevel>(() => {
    if (statuses.length === 0) return 'green';
    return statuses.map((s) => s.status).sort((a, b) => LEVEL_PRIORITY[a] - LEVEL_PRIORITY[b])[0];
  }, [statuses]);

  const petNamesByLevel = useMemo(() => {
    const red: string[] = [];
    const orange: string[] = [];
    for (const pet of profiles) {
      const level = statusByPet.get(pet.id)?.status;
      if (level === 'red') red.push(pet.name);
      else if (level === 'orange') orange.push(pet.name);
    }
    return { red, orange };
  }, [profiles, statusByPet]);

  const totalOpenItems = useMemo(
    () => statuses.reduce((sum, s) => (s.status === 'green' ? sum : sum + s.reasons.length), 0),
    [statuses]
  );

  const summaryText =
    aggregateLevel === 'red'
      ? t('overview.summaryRed', { pets: petNamesByLevel.red.join(', ') })
      : aggregateLevel === 'orange'
        ? t('overview.summaryOrange', { pets: petNamesByLevel.orange.join(', ') })
        : t('overview.summaryGreen');

  const levelColor =
    aggregateLevel === 'red'
      ? theme.palette.error.main
      : aggregateLevel === 'orange'
        ? theme.palette.warning.main
        : theme.palette.success.main;

  const loading = profilesLoading || statusLoading;

  return (
    <PageContainer>
      <Seo title={`${t('overview.title')} — Pawly`} noindex />

      <Typography variant="h4" sx={{ mb: theme.spacing(0.5) }}>
        {t('overview.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: theme.spacing(3) }}>
        {t('overview.subtitle')}
      </Typography>

      <FeatureIntro featureKey="overview" icon={<SpaceDashboardIcon />} />

      {error && (
        <Alert severity="error" sx={{ mb: theme.spacing(2) }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: theme.spacing(6) }}>
          <CircularProgress />
        </Box>
      ) : profiles.length === 0 ? (
        intent ? (
          <OnboardingWelcomeCard
            intent={intent}
            onAddPet={() => navigate('/profily')}
            onDismiss={() => {
              clearOnboardingIntent();
              setIntent(null);
            }}
          />
        ) : (
          <Card sx={{ p: theme.spacing(4), textAlign: 'center', maxWidth: 520, mx: 'auto' }}>
            <Typography variant="h6" sx={{ mb: theme.spacing(1) }}>
              {t('overview.emptyTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: theme.spacing(2) }}>
              {t('overview.emptySubtitle')}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/profily')}
            >
              {t('overview.emptyAction')}
            </Button>
          </Card>
        )
      ) : (
        <Stack spacing={theme.spacing(2)}>
          <Card
            sx={{
              p: theme.spacing(3),
              borderRadius: 2,
              borderLeft: `4px solid ${levelColor}`,
              bgcolor: alpha(levelColor, theme.palette.mode === 'dark' ? 0.12 : 0.06),
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={theme.spacing(2)}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
            >
              <Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CareStatusChip
                    level={aggregateLevel}
                    count={aggregateLevel === 'green' ? undefined : totalOpenItems}
                  />
                  <Tooltip title={t('overview.whatChecked')} enterTouchDelay={0} arrow>
                    <InfoOutlinedIcon
                      fontSize="small"
                      sx={{ color: 'text.secondary', cursor: 'help' }}
                    />
                  </Tooltip>
                </Stack>
                <Typography variant="h6" sx={{ mt: theme.spacing(1) }}>
                  {summaryText}
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={<FactCheckIcon />}
                onClick={() => navigate('/check-in')}
                sx={{ flexShrink: 0 }}
              >
                {t('checkIn.title')}
              </Button>
            </Stack>
          </Card>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              gap: theme.spacing(2),
              alignItems: 'stretch',
            }}
          >
            {profiles.map((pet) => (
              <PetStatusCard
                key={pet.id}
                pet={pet}
                status={statusByPet.get(pet.id)}
                currentFood={currentFoodByPet.get(pet.id)}
                nextReminder={nextReminderByPet.get(pet.id)}
                lastCheckIn={lastCheckInByPet.get(pet.id)}
              />
            ))}
          </Box>
        </Stack>
      )}
    </PageContainer>
  );
}
