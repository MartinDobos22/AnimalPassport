import { Link as RouterLink, useParams } from 'react-router-dom';
import { Box, Button, Container, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { SearchOffOutlined as SearchOffOutlinedIcon } from '@mui/icons-material';
import Seo from '../../components/Seo';
import BlogLayout from '../../components/public/BlogLayout';
import ArticleView from '../../components/public/ArticleView';
import { articleJsonLd } from '../../utils/seoSchema';
import { articleHref, PORADNA_PATH } from '../../utils/articleHref';
import { useArticleTracking } from '../../hooks/useArticleTracking';
import { getArticle } from '../../content/poradna/articles';
import type { Article } from '../../content/poradna/types';

interface Props {
  darkMode: boolean;
  onToggleTheme: () => void;
  /** SSG posiela slug priamo; v appke sa berie z useParams. */
  slug?: string;
}

export function articleSeo(article: Article) {
  // 200-URL je tvar bez koncovej lomky (dist/poradna/<slug>.html) — canonical,
  // JSON-LD aj breadcrumby musia niesť presne ju, aby Google nekrawloval redirect.
  const path = articleHref(article.slug);
  return {
    title: `${article.title} | Pawly`,
    description: article.description,
    path,
    ogImage: article.coverImage,
    ogImageAlt: article.coverAlt,
    keywords: article.tags,
    jsonLd: articleJsonLd({
      title: article.title,
      description: article.description,
      path,
      updated: article.updated,
      image: article.coverImage,
      faqs: article.faqs,
      breadcrumbs: [
        { name: 'Pawly', path: '/' },
        { name: 'Poradňa', path: PORADNA_PATH },
        { name: article.title, path },
      ],
    }),
  };
}

// Neznámy slug NESMIE presmerovať na /poradna: Googlebot renderuje JS, klientský
// <Navigate> vyhodnotí ako presmerovanie a URL skončí v Search Console ako
// „Page with redirect". Soft-404 s `noindex` je správna odpoveď — Google ju
// zaradí medzi nenájdené/neindexované, nie medzi redirecty.
function ArticleNotFound({ darkMode, onToggleTheme }: Pick<Props, 'darkMode' | 'onToggleTheme'>) {
  const theme = useTheme();

  return (
    <BlogLayout darkMode={darkMode} onToggleTheme={onToggleTheme}>
      <Seo
        title="Článok sa nenašiel | Pawly"
        description="Tento článok v poradni Pawly neexistuje alebo bol presunutý."
        noindex
      />
      <Container maxWidth="sm" sx={{ py: theme.spacing(10), textAlign: 'center' }}>
        <Box sx={{ color: 'text.secondary', mb: theme.spacing(2) }}>
          <SearchOffOutlinedIcon sx={{ fontSize: 64 }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: theme.spacing(1) }}>
          Článok sa nenašiel
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: theme.spacing(4) }}>
          Tento článok neexistuje alebo bol presunutý. Skús ho nájsť v poradni.
        </Typography>
        <Button component={RouterLink} to={PORADNA_PATH} variant="contained">
          Prejsť do poradne
        </Button>
      </Container>
    </BlogLayout>
  );
}

export default function PoradnaArticlePage({ darkMode, onToggleTheme, slug: slugProp }: Props) {
  const params = useParams();
  const slug = slugProp ?? params.slug;
  const article = slug ? getArticle(slug) : undefined;

  useArticleTracking(article?.slug);

  if (!article) return <ArticleNotFound darkMode={darkMode} onToggleTheme={onToggleTheme} />;

  return (
    <BlogLayout darkMode={darkMode} onToggleTheme={onToggleTheme}>
      <Seo {...articleSeo(article)} />
      <ArticleView article={article} />
    </BlogLayout>
  );
}
