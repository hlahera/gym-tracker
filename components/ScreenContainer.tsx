import {
  Platform,
  RefreshControl,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import Colors from '@/constants/Colors';
import { layout, spacing } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';

type ScreenContainerProps = Omit<ScrollViewProps, 'children'> & {
  scroll?: boolean;
  padded?: boolean;
  children: React.ReactNode;
};

export function ScreenContainer({
  scroll = true,
  padded = true,
  style,
  children,
  refreshControl,
  ...props
}: ScreenContainerProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { width } = useWindowDimensions();
  const isWide = width > layout.maxContentWidth + 48;
  const isWeb = Platform.OS === 'web';

  const inner = (
    <View style={[styles.inner, isWide && { maxWidth: layout.maxContentWidth }]}>{children}</View>
  );

  const padStyle = padded && styles.padded;
  const bgStyle = { backgroundColor: colors.background };

  if (!scroll) {
    return (
      <View style={[styles.fill, styles.center, bgStyle, padStyle, style]} {...props}>
        {isWeb && <View style={[styles.topAccent, { backgroundColor: colors.tint }]} />}
        {inner}
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.fill, bgStyle]}
      contentContainerStyle={[styles.center, padStyle, styles.scrollContent, style]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
      {...props}>
      {isWeb && <View style={[styles.topAccent, { backgroundColor: colors.tint }]} />}
      {inner}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: 'center' },
  inner: { width: '100%' },
  padded: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  scrollContent: { flexGrow: 1 },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -120,
    width: 240,
    height: 1,
    opacity: 0.35,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 0 48px rgba(0,230,118,0.5)' } as object)
      : {}),
  },
});
