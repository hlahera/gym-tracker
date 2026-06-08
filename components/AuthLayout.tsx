import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import Colors from '@/constants/Colors';
import { layout, radius, shadow, spacing, typography } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 768;

  const brandPanel = (
    <View style={[styles.brandPanel, isWide && styles.brandPanelWide]}>
      <View style={[styles.logoMark, { backgroundColor: colors.tint }]}>
        <Text style={[styles.logoText, { color: colors.onTint }]}>GT</Text>
      </View>
      <Text style={[styles.brand, { color: colors.text }]}>Gym Tracker</Text>
      <Text style={[styles.tagline, { color: colors.textSecondary }]}>
        Registra entrenamientos, sube peso cada semana y visualiza tu progreso.
      </Text>
      <View style={styles.features}>
        {['Plantilla mixta', 'Carga progresiva', 'Datos locales'].map((f) => (
          <View key={f} style={styles.featureRow}>
            <View style={[styles.featureDot, { backgroundColor: colors.tint }]} />
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>{f}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const formPanel = (
    <View style={[styles.formPanel, isWide && styles.formPanelWide]}>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
          shadow('md', scheme === 'dark'),
        ]}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        {children}
      </View>
      {footer}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.glow, { backgroundColor: colors.tint }]} />
      <ScrollView
        contentContainerStyle={[styles.scroll, isWide && styles.scrollWide]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={[styles.wrapper, isWide && { maxWidth: layout.maxAuthWidth }]}>
          {isWide ? (
            <View style={styles.splitRow}>
              {brandPanel}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              {formPanel}
            </View>
          ) : (
            <>
              <View style={styles.brandMobile}>{brandPanel}</View>
              {formPanel}
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  glow: {
    position: 'absolute',
    top: -200,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 999,
    opacity: 0.06,
    ...(Platform.OS === 'web' ? { filter: 'blur(100px)' } as object : {}),
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    minHeight: '100%',
    ...(Platform.OS === 'web'
      ? ({
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(0,230,118,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(0,230,118,0.03) 0%, transparent 40%)',
        } as object)
      : {}),
  },
  scrollWide: { alignItems: 'center' },
  wrapper: { width: '100%' },
  splitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxl },
  brandPanel: { marginBottom: spacing.xl },
  brandPanelWide: { flex: 1, marginBottom: 0, paddingRight: spacing.lg },
  brandMobile: { alignItems: 'center', marginBottom: spacing.lg },
  logoMark: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoText: { fontSize: 18, fontWeight: '800' },
  brand: { ...typography.hero, fontSize: 28, marginBottom: spacing.sm },
  tagline: { ...typography.body, fontSize: 15, lineHeight: 24, maxWidth: 340 },
  features: { marginTop: spacing.lg, gap: spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureDot: { width: 6, height: 6, borderRadius: 3 },
  featureText: { ...typography.body, fontSize: 14 },
  divider: { width: 1, alignSelf: 'stretch', marginVertical: spacing.lg },
  formPanel: { width: '100%' },
  formPanelWide: { flex: 1, maxWidth: 400 },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  title: { ...typography.title, marginBottom: spacing.xs },
  subtitle: { ...typography.body, marginBottom: spacing.lg, fontSize: 14 },
});
