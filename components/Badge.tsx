import { StyleSheet, Text, View, ViewProps } from 'react-native';

import Colors from '@/constants/Colors';
import { radius, typography } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';

type BadgeVariant = 'default' | 'success' | 'warning' | 'accent';

type BadgeProps = ViewProps & {
  label: string;
  variant?: BadgeVariant;
};

export function Badge({ label, variant = 'default', style, ...props }: BadgeProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  const palette = {
    default: { bg: colors.borderSubtle, text: colors.textSecondary },
    success: { bg: colors.successBg, text: colors.success },
    warning: { bg: colors.warningBg, text: colors.warning },
    accent: { bg: colors.tintMuted, text: colors.tint },
  }[variant];

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }, style]} {...props}>
      <Text style={[styles.text, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  text: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'none',
  },
});
