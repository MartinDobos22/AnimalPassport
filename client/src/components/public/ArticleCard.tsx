import { Link as RouterLink } from 'react-router-dom';
import { Box, Card, CardActionArea, Chip, Stack, Typography, useTheme } from '@mui/material';
import { Schedule as ScheduleIcon } from '@mui/icons-material';
import { articleReadingMinutes } from '../../utils/readingTime';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../content/poradna/articles';
import type { Article } from '../../content/poradna/types';

interface Props {
  article: Article;
}

export default function ArticleCard({ article }: Props) {
  const theme = useTheme();
  const color = CATEGORY_COLORS[article.category];
  const readingMinutes = articleReadingMinutes(article);

  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea
        component={RouterLink}
        to={`/poradna/${article.slug}`}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <Box
          sx={{
            position: 'relative',
            aspectRatio: '16 / 9',
            bgcolor: theme.palette[color].main,
            backgroundImage: article.coverImage ? `url(${article.coverImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <Chip
            label={CATEGORY_LABELS[article.category]}
            color={color}
            size="small"
            sx={{ position: 'absolute', top: theme.spacing(1.5), left: theme.spacing(1.5) }}
          />
        </Box>
        <Box sx={{ p: theme.spacing(2.5), display: 'flex', flexDirection: 'column', flex: 1 }}>
          <Typography variant="h6" component="h3" sx={{ mb: theme.spacing(1) }}>
            {article.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: theme.spacing(2), flex: 1 }}>
            {article.teaser?.trim() || article.description}
          </Typography>
          <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
            <ScheduleIcon sx={{ fontSize: theme.typography.body2.fontSize }} />
            <Typography variant="caption" color="text.secondary">
              {readingMinutes} min čítania
            </Typography>
          </Stack>
        </Box>
      </CardActionArea>
    </Card>
  );
}
