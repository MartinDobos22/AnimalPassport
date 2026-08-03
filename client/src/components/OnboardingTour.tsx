import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MobileStepper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Pets as PetsIcon,
  Science as ScienceIcon,
  HealthAndSafety as HealthAndSafetyIcon,
  InstallMobile as InstallMobileIcon,
  FactCheck as FactCheckIcon,
} from '@mui/icons-material';

interface OnboardingTourProps {
  open: boolean;
  onClose: () => void;
}

type StepKey = 'welcome' | 'profile' | 'passport' | 'routine' | 'install';

const STEP_ICONS: Record<StepKey, typeof ScienceIcon> = {
  welcome: ScienceIcon,
  profile: PetsIcon,
  passport: HealthAndSafetyIcon,
  routine: FactCheckIcon,
  install: InstallMobileIcon,
};

const STEP_FALLBACK_ICON = HealthAndSafetyIcon;

export default function OnboardingTour({ open, onClose }: OnboardingTourProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);

  const steps: StepKey[] = useMemo(
    () => ['welcome', 'profile', 'passport', 'routine', 'install'],
    []
  );
  const totalSteps = steps.length;
  const isLast = activeStep === totalSteps - 1;
  const currentKey = steps[activeStep];
  const CurrentIcon = STEP_ICONS[currentKey] ?? STEP_FALLBACK_ICON;

  const handleNext = () => {
    if (isLast) {
      onClose();
      setActiveStep(0);
    } else {
      setActiveStep((s) => s + 1);
    }
  };
  const handleBack = () => setActiveStep((s) => Math.max(0, s - 1));
  const handleSkip = () => {
    onClose();
    setActiveStep(0);
  };

  return (
    <Dialog
      open={open}
      onClose={handleSkip}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : 3 } } }}
    >
      <DialogTitle sx={{ pr: 6 }}>
        <Stack direction="row" alignItems="center" gap={1.25}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CurrentIcon fontSize="small" />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t(`onboarding.steps.${currentKey}.title`)}
          </Typography>
        </Stack>
        <IconButton
          aria-label={t('help.close')}
          onClick={handleSkip}
          sx={{
            position: 'absolute',
            right: theme.spacing(1),
            top: theme.spacing(1),
            color: 'text.secondary',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, mb: 2 }}>
          {t(`onboarding.steps.${currentKey}.body`)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t('onboarding.step', { current: activeStep + 1, total: totalSteps })}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 1, p: 2 }}>
        <MobileStepper
          variant="dots"
          steps={totalSteps}
          position="static"
          activeStep={activeStep}
          nextButton={
            <Button size="small" onClick={handleNext} sx={{ fontWeight: 600 }}>
              {isLast ? t('onboarding.done') : t('onboarding.next')}
            </Button>
          }
          backButton={
            <Button
              size="small"
              onClick={handleBack}
              disabled={activeStep === 0}
              sx={{ fontWeight: 600 }}
            >
              {t('onboarding.back')}
            </Button>
          }
          sx={{ bgcolor: 'transparent', px: 0 }}
        />
        {!isLast && (
          <Button
            onClick={handleSkip}
            size="small"
            sx={{ alignSelf: 'center', color: 'text.secondary' }}
          >
            {t('onboarding.skip')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
