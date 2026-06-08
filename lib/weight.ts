export type WeightUnit = 'kg' | 'lb';

export const DEFAULT_INCREMENT: Record<WeightUnit, number> = {
  lb: 10,
  kg: 2.5,
};

export function weightLabel(unit: WeightUnit = 'lb'): string {
  return unit;
}

export function formatWeight(weight: number, unit: WeightUnit = 'lb'): string {
  if (unit === 'lb') return `${roundWeight(weight, unit)} lb`;
  return `${roundWeight(weight, unit)} kg`;
}

export function roundWeight(weight: number, unit: WeightUnit = 'lb'): number {
  if (unit === 'lb') return Math.round(weight * 2) / 2;
  return Math.round(weight * 4) / 4;
}

/** Semanas ISO transcurridas entre dos puntos (>= 0) */
export function weeksBetween(
  fromYear: number,
  fromWeek: number,
  toYear: number,
  toWeek: number,
): number {
  const fromIndex = fromYear * 53 + fromWeek;
  const toIndex = toYear * 53 + toWeek;
  return Math.max(0, toIndex - fromIndex);
}

/**
 * Carga progresiva semanal automática:
 * - Misma semana → mismo peso máximo anterior
 * - Semana nueva → +incremento por cada semana transcurrida (ej. +10 lb)
 */
export function suggestWeeklyWeight(
  lastMaxWeight: number,
  lastWeekYear: number,
  lastWeekNumber: number,
  currentWeekYear: number,
  currentWeekNumber: number,
  increment: number,
  unit: WeightUnit = 'lb',
): number {
  if (lastMaxWeight <= 0) return 0;

  const weeksPassed = weeksBetween(
    lastWeekYear,
    lastWeekNumber,
    currentWeekYear,
    currentWeekNumber,
  );

  if (weeksPassed === 0) {
    return roundWeight(lastMaxWeight, unit);
  }

  return roundWeight(lastMaxWeight + increment * weeksPassed, unit);
}
