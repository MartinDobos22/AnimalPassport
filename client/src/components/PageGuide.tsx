import { useTranslation } from 'react-i18next';
import { Box, Stack, Typography, alpha, useTheme } from '@mui/material';
import { LightbulbOutlined as LightbulbOutlinedIcon } from '@mui/icons-material';
import { PAGE_GUIDE_STEP_INDEXES, type PageGuideKey } from '../content/pageGuides';

interface PageGuideProps {
  guideKey: PageGuideKey;
  showTitle?: boolean;
}

export default function PageGuide({ guideKey, showTitle = true }: PageGuideProps) {
  const { t } = useTranslation('guides');
  const theme = useTheme();

  return (
    <Box>
      {showTitle && (
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          {t(`pages.${guideKey}.title`)}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 2.5 }}>
        {t(`pages.${guideKey}.intro`)}
      </Typography>

      <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
        {t('stepsTitle')}
      </Typography>

      <Stack spacing={2}>
        {PAGE_GUIDE_STEP_INDEXES.map((index) => (
          <Stack key={index} direction="row" spacing={1.75} alignItems="flex-start">
            <Box
              aria-hidden
              sx={{
                flexShrink: 0,
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(
                  theme.palette.primary.main,
                  theme.palette.mode === 'dark' ? 0.24 : 0.12
                ),
                color: 'primary.main',
                fontWeight: 700,
                fontSize: theme.typography.pxToRem(14),
              }}
            >
              {index + 1}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {t(`pages.${guideKey}.steps.${index}.title`)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {t(`pages.${guideKey}.steps.${index}.body`)}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>

      <Stack
        direction="row"
        spacing={1.25}
        alignItems="flex-start"
        sx={{
          mt: 2.5,
          p: 1.75,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.16 : 0.07),
          border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.4 : 0.2)}`,
        }}
      >
        <LightbulbOutlinedIcon fontSize="small" color="primary" sx={{ flexShrink: 0, mt: 0.25 }} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
            {t('tipLabel')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {t(`pages.${guideKey}.tip`)}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
