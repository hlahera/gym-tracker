import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AuthLayout } from '@/components/AuthLayout';
import { Button, Input } from '@/components/ui';
import Colors from '@/constants/Colors';
import { spacing, typography } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!username.trim()) {
      setError('Elige un nombre de usuario');
      return;
    }
    if (username.trim().length < 3) {
      setError('El usuario debe tener al menos 3 caracteres');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    const result = await signUp(username.trim(), password);
    setLoading(false);
    if (result.error) setError(result.error);
    else router.replace('/(tabs)');
  };

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Usuario y contraseña — todo se guarda en este dispositivo"
      footer={
        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.footerLink}>
            <Text style={[styles.footerText, { color: colors.muted }]}>
              ¿Ya tienes cuenta?{' '}
              <Text style={{ color: colors.tint, fontWeight: '700' }}>Entrar</Text>
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
        placeholder="Mínimo 6 caracteres"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        error={error ?? undefined}
      />

      <Button title="Crear cuenta" onPress={onSubmit} loading={loading} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  footerLink: { marginTop: spacing.lg, alignItems: 'center' },
  footerText: { ...typography.body, textAlign: 'center' },
});
