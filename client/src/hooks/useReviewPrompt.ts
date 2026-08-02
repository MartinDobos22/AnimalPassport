import { useCallback, useEffect, useState } from 'react';
import {
  markReviewPromptDone,
  shouldOfferReviewPrompt,
  snoozeReviewPrompt,
} from '../utils/reviewPrompt';

interface UseReviewPrompt {
  visible: boolean;
  snooze: () => void;
  done: () => void;
  hide: () => void;
}

export function useReviewPrompt(enabled: boolean): UseReviewPrompt {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    // Malý odklad, aby prompt nevyskočil hneď pri príchode na stránku.
    const timer = setTimeout(() => setVisible(shouldOfferReviewPrompt()), 1500);
    return () => clearTimeout(timer);
  }, [enabled]);

  const snooze = useCallback(() => {
    snoozeReviewPrompt();
    setVisible(false);
  }, []);

  const done = useCallback(() => {
    markReviewPromptDone();
    setVisible(false);
  }, []);

  const hide = useCallback(() => setVisible(false), []);

  return { visible, snooze, done, hide };
}
