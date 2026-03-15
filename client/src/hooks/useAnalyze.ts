import { useState, useCallback } from 'react';
import { analyzeAttachment, analyzeComposition } from '../services/api';
import { AnalysisRequest, AnalysisResult, FileExtractionResult, PetProfile } from '../types';

export function useAnalyze() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [fileResult, setFileResult] = useState<FileExtractionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (composition: string, petProfile?: PetProfile) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setFileResult(null);

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

  const analyzeFile = useCallback(async (attachment: NonNullable<AnalysisRequest['attachment']>) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setFileResult(null);

    try {
      const data = await analyzeAttachment(attachment);
      setFileResult(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Neočakávaná chyba pri analýze súboru';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setFileResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return { analyze, analyzeFile, result, fileResult, loading, error, reset };
}
