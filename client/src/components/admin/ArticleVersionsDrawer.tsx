import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  RestoreOutlined as RestoreIcon,
  VisibilityOutlined as PreviewIcon,
  CompareArrowsOutlined as CompareIcon,
} from '@mui/icons-material';
import ConfirmDialog from '../ConfirmDialog';
import ArticleBody from '../public/ArticleBody';
import {
  getArticleVersion,
  listArticleVersions,
  restoreArticleVersion,
} from '../../services/adminApi';
import { articleToLines, diffLines, type DiffLine } from '../../utils/articleDiff';
import type {
  AdminArticle,
  ArticleVersion,
  ArticleVersionKind,
  ArticleVersionMeta,
} from '../../content/poradna/types';

interface Props {
  open: boolean;
  slug: string;
  current: AdminArticle;
  onClose: () => void;
  onRestored: (article: AdminArticle) => void;
}

const KIND_CONFIG: Record<
  ArticleVersionKind,
  { label: string; color: 'default' | 'info' | 'success' | 'warning' }
> = {
  manual: { label: 'Uloženie', color: 'default' },
  autosave: { label: 'Autosave', color: 'info' },
  publish: { label: 'Publikované', color: 'success' },
  restore: { label: 'Obnovené', color: 'warning' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('sk-SK');
}

export default function ArticleVersionsDrawer({ open, slug, current, onClose, onRestored }: Props) {
  const theme = useTheme();
  const [versions, setVersions] = useState<ArticleVersionMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ArticleVersion | null>(null);
  const [toRestore, setToRestore] = useState<ArticleVersionMeta | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [diff, setDiff] = useState<{ versionNumber: number; lines: DiffLine[] } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listArticleVersions(slug)
      .then((v) => {
        setVersions(v);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const handlePreview = async (versionId: string) => {
    setError(null);
    try {
      setPreview(await getArticleVersion(slug, versionId));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleCompare = async (version: ArticleVersionMeta) => {
    setError(null);
    try {
      const full = await getArticleVersion(slug, version.id);
      setDiff({
        versionNumber: version.versionNumber,
        lines: diffLines(articleToLines(full.data), articleToLines(current)),
      });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleRestore = async () => {
    if (!toRestore) return;
    setRestoring(true);
    try {
      const article = await restoreArticleVersion(slug, toRestore.id);
      setToRestore(null);
      onRestored(article);
      load();
    } catch (e) {
      setError((e as Error).message);
      setToRestore(null);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: theme.spacing(56) } } }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ p: theme.spacing(2), borderBottom: `1px solid ${theme.palette.divider}` }}
      >
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          História verzií
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ m: theme.spacing(2) }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : versions.length === 0 ? (
        <Typography color="text.secondary" sx={{ p: theme.spacing(3), textAlign: 'center' }}>
          Zatiaľ žiadne verzie.
        </Typography>
      ) : (
        <List disablePadding>
          {versions.map((v) => (
            <ListItem key={v.id} divider sx={{ display: 'block', py: theme.spacing(1.5) }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                  v{v.versionNumber}
                  {v.changeSummary ? ` · ${v.changeSummary}` : ''}
                </Typography>
                <Chip
                  size="small"
                  label={KIND_CONFIG[v.kind].label}
                  color={KIND_CONFIG[v.kind].color}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                {formatDate(v.createdAt)}
                {v.createdBy ? ` · ${v.createdBy}` : ''}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button
                  size="small"
                  startIcon={<PreviewIcon />}
                  onClick={() => handlePreview(v.id)}
                >
                  Náhľad
                </Button>
                <Button size="small" startIcon={<CompareIcon />} onClick={() => handleCompare(v)}>
                  Porovnať
                </Button>
                <Button
                  size="small"
                  color="warning"
                  startIcon={<RestoreIcon />}
                  onClick={() => setToRestore(v)}
                >
                  Obnoviť
                </Button>
              </Stack>
            </ListItem>
          ))}
        </List>
      )}

      <Dialog open={Boolean(preview)} onClose={() => setPreview(null)} fullWidth maxWidth="md">
        <DialogTitle>Náhľad verzie {preview ? `v${preview.versionNumber}` : ''}</DialogTitle>
        <DialogContent dividers>
          {preview && (
            <Box>
              <Typography variant="h4" component="h1" sx={{ mb: theme.spacing(1) }}>
                {preview.data.title || '(bez titulku)'}
              </Typography>
              {preview.data.intro && (
                <Typography color="text.secondary" sx={{ mb: theme.spacing(2) }}>
                  {preview.data.intro}
                </Typography>
              )}
              <Divider sx={{ mb: theme.spacing(2) }} />
              <ArticleBody sections={preview.data.sections} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreview(null)}>Zavrieť</Button>
          {preview && (
            <Button
              color="warning"
              variant="contained"
              startIcon={<RestoreIcon />}
              onClick={() => {
                setToRestore(preview);
                setPreview(null);
              }}
            >
              Obnoviť túto verziu
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(diff)} onClose={() => setDiff(null)} fullWidth maxWidth="md">
        <DialogTitle>Porovnanie: v{diff?.versionNumber} → aktuálny stav</DialogTitle>
        <DialogContent dividers>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            <Box component="span" sx={{ color: 'success.main' }}>
              zelená = pridané
            </Box>
            {' · '}
            <Box component="span" sx={{ color: 'error.main' }}>
              červená = odstránené
            </Box>{' '}
            (oproti tejto verzii)
          </Typography>
          <Box
            sx={{
              fontFamily: 'monospace',
              fontSize: theme.typography.body2.fontSize,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {diff?.lines.map((line, i) => (
              <Box
                key={i}
                sx={{
                  px: 1,
                  py: 0.25,
                  bgcolor:
                    line.type === 'add'
                      ? 'success.light'
                      : line.type === 'remove'
                        ? 'error.light'
                        : 'transparent',
                  color: line.type === 'same' ? 'text.secondary' : 'text.primary',
                  textDecoration: line.type === 'remove' ? 'line-through' : 'none',
                }}
              >
                {line.type === 'add' ? '+ ' : line.type === 'remove' ? '− ' : '  '}
                {line.text || ' '}
              </Box>
            ))}
            {diff && diff.lines.every((l) => l.type === 'same') && (
              <Typography color="text.secondary">Žiadne rozdiely.</Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiff(null)}>Zavrieť</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(toRestore)}
        title="Obnoviť verziu?"
        message={
          toRestore
            ? `Obnoví sa stav z verzie v${toRestore.versionNumber}. Aktuálny stav zostane uložený ako samostatná verzia, takže o nič neprídeš.`
            : ''
        }
        confirmLabel="Obnoviť"
        loading={restoring}
        onConfirm={handleRestore}
        onCancel={() => setToRestore(null)}
      />
    </Drawer>
  );
}
