import { useMemo, useState } from 'react';
import { Avatar, Box, Button, Chip, Stack, Typography, alpha, useTheme } from '@mui/material';
import {
  ArrowForward as ArrowIcon,
  Biotech as DewormIcon,
  Event as VetIcon,
  NotificationsActive as BellIcon,
  PestControl as EctoIcon,
  Vaccines as VaccineIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { track } from '../../utils/analytics';
import { landingCardSx } from './landingCardSx';

type ReminderStatus = 'overdue' | 'soon' | 'ok';
type ReminderType = 'vaccine' | 'deworm' | 'ecto' | 'vet';

interface ReminderItem {
  type: ReminderType;
  label: string;
  due: string;
  status: ReminderStatus;
}

interface ReminderPet {
  id: string;
  name: string;
  meta: string;
  items: ReminderItem[];
}

const TYPE_ICON: Record<ReminderType, typeof VaccineIcon> = {
  vaccine: VaccineIcon,
  deworm: DewormIcon,
  ecto: EctoIcon,
  vet: VetIcon,
};

export default function HealthRemindersDemo() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation('landing');

  const pets = t('reminders.pets', { returnObjects: true }) as ReminderPet[];
  const [activeId, setActiveId] = useState(pets[0]?.id ?? '');

  const active = useMemo(() => pets.find((p) => p.id === activeId) ?? pets[0], [pets, activeId]);

  const handleSelect = (id: string) => {
    if (id === activeId) return;
    track('demo_reminder_pet', { pet: id });
    setActiveId(id);
  };

  const statusColor = (status: ReminderStatus): string => {
    if (status === 'overdue') return theme.palette.error.main;
    if (status === 'soon') return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  const statusLabel = (status: ReminderStatus): string => t(`reminders.statusLabels.${status}`);

  if (!active) return null;

  return (
    <Box sx={{ py: { xs: 8, md: 14 } }}>
      <Box sx={{ maxWidth: 820, mx: 'auto', px: { xs: 2.5, md: 4 } }}>
        <Stack alignItems="center" spacing={2} sx={{ mb: { xs: 4, md: 6 }, textAlign: 'center' }}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BellIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography
              variant="caption"
              sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.12em' }}
            >
              {t('reminders.badge')}
            </Typography>
          </Stack>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2rem', md: '3rem' },
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
            }}
          >
            {t('reminders.title')}
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: 'text.secondary', maxWidth: 560, fontSize: { xs: '1rem', md: '1.1rem' } }}
          >
            {t('reminders.subtitle')}
          </Typography>
        </Stack>

        <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="center" sx={{ mb: 2.5 }}>
          {pets.map((pet) => (
            <Chip
              key={pet.id}
              label={pet.name}
              clickable
              onClick={() => handleSelect(pet.id)}
              color={pet.id === active.id ? 'primary' : 'default'}
              variant={pet.id === active.id ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600, height: 34, '& .MuiChip-label': { px: 1.75 } }}
            />
          ))}
        </Stack>

        <Box
          sx={{
            p: { xs: 2.5, md: 4 },
            borderRadius: 4,
            ...landingCardSx(theme),
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.75} sx={{ mb: 1 }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: alpha(theme.palette.primary.main, 0.16),
                color: 'primary.dark',
                fontWeight: 700,
              }}
            >
              {active.name.charAt(0)}
            </Avatar>
            <Stack sx={{ minWidth: 0 }}>
              <Typography variant="h3" sx={{ fontSize: '1.15rem', fontWeight: 700 }}>
                {active.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', textTransform: 'none', letterSpacing: 0 }}
              >
                {active.meta}
              </Typography>
            </Stack>
          </Stack>

          <Stack>
            {active.items.map((item, index) => {
              const color = statusColor(item.status);
              const Icon = TYPE_ICON[item.type];
              return (
                <Stack
                  key={`${item.type}-${item.label}`}
                  direction="row"
                  alignItems="center"
                  gap={1.5}
                  sx={{
                    py: 1.5,
                    borderTop: index === 0 ? 'none' : `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      flexShrink: 0,
                      bgcolor: alpha(color, theme.palette.mode === 'light' ? 0.12 : 0.2),
                      color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon sx={{ fontSize: 20 }} />
                  </Box>
                  <Stack sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {item.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', textTransform: 'none', letterSpacing: 0 }}
                    >
                      {item.due}
                    </Typography>
                  </Stack>
                  <Chip
                    label={statusLabel(item.status)}
                    size="small"
                    sx={{
                      flexShrink: 0,
                      bgcolor: alpha(color, 0.16),
                      color,
                      fontWeight: 700,
                      height: 24,
                      fontSize: '0.7rem',
                      '& .MuiChip-label': { px: 1 },
                    }}
                  />
                </Stack>
              );
            })}
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            gap={1}
            sx={{
              mt: 2,
              pt: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
              color: 'text.secondary',
            }}
          >
            <BellIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography variant="caption" sx={{ textTransform: 'none', letterSpacing: 0 }}>
              {t('reminders.footerNote')}
            </Typography>
          </Stack>
        </Box>

        <Stack alignItems="center" sx={{ mt: 3.5 }}>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowIcon />}
            onClick={() => {
              track('cta_register', { location: 'reminders_demo' });
              navigate('/register');
            }}
            sx={{ fontSize: '1rem', px: 4 }}
          >
            {t('reminders.cta')}
          </Button>
          <Typography variant="caption" sx={{ color: 'text.disabled', mt: 1.25 }}>
            {t('reminders.ctaNote')}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
