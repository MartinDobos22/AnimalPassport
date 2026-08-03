import type { WeightLog } from '../types/petHealth';

export interface WeightTrend {
  points: { date: string; kg: number }[];
  latest: number;
  previous: number;
  deltaKg: number;
  deltaPct: number;
  direction: 'up' | 'down' | 'flat';
}

const FLAT_THRESHOLD_KG = 0.05;

export function computeWeightTrend(logs: WeightLog[]): WeightTrend | null {
  const points = logs
    .filter((l) => Number.isFinite(l.kg) && l.kg > 0)
    .map((l) => ({ date: l.date, kg: l.kg }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (points.length < 2) return null;

  const latest = points[points.length - 1].kg;
  const previous = points[points.length - 2].kg;
  const deltaKg = latest - previous;
  const deltaPct = previous !== 0 ? (deltaKg / previous) * 100 : 0;
  const direction = Math.abs(deltaKg) < FLAT_THRESHOLD_KG ? 'flat' : deltaKg > 0 ? 'up' : 'down';

  return { points, latest, previous, deltaKg, deltaPct, direction };
}

export function sparklinePath(values: number[], width: number, height: number, pad = 2): string {
  if (values.length < 2) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = (width - pad * 2) / (values.length - 1);
  return values
    .map((v, i) => {
      const x = pad + i * stepX;
      const y = pad + (height - pad * 2) * (1 - (v - min) / span);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}
