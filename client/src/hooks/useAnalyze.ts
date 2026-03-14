import { useState, useCallback } from 'react';
import { analyzeComposition } from '../services/api';
import { AnalysisResult, PetProfile } from '../types';

export function useAnalyze() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (composition: string, petProfile?: PetProfile) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeComposition(composition, petProfile);
      setResult(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Neočakávaná chyba pri analýze';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return { analyze, result, loading, error, reset };
}
