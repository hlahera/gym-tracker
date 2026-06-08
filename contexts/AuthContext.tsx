import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { initDb } from '@/lib/db/index';
import {
  getProfileById,
  signInLocal,
  signUpLocal,
  touchLastSeen,
} from '@/lib/db/repository';
import type { Profile } from '@/types/database';

const ACTIVE_USER_KEY = 'gym_tracker_active_user';

type AuthContextValue = {
  profile: Profile | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signUp: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const userId = await AsyncStorage.getItem(ACTIVE_USER_KEY);
    if (!userId) {
      setProfile(null);
      return;
    }
    const p = await getProfileById(userId);
    setProfile(p);
  }, []);

  useEffect(() => {
    (async () => {
      await initDb();
      const userId = await AsyncStorage.getItem(ACTIVE_USER_KEY);
      if (userId) {
        const p = await getProfileById(userId);
        setProfile(p);
        if (p) await touchLastSeen(p.id);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!profile?.id) return;
    touchLastSeen(profile.id);
  }, [profile?.id]);

  useEffect(() => {
    const onAppState = (state: AppStateStatus) => {
      if (state === 'active' && profile?.id) {
        touchLastSeen(profile.id);
      }
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, [profile?.id]);

  const signIn = useCallback(async (username: string, password: string) => {
    const { profile: p, error } = await signInLocal(username, password);
    if (error || !p) return { error: error ?? 'Error al iniciar sesión' };
    await AsyncStorage.setItem(ACTIVE_USER_KEY, p.id);
    setProfile(p);
    return { error: null };
  }, []);

  const signUp = useCallback(async (username: string, password: string) => {
    const { profile: p, error } = await signUpLocal(username, password);
    if (error || !p) return { error: error ?? 'Error al registrarse' };
    await AsyncStorage.setItem(ACTIVE_USER_KEY, p.id);
    setProfile(p);
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(ACTIVE_USER_KEY);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({ profile, loading, signIn, signUp, signOut, refreshProfile }),
    [profile, loading, signIn, signUp, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
