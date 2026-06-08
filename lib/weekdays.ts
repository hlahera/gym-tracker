/** 0 = Domingo … 6 = Sábado (igual que Date.getDay()) */
export const WEEKDAY_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

/** Orden habitual: Lunes → Domingo */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export function weekdayLabel(day: number): string {
  return WEEKDAY_LABELS[day] ?? 'Día';
}

export function isValidWeekday(day: number): boolean {
  return day >= 0 && day <= 6;
}
