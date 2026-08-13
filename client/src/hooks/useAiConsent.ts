import { useContext } from 'react';
import { AiConsentContext } from '../contexts/AiConsentContext';

export function useAiConsent() {
  const ctx = useContext(AiConsentContext);
  if (!ctx) {
    throw new Error('useAiConsent musí byť použitý vnútri <AiConsentProvider>.');
  }
  return ctx;
}
