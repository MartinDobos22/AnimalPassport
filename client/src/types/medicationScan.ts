export type ScannedProductType =
  | 'DEWORMING'
  | 'ECTOPARASITE'
  | 'VACCINATION'
  | 'MEDICATION'
  | 'UNKNOWN';

export type ScannedTargetSpecies = 'DOG' | 'CAT' | 'OTHER' | 'UNKNOWN';

export interface ScannedWeightRangeKg {
  min: number | null;
  max: number | null;
}

export interface MedicationScanResult {
  productName: string;
  activeSubstances: string[];
  strength: string;
  manufacturer: string;
  batchNumber: string;
  /** Trvanlivosť balenia z obalu (`YYYY-MM` alebo `YYYY-MM-DD`), NIE dokedy prípravok chráni. */
  packageExpiry: string;
  recordType: ScannedProductType;
  targetSpecies: ScannedTargetSpecies;
  /** Hmotnostný rozsah z obalu — porovnáva sa s hmotnosťou v profile zvieraťa. */
  weightRangeKg: ScannedWeightRangeKg;
  /** Odhad modelu podľa účinnej látky, nie údaj z obalu — v UI označené ako návrh. */
  suggestedIntervalDays: number | null;
  intervalRationale: string;
  dosageNote: string;
  warnings: string[];
  confidence: 'high' | 'medium' | 'low';
  summary: string;
}

/** Typ záznamu, ktorý sa dá reálne uložiť — `UNKNOWN` sa pred uložením musí rozhodnúť. */
export type ScanTargetType = Exclude<ScannedProductType, 'UNKNOWN'>;
