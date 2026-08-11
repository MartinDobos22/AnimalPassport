import { useCallback, useEffect, useRef, useState } from 'react';

const ACTIVITY_STORAGE_KEY = 'granule-check-last-activity';
const WRITE_THROTTLE_MS = 5_000;
const TICK_MS = 1_000;

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart', 'wheel'] as const;

interface Options {
  timeoutMs: number;
  warningMs: number;
  onTimeout: () => void;
}

interface Result {
  warningActive: boolean;
  secondsLeft: number;
  stayActive: () => void;
}

function readLastActivity(): number | null {
  try {
    const raw = window.localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeLastActivity(ts: number): void {
  try {
    window.localStorage.setItem(ACTIVITY_STORAGE_KEY, String(ts));
  } catch {
    /* ignore */
  }
}

export function clearLastActivity(): void {
  try {
    window.localStorage.removeItem(ACTIVITY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Odhlási používateľa po `timeoutMs` bez interakcie, s varovaním `warningMs`
 * pred vypršaním.
 *
 * Meria sa rozdiel wall-clock pečiatok, nie beh setTimeoutu — inak by uspatie
 * notebooku alebo throttling neaktívnej záložky odpočet zastavili. Pečiatka je
 * v localStorage, takže aktivita v jednej karte drží prihlásenie aj v ostatných.
 */
export function useInactivityLogout({ timeoutMs, warningMs, onTimeout }: Options): Result {
  const [warningActive, setWarningActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const warningRef = useRef(false);
  const firedRef = useRef(false);
  const lastWriteRef = useRef(0);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const markActivity = useCallback((force = false) => {
    const now = Date.now();
    if (!force && now - lastWriteRef.current < WRITE_THROTTLE_MS) return;
    lastWriteRef.current = now;
    writeLastActivity(now);
  }, []);

  const stayActive = useCallback(() => {
    firedRef.current = false;
    warningRef.current = false;
    setWarningActive(false);
    markActivity(true);
  }, [markActivity]);

  useEffect(() => {
    // timeoutMs <= 0 znamená vypnutú funkciu. Musí sa to ošetriť tu, nie až
    // v komponente — inak by prvý tick odhlásil hneď (remaining by bol záporný).
    if (timeoutMs <= 0) return;

    // Bez uloženej pečiatky ide o prvý štart relácie — založíme ju. Ak pečiatka
    // existuje a je staršia než timeout, prvý tick odhlási hneď (návrat k appke
    // otvorenej pred hodinami).
    if (readLastActivity() === null) {
      lastWriteRef.current = Date.now();
      writeLastActivity(lastWriteRef.current);
    }

    const handleActivity = () => {
      // Počas varovania ignorujeme pasívnu aktivitu — inak by pohyb myšou
      // k tlačidlu dialóg potichu zrušil a používateľ by nevedel, čo sa stalo.
      if (warningRef.current) return;
      markActivity();
    };

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, handleActivity, { passive: true })
    );

    const tick = () => {
      const last = readLastActivity() ?? Date.now();
      const remaining = timeoutMs - (Date.now() - last);

      if (remaining <= 0) {
        if (firedRef.current) return;
        firedRef.current = true;
        onTimeoutRef.current();
        return;
      }

      const shouldWarn = remaining <= warningMs;
      if (shouldWarn !== warningRef.current) {
        warningRef.current = shouldWarn;
        setWarningActive(shouldWarn);
      }
      if (shouldWarn) setSecondsLeft(Math.ceil(remaining / 1000));
    };

    tick();
    const intervalId = window.setInterval(tick, TICK_MS);

    return () => {
      window.clearInterval(intervalId);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, handleActivity));
    };
  }, [timeoutMs, warningMs, markActivity]);

  return { warningActive, secondsLeft, stayActive };
}
