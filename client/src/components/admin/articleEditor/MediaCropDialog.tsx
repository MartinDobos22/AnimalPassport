import { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Slider,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { cropImage } from '../../../utils/cropImage';
import { uploadArticleImage } from '../../../services/adminApi';
import type { MediaImage } from '../../../types/media';

interface Props {
  file: File | null;
  open: boolean;
  onClose: () => void;
  onUploaded: (media: MediaImage) => void;
}

const ASPECTS: { label: string; value: number | undefined }[] = [
  { label: 'Voľne', value: undefined },
  { label: '16:9', value: 16 / 9 },
  { label: '4:3', value: 4 / 3 },
  { label: '1:1', value: 1 },
];

export default function MediaCropDialog({ file, open, onClose, onUploaded }: Props) {
  const theme = useTheme();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(16 / 9);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setImageSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAreaPixels(null);
    setAlt('');
    setCaption('');
    setAuthor('');
    setError(null);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onCropComplete = useCallback((_area: Area, areaPx: Area) => {
    setAreaPixels(areaPx);
  }, []);

  const handleUpload = async () => {
    if (!imageSrc || !areaPixels) return;
    setUploading(true);
    setError(null);
    try {
      const cropped = await cropImage(imageSrc, areaPixels);
      const base64Data = cropped.dataUrl.split(',')[1] ?? '';
      const { media } = await uploadArticleImage({
        mimeType: cropped.mimeType,
        base64Data,
        alt: alt.trim() || undefined,
        caption: caption.trim() || undefined,
        author: author.trim() || undefined,
        width: cropped.width,
        height: cropped.height,
      });
      onUploaded(media);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Orezať a nahrať obrázok</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: theme.spacing(45),
            bgcolor: 'common.black',
            borderRadius: `${theme.shape.borderRadius}px`,
            overflow: 'hidden',
          }}
        >
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </Box>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems="center"
          sx={{ mt: theme.spacing(2) }}
        >
          <TextField
            select
            label="Pomer strán"
            value={aspect ?? 'free'}
            onChange={(e) =>
              setAspect(e.target.value === 'free' ? undefined : Number(e.target.value))
            }
            size="small"
            sx={{ minWidth: theme.spacing(14) }}
          >
            {ASPECTS.map((a) => (
              <MenuItem key={a.label} value={a.value ?? 'free'}>
                {a.label}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ flexGrow: 1, width: '100%' }}>
            <Typography variant="caption" color="text.secondary">
              Priblíženie
            </Typography>
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.01}
              onChange={(_, v) => setZoom(v as number)}
            />
          </Box>
        </Stack>
        <Stack spacing={theme.spacing(1.5)} sx={{ mt: theme.spacing(1) }}>
          <TextField
            label="Alt text (SEO / prístupnosť)"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="Popisok"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="Autor / zdroj"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            size="small"
            fullWidth
          />
        </Stack>
        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={uploading}>
          Zrušiť
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={uploading || !areaPixels}
        >
          {uploading ? 'Nahrávam…' : 'Nahrať'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
