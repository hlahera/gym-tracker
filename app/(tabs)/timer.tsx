import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { RestTimerBar } from '@/components/RestTimerBar';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button, Input } from '@/components/ui';
import Colors from '@/constants/Colors';
import { radius, spacing, typography } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { useRestTimerContext } from '@/contexts/RestTimerContext';
import { formatRestTime } from '@/hooks/useRestTimer';
import { updateProfileRestSeconds } from '@/lib/db/repository';

const REST_PRESETS = [60, 90, 120, 150, 180];

export default function TimerScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { profile, refreshProfile } = useAuth();
  const timer = useRestTimerContext();

  const defaultRest = profile?.default_rest_seconds ?? 90;
  const [selectedSeconds, setSelectedSeconds] = useState(defaultRest);
  const [customSeconds, setCustomSeconds] = useState(String(defaultRest));
  const [savingRest, setSavingRest] = useState(false);

  useEffect(() => {
    setSelectedSeconds(defaultRest);
    setCustomSeconds(String(defaultRest));
  }, [defaultRest]);

  const saveDefaultRest = async (seconds: number) => {
    if (!profile) return;
    setSavingRest(true);
    await updateProfileRestSeconds(profile.id, seconds);
    await refreshProfile();
    setSelectedSeconds(seconds);
    setCustomSeconds(String(seconds));
    setSavingRest(false);
  };

  const handleStart = () => {
    timer.start(selectedSeconds, 'Descanso entre series');
  };

  const isIdle = timer.state === 'idle';
  const isRunning = timer.state === 'running';
  const isFinished = timer.state === 'finished';

  return (
    <ScreenContainer keyboardShouldPersistTaps="handled">
      <ScreenHeader
        title="Descanso"
        subtitle="Cronómetro para saber cuándo termina tu descanso"
      />

      <Card variant="accent" style={styles.timerCard}>
        {isIdle ? (
          <>
            <Text style={[styles.bigTime, { color: colors.tint }]}>
              {formatRestTime(selectedSeconds)}
            </Text>
            <Text style={[styles.timerHint, { color: colors.textSecondary }]}>
              Pulsa iniciar al terminar una serie
            </Text>
            <Button title="Iniciar descanso" onPress={handleStart} />
          </>
        ) : isRunning ? (
          <>
            <Text style={[styles.bigTime, { color: colors.tint }]}>
              {formatRestTime(timer.remaining)}
            </Text>
            <Text style={[styles.timerHint, { color: colors.textSecondary }]}>
              Tiempo restante
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.bigTime, { color: colors.success }]}>0:00</Text>
            <Text style={[styles.doneTitle, { color: colors.success }]}>
              ¡Descanso terminado!
            </Text>
            <Text style={[styles.timerHint, { color: colors.textSecondary }]}>
              Ya puedes hacer la siguiente serie
            </Text>
            <Button title="Continuar" onPress={timer.dismissFinished} />
            <Button
              title="Descanso de nuevo"
              variant="secondary"
              onPress={handleStart}
              style={{ marginTop: spacing.sm }}
            />
          </>
        )}
      </Card>

      {(isRunning || isFinished) && (
        <RestTimerBar
          remaining={timer.remaining}
          total={timer.total}
          progress={timer.progress}
          state={timer.state}
          label={timer.label}
          onSkip={timer.skip}
          onDismiss={timer.dismissFinished}
          onAdjust={timer.adjust}
        />
      )}

      {isIdle && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Duración del descanso
          </Text>
          <View style={styles.presetRow}>
            {REST_PRESETS.map((sec) => {
              const active = selectedSeconds === sec;
              return (
                <Pressable
                  key={sec}
                  disabled={savingRest}
                  onPress={() => saveDefaultRest(sec)}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: active ? colors.tint : colors.backgroundElevated,
                      borderColor: active ? colors.tint : colors.border,
                    },
                  ]}>
                  <Text
                    style={{
                      color: active ? colors.onTint : colors.text,
                      fontWeight: '700',
                      fontSize: 13,
                    }}>
                    {sec >= 60 ? `${sec / 60} min` : `${sec}s`}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.customRow}>
            <Input
              label="Personalizado (segundos)"
              placeholder="90"
              keyboardType="number-pad"
              value={customSeconds}
              onChangeText={setCustomSeconds}
              style={styles.customInput}
            />
            <Button
              title="Usar"
              variant="secondary"
              size="sm"
              fullWidth={false}
              loading={savingRest}
              onPress={() => {
                const parsed = parseInt(customSeconds, 10);
                if (parsed >= 15 && parsed <= 600) saveDefaultRest(parsed);
              }}
              style={styles.customBtn}
            />
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  timerCard: { alignItems: 'center', paddingVertical: spacing.xl },
  bigTime: { ...typography.stat, fontSize: 72, fontWeight: '800', letterSpacing: -2 },
  doneTitle: { ...typography.subtitle, fontSize: 20, marginTop: spacing.sm, marginBottom: spacing.xs },
  timerHint: { ...typography.body, textAlign: 'center', marginVertical: spacing.md },
  sectionLabel: {
    ...typography.caption,
    marginBottom: spacing.sm,
    textTransform: 'none',
    fontWeight: '600',
  },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  customRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  customInput: { flex: 1, marginBottom: 0 },
  customBtn: { marginBottom: spacing.xs, minWidth: 88 },
});
