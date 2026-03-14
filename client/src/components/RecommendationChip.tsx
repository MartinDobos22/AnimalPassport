import { Box, Card, CardContent, Chip, Typography, useTheme } from '@mui/material';
import type { Recommendation } from '../types';

interface RecommendationChipProps {
  recommendation: Recommendation;
}

export default function RecommendationChip({ recommendation }: RecommendationChipProps) {
  const theme = useTheme();

  return (
    <Card>
      <CardContent>
        {/* Vhodné pre */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            Vhodné pre:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {recommendation.suitableFor.map((item, i) => (
              <Chip
                key={i}
                label={item}
                sx={{
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(129, 199, 132, 0.15)'
                      : 'rgba(46, 125, 50, 0.08)',
                  color: theme.palette.success.main,
                  fontWeight: 500,
                  border: `1px solid ${theme.palette.success.main}30`,
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Nevhodné pre */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            Nevhodné pre:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {recommendation.notRecommendedFor.map((item, i) => (
              <Chip
                key={i}
                label={item}
                variant="outlined"
                sx={{
                  borderColor: theme.palette.error.main + '60',
                  color: theme.palette.error.main,
                  fontWeight: 500,
                }}
              />
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
