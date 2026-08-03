import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Rating,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material';
import {
  RateReview as RateReviewIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  DeleteOutline as DeleteOutlineIcon,
} from '@mui/icons-material';
import PageContainer from '../../components/ui/PageContainer';
import PageHeader from '../../components/ui/PageHeader';
import { deleteAdminReview, listAdminReviews, setReviewStatus } from '../../services/adminApi';
import type { AdminReview, ReviewStatus } from '../../types/review';

type Filter = 'all' | ReviewStatus;

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: 'Čaká',
  approved: 'Schválené',
  rejected: 'Zamietnuté',
};

const STATUS_COLOR: Record<ReviewStatus, 'default' | 'success' | 'warning'> = {
  pending: 'default',
  approved: 'success',
  rejected: 'warning',
};

export default function AdminReviewsPage() {
  const theme = useTheme();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('pending');

  const load = useCallback((next: Filter) => {
    setLoading(true);
    setError(null);
    listAdminReviews(next === 'all' ? undefined : next)
      .then(setReviews)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  const moderate = async (review: AdminReview, status: ReviewStatus) => {
    setBusyId(review.id);
    setError(null);
    try {
      const updated = await setReviewStatus(review.id, status);
      setNotice(`Recenzia: ${STATUS_LABEL[status].toLowerCase()}.`);
      if (filter === 'all' || filter === status) {
        setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      } else {
        setReviews((prev) => prev.filter((r) => r.id !== updated.id));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (review: AdminReview) => {
    setBusyId(review.id);
    setError(null);
    try {
      await deleteAdminReview(review.id);
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
      setNotice('Recenzia zmazaná.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageContainer>
      <PageHeader icon={<RateReviewIcon />} title="Recenzie" />

      <Typography variant="body2" color="text.secondary" sx={{ mb: theme.spacing(2) }}>
        Schválené recenzie sa zobrazujú verejne na úvodnej stránke. Zmena recenzie používateľom ju
        vráti späť do stavu „Čaká".
      </Typography>

      <Tabs
        value={filter}
        onChange={(_e, value: Filter) => setFilter(value)}
        sx={{ mb: theme.spacing(2), borderBottom: `1px solid ${theme.palette.divider}` }}
      >
        <Tab value="pending" label="Čakajúce" />
        <Tab value="approved" label="Schválené" />
        <Tab value="rejected" label="Zamietnuté" />
        <Tab value="all" label="Všetky" />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: theme.spacing(2) }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : reviews.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          Žiadne recenzie v tejto kategórii.
        </Typography>
      ) : (
        <Stack gap={2}>
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  gap={1}
                  sx={{ mb: 1 }}
                >
                  <Stack direction="row" alignItems="center" gap={1.5}>
                    <Rating value={review.rating} readOnly size="small" />
                    <Chip
                      size="small"
                      label={STATUS_LABEL[review.status]}
                      color={STATUS_COLOR[review.status]}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(review.createdAt).toLocaleString('sk-SK')}
                  </Typography>
                </Stack>

                {review.body && (
                  <Typography variant="body1" sx={{ mb: 1.5, whiteSpace: 'pre-line' }}>
                    {review.body}
                  </Typography>
                )}

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {[review.authorName, review.petName].filter(Boolean).join(' & ') || '—'}
                  {review.authorEmail ? ` · ${review.authorEmail}` : ''}
                </Typography>

                <Stack direction="row" gap={1} flexWrap="wrap">
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    disabled={busyId === review.id || review.status === 'approved'}
                    onClick={() => void moderate(review, 'approved')}
                  >
                    Schváliť
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    startIcon={<BlockIcon />}
                    disabled={busyId === review.id || review.status === 'rejected'}
                    onClick={() => void moderate(review, 'rejected')}
                  >
                    Zamietnuť
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    color="error"
                    startIcon={<DeleteOutlineIcon />}
                    disabled={busyId === review.id}
                    onClick={() => void remove(review)}
                  >
                    Zmazať
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4000}
        onClose={() => setNotice(null)}
        message={notice ?? ''}
      />
    </PageContainer>
  );
}
