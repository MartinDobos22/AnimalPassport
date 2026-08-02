import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
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
import { ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon } from '@mui/icons-material';
import { cropImage } from '../utils/cropImage';
import { downscaleImage } from '../utils/imageDownscale';

interface Props {
  file: File | null;
  open: boolean;
  uploading?: boolean;
  onCancel: () => void;
  onConfirm: (dataUrl: string, mimeType: string) => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const OUTPUT_MAX_WIDTH = 1280;

export default function PetPhotoAdjustDialog({
  file,
  open,
  uploading = false,
  onCancel,
  onConfirm,
}: Props) {
  const { t } = useTranslation('healthPassport');
  const theme = useTheme();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [aspect, setAspect] = useState<number | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [processing, setProcessing] = useState(false);
  // react-easy-crop measures its container on mount; gate it until the dialog's
  // enter transition finishes so the container has a real size (avoids a blank crop).
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!file) {
      setImageSrc(null);
      setAspect(null);
      return;
    }
    let cancelled = false;
    setPreparing(true);
    setCrop({ x: 0, y: 0 });
    setZoom(MIN_ZOOM);
    setAreaPixels(null);
    // Downscale before handing the image to the cropper: large phone photos on a
    // GPU-composited layer (MUI dialog transform) can fail to paint, and the
    // smaller data URL is same-origin so the crop canvas never taints.
    void downscaleImage(file, { maxWidth: 1600, mimeType: 'image/jpeg', quality: 0.85 })
      .then(({ dataUrl }) => {
        if (cancelled) return;
        const img = new Image();
        img.onload = () => {
          if (cancelled) return;
          setAspect(img.naturalWidth / img.naturalHeight);
          setImageSrc(dataUrl);
          setPreparing(false);
        };
        img.onerror = () => {
          if (cancelled) return;
          setPreparing(false);
        };
        img.src = dataUrl;
      })
      .catch(() => {
        if (!cancelled) setPreparing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  const onCropComplete = useCallback((_area: Area, areaPx: Area) => {
    setAreaPixels(areaPx);
  }, []);

  const busy = uploading || processing;
  const ready = Boolean(imageSrc && aspect && entered);

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
    <Dialog
      open={open}
      onClose={busy ? undefined : onCancel}
      fullWidth
      maxWidth="xs"
      TransitionProps={{
        onEntered: () => setEntered(true),
        onExited: () => setEntered(false),
      }}
    >
      <DialogTitle>{t('profiles.photoAdjustTitle')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('profiles.photoAdjustHint')}
        </Typography>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: theme.spacing(38),
            bgcolor: 'common.black',
            borderRadius: `${theme.shape.borderRadius}px`,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {ready && imageSrc && aspect ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              showGrid={false}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          ) : (
            <CircularProgress size={28} sx={{ color: 'common.white' }} />
          )}
        </Box>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
          <ZoomOutIcon fontSize="small" color="action" />
          <Slider
            value={zoom}
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            aria-label={t('profiles.photoAdjustZoom')}
            onChange={(_, v) => setZoom(v as number)}
            disabled={busy || !ready}
          />
          <ZoomInIcon fontSize="small" color="action" />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={busy}>
          {t('profiles.photoAdjustCancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={busy || preparing || !areaPixels}
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {t('profiles.photoAdjustConfirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
