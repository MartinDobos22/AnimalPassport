import { useCallback, useEffect, useState } from 'react';
import { fetchMyReview, saveMyReview } from '../services/reviewsApi';
import { markReviewPromptDone } from '../utils/reviewPrompt';
import type { MyReview, ReviewInput } from '../types/review';

interface UseMyReview {
  review: MyReview | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  save: (input: ReviewInput) => Promise<MyReview | null>;
}

export function useMyReview(): UseMyReview {
  const [review, setReview] = useState<MyReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchMyReview()
      .then((r) => {
        if (active) setReview(r);
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const save = useCallback(async (input: ReviewInput): Promise<MyReview | null> => {
    setSaving(true);
    setError(null);
    try {
      const saved = await saveMyReview(input);
      setReview(saved);
      markReviewPromptDone();
      return saved;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  return { review, loading, saving, error, save };
}
