import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Breadcrumbs,
  Chip,
  Container,
  Divider,
  Link,
  Stack,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Schedule as ScheduleIcon,
  VerifiedOutlined as VerifiedIcon,
} from '@mui/icons-material';
import ArticleBody from './ArticleBody';
import AdUnit from '../AdUnit';
import Callout from './Callout';
import RichText from './RichText';
import LandingFaq from './LandingFaq';
import LandingCta from './LandingCta';
import ArticleCard from './ArticleCard';
import { articleReadingMinutes } from '../../utils/readingTime';
import { trackArticleEvent } from '../../services/analyticsApi';
import {
  ARTICLE_DISCLAIMER,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  SUPPORT_EMAIL,
  getArticle,
} from '../../content/poradna/articles';
import type { Article } from '../../content/poradna/types';

interface Props {
  article: Article;
  /** V preview (admin náhľad konceptu) sa nemerajú eventy. */
  preview?: boolean;
}

function formatUpdated(iso: string): string {
  return new Date(iso).toLocaleDateString('sk-SK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ArticleView({ article, preview = false }: Props) {
  const theme = useTheme();
  const track = (type: Parameters<typeof trackArticleEvent>[1], meta?: Record<string, unknown>) => {
    if (!preview) trackArticleEvent(article.slug, type, meta);
  };

  const related = (article.relatedSlugs ?? [])
    .map((s) => getArticle(s))
    .filter((a): a is Article => Boolean(a));

  const ctaLabel = article.ctaIntent === 'food' ? 'Analyzovať krmivo' : 'Vytvoriť zdravotný pas';
  const color = CATEGORY_COLORS[article.category];
  const readingMinutes = articleReadingMinutes(article);
  const author = article.author ?? 'Tím Pawly';

  return (
    <>
      <Box component="header" sx={{ bgcolor: theme.palette.background.default }}>
        <Container maxWidth="md" sx={{ pt: { xs: 3, md: 5 } }}>
          <Breadcrumbs sx={{ mb: theme.spacing(3) }}>
            <Link component={RouterLink} to="/" underline="hover" color="inherit" variant="body2">
              Pawly
            </Link>
            <Link
              component={RouterLink}
              to="/poradna/"
              underline="hover"
              color="inherit"
              variant="body2"
            >
              Poradňa
            </Link>
            <Typography variant="body2" color="text.secondary">
              {article.title}
            </Typography>
          </Breadcrumbs>

          <Box sx={{ mb: theme.spacing(3) }}>
            <Link
              component={RouterLink}
              to="/poradna/"
              underline="hover"
              variant="body2"
              sx={{ display: 'inline-flex', alignItems: 'center', gap: theme.spacing(0.5) }}
            >
              <ArrowBackIcon sx={{ fontSize: theme.typography.body2.fontSize }} />
              Späť na Poradňu
            </Link>
          </Box>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
            sx={{ mb: theme.spacing(2) }}
          >
            <Chip label={CATEGORY_LABELS[article.category]} color={color} size="small" />
            <Stack direction="row" spacing={0.5} alignItems="center">
              <ScheduleIcon sx={{ fontSize: theme.typography.body2.fontSize }} color="action" />
              <Typography variant="body2" color="text.secondary">
                {author} · Aktualizované {formatUpdated(article.updated)} · {readingMinutes} min
                čítania
              </Typography>
            </Stack>
          </Stack>

          <Typography
            variant="h3"
            component="h1"
            color="text.primary"
            sx={{ fontWeight: 700, mb: theme.spacing(2) }}
          >
            {article.title}
          </Typography>

          {article.medicalReviewedAt && (
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
              sx={{ mb: theme.spacing(1) }}
            >
              <VerifiedIcon sx={{ fontSize: theme.typography.body2.fontSize }} color="success" />
              <Typography variant="body2" color="text.secondary">
                Odborne skontrolované {formatUpdated(article.medicalReviewedAt)}
                {article.reviewerTitle ? ` · ${article.reviewerTitle}` : ''}
              </Typography>
            </Stack>
          )}
        </Container>

        {article.coverImage && (
          <Container maxWidth="md" sx={{ mt: { xs: 2, md: 3 } }}>
            <Box component="figure" sx={{ m: 0 }}>
              <Box
                component="img"
                src={article.coverImage}
                alt={article.coverAlt ?? article.title}
                sx={{
                  display: 'block',
                  width: '100%',
                  aspectRatio: '16 / 9',
                  objectFit: 'cover',
                  borderRadius: `${theme.shape.borderRadius}px`,
                  bgcolor: alpha(theme.palette[color].main, 0.12),
                }}
              />
              {(article.coverAlt || article.coverCredit) && (
                <Stack
                  component="figcaption"
                  direction="row"
                  spacing={1}
                  justifyContent="space-between"
                  flexWrap="wrap"
                  useFlexGap
                  sx={{ mt: theme.spacing(1) }}
                >
                  {article.coverAlt && (
                    <Typography variant="caption" color="text.secondary">
                      {article.coverAlt}
                    </Typography>
                  )}
                  {article.coverCredit && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                      Zdroj: {article.coverCredit}
                    </Typography>
                  )}
                </Stack>
              )}
            </Box>
          </Container>
        )}
      </Box>

      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        {article.intro?.trim() && (
          <Typography
            variant="h6"
            component="p"
            color="text.primary"
            sx={{ fontWeight: 400, lineHeight: 1.6, mb: theme.spacing(4) }}
          >
            <RichText text={article.intro} />
          </Typography>
        )}

        <Divider sx={{ mb: theme.spacing(4) }} />

        <Box component="article">
          <ArticleBody sections={article.sections} />

          <Callout
            variant="info"
            title="Upozornenie"
            text={article.disclaimer?.trim() || ARTICLE_DISCLAIMER}
          />

          {article.sources && article.sources.length > 0 && (
            <Box component="section" sx={{ mt: theme.spacing(4) }}>
              <Typography variant="h6" component="h2" sx={{ mb: theme.spacing(1.5) }}>
                Zdroje
              </Typography>
              <Typography
                component="ul"
                variant="body2"
                color="text.secondary"
                sx={{ m: 0, pl: theme.spacing(3), lineHeight: 1.8 }}
              >
                {article.sources.map((src) => (
                  <li key={src.url}>
                    <Link
                      href={src.url}
                      target="_blank"
                      rel="noopener nofollow"
                      underline="hover"
                      onClick={() => track('source_click', { url: src.url })}
                    >
                      {src.label}
                    </Link>
                  </li>
                ))}
              </Typography>
            </Box>
          )}

          <Box
            sx={{
              mt: theme.spacing(4),
              p: theme.spacing(2),
              borderRadius: `${theme.shape.borderRadius}px`,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Našli ste v článku chybu alebo nepresnosť? Napíšte nám na{' '}
              <Link
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                  `Chyba v článku: ${article.title}`
                )}`}
                underline="hover"
              >
                {SUPPORT_EMAIL}
              </Link>{' '}
              a opravíme to.
            </Typography>
          </Box>
        </Box>

        {article.tags && article.tags.length > 0 && (
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: theme.spacing(3) }}
          >
            {article.tags.map((tag) => (
              <Chip key={tag} label={`#${tag}`} size="small" variant="outlined" />
            ))}
          </Stack>
        )}

        {!preview && <AdUnit />}

        <Box onClick={() => track('cta_click', { ctaIntent: article.ctaIntent })}>
          <LandingCta
            heading="Začni sa o psa starať s Pawly"
            buttonLabel={ctaLabel}
            to="/register"
            intent={article.ctaIntent}
          />
        </Box>

        {article.faqs && article.faqs.length > 0 && (
          <LandingFaq title="Časté otázky" faqs={article.faqs} />
        )}

        {related.length > 0 && (
          <Box component="section" sx={{ mt: theme.spacing(5) }}>
            <Typography variant="h5" component="h2" sx={{ mb: theme.spacing(2) }}>
              Súvisiace články
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: theme.spacing(3),
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              }}
            >
              {related.map((a) => (
                <Box key={a.slug} onClick={() => track('related_click', { to: a.slug })}>
                  <ArticleCard article={a} />
                </Box>
              ))}
            </Box>
          </Box>
        )}

        <Box sx={{ mt: theme.spacing(5) }}>
          <Link
            component={RouterLink}
            to="/poradna/"
            underline="hover"
            variant="body2"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: theme.spacing(0.5) }}
          >
            <ArrowBackIcon sx={{ fontSize: theme.typography.body2.fontSize }} />
            Späť na Poradňu
          </Link>
        </Box>
      </Container>
    </>
  );
}
