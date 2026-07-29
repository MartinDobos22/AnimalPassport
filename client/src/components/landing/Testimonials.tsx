import { Box, Card, CardContent, Rating, Stack, Typography, useTheme } from '@mui/material';
import { FormatQuote as FormatQuoteIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useApprovedReviews } from '../../hooks/useApprovedReviews';

export default function Testimonials() {
  const theme = useTheme();
  const { t, i18n } = useTranslation('landing');
  const { reviews, loading } = useApprovedReviews(i18n.language === 'en' ? 'en' : 'sk');

  // Sekcia sa zobrazí len keď máme aspoň jednu schválenú recenziu s textom.
  const withText = reviews.filter((r) => r.body && r.body.trim().length > 0);
  if (loading || withText.length === 0) return null;

  return (
    <Box sx={{ py: { xs: 6, md: 9 } }}>
      <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2.5, md: 4 } }}>
        <Stack alignItems="center" sx={{ textAlign: 'center', mb: { xs: 4, md: 5 } }}>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            {t('testimonials.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 560 }}>
            {t('testimonials.subtitle')}
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: { xs: 2, md: 3 },
          }}
        >
          {withText.map((review) => {
            const name = review.authorName?.trim() || t('testimonials.anonymous');
            const meta = review.petName?.trim() ? `${name} & ${review.petName.trim()}` : name;
            return (
              <Card key={review.id} sx={{ height: '100%', borderRadius: 3 }}>
                <CardContent
                  sx={{ p: { xs: 2.5, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  <FormatQuoteIcon
                    sx={{ color: theme.palette.primary.main, opacity: 0.5, fontSize: 32 }}
                  />
                  <Typography
                    variant="body1"
                    sx={{ mt: 1, mb: 2, lineHeight: 1.65, flex: 1, whiteSpace: 'pre-line' }}
                  >
                    {review.body}
                  </Typography>
                  <Rating value={review.rating} readOnly size="small" sx={{ mb: 0.75 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {meta}
                  </Typography>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
