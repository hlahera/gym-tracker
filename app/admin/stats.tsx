import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StatCard } from '@/components/StatCard';
import Colors from '@/constants/Colors';
import { spacing, typography } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { getAppStats } from '@/lib/db/repository';
import type { AppStats } from '@/types/database';

export default function AdminStatsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { profile } = useAuth();
  const [stats, setStats] = useState<AppStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    setError(null);
    try {
      const data = await getAppStats();
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar estadísticas');
      setStats(null);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (profile?.is_admin) loadStats();
    else setLoading(false);
  }, [profile?.is_admin, loadStats]);

  if (!profile?.is_admin) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.muted, ...typography.body }}>
          Solo administradores pueden ver estas estadísticas.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  const weeklyRate =
    stats && stats.total_users > 0
      ? `${Math.round((stats.active_7d / stats.total_users) * 100)}%`
      : '0%';

  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadStats();
          }}
          tintColor={colors.tint}
        />
      }>
      <ScreenHeader
        title="Usuarios de la app"
        subtitle="Actividad de cuentas guardadas localmente en este dispositivo."
      />

      {error ? (
        <Card>
          <Text style={{ color: colors.danger, ...typography.body }}>{error}</Text>
        </Card>
      ) : stats ? (
        <>
          <View style={styles.grid}>
            <StatCard label="Total registrados" value={stats.total_users} hint="cuentas" accent />
            <StatCard label="Activos 7 días" value={stats.active_7d} hint="usuarios" />
          </View>
          <View style={styles.grid}>
            <StatCard label="Activos 30 días" value={stats.active_30d} hint="usuarios" />
            <StatCard label="Nuevos 7 días" value={stats.new_users_7d} hint="registros" />
          </View>
          <View style={styles.grid}>
            <StatCard label="Nuevos 30 días" value={stats.new_users_30d} hint="registros" accent />
          </View>

          <Card variant="accent">
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Tasa de uso semanal</Text>
            <Text style={[styles.rateValue, { color: colors.tint }]}>{weeklyRate}</Text>
            <Text style={[styles.rateHint, { color: colors.textSecondary }]}>
              de usuarios activos esta semana
            </Text>
          </Card>

          <Card>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Glosario</Text>
            <Text style={[styles.explain, { color: colors.muted }]}>
              · Total registrados: cuentas creadas{'\n'}
              · Activos 7/30 días: abrieron la app en ese periodo{'\n'}
              · Nuevos 7 días: registros de la última semana
            </Text>
          </Card>
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  grid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  cardTitle: { ...typography.label, marginBottom: spacing.sm },
  rateValue: { ...typography.stat, fontSize: 48 },
  rateHint: { ...typography.body, marginTop: spacing.xs },
  explain: { ...typography.body, lineHeight: 24 },
});
