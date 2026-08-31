import { useMemo, useState } from 'react';
import { Box, Button, Chip, Stack, Typography, alpha, useTheme } from '@mui/material';
import {
  ArrowForward as ArrowIcon,
  LocalHospital as VetCardIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { track } from '../../utils/analytics';
import { landingCardSx } from './landingCardSx';

interface VetCardPet {
  id: string;
  name: string;
  meta: string;
  microchip: string;
  breed: string;
  vaccinations: string[];
  allergies: string[];
  conditions: string[];
}

export default function VetCardDemo() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation('landing');

  const pets = t('vetCard.pets', { returnObjects: true }) as VetCardPet[];
  const [activeId, setActiveId] = useState(pets[0]?.id ?? '');
  const active = useMemo(() => pets.find((p) => p.id === activeId) ?? pets[0], [pets, activeId]);

  const handleSelect = (id: string) => {
    if (id === activeId) return;
    track('demo_vet_card_pet', { pet: id });
    setActiveId(id);
  };

  if (!active) return null;

  const sectionLabel = (key: 'identity' | 'vaccinations' | 'allergies' | 'conditions') => (
    <Typography
      variant="caption"
      sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.08em', display: 'block' }}
    >
      {t(`vetCard.sections.${key}`)}
    </Typography>
  );

  const chipRow = (values: string[]) =>
    values.length > 0 ? (
      <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mt: 0.75 }}>
        {values.map((value) => (
          <Chip
            key={value}
            label={value}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 500, height: 26, '& .MuiChip-label': { px: 1.25 } }}
          />
        ))}
      </Stack>
    ) : (
      <Typography variant="body2" sx={{ color: 'text.disabled', mt: 0.5 }}>
        {t('vetCard.none')}
      </Typography>
    );

  return (
    <Box sx={{ py: { xs: 8, md: 14 } }}>
      <Box sx={{ maxWidth: 860, mx: 'auto', px: { xs: 2.5, md: 4 } }}>
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
              <VetCardIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography
              variant="caption"
              sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.12em' }}
            >
              {t('vetCard.badge')}
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
            {t('vetCard.title')}
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: 'text.secondary', maxWidth: 560, fontSize: { xs: '1rem', md: '1.1rem' } }}
          >
            {t('vetCard.subtitle')}
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
            borderRadius: 4,
            p: { xs: 2.5, md: 4 },
            ...landingCardSx(theme),
          }}
        >
          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            gap={1.5}
            sx={{ pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h3" sx={{ fontSize: '1.3rem', fontWeight: 700 }}>
                {active.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', textTransform: 'none', letterSpacing: 0 }}
              >
                {active.meta}
              </Typography>
            </Box>
            <Chip
              icon={<PdfIcon sx={{ fontSize: 15 }} />}
              label={t('vetCard.printTag')}
              size="small"
              sx={{
                flexShrink: 0,
                height: 26,
                fontWeight: 700,
                fontSize: '0.68rem',
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: 'primary.main',
                '& .MuiChip-label': { px: 1 },
              }}
            />
          </Stack>

          <Box
            sx={{
              mt: 2,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: { xs: 2, sm: 3 },
            }}
          >
            <Box>
              {sectionLabel('identity')}
              <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                <Typography variant="body2">
                  <Box component="span" sx={{ color: 'text.secondary' }}>
                    {t('vetCard.microchip')}:{' '}
                  </Box>
                  {active.microchip}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ color: 'text.secondary' }}>
                    {t('vetCard.breed')}:{' '}
                  </Box>
                  {active.breed}
                </Typography>
              </Stack>
            </Box>

            <Box>
              {sectionLabel('vaccinations')}
              <Stack component="ul" sx={{ pl: 2.25, m: 0, mt: 0.5 }} spacing={0.25}>
                {active.vaccinations.map((vaccination) => (
                  <Typography key={vaccination} component="li" variant="body2">
                    {vaccination}
                  </Typography>
                ))}
              </Stack>
            </Box>

            <Box>
              {sectionLabel('allergies')}
              {chipRow(active.allergies)}
            </Box>

            <Box>
              {sectionLabel('conditions')}
              {chipRow(active.conditions)}
            </Box>
          </Box>
        </Box>

        <Stack alignItems="center" sx={{ mt: 3.5 }}>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowIcon />}
            onClick={() => {
              track('cta_register', { location: 'vet_card_demo' });
              navigate('/register');
            }}
            sx={{ fontSize: '1rem', px: 4 }}
          >
            {t('vetCard.cta')}
          </Button>
          <Typography variant="caption" sx={{ color: 'text.disabled', mt: 1.25 }}>
            {t('vetCard.ctaNote')}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
