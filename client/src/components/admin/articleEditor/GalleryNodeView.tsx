import { Box, IconButton, Stack, TextField, Tooltip, Typography, useTheme } from '@mui/material';
import {
  Close as CloseIcon,
  DeleteOutline as DeleteIcon,
  CropOutlined as CropIcon,
} from '@mui/icons-material';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import ImagePickerButton from './ImagePickerButton';
import ImageCropButton from './ImageCropButton';
import type { GalleryImage } from './GalleryNode';

export default function GalleryNodeView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const theme = useTheme();
  const images = (node.attrs.images as GalleryImage[]) ?? [];

  const removeImage = (index: number) =>
    updateAttributes({ images: images.filter((_, i) => i !== index) });

  const setAlt = (index: number, alt: string) =>
    updateAttributes({
      images: images.map((img, i) => (i === index ? { ...img, alt } : img)),
    });

  const setSrc = (index: number, src: string) =>
    updateAttributes({
      images: images.map((img, i) => (i === index ? { ...img, src } : img)),
    });

  return (
    <NodeViewWrapper>
      <Box
        contentEditable={false}
        sx={{
          my: theme.spacing(2),
          p: theme.spacing(2),
          border: `1px dashed ${theme.palette.divider}`,
          borderRadius: `${theme.shape.borderRadius}px`,
          bgcolor: theme.palette.action.hover,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: theme.spacing(1.5) }}
        >
          <Typography variant="caption" color="text.secondary">
            Galéria ({images.length})
          </Typography>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <ImagePickerButton
              label="Pridať obrázok"
              onPicked={(media) =>
                updateAttributes({
                  images: [...images, { src: media.url, ...(media.alt ? { alt: media.alt } : {}) }],
                })
              }
            />
            <Tooltip title="Zmazať galériu">
              <IconButton size="small" aria-label="Zmazať galériu" onClick={deleteNode}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {images.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Zatiaľ žiadne obrázky — pridaj prvý.
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: theme.spacing(1),
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            }}
          >
            {images.map((img, i) => (
              <Box key={`${img.src}-${i}`}>
                <Box sx={{ position: 'relative' }}>
                  <Box
                    component="img"
                    src={img.src}
                    alt={img.alt ?? ''}
                    sx={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      objectFit: 'cover',
                      borderRadius: `${theme.shape.borderRadius}px`,
                      display: 'block',
                    }}
                  />
                  <IconButton
                    size="small"
                    aria-label="Odstrániť obrázok"
                    onClick={() => removeImage(i)}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'background.paper' },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                  <ImageCropButton
                    imageUrl={img.src}
                    initialMeta={{ alt: img.alt }}
                    onCropped={(image) => setSrc(i, image.url)}
                    renderTrigger={(onClick) => (
                      <Tooltip title="Orezať obrázok">
                        <IconButton
                          size="small"
                          aria-label="Orezať obrázok"
                          onClick={onClick}
                          sx={{
                            position: 'absolute',
                            top: 4,
                            left: 4,
                            bgcolor: 'background.paper',
                            '&:hover': { bgcolor: 'background.paper' },
                          }}
                        >
                          <CropIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  />
                </Box>
                <TextField
                  value={img.alt ?? ''}
                  onChange={(e) => setAlt(i, e.target.value)}
                  placeholder="Alt text"
                  size="small"
                  variant="standard"
                  fullWidth
                  sx={{ mt: 0.5 }}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </NodeViewWrapper>
  );
}
