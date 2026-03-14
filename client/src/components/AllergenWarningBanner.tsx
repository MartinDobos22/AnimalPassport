import { Box, Typography } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import type { AllergenWarning, HealthWarning } from '../types';

interface AllergenWarningBannerProps {
  allergenWarnings: AllergenWarning[];
  healthWarnings: HealthWarning[];
}

export default function AllergenWarningBanner({ allergenWarnings, healthWarnings }: AllergenWarningBannerProps) {
  const criticalAllergens = allergenWarnings.filter((w) => w.severity === 'critical' || w.severity === 'high');
  const otherAllergens = allergenWarnings.filter((w) => w.severity === 'moderate');
  const allAllergens = [...criticalAllergens, ...otherAllergens];

  return (
    <>
      {allAllergens.length > 0 && (
        <Box
          sx={{
            backgroundColor: '#D32F2F',
            color: '#fff',
            border: '2px solid #B71C1C',
            borderRadius: 4,
            p: 3,
            mb: 3,
            animation: 'pulse-border 2s ease-in-out infinite',
            '@keyframes pulse-border': {
              '0%, 100%': { boxShadow: '0 0 0 0 rgba(211, 47, 47, 0.4)' },
              '50%': { boxShadow: '0 0 0 8px rgba(211, 47, 47, 0)' },
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <WarningIcon sx={{ fontSize: 40 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
              NEBEZPEČENSTVO – ZISTENÉ ALERGÉNY!
            </Typography>
          </Box>

          {allAllergens.map((warning, idx) => (
            <Box key={idx} sx={{ mb: 1.5, pl: 1, borderLeft: '3px solid rgba(255,255,255,0.5)' }}>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                {warning.allergen} → {warning.ingredientName}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {warning.message}
              </Typography>
            </Box>
          ))}

          <Typography variant="body2" sx={{ mt: 2, fontWeight: 700, opacity: 0.95, borderTop: '1px solid rgba(255,255,255,0.3)', pt: 1.5 }}>
            Toto krmivo môže vážne ohroziť zdravie vášho zvieraťa!
          </Typography>
        </Box>
      )}

      {healthWarnings.length > 0 && (
        <Box
          sx={{
            backgroundColor: '#F57C00',
            color: '#fff',
            border: '2px solid #E65100',
            borderRadius: 4,
            p: 3,
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <WarningIcon sx={{ fontSize: 36 }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              ZDRAVOTNÉ VAROVANIE
            </Typography>
          </Box>

          {healthWarnings.map((warning, idx) => (
            <Box key={idx} sx={{ mb: 1.5, pl: 1, borderLeft: '3px solid rgba(255,255,255,0.5)' }}>
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
