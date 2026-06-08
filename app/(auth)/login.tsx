import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AuthLayout } from '@/components/AuthLayout';
import { Button, Input } from '@/components/ui';
import Colors from '@/constants/Colors';
import { spacing, typography } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!username.trim()) {
      setError('Ingresa tu nombre de usuario');
      return;
    }
    if (!password) {
      setError('Ingresa tu contraseña');
      return;
    }
    setLoading(true);
    const result = await signIn(username.trim(), password);
    setLoading(false);
    if (result.error) setError(result.error);
    else router.replace('/(tabs)');
  };

  return (
    <AuthLayout
      title="Bienvenido"
      subtitle="Tus datos se guardan en este dispositivo"
      footer={
        <Link href="/(auth)/register" asChild>
          <Pressable style={styles.footerLink}>
            <Text style={[styles.footerText, { color: colors.muted }]}>
              ¿No tienes cuenta?{' '}
              <Text style={{ color: colors.tint, fontWeight: '700' }}>Regístrate</Text>
            </Text>
          </Pressable>
        </Link>
      }>
      <Input
        label="Usuario"
        placeholder="tu_usuario"
        autoCapitalize="none"
        autoCorrect={false}
        value={username}
        onChangeText={setUsername}
      />
      <Input
        label="Contraseña"
        placeholder="••••••••"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        error={error ?? undefined}
      />

      <Button title="Entrar" onPress={onSubmit} loading={loading} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  footerLink: { marginTop: spacing.lg, alignItems: 'center' },
  footerText: { ...typography.body, textAlign: 'center' },
});
