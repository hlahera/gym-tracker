import { StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/Colors';
import { spacing, typography } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function ScreenHeader({ title, subtitle, action }: ScreenHeaderProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  textBlock: { flex: 1 },
  title: { ...typography.hero, fontSize: 26 },
  subtitle: { ...typography.body, marginTop: spacing.xs, fontSize: 14 },
});
