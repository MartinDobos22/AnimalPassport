import { useState, useCallback } from 'react';

// LocalStorage keys that may contain user-specific data and must be cleared on logout.
// Neutral app preferences such as theme or language are intentionally excluded.
export const USER_SPECIFIC_LOCAL_STORAGE_KEYS = [
  'granule-check-food-safety-recent',
  'granule-check-active-pet-id',
  // Pečiatka poslednej aktivity (useInactivityLogout). Bez vyčistenia pri odhlásení
  // by ju ďalšie prihlásenie našlo prošlú a hneď reláciu ukončilo.
  'granule-check-last-activity',
] as const;

// Previously persisted clinic-by-dog suggestions; kept here so logout removes legacy data.
export const LEGACY_USER_SPECIFIC_LOCAL_STORAGE_KEYS = [
  'granule-check-last-clinic-by-dog',
] as const;

export function clearUserSpecificLocalStorage() {
  if (typeof window === 'undefined') return;
  [...USER_SPECIFIC_LOCAL_STORAGE_KEYS, ...LEGACY_USER_SPECIFIC_LOCAL_STORAGE_KEYS].forEach(
    (key) => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
  );
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(nextValue));
        } catch {
          console.warn('Nepodarilo sa uložiť do localStorage');
        }
        return nextValue;
      });
    },
    [key]
  );

  return [storedValue, setValue] as const;
}
