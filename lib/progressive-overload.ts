import { getISOWeek, getISOWeekYear } from './week-utils';

export type SetRecord = {
  weight: number;
  reps: number;
  completed: boolean;
};

export type SessionSummary = {
  exerciseId: string;
  sets: SetRecord[];
  targetSets: number;
  targetReps: number;
};

/** Peso máximo registrado en una sesión para un ejercicio */
export function getMaxWeightFromSets(sets: SetRecord[]): number {
  if (sets.length === 0) return 0;
  return Math.max(...sets.filter((s) => s.completed).map((s) => s.weight), 0);
}

/** ¿Completó todas las series objetivo con las repeticiones mínimas? */
export function didCompleteTarget(
  sets: SetRecord[],
  targetSets: number,
  targetReps: number,
): boolean {
  const completed = sets.filter((s) => s.completed && s.reps >= targetReps);
  return completed.length >= targetSets;
}

/** @deprecated Usar suggestWeeklyWeight de lib/weight.ts */
export function suggestNextWeight(
  lastMaxWeight: number,
  lastSession: SessionSummary | null,
  increment: number,
): number {
  if (!lastSession || lastMaxWeight <= 0) return 0;

  const completed = didCompleteTarget(
    lastSession.sets,
    lastSession.targetSets,
    lastSession.targetReps,
  );

  if (completed) {
    return Math.round((lastMaxWeight + increment) * 4) / 4;
  }

  return lastMaxWeight;
}

export function getWeekInfo(date: Date = new Date()) {
  return {
    week_year: getISOWeekYear(date),
    week_number: getISOWeek(date),
    weekLabel: `S${getISOWeek(date)} ${getISOWeekYear(date)}`,
  };
}

export { suggestWeeklyWeight, roundWeight, weeksBetween } from './weight';
