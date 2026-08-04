import { useTranslation } from 'react-i18next';
import { Box, Button, Card, IconButton, Typography, useTheme } from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Celebration as CelebrationIcon,
} from '@mui/icons-material';
import type { OnboardingIntent } from '../../utils/onboardingIntent';

interface Props {
  intent: OnboardingIntent;
  onAddPet: () => void;
  onDismiss: () => void;
}

export default function OnboardingWelcomeCard({ intent, onAddPet, onDismiss }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  const body = intent === 'food' ? t('overview.welcomeFood') : t('overview.welcomePassport');

  return (
    <Card sx={{ p: theme.spacing(3), position: 'relative' }}>
      <IconButton
        aria-label={t('overview.welcomeDismiss')}
        onClick={onDismiss}
        size="small"
        sx={{ position: 'absolute', top: theme.spacing(1), right: theme.spacing(1) }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: theme.spacing(1) }}>
        <CelebrationIcon color="primary" />
        <Typography variant="h6">{t('overview.welcomeTitle')}</Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: theme.spacing(2) }}>
        {body}
      </Typography>

      <Button variant="contained" startIcon={<AddIcon />} onClick={onAddPet}>
        {t('overview.welcomeAddPet')}
      </Button>
    </Card>
  );
}
