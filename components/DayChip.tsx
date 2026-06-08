import { Pressable, StyleSheet, Text } from 'react-native';

import Colors from '@/constants/Colors';
import { radius, typography } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';

type DayChipProps = {
  label: string;
  active?: boolean;
  onPress: () => void;
};

export function DayChip({ label, active, onPress }: DayChipProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.tint : colors.card,
          borderColor: active ? colors.tint : colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <Text
        style={[
          styles.label,
          { color: active ? colors.onTint : colors.textSecondary },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.full,
    borderWidth: 1,
    marginRight: 8,
  },
  label: { ...typography.caption, fontWeight: '700', textTransform: 'none', fontSize: 13 },
});
