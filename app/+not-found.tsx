import { Stack, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import Colors from '@/constants/Colors';
import { spacing, typography } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';

export default function NotFoundScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <>
      <Stack.Screen options={{ title: 'No encontrado' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Esta pantalla no existe</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          La ruta que buscas no está disponible en la app.
        </Text>
        <View style={styles.linkWrap}>
          <Button title="Ir al inicio" onPress={() => router.replace('/(tabs)')} />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: { ...typography.title, marginBottom: spacing.sm, textAlign: 'center' },
  subtitle: { ...typography.body, textAlign: 'center', marginBottom: spacing.lg },
  linkWrap: { width: '100%', maxWidth: 280 },
});
