import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import Colors from '@/constants/Colors';
import { spacing, typography } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
};

export function StatCard({ label, value, hint, accent }: StatCardProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <Card
      variant={accent ? 'accent' : 'elevated'}
      style={[styles.card, accent && styles.accentCard]}>
      {accent && <View style={[styles.topBar, { backgroundColor: colors.tint }]} />}
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.value, { color: accent ? colors.tint : colors.text }]}>{value}</Text>
      {hint ? <Text style={[styles.hint, { color: colors.muted }]}>{hint}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 140, marginBottom: 0, overflow: 'hidden' },
  accentCard: { paddingTop: spacing.md + 2 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  label: { ...typography.caption, marginBottom: spacing.xs, fontWeight: '600' },
  value: { ...typography.stat, fontSize: 32 },
  hint: { ...typography.caption, marginTop: spacing.xs, textTransform: 'none' },
});
