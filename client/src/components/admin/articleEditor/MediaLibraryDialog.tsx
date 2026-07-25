import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  UploadFile as UploadIcon,
  EditOutlined as EditIcon,
  DeleteOutline as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import MediaCropDialog from './MediaCropDialog';
import { deleteMedia, listMedia, updateMedia } from '../../../services/adminApi';
import type { MediaImage } from '../../../types/media';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (media: MediaImage) => void;
}

export default function MediaLibraryDialog({ open, onClose, onSelect }: Props) {
  const theme = useTheme();
  const [items, setItems] = useState<MediaImage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<MediaImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setError(null);
    listMedia()
      .then(setItems)
      .catch((e: Error) => setError(e.message));
  };

  useEffect(() => {
    if (open && items === null) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleDelete = async (id: string) => {
    try {
      await deleteMedia(id);
      setItems((prev) => (prev ? prev.filter((m) => m.id !== id) : prev));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Knižnica obrázkov</DialogTitle>
      <DialogContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Klikni na obrázok pre výber, alebo nahraj nový.
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
          >
            Nahrať nový
          </Button>
        </Stack>
        {error && (
          <Typography variant="body2" color="error" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}
        {items === null && !error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress size={28} />
          </Box>
        ) : items && items.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            Zatiaľ žiadne obrázky. Nahraj prvý.
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: theme.spacing(1.5),
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            }}
          >
            {(items ?? []).map((m) => (
              <Box
                key={m.id}
                sx={{
                  position: 'relative',
                  borderRadius: `${theme.shape.borderRadius}px`,
                  overflow: 'hidden',
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Box
                  component="img"
                  src={m.url}
                  alt={m.alt ?? ''}
                  onClick={() => {
                    onSelect(m);
                    onClose();
                  }}
                  sx={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    objectFit: 'cover',
                    display: 'block',
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.85 },
                  }}
                />
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{ position: 'absolute', top: 2, right: 2 }}
                >
                  <Tooltip title="Upraviť popis">
                    <IconButton
                      size="small"
                      onClick={() => setEditing(m)}
                      sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.paper' } }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Zmazať z knižnice">
                    <IconButton
                      size="small"
                      onClick={() => void handleDelete(m.id)}
                      sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.paper' } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                {m.caption && (
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', px: 0.5, py: 0.25 }}>
                    {m.caption}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Zavrieť</Button>
      </DialogActions>

      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setCropFile(f);
          e.target.value = '';
        }}
      />
      <MediaCropDialog
        file={cropFile}
        open={cropFile !== null}
        onClose={() => setCropFile(null)}
        onUploaded={(media) => setItems((prev) => [media, ...(prev ?? [])])}
      />
      <MediaMetaDialog
        media={editing}
        onClose={() => setEditing(null)}
        onSaved={(updated) =>
          setItems((prev) => (prev ? prev.map((m) => (m.id === updated.id ? updated : m)) : prev))
        }
      />
    </Dialog>
  );
}

function MediaMetaDialog({
  media,
  onClose,
  onSaved,
}: {
  media: MediaImage | null;
  onClose: () => void;
  onSaved: (media: MediaImage) => void;
}) {
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAlt(media?.alt ?? '');
    setCaption(media?.caption ?? '');
    setAuthor(media?.author ?? '');
  }, [media]);

  const save = async () => {
    if (!media) return;
    setSaving(true);
    try {
      const updated = await updateMedia(media.id, { alt, caption, author });
      onSaved(updated);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={media !== null} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        Popis obrázka
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Alt text" value={alt} onChange={(e) => setAlt(e.target.value)} size="small" fullWidth />
          <TextField label="Popisok" value={caption} onChange={(e) => setCaption(e.target.value)} size="small" fullWidth />
          <TextField label="Autor / zdroj" value={author} onChange={(e) => setAuthor(e.target.value)} size="small" fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Zrušiť</Button>
        <Button variant="contained" onClick={save} disabled={saving}>
          {saving ? 'Ukladám…' : 'Uložiť'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
