import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, IconButton, TextField, Typography, useTheme } from '@mui/material';
import HelpHint from '../HelpHint';
import { AddPhotoAlternate as AddPhotoIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { downscaleImage, fileToDataUrl } from '../../utils/imageDownscale';
import type { EpisodeAttachment } from '../../types/healthEpisode';
import { logger } from '../../utils/logger';
import {
  deleteHealthAttachment,
  getHealthAttachmentSignedUrls,
  uploadHealthAttachment,
} from '../../services/healthApi';

const MAX_ORIGINAL_FALLBACK_BYTES = 500 * 1024;

interface AttachmentGalleryProps {
  petId: string;
  attachments: EpisodeAttachment[];
  onChange: (next: EpisodeAttachment[]) => void;
  disabled?: boolean;
}

export default function AttachmentGallery({
  petId,
  attachments,
  onChange,
  disabled = false,
}: AttachmentGalleryProps) {
  const { t } = useTranslation('episodes');
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const objectPaths = attachments.map((a) => a.objectPath).filter(Boolean);
    if (objectPaths.length === 0) {
      setSignedUrls({});
      return;
    }

    let cancelled = false;
    getHealthAttachmentSignedUrls(petId, objectPaths)
      .then((urls) => {
        if (!cancelled) setSignedUrls(urls);
      })
      .catch((err) => {
        logger.warn('Nepodarilo sa vytvoriť signed URL pre prílohy epizódy', {
          error: err instanceof Error ? err.message : 'unknown',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [petId, attachments]);

  const handleAdd = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setBusy(true);

    try {
      const next: EpisodeAttachment[] = [...attachments];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          setError(t('attachments.errorImageOnly'));
          continue;
        }

        try {
          const downscaled = await downscaleImage(file, 1024);
          const uploaded = await uploadHealthAttachment({
            petId: petId,
            fileName: file.name,
            mimeType: downscaled.mimeType,
            base64Data: downscaled.dataUrl.split(',')[1] ?? downscaled.dataUrl,
          });
          next.push(uploaded);
          logger.info('Príloha downscalnutá a uložená do privátneho storage', {
            originalBytes: file.size,
            resultBytes: downscaled.bytes,
            mimeType: downscaled.mimeType,
          });
        } catch (err) {
          logger.warn('Image downscale/upload zlyhal, skúšam fallback', {
            error: err instanceof Error ? err.message : 'unknown',
          });
          if (file.size <= MAX_ORIGINAL_FALLBACK_BYTES) {
            const dataUrl = await fileToDataUrl(file);
            const uploaded = await uploadHealthAttachment({
              petId: petId,
              fileName: file.name,
              mimeType: file.type,
              base64Data: dataUrl.split(',')[1] ?? dataUrl,
            });
            next.push(uploaded);
          } else {
            setError(t('attachments.errorTooLarge'));
          }
        }
      }
      onChange(next);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleCaptionChange = (objectPath: string, caption: string) => {
    onChange(attachments.map((a) => (a.objectPath === objectPath ? { ...a, caption } : a)));
  };

  const handleDelete = (objectPath: string) => {
    onChange(attachments.filter((a) => a.objectPath !== objectPath));
    void deleteHealthAttachment(petId, objectPath).catch((err) => {
      logger.warn('Nepodarilo sa zmazať objekt prílohy', {
        error: err instanceof Error ? err.message : 'unknown',
        objectPath,
      });
    });
  };

  const onFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    void handleAdd(e.target.files);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {t('attachments.title')}
        </Typography>
        <HelpHint text={t('hints.attachments')} />
        <Box sx={{ flex: 1 }} />
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddPhotoIcon />}
          onClick={() => inputRef.current?.click()}
          disabled={disabled || busy}
        >
          {t('actions.add', { ns: 'common' })}
        </Button>
        <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={onFileInput} />
      </Box>

      {error && (
        <Alert severity="warning" onClose={() => setError(null)} sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}

      {attachments.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t('attachments.empty')}
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)' },
          }}
        >
          {attachments.map((attachment) => (
            <Box
              key={attachment.objectPath}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box
                component="img"
                src={signedUrls[attachment.objectPath] ?? ''}
                alt={attachment.caption ?? t('attachments.captionAlt')}
                sx={{ width: '100%', height: 200, objectFit: 'cover', bgcolor: 'action.hover' }}
              />
              <Box sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TextField
                  size="small"
                  fullWidth
                  variant="standard"
                  placeholder={t('attachments.captionPlaceholder')}
                  value={attachment.caption ?? ''}
                  onChange={(e) => handleCaptionChange(attachment.objectPath, e.target.value)}
                  disabled={disabled}
                />
                <IconButton
                  size="small"
                  onClick={() => handleDelete(attachment.objectPath)}
                  disabled={disabled}
                  aria-label={t('attachments.deleteAria')}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
