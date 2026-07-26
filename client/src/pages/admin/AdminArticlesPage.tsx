import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  CloudUpload as PublishIcon,
  Article as ArticleIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import ConfirmDialog from '../../components/ConfirmDialog';
import PageContainer from '../../components/ui/PageContainer';
import PageHeader from '../../components/ui/PageHeader';
import AdminArticleCard from '../../components/admin/AdminArticleCard';
import {
  changeArticleStatus,
  deleteAdminArticle,
  getArticlesMetrics,
  listAdminArticles,
  publishArticles,
} from '../../services/adminApi';
import {
  ARTICLE_STATUS_TRANSITIONS,
  STATUS_LABELS,
  transitionActionLabel,
} from '../../utils/articleWorkflow';
import type { AdminArticle, ArticleMetrics, ArticleStatus } from '../../content/poradna/types';

type Filter = 'all' | ArticleStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Všetky' },
  { value: 'draft', label: 'Koncepty' },
  { value: 'in_review', label: 'Na kontrolu' },
  { value: 'approved', label: 'Schválené' },
  { value: 'scheduled', label: 'Naplánované' },
  { value: 'published', label: 'Publikované' },
  { value: 'archived', label: 'Archivované' },
];

export default function AdminArticlesPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<AdminArticle | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [statusMenu, setStatusMenu] = useState<{
    anchor: HTMLElement;
    article: AdminArticle;
  } | null>(null);
  const [metrics, setMetrics] = useState<Record<string, ArticleMetrics>>({});

  const load = () => {
    setLoading(true);
    listAdminArticles()
      .then((a) => {
        setArticles(a);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
    getArticlesMetrics()
      .then((rows) => setMetrics(Object.fromEntries(rows.map((m) => [m.slug, m]))))
      .catch(() => setMetrics({}));
  };

  useEffect(load, []);

  const visible = useMemo(
    () => (filter === 'all' ? articles : articles.filter((a) => a.status === filter)),
    [articles, filter]
  );

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteAdminArticle(toDelete.slug);
      setToDelete(null);
      load();
    } catch (e) {
      setError((e as Error).message);
      setToDelete(null);
    }
  };

  const confirmPublish = async () => {
    setPublishing(true);
    try {
      await publishArticles();
      setPublishOpen(false);
      setNotice('Build spustený — zmeny budú na webe o pár minút.');
    } catch (e) {
      setPublishOpen(false);
      setError((e as Error).message);
    } finally {
      setPublishing(false);
    }
  };

  const applyStatus = async (article: AdminArticle, target: ArticleStatus) => {
    setStatusMenu(null);
    // Naplánovanie potrebuje dátum — rieši sa v editore.
    if (target === 'scheduled') {
      navigate(`/admin/clanky/${article.slug}`);
      return;
    }
    try {
      const { buildTriggered } = await changeArticleStatus(article.slug, target);
      setNotice(
        buildTriggered
          ? `„${article.title}" → ${STATUS_LABELS[target]}. Spustil sa build webu.`
          : `„${article.title}" → ${STATUS_LABELS[target]}.`
      );
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        icon={<ArticleIcon />}
        title="Správa článkov"
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              variant="outlined"
              startIcon={<PeopleIcon />}
              onClick={() => navigate('/admin/pouzivatelia')}
            >
              Používatelia
            </Button>
            <Button
              variant="outlined"
              startIcon={<PublishIcon />}
              onClick={() => setPublishOpen(true)}
            >
              Publikovať na web
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/admin/clanky/novy')}
            >
              Nový článok
            </Button>
          </Stack>
        }
      />

      <Alert severity="info" variant="outlined" sx={{ mb: theme.spacing(2) }}>
        Zmeny sa uložia do databázy a sú hneď cez API. Na verejnom webe sa prejavia až po novom
        builde (prerender) — spusti rebuild (Netlify).
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: theme.spacing(2) }}>
          {error}
        </Alert>
      )}

      <ToggleButtonGroup
        value={filter}
        exclusive
        size="small"
        onChange={(_, v) => v && setFilter(v as Filter)}
        sx={{ mb: theme.spacing(2.5), flexWrap: 'wrap' }}
      >
        {FILTERS.map((f) => {
          const count =
            f.value === 'all'
              ? articles.length
              : articles.filter((a) => a.status === f.value).length;
          return (
            <ToggleButton key={f.value} value={f.value} sx={{ borderRadius: 2 }}>
              {f.label} ({count})
            </ToggleButton>
          );
        })}
      </ToggleButtonGroup>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : visible.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
          Žiadne články v tomto filtri.
        </Typography>
      ) : (
        <Stack spacing={theme.spacing(1.5)}>
          {visible.map((a) => (
            <AdminArticleCard
              key={a.slug}
              article={a}
              metrics={metrics[a.slug]}
              onEdit={() => navigate(`/admin/clanky/${a.slug}`)}
              onDelete={() => setToDelete(a)}
              onStatusMenu={(anchor) => setStatusMenu({ anchor, article: a })}
            />
          ))}
        </Stack>
      )}

      <Menu
        anchorEl={statusMenu?.anchor ?? null}
        open={Boolean(statusMenu)}
        onClose={() => setStatusMenu(null)}
      >
        {statusMenu &&
          ARTICLE_STATUS_TRANSITIONS[statusMenu.article.status].map((target) => (
            <MenuItem key={target} onClick={() => applyStatus(statusMenu.article, target)}>
              {transitionActionLabel(statusMenu.article.status, target)}
            </MenuItem>
          ))}
        {statusMenu && ARTICLE_STATUS_TRANSITIONS[statusMenu.article.status].length === 0 && (
          <MenuItem disabled>Žiadne akcie</MenuItem>
        )}
      </Menu>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Zmazať článok?"
        message={`Naozaj zmazať „${toDelete?.title}"? Túto akciu nemožno vrátiť.`}
        confirmLabel="Zmazať"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />

      <ConfirmDialog
        open={publishOpen}
        title="Publikovať na web?"
        message="Spustí sa nový build webu. Aktuálny stav článkov z databázy sa premietne na verejné stránky o pár minút."
        confirmLabel="Publikovať"
        loading={publishing}
        onConfirm={confirmPublish}
        onCancel={() => setPublishOpen(false)}
      />

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={6000}
        onClose={() => setNotice(null)}
        message={notice ?? ''}
      />
    </PageContainer>
  );
}
