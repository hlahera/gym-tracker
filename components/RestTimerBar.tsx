import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import Colors from '@/constants/Colors';
import { radius, spacing, typography } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { formatRestTime } from '@/hooks/useRestTimer';

type RestTimerBarProps = {
  remaining: number;
  total: number;
  progress: number;
  state: 'idle' | 'running' | 'finished';
  label?: string | null;
  onSkip: () => void;
  onDismiss: () => void;
  onAdjust: (delta: number) => void;
};

export function RestTimerBar({
  remaining,
  total,
  progress,
  state,
  label,
  onSkip,
  onDismiss,
  onAdjust,
}: RestTimerBarProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const isFinished = state === 'finished';

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: isFinished ? colors.successBg : colors.card,
          borderColor: isFinished ? colors.success : colors.tint,
        },
      ]}>
      <View style={[styles.progressTrack, { backgroundColor: colors.borderSubtle }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: isFinished ? colors.success : colors.tint,
              width: `${Math.max((isFinished ? 0 : progress) * 100, 2)}%`,
            },
          ]}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: isFinished ? colors.success : colors.text }]}>
            {isFinished ? '¡Descanso terminado!' : 'Descanso'}
          </Text>
          {label && !isFinished ? (
            <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
              {label}
            </Text>
          ) : null}
        </View>

        {!isFinished ? (
          <Text style={[styles.time, { color: colors.tint }]}>{formatRestTime(remaining)}</Text>
        ) : null}
      </View>

      {isFinished ? (
        <Button title="Continuar" onPress={onDismiss} size="sm" />
      ) : (
        <View style={styles.actions}>
          <Pressable
            onPress={() => onAdjust(-15)}
            style={[styles.chipBtn, { borderColor: colors.border, backgroundColor: colors.backgroundElevated }]}>
            <Text style={[styles.chipText, { color: colors.textSecondary }]}>-15s</Text>
          </Pressable>
          <Pressable
            onPress={onSkip}
            style={[styles.chipBtn, { borderColor: colors.border, backgroundColor: colors.backgroundElevated }]}>
            <Text style={[styles.chipText, { color: colors.textSecondary }]}>Saltar</Text>
          </Pressable>
          <Pressable
            onPress={() => onAdjust(15)}
            style={[styles.chipBtn, { borderColor: colors.tint, backgroundColor: colors.tintMuted }]}>
            <Text style={[styles.chipText, { color: colors.tint }]}>+15s</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  progressTrack: { height: 4, borderRadius: 2, marginBottom: spacing.md, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  textBlock: { flex: 1 },
  title: { ...typography.subtitle, fontSize: 16 },
  label: { ...typography.caption, marginTop: 2, textTransform: 'none' },
  time: { ...typography.stat, fontSize: 36 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  chipBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  chipText: { fontSize: 13, fontWeight: '700' },
});
