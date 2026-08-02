import { useEffect, useState } from 'react';
import { fetchApprovedReviews } from '../services/reviewsApi';
import type { PublicReview } from '../types/review';

interface UseApprovedReviews {
  reviews: PublicReview[];
  loading: boolean;
}

export function useApprovedReviews(locale?: string): UseApprovedReviews {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchApprovedReviews(locale)
      .then((r) => {
        if (active) setReviews(r);
      })
      .catch(() => {
        // Recenzie sú best-effort — sekcia sa jednoducho neukáže.
        if (active) setReviews([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [locale]);

  return { reviews, loading };
}
