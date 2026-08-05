import { useTranslation } from 'react-i18next';
import { Box, Card, Chip, Stack, Typography, alpha, useTheme } from '@mui/material';
import { HealthAndSafety as HealthIcon, WarningAmber as ChronicIcon } from '@mui/icons-material';
import type { PetProfile } from '../../types';
import { dedupList, subtractList } from '../../utils/healthProfileDedup';

interface Props {
  dog: PetProfile;
}

interface SubsectionProps {
  label: string;
  icon: React.ReactElement;
  items: string[];
  tone: 'primary' | 'error' | 'warning';
}

function Subsection({ label, icon, items, tone }: SubsectionProps) {
  const theme = useTheme();
  if (items.length === 0) return null;

  const toneColor =
    tone === 'primary'
      ? theme.palette.primary.main
      : tone === 'error'
        ? theme.palette.error.main
        : theme.palette.warning.main;

  return (
    <Box sx={{ flex: 1, minWidth: { xs: 0, sm: 200 } }}>
      <Stack direction="row" alignItems="center" gap={0.75} sx={{ mb: 0.75 }}>
        <Box
          sx={{
            width: 22,
            height: 22,
            borderRadius: 1,
            bgcolor: alpha(toneColor, 0.14),
            color: toneColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& svg': { fontSize: 14 },
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', fontSize: '0.7rem', letterSpacing: '0.08em' }}
        >
          {label}
        </Typography>
      </Stack>
      <Stack direction="row" flexWrap="wrap" gap={0.5}>
        {items.map((item) => (
          <Chip
            key={item}
            label={item}
            size="small"
            variant="outlined"
            sx={{
              borderColor: alpha(toneColor, 0.35),
              color: toneColor,
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}

export default function HealthProfileChips({ dog }: Props) {
  const { t } = useTranslation('vetCard');
  const theme = useTheme();
  const chronic = dedupList(dog.chronicConditions?.map((c) => c.title) ?? dog.healthConditions);
  const allergies = dedupList(dog.allergies);
  const intolerances = subtractList(allergies, dog.intolerances);
  const hasContent = chronic.length > 0 || Boolean(dog.notes);

  // Allergies/intolerances live in SafetyAlertBanner above; repeating them here was duplicate noise.
  if (!hasContent && (allergies.length > 0 || intolerances.length > 0)) return null;

  if (!hasContent) {
    return (
      <Card
        variant="outlined"
        sx={{
          p: 1.5,
          bgcolor: 'background.default',
          borderRadius: 0,
          borderTopWidth: 0,
          borderBottomWidth: 0,
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          gap={{ xs: 0.5, sm: 1 }}
        >
          <Stack direction="row" alignItems="center" gap={1}>
            <HealthIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('healthProfile.title')}
            </Typography>
          </Stack>
          <Box sx={{ flex: 1, display: { xs: 'none', sm: 'block' } }} />
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontStyle: 'italic',
              textTransform: 'none',
              letterSpacing: 0,
            }}
          >
            {t('healthProfile.empty')}
          </Typography>
        </Stack>
      </Card>
    );
  }

  return (
    <Card
      variant="outlined"
      sx={{
        p: { xs: 1.75, md: 2 },
        bgcolor: 'background.default',
        borderRadius: 0,
        borderTopWidth: 0,
        borderBottomWidth: 0,
      }}
    >
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
        <HealthIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('healthProfile.title')}
        </Typography>
      </Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} gap={2} flexWrap="wrap">
        <Subsection
          label={t('healthProfile.chronic')}
          icon={<ChronicIcon />}
          items={chronic}
          tone="primary"
        />
      </Stack>
      {dog.notes && (
        <Box sx={{ mt: 1.5, pt: 1.25, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
            {t('healthProfile.notes')}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', textTransform: 'none', letterSpacing: 0 }}
          >
            {dog.notes}
          </Typography>
        </Box>
      )}
    </Card>
  );
}
