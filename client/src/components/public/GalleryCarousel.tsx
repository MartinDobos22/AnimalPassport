import { useRef, useState } from 'react';
import { Box, IconButton, useTheme } from '@mui/material';
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  ZoomOutMap as ZoomIcon,
} from '@mui/icons-material';

export interface CarouselImage {
  src: string;
  alt?: string;
}

interface Props {
  images: CarouselImage[];
  /** Klik na obrázok — otvorí fullscreen lightbox na danom indexe. */
  onOpen: (index: number) => void;
}

// Kompaktný carousel pre galériu v článku: jeden obrázok naraz vo fixnej
// (nízkej) výške, listovanie šípkami/ťahom, bodky ako indikátor, klik = lightbox.
export default function GalleryCarousel({ images, onOpen }: Props) {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const dragStartX = useRef<number | null>(null);

  if (images.length === 0) return null;
  const count = images.length;
  const clamped = Math.min(index, count - 1);

  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);

  const onPointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    const dx = e.clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  };

  return (
    <Box sx={{ my: 3 }}>
      <Box
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        sx={{
          position: 'relative',
          width: '100%',
          height: { xs: 220, sm: 300, md: 360 },
          borderRadius: `${theme.shape.borderRadius}px`,
          overflow: 'hidden',
          bgcolor: theme.palette.action.hover,
          touchAction: 'pan-y',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            height: '100%',
            transform: `translateX(-${clamped * 100}%)`,
            transition: 'transform 0.3s ease',
          }}
        >
          {images.map((img, k) => (
            <Box
              key={k}
              onClick={() => onOpen(k)}
              sx={{ flex: '0 0 100%', height: '100%', cursor: 'zoom-in' }}
            >
              <Box
                component="img"
                src={img.src}
                alt={img.alt ?? ''}
                loading="lazy"
                draggable={false}
                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </Box>
          ))}
        </Box>

        <IconButton
          aria-label="Zväčšiť"
          onClick={() => onOpen(clamped)}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'rgba(0,0,0,0.45)',
            color: 'common.white',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' },
          }}
        >
          <ZoomIcon fontSize="small" />
        </IconButton>

        {count > 1 && (
          <>
            <IconButton
              aria-label="Predchádzajúci"
              onClick={() => go(-1)}
              sx={{
                position: 'absolute',
                top: '50%',
                left: 8,
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.45)',
                color: 'common.white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' },
              }}
            >
              <PrevIcon />
            </IconButton>
            <IconButton
              aria-label="Ďalší"
              onClick={() => go(1)}
              sx={{
                position: 'absolute',
                top: '50%',
                right: 8,
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.45)',
                color: 'common.white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' },
              }}
            >
              <NextIcon />
            </IconButton>
          </>
        )}
      </Box>

      {count > 1 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 1,
            mt: 1.5,
            flexWrap: 'wrap',
          }}
        >
          {images.map((_, k) => (
            <Box
              key={k}
              component="button"
              aria-label={`Obrázok ${k + 1}`}
              onClick={() => setIndex(k)}
              sx={{
                width: 8,
                height: 8,
                p: 0,
                border: 0,
                borderRadius: '50%',
                cursor: 'pointer',
                bgcolor: k === clamped ? 'primary.main' : 'action.disabled',
                transition: 'background-color 0.2s',
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
