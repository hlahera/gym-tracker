import { Modal, Pressable, StyleSheet, Text, View, ViewProps } from 'react-native';

import Colors from '@/constants/Colors';
import { radius, shadow, spacing, typography } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';

type ModalSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  contentStyle?: ViewProps['style'];
};

export function ModalSheet({ visible, title, onClose, children, contentStyle }: ModalSheetProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const isDark = scheme === 'dark';

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar" />
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.card, borderColor: colors.border },
            shadow('lg', isDark),
            contentStyle,
          ]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    maxHeight: '85%',
    zIndex: 1,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typography.title, fontSize: 20, marginBottom: spacing.md },
});
