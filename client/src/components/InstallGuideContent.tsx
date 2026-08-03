import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  InstallMobile as InstallMobileIcon,
} from '@mui/icons-material';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

type SectionKey = 'platforms' | 'usage';

const SECTION_ITEM_COUNT: Record<SectionKey, number> = {
  platforms: 3,
  usage: 9,
};

function GuideAccordion({ sectionKey }: { sectionKey: SectionKey }) {
  const { t } = useTranslation('install');
  const theme = useTheme();
  const itemCount = SECTION_ITEM_COUNT[sectionKey];

  return (
    <Stack spacing={1}>
      {Array.from({ length: itemCount }, (_, i) => ({
        q: t(`guide.${sectionKey}.items.${i}.q` as never),
        a: t(`guide.${sectionKey}.items.${i}.a` as never),
      })).map((item) => (
        <Accordion
          key={item.q}
          disableGutters
          sx={{
            borderRadius: '8px !important',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 600 }}>{item.q}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {item.a}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  );
}

export function InstallSection() {
  const { t } = useTranslation('install');
  const theme = useTheme();
  const { canInstall, promptInstall } = useInstallPrompt();
  const isDark = theme.palette.mode === 'dark';

  const handleInstall = useCallback(() => {
    void promptInstall();
  }, [promptInstall]);

  return (
    <Box>
      {canInstall && (
        <Box
          sx={{
            mb: 3,
            p: { xs: 2, md: 2.5 },
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, isDark ? 0.4 : 0.25)}`,
            bgcolor: alpha(theme.palette.primary.main, isDark ? 0.16 : 0.08),
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {t('guide.installNowTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, mb: 1.5 }}>
            {t('guide.installNowDescription')}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<InstallMobileIcon />}
            onClick={handleInstall}
            sx={{ fontWeight: 600 }}
          >
            {t('guide.installNowCta')}
          </Button>
        </Box>
      )}
      <Typography
        variant="overline"
        sx={{ color: 'text.secondary', display: 'block', mb: 1, px: 0.5 }}
      >
        {t('guide.platforms.title')}
      </Typography>
      <GuideAccordion sectionKey="platforms" />
    </Box>
  );
}

export function UsageSection() {
  const { t } = useTranslation('install');
  return (
    <Box>
      <Typography
        variant="overline"
        sx={{ color: 'text.secondary', display: 'block', mb: 1, px: 0.5 }}
      >
        {t('guide.usage.title')}
      </Typography>
      <GuideAccordion sectionKey="usage" />
    </Box>
  );
}

export default function InstallGuideContent() {
  const { t } = useTranslation('install');

  return (
    <Box>
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
        <InstallMobileIcon color="primary" />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {t('guide.title')}
        </Typography>
      </Stack>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {t('guide.subtitle')}
      </Typography>
      <Box sx={{ mb: 3 }}>
        <InstallSection />
      </Box>
      <Box>
        <UsageSection />
      </Box>
    </Box>
  );
}
