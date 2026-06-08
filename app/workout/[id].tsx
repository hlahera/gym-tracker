import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/ui';
import Colors from '@/constants/Colors';
import { radius, spacing, typography } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { useExercises, useWorkouts } from '@/hooks/useGymData';
import { showAlert } from '@/lib/alert';
import { DEFAULT_INCREMENT, formatWeight, type WeightUnit, weightLabel } from '@/lib/weight';
import type { WorkoutSet } from '@/types/database';

type Entry = {
  exerciseId: string;
  name: string;
  weight: string;
  suggested: number;
};

export default function WorkoutSessionScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const sessionId = Array.isArray(params.id) ? params.id[0] : params.id;
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { profile } = useAuth();
  const { exercises, loading: exercisesLoading } = useExercises(profile?.id);
  const { getSessionSets, saveSets, getSuggestedWeights } = useWorkouts(profile?.id);

  const weightUnit: WeightUnit = profile?.weight_unit ?? 'lb';
  const increment = profile?.default_weight_increment ?? DEFAULT_INCREMENT[weightUnit];
  const unitLabel = weightLabel(weightUnit);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const loadedRef = useRef<string | null>(null);

  useEffect(() => {
    loadedRef.current = null;
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !profile?.id || exercisesLoading) return;
    if (loadedRef.current === sessionId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);

      const existingSets = await getSessionSets(sessionId);
      if (cancelled) return;

      if (existingSets.length > 0) {
        setEntries(fromExistingSets(existingSets));
        setLoading(false);
        loadedRef.current = sessionId;
        return;
      }

      const ids = exercises.map((e) => e.id);
      const suggestions = await getSuggestedWeights(ids, [], increment, weightUnit);
      if (cancelled) return;

      setEntries(
        exercises.map((ex) => ({
          exerciseId: ex.id,
          name: ex.name,
          weight: String(suggestions[ex.id] ?? ''),
          suggested: suggestions[ex.id] ?? 0,
        })),
      );
      setLoading(false);
      loadedRef.current = sessionId;
    })();

    return () => {
      cancelled = true;
    };
  }, [
    sessionId,
    profile?.id,
    exercises,
    exercisesLoading,
    increment,
    weightUnit,
    getSessionSets,
    getSuggestedWeights,
  ]);

  const updateWeight = (index: number, value: string) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, weight: value } : e)),
    );
  };

  const handleSave = async () => {
    if (!sessionId) return;

    const withWeight = entries.filter((e) => parseFloat(e.weight) > 0);
    if (withWeight.length === 0) {
      await showAlert('Sin pesos', 'Escribe al menos un peso antes de guardar.');
      return;
    }

    setSaving(true);
    try {
      const flatSets: Omit<WorkoutSet, 'id' | 'created_at' | 'exercise'>[] = withWeight.map(
        (entry) => ({
          session_id: sessionId,
          exercise_id: entry.exerciseId,
          set_number: 1,
          weight: parseFloat(entry.weight) || 0,
          reps: 1,
          completed: true,
          from_template: false,
        }),
      );

      const result = await saveSets(sessionId, flatSets);
      if (result.error) {
        await showAlert('Error', result.error);
      } else {
        router.back();
      }
    } catch {
      await showAlert('Error', 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  return (
    <ScreenContainer keyboardShouldPersistTaps="handled" style={styles.scrollPad}>
      <ScreenHeader
        title="Anotar pesos"
        subtitle={`Solo escribe el peso en ${unitLabel} · +${increment} lb la próxima semana`}
      />

      {entries.length === 0 ? (
        <Card>
          <Text style={[styles.empty, { color: colors.muted }]}>
            No tienes ejercicios. Vuelve atrás y añade algunos.
          </Text>
          <Button title="Volver" onPress={() => router.back()} />
        </Card>
      ) : (
        entries.map((entry, idx) => (
          <Card key={entry.exerciseId}>
            <Text style={[styles.exerciseName, { color: colors.text }]}>{entry.name}</Text>
            {entry.suggested > 0 && (
              <Badge
                label={`Sugerido: ${formatWeight(entry.suggested, weightUnit)}`}
                variant="accent"
                style={{ marginBottom: spacing.sm, alignSelf: 'flex-start' }}
              />
            )}
            <Text style={[styles.label, { color: colors.muted }]}>Peso ({unitLabel})</Text>
            <TextInput
              placeholder="0"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              value={entry.weight}
              onChangeText={(v) => updateWeight(idx, v)}
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.backgroundElevated,
                },
              ]}
            />
          </Card>
        ))
      )}

      {entries.length > 0 && (
        <View style={styles.saveWrap}>
          <Button title="Guardar" onPress={handleSave} loading={saving} />
        </View>
      )}
    </ScreenContainer>
  );
}

function fromExistingSets(sets: WorkoutSet[]): Entry[] {
  const map = new Map<string, Entry>();

  for (const s of sets) {
    const existing = map.get(s.exercise_id);
    const weight = String(s.weight);
    if (!existing || s.weight > parseFloat(existing.weight)) {
      map.set(s.exercise_id, {
        exerciseId: s.exercise_id,
        name: s.exercise?.name ?? 'Ejercicio',
        weight,
        suggested: 0,
      });
    }
  }

  return Array.from(map.values());
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { ...typography.body, marginBottom: spacing.md },
  exerciseName: { ...typography.subtitle, marginBottom: spacing.sm },
  label: { ...typography.caption, marginBottom: spacing.xs, textTransform: 'none' },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  saveWrap: { marginTop: spacing.md, marginBottom: spacing.xxl },
  scrollPad: { paddingBottom: spacing.xxl },
});
