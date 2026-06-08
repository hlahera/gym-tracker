import { Platform, Vibration } from 'react-native';

export function notifyRestComplete() {
  if (Platform.OS === 'web') {
    playWebBeep();
    if (typeof document !== 'undefined') {
      const prev = document.title;
      document.title = '⏱ Descanso terminado';
      setTimeout(() => {
        document.title = prev;
      }, 2000);
    }
    return;
  }

  Vibration.vibrate([0, 400, 150, 400]);
}

function playWebBeep() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new AudioContext();
    const beep = (delay: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.25);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.25);
    };
    beep(0);
    beep(0.35);
  } catch {
    // Sin audio disponible
  }
}
