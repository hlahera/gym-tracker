import { MUSCLE_GROUPS } from '@/types/database';

export { MUSCLE_GROUPS };

const SEP = '|';

export function serializeMuscleGroups(groups: string[]): string {
  return groups.map((g) => g.trim()).filter(Boolean).join(SEP);
}

export function parseMuscleGroups(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  if (value.includes(SEP)) {
    return value
      .split(SEP)
      .map((g) => g.trim())
      .filter(Boolean);
  }
  return [value.trim()];
}

export function formatMuscleGroups(value: string | null | undefined): string {
  const groups = parseMuscleGroups(value);
  if (groups.length === 0) return 'Sin grupo';
  return groups.join(' · ');
}

export function toggleMuscleGroup(selected: string[], group: string): string[] {
  if (selected.includes(group)) {
    return selected.filter((g) => g !== group);
  }
  return [...selected, group];
}

export function collectMuscleGroupsFromTemplate<T extends { exercise?: { muscle_group?: string | null } }>(
  items: T[],
): string[] {
  const set = new Set<string>();
  for (const item of items) {
    parseMuscleGroups(item.exercise?.muscle_group ?? null).forEach((g) => set.add(g));
  }
  return Array.from(set);
}

export function exerciseMatchesMuscleGroups(
  muscleGroup: string | null | undefined,
  targetGroups: string[],
): boolean {
  if (targetGroups.length === 0) return false;
  const groups = parseMuscleGroups(muscleGroup);
  return groups.some((g) => targetGroups.includes(g));
}

export function sortExercisesForDay<T extends { muscle_group: string | null; name: string }>(
  exercises: T[],
  dayMuscleGroups: string[],
): T[] {
  return [...exercises].sort((a, b) => {
    const aMatch = exerciseMatchesMuscleGroups(a.muscle_group, dayMuscleGroups);
    const bMatch = exerciseMatchesMuscleGroups(b.muscle_group, dayMuscleGroups);
    if (aMatch !== bMatch) return aMatch ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function groupByPrimaryMuscleGroup<
  T extends { exercise?: { muscle_group?: string | null } },
>(items: T[]): { group: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const groups = parseMuscleGroups(item.exercise?.muscle_group ?? null);
    const key = groups[0] ?? 'Sin grupo';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  const order = [...MUSCLE_GROUPS, 'Sin grupo'];
  const extra = [...map.keys()].filter((k) => !order.includes(k));
  return [...order, ...extra]
    .filter((g) => map.has(g))
    .map((g) => ({ group: g, items: map.get(g)! }));
}

export function sortTemplateExercisesByMuscle<
  T extends { exercise?: { muscle_group?: string | null } },
>(items: T[]): T[] {
  const grouped = groupByPrimaryMuscleGroup(items);
  return grouped.flatMap((g) => g.items);
}
