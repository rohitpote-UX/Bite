import { Alert, Platform } from 'react-native';

export const webSafeAlert = (
  title: string,
  message?: string,
  buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>
) => {
  if (Platform.OS === 'web') {
    const msg = message ? `${title}\n\n${message}` : title;
    
    if (buttons && buttons.length > 1) {
      // It's a confirmation dialog (expecting Cancel + Action)
      const confirmed = window.confirm(msg);
      if (confirmed) {
        const confirmBtn = buttons.find(b => b.style !== 'cancel' && b.text.toLowerCase() !== 'cancel');
        if (confirmBtn && confirmBtn.onPress) {
          confirmBtn.onPress();
        }
      } else {
        const cancelBtn = buttons.find(b => b.style === 'cancel' || b.text.toLowerCase() === 'cancel');
        if (cancelBtn && cancelBtn.onPress) {
          cancelBtn.onPress();
        }
      }
    } else {
      // It's just an informational alert
      window.alert(msg);
      if (buttons && buttons.length > 0 && buttons[0].onPress) {
        buttons[0].onPress();
      }
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};
