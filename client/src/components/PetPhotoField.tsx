import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  CircularProgress,
  FormHelperText,
  IconButton,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  Pets as PetsIcon,
} from '@mui/icons-material';
import { usePetPhotoUpload } from '../hooks/usePetPhotoUpload';

interface Props {
  value?: string;
  onChange: (url: string | undefined) => void;
}

export default function PetPhotoField({ value, onChange }: Props) {
  const { t } = useTranslation('healthPassport');
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, error } = usePetPhotoUpload();

  const handleFile = async (file: File) => {
    const url = await upload(file);
    if (url) onChange(url);
  };

  const errorMsg =
    error === 'unsupported'
      ? t('profiles.photoErrorUnsupported')
      : error === 'tooLarge'
        ? t('profiles.photoErrorTooLarge')
        : error
          ? t('profiles.photoErrorFailed')
          : null;

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              border: value ? 'none' : `1.5px dashed ${theme.palette.divider}`,
              color: 'primary.main',
            }}
          >
            {value ? (
              <Box
                component="img"
                src={value}
                alt=""
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <PetsIcon sx={{ fontSize: 34 }} />
            )}
          </Box>
          {uploading && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.common.black, 0.35),
              }}
            >
              <CircularProgress size={24} sx={{ color: 'common.white' }} />
            </Box>
          )}
        </Box>

        <Stack spacing={0.75}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              size="small"
              variant="outlined"
              startIcon={<PhotoCameraIcon />}
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {value ? t('profiles.photoChange') : t('profiles.photoUpload')}
            </Button>
            {value && (
              <IconButton
                size="small"
                aria-label={t('profiles.photoRemove')}
                disabled={uploading}
                onClick={() => onChange(undefined)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textTransform: 'none', letterSpacing: 0 }}
          >
            {t('profiles.photoHint')}
          </Typography>
        </Stack>

        <Box
          component="input"
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          sx={{ display: 'none' }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = '';
          }}
        />
      </Stack>
      {errorMsg && (
        <FormHelperText error sx={{ mt: 1 }}>
          {errorMsg}
        </FormHelperText>
      )}
    </Box>
  );
}
