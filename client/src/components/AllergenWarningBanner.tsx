import { Box, Typography, alpha, useTheme } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import HelpHint from './HelpHint';
import type { AllergenWarning, HealthWarning } from '../types';

interface AllergenWarningBannerProps {
  allergenWarnings: AllergenWarning[];
  healthWarnings: HealthWarning[];
}

export default function AllergenWarningBanner({
  allergenWarnings,
  healthWarnings,
}: AllergenWarningBannerProps) {
  const { t } = useTranslation('analyze');
  const theme = useTheme();
  const criticalAllergens = allergenWarnings.filter(
    (w) => w.severity === 'critical' || w.severity === 'high'
  );
  const otherAllergens = allergenWarnings.filter((w) => w.severity === 'moderate');
  const allAllergens = [...criticalAllergens, ...otherAllergens];

  return (
    <>
      {allAllergens.length > 0 && (
        <Box
          sx={{
            backgroundColor: 'error.main',
            color: 'error.contrastText',
            border: `2px solid ${theme.palette.error.dark}`,
            borderRadius: 4,
            p: 3,
            mb: 3,
            animation: 'pulse-border 2s ease-in-out infinite',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            '@keyframes pulse-border': {
              '0%, 100%': { boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0.4)}` },
              '50%': { boxShadow: `0 0 0 8px ${alpha(theme.palette.error.main, 0)}` },
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <WarningIcon sx={{ fontSize: 40 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
              {t('allergenWarning.dangerTitle')}
            </Typography>
            <HelpHint text={t('hints.allergenWarning')} color="inherit" />
          </Box>

          {allAllergens.map((warning, idx) => (
            <Box
              key={idx}
              sx={{
                mb: 1.5,
                pl: 1,
                borderLeft: `3px solid ${alpha(theme.palette.common.white, 0.5)}`,
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                {warning.allergen} → {warning.ingredientName}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {warning.message}
              </Typography>
            </Box>
          ))}

          <Typography
            variant="body2"
            sx={{
              mt: 2,
              fontWeight: 700,
              opacity: 0.95,
              borderTop: `1px solid ${alpha(theme.palette.common.white, 0.3)}`,
              pt: 1.5,
            }}
          >
            {t('allergenWarning.petAtRisk')}
          </Typography>
        </Box>
      )}

      {healthWarnings.length > 0 && (
        <Box
          sx={{
            backgroundColor: 'warning.main',
            color: 'warning.contrastText',
            border: `2px solid ${theme.palette.warning.dark}`,
            borderRadius: 4,
            p: 3,
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <WarningIcon sx={{ fontSize: 36 }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {t('allergenWarning.healthWarningTitle')}
            </Typography>
          </Box>

          {healthWarnings.map((warning, idx) => (
            <Box
              key={idx}
              sx={{
                mb: 1.5,
                pl: 1,
                borderLeft: `3px solid ${alpha(theme.palette.common.white, 0.5)}`,
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                {warning.condition}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {warning.message}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </>
  );
}
