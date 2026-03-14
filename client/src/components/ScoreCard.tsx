import { Box, Card, CardContent, CircularProgress, Typography, useTheme } from '@mui/material';

interface ScoreCardProps {
  score: number;
  summary: string;
}

function getScoreColor(score: number): string {
  if (score <= 30) return '#D32F2F';
  if (score <= 60) return '#F57C00';
  if (score <= 80) return '#388E3C';
  return '#1B5E20';
}

function getScoreLabel(score: number): string {
  if (score <= 30) return 'Nevyhovujúce';
  if (score <= 60) return 'Priemerné';
  if (score <= 80) return 'Dobré';
  return 'Výborné';
}

export default function ScoreCard({ score, summary }: ScoreCardProps) {
  const theme = useTheme();
  const color = getScoreColor(score);

  return (
    <Card
      sx={{
        textAlign: 'center',
        background:
          theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${color}15 100%)`
            : `linear-gradient(135deg, #FFFFFF 0%, ${color}10 100%)`,
      }}
    >
      <CardContent sx={{ py: 4 }}>
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
          {/* Background track */}
          <CircularProgress
            variant="determinate"
            value={100}
            size={160}
            thickness={4}
            sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
          />
          {/* Score arc */}
          <CircularProgress
            variant="determinate"
            value={score}
            size={160}
            thickness={4}
            sx={{
              color,
              position: 'absolute',
              left: 0,
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
          {/* Score number in center */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h2" sx={{ fontWeight: 800, color, lineHeight: 1 }}>
              {score}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              z 100
            </Typography>
          </Box>
        </Box>

        <Typography variant="subtitle1" sx={{ fontWeight: 700, color, mb: 0.5 }}>
          {getScoreLabel(score)}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Celkové skóre kvality
        </Typography>

        <Typography variant="body1" sx={{ mt: 2, maxWidth: 500, mx: 'auto', lineHeight: 1.7 }}>
          {summary}
        </Typography>
      </CardContent>
    </Card>
  );
}
