import { useCallback, useEffect } from 'react';
import { Box, Dialog, IconButton, useTheme } from '@mui/material';
import {
  Close as CloseIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
} from '@mui/icons-material';

export interface LightboxImage {
  src: string;
  alt?: string;
}

interface Props {
  images: LightboxImage[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export default function Lightbox({ images, index, onClose, onIndexChange }: Props) {
  const theme = useTheme();
  const open = index !== null;

  const go = useCallback(
    (delta: number) => {
      if (index === null || images.length === 0) return;
      onIndexChange((index + delta + images.length) % images.length);
    },
    [index, images.length, onIndexChange]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, go]);

  const current = index !== null ? images[index] : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{ paper: { sx: { bgcolor: 'common.black', boxShadow: 'none' } } }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <IconButton
          onClick={onClose}
          aria-label="Zavrieť"
          sx={{ position: 'absolute', top: 8, right: 8, color: 'common.white', zIndex: 1 }}
        >
          <CloseIcon />
        </IconButton>
        {images.length > 1 && (
          <IconButton
            onClick={() => go(-1)}
            aria-label="Predchádzajúci"
            sx={{ position: 'absolute', left: 8, color: 'common.white' }}
          >
            <PrevIcon />
          </IconButton>
        )}
        {current && (
          <Box
            component="img"
            src={current.src}
            alt={current.alt ?? ''}
            sx={{
              maxWidth: '100%',
              maxHeight: '85vh',
              objectFit: 'contain',
              display: 'block',
              borderRadius: `${theme.shape.borderRadius}px`,
            }}
          />
        )}
        {images.length > 1 && (
          <IconButton
            onClick={() => go(1)}
            aria-label="Ďalší"
            sx={{ position: 'absolute', right: 8, color: 'common.white' }}
          >
            <NextIcon />
          </IconButton>
        )}
      </Box>
    </Dialog>
  );
}
