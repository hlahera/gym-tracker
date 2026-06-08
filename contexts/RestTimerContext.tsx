import { createContext, useContext, type ReactNode } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useRestTimer } from '@/hooks/useRestTimer';

type RestTimerContextValue = ReturnType<typeof useRestTimer>;

const RestTimerContext = createContext<RestTimerContextValue | null>(null);

export function RestTimerProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const defaultSeconds = profile?.default_rest_seconds ?? 90;
  const timer = useRestTimer(defaultSeconds);

  return <RestTimerContext.Provider value={timer}>{children}</RestTimerContext.Provider>;
}

export function useRestTimerContext() {
  const ctx = useContext(RestTimerContext);
  if (!ctx) {
    throw new Error('useRestTimerContext debe usarse dentro de RestTimerProvider');
  }
  return ctx;
}
