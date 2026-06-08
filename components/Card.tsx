import { StyleSheet, View, ViewProps } from 'react-native';

import Colors from '@/constants/Colors';
import { greenGlow, radius, shadow, spacing } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';

type CardProps = ViewProps & {
  variant?: 'default' | 'elevated' | 'accent';
};

export function Card({ style, variant = 'elevated', ...props }: CardProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const isDark = scheme === 'dark';

  const variantStyle =
    variant === 'accent'
      ? {
          backgroundColor: colors.tintMuted,
          borderColor: isDark ? 'rgba(0,230,118,0.25)' : colors.tint,
        }
      : { backgroundColor: colors.card, borderColor: colors.border };

  return (
    <View
      style={[
        styles.card,
        variantStyle,
        variant === 'elevated' && shadow('sm', isDark),
        variant === 'accent' && isDark && greenGlow(isDark),
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
});
