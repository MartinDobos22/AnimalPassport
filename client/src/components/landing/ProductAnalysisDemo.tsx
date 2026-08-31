import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  ArrowForward as ArrowIcon,
  AutoAwesome as SparkIcon,
  CheckCircle as ProIcon,
  Pets as PetsIcon,
  RemoveCircleOutline as ConIcon,
  WarningAmber as AllergenIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { scoreColor } from '../../utils/scoreColor';
import { track } from '../../utils/analytics';
import { landingCardSx } from './landingCardSx';

type Quality = 'excellent' | 'good' | 'average' | 'poor';

interface DemoIngredient {
  name: string;
  quality: Quality;
}

interface DemoAllergen {
  message: string;
}

interface DemoSample {
  id: string;
  name: string;
  tagline: string;
  score: number;
  summary: string;
  ingredients: DemoIngredient[];
  allergen?: DemoAllergen;
  pros: string[];
  cons: string[];
}

export default function ProductAnalysisDemo() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation('landing');
  const { t: tAnalyze } = useTranslation('analyze');

  const samples = t('productDemo.samples', { returnObjects: true }) as DemoSample[];
  const [activeId, setActiveId] = useState(samples[0]?.id ?? '');
  const [analyzing, setAnalyzing] = useState(false);

  const active = useMemo(
    () => samples.find((s) => s.id === activeId) ?? samples[0],
    [samples, activeId]
  );

  const handleSelect = (id: string) => {
    if (id === activeId || analyzing) return;
    track('demo_sample', { sample: id });
    setAnalyzing(true);
    setActiveId(id);
    window.setTimeout(() => setAnalyzing(false), 420);
  };

  const qualityColor = (quality: Quality): string => {
    if (quality === 'excellent') return theme.palette.success.dark;
    if (quality === 'good') return theme.palette.success.main;
    if (quality === 'average') return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const scoreLabel = (s: number): string => {
    if (s <= 30) return tAnalyze('score.poor');
    if (s <= 60) return tAnalyze('score.average');
    if (s <= 80) return tAnalyze('score.good');
    return tAnalyze('score.excellent');
  };

  if (!active) return null;

  const tone = scoreColor(active.score, theme);

  return (
    <Box sx={{ py: { xs: 8, md: 14 } }}>
      <Box sx={{ maxWidth: 940, mx: 'auto', px: { xs: 2.5, md: 4 } }}>
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
              <SparkIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography
              variant="caption"
              sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.12em' }}
            >
              {t('productDemo.badge')}
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
            {t('productDemo.title')}
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: 'text.secondary', maxWidth: 620, fontSize: { xs: '1rem', md: '1.1rem' } }}
          >
            {t('productDemo.subtitle')}
          </Typography>
        </Stack>

        <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="center" sx={{ mb: 2.5 }}>
          {samples.map((sample) => {
            const selected = sample.id === active.id;
            return (
              <Chip
                key={sample.id}
                label={sample.name}
                clickable
                onClick={() => handleSelect(sample.id)}
                color={selected ? 'primary' : 'default'}
                variant={selected ? 'filled' : 'outlined'}
                sx={{ fontWeight: 600, height: 34, '& .MuiChip-label': { px: 1.75 } }}
              />
            );
          })}
        </Stack>

        <Box
          sx={{
            p: { xs: 2.5, md: 4 },
            borderRadius: 4,
            ...landingCardSx(theme),
            transition: 'opacity 200ms ease',
            opacity: analyzing ? 0.55 : 1,
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 2, sm: 3 }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0, mx: 'auto' }}>
              <CircularProgress
                variant="determinate"
                value={100}
                size={104}
                thickness={4}
                sx={{
                  color:
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.common.white, 0.08)
                      : alpha(theme.palette.common.black, 0.06),
                }}
              />
              <CircularProgress
                variant="determinate"
                value={analyzing ? 0 : active.score}
                size={104}
                thickness={4}
                sx={{
                  color: tone,
                  position: 'absolute',
                  left: 0,
                  transition: 'all 600ms ease',
                  '& .MuiCircularProgress-circle': { strokeLinecap: 'round' },
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {analyzing ? (
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {t('productDemo.analyzingLabel')}
                  </Typography>
                ) : (
                  <>
                    <Typography variant="h3" sx={{ fontWeight: 800, color: tone, lineHeight: 1 }}>
                      {active.score}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {tAnalyze('score.outOf')}
                    </Typography>
                  </>
                )}
              </Box>
            </Box>

            <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                <Typography variant="h3" sx={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  {active.name}
                </Typography>
                <Chip
                  size="small"
                  label={scoreLabel(active.score)}
                  sx={{
                    bgcolor: alpha(tone, 0.16),
                    color: tone,
                    fontWeight: 700,
                    height: 24,
                    fontSize: '0.7rem',
                    '& .MuiChip-label': { px: 1 },
                  }}
                />
              </Stack>
              <Typography
                variant="caption"
                sx={{ color: 'text.disabled', textTransform: 'none', letterSpacing: 0 }}
              >
                {active.tagline}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                {active.summary}
              </Typography>
              <Chip
                size="small"
                icon={<PetsIcon sx={{ fontSize: 15 }} />}
                label={`${t('productDemo.profileLabel')} · ${t('productDemo.profileName')}`}
                variant="outlined"
                sx={{
                  alignSelf: 'flex-start',
                  mt: 0.25,
                  height: 28,
                  fontSize: '0.7rem',
                  '& .MuiChip-label': { px: 1.25 },
                }}
              />
            </Stack>
          </Stack>

          {active.allergen && (
            <Box
              sx={{
                mt: 2.5,
                p: 2,
                borderRadius: 2,
                display: 'flex',
                gap: 1.25,
                alignItems: 'flex-start',
                bgcolor: alpha(
                  theme.palette.error.main,
                  theme.palette.mode === 'light' ? 0.08 : 0.16
                ),
                border: `1px solid ${alpha(theme.palette.error.main, 0.35)}`,
              }}
            >
              <AllergenIcon sx={{ color: 'error.main', fontSize: 22, flexShrink: 0, mt: 0.25 }} />
              <Box>
                <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700 }}>
                  {t('productDemo.allergenLabel')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.5 }}>
                  {active.allergen.message}
                </Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ mt: 2.5 }}>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mb: 1, fontWeight: 600 }}
            >
              {t('productDemo.ingredientsLabel')}
            </Typography>
            <Stack direction="row" gap={0.75} flexWrap="wrap">
              {active.ingredients.map((ingredient) => {
                const color = qualityColor(ingredient.quality);
                return (
                  <Chip
                    key={ingredient.name}
                    label={ingredient.name}
                    size="small"
                    variant="outlined"
                    icon={
                      <Box
                        component="span"
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: color,
                          ml: 1,
                        }}
                      />
                    }
                    sx={{
                      fontWeight: 500,
                      borderColor: alpha(color, 0.4),
                      height: 30,
                      '& .MuiChip-label': { px: 1.25 },
                    }}
                  />
                );
              })}
            </Stack>
          </Box>

          <Box
            sx={{
              mt: 2.5,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: { xs: 1.5, sm: 3 },
            }}
          >
            <Stack spacing={0.75}>
              <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700 }}>
                {t('productDemo.prosLabel')}
              </Typography>
              {active.pros.map((pro) => (
                <Stack key={pro} direction="row" gap={1} alignItems="flex-start">
                  <ProIcon sx={{ fontSize: 18, color: 'success.main', flexShrink: 0, mt: 0.2 }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {pro}
                  </Typography>
                </Stack>
              ))}
            </Stack>
            <Stack spacing={0.75}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                {t('productDemo.consLabel')}
              </Typography>
              {active.cons.map((con) => (
                <Stack key={con} direction="row" gap={1} alignItems="flex-start">
                  <ConIcon sx={{ fontSize: 18, color: 'text.disabled', flexShrink: 0, mt: 0.2 }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {con}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Box>

        <Stack alignItems="center" sx={{ mt: 3.5 }}>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowIcon />}
            onClick={() => {
              track('cta_register', { location: 'product_demo' });
              navigate('/register');
            }}
            sx={{ fontSize: '1rem', px: 4 }}
          >
            {t('productDemo.cta')}
          </Button>
          <Typography variant="caption" sx={{ color: 'text.disabled', mt: 1.25 }}>
            {t('productDemo.ctaNote')}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
