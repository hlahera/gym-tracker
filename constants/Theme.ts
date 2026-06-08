import { Platform } from 'react-native';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const layout = {
  maxContentWidth: 680,
  maxAuthWidth: 960,
} as const;

export const typography = {
  hero: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.8 },
  title: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.4 },
  subtitle: { fontSize: 16, fontWeight: '600' as const, letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 23 },
  caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  label: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  stat: { fontSize: 36, fontWeight: '700' as const, letterSpacing: -1.5 },
};

export function shadow(level: 'sm' | 'md' | 'lg', isDark: boolean) {
  if (Platform.OS === 'web') {
    if (isDark) {
      const sizes = {
        sm: '0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.4)',
        md: '0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.5)',
        lg: '0 0 0 1px rgba(0,230,118,0.1), 0 16px 48px rgba(0,0,0,0.6)',
      };
      return { boxShadow: sizes[level] } as const;
    }
    const sizes = {
      sm: '0 1px 3px rgba(0,0,0,0.06)',
      md: '0 4px 16px rgba(0,0,0,0.08)',
      lg: '0 8px 32px rgba(0,0,0,0.12)',
    };
    return { boxShadow: sizes[level] } as const;
  }

  const elevation = { sm: 2, md: 4, lg: 8 }[level];
  return {
    elevation,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: level === 'sm' ? 1 : level === 'md' ? 4 : 8 },
    shadowOpacity: isDark ? 0.35 : 0.1,
    shadowRadius: level === 'sm' ? 3 : level === 'md' ? 8 : 16,
  };
}

export function greenGlow(isDark: boolean) {
  if (Platform.OS === 'web' && isDark) {
    return { boxShadow: '0 0 32px rgba(0, 230, 118, 0.12)' } as const;
  }
  return {};
}
