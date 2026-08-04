import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Rating,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Star as StarIcon } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useMyReview } from '../../hooks/useMyReview';
import type { ReviewStatus } from '../../types/review';

interface Props {
  onSubmitted?: () => void;
}

const BODY_MAX = 800;
const NAME_MAX = 60;
const PET_MAX = 40;

function defaultAuthorName(
  displayName: string | null | undefined,
  email: string | null | undefined
): string {
  if (displayName && displayName.trim().length > 0) return displayName.trim();
  if (email && email.includes('@')) return email.split('@')[0];
  return '';
}

export default function ReviewForm({ onSubmitted }: Props) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { review, loading, saving, error, save } = useMyReview();

  const [rating, setRating] = useState<number>(0);
  const [body, setBody] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [petName, setPetName] = useState('');
  const [consent, setConsent] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (review) {
      setRating(review.rating);
      setBody(review.body ?? '');
      setAuthorName(review.authorName ?? defaultAuthorName(user?.displayName, user?.email));
      setPetName(review.petName ?? '');
      setConsent(true);
    } else if (!loading) {
      setAuthorName((prev) => prev || defaultAuthorName(user?.displayName, user?.email));
    }
  }, [review, loading, user]);

  const status: ReviewStatus | null = review?.status ?? null;

  const handleSubmit = async () => {
    setValidationError(null);
    setJustSaved(false);
    if (rating < 1) {
      setValidationError(t('review.ratingRequired'));
      return;
    }
    const saved = await save({
      rating,
      body: body.trim() || undefined,
      authorName: authorName.trim() || undefined,
      petName: petName.trim() || undefined,
      locale: i18n.language === 'en' ? 'en' : 'sk',
    });
    if (saved) {
      setJustSaved(true);
      onSubmitted?.();
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const statusSeverity =
    status === 'approved' ? 'success' : status === 'rejected' ? 'warning' : 'info';
  const statusHint =
    status === 'approved'
      ? t('review.statusApprovedHint')
      : status === 'rejected'
        ? t('review.statusRejectedHint')
        : t('review.statusPendingHint');

  return (
    <Stack gap={2.5}>
      <Typography variant="body2" color="text.secondary">
        {t('review.formIntro')}
      </Typography>

      {status && !justSaved && (
        <Alert severity={statusSeverity} icon={<StarIcon fontSize="inherit" />}>
          {statusHint}
        </Alert>
      )}

      {justSaved && <Alert severity="success">{t('review.saved')}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      {validationError && <Alert severity="error">{validationError}</Alert>}

      <Box>
        <Typography component="legend" variant="subtitle2" sx={{ mb: 0.5 }}>
          {t('review.ratingLabel')}
        </Typography>
        <Rating
          value={rating}
          onChange={(_e, value) => setRating(value ?? 0)}
          size="large"
          aria-label={t('review.ratingLabel')}
        />
      </Box>

      <TextField
        label={t('review.commentLabel')}
        placeholder={t('review.commentPlaceholder')}
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
        multiline
        minRows={3}
        fullWidth
        helperText={`${body.length}/${BODY_MAX}`}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
        <TextField
          label={t('review.nameLabel')}
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value.slice(0, NAME_MAX))}
          fullWidth
        />
        <TextField
          label={t('review.petLabel')}
          value={petName}
          onChange={(e) => setPetName(e.target.value.slice(0, PET_MAX))}
          fullWidth
        />
      </Stack>

      <FormControlLabel
        control={<Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} />}
        label={<Typography variant="body2">{t('review.consent')}</Typography>}
      />

      <Box>
        <Button
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={saving || !consent || rating < 1}
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <StarIcon />}
        >
          {review ? t('review.update') : t('review.submit')}
        </Button>
      </Box>
    </Stack>
  );
}
