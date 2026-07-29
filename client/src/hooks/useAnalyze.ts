import { useState, useCallback, useRef, useEffect } from 'react';
import { analyzeAttachment, analyzeComposition, extractTextFromImage } from '../services/api';
import { AnalysisRequest, AnalysisResult, FileExtractionResult, PetProfile } from '../types';
import { logger } from '../utils/logger';
import { recordReviewSignal } from '../utils/reviewPrompt';
import i18n from '../i18n';

const SLOW_WARNING_MS = 10_000;

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

export function useAnalyze() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [fileResult, setFileResult] = useState<FileExtractionResult | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [extractingText, setExtractingText] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startSlowTimer = useCallback(() => {
    setSlow(false);
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    slowTimerRef.current = setTimeout(() => setSlow(true), SLOW_WARNING_MS);
  }, []);

  const clearSlowTimer = useCallback(() => {
    if (slowTimerRef.current) {
      clearTimeout(slowTimerRef.current);
      slowTimerRef.current = null;
    }
    setSlow(false);
  }, []);

  useEffect(
    () => () => {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      abortRef.current?.abort();
    },
    []
  );

  const cancel = useCallback(() => {
    if (abortRef.current) {
      logger.info('useAnalyze: používateľ zrušil prebiehajúce AI volanie');
      abortRef.current.abort();
      abortRef.current = null;
    }
    clearSlowTimer();
  }, [clearSlowTimer]);

  const analyze = useCallback(
    async (composition: string, petProfile?: PetProfile) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoadingText(true);
      setError(null);
      setResult(null);
      setFileResult(null);
      startSlowTimer();

      logger.info('Používateľ spustil textovú analýzu', {
        compositionLength: composition.length,
        hasPetProfile: Boolean(petProfile),
      });

      try {
        const data = await analyzeComposition(composition, petProfile, controller.signal);
        setResult(data);
        recordReviewSignal();
        logger.info('Hook useAnalyze prijal výsledok textovej analýzy', { score: data.score });
      } catch (err) {
        if (isAbortError(err)) {
          logger.info('Textová analýza bola zrušená používateľom');
        } else {
          const message =
            err instanceof Error
              ? err.message
              : i18n.t('errors.unexpectedAnalysis', { ns: 'analyze' });
          setError(message);
          logger.error('Hook useAnalyze zachytil chybu textovej analýzy', { message });
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setLoadingText(false);
        clearSlowTimer();
      }
    },
    [startSlowTimer, clearSlowTimer]
  );

  const analyzeFile = useCallback(
    async (attachment: NonNullable<AnalysisRequest['attachment']>, examAlias?: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoadingFile(true);
      setError(null);
      setResult(null);
      setFileResult(null);
      startSlowTimer();

      logger.info('Používateľ spustil analýzu súboru', {
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
      });

      try {
        const data = await analyzeAttachment(attachment, examAlias, controller.signal);
        setFileResult(data);
        recordReviewSignal();
        logger.info('Hook useAnalyze prijal výsledok súborovej analýzy z backendu', {
          source: data.source,
          contextDocumentType: data.contextAnalysis?.documentType ?? null,
          examAlias: data.examAnalysis?.examAlias ?? examAlias ?? null,
          examType: data.examAnalysis?.examType ?? null,
          hasFeedAnalysis: Boolean(data.feedAnalysis),
          hasHealthPassportInterpretation: Boolean(data.healthPassportInterpretation),
        });
      } catch (err) {
        if (isAbortError(err)) {
          logger.info('Súborová analýza bola zrušená používateľom');
        } else {
          const message =
            err instanceof Error
              ? err.message
              : i18n.t('errors.unexpectedFileAnalysis', { ns: 'analyze' });
          setError(message);
          logger.error('Hook useAnalyze zachytil chybu súborovej analýzy', { message });
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setLoadingFile(false);
        clearSlowTimer();
      }
    },
    [startSlowTimer, clearSlowTimer]
  );

  const extractTextOnly = useCallback(
    async (attachment: {
      fileName: string;
      mimeType: string;
      base64Data: string;
    }): Promise<string | null> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setExtractingText(true);
      setExtractError(null);
      startSlowTimer();

      logger.info('Používateľ spustil OCR extrakciu zo súboru', {
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
      });

      try {
        const { extractedText } = await extractTextFromImage(attachment, false, controller.signal);
        logger.info('Hook useAnalyze prijal výsledok OCR', {
          extractedTextLength: extractedText.length,
        });
        return extractedText;
      } catch (err) {
        if (isAbortError(err)) {
          logger.info('OCR extrakcia bola zrušená používateľom');
          return null;
        }
        const message =
          err instanceof Error
            ? err.message
            : (i18n.t('errors.extractTextFailed' as never, { ns: 'analyze' }) as string);
        setExtractError(message);
        logger.error('Hook useAnalyze zachytil chybu OCR extrakcie', { message });
        return null;
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setExtractingText(false);
        clearSlowTimer();
      }
    },
    [startSlowTimer, clearSlowTimer]
  );

  const reset = useCallback(() => {
    logger.info('Resetujem stav analýzy v useAnalyze');
    abortRef.current?.abort();
    abortRef.current = null;
    clearSlowTimer();
    setResult(null);
    setFileResult(null);
    setError(null);
    setExtractError(null);
    setLoadingText(false);
    setLoadingFile(false);
    setExtractingText(false);
  }, [clearSlowTimer]);

  return {
    analyze,
    analyzeFile,
    extractTextOnly,
    cancel,
    result,
    fileResult,
    loadingText,
    loadingFile,
    extractingText,
    loading: loadingText || loadingFile,
    error,
    extractError,
    slow,
    reset,
  };
}
