import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Cropper, { type Area } from 'react-easy-crop';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from '@mui/icons-material';
import { cropImage } from '../utils/cropImage';

interface Props {
  file: File | null;
  open: boolean;
  uploading?: boolean;
  /** Crop aspect ratio (width / height). Defaults to 1 (square avatar). */
  aspect?: number;
  /** Crop overlay shape. 'round' for circular avatars, 'rect' for banners. */
  cropShape?: 'rect' | 'round';
  onCancel: () => void;
  onConfirm: (dataUrl: string, mimeType: string) => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const OUTPUT_MAX_WIDTH = 1280;

export default function PetPhotoCropDialog({
  file,
  open,
  uploading = false,
  aspect = 1,
  cropShape = 'round',
  onCancel,
  onConfirm,
}: Props) {
  const { t } = useTranslation('healthPassport');
  const theme = useTheme();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!file) {
      setImageSrc(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setImageSrc(objectUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(MIN_ZOOM);
    setAreaPixels(null);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const onCropComplete = useCallback((_area: Area, areaPx: Area) => {
    setAreaPixels(areaPx);
  }, []);

  const busy = uploading || processing;

  const handleConfirm = async () => {
    if (!imageSrc || !areaPixels) return;
    setProcessing(true);
    try {
      const cropped = await cropImage(imageSrc, areaPixels, {
        maxWidth: OUTPUT_MAX_WIDTH,
        mimeType: 'image/jpeg',
        quality: 0.85,
      });
      onConfirm(cropped.dataUrl, cropped.mimeType);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onCancel} fullWidth maxWidth="xs">
      <DialogTitle>{t('profiles.photoCropTitle')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('profiles.photoCropHint')}
        </Typography>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: theme.spacing(38),
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
              cropShape={cropShape}
              showGrid={false}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </Box>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
          <ZoomOutIcon fontSize="small" color="action" />
          <Slider
            value={zoom}
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            aria-label={t('profiles.photoCropZoom')}
            onChange={(_, v) => setZoom(v as number)}
            disabled={busy}
          />
          <ZoomInIcon fontSize="small" color="action" />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={busy}>
          {t('profiles.photoCropCancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={busy || !areaPixels}
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {t('profiles.photoCropConfirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
