import { Alert, Platform } from 'react-native';

export function showAlert(title: string, message?: string): Promise<void> {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      window.alert(message ? `${title}\n\n${message}` : title);
      resolve();
      return;
    }
    Alert.alert(title, message, [{ text: 'OK', onPress: () => resolve() }]);
  });
}

export function confirmAlert(title: string, message?: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      resolve(window.confirm(message ? `${title}\n\n${message}` : title));
      return;
    }
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Confirmar', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
