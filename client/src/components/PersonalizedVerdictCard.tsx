import { Box, Card, CardContent, Typography } from '@mui/material';
import type { PersonalizedNote } from '../types';

const VERDICT_COLORS: Record<string, { bg: string; color: string }> = {
  'NEBEZPEČNÉ': { bg: '#D32F2F', color: '#fff' },
  'S VÝHRADAMI': { bg: '#F57C00', color: '#fff' },
  'VHODNÉ': { bg: '#388E3C', color: '#fff' },
  'VÝBORNÉ': { bg: '#1B5E20', color: '#fff' },
};

interface PersonalizedVerdictCardProps {
  note: PersonalizedNote;
}

export default function PersonalizedVerdictCard({ note }: PersonalizedVerdictCardProps) {
  const verdictStyle = VERDICT_COLORS[note.overallVerdict] ?? VERDICT_COLORS['S VÝHRADAMI'];

  return (
    <Card sx={{ borderRadius: 4, overflow: 'hidden' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Hodnotenie pre {note.petName}
        </Typography>

        <Box
          sx={{
            display: 'inline-block',
            px: 2.5,
            py: 0.75,
            borderRadius: 2,
            backgroundColor: verdictStyle.bg,
            color: verdictStyle.color,
            fontWeight: 800,
            fontSize: '1rem',
            letterSpacing: 0.5,
            mb: 2,
          }}
        >
          {note.overallVerdict}
        </Box>

        <Typography variant="body1" sx={{ mt: 1, lineHeight: 1.7 }}>
          {note.explanation}
        </Typography>
      </CardContent>
    </Card>
  );
}
