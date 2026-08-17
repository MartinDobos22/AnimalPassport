import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { fetchAiConsent, setAiConsent } from '../services/consentApi';

interface AiConsentContextValue {
  granted: boolean;
  grantedAt: string | null;
  loading: boolean;
  grant: () => Promise<void>;
  revoke: () => Promise<void>;
}

export const AiConsentContext = createContext<AiConsentContextValue | null>(null);

export function AiConsentProvider({ children }: { children: ReactNode }) {
  const [granted, setGranted] = useState(false);
  const [grantedAt, setGrantedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const state = await fetchAiConsent();
        if (!active) return;
        setGranted(state.granted);
        setGrantedAt(state.grantedAt);
      } catch {
        // Fail-closed: keď sa stav nedá načítať, tvárime sa že súhlas nie je.
        // Server rozhoduje nezávisle, takže z toho nevznikne obídenie súhlasu.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const apply = useCallback(async (value: boolean) => {
    const state = await setAiConsent(value);
    setGranted(state.granted);
    setGrantedAt(state.grantedAt);
  }, []);

  const grant = useCallback(() => apply(true), [apply]);
  const revoke = useCallback(() => apply(false), [apply]);

  const value = useMemo<AiConsentContextValue>(
    () => ({ granted, grantedAt, loading, grant, revoke }),
    [granted, grantedAt, loading, grant, revoke]
  );

  return <AiConsentContext.Provider value={value}>{children}</AiConsentContext.Provider>;
}
