import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import Colors from '@/constants/Colors';
import { radius, shadow, spacing, typography } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'sm';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  style,
  fullWidth = true,
}: ButtonProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const isDark = scheme === 'dark';

  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isGhost = variant === 'ghost';
  const isDanger = variant === 'danger';

  const bg = isPrimary ? colors.tint : isDanger ? colors.danger : 'transparent';

  const textColor = isPrimary
    ? colors.onTint
    : isDanger
      ? '#FFFFFF'
      : isGhost
        ? colors.tint
        : colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        size === 'sm' && styles.buttonSm,
        fullWidth && styles.fullWidth,
        {
          backgroundColor: bg,
          borderColor: isSecondary ? colors.border : isPrimary ? colors.tint : 'transparent',
          opacity: disabled ? 0.4 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        isPrimary && shadow('sm', isDark),
        (isSecondary || isGhost) && styles.bordered,
        Platform.OS === 'web' && ({ cursor: disabled || loading ? 'not-allowed' : 'pointer' } as object),
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, size === 'sm' && styles.textSm, { color: textColor }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function Input({ label, error, style, ...props }: InputProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <View style={styles.inputWrap}>
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.backgroundElevated,
            borderColor: error ? colors.danger : colors.border,
          },
          style,
        ]}
        {...props}
      />
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

export function SectionTitle({ title, style }: { title: string; style?: TextStyle }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <View style={styles.sectionRow}>
      <View style={[styles.sectionLine, { backgroundColor: colors.tint }]} />
      <Text style={[styles.sectionTitle, { color: colors.text }, style]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
    minHeight: 48,
  },
  buttonSm: {
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    minHeight: 36,
    marginVertical: 0,
  },
  fullWidth: { width: '100%' },
  bordered: { borderWidth: 1 },
  text: { ...typography.subtitle, fontSize: 15, fontWeight: '600' },
  textSm: { fontSize: 13, fontWeight: '600' },
  inputWrap: { marginBottom: spacing.md },
  label: { ...typography.caption, marginBottom: spacing.xs, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    fontSize: 15,
  },
  error: { ...typography.caption, marginTop: spacing.xs, textTransform: 'none' },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  sectionLine: { width: 3, height: 16, borderRadius: 2 },
  sectionTitle: { ...typography.subtitle, fontSize: 16 },
});
