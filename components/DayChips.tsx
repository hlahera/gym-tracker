import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import Colors from '@/constants/Colors';
import { radius, spacing, typography } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { WEEKDAY_LABELS, WEEKDAY_ORDER } from '@/lib/weekdays';

type DayChipsProps = {
  selected: number;
  onSelect: (day: number) => void;
  compact?: boolean;
};

export function DayChips({ selected, onSelect, compact = false }: DayChipsProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      {WEEKDAY_ORDER.map((dow) => {
        const active = selected === dow;
        const label = compact ? WEEKDAY_LABELS[dow].slice(0, 3) : WEEKDAY_LABELS[dow];
        return (
          <Pressable
            key={dow}
            onPress={() => onSelect(dow)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.tint : colors.backgroundElevated,
                borderColor: active ? colors.tint : colors.border,
              },
            ]}>
            <Text
              style={{
                color: active ? colors.onTint : colors.text,
                fontWeight: '700',
                fontSize: compact ? 12 : 13,
              }}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { marginBottom: spacing.sm, flexGrow: 0 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
});
