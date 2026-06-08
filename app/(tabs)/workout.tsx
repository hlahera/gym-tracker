import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ScreenHeader } from '@/components/ScreenHeader';
import Colors from '@/constants/Colors';
import { radius, spacing, typography } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { useExercises } from '@/hooks/useGymData';
import * as repo from '@/lib/db/repository';
import { getWeekInfo } from '@/lib/progressive-overload';
import { DEFAULT_INCREMENT } from '@/lib/weight';
import { WEEKDAY_LABELS, WEEKDAY_ORDER } from '@/lib/weekdays';

export default function WorkoutScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { profile } = useAuth();
  const { exercises, loading: exercisesLoading } = useExercises(profile?.id);

  const increment = profile?.default_weight_increment ?? DEFAULT_INCREMENT.lb;
  const week = getWeekInfo();
  const todayDow = new Date().getDay();

  const [dayLabels, setDayLabels] = useState<Record<number, string>>({});
  const [loadingLabels, setLoadingLabels] = useState(true);

  const loadLabels = useCallback(async () => {
    if (!profile?.id) return;
    setLoadingLabels(true);
    const days = await repo.listTemplateDays(profile.id);
    const map: Record<number, string> = {};
    for (const d of days) {
      const name = d.name?.trim();
      if (name && name !== 'Entrenamiento') {
        map[d.day_of_week] = name;
      }
    }
    setDayLabels(map);
    setLoadingLabels(false);
  }, [profile?.id]);

  useFocusEffect(
    useCallback(() => {
      loadLabels();
    }, [loadLabels]),
  );

  const countByDay = useMemo(() => {
    const map: Record<number, number> = {};
    for (const ex of exercises) {
      if (ex.training_day != null) {
        map[ex.training_day] = (map[ex.training_day] ?? 0) + 1;
      }
    }
    return map;
  }, [exercises]);

  const loading = exercisesLoading || loadingLabels;

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Mi gym"
        subtitle={`Semana ${week.week_number} · +${increment} lb automático cada semana`}
      />

      <Card variant="accent">
        <Text style={[styles.hero, { color: colors.textSecondary }]}>
          Toca el día que toca entrenar. Adentro escribes el ejercicio y cuántas lb levantas.
        </Text>
      </Card>

      {loading ? (
        <ActivityIndicator color={colors.tint} style={{ marginTop: spacing.lg }} />
      ) : (
        WEEKDAY_ORDER.map((dow) => {
          const isToday = dow === todayDow;
          const label = dayLabels[dow];
          const count = countByDay[dow] ?? 0;
          return (
            <Pressable
              key={dow}
              onPress={() => router.push({ pathname: '/day/[dow]', params: { dow: String(dow) } })}>
              <Card variant={isToday ? 'accent' : 'default'}>
                <View style={styles.dayRow}>
                  <View style={[styles.dayBadge, { backgroundColor: colors.tintMuted }]}>
                    <Text style={{ color: colors.tint, fontWeight: '800' }}>
                      {WEEKDAY_LABELS[dow].slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dayName, { color: colors.text }]}>
                      {WEEKDAY_LABELS[dow]}
                      {label ? ` · ${label}` : ''}
                      {isToday ? ' (Hoy)' : ''}
                    </Text>
                    <Text style={[styles.dayMeta, { color: colors.muted }]}>
                      {label
                        ? `Toca para anotar ${label.toLowerCase()}`
                        : count > 0
                          ? `${count} ejercicio${count !== 1 ? 's' : ''}`
                          : 'Toca para configurar y anotar'}
                    </Text>
                  </View>
                  <Text style={{ color: colors.tint, fontWeight: '700', fontSize: 20 }}>›</Text>
                </View>
              </Card>
            </Pressable>
          );
        })
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { ...typography.body },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dayBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayName: { ...typography.subtitle, fontSize: 17 },
  dayMeta: { ...typography.caption, marginTop: 2, textTransform: 'none' },
});
