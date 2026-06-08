import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { InstallPwaCard } from '@/components/InstallPwaCard';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/ui';
import Colors from '@/constants/Colors';
import { spacing, typography } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_INCREMENT } from '@/lib/weight';

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { profile, signOut } = useAuth();
  const increment = profile?.default_weight_increment ?? DEFAULT_INCREMENT.lb;

  return (
    <ScreenContainer>
      <ScreenHeader title="Ajustes" subtitle="Tu cuenta" />

      <Card>
        <Text style={[styles.label, { color: colors.muted }]}>Cuenta</Text>
        <Text style={[styles.value, { color: colors.text }]}>@{profile?.username}</Text>
      </Card>

      <Card variant="accent">
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Carga automática</Text>
        <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
          Cada semana nueva, el peso sugerido de cada ejercicio sube {increment} lb según lo que
          registraste la semana anterior. No tienes que calcular nada.
        </Text>
      </Card>

      <InstallPwaCard />

      <View style={styles.signOutWrap}>
        <Button title="Cerrar sesión" variant="danger" onPress={signOut} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.label, marginBottom: spacing.sm },
  value: { ...typography.subtitle, fontSize: 18 },
  sectionTitle: { ...typography.subtitle, marginBottom: spacing.xs },
  sectionDesc: { ...typography.body },
  signOutWrap: { marginTop: spacing.lg },
});
