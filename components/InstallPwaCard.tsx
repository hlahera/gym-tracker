import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { Button } from '@/components/ui';
import Colors from '@/constants/Colors';
import { spacing, typography } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useInstallPwa } from '@/hooks/useInstallPwa';

export function InstallPwaCard() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { canInstall, install, isInstalled, isOnline, isIos, isWeb } = useInstallPwa();

  if (!isWeb) return null;

  return (
    <Card variant="accent">
      <Text style={[styles.title, { color: colors.text }]}>App sin conexión</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        Tus entrenamientos se guardan en este dispositivo. Tras abrir la app una vez, puedes usarla
        sin internet.
      </Text>

      <View style={[styles.statusRow, { backgroundColor: colors.backgroundElevated }]}>
        <View style={[styles.dot, { backgroundColor: isOnline ? colors.success : colors.warning }]} />
        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
          {isOnline ? 'Conectado' : 'Sin conexión — sigues pudiendo anotar'}
        </Text>
      </View>

      {isInstalled ? (
        <Text style={[styles.hint, { color: colors.muted }]}>Ya está instalada en tu pantalla de inicio.</Text>
      ) : canInstall ? (
        <View style={styles.actionWrap}>
          <Button title="Instalar app" onPress={install} />
        </View>
      ) : isIos ? (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          En Safari: toca Compartir → Añadir a pantalla de inicio.
        </Text>
      ) : (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          En Chrome: menú ⋮ → Instalar app, o Añadir a pantalla de inicio.
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.subtitle, marginBottom: spacing.xs },
  body: { ...typography.body, marginBottom: spacing.md },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    marginBottom: spacing.md,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { ...typography.caption, flex: 1 },
  actionWrap: { marginTop: spacing.xs },
  hint: { ...typography.caption, lineHeight: 18 },
});
