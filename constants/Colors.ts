/** Paleta premium: negro, blanco, verde intenso */
const green = '#00E676';
const greenMuted = '#00B35A';
const greenDeep = '#0A2E1F';
const greenGlow = 'rgba(0, 230, 118, 0.15)';

const Colors = {
  light: {
    text: '#0A0A0A',
    textSecondary: '#525252',
    background: '#FAFAFA',
    backgroundElevated: '#FFFFFF',
    card: '#FFFFFF',
    border: '#E5E5E5',
    borderSubtle: '#F0F0F0',
    muted: '#737373',
    success: greenMuted,
    successBg: '#ECFDF5',
    warning: '#CA8A04',
    warningBg: '#FEF9C3',
    danger: '#DC2626',
    dangerBg: '#FEE2E2',
    tint: greenMuted,
    tintBright: green,
    tintMuted: '#ECFDF5',
    tintGlow: greenGlow,
    onTint: '#000000',
    tabIconDefault: '#A3A3A3',
    tabIconSelected: greenMuted,
  },
  dark: {
    text: '#FAFAFA',
    textSecondary: '#A3A3A3',
    background: '#050505',
    backgroundElevated: '#0C0C0C',
    card: '#111111',
    border: '#1F1F1F',
    borderSubtle: '#161616',
    muted: '#666666',
    success: green,
    successBg: greenDeep,
    warning: '#FBBF24',
    warningBg: '#422006',
    danger: '#F87171',
    dangerBg: '#450A0A',
    tint: green,
    tintBright: green,
    tintMuted: greenDeep,
    tintGlow: greenGlow,
    onTint: '#000000',
    tabIconDefault: '#555555',
    tabIconSelected: green,
  },
};

export default Colors;
