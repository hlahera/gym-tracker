import { useLocalSearchParams, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button, Input } from '@/components/ui';
import Colors from '@/constants/Colors';
import { radius, spacing, typography } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { useExercises, useWorkouts } from '@/hooks/useGymData';
import { confirmAlert, showAlert } from '@/lib/alert';
import * as repo from '@/lib/db/repository';
import { DEFAULT_INCREMENT, type WeightUnit, weightLabel } from '@/lib/weight';
import { WEEKDAY_LABELS, weekdayLabel } from '@/lib/weekdays';

type Row = {
  key: string;
  exerciseId?: string;
  name: string;
  weight: string;
  suggested: number;
};

export default function DayWorkoutScreen() {
  const params = useLocalSearchParams<{ dow: string | string[] }>();
  const dowParam = Array.isArray(params.dow) ? params.dow[0] : params.dow;
  const trainingDay = parseInt(dowParam ?? '1', 10);

  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { profile } = useAuth();
  const { exercises, loading, refresh, removeExercise } = useExercises(profile?.id, {
    trainingDay,
  });
  const { getSuggestedWeights, startSession, saveSets } = useWorkouts(profile?.id);

  const weightUnit: WeightUnit = profile?.weight_unit ?? 'lb';
  const increment = profile?.default_weight_increment ?? DEFAULT_INCREMENT[weightUnit];
  const unitLabel = weightLabel(weightUnit);

  const [workoutName, setWorkoutName] = useState('');
  const [dayId, setDayId] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingDay, setLoadingDay] = useState(true);

  const buildRows = useCallback(
    async (list: typeof exercises) => {
      if (!profile?.id) return;
      if (list.length === 0) {
        setRows([{ key: 'new-0', name: '', weight: '', suggested: 0 }]);
        return;
      }
      const ids = list.map((e) => e.id);
      const suggestions = await getSuggestedWeights(ids, [], increment, weightUnit);
      setRows([
        ...list.map((ex) => ({
          key: ex.id,
          exerciseId: ex.id,
          name: ex.name,
          weight: suggestions[ex.id] ? String(suggestions[ex.id]) : '',
          suggested: suggestions[ex.id] ?? 0,
        })),
        { key: `new-${Date.now()}`, name: '', weight: '', suggested: 0 },
      ]);
    },
    [profile?.id, getSuggestedWeights, increment, weightUnit],
  );

  useEffect(() => {
    if (!profile?.id || trainingDay < 0 || trainingDay > 6) return;
    (async () => {
      setLoadingDay(true);
      const days = await repo.listTemplateDays(profile.id);
      const day = days.find((d) => d.day_of_week === trainingDay);
      if (day) {
        setDayId(day.id);
        setWorkoutName(day.name || '');
      }
      setLoadingDay(false);
    })();
  }, [profile?.id, trainingDay]);

  useEffect(() => {
    if (loading) return;
    buildRows(exercises);
  }, [exercises, loading, buildRows]);

  const [savingName, setSavingName] = useState(false);

  const saveWorkoutName = async (): Promise<boolean> => {
    if (!profile?.id) return false;
    const name = workoutName.trim();
    if (!name) return false;
    if (dayId) {
      await repo.updateTemplateDayName(dayId, name);
    } else {
      const day = await repo.ensureTemplateDay(profile.id, trainingDay, name);
      if (day) setDayId(day.id);
    }
    return true;
  };

  const handleSaveDayName = async () => {
    const name = workoutName.trim();
    if (!name) {
      await showAlert('Nombre', 'Escribe qué toca hoy (ej: Pierna, Pecho).');
      return;
    }
    setSavingName(true);
    await saveWorkoutName();
    setSavingName(false);
    await showAlert(
      'Guardado',
      `En la lista principal verás: ${WEEKDAY_LABELS[trainingDay]} · ${name}`,
    );
  };

  const updateRow = (index: number, field: 'name' | 'weight', value: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, { key: `new-${Date.now()}`, name: '', weight: '', suggested: 0 }]);
  };

  const removeRow = async (index: number) => {
    const row = rows[index];
    if (row.exerciseId) {
      const ok = await confirmAlert('Eliminar', `¿Quitar "${row.name}"?`);
      if (!ok) return;
      await removeExercise(row.exerciseId);
      return;
    }
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    const nameSaved = await saveWorkoutName();

    const toSave = rows.filter((r) => r.name.trim() && parseFloat(r.weight) > 0);
    if (toSave.length === 0) {
      if (nameSaved) {
        await showAlert(
          'Guardado',
          `${WEEKDAY_LABELS[trainingDay]} · ${workoutName.trim()} — listo en la pantalla principal.`,
        );
      } else {
        await showAlert('Sin datos', 'Escribe qué toca hoy y/o al menos un ejercicio con peso.');
      }
      return;
    }

    setSaving(true);
    try {
      const sets: { exerciseId: string; weight: number }[] = [];

      for (const row of toSave) {
        let exerciseId = row.exerciseId;
        if (!exerciseId) {
          const result = await repo.addExercise(profile.id, row.name.trim(), trainingDay);
          if (result.error || !result.exerciseId) {
            await showAlert('Error', result.error ?? `No se pudo crear "${row.name}"`);
            setSaving(false);
            return;
          }
          exerciseId = result.exerciseId;
        }
        sets.push({ exerciseId, weight: parseFloat(row.weight) || 0 });
      }

      const { session, error } = await startSession(null);
      if (error || !session) {
        await showAlert('Error', error ?? 'No se pudo guardar');
        setSaving(false);
        return;
      }

      const result = await saveSets(
        session.id,
        sets.map((s) => ({
          session_id: session.id,
          exercise_id: s.exerciseId,
          set_number: 1,
          weight: s.weight,
          reps: 1,
          completed: true,
          from_template: false,
        })),
      );

      if (result.error) await showAlert('Error', result.error);
      else {
        await refresh();
        await showAlert('Guardado', `+${increment} lb la próxima semana automático.`);
      }
    } catch {
      await showAlert('Error', 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  if (trainingDay < 0 || trainingDay > 6) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Día inválido" />
        <Button title="Volver" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  if (loadingDay || loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  const title = workoutName.trim()
    ? `${WEEKDAY_LABELS[trainingDay]} · ${workoutName.trim()}`
    : weekdayLabel(trainingDay);

  return (
    <ScreenContainer keyboardShouldPersistTaps="handled" style={styles.pad}>
      <ScreenHeader title={title} subtitle={`Ejercicio + lb · +${increment} lb/semana`} />

      <Card variant="accent">
        <Input
          label="¿Qué toca hoy?"
          placeholder="Ej: Pierna, Pecho, Espalda..."
          value={workoutName}
          onChangeText={setWorkoutName}
          onBlur={() => {
            void saveWorkoutName();
          }}
        />
        <Text style={[styles.nameHint, { color: colors.textSecondary }]}>
          Aparecerá en la lista como {WEEKDAY_LABELS[trainingDay]}
          {workoutName.trim() ? ` · ${workoutName.trim()}` : ' · …'}
        </Text>
        <Button
          title="Guardar nombre del día"
          variant="secondary"
          size="sm"
          loading={savingName}
          onPress={handleSaveDayName}
        />
      </Card>

      <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
        <Text style={[styles.colHead, styles.nameCol, { color: colors.muted }]}>Ejercicio</Text>
        <Text style={[styles.colHead, styles.weightCol, { color: colors.muted }]}>lb</Text>
        <View style={styles.actionCol} />
      </View>

      {rows.map((row, index) => (
        <Card key={row.key} style={styles.rowCard}>
          <View style={styles.row}>
            <TextInput
              placeholder="Nombre"
              placeholderTextColor={colors.muted}
              value={row.name}
              editable={!row.exerciseId}
              onChangeText={(v) => updateRow(index, 'name', v)}
              style={[
                styles.nameInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: row.exerciseId ? colors.borderSubtle : colors.backgroundElevated,
                },
              ]}
            />
            <TextInput
              placeholder="0"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              value={row.weight}
              onChangeText={(v) => updateRow(index, 'weight', v)}
              style={[
                styles.weightInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.backgroundElevated,
                },
              ]}
            />
            <Pressable onPress={() => removeRow(index)} hitSlop={8} style={styles.actionCol}>
              <Text style={{ color: colors.danger, fontWeight: '600' }}>✕</Text>
            </Pressable>
          </View>
          {row.suggested > 0 && !row.weight && (
            <Text style={[styles.hint, { color: colors.tint }]}>
              Sugerido: {row.suggested} {unitLabel}
            </Text>
          )}
        </Card>
      ))}

      <Button title="+ Añadir ejercicio" variant="secondary" onPress={addRow} />
      <Button title="Guardar" onPress={handleSave} loading={saving} style={{ marginTop: spacing.sm }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pad: { paddingBottom: spacing.xxl },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  colHead: { ...typography.caption, fontWeight: '700', textTransform: 'none' },
  nameCol: { flex: 1 },
  weightCol: { width: 88, textAlign: 'center' },
  actionCol: { width: 24, alignItems: 'center' },
  rowCard: { marginBottom: spacing.sm, paddingVertical: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '600',
  },
  weightInput: {
    width: 88,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  hint: { ...typography.caption, marginTop: spacing.xs, textTransform: 'none' },
  nameHint: {
    ...typography.caption,
    marginBottom: spacing.sm,
    marginTop: -spacing.xs,
    textTransform: 'none',
    fontWeight: '600',
  },
});
