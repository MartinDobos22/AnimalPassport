import { useState, useCallback } from 'react';
import { analyzeAttachment, analyzeComposition } from '../services/api';
import { AnalysisRequest, AnalysisResult, FileExtractionResult, PetProfile } from '../types';
import { logger } from '../utils/logger';

export function useAnalyze() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [fileResult, setFileResult] = useState<FileExtractionResult | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (composition: string, petProfile?: PetProfile) => {
    setLoadingText(true);
    setError(null);
    setResult(null);
    setFileResult(null);

    logger.info('Používateľ spustil textovú analýzu', {
      compositionLength: composition.length,
      hasPetProfile: Boolean(petProfile),
    });

    try {
      const data = await analyzeComposition(composition, petProfile);
      setResult(data);
      logger.info('Hook useAnalyze prijal výsledok textovej analýzy', { score: data.score });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Neočakávaná chyba pri analýze';
      setError(message);
      logger.error('Hook useAnalyze zachytil chybu textovej analýzy', { message });
    } finally {
      setLoadingText(false);
    }
  }, []);

  const analyzeFile = useCallback(async (attachment: NonNullable<AnalysisRequest['attachment']>, examAlias?: string) => {
    setLoadingFile(true);
    setError(null);
    setResult(null);
    setFileResult(null);

    logger.info('Používateľ spustil analýzu súboru', {
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
    });

    try {
      const data = await analyzeAttachment(attachment, examAlias);
      setFileResult(data);
      logger.info('Hook useAnalyze prijal výsledok súborovej analýzy', { source: data.source });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Neočakávaná chyba pri analýze súboru';
      setError(message);
      logger.error('Hook useAnalyze zachytil chybu súborovej analýzy', { message });
    } finally {
      setLoadingFile(false);
    }
  }, []);

  const reset = useCallback(() => {
    logger.info('Resetujem stav analýzy v useAnalyze');
    setResult(null);
    setFileResult(null);
    setError(null);
    setLoadingText(false);
    setLoadingFile(false);
  }, []);

  return {
    analyze,
    analyzeFile,
    result,
    fileResult,
    loadingText,
    loadingFile,
    loading: loadingText || loadingFile,
    error,
    reset,
  };
}
