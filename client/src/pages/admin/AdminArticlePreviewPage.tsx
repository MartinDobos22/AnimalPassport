import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Box, CircularProgress, Container, Typography } from '@mui/material';
import BlogLayout from '../../components/public/BlogLayout';
import ArticleView from '../../components/public/ArticleView';
import { getAdminArticle } from '../../services/adminApi';
import type { AdminArticle } from '../../content/poradna/types';

interface Props {
  darkMode: boolean;
  onToggleTheme: () => void;
}

/**
 * Náhľad článku „ako web" aj pre nepublikovaný koncept (admin). Otvára sa v novom
 * tabe z editora. Autorizáciu vynucuje server (`getAdminArticle` je za requireAdmin).
 */
export default function AdminArticlePreviewPage({ darkMode, onToggleTheme }: Props) {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<AdminArticle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    getAdminArticle(slug)
      .then(setArticle)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <BlogLayout darkMode={darkMode} onToggleTheme={onToggleTheme}>
      <Box
        sx={{ bgcolor: 'warning.main', color: 'warning.contrastText', py: 1, textAlign: 'center' }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Náhľad konceptu — takto bude článok vyzerať na webe (zatiaľ nie je verejný).
        </Typography>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      )}
      {article && <ArticleView article={article} preview />}
    </BlogLayout>
  );
}
