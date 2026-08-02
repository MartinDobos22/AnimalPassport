// Nenápadný prompt na recenziu po pár „akciách" používateľa. Stav držíme v
// localStorage (lokálna preferencia zariadenia, nie medicínske dáta).

const SIGNAL_KEY = 'pawly-review-signal-count';
const STATE_KEY = 'pawly-review-prompt-state';

// Koľko „akcií" (dokončená analýza, pridaný záznam, …) pred prvým promptom.
const SIGNAL_THRESHOLD = 3;
// Odklad po „Neskôr" — 30 dní.
const SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;

type PromptStatus = 'idle' | 'snoozed' | 'done';
interface PromptState {
  status: PromptStatus;
  until?: number;
}

function readState(): PromptState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return { status: 'idle' };
    const parsed = JSON.parse(raw) as PromptState;
    if (parsed && (parsed.status === 'snoozed' || parsed.status === 'done')) return parsed;
    return { status: 'idle' };
  } catch {
    return { status: 'idle' };
  }
}

function writeState(state: PromptState): void {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    /* best-effort */
  }
}

export function recordReviewSignal(): void {
  try {
    if (readState().status === 'done') return;
    const current = Number(localStorage.getItem(SIGNAL_KEY) ?? '0');
    const next = Number.isFinite(current) ? current + 1 : 1;
    localStorage.setItem(SIGNAL_KEY, String(Math.min(next, SIGNAL_THRESHOLD + 1)));
  } catch {
    /* best-effort */
  }
}

export function shouldOfferReviewPrompt(): boolean {
  const state = readState();
  if (state.status === 'done') return false;
  if (state.status === 'snoozed' && typeof state.until === 'number' && Date.now() < state.until) {
    return false;
  }
  const count = Number(localStorage.getItem(SIGNAL_KEY) ?? '0');
  return Number.isFinite(count) && count >= SIGNAL_THRESHOLD;
}

export function snoozeReviewPrompt(): void {
  writeState({ status: 'snoozed', until: Date.now() + SNOOZE_MS });
  try {
    localStorage.setItem(SIGNAL_KEY, '0');
  } catch {
    /* best-effort */
  }
}

export function markReviewPromptDone(): void {
  writeState({ status: 'done' });
}
