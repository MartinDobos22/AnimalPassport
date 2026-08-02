import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Paper, Snackbar, Stack, Typography, alpha, useTheme } from '@mui/material';
import { Favorite as FavoriteIcon } from '@mui/icons-material';
import { useReviewPrompt } from '../../hooks/useReviewPrompt';
import ReviewDialog from './ReviewDialog';

interface Props {
  enabled: boolean;
}

export default function ReviewPrompt({ enabled }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { visible, snooze, hide } = useReviewPrompt(enabled);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openDialog = () => {
    // Otvorenie berieme ako vybavené — prompt sa nezobrazí znova (dokončenie
    // formulára navyše nastaví „done"). Zabráni opakovanému otravovaniu.
    snooze();
    hide();
    setDialogOpen(true);
  };

  return (
    <>
      <Snackbar
        open={visible}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 80, md: 24 } }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 2,
            borderRadius: 3,
            maxWidth: 360,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
          }}
        >
          <Stack direction="row" gap={1.25} alignItems="flex-start">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                flexShrink: 0,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FavoriteIcon fontSize="small" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {t('review.promptTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {t('review.promptBody')}
              </Typography>
              <Stack direction="row" gap={1} sx={{ mt: 1.5 }} justifyContent="flex-end">
                <Button size="small" color="inherit" onClick={snooze}>
                  {t('review.promptLater')}
                </Button>
                <Button size="small" variant="contained" onClick={openDialog}>
                  {t('review.promptCta')}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Snackbar>

      <ReviewDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
