import { useCallback, useEffect, useRef, useState } from 'react';

import * as repo from '@/lib/db/repository';
import { getWeekInfo, suggestWeeklyWeight } from '@/lib/progressive-overload';
import type { WeightUnit } from '@/lib/weight';
import type {
  Exercise,
  MuscleGroup,
  TemplateDay,
  TemplateExercise,
  WorkoutSession,
  WorkoutSet,
} from '@/types/database';

export function useMuscleGroups(userId: string | undefined) {
  const [groups, setGroups] = useState<MuscleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const firstLoad = useRef(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setGroups([]);
      setLoading(false);
      return;
    }
    const showLoader = firstLoad.current;
    if (showLoader) setLoading(true);
    try {
      setGroups(await repo.listMuscleGroups(userId));
    } catch {
      setGroups([]);
    } finally {
      if (showLoader) {
        setLoading(false);
        firstLoad.current = false;
      }
    }
  }, [userId]);

  useEffect(() => {
    firstLoad.current = true;
    refresh();
  }, [refresh]);

  const addGroup = async (name: string) => {
    if (!userId) return { error: 'Sin sesión' };
    const result = await repo.addMuscleGroup(userId, name);
    if (!result.error) await refresh();
    return result;
  };

  const removeGroup = async (groupId: string) => {
    if (!userId) return { error: 'Sin sesión' };
    await repo.deleteMuscleGroup(userId, groupId);
    await refresh();
    return { error: null };
  };

  return { groups, loading, refresh, addGroup, removeGroup };
}

export function useExercises(
  userId: string | undefined,
  filters?: { groupId?: string; trainingDay?: number },
) {
  const groupId = filters?.groupId;
  const trainingDay = filters?.trainingDay;
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const firstLoad = useRef(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setExercises([]);
      setLoading(false);
      return;
    }
    const showLoader = firstLoad.current;
    if (showLoader) setLoading(true);
    setError(null);
    try {
      let list: Exercise[];
      if (trainingDay !== undefined) {
        list = await repo.listExercisesByDay(userId, trainingDay);
      } else if (groupId) {
        list = await repo.listExercisesByGroup(userId, groupId);
      } else {
        list = await repo.listExercises(userId);
      }
      setExercises(list);
    } catch {
      setError('No se pudieron cargar los ejercicios');
    } finally {
      if (showLoader) {
        setLoading(false);
        firstLoad.current = false;
      }
    }
  }, [userId, groupId, trainingDay]);

  useEffect(() => {
    firstLoad.current = true;
    refresh();
  }, [refresh]);

  const addExercise = async (name: string, trainingDay: number) => {
    if (!userId) return { error: 'Sin sesión' };
    const trimmed = name.trim();
    if (!trimmed) return { error: 'El nombre no puede estar vacío' };
    try {
      const result = await repo.addExercise(userId, trimmed, trainingDay);
      if (!result.error) await refresh();
      return result;
    } catch {
      return { error: 'No se pudo guardar el ejercicio' };
    }
  };

  const removeExercise = async (exerciseId: string) => {
    if (!userId) return { error: 'Sin sesión' };
    try {
      await repo.deleteExercise(userId, exerciseId);
      await refresh();
      return { error: null };
    } catch {
      return { error: 'No se pudo eliminar el ejercicio' };
    }
  };

  return { exercises, loading, error, refresh, addExercise, removeExercise };
}

export function useTemplate(userId: string | undefined) {
  const [days, setDays] = useState<TemplateDay[]>([]);
  const [exercisesByDay, setExercisesByDay] = useState<Record<string, TemplateExercise[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstLoad = useRef(true);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (!userId) {
      setDays([]);
      setExercisesByDay({});
      setLoading(false);
      return;
    }

    const silent = options?.silent ?? !firstLoad.current;
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const templateDays = await repo.listTemplateDays(userId);
      setDays(templateDays);

      if (templateDays.length === 0) {
        setExercisesByDay({});
        return;
      }

      const dayIds = templateDays.map((d) => d.id);
      const allExercises = await repo.listTemplateExercises(dayIds);
      const grouped: Record<string, TemplateExercise[]> = {};
      for (const day of templateDays) grouped[day.id] = [];
      for (const row of allExercises) {
        grouped[row.template_day_id]?.push(row);
      }
      setExercisesByDay(grouped);
    } catch {
      setError('No se pudo cargar la plantilla');
    } finally {
      if (silent) setRefreshing(false);
      else {
        setLoading(false);
        firstLoad.current = false;
      }
    }
  }, [userId]);

  useEffect(() => {
    firstLoad.current = true;
    refresh();
  }, [refresh]);

  const ensureDay = async (dayOfWeek: number, name: string) => {
    if (!userId) return null;
    const existing = days.find((d) => d.day_of_week === dayOfWeek);
    if (existing) return existing;
    try {
      const day = await repo.ensureTemplateDay(userId, dayOfWeek, name);
      if (day) await refresh({ silent: true });
      return day;
    } catch {
      return null;
    }
  };

  const addToTemplate = async (
    dayId: string,
    exerciseId: string,
    targetSets = 3,
    targetReps = 8,
  ) => {
    const current = exercisesByDay[dayId] ?? [];
    const result = await repo.addTemplateExercise(dayId, exerciseId, current.length, targetSets, targetReps);
    if (!result.error) await refresh({ silent: true });
    return result;
  };

  const removeFromTemplate = async (templateExerciseId: string) => {
    await repo.removeTemplateExercise(templateExerciseId);
    await refresh({ silent: true });
  };

  const renameDay = async (dayId: string, name: string) => {
    const result = await repo.updateTemplateDayName(dayId, name);
    if (!result.error) await refresh({ silent: true });
    return result;
  };

  const updateExerciseTargets = async (templateExerciseId: string, sets: number, reps: number) => {
    const result = await repo.updateTemplateExercise(templateExerciseId, sets, reps);
    if (!result.error) await refresh({ silent: true });
    return result;
  };

  return {
    days,
    exercisesByDay,
    loading,
    refreshing,
    error,
    refresh,
    ensureDay,
    addToTemplate,
    removeFromTemplate,
    renameDay,
    updateExerciseTargets,
  };
}

export function useWorkouts(userId: string | undefined) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const firstLoad = useRef(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setSessions([]);
      setLoading(false);
      return;
    }
    const showLoader = firstLoad.current;
    if (showLoader) setLoading(true);
    try {
      setSessions(await repo.listWorkoutSessions(userId));
    } finally {
      if (showLoader) {
        setLoading(false);
        firstLoad.current = false;
      }
    }
  }, [userId]);

  useEffect(() => {
    firstLoad.current = true;
    refresh();
  }, [refresh]);

  const getSessionSets = useCallback(
    (sessionId: string) => repo.getSessionSets(sessionId),
    [],
  );

  const getSuggestedWeights = useCallback(
    async (
      exerciseIds: string[],
      _templateExercises: TemplateExercise[],
      increment: number,
      unit: WeightUnit = 'lb',
    ) => {
      const suggestions: Record<string, number> = {};
      if (!userId) return suggestions;

      const currentWeek = getWeekInfo();

      for (const exerciseId of exerciseIds) {
        const last = await repo.getLastExerciseSessionStats(userId, exerciseId);

        if (!last || last.maxWeight <= 0) {
          suggestions[exerciseId] = 0;
          continue;
        }

        suggestions[exerciseId] = suggestWeeklyWeight(
          last.maxWeight,
          last.week_year,
          last.week_number,
          currentWeek.week_year,
          currentWeek.week_number,
          increment,
          unit,
        );
      }

      return suggestions;
    },
    [userId],
  );

  const startSession = async (templateDayId: string | null) => {
    if (!userId) return { session: null, error: 'Sin sesión' };
    const week = getWeekInfo();
    const today = new Date().toISOString().slice(0, 10);
    const result = await repo.startWorkoutSession(
      userId,
      templateDayId,
      week.week_year,
      week.week_number,
      today,
    );
    if (!result.error) await refresh();
    return result;
  };

  const saveSets = async (
    sessionId: string,
    sets: Omit<WorkoutSet, 'id' | 'created_at' | 'exercise'>[],
  ) => {
    try {
      await repo.saveWorkoutSets(sessionId, sets);
      await refresh();
      return { error: null };
    } catch {
      return { error: 'No se pudo guardar el entrenamiento' };
    }
  };

  return {
    sessions,
    loading,
    refresh,
    getSessionSets,
    startSession,
    saveSets,
    getSuggestedWeights,
  };
}

export function useExerciseProgress(userId: string | undefined, exerciseId: string | undefined) {
  const [progress, setProgress] = useState<{ weekLabel: string; maxWeight: number }[]>([]);

  useEffect(() => {
    if (!userId || !exerciseId) return;
    repo.getExerciseProgress(userId, exerciseId).then(setProgress).catch(() => setProgress([]));
  }, [userId, exerciseId]);

  return progress;
}
