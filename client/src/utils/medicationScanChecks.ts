import type { MedicationScanResult, ScannedTargetSpecies } from '../types/medicationScan';
import type { AnimalType } from '../constants/animalSpecies';

export type ScanAlertSeverity = 'error' | 'warning' | 'info';

export type ScanAlertCode =
  | 'PACKAGE_EXPIRED'
  | 'PACKAGE_EXPIRING_SOON'
  | 'WEIGHT_BELOW_RANGE'
  | 'WEIGHT_ABOVE_RANGE'
  | 'WEIGHT_UNKNOWN'
  | 'SPECIES_MISMATCH'
  | 'LOW_CONFIDENCE'
  | 'TYPE_UNKNOWN';

export interface ScanAlert {
  code: ScanAlertCode;
  severity: ScanAlertSeverity;
  params?: Record<string, string | number>;
}

const EXPIRING_SOON_DAYS = 60;
const DAY_MS = 1000 * 60 * 60 * 24;

const lastDayOfMonth = (year: number, month: number): number =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

/**
 * Na obaloch je expirácia spravidla len mesiac/rok a znamená „použiteľné do konca
 * toho mesiaca" — preto sa `YYYY-MM` normalizuje na posledný deň mesiaca, nie prvý.
 */
export function packageExpiryToIso(expiry: string): string | null {
  const trimmed = expiry.trim();
  if (!trimmed) return null;

  const full = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (full) {
    const date = new Date(`${trimmed}T00:00:00Z`);
    return Number.isNaN(date.getTime()) ? null : trimmed;
  }

  const monthOnly = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (monthOnly) {
    const year = Number(monthOnly[1]);
    const month = Number(monthOnly[2]);
    if (month < 1 || month > 12) return null;
    const day = lastDayOfMonth(year, month);
    return `${monthOnly[1]}-${monthOnly[2]}-${String(day).padStart(2, '0')}`;
  }

  return null;
}

export function formatPackageExpiry(expiry: string, locale = 'sk-SK'): string {
  const trimmed = expiry.trim();
  const monthOnly = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (monthOnly) {
    const date = new Date(Date.UTC(Number(monthOnly[1]), Number(monthOnly[2]) - 1, 1));
    return date.toLocaleDateString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
  const iso = packageExpiryToIso(trimmed);
  if (!iso) return trimmed;
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function speciesMatches(target: ScannedTargetSpecies, animalType: AnimalType): boolean {
  if (target === 'UNKNOWN' || target === 'OTHER') return true;
  if (target === 'DOG') return animalType === 'dog';
  return animalType === 'cat';
}

interface BuildScanAlertsInput {
  scan: MedicationScanResult;
  dateGiven: string;
  animalType?: AnimalType;
  weightKg?: number;
}

/**
 * Bezpečnostné kontroly bežia deterministicky na klientovi (nie v AI promptu) —
 * model iba prečíta obal, porovnanie s profilom zvieraťa robí appka.
 */
export function buildScanAlerts({
  scan,
  dateGiven,
  animalType,
  weightKg,
}: BuildScanAlertsInput): ScanAlert[] {
  const alerts: ScanAlert[] = [];

  const expiryIso = packageExpiryToIso(scan.packageExpiry);
  if (expiryIso && dateGiven) {
    const expiry = new Date(`${expiryIso}T00:00:00Z`).getTime();
    const given = new Date(`${dateGiven}T00:00:00Z`).getTime();
    if (!Number.isNaN(expiry) && !Number.isNaN(given)) {
      if (expiry < given) {
        alerts.push({
          code: 'PACKAGE_EXPIRED',
          severity: 'error',
          params: { expiry: formatPackageExpiry(scan.packageExpiry) },
        });
      } else if ((expiry - given) / DAY_MS <= EXPIRING_SOON_DAYS) {
        alerts.push({
          code: 'PACKAGE_EXPIRING_SOON',
          severity: 'warning',
          params: { expiry: formatPackageExpiry(scan.packageExpiry) },
        });
      }
    }
  }

  const { min, max } = scan.weightRangeKg;
  const hasRange = min !== null || max !== null;
  if (hasRange && typeof weightKg === 'number' && weightKg > 0) {
    if (min !== null && weightKg < min) {
      alerts.push({
        code: 'WEIGHT_BELOW_RANGE',
        severity: 'error',
        params: { weight: weightKg, min },
      });
    } else if (max !== null && weightKg > max) {
      alerts.push({
        code: 'WEIGHT_ABOVE_RANGE',
        severity: 'warning',
        params: { weight: weightKg, max },
      });
    }
  } else if (hasRange) {
    alerts.push({
      code: 'WEIGHT_UNKNOWN',
      severity: 'info',
      params: {
        min: min ?? '?',
        max: max ?? '?',
      },
    });
  }

  if (animalType && !speciesMatches(scan.targetSpecies, animalType)) {
    alerts.push({ code: 'SPECIES_MISMATCH', severity: 'warning' });
  }

  if (scan.recordType === 'UNKNOWN') {
    alerts.push({ code: 'TYPE_UNKNOWN', severity: 'info' });
  }

  if (scan.confidence === 'low') {
    alerts.push({ code: 'LOW_CONFIDENCE', severity: 'warning' });
  }

  return alerts;
}
